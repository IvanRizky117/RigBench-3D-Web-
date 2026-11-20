import type {
  AbcEvaluationResult,
  AbcQuestion,
  EssayEvaluationResult,
  EssayQuestion,
  ExamAttemptSummary,
  RubricCriterionResult,
} from '../types/rigbench';
import { MAX_ESSAY_CHARS, sanitizeUserText } from './inputSanitizer';

/**
 * Local 100% Browser-Side Smart Deterministic Rubric Analyzer (Zero AI API Calls).
 * Evaluates free-form Indonesian student answers against technical domain concepts using:
 * 1) Anti-XSS input sanitization & length bounds
 * 2) Expanded PC architecture / HW-SW / OS / EULA synonym graph
 * 3) Indonesian morphological stemming & normalized phrase matching
 * 4) Typo-tolerant Levenshtein matching (distance <= 1 for >= 5 char technical terms)
 * 5) Concept-group coverage scoring with anti-spam repetition guard
 */

const SYNONYM_MAP: Record<string, string[]> = {
  tegangan: ['voltase', 'volt', 'daya', 'listrik', 'arus', 'voltage'],
  memori: ['memory', 'ram', 'dimm', 'simm'],
  prosesor: ['processor', 'cpu', 'procie', 'mikroprosesor'],
  motherboard: ['mainboard', 'mobo', 'papan induk', 'board'],
  grafis: ['vga', 'gpu', 'display', 'kartu grafis', 'video card'],
  sementara: ['volatile', 'hilang', 'tidak permanen'],
  permanen: ['non-volatile', 'nonvolatile', 'tetap', 'tidak hilang'],
  menggelembung: ['gelembung', 'kembung', 'bengkak', 'bocor', 'meledak', 'pecah', 'rusak fisik'],
  penghapus: ['karet', 'eraser', 'stipo karet', 'penghapus pensil'],
  jumper: ['hubungkan', 'sambungkan', 'shortkan', 'konsletkan', 'jepit', 'korsletkan', 'shunt'],
  cadangan: ['backup', 'salinan', 'redundansi', 'duplikat', 'copy cadangan'],
  perizinan: ['izin', 'lisensi', 'hak pakai', 'hak izin pakai', 'permission', 'kontrak hukum'],
  pembajakan: ['bajakan', 'crack', 'ilegal', 'palsu', 'piracy', 'tidak resmi', 'non original'],
  enkripsi: ['encrypt', 'sandi', 'kunci', 'pengamanan data'],
  terhapus: ['hilang', 'hapus', 'korup', 'rusak'],
  periferal: ['peripheral', 'perangkat luar', 'perangkat tambahan', 'io', 'i/o'],
  pembaruan: ['update', 'patch resmi', 'perbaikan', 'security update', 'pembaruan keamanan'],
  harddisk: ['hdd', 'hard drive', 'cakram keras', 'penyimpanan', 'storage', 'disk'],
  kapasitor: ['elco', 'elko', 'kondensator', 'capacitor'],
  korslet: ['short', 'konslet', 'hubungan singkat', 'arus pendek'],
  kipas: ['fan', 'pendingin', 'cooler', 'heatsink fan'],
  cepat: ['kecepatan tinggi', 'high speed', 'berkecepatan tinggi', 'kencang'],
  lambat: ['kecepatan rendah', 'low speed', 'berkecepatan rendah', 'lemot'],
  partisi: ['partition', 'volume', 'drive'],
  kecilkan: ['shrink', 'mengecilkan', 'ciutkan', 'potong kapasitas'],
  bios: ['rom bios', 'cmos', 'firmware', 'legacy bios'],
  uefi: ['unified efi', 'efi'],
  malware: ['virus', 'trojan', 'spyware', 'ransomware', 'keylogger', 'backdoor', 'program jahat'],
  sanksi: ['hukuman', 'pidana', 'perdata', 'denda', 'hukum', 'uu hak cipta'],
  telemetri: ['data pribadi', 'pelacakan', 'tracking', 'pengumpulan data', 'privasi'],
  stabilizer: ['stavolt', 'avr', 'penstabil tegangan', 'penstabil voltase'],
  ups: ['baterai cadangan', 'cadangan listrik', 'backup daya', 'anti mati lampu'],
  grounding: ['ground', 'gnd', 'pentanahan', 'tegangan bocor', 'netralisir'],
  overheat: ['panas berlebih', 'kepanasan', 'suhu tinggi', 'terlalu panas'],
  bersihkan: ['gosok', 'lap', 'pembersihan', 'membersihkan'],
  lepas: ['cabut', 'copot', 'bongkar', 'melepas'],
};

