import { FLASHCARD_DECK_SIZE } from '../constants';
import {
  deckOverlapRatio,
  getFallbackDeck,
} from '../data/fallbackDeck';
import { getFlashcardLanguageProfile } from '../domain/languageProfile';
import {
  buildFlashcardPrompt,
  filterExcludedFlashcards,
  parseAiFlashcards,
  pickRandomTopicHint,
} from '../domain/parseAiFlashcards';
import type {
  CefrLevel,
  FlashCard,
  FlashcardDeck,
  FlashcardLanguageCode,
} from '../types';

export type GenerateFlashcardDeckDeps = {
  generateText?: (
    prompt: string,
    mode: string | undefined,
    uiLanguage: string
  ) => Promise<string>;
  excludeWords?: string[];
  topicHint?: string;
  freshnessToken?: string;
  maxAttempts?: number;
};

function wordsOf(cards: FlashCard[]): string[] {
  return cards.map((c) => c.word);
}

function pickCards(
  parsed: FlashCard[],
  excludeWords: string[] | undefined,
  count: number,
  language: FlashcardLanguageCode
): FlashCard[] {
  const filtered = filterExcludedFlashcards(parsed, excludeWords, language);
  if (filtered.length >= Math.min(3, count)) {
    return filtered.slice(0, count);
  }
  if (filtered.length > 0) {
    return filtered.slice(0, count);
  }
  return [];
}

/**
 * AI-first deck factory for all study languages (en/tr/ar/ru).
 * Uses language profiles + structured generate (English wire language).
 */
export async function generateFlashcardDeck(
  language: FlashcardLanguageCode,
  level: CefrLevel,
  deps: GenerateFlashcardDeckDeps = {}
): Promise<FlashcardDeck> {
  const profile = getFlashcardLanguageProfile(language);
  const generateText =
    deps.generateText ??
    (async (prompt: string, _mode: string | undefined, _uiLanguage: string) => {
      const { sendStructuredGenerate } = await import('../../../../api');
      // Always wire as English so AR/TR/RU reply-locks don't break JSON output
      return sendStructuredGenerate(prompt, profile.structuredWireLanguage);
    });

  const count = FLASHCARD_DECK_SIZE;
  const maxAttempts = deps.maxAttempts ?? 2;
  const excludeWords = deps.excludeWords || [];
  let lastCards: FlashCard[] = [];

  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const freshnessToken =
      deps.freshnessToken && attempt === 0
        ? deps.freshnessToken
        : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}-a${attempt}`;
    const topicHint =
      deps.topicHint && attempt === 0
        ? deps.topicHint
        : pickRandomTopicHint();

    const prompt = buildFlashcardPrompt({
      profile,
      level,
      count: count + 2,
      excludeWords,
      freshnessToken,
      topicHint,
    });

    try {
      const raw = await generateText(
        prompt,
        'utility',
        profile.structuredWireLanguage
      );
      const parsed = parseAiFlashcards(raw, count + 6);
      const cards = pickCards(parsed, excludeWords, count, language);
      lastCards = cards;

      if (cards.length < Math.min(3, count)) {
        if (__DEV__) {
          console.warn(
            '[Flashcards] AI parse/filter too thin — retry',
            language,
            cards.length
          );
        }
        continue;
      }

      const overlap = deckOverlapRatio(
        wordsOf(cards),
        excludeWords,
        language
      );
      if (
        excludeWords.length >= count &&
        overlap > 0.6 &&
        attempt < maxAttempts - 1
      ) {
        if (__DEV__) {
          console.warn(
            '[Flashcards] High overlap — retry',
            language,
            overlap
          );
        }
        continue;
      }

      return {
        language,
        level,
        cards: cards.slice(0, count),
        source: 'ai',
      };
    } catch (error) {
      if (__DEV__) {
        console.warn('[Flashcards] AI attempt failed:', language, error);
      }
    }
  }

  if (lastCards.length >= Math.min(3, count)) {
    return {
      language,
      level,
      cards: lastCards.slice(0, count),
      source: 'ai',
    };
  }

  return {
    language,
    level,
    cards: getFallbackDeck(language, level, count, excludeWords),
    source: 'fallback',
  };
}
