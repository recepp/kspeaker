import { Platform } from 'react-native';
import { getTtsLanguageTag, toResponseLanguage } from '../shared/language/appLanguageConfig';

export interface TtsVoiceLike {
  id: string;
  name: string;
  language: string;
  quality?: number;
}

/**
 * Platform-aware TTS defaults, driven by screen language.
 */
export function getPlatformTtsDefaults(uiLanguage: string = 'en') {
  return {
    rate: 0.5,
    pitch: 1.0,
    language: getTtsLanguageTag(uiLanguage),
  };
}

export function selectOptimalVoice(
  voices: TtsVoiceLike[],
  uiLanguage: string = 'en'
): TtsVoiceLike | null {
  if (!voices?.length) return null;

  const prefix = toResponseLanguage(uiLanguage);
  const langVoices = voices.filter(
    (v) =>
      v.language === getTtsLanguageTag(uiLanguage) ||
      v.language?.toLowerCase().startsWith(`${prefix}-`) ||
      v.language?.toLowerCase().startsWith(prefix)
  );
  const pool = langVoices.length ? langVoices : voices;

  const preferredByLang: Record<string, string[]> = {
    en: ['Samantha', 'Karen', 'Moira', 'Tessa', 'Nicky', 'en-us-x-sfg', 'Google'],
    tr: ['Yelda', 'Tolga', 'Google', 'tr-tr'],
    ar: ['Maged', 'Laila', 'Tarik', 'Google', 'ar-'],
    ru: ['Milena', 'Yuri', 'Google', 'ru-'],
  };

  const preferredNames = preferredByLang[prefix] || preferredByLang.en;

  for (const name of preferredNames) {
    const match = pool.find((v) => v.name?.includes(name) || v.id?.includes(name));
    if (match) return match;
  }

  if (Platform.OS === 'android') {
    const google = pool.find(
      (v) => v.name?.includes('Google') || v.id?.toLowerCase().includes(prefix)
    );
    if (google) return google;
  }

  const neural = pool.find((v) => typeof v.quality === 'number' && v.quality >= 300);
  if (neural) return neural;

  return pool.find((v) => v.name?.toLowerCase().includes('female')) || pool[0] || null;
}