const STOP_WORDS = new Set([
  'yang',
  'dan',
  'di',
  'ke',
  'dari',
  'pada',
  'untuk',
  'dengan',
  'atau',
  'adalah',
  'yaitu',
  'itu',
  'ini',
  'akan',
  'agar',
  'bisa',
  'dapat',
  'jika',
  'bila',
  'lalu',
  'serta',
  'seperti',
  'dalam',
  'oleh',
  'juga',
  'saat',
  'ketika',
]);

interface AnswerSearchIndex {
  normalized: string;
  rawTokens: string[];
  meaningfulTokens: string[];
  stemmedTokens: Set<string>;
  uniqueMeaningfulCount: number;
}

function normalizeText(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/[.,;:!?()[\]{}"'“”‘’]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function lightStemToken(token: string): string {
  if (token.length <= 4) return token;
  let stemmed = token;
  stemmed = stemmed.replace(/(nya|lah|kah|pun)$/, '');
  if (stemmed.length > 5) {
    stemmed = stemmed.replace(/(kan|an|i)$/, '');
  }
  if (stemmed.length > 5) {
    stemmed = stemmed.replace(/^(meng|meny|mem|men|me|peng|peny|pem|pen|ber|ter|di|ke|se)/, '');
  }
  return stemmed.length >= 3 ? stemmed : token;
}

function levenshteinWithinOne(a: string, b: string): boolean {
  if (a === b) return true;
  const lenA = a.length;
  const lenB = b.length;
  if (Math.abs(lenA - lenB) > 1) return false;

  let i = 0;
  let j = 0;
  let edits = 0;

  while (i < lenA && j < lenB) {
    if (a[i] === b[j]) {
      i += 1;
      j += 1;
    } else {
      edits += 1;
      if (edits > 1) return false;
      if (lenA > lenB) {
        i += 1;
      } else if (lenB > lenA) {
        j += 1;
      } else {
        i += 1;
        j += 1;
      }
    }
  }

  if (i < lenA || j < lenB) edits += 1;
  return edits <= 1;
}

function buildSearchIndex(rawAnswer: string): AnswerSearchIndex {
  const sanitized = sanitizeUserText(rawAnswer, MAX_ESSAY_CHARS, true).value;
  const normalized = normalizeText(sanitized);
  const rawTokens = normalized.split(' ').filter(Boolean);
  const stemmedTokens = new Set<string>();
  const meaningfulUnique = new Set<string>();

  for (const token of rawTokens) {
    const stem = lightStemToken(token);
    stemmedTokens.add(token);
    stemmedTokens.add(stem);
    if (!STOP_WORDS.has(token) && token.length >= 2) {
      meaningfulUnique.add(stem);
    }
  }

  return {
    normalized,
    rawTokens,
    meaningfulTokens: rawTokens.filter((t) => !STOP_WORDS.has(t)),
    stemmedTokens,
    uniqueMeaningfulCount: meaningfulUnique.size,
  };
}

function expandPhraseVariants(phrase: string): string[] {
  const norm = normalizeText(phrase);
  const variants = new Set<string>([norm]);

  for (const [root, syns] of Object.entries(SYNONYM_MAP)) {
    if (norm === root || syns.includes(norm)) {
      variants.add(root);
      syns.forEach((s) => variants.add(s));
    }
  }
  return Array.from(variants);
}

function matchSingleToken(target: string, index: AnswerSearchIndex): number {
  const targetStem = lightStemToken(target);

  if (index.stemmedTokens.has(target) || index.stemmedTokens.has(targetStem)) {
    return 1.0;
  }

  // Substring stem check for compound Indonesian words (e.g., "gelembung" in "menggelembung")
  if (targetStem.length >= 4) {
    for (const tok of index.stemmedTokens) {
      if (tok.includes(targetStem)) return 0.95;
    }
  }

  // Typo-tolerant fuzzy check (Levenshtein <= 1) only for longer technical terms (>= 5 chars)
  if (target.length >= 5) {
    for (const tok of index.rawTokens) {
      if (tok.length >= 4 && levenshteinWithinOne(target, tok)) {
        return 0.88;
      }
    }
  }

  return 0;
}

/**
 * Returns match confidence in [0..1] for a rubric candidate phrase against student answer.
 */
function scorePhraseInIndex(phrase: string, index: AnswerSearchIndex): number {
  const variants = expandPhraseVariants(phrase);
  let bestConfidence = 0;

  for (const variant of variants) {
    if (!variant) continue;

    // Tier 1: Direct normalized phrase match (ideal for multi-word phrases, numbers, units like "2 tb", "+5vsb")
    if (index.normalized.includes(variant)) {
      return 1.0;
    }

    const parts = variant.split(' ').filter((p) => p && !STOP_WORDS.has(p));
    if (parts.length === 0) continue;

    if (parts.length === 1) {
      const tokenConf = matchSingleToken(parts[0], index);
      if (tokenConf > bestConfidence) bestConfidence = tokenConf;
    } else if (parts.length <= 4) {
      let sumConf = 0;
      let allMatched = true;
      for (const p of parts) {
        const partConf = index.normalized.includes(p) ? 1.0 : matchSingleToken(p, index);
        if (partConf <= 0) {
          allMatched = false;
          break;
        }
        sumConf += partConf;
      }
      if (allMatched) {
        const phraseConf = (sumConf / parts.length) * 0.96;
        if (phraseConf > bestConfidence) bestConfidence = phraseConf;
      }
    }
  }

  return bestConfidence;
}

export function evaluateEssayAnswer(
  question: EssayQuestion,
  userAnswer: string
): EssayEvaluationResult {
  const sanitized = sanitizeUserText(userAnswer, MAX_ESSAY_CHARS, true).value.trim();
  const maxPoints = question.rubric.reduce((sum, c) => sum + c.weight, 0);

  if (!sanitized || sanitized.length < 3) {
    return {
      questionId: question.id,
      scorePercent: 0,
      earnedPoints: 0,
      maxPoints,
      criteriaResults: question.rubric.map((c) => ({
        criterionId: c.id,
        label: c.label,
        weight: c.weight,
        earnedWeight: 0,
        matched: false,
        matchedTerms: [],
      })),
    };
  }

  const index = buildSearchIndex(sanitized);

  // Anti-spam check: heavily repetitive single-word stuffing gets penalized smoothly
  const isRepetitiveSpam =
    index.rawTokens.length >= 12 &&
    index.uniqueMeaningfulCount / Math.max(1, index.rawTokens.length) < 0.18;

  let totalEarned = 0;

  const criteriaResults: RubricCriterionResult[] = question.rubric.map((criterion) => {
    let weightedGroupHits = 0;
    let rawGroupHits = 0;
    const matchedTerms: string[] = [];

    for (const group of criterion.conceptGroups) {
      let bestTerm: string | null = null;
      let bestConf = 0;

      for (const candidate of group) {
        const conf = scorePhraseInIndex(candidate, index);
        if (conf > bestConf) {
          bestConf = conf;
          bestTerm = candidate;
        }
        if (bestConf >= 1.0) break;
      }

      if (bestTerm && bestConf >= 0.85) {
        rawGroupHits += 1;
        weightedGroupHits += bestConf;
        matchedTerms.push(bestTerm);
      }
    }

    const isFullMatch = rawGroupHits >= criterion.minGroupHits;
    const isPartialMatch = !isFullMatch && rawGroupHits > 0 && criterion.minGroupHits >= 2;

    let earnedWeight = 0;
    if (isFullMatch) {
      const avgConfidence = Math.min(1, weightedGroupHits / Math.max(1, rawGroupHits));
      // Full concept hit gives 100% weight when exact/synonym, or ~92%+ when typo-fuzzy
      earnedWeight =
        avgConfidence >= 0.94
          ? criterion.weight
          : Math.max(1, Math.round(criterion.weight * avgConfidence));
    } else if (isPartialMatch) {
      const ratio = Math.min(0.9, weightedGroupHits / Math.max(1, criterion.minGroupHits));
      earnedWeight = Math.round(criterion.weight * ratio * 0.72);
    }

    if (isRepetitiveSpam) {
      earnedWeight = Math.round(earnedWeight * 0.5);
    }

    totalEarned += earnedWeight;

    return {
      criterionId: criterion.id,
      label: criterion.label,
      weight: criterion.weight,
      earnedWeight,
      matched: isFullMatch && !isRepetitiveSpam,
      matchedTerms,
    };
  });

  const scorePercent =
    maxPoints > 0 ? Math.min(100, Math.round((totalEarned / maxPoints) * 100)) : 0;

  return {
    questionId: question.id,
    scorePercent,
    earnedPoints: totalEarned,
    maxPoints,
    criteriaResults,
  };
}

export function evaluateFullTryOut(params: {
  essayQuestions: EssayQuestion[];
  abcQuestions: AbcQuestion[];
  essayAnswers: Record<string, string>;
  abcAnswers: Record<string, 'A' | 'B' | 'C' | 'D'>;
  durationMinutes: number;
  elapsedSeconds: number;
}): ExamAttemptSummary {
  const { essayQuestions, abcQuestions, essayAnswers, abcAnswers, durationMinutes, elapsedSeconds } =
    params;

  const essayEvaluations: EssayEvaluationResult[] = essayQuestions.map((q) =>
    evaluateEssayAnswer(q, essayAnswers[q.id] ?? '')
  );

  const abcEvaluations: AbcEvaluationResult[] = abcQuestions.map((q) => {
    const selectedKey = abcAnswers[q.id] ?? null;
    return {
      questionId: q.id,
      selectedKey,
      correctKey: q.correctKey,
      isCorrect: selectedKey === q.correctKey,
    };
  });

  const essayScorePercent =
    essayEvaluations.length > 0
      ? Math.round(
          essayEvaluations.reduce((acc, item) => acc + item.scorePercent, 0) /
            essayEvaluations.length
        )
      : 0;

  const abcCorrectCount = abcEvaluations.filter((item) => item.isCorrect).length;
  const abcScorePercent =
    abcEvaluations.length > 0 ? Math.round((abcCorrectCount / abcEvaluations.length) * 100) : 0;

  // Weighted Try Out Formula: 70% Essay + 30% Pilihan Ganda
  const totalScore = Math.round(essayScorePercent * 0.7 + abcScorePercent * 0.3);

  return {
    id: `attempt-${Date.now()}`,
    completedAtIso: new Date().toISOString(),
    durationMinutes,
    elapsedSeconds,
    totalScore,
    essayScorePercent,
    abcScorePercent,
    abcCorrectCount,
    abcTotalCount: abcEvaluations.length,
    essayEvaluations,
    abcEvaluations,
  };
}
