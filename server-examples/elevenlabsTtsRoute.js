/**
 * Railway / Express example for ElevenLabs TTS proxy.
 *
 * Railway Variables:
 *   ELEVENLABS_API_KEY=sk_...
 *   ELEVENLABS_VOICE_ID=EXAVITQu4vr4xnSDxMaL   (optional)
 *
 * Expects POST /tts with JSON:
 *   { text, provider: "elevenlabs", language?, model_id?, voice_id?, output_format? }
 *
 * Responds with JSON: { audioData: "<base64 mp3>" }
 *
 * Paste into your existing Railway API router alongside OpenAI TTS.
 */

// eslint-disable-next-line @typescript-eslint/no-var-requires
const express = require('express');

const ELEVEN_API = 'https://api.elevenlabs.io/v1';

async function synthesizeElevenLabs(req, res) {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey || !apiKey.startsWith('sk_')) {
    return res.status(503).json({
      error: 'ELEVENLABS_API_KEY not configured on Railway',
    });
  }

  const {
    text,
    voice_id,
    model_id = 'eleven_flash_v2_5',
    output_format = 'mp3_44100_128',
  } = req.body || {};

  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text is required' });
  }

  const voiceId =
    voice_id ||
    process.env.ELEVENLABS_VOICE_ID ||
    'EXAVITQu4vr4xnSDxMaL';

  try {
    const upstream = await fetch(
      `${ELEVEN_API}/text-to-speech/${voiceId}?output_format=${output_format}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
          Accept: 'audio/mpeg',
        },
        body: JSON.stringify({
          text,
          model_id,
          voice_settings: {
            stability: 0.45,
            similarity_boost: 0.75,
            style: 0.15,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (upstream.status === 401 || upstream.status === 402 || upstream.status === 429) {
      return res.status(upstream.status).json({ error: 'elevenlabs_quota_or_auth' });
    }
    if (!upstream.ok) {
      const detail = await upstream.text();
      return res.status(upstream.status).json({ error: detail.slice(0, 500) });
    }

    const buf = Buffer.from(await upstream.arrayBuffer());
    return res.json({
      audioData: buf.toString('base64'),
      provider: 'elevenlabs',
    });
  } catch (error) {
    console.error('[tts/elevenlabs]', error);
    return res.status(502).json({ error: 'elevenlabs_upstream_failed' });
  }
}

/**
 * Example wiring:
 *
 * app.post('/tts', async (req, res) => {
 *   if (req.body?.provider === 'elevenlabs') {
 *     return synthesizeElevenLabs(req, res);
 *   }
 *   // ... existing OpenAI TTS path
 * });
 */
module.exports = { synthesizeElevenLabs };

// Optional standalone router mount:
// const router = express.Router();
// router.post('/tts', (req, res, next) => {
//   if (req.body?.provider === 'elevenlabs') return synthesizeElevenLabs(req, res);
//   return next();
// });
// module.exports.router = router;
