import type { ResponseLanguage } from './detectResponseLanguage';

export type AppLanguageCode = ResponseLanguage;

/**
 * Single source of truth for UI language → speech / TTS / API language codes.
 * Keeps STT, TTS, and chat reply language aligned with the screen language.
 */
export function toResponseLanguage(lang: string): ResponseLanguage {
  if (lang === 'tr' || lang === 'ar' || lang === 'ru' || lang === 'en') {
    return lang;
  }
  return 'en';
}

/** BCP-47 locale for @react-native-community/voice */
export function getSpeechLocale(lang: string): string {
  switch (toResponseLanguage(lang)) {
    case 'tr':
      return 'tr-TR';
    case 'ar':
      return 'ar-SA';
    case 'ru':
      return 'ru-RU';
    default:
      return 'en-US';
  }
}

/** Locale tag for react-native-tts setDefaultLanguage */
export function getTtsLanguageTag(lang: string): string {
  return getSpeechLocale(lang);
}
