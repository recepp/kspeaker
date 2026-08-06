import { Platform } from 'react-native';

/**
 * Platform-tuned STT ↔ TTS handoff (SRP).
 * iOS needs longer AVAudioSession flips; Android uses AudioFocus and settles faster.
 */
export const AUDIO_HANDOFF = Platform.select({
  ios: {
    postTtsHandoffMs: 550,
    preTtsReleaseMs: 280,
    softStopDelayMs: 80,
    errorRetryDelayMs: 900,
  },
  android: {
    postTtsHandoffMs: 400,
    preTtsReleaseMs: 200,
    softStopDelayMs: 200,
    errorRetryDelayMs: 1000,
  },
  default: {
    postTtsHandoffMs: 450,
    preTtsReleaseMs: 220,
    softStopDelayMs: 100,
    errorRetryDelayMs: 800,
  },
})!;

/** How many destroy passes Voice needs after stubborn AUDIO_FORMAT errors. */
export const VOICE_AGGRESSIVE_DESTROY_PASSES = Platform.OS === 'ios' ? 3 : 1;

/**
 * Android one-shot STT continuous policy.
 * minStartIntervalMs MUST be >> system beep cadence to avoid open/close spam.
 */
export const ANDROID_LISTEN_LOOP = {
  /** Never start Voice again sooner than this after the previous start. */
  minStartIntervalMs: 4000,
  /** Delay after a clean empty NO_MATCH / timeout before next start. */
  emptyRestartMs: 4000,
  /** Delay after ERROR_CLIENT / busy before next start. */
  clientGlitchRestartMs: 5000,
  /** Idle segments before ending the conversation session. */
  maxEmptyRestarts: 30,
} as const;

/** @deprecated use ANDROID_LISTEN_LOOP.emptyRestartMs via coordinator */
export function androidEmptyRestartDelayMs(_attempt: number): number {
  return ANDROID_LISTEN_LOOP.emptyRestartMs;
}
