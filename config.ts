import {
  API_BASE_URL as ENV_API_BASE_URL,
  API_KEY as ENV_API_KEY,
  ADMIN_API_KEY as ENV_ADMIN_API_KEY,
  ELEVENLABS_VOICE_ID as ENV_ELEVENLABS_VOICE_ID,
} from '@env';

interface Config {
  API_BASE_URL: string;
  API_KEY?: string;
  ADMIN_API_KEY?: string;
  /** Optional voice override sent to Railway /tts (key stays on server). */
  ELEVENLABS_VOICE_ID?: string;
}

/**
 * Env is inlined by `react-native-dotenv` from static `@env` imports.
 * Do NOT use `require('@env')` — that path is not transformed and silently fails.
 */
export const config: Config = {
  API_BASE_URL: ENV_API_BASE_URL || 'https://kartezya-ai.up.railway.app',
  API_KEY: ENV_API_KEY || undefined,
  ADMIN_API_KEY: ENV_ADMIN_API_KEY || undefined,
  ELEVENLABS_VOICE_ID: ENV_ELEVENLABS_VOICE_ID || undefined,
};
