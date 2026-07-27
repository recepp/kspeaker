import { Platform } from 'react-native';

export interface TtsVoiceLike {
  id: string;
  name: string;
  language: string;
  quality?: number;
}

/**
 * Platform-aware TTS defaults. Keeps Android speech feel close to iOS.
 */
export function getPlatformTtsDefaults() {
  return {
    rate: 0.5,
    pitch: 1.0,
    language: 'en-US' as const,
  };
}

export function selectOptimalVoice(voices: TtsVoiceLike[]): TtsVoiceLike | null {
  if (!voices?.length) return null;

  const enVoices = voices.filter(
    (v) => v.language === 'en-US' || v.language?.startsWith('en-')
  );
  const pool = enVoices.length ? enVoices : voices;

  const preferredNames = [
    'Samantha',
    'Karen',
    'Moira',
    'Tessa',
    'Nicky',
    'en-us-x-sfg',
    'Google',
  ];

  for (const name of preferredNames) {
    const match = pool.find((v) => v.name?.includes(name));
    if (match) return match;
  }

  if (Platform.OS === 'android') {
    const google = pool.find(
      (v) => v.name?.includes('Google') || v.name?.includes('en-us-')
    );
    if (google) return google;
  }

  const neural = pool.find((v) => typeof v.quality === 'number' && v.quality >= 300);
  if (neural) return neural;

  return pool.find((v) => v.name?.toLowerCase().includes('female')) || pool[0] || null;
}
