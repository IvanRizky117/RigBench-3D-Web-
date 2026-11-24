import { computeSpokenWordWeight } from './waveformSync';

export interface SubtitleCue {
  id: string;
  index: number;
  text: string;
  words: string[];
  startWordIndex: number;
  endWordIndex: number; // inclusive
  startCharIndex: number;
  endCharIndex: number; // exclusive
  startPct: number; // 0..100
  endPct: number; // 0..100
}

const MAX_CUE_CHARS = 66;
const MIN_CUE_CHARS = 24;

/**
 * Splits a full lecture narration paragraph into crisp, broadcast-grade single-line
 * subtitle cues synchronized to both character/word indices and percentage timeline.
 */
export function buildSubtitleCues(narration: string): SubtitleCue[] {
  const cleaned = narration.replace(/\s+/g, ' ').trim();
  if (!cleaned) return [];

  // First split by natural clause punctuation while preserving punctuation on the preceding phrase
  const clauses = cleaned
    .split(/(?<=[.,;:!?])\s+/)
    .map((c) => c.trim())
    .filter(Boolean);

  const rawLines: string[] = [];

  for (const clause of clauses) {
    if (clause.length <= MAX_CUE_CHARS) {
      // Merge tiny trailing fragments with previous line if combined stays crisp
      if (
        rawLines.length > 0 &&
        clause.length < MIN_CUE_CHARS &&
        rawLines[rawLines.length - 1].length + 1 + clause.length <= MAX_CUE_CHARS + 6
      ) {
        rawLines[rawLines.length - 1] = `${rawLines[rawLines.length - 1]} ${clause}`;
      } else {
        rawLines.push(clause);
      }
      continue;
    }

    // Wrap long clauses evenly by word count so every single-line cue has balanced rhythm
    const words = clause.split(' ');
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (candidate.length > MAX_CUE_CHARS && current.length >= MIN_CUE_CHARS) {
        rawLines.push(current);
        current = word;
      } else {
        current = candidate;
      }
    }
    if (current) {
      if (
        rawLines.length > 0 &&
        current.length < 18 &&
        rawLines[rawLines.length - 1].length + 1 + current.length <= MAX_CUE_CHARS + 10
      ) {
        rawLines[rawLines.length - 1] = `${rawLines[rawLines.length - 1]} ${current}`;
      } else {
        rawLines.push(current);
      }
    }
  }

  const lineEntries = rawLines.map((line) => {
    const words = line.split(' ').filter(Boolean);
    const spokenWeight = Math.max(
      1,
      words.reduce((sum, w) => sum + computeSpokenWordWeight(w), 0)
    );
    return { line, words, spokenWeight };
  });

  // Compute phonetic spoken weights so seeking and boundary percentages match spoken duration
  const totalWeight = Math.max(
    1,
    lineEntries.reduce((sum, item) => sum + item.spokenWeight, 0)
  );
  let cursorWord = 0;
  let cursorChar = 0;
  let accWeight = 0;

  return lineEntries.map(({ line, words, spokenWeight }, index) => {
    const startWordIndex = cursorWord;
    const endWordIndex = cursorWord + Math.max(0, words.length - 1);
    const startCharIndex = cursorChar;
    const endCharIndex = cursorChar + line.length;

    const startPct = (accWeight / totalWeight) * 100;
    accWeight += spokenWeight;
    const endPct = index === lineEntries.length - 1 ? 100 : (accWeight / totalWeight) * 100;

    cursorWord += words.length;
    cursorChar += line.length + 1;

    return {
      id: `cue-${index}`,
      index,
      text: line,
      words,
      startWordIndex,
      endWordIndex,
      startCharIndex,
      endCharIndex,
      startPct,
      endPct,
    };
  });
}

export function findActiveCue(
  cues: SubtitleCue[],
  progress: number,
  activeWordIndex: number | null
): SubtitleCue | null {
  if (!cues.length) return null;

  if (activeWordIndex !== null && activeWordIndex >= 0) {
    const byWord = cues.find(
      (cue) => activeWordIndex >= cue.startWordIndex && activeWordIndex <= cue.endWordIndex
    );
    if (byWord) return byWord;
  }

  const clamped = Math.max(0, Math.min(100, progress));
  const byPct = cues.find((cue) => clamped >= cue.startPct && clamped < cue.endPct);
  return byPct ?? cues[cues.length - 1];
}

/**
 * Estimates relative spoken weight of a word using Indonesian phonetic expansion
 * so local Web Speech fallback and silent-clock pacing match real spoken syllables.
 */
export function getWordSpeechWeight(word: string): number {
  return computeSpokenWordWeight(word);
}

export interface CueSpeechMetrics {
  totalWeight: number;
  wordEndFractions: number[]; // cumulative 0..1 end fraction per word in cue
}

export function computeCueSpeechMetrics(words: string[]): CueSpeechMetrics {
  if (!words.length) {
    return { totalWeight: 1, wordEndFractions: [] };
  }
  const weights = words.map(getWordSpeechWeight);
  const totalWeight = Math.max(
    1,
    weights.reduce((sum, w) => sum + w, 0)
  );
  let acc = 0;
  const wordEndFractions = weights.map((w) => {
    acc += w;
    return acc / totalWeight;
  });
  return { totalWeight, wordEndFractions };
}
