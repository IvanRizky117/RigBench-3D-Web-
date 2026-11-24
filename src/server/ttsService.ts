import fs from 'node:fs/promises';
import path from 'node:path';
import { GoogleGenAI } from '@google/genai';
import { CURRICULUM_CLUSTERS } from '../data/curriculumData.ts';
import { getTutorPersona, type TutorPersonaSpec } from '../data/ttsPersonas.ts';
import { formatIndonesianSpeechText, hashSpeechScript } from '../utils/indonesianPhonetics.ts';

const TTS_MODEL = 'gemini-3.8-flash-lite-tts';
const CACHE_DIR =
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME
    ? '/tmp/.tts-cache'
    : path.resolve(process.cwd(), '.tts-cache');
const MAX_SERVER_MEMORY_CLIPS = 24;
const MAX_RETRIES = 2;
const BASE_BACKOFF_MS = 900;
const RATE_LIMIT_COOLDOWN_MS = 20_000;

export interface TtsSynthesisResult {
  wavBuffer: Buffer;
  cacheHit: boolean;
  cacheKey: string;
}

export class TtsServiceError extends Error {
  status: number;
  code: 'INVALID_REQUEST' | 'TTS_UNAVAILABLE' | 'RATE_LIMITED';

  constructor(
    message: string,
    status: number,
    code: 'INVALID_REQUEST' | 'TTS_UNAVAILABLE' | 'RATE_LIMITED'
  ) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const memoryCache = new Map<string, Buffer>();
const inFlightRequests = new Map<string, Promise<Buffer>>();
let cooldownUntilMs = 0;

function rememberServerAudio(cacheKey: string, wavBuffer: Buffer): void {
  if (memoryCache.has(cacheKey)) {
    memoryCache.delete(cacheKey);
  }
  memoryCache.set(cacheKey, wavBuffer);
  while (memoryCache.size > MAX_SERVER_MEMORY_CLIPS) {
    const oldestKey = memoryCache.keys().next().value;
    if (oldestKey === undefined) break;
    memoryCache.delete(oldestKey);
  }
}

let sharedClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    return null;
  }
  if (!sharedClient) {
    sharedClient = new GoogleGenAI({
      apiKey,
      apiVersion: 'v1beta',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return sharedClient;
}

function findSegmentNarration(segmentId: string): string | null {
  for (const cluster of CURRICULUM_CLUSTERS) {
    const found = cluster.segments.find((seg) => seg.id === segmentId);
    if (found) return found.narration;
  }
  return null;
}

function extractHttpStatus(err: unknown): number | undefined {
  if (!err || typeof err !== 'object') return undefined;
  const candidate = err as { status?: number; code?: number; statusCode?: number };
  if (typeof candidate.status === 'number') return candidate.status;
  if (typeof candidate.statusCode === 'number') return candidate.statusCode;
  if (typeof candidate.code === 'number') return candidate.code;
  return undefined;
}

function isRetryableStatus(status: number | undefined, message: string): boolean {
  if (status === 429 || status === 503) return true;
  return /\b(429|503|RESOURCE_EXHAUSTED|UNAVAILABLE)\b/i.test(message);
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function ensureCacheDir(): Promise<void> {
  await fs.mkdir(CACHE_DIR, { recursive: true });
}

function buildDiskCachePath(segmentId: string, persona: TutorPersonaSpec, scriptHash: string): string {
  const safeSeg = segmentId.replace(/[^a-zA-Z0-9_-]/g, '');
  const safePersona = persona.id.replace(/[^a-zA-Z0-9_-]/g, '');
  return path.join(CACHE_DIR, `${safeSeg}__${safePersona}__${scriptHash}.wav`);
}

async function synthesizeWithBackoff(
  ai: GoogleGenAI,
  spokenText: string,
  persona: TutorPersonaSpec
): Promise<Buffer> {
  const now = Date.now();
  if (now < cooldownUntilMs) {
    throw new TtsServiceError(
      'Layanan suara AI sedang jeda singkat karena batas kuota. Memakai suara lokal sementara.',
      429,
      'RATE_LIMITED'
    );
  }

  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: TTS_MODEL,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: spokenText,
                speechMetadata: {
                  style:
                    persona.geminiStyle ??
                    'Speak in warm, energetic Bahasa Indonesia like an encouraging tech tutor.',
                },
              },
            ],
          },
        ],
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: persona.geminiVoice ?? 'Kore',
              },
            },
          },
        },
      });

      const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      if (!base64Audio) {
        throw new TtsServiceError(
          'Gemini TTS tidak mengembalikan data audio.',
          503,
          'TTS_UNAVAILABLE'
        );
      }
      return Buffer.from(base64Audio, 'base64');
    } catch (err) {
      lastError = err;
      const status = extractHttpStatus(err);
      const message = err instanceof Error ? err.message : String(err);

      if (status === 429 || /\b(429|RESOURCE_EXHAUSTED)\b/i.test(message)) {
        if (attempt < MAX_RETRIES) {
          const jitter = Math.floor(Math.random() * 250);
          await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt) + jitter);
          continue;
        }
        cooldownUntilMs = Date.now() + RATE_LIMIT_COOLDOWN_MS;
        throw new TtsServiceError(
          'Kuota permintaan suara AI sedang penuh. Beralih ke suara lokal perangkat.',
          429,
          'RATE_LIMITED'
        );
      }

      if (isRetryableStatus(status, message) && attempt < MAX_RETRIES) {
        const jitter = Math.floor(Math.random() * 250);
        await sleep(BASE_BACKOFF_MS * Math.pow(2, attempt) + jitter);
        continue;
      }

      console.error('[Gemini TTS Error]', { status, message });

      throw new TtsServiceError(
        `Gagal menghasilkan suara Gemini TTS saat ini: ${message}`,
        status && status >= 400 ? status : 503,
        'TTS_UNAVAILABLE'
      );
    }
  }

  throw new TtsServiceError(
    lastError instanceof Error ? lastError.message : 'TTS synthesis failed.',
    503,
    'TTS_UNAVAILABLE'
  );
}

