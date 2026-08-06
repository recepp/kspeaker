/**
 * Free-tier ElevenLabs limits (shared web + API, monthly, no top-up).
 * @see https://elevenlabs.io/pricing
 */
export const ELEVENLABS_FREE_TIER = {
  /** Monthly credits on Free plan */
  monthlyCredits: 10_000,
  /**
   * Flash v2.5 ≈ 0.5 credit / character → ~20k characters / month.
   * Prefer Flash on free tier to stretch quota; Multilingual v2 is 1 credit/char.
   */
  preferredModelId: 'eleven_flash_v2_5',
  /** Soft local pre-check before calling API (chars). */
  softMonthlyCharBudget: 18_000,
  /** Free single-request practical cap we enforce client-side. */
  maxCharsPerRequest: 2_500,
  /** Default multilingual stock voice (Sarah). Override via ELEVENLABS_VOICE_ID. */
  defaultVoiceId: 'EXAVITQu4vr4xnSDxMaL',
  outputFormat: 'mp3_44100_128',
} as const;

export type ElevenLabsQuotaSnapshot = {
  characterCount: number;
  characterLimit: number;
  remaining: number;
  tier: string;
  canUse: boolean;
};
