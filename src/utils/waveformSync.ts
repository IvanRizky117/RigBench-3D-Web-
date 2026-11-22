import { formatIndonesianSpeechText } from './indonesianPhonetics';

export interface PhoneticWordTiming {
  wordIndex: number;
  rawWord: string;
  startPct: number;
  endPct: number;
}

/**
 * Computes realistic spoken duration weight for a single word based on its
 * Indonesian phonetic expansion (e.g. "LGA 775", "ATX 24-pin", "CR2032")
 * plus natural breathing pauses at punctuation marks.
 */
export function computeSpokenWordWeight(rawWord: string): number {
  const trailingPunct = rawWord.match(/[.,;:!?]+$/)?.[0] ?? '';
  const stripped = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const spoken = formatIndonesianSpeechText(stripped || rawWord);
  // Count phonetic letters/digits; digits that remain get expanded approximation
  const expanded = spoken
    .replace(/\b775\b/g, 'tujuh tujuh lima')
    .replace(/\b2032\b/g, 'dua nol tiga dua')
    .replace(/\b1985\b/g, 'seribu sembilan ratus delapan puluh lima')
    .replace(/\b1989\b/g, 'seribu sembilan ratus delapan puluh sembilan')
    .replace(/\b1991\b/g, 'seribu sembilan ratus sembilan puluh satu')
    .replace(/\b2000\b/g, 'dua ribu')
    .replace(/\b2007\b/g, 'dua ribu tujuh')
    .replace(/\b2010\b/g, 'dua ribu sepuluh')
    .replace(/\b2011\b/g, 'dua ribu sebelas')
    .replace(/\b1000\b/g, 'seribu')
    .replace(/\b1100\b/g, 'seribu seratus')
    .replace(/\b900\b/g, 'sembilan ratus')
    .replace(/\b103\b/g, 'satu nol tiga')
    .replace(/\b128\b/g, 'seratus dua puluh delapan')
    .replace(/\b40\b/g, 'empat puluh')
    .replace(/\b34\b/g, 'tiga puluh empat')
    .replace(/\b25\b/g, 'dua puluh lima')
    .replace(/\b24\b/g, 'dua puluh empat')
    .replace(/\b16\b/g, 'enam belas')
    .replace(/\b15\b/g, 'lima belas')
    .replace(/\b10\b/g, 'sepuluh')
    .replace(/\bLGA\b/gi, 'el ge a')
    .replace(/\bCR\b/gi, 'ce er')
    .replace(/\bATX\b/gi, 'a te eks')
    .replace(/\bx16\b/gi, 'kali enam belas')
    .replace(/\bx1\b/gi, 'kali satu')
    .replace(/\bTB\b/g, 'terabyte')
    .replace(/\bGB\b/g, 'gigabyte');

  const baseChars = Math.max(2.4, expanded.replace(/\s+/g, '').length);
  let pauseBonus = 0.7; // natural inter-word micro-gap
  if (/[.!?]/.test(trailingPunct)) {
    pauseBonus += 8.8;
  } else if (/[:;]/.test(trailingPunct)) {
    pauseBonus += 5.5;
  } else if (/,/.test(trailingPunct)) {
    pauseBonus += 3.8;
  }
  return baseChars + pauseBonus;
}

/**
 * Builds an accurate phonetic-weighted timeline (0..100%) for every word in a narration.
 * Shared by both TTS subtitle word-sync and 3D camera phrase anchoring.
 */
export function buildPhoneticWordTimeline(narration: string): PhoneticWordTiming[] {
  const words = narration.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  if (!words.length) return [];

  const weights = words.map(computeSpokenWordWeight);
  const totalWeight = Math.max(
    1,
    weights.reduce((sum, w) => sum + w, 0)
  );

  let acc = 0;
  return words.map((rawWord, wordIndex) => {
    const startPct = (acc / totalWeight) * 100;
    acc += weights[wordIndex];
    const endPct = wordIndex === words.length - 1 ? 100 : (acc / totalWeight) * 100;
    return { wordIndex, rawWord, startPct, endPct };
  });
}

function normalizeWordToken(token: string): string {
  return token
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]/gu, '');
}

/**
 * Finds the exact word index where a trigger phrase starts inside the narration.
 */
