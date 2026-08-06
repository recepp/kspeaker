import type { CefrLevel, FlashcardLanguageCode } from './types';
import {
  FLASHCARD_LANGUAGE_PROFILES,
  getFlashcardLanguageProfile,
} from './domain/languageProfile';

export const FLASHCARD_DECK_SIZE = 5;

/** Soft floor so the prepare screen is never a blink */
export const FLASHCARD_MIN_LOADING_MS = 1400;

export const FLASHCARD_LANGUAGES = (
  Object.keys(FLASHCARD_LANGUAGE_PROFILES) as FlashcardLanguageCode[]
).map((code) => {
  const p = FLASHCARD_LANGUAGE_PROFILES[code];
  return {
    code: p.code,
    name: p.name,
    nativeName: p.nativeName,
    learnHint: p.learnHint,
  };
});

export { getFlashcardLanguageProfile };
export const FLASHCARD_LEVELS: Array<{
  level: CefrLevel;
  title: string;
  description: string;
  accent: string;
  icon: string;
}> = [
  {
    level: 'A1',
    title: 'Beginner',
    description: 'Everyday words and greetings',
    accent: '#2DD4BF',
    icon: 'leaf-outline',
  },
  {
    level: 'A2',
    title: 'Elementary',
    description: 'Simple sentences and common verbs',
    accent: '#38BDF8',
    icon: 'sunny-outline',
  },
  {
    level: 'B1',
    title: 'Intermediate',
    description: 'Daily conversation and practical topics',
    accent: '#A78BFA',
    icon: 'chatbubbles-outline',
  },
  {
    level: 'B2',
    title: 'Upper Intermediate',
    description: 'Nuanced texts and opinions',
    accent: '#FBBF24',
    icon: 'book-outline',
  },
  {
    level: 'C1',
    title: 'Advanced',
    description: 'Academic and professional vocabulary',
    accent: '#F87171',
    icon: 'flask-outline',
  },
  {
    level: 'C2',
    title: 'Proficiency',
    description: 'Near-native precision and idioms',
    accent: '#FB7185',
    icon: 'diamond-outline',
  },
];

export const LEVEL_META: Record<CefrLevel, { title: string; accent: string }> =
  FLASHCARD_LEVELS.reduce(
    (acc, item) => {
      acc[item.level] = { title: item.title, accent: item.accent };
      return acc;
    },
    {} as Record<CefrLevel, { title: string; accent: string }>
  );