export function isGeminiTtsConfigured(): boolean {
  return getGeminiClient() !== null;
}

export async function getOrGenerateSegmentAudio(
  segmentId: string,
  personaId: string
): Promise<TtsSynthesisResult> {
  const rawNarration = findSegmentNarration(segmentId);
  if (!rawNarration) {
    throw new TtsServiceError('Segmen materi tidak ditemukan.', 400, 'INVALID_REQUEST');
  }

  const persona = getTutorPersona(personaId);
  if (persona.engine !== 'gemini') {
    throw new TtsServiceError(
      'Persona ini menggunakan suara lokal perangkat.',
      400,
      'INVALID_REQUEST'
    );
  }

  const spokenText = formatIndonesianSpeechText(rawNarration);
  const scriptHash = hashSpeechScript(`${TTS_MODEL}|${persona.id}|${persona.geminiVoice}|${spokenText}`);
  const cacheKey = `${segmentId}:${persona.id}:${scriptHash}`;

  const memHit = memoryCache.get(cacheKey);
  if (memHit) {
    rememberServerAudio(cacheKey, memHit);
    return { wavBuffer: memHit, cacheHit: true, cacheKey };
  }

  const diskPath = buildDiskCachePath(segmentId, persona, scriptHash);
  try {
    const diskHit = await fs.readFile(diskPath);
    if (diskHit.length > 44) {
      rememberServerAudio(cacheKey, diskHit);
      return { wavBuffer: diskHit, cacheHit: true, cacheKey };
    }
  } catch {
    // Disk cache miss; proceed to Gemini synthesis
  }

  const ai = getGeminiClient();
  if (!ai) {
    throw new TtsServiceError(
      'GEMINI_API_KEY belum tersedia di server; memakai suara lokal perangkat.',
      503,
      'TTS_UNAVAILABLE'
    );
  }

  let pending = inFlightRequests.get(cacheKey);
  if (!pending) {
    pending = (async () => {
      const wavBuffer = await synthesizeWithBackoff(ai, spokenText, persona);
      rememberServerAudio(cacheKey, wavBuffer);
      try {
        await ensureCacheDir();
        await fs.writeFile(diskPath, wavBuffer);
      } catch {
        // Non-fatal if container filesystem is read-only; memory cache still holds clip
      }
      return wavBuffer;
    })().finally(() => {
      inFlightRequests.delete(cacheKey);
    });
    inFlightRequests.set(cacheKey, pending);
  }

  const wavBuffer = await pending;
  return { wavBuffer, cacheHit: false, cacheKey };
}
