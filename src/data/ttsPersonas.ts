export type GeminiVoiceName = 'Kore' | 'Puck' | 'Zephyr' | 'Charon' | 'Fenrir';

export type TutorPersonaId =
  | 'nadia-energik'
  | 'bima-santai'
  | 'zara-cerah'
  | 'ardi-mentor'
  | 'local-browser';

export interface TutorPersonaSpec {
  id: TutorPersonaId;
  label: string;
  shortLabel: string;
  description: string;
  engine: 'gemini' | 'local';
  geminiVoice?: GeminiVoiceName;
  geminiStyle?: string;
}

export const DEFAULT_TUTOR_PERSONA_ID: TutorPersonaId = 'nadia-energik';

export const TUTOR_PERSONAS: TutorPersonaSpec[] = [
  {
    id: 'nadia-energik',
    label: 'Kak Nadia · Tutor Energik (AI)',
    shortLabel: 'Kak Nadia (AI)',
    description: 'Suara tutor wanita muda yang ceria, hangat, artikulasi jelas, dan memotivasi.',
    engine: 'gemini',
    geminiVoice: 'Kore',
    geminiStyle:
      'Speak in calm, warm, patient Bahasa Indonesia at a relaxed, unhurried teaching pace (slightly slower than normal conversation), like a friendly private tutor teaching a beginner. Pause clearly at every comma, period, and between math numbers or new steps so listeners have time to absorb each idea.',
  },
  {
    id: 'bima-santai',
    label: 'Kak Bima · Tutor Santai (AI)',
    shortLabel: 'Kak Bima (AI)',
    description: 'Suara tutor pria muda yang ramah, santai, pelan, dan enak diikuti pemula.',
    engine: 'gemini',
    geminiVoice: 'Puck',
    geminiStyle:
      'Speak in relaxed, friendly, unhurried Bahasa Indonesia at a calm, steady teaching tempo (slightly slower than everyday chat). Give clear gentle pauses after each sentence and before every calculation result so beginners can easily follow along.',
  },
  {
    id: 'zara-cerah',
    label: 'Kak Zara · Tutor Cerah (AI)',
    shortLabel: 'Kak Zara (AI)',
    description: 'Suara tutor wanita bertempo pelan, cerah, dan sangat jelas artikulasinya.',
    engine: 'gemini',
    geminiVoice: 'Zephyr',
    geminiStyle:
      'Speak in bright, warm, unhurried Bahasa Indonesia at a gentle, deliberate educational pace. Pronounce every step and number clearly with comfortable breathing pauses on punctuation so complex topics feel effortless.',
  },
  {
    id: 'ardi-mentor',
    label: 'Pak Ardi · Mentor Tegas (AI)',
    shortLabel: 'Pak Ardi (AI)',
    description: 'Suara dosen praktikum yang tenang, pelan, runtut, dan fokus pada poin ujian.',
    engine: 'gemini',
    geminiVoice: 'Charon',
    geminiStyle:
      'Speak in calm, measured, clear Bahasa Indonesia at a slow, deliberate lecturer pace. Pause deliberately between numbered steps, formulas, and exam definitions so students never feel rushed.',
  },
  {
    id: 'local-browser',
    label: 'Suara Lokal Perangkat (Offline)',
    shortLabel: 'Lokal Browser',
    description: 'Menggunakan mesin Text-to-Speech bawaan browser/OS tanpa koneksi server.',
    engine: 'local',
  },
];

export function getTutorPersona(id: string | undefined | null): TutorPersonaSpec {
  return TUTOR_PERSONAS.find((p) => p.id === id) ?? TUTOR_PERSONAS[0];
}
