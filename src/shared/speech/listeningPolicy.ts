/**
 * Single source of truth for STT timing.
 * Tuned for conversational turn-taking without cutting mid-phrase.
 * Handoff delays are platform-specific (see audioPlatform.ts).
 */
import { AUDIO_HANDOFF } from './audioPlatform';

export const LISTENING_POLICY = {
  /** Silence after we have text before treating utterance as done */
  silenceAfterSpeechMs: 2200,
  /** Max wait before first recognized text (then soft restart) */
  warmUpSilenceMs: 8000,
  /** Wait after native onSpeechEnd so final hypotheses can arrive */
  endGraceMs: 480,
  /** Soft stop settle time before restarting recognizer */
  softStopDelayMs: AUDIO_HANDOFF.softStopDelayMs,
  /**
   * Settle after TTS before Voice.start.
   * iOS: AVAudioSession flip; Android: AudioFocus release.
   */
  postTtsHandoffMs: AUDIO_HANDOFF.postTtsHandoffMs,
  /** Extra settle after releasing mic before device/premium TTS speaks */
  preTtsReleaseMs: AUDIO_HANDOFF.preTtsReleaseMs,
  /** Soft retry after empty silence */
  emptyRestartDelayMs: 220,
  /** Error retry delay */
  errorRetryDelayMs: AUDIO_HANDOFF.errorRetryDelayMs,
} as const;

export type ListeningPolicy = typeof LISTENING_POLICY;

/** How aggressively to open the mic */
export type ListenStartPriority = 'normal' | 'fast';
