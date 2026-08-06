import {
  buildFlashcardPrompt,
  filterExcludedFlashcards,
  parseAiFlashcards,
} from '../src/features/flashcards/domain/parseAiFlashcards';
import {
  computeFlashcardScore,
  isValidFlashCard,
} from '../src/features/flashcards/domain/flashcardScore';
import {
  getFlashcardLanguageProfile,
  normalizeFlashcardWordKey,
  FLASHCARD_LANGUAGE_PROFILES,
} from '../src/features/flashcards/domain/languageProfile';
import { generateFlashcardDeck } from '../src/features/flashcards/services/generateFlashcardDeck';
import {
  deckOverlapRatio,
  getFallbackDeck,
  getFallbackPoolSize,
} from '../src/features/flashcards/data/fallbackDeck';
import { FLASHCARD_DECK_SIZE } from '../src/features/flashcards/constants';
import type { FlashcardLanguageCode } from '../src/features/flashcards/types';

describe('flashcard score', () => {
  it('computes percentage safely', () => {
    expect(computeFlashcardScore(4, 1).percentage).toBe(80);
    expect(computeFlashcardScore(0, 0).percentage).toBe(0);
  });
});

describe('language profiles (parity for en/tr/ar/ru)', () => {
  const codes: FlashcardLanguageCode[] = ['en', 'tr', 'ar', 'ru'];

  it('exposes all four study languages', () => {
    expect(Object.keys(FLASHCARD_LANGUAGE_PROFILES).sort()).toEqual(
      ['ar', 'en', 'ru', 'tr'].sort()
    );
  });

  it('defines gloss + script hints for every language', () => {
    for (const code of codes) {
      const p = getFlashcardLanguageProfile(code);
      expect(p.targetLanguageName.length).toBeGreaterThan(2);
      expect(p.glossLanguageName.length).toBeGreaterThan(2);
      expect(p.scriptHint.length).toBeGreaterThan(10);
      expect(p.structuredWireLanguage).toBe('en');
    }
  });

  it('marks only Arabic as RTL', () => {
    expect(getFlashcardLanguageProfile('ar').rtl).toBe(true);
    expect(getFlashcardLanguageProfile('en').rtl).toBe(false);
    expect(getFlashcardLanguageProfile('tr').rtl).toBe(false);
    expect(getFlashcardLanguageProfile('ru').rtl).toBe(false);
  });

  it('has a deep fallback pool for every language+level', () => {
    const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
    for (const code of codes) {
      for (const level of levels) {
        expect(getFallbackPoolSize(code, level)).toBeGreaterThanOrEqual(20);
      }
    }
  });
});

describe('normalizeFlashcardWordKey', () => {
  it('handles Turkish dotted/dotless i', () => {
    expect(normalizeFlashcardWordKey('İstanbul', 'tr')).toBe(
      normalizeFlashcardWordKey('istanbul', 'tr')
    );
  });
});

describe('parseAiFlashcards', () => {
  it('parses raw JSON arrays', () => {
    const cards = parseAiFlashcards(
      JSON.stringify([
        {
          word: 'Bright',
          translation: 'Parlak',
          icon: '☀️',
          example: 'The sun is bright.',
        },
      ]),
      5
    );
    expect(cards[0].word).toBe('Bright');
  });

  it('rejects conversational prose', () => {
    expect(
      parseAiFlashcards('Practice hello, water, and friend every day.', 5)
    ).toEqual([]);
  });
});

