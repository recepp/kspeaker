export type CefrLevel = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export type FlashcardLanguageCode = 'en' | 'tr' | 'ar' | 'ru';

export type FlashCard = {
  word: string;
  translation: string;
  icon: string;
  example: string;
};

export type FlashcardDeck = {
  language: FlashcardLanguageCode;
  level: CefrLevel;
  cards: FlashCard[];
  source: 'ai' | 'fallback';
};

export type FlashcardSessionPhase = 'loading' | 'challenge' | 'result' | 'error';

export type FlashcardScore = {
  correct: number;
  wrong: number;
  total: number;
  percentage: number;
};
