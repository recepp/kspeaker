import { config } from '../../../config';
import { toResponseLanguage } from '../../shared/language/appLanguageConfig';
import { ELEVENLABS_FREE_TIER } from './elevenLabsLimits';
import { elevenLabsQuotaGate } from './elevenLabsQuota';

export type ElevenLabsSynthResult =
  | { ok: true; audioBase64: string; charCount: number }
  | {
      ok: false;
      reason: 'no_backend' | 'quota' | 'http' | 'network';
      status?: number;
    };

/**
 * ElevenLabs via Railway `/tts` (SRP).
 * API key lives on the server (`ELEVENLABS_API_KEY`) — never in the app binary.
 */
export class ElevenLabsClient {
  /** Backend is the source of truth; always attempt when online. */
  hasApiKey(): boolean {
    return true;
  }

  async synthesize(
    text: string,
    uiLanguage: string = 'en'
  ): Promise<ElevenLabsSynthResult> {
    if (!(await elevenLabsQuotaGate.canAttempt(text.length))) {
      return { ok: false, reason: 'quota' };
    }

    const language = toResponseLanguage(uiLanguage);
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20_000);

    try {
      const { getOrCreateDeviceId } = await import('../../../deviceId');
      const deviceId = await getOrCreateDeviceId();

      const res = await fetch(`${config.API_BASE_URL}/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json, audio/mpeg',
          'X-Device-ID': deviceId,
          'X-Language': language,
          'X-Api-Key': config.API_KEY || 'kspeaker_secure_api_key_1',
        },
        body: JSON.stringify({
          text,
          provider: 'elevenlabs',
          language,
          model_id: ELEVENLABS_FREE_TIER.preferredModelId,
          voice_id: config.ELEVENLABS_VOICE_ID || ELEVENLABS_FREE_TIER.defaultVoiceId,
          output_format: ELEVENLABS_FREE_TIER.outputFormat,
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (res.status === 401 || res.status === 402 || res.status === 429) {
        await elevenLabsQuotaGate.markExhausted(`backend ${res.status}`);
        return { ok: false, reason: 'quota', status: res.status };
      }

      // Backend not wired for ElevenLabs yet, or provider disabled
      if (res.status === 404 || res.status === 501 || res.status === 503) {
        if (__DEV__) {
          console.warn(
            '[ElevenLabs] Backend /tts provider unavailable:',
            res.status,
            '— add ELEVENLABS_API_KEY on Railway and handle provider=elevenlabs'
          );
        }
        return { ok: false, reason: 'no_backend', status: res.status };
      }

      if (!res.ok) {
        const bodyText = await res.text().catch(() => '');
        if (/quota|limit|credit|character/i.test(bodyText)) {
          await elevenLabsQuotaGate.markExhausted(`backend ${res.status}`);
          return { ok: false, reason: 'quota', status: res.status };
        }
        if (__DEV__) {
          console.warn('[ElevenLabs] /tts failed', res.status, bodyText.slice(0, 160));
        }
        return { ok: false, reason: 'http', status: res.status };
      }

      const contentType = (res.headers.get('content-type') || '').toLowerCase();
      let audioBase64 = '';

      if (contentType.includes('application/json')) {
        const data = await res.json();
        audioBase64 =
          data.audioData ||
          data.audio_base64 ||
          data.base64 ||
          (typeof data.audioUrl === 'string' && data.audioUrl.startsWith('data:')
            ? data.audioUrl.split(',')[1]
            : '') ||
          '';
        // Remote URL — fetch bytes
        if (!audioBase64 && typeof data.audioUrl === 'string') {
          const audioRes = await fetch(data.audioUrl);
          if (!audioRes.ok) {
            return { ok: false, reason: 'http', status: audioRes.status };
          }
          audioBase64 = arrayBufferToBase64(await audioRes.arrayBuffer());
        }
      } else {
        audioBase64 = arrayBufferToBase64(await res.arrayBuffer());
      }

      if (!audioBase64) {
        return { ok: false, reason: 'http' };
      }

      await elevenLabsQuotaGate.recordUsage(text.length);
      return { ok: true, audioBase64, charCount: text.length };
    } catch (error) {
      clearTimeout(timeout);
      if (__DEV__) console.warn('[ElevenLabs] network error', error);
      return { ok: false, reason: 'network' };
    }
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const chars =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  let out = '';
  for (let i = 0; i < bytes.length; i += 3) {
    const a = bytes[i];
    const b = i + 1 < bytes.length ? bytes[i + 1] : 0;
    const c = i + 2 < bytes.length ? bytes[i + 2] : 0;
    const triplet = (a << 16) | (b << 8) | c;
    out += chars[(triplet >> 18) & 63];
    out += chars[(triplet >> 12) & 63];
    out += i + 1 < bytes.length ? chars[(triplet >> 6) & 63] : '=';
    out += i + 2 < bytes.length ? chars[triplet & 63] : '=';
  }
  return out;
}

export const elevenLabsClient = new ElevenLabsClient();
