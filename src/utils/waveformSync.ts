import { formatIndonesianSpeechText } from './indonesianPhonetics';

export interface PhoneticWordTiming {
  wordIndex: number;
  rawWord: string;
  startPct: number;
  endPct: number;
}

export interface WavPauseBoundary {
  /** Resume percentage (0..100) right as the next spoken phrase begins. */
  pct: number;
  /** Duration of the silent breath/pause in milliseconds. */
  durationMs: number;
}

export interface WavAudioProfile {
  /** Percentage (0..100) where genuine speech onset begins (trims leading WAV silence). */
  speechStartPct: number;
  /** Percentage (0..100) where genuine speech ends (trims trailing WAV silence). */
  speechEndPct: number;
  /** Detected natural silent pauses inside the spoken body. */
  pauses: WavPauseBoundary[];
}

const ONES_ID = [
  'nol',
  'satu',
  'dua',
  'tiga',
  'empat',
  'lima',
  'enam',
  'tujuh',
  'delapan',
  'sembilan',
];

function indonesianNumberToWords(n: number): string {
  if (!Number.isFinite(n) || n < 0) return String(n);
  if (n < 10) return ONES_ID[n];
  if (n === 10) return 'sepuluh';
  if (n === 11) return 'sebelas';
  if (n < 20) return `${ONES_ID[n - 10]} belas`;
  if (n < 100) {
    const tens = Math.floor(n / 10);
    const rem = n % 10;
    return rem ? `${ONES_ID[tens]} puluh ${ONES_ID[rem]}` : `${ONES_ID[tens]} puluh`;
  }
  if (n < 200) {
    const rem = n % 100;
    return rem ? `seratus ${indonesianNumberToWords(rem)}` : 'seratus';
  }
  if (n < 1000) {
    const hundreds = Math.floor(n / 100);
    const rem = n % 100;
    return rem
      ? `${ONES_ID[hundreds]} ratus ${indonesianNumberToWords(rem)}`
      : `${ONES_ID[hundreds]} ratus`;
  }
  if (n < 2000) {
    const rem = n % 1000;
    return rem ? `seribu ${indonesianNumberToWords(rem)}` : 'seribu';
  }
  if (n < 1_000_000) {
    const thousands = Math.floor(n / 1000);
    const rem = n % 1000;
    return rem
      ? `${indonesianNumberToWords(thousands)} ribu ${indonesianNumberToWords(rem)}`
      : `${indonesianNumberToWords(thousands)} ribu`;
  }
  return String(n);
}

/**
 * Computes realistic spoken duration weight for a single word based on its
 * Indonesian phonetic expansion (acronyms, years, numbers) plus natural
 * breathing pauses at punctuation marks.
 */
