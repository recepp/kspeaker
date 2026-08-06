import type { FlashcardLanguageCode } from '../types';

/**
 * Per-language learning profile (OCP: add a language here, not in call sites).
 * Target = language being studied (card front). Gloss = translation language.
 */
export type FlashcardLanguageProfile = {
  code: FlashcardLanguageCode;
  /** English name used in AI prompts */
  name: string;
  nativeName: string;
  learnHint: string;
  /** Language of "word" + "example" */
  targetLanguageName: string;
  /** Language of "translation" */
  glossLanguageName: string;
  /** Script hint for the model */
  scriptHint: string;
  /** UI writing direction for the target word */
  rtl: boolean;
  /**
   * Wire language for /generate headers/body.
   * Always English for structured JSON so reply-language locks don't
   * force conversational AR/TR/RU prose instead of a JSON array.
   */
  structuredWireLanguage: 'en';
};

export const FLASHCARD_LANGUAGE_PROFILES: Record<
  FlashcardLanguageCode,
  FlashcardLanguageProfile
> = {
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    learnHint: 'Learn English',
    targetLanguageName: 'English',
    glossLanguageName: 'Turkish',
    scriptHint: 'Use Latin script for English words and examples.',
    rtl: false,
    structuredWireLanguage: 'en',
  },
  tr: {
    code: 'tr',
    name: 'Turkish',
    nativeName: 'Türkçe',
    learnHint: 'Türkçe öğren',
    targetLanguageName: 'Turkish',
    glossLanguageName: 'English',
    scriptHint:
      'Use Turkish Latin script with correct diacritics (ç, ğ, ı, İ, ö, ş, ü).',
    rtl: false,
    structuredWireLanguage: 'en',
  },
  ar: {
    code: 'ar',
    name: 'Arabic',
    nativeName: 'العربية',
    learnHint: 'تعلّم العربية',
    targetLanguageName: 'Modern Standard Arabic',
    glossLanguageName: 'Turkish',
    scriptHint:
      'Use Arabic script for word and example. Do not transliterate the word field into Latin letters.',
    rtl: true,
    structuredWireLanguage: 'en',
  },
  ru: {
    code: 'ru',
    name: 'Russian',
    nativeName: 'Русский',
    learnHint: 'Учить русский',
    targetLanguageName: 'Russian',
    glossLanguageName: 'Turkish',
    scriptHint:
      'Use Cyrillic script for word and example. Do not transliterate the word field into Latin letters.',
    rtl: false,
    structuredWireLanguage: 'en',
  },
};

export function getFlashcardLanguageProfile(
  code: string
): FlashcardLanguageProfile {
  if (code === 'tr' || code === 'ar' || code === 'ru' || code === 'en') {
    return FLASHCARD_LANGUAGE_PROFILES[code];
  }
  return FLASHCARD_LANGUAGE_PROFILES.en;
}

/** Locale-aware key for exclude/dedupe (Turkish dotted/dotless i safe). */
export function normalizeFlashcardWordKey(
  word: string,
  language: FlashcardLanguageCode
): string {
  const trimmed = word.trim().normalize('NFC');
  if (!trimmed) return '';
  if (language === 'tr') return trimmed.toLocaleLowerCase('tr-TR');
  if (language === 'en') return trimmed.toLocaleLowerCase('en-US');
  // Arabic / Russian: case fold via en-US is fine for Cyrillic; Arabic is caseless
  return trimmed.toLocaleLowerCase('en-US');
}
