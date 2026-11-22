import express from 'express';
import path from 'node:path';
import {
  getOrGenerateSegmentAudio,
  isGeminiTtsConfigured,
  TtsServiceError,
} from './src/server/ttsService.ts';

const PORT = Number(process.env.PORT || 3000);
const IS_PROD = process.env.NODE_ENV === 'production';

async function startServer() {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/tts/status', (_req, res) => {
    res.json({
      geminiConfigured: isGeminiTtsConfigured(),
      model: 'gemini-3.8-flash-lite-tts',
    });
  });

  app.get('/api/tts/:segmentId/:personaId', async (req, res) => {
    const segmentId = String(req.params.segmentId || '').trim();
    const personaId = String(req.params.personaId || '').trim();

    if (!/^[a-z0-9-]+$/i.test(segmentId) || !/^[a-z0-9-]+$/i.test(personaId)) {
      res.status(400).json({
        error: 'Parameter segmen atau persona tidak valid.',
        code: 'INVALID_REQUEST',
      });
      return;
    }

    try {
      const result = await getOrGenerateSegmentAudio(segmentId, personaId);
      res.setHeader('Content-Type', 'audio/wav');
      res.setHeader('Content-Length', String(result.wavBuffer.length));
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      res.setHeader('X-TTS-Cache', result.cacheHit ? 'HIT' : 'MISS');
      res.status(200).send(result.wavBuffer);
    } catch (err) {
      if (err instanceof TtsServiceError) {
        res.status(err.status).json({
          error: err.message,
          code: err.code,
        });
        return;
      }
      res.status(503).json({
        error: 'Layanan suara AI sedang tidak tersedia.',
        code: 'TTS_UNAVAILABLE',
      });
    }
  });

  if (!IS_PROD) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: process.env.DISABLE_HMR !== 'true',
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(
      express.static(distDir, {
        index: false,
      })
    );
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`RigBench server listening on http://0.0.0.0:${PORT}`);
  });
}

void startServer();