export function computeSpokenWordWeight(rawWord: string): number {
  const trailingPunct = rawWord.match(/[.,;:!?]+$/)?.[0] ?? '';
  const stripped = rawWord.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, '');
  const spoken = formatIndonesianSpeechText(stripped || rawWord);

  // Expand remaining integers/years (e.g. 1642, 1889, 1946, 900, 700, 160, 10) into spoken Indonesian words
  const expanded = spoken
    .replace(/\bLGA\b/gi, 'el ge a')
    .replace(/\bCR\b/gi, 'ce er')
    .replace(/\bATX\b/gi, 'a te eks')
    .replace(/\bx16\b/gi, 'kali enam belas')
    .replace(/\bx1\b/gi, 'kali satu')
    .replace(/\bTB\b/g, 'terabyte')
    .replace(/\bGB\b/g, 'gigabyte')
    .replace(/\b(\d{1,3})\.(\d{3})\b/g, (_, a: string, b: string) =>
      indonesianNumberToWords(Number(`${a}${b}`))
    )
    .replace(/\b\d+\b/g, (numStr) => {
      const val = Number(numStr);
      if (numStr === '4004') return 'empat ribu empat';
      if (numStr === '1401') return 'seribu empat ratus satu';
      if (numStr === '9000') return 'sembilan ribu';
      return val <= 999_999 ? indonesianNumberToWords(val) : numStr;
    });

  const baseChars = Math.max(2.3, expanded.replace(/\s+/g, '').length);
  let pauseBonus = 0.72; // natural inter-word micro-gap
  if (/[.!?]/.test(trailingPunct)) {
    pauseBonus += 9.2;
  } else if (/[:;]/.test(trailingPunct)) {
    pauseBonus += 5.4;
  } else if (/,/.test(trailingPunct)) {
    pauseBonus += 3.9;
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

function computeWavProfileFromSampleReader(
  readSample: (index: number) => number,
  totalSamples: number,
  sampleRate: number
): WavAudioProfile | null {
  if (totalSamples < sampleRate * 0.45) return null;

  const winMs = 20;
  const winSamples = Math.max(1, Math.floor((sampleRate * winMs) / 1000));
  const numWindows = Math.floor(totalSamples / winSamples);
  if (numWindows <= 0) return null;

  const rmsArr = new Float32Array(numWindows);
  let maxRms = 0;

  for (let w = 0; w < numWindows; w++) {
    const start = w * winSamples;
    let sumSq = 0;
    for (let i = 0; i < winSamples; i++) {
      const v = readSample(start + i);
      sumSq += v * v;
    }
    const rms = Math.sqrt(sumSq / winSamples);
    rmsArr[w] = rms;
    if (rms > maxRms) maxRms = rms;
  }

  if (maxRms <= 0.001) return null;

  const speechThreshold = maxRms * 0.048;
  const silenceThreshold = maxRms * 0.055;

  let firstSpeechWin = 0;
  for (let w = 0; w < numWindows; w++) {
    if (rmsArr[w] >= speechThreshold) {
      firstSpeechWin = Math.max(0, w - 1);
      break;
    }
  }

  let lastSpeechWin = numWindows - 1;
  for (let w = numWindows - 1; w >= firstSpeechWin; w--) {
    if (rmsArr[w] >= speechThreshold) {
      lastSpeechWin = Math.min(numWindows - 1, w + 1);
      break;
    }
  }

  const speechStartPct = (firstSpeechWin / numWindows) * 100;
  const speechEndPct = Math.max(speechStartPct + 20, ((lastSpeechWin + 1) / numWindows) * 100);

  const minPauseWindows = 6; // >= 120ms
  const pauses: WavPauseBoundary[] = [];
  let runStart = -1;

  for (let w = firstSpeechWin + 2; w <= lastSpeechWin - 2; w++) {
    if (rmsArr[w] < silenceThreshold) {
      if (runStart === -1) runStart = w;
    } else if (runStart !== -1) {
      const runLen = w - runStart;
      if (runLen >= minPauseWindows) {
        const phraseResumePct = ((w - 0.5) / numWindows) * 100;
        pauses.push({
          pct: phraseResumePct,
          durationMs: runLen * winMs,
        });
      }
      runStart = -1;
    }
  }

  return { speechStartPct, speechEndPct, pauses };
}

/**
 * Fast zero-AudioContext analyzer for uncompressed PCM16 RIFF/WAVE buffers (Gemini TTS output).
 * Runs in ~2–4ms with negligible RAM overhead—critical for low-end mobile devices.
 */
function analyzePcmWavBufferFast(arrayBuf: ArrayBuffer): WavAudioProfile | null {
  if (arrayBuf.byteLength < 44) return null;
  const view = new DataView(arrayBuf);
  // Check "RIFF" and "WAVE"
  if (
    view.getUint32(0, false) !== 0x52494646 ||
    view.getUint32(8, false) !== 0x57415645
  ) {
    return null;
  }

  let audioFormat = 0;
  let channels = 0;
  let sampleRate = 0;
  let bitsPerSample = 0;
  let dataOffset = -1;
  let dataBytes = 0;

  let offset = 12;
  while (offset + 8 <= arrayBuf.byteLength) {
    const chunkId = view.getUint32(offset, false);
    const chunkSize = view.getUint32(offset + 4, true);
    const payloadOffset = offset + 8;

    if (chunkId === 0x666d7420 && payloadOffset + 16 <= arrayBuf.byteLength) {
      // "fmt "
      audioFormat = view.getUint16(payloadOffset, true);
      channels = view.getUint16(payloadOffset + 2, true);
      sampleRate = view.getUint32(payloadOffset + 4, true);
      bitsPerSample = view.getUint16(payloadOffset + 14, true);
    } else if (chunkId === 0x64617461) {
      // "data"
      dataOffset = payloadOffset;
      dataBytes = Math.min(chunkSize, arrayBuf.byteLength - payloadOffset);
      break;
    }

    const paddedSize = chunkSize + (chunkSize % 2);
    if (paddedSize <= 0 && chunkSize !== 0) break;
    offset = payloadOffset + paddedSize;
  }

  if (
    audioFormat !== 1 ||
    bitsPerSample !== 16 ||
    channels < 1 ||
    sampleRate < 8000 ||
    dataOffset < 0 ||
    dataBytes < 2
  ) {
    return null;
  }

  const bytesPerFrame = channels * 2;
  const totalSamples = Math.floor(dataBytes / bytesPerFrame);

  if (channels === 1 && dataOffset % 2 === 0) {
    const int16 = new Int16Array(arrayBuf, dataOffset, totalSamples);
    return computeWavProfileFromSampleReader(
      (i) => int16[i] / 32768,
      totalSamples,
      sampleRate
    );
  }

  return computeWavProfileFromSampleReader(
    (i) => view.getInt16(dataOffset + i * bytesPerFrame, true) / 32768,
    totalSamples,
    sampleRate
  );
}

/**
 * Analyzes a Gemini TTS WAV blob in the browser (0 extra API tokens) and measures:
 * 1) Exact speech onset & ending (`speechStartPct`..`speechEndPct`) to trim leading/trailing silence.
 * 2) Every natural silent breath/sentence pause with its millisecond duration.
 */
export async function analyzeWavAudioProfile(wavBlob: Blob): Promise<WavAudioProfile | null> {
  if (typeof window === 'undefined') return null;

  let arrayBuf: ArrayBuffer;
  try {
    arrayBuf = await wavBlob.arrayBuffer();
  } catch {
    return null;
  }

  // Zero-AudioContext fast path for standard PCM16 WAV (Gemini TTS output)
  const fastProfile = analyzePcmWavBufferFast(arrayBuf);
  if (fastProfile) return fastProfile;

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioCtx) return null;

  let ctx: AudioContext | null = null;
  try {
    ctx = new AudioCtx();
    const audioBuffer = await ctx.decodeAudioData(arrayBuf.slice(0));
    const channel = audioBuffer.getChannelData(0);
    return computeWavProfileFromSampleReader(
      (i) => channel[i],
      channel.length,
      audioBuffer.sampleRate
    );
  } catch {
    return null;
  } finally {
    if (ctx) {
      void ctx.close().catch(() => {});
    }
  }
}

