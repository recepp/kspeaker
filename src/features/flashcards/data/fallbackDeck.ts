import { FLASHCARD_DATA_EXTENDED } from '../../../../flashcardData';
import type { CefrLevel, FlashCard, FlashcardLanguageCode } from '../types';
import { FLASHCARD_DECK_SIZE } from '../constants';
import { isValidFlashCard, normalizeFlashCard } from '../domain/flashcardScore';
import { normalizeFlashcardWordKey } from '../domain/languageProfile';
import { TURKISH_FLASHCARD_POOL } from './pools/turkish';

function shuffle<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function normalizePool(raw: unknown[]): FlashCard[] {
  const out: FlashCard[] = [];
  for (const item of raw) {
    if (!isValidFlashCard(item)) continue;
    out.push(normalizeFlashCard(item as Record<string, unknown>));
  }
  return out;
}

function resolvePool(
  language: FlashcardLanguageCode,
  level: CefrLevel
): FlashCard[] {
  if (language === 'tr') {
    return TURKISH_FLASHCARD_POOL[level] || TURKISH_FLASHCARD_POOL.A1;
  }

  const langPool =
    FLASHCARD_DATA_EXTENDED[language] || FLASHCARD_DATA_EXTENDED.en;
  const levelPool =
    langPool?.[level] || langPool?.A1 || FLASHCARD_DATA_EXTENDED.en.A1 || [];
  return normalizePool(levelPool as unknown[]);
}

/**
 * Large local pool — used only when AI is unavailable.
 * Always shuffled so consecutive decks differ. All 4 languages supported.
 */
export function getFallbackDeck(
  language: FlashcardLanguageCode,
  level: CefrLevel,
  size: number = FLASHCARD_DECK_SIZE,
  excludeWords: string[] = []
): FlashCard[] {
  const banned = new Set(
    excludeWords
      .map((w) => normalizeFlashcardWordKey(w, language))
      .filter(Boolean)
  );

  const pool = resolvePool(language, level);
  const fresh = pool.filter(
    (c) => !banned.has(normalizeFlashcardWordKey(c.word, language))
  );
  const source = fresh.length >= size ? fresh : fresh.length > 0 ? fresh : pool;
  return shuffle(source).slice(0, Math.min(size, source.length));
}

/** True overlap ratio between two word lists (0–1). */
export function deckOverlapRatio(
  a: string[],
  b: string[],
  language: FlashcardLanguageCode = 'en'
): number {
  if (!a.length || !b.length) return 0;
  const setB = new Set(b.map((w) => normalizeFlashcardWordKey(w, language)));
  const hits = a.filter((w) =>
    setB.has(normalizeFlashcardWordKey(w, language))
  ).length;
  return hits / a.length;
}

/** Exposed for tests — pool size parity across languages. */
export function getFallbackPoolSize(
  language: FlashcardLanguageCode,
  level: CefrLevel
): number {
  return resolvePool(language, level).length;
}