export function findPhraseStartWordIndex(
  narration: string,
  triggerPhrase: string,
  minWordIndex = 0
): number {
  const rawWords = narration.replace(/\s+/g, ' ').trim().split(' ').filter(Boolean);
  const normWords = rawWords.map(normalizeWordToken);
  const phraseTokens = triggerPhrase
    .replace(/\s+/g, ' ')
    .trim()
    .split(' ')
    .map(normalizeWordToken)
    .filter(Boolean);

  if (!phraseTokens.length || !rawWords.length) return Math.max(0, minWordIndex);

  for (let i = Math.max(0, minWordIndex); i <= normWords.length - phraseTokens.length; i++) {
    let matched = true;
    for (let j = 0; j < phraseTokens.length; j++) {
      const target = phraseTokens[j];
      const candidate = normWords[i + j] ?? '';
      if (candidate !== target && !candidate.includes(target)) {
        matched = false;
        break;
      }
    }
    if (matched) return i;
  }

  return Math.max(0, minWordIndex);
}

/**
 * Decodes a Gemini TTS WAV blob in the browser (0 extra API tokens) and detects
 * natural silence/breath pauses (in 0..100% timeline units) so keyframe transitions
 * snap directly onto the real spoken sentence/phrase boundaries.
 */
export async function detectWavPauseBoundaries(wavBlob: Blob): Promise<number[]> {
  if (typeof window === 'undefined') return [];
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return [];

  let ctx: AudioContext | null = null;
  try {
    const arrayBuf = await wavBlob.arrayBuffer();
    ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
    const channel = audioBuffer.getChannelData(0);
    const sampleRate = audioBuffer.sampleRate;
    const totalSamples = channel.length;
    if (totalSamples < sampleRate * 0.5) return [];

    // Compute RMS energy in 20ms windows
    const winSamples = Math.max(1, Math.floor(sampleRate * 0.02));
    const numWindows = Math.floor(totalSamples / winSamples);
    const rmsArr = new Float32Array(numWindows);
    let maxRms = 0;

    for (let w = 0; w < numWindows; w++) {
      const start = w * winSamples;
      let sumSq = 0;
      for (let i = 0; i < winSamples; i++) {
        const v = channel[start + i];
        sumSq += v * v;
      }
      const rms = Math.sqrt(sumSq / winSamples);
      rmsArr[w] = rms;
      if (rms > maxRms) maxRms = rms;
    }

    if (maxRms <= 0.001) return [];

    // Silence threshold ~5.5% of peak speech RMS, minimum 140ms (7 windows)
    const silenceThreshold = maxRms * 0.055;
    const minPauseWindows = 7;
    const pauses: number[] = [];

    let runStart = -1;
    for (let w = 0; w < numWindows; w++) {
      if (rmsArr[w] < silenceThreshold) {
        if (runStart === -1) runStart = w;
      } else if (runStart !== -1) {
        const runLen = w - runStart;
        if (runLen >= minPauseWindows && runStart > 3 && w < numWindows - 3) {
          // Use end of pause (right as next spoken phrase begins!)
          const phraseResumePct = ((w - 1) / numWindows) * 100;
          pauses.push(phraseResumePct);
        }
        runStart = -1;
      }
    }

    return pauses;
  } catch {
    return [];
  } finally {
    if (ctx) {
      void ctx.close().catch(() => {});
    }
  }
}

/**
 * Snaps phonetic-estimated keyframe start percentages to the nearest real acoustic
 * pause boundary in the WAV waveform while preserving strict monotonic ordering.
 */
export function snapKeyframePctsToWaveform(
  basePcts: number[],
  wavPausePcts: number[],
  maxSnapWindowPct = 4.2
): number[] {
  if (!basePcts.length || !wavPausePcts.length) return basePcts;

  const snapped: number[] = [];
  let prevPct = 0;

  for (let i = 0; i < basePcts.length; i++) {
    const base = basePcts[i];
    if (i === 0 || base <= 1.5) {
      snapped.push(0);
      prevPct = 0;
      continue;
    }

    let best = base;
    let bestDist = maxSnapWindowPct;
    for (const pausePct of wavPausePcts) {
      const dist = Math.abs(pausePct - base);
      if (dist < bestDist && pausePct > prevPct + 1.2) {
        bestDist = dist;
        best = pausePct;
      }
    }

    const finalVal = Math.max(prevPct + 1.0, Math.min(98.5, best));
    snapped.push(finalVal);
    prevPct = finalVal;
  }

  return snapped;
}