/**
 * Backward-compatible helper returning only pause percentages.
 */
export async function detectWavPauseBoundaries(wavBlob: Blob): Promise<number[]> {
  const profile = await analyzeWavAudioProfile(wavBlob);
  return profile ? profile.pauses.map((p) => p.pct) : [];
}

/**
 * Aligns a phonetic word timeline to genuine WAV speech onset, ending, sentence pauses
 * (`.`, `!`, `?`), AND internal clause breaks (`,`, `;`, `:`) so spoken words, subtitles,
 * and 3D camera cues remain tightly locked across long multi-clause sentences.
 */
export function alignTimelineToWavProfile(
  baseTimeline: PhoneticWordTiming[],
  profile: WavAudioProfile | null
): PhoneticWordTiming[] {
  if (!baseTimeline.length || !profile) return baseTimeline;

  const span = Math.max(10, profile.speechEndPct - profile.speechStartPct);
  const toTrimmedPct = (rawPct: number) =>
    profile.speechStartPct + (Math.max(0, Math.min(100, rawPct)) / 100) * span;

  // Step 1: Identify sentence start boundaries (`.`, `!`, `?`) and clause start boundaries (`,`, `;`, `:`)
  const sentenceAnchorsBase: number[] = [];
  const clauseAnchorsBase: number[] = [];
  for (let i = 0; i < baseTimeline.length - 1; i++) {
    const raw = baseTimeline[i].rawWord;
    if (/[.!?]["')]*$/.test(raw)) {
      sentenceAnchorsBase.push(baseTimeline[i + 1].startPct);
    } else if (/[,;:]["')]*$/.test(raw)) {
      clauseAnchorsBase.push(baseTimeline[i + 1].startPct);
    }
  }

  // Step 2 (Pass 1): Match sentence boundaries monotonically to nearby genuine WAV breath pauses
  const sentenceAnchors: Array<{ base: number; snapped: number }> = [
    { base: 0, snapped: profile.speechStartPct },
  ];

  const candidatePauses = profile.pauses;
  let prevSnapped = profile.speechStartPct;

  for (const basePct of sentenceAnchorsBase) {
    const expectedPct = toTrimmedPct(basePct);
    const maxWindow = 7.5;
    let bestPct: number | null = null;
    let bestScore = Number.POSITIVE_INFINITY;

    for (const pause of candidatePauses) {
      if (pause.pct <= prevSnapped + 1.0 || pause.pct >= profile.speechEndPct - 1.0) continue;
      const dist = Math.abs(pause.pct - expectedPct);
      if (dist > maxWindow) continue;
      const pauseStrengthBonus = Math.min(2.6, pause.durationMs / 220);
      const score = dist - pauseStrengthBonus * 0.5;
      if (score < bestScore) {
        bestScore = score;
        bestPct = pause.pct;
      }
    }

    if (bestPct !== null) {
      sentenceAnchors.push({ base: basePct, snapped: bestPct });
      prevSnapped = bestPct;
    }
  }

  sentenceAnchors.push({ base: 100, snapped: profile.speechEndPct });

  // Step 3 (Pass 2): Within each anchored sentence span, snap comma/colon clause breaks to remaining WAV pauses
  const anchors: Array<{ base: number; snapped: number }> = [sentenceAnchors[0]];

  for (let s = 0; s < sentenceAnchors.length - 1; s++) {
    const left = sentenceAnchors[s];
    const right = sentenceAnchors[s + 1];
    let localPrevSnapped = left.snapped;

    const innerClauses = clauseAnchorsBase.filter(
      (b) => b > left.base + 1.5 && b < right.base - 1.5
    );

    const baseSpan = Math.max(0.001, right.base - left.base);
    const snappedSpan = right.snapped - left.snapped;

    for (const clauseBase of innerClauses) {
      const t = (clauseBase - left.base) / baseSpan;
      const expectedPct = left.snapped + snappedSpan * t;
      const maxClauseWindow = 3.8;
      let bestClausePct: number | null = null;
      let bestDist = maxClauseWindow;

      for (const pause of candidatePauses) {
        if (pause.pct <= localPrevSnapped + 0.8 || pause.pct >= right.snapped - 0.8) continue;
        const dist = Math.abs(pause.pct - expectedPct);
        if (dist < bestDist) {
          bestDist = dist;
          bestClausePct = pause.pct;
        }
      }

      if (bestClausePct !== null) {
        anchors.push({ base: clauseBase, snapped: bestClausePct });
        localPrevSnapped = bestClausePct;
      }
    }

    anchors.push(right);
  }

  const mapPct = (rawPct: number): number => {
    const clamped = Math.max(0, Math.min(100, rawPct));
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      if (clamped <= b.base || i === anchors.length - 2) {
        const segSpan = Math.max(0.0001, b.base - a.base);
        const t = Math.max(0, Math.min(1, (clamped - a.base) / segSpan));
        return a.snapped + (b.snapped - a.snapped) * t;
      }
    }
    return toTrimmedPct(clamped);
  };

  return baseTimeline.map((entry, idx) => ({
    ...entry,
    startPct: idx === 0 ? profile.speechStartPct : mapPct(entry.startPct),
    endPct: idx === baseTimeline.length - 1 ? profile.speechEndPct : mapPct(entry.endPct),
  }));
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

/**
 * Piecewise-warps a phonetic word timeline (0..100%) using matched base -> snapped
 * WAV keyframe boundaries so subtitles and 3D director cues stay 100% locked together.
 */
export function warpWordTimelineToKeyframes(
  timeline: PhoneticWordTiming[],
  basePcts: number[],
  snappedPcts: number[]
): PhoneticWordTiming[] {
  if (
    timeline.length === 0 ||
    basePcts.length === 0 ||
    basePcts.length !== snappedPcts.length
  ) {
    return timeline;
  }

  const anchors: Array<{ base: number; snapped: number }> = [{ base: 0, snapped: 0 }];
  for (let i = 0; i < basePcts.length; i++) {
    const b = basePcts[i];
    const s = snappedPcts[i];
    const prev = anchors[anchors.length - 1];
    if (b > prev.base + 0.05 && b < 99.9 && s > prev.snapped + 0.05 && s < 99.9) {
      anchors.push({ base: b, snapped: s });
    }
  }
  anchors.push({ base: 100, snapped: 100 });

  const mapPct = (rawPct: number): number => {
    const clamped = Math.max(0, Math.min(100, rawPct));
    for (let i = 0; i < anchors.length - 1; i++) {
      const a = anchors[i];
      const b = anchors[i + 1];
      if (clamped <= b.base || i === anchors.length - 2) {
        const span = Math.max(0.0001, b.base - a.base);
        const t = Math.max(0, Math.min(1, (clamped - a.base) / span));
        return a.snapped + (b.snapped - a.snapped) * t;
      }
    }
    return clamped;
  };

  return timeline.map((entry, idx) => ({
    ...entry,
    startPct: idx === 0 ? 0 : mapPct(entry.startPct),
    endPct: idx === timeline.length - 1 ? 100 : mapPct(entry.endPct),
  }));
}

/**
 * Finds the active global word index inside a (possibly WAV-aligned) phonetic timeline.
 */
export function findWordIndexInTimeline(
  timeline: PhoneticWordTiming[],
  progressPct: number
): number | null {
  if (!timeline.length) return null;
  const clamped = Math.max(0, Math.min(100, progressPct));
  for (let i = 0; i < timeline.length; i++) {
    if (clamped <= timeline[i].endPct) {
      return timeline[i].wordIndex;
    }
  }
  return timeline[timeline.length - 1].wordIndex;
}
