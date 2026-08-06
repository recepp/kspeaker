import { Platform } from 'react-native';
import { getTtsLanguageTag, toResponseLanguage } from '../shared/language/appLanguageConfig';

export interface TtsVoiceLike {
  id: string;
  name: string;
  language: string;
  quality?: number;
  /** iOS: voice asset not downloaded */
  notInstalled?: boolean;
  /** iOS: needs network to download */
  networkConnectionRequired?: boolean;
}

/**
 * Platform-aware TTS defaults, driven by screen language.
 * iOS rate is absolute AVSpeech rate (~0.5 = default).
 */
export function getPlatformTtsDefaults(uiLanguage: string = 'en') {
  return {
    rate: Platform.OS === 'ios' ? 0.48 : 0.5,
    pitch: 1.0,
    language: getTtsLanguageTag(uiLanguage),
  };
}

/** Normalize BCP-47 / underscore tags → lowercase language(+region). */
export function normalizeVoiceLang(tag: string | undefined): string {
  return (tag || '').toLowerCase().replace(/_/g, '-');
}

/**
 * Voice is safe to set as default on this device.
 * iOS enhanced (quality 500) voices are often not downloaded → silent speak.
 */
export function isVoiceUsable(voice: TtsVoiceLike): boolean {
  if (!voice?.id) return false;
  if (voice.notInstalled === true) return false;
  if (voice.networkConnectionRequired === true) return false;
  // Prefer compact/default voices on iOS — enhanced packs frequently missing
  if (Platform.OS === 'ios' && (voice.quality ?? 0) >= 500) return false;
  return true;
}

function voiceMatchesLanguage(voice: TtsVoiceLike, uiLanguage: string): boolean {
  const want = toResponseLanguage(uiLanguage);
  const full = getTtsLanguageTag(uiLanguage);
  const lang = normalizeVoiceLang(voice.language);
  if (!lang) return false;
  if (lang === normalizeVoiceLang(full)) return true;
  if (lang === want) return true;
  if (lang.startsWith(`${want}-`)) return true;
  return false;
}

/**
 * Pick best installed system voice for the UI language.
 * Uses any matching installed voice — not a fixed vendor list —
 * then falls back to preferred name hints, then any usable voice.
 */
export function selectOptimalVoice(
  voices: TtsVoiceLike[],
  uiLanguage: string = 'en'
): TtsVoiceLike | null {
  if (!voices?.length) return null;

  const usable = voices.filter(isVoiceUsable);
  if (!usable.length) return null;

  const matched = usable.filter((v) => voiceMatchesLanguage(v, uiLanguage));
  const pool = matched.length ? matched : usable;
  const prefix = toResponseLanguage(uiLanguage);

  const preferredByLang: Record<string, string[]> = {
    en: ['Samantha', 'Karen', 'Moira', 'Tessa', 'Nicky', 'en-us-x-sfg', 'Google'],
    tr: ['Yelda', 'Tolga', 'Google', 'tr-tr', 'tr_'],
    ar: ['Maged', 'Laila', 'Tarik', 'Google', 'ar-'],
    ru: ['Milena', 'Yuri', 'Google', 'ru-'],
  };
  const preferredNames = preferredByLang[prefix] || preferredByLang.en;

  for (const name of preferredNames) {
    const needle = name.toLowerCase();
    const match = pool.find(
      (v) =>
        v.name?.toLowerCase().includes(needle) ||
        v.id?.toLowerCase().includes(needle)
    );
    if (match) return match;
  }

  if (Platform.OS === 'android') {
    const google = pool.find(
      (v) =>
        v.name?.toLowerCase().includes('google') ||
        normalizeVoiceLang(v.language).startsWith(prefix)
    );
    if (google) return google;
  }

  // Prefer lower quality (compact) first — more reliably installed
  const byQuality = [...pool].sort(
    (a, b) => (a.quality ?? 300) - (b.quality ?? 300)
  );
  return byQuality[0] || pool[0] || null;
}

/** Ordered candidates to try when setDefaultVoice rejects the first pick. */
export function listVoiceCandidates(
  voices: TtsVoiceLike[],
  uiLanguage: string = 'en'
): TtsVoiceLike[] {
  const usable = voices.filter(isVoiceUsable);
  const matched = usable.filter((v) => voiceMatchesLanguage(v, uiLanguage));
  const primary = selectOptimalVoice(voices, uiLanguage);
  const rest = (matched.length ? matched : usable).filter(
    (v) => v.id !== primary?.id
  );
  return primary ? [primary, ...rest] : rest;
}