describe('buildFlashcardPrompt', () => {
  it('embeds target/gloss/script from profile (Arabic)', () => {
    const prompt = buildFlashcardPrompt({
      profile: getFlashcardLanguageProfile('ar'),
      level: 'A2',
      count: 5,
      freshnessToken: 'x1',
      topicHint: 'food and cooking',
    });
    expect(prompt).toContain('Modern Standard Arabic');
    expect(prompt).toContain('Turkish');
    expect(prompt).toContain('Arabic script');
    expect(prompt).toContain('food and cooking');
  });

  it('embeds Turkish diacritic hint', () => {
    const prompt = buildFlashcardPrompt({
      profile: getFlashcardLanguageProfile('tr'),
      level: 'B1',
      count: 5,
    });
    expect(prompt).toContain('Turkish');
    expect(prompt).toContain('English');
    expect(prompt).toContain('diacritics');
  });

  it('embeds Cyrillic hint for Russian', () => {
    const prompt = buildFlashcardPrompt({
      profile: getFlashcardLanguageProfile('ru'),
      level: 'A1',
      count: 5,
    });
    expect(prompt).toContain('Cyrillic');
  });
});

describe('filterExcludedFlashcards', () => {
  it('filters with locale-aware keys', () => {
    const kept = filterExcludedFlashcards(
      [
        { word: 'İstanbul', translation: 'Istanbul', icon: '🏙️', example: 'İstanbul güzel.' },
        { word: 'Ankara', translation: 'Ankara', icon: '🏛️', example: 'Ankara başkent.' },
      ],
      ['istanbul'],
      'tr'
    );
    expect(kept.map((c) => c.word)).toEqual(['Ankara']);
  });
});

describe('fallback deck diversity', () => {
  it('serves Turkish decks from dedicated pool', () => {
    const deck = getFallbackDeck('tr', 'A1', FLASHCARD_DECK_SIZE);
    expect(deck.length).toBe(FLASHCARD_DECK_SIZE);
    expect(deck[0].word.length).toBeGreaterThan(0);
  });

  it('serves Arabic and Russian decks', () => {
    expect(getFallbackDeck('ar', 'B1', 5).length).toBe(5);
    expect(getFallbackDeck('ru', 'C1', 5).length).toBe(5);
  });
});

describe('generateFlashcardDeck multilingual', () => {
  const makeCards = (words: string[]) =>
    JSON.stringify(
      words.map((word) => ({
        word,
        translation: `${word}_gloss`,
        icon: '✨',
        example: `Ex ${word}`,
      }))
    );

  it.each(['en', 'tr', 'ar', 'ru'] as FlashcardLanguageCode[])(
    'builds AI deck for %s',
    async (lang) => {
      const deck = await generateFlashcardDeck(lang, 'A1', {
        maxAttempts: 1,
        generateText: async (prompt) => {
          expect(prompt.length).toBeGreaterThan(40);
          return makeCards(['W1', 'W2', 'W3', 'W4', 'W5']);
        },
      });
      expect(deck.language).toBe(lang);
      expect(deck.source).toBe('ai');
      expect(deck.cards).toHaveLength(5);
    }
  );

  it('wires structured generate as English regardless of study language', async () => {
    let wireLang = '';
    await generateFlashcardDeck('ar', 'A1', {
      maxAttempts: 1,
      generateText: async (_p, _m, uiLanguage) => {
        wireLang = uiLanguage;
        return makeCards(['كتاب', 'قلم', 'مدرسة', 'بيت', 'ماء']);
      },
    });
    expect(wireLang).toBe('en');
  });

  it('keeps two decks distinct when excludes are applied', async () => {
    const first = await generateFlashcardDeck('ru', 'A1', {
      maxAttempts: 1,
      generateText: async () =>
        makeCards(['Один', 'Два', 'Три', 'Четыре', 'Пять']),
    });
    const second = await generateFlashcardDeck('ru', 'A1', {
      excludeWords: first.cards.map((c) => c.word),
      maxAttempts: 1,
      generateText: async () =>
        makeCards(['Шесть', 'Семь', 'Восемь', 'Девять', 'Десять']),
    });
    expect(
      deckOverlapRatio(
        first.cards.map((c) => c.word),
        second.cards.map((c) => c.word),
        'ru'
      )
    ).toBe(0);
  });
});

describe('flashcard validation', () => {
  it('accepts complete cards', () => {
    expect(
      isValidFlashCard({
        word: 'hello',
        translation: 'merhaba',
        example: 'Hello there',
      })
    ).toBe(true);
  });
});
