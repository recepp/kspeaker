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
   * Minimal settle after TTS before Voice.start.
   * Large gaps here cause users to speak before the mic is live
   * and lose the first words of the turn.
   */
  postTtsHandoffMs: 60,
  /** Soft retry after empty silence */
  emptyRestartDelayMs: 220,
  /** Error retry delay */
  errorRetryDelayMs: 700,
} as const;

export type ListeningPolicy = typeof LISTENING_POLICY;

/** How aggressively to open the mic */
export type ListenStartPriority = 'normal' | 'fast';
