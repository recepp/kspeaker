import type { ResponseLanguage } from './detectResponseLanguage';
import { getSpeechLocale, toResponseLanguage } from './appLanguageConfig';

/**
 * Hard language lock for /generate. Screen language is the single source of truth:
 * the model must reply in that language unless the user explicitly asks otherwise.
 */
export function getReplyLanguageLock(uiLanguage: string): string {
  const lang = toResponseLanguage(uiLanguage);
  switch (lang) {
    case 'tr':
      return '[Language lock: Reply ONLY in Turkish (Türkçe). App language is Turkish. Do NOT reply in English unless the user explicitly asks to practice English in this message.]';
    case 'ar':
      return '[Language lock: Reply ONLY in Arabic (العربية). App language is Arabic. Do NOT reply in English unless the user explicitly asks to practice English in this message.]';
    case 'ru':
      return '[Language lock: Reply ONLY in Russian (Русский). App language is Russian. Do NOT reply in English unless the user explicitly asks to practice English in this message.]';
    default:
      return '[Language lock: Reply ONLY in English. App language is English.]';
  }
}

/** HTTP headers that pin reply language to the screen language. */
export function getApiLanguageHeaders(uiLanguage: string): Record<string, string> {
  const code = toResponseLanguage(uiLanguage);
  const locale = getSpeechLocale(uiLanguage);
  return {
    'Accept-Language': `${locale},${code};q=0.9`,
    'X-Language': code,
    'X-Response-Language': code,
    'X-Locale': locale,
  };
}

/** JSON body fields that pin reply language to the screen language. */
export function getApiLanguageBody(uiLanguage: string): {
  language: ResponseLanguage;
  response_language: ResponseLanguage;
  locale: string;
  reply_language: ResponseLanguage;
} {
  const code = toResponseLanguage(uiLanguage);
  return {
    language: code,
    response_language: code,
    locale: getSpeechLocale(uiLanguage),
    reply_language: code,
  };
}
