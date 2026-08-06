/**
 * Single source of truth for STT timing.
 * Tuned for conversational turn-taking without cutting mid-phrase.
 */
export const LISTENING_POLICY = {
  /** Silence after we have text before treating utterance as done */
  silenceAfterSpeechMs: 2200,
  /** Max wait before first recognized text (then soft restart) */
  warmUpSilenceMs: 8000,
  /** Wait after native onSpeechEnd so final hypotheses can arrive */
  endGraceMs: 480,
  /** Soft stop settle time before restarting recognizer */
  softStopDelayMs: 80,
  /**
   * Settle after TTS before Voice.start.
   * Too short → AUDIO_FORMAT / silent mic; keep enough for iOS session flip.
   */
  postTtsHandoffMs: 550,
  /** Extra settle after releasing mic before device TTS speaks */
  preTtsReleaseMs: 280,
  /** Soft retry after empty silence */
  emptyRestartDelayMs: 220,
  /** Error retry delay */
  errorRetryDelayMs: 900,
} as const;

export type ListeningPolicy = typeof LISTENING_POLICY;

/** How aggressively to open the mic */
export type ListenStartPriority = 'normal' | 'fast';
