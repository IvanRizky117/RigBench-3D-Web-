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
      'Speak in natural, warm, enthusiastic Bahasa Indonesia like a young energetic university lab tutor teaching a friend. Use lively intonation, clear pauses on commas and periods, and encouraging emphasis on key exam terms without sounding robotic.',
  },
  {
    id: 'bima-santai',
    label: 'Kak Bima · Tutor Santai (AI)',
    shortLabel: 'Kak Bima (AI)',
    description: 'Suara tutor pria muda yang ramah, ekspresif, asyik, dan tidak membosankan.',
    engine: 'gemini',
    geminiVoice: 'Puck',
    geminiStyle:
      'Speak in natural, friendly, upbeat Bahasa Indonesia like an approachable young tech mentor explaining PC hardware with enthusiasm and crisp pronunciation.',
  },
  {
    id: 'zara-cerah',
    label: 'Kak Zara · Tutor Cerah (AI)',
    shortLabel: 'Kak Zara (AI)',
    description: 'Suara tutor wanita dengan tempo ringan, ekspresif, dan enak didengar lama.',
    engine: 'gemini',
    geminiVoice: 'Zephyr',
    geminiStyle:
      'Speak in bright, expressive, conversational Bahasa Indonesia like an engaging educational creator who makes complex technical topics feel easy and exciting.',
  },
  {
    id: 'ardi-mentor',
    label: 'Pak Ardi · Mentor Tegas (AI)',
    shortLabel: 'Pak Ardi (AI)',
    description: 'Suara dosen praktikum yang berwibawa, tenang, tegas, dan fokus pada poin ujian.',
    engine: 'gemini',
    geminiVoice: 'Charon',
    geminiStyle:
      'Speak in clear, authoritative yet supportive Bahasa Indonesia like an experienced computer architecture lecturer guiding students step-by-step for an exam.',
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
