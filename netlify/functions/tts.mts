import {
  getOrGenerateSegmentAudio,
  isGeminiTtsConfigured,
  TtsServiceError,
} from '../../src/server/ttsService.ts';

function jsonResponse(payload: unknown, status: number, cacheControl = 'no-store'): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': cacheControl,
    },
  });
}

function extractRouteParts(rawUrl: string): string[] {
  const { pathname } = new URL(rawUrl, 'https://rigbench.local');
  const trimmed = pathname
    .replace(/^\/api\/tts\/?/i, '')
    .replace(/^\/\.netlify\/functions\/tts\/?/i, '')
    .replace(/\/+$/, '');
  return trimmed ? trimmed.split('/').filter(Boolean) : [];
}

export default async function handler(req: Request): Promise<Response> {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return jsonResponse({ error: 'Method not allowed.', code: 'INVALID_REQUEST' }, 405);
  }

  const parts = extractRouteParts(req.url);

  if (parts.length === 1 && parts[0] === 'status') {
    return jsonResponse(
      {
        geminiConfigured: isGeminiTtsConfigured(),
        model: 'gemini-3.8-flash-lite-tts',
      },
      200,
      'no-store'
    );
  }

  if (parts.length !== 2) {
    return jsonResponse(
      { error: 'Endpoint TTS tidak valid.', code: 'INVALID_REQUEST' },
      400
    );
  }

  const segmentId = decodeURIComponent(parts[0]).trim();
  const personaId = decodeURIComponent(parts[1]).trim();

  if (!/^[a-z0-9-]+$/i.test(segmentId) || !/^[a-z0-9-]+$/i.test(personaId)) {
    return jsonResponse(
      { error: 'Parameter segmen atau persona tidak valid.', code: 'INVALID_REQUEST' },
      400
    );
  }

  try {
    const result = await getOrGenerateSegmentAudio(segmentId, personaId);
    const body = req.method === 'HEAD' ? null : new Uint8Array(result.wavBuffer);
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'audio/wav',
        'Content-Length': String(result.wavBuffer.length),
        'Cache-Control': 'public, max-age=31536000, immutable',
        'X-TTS-Cache': result.cacheHit ? 'HIT' : 'MISS',
      },
    });
  } catch (err) {
    if (err instanceof TtsServiceError) {
      return jsonResponse({ error: err.message, code: err.code }, err.status);
    }
    return jsonResponse(
      { error: 'Layanan suara AI sedang tidak tersedia.', code: 'TTS_UNAVAILABLE' },
      503
    );
  }
}

export const config = {
  path: '/api/tts/*',
};
