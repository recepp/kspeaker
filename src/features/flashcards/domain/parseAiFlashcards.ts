import {
  isValidFlashCard,
  normalizeFlashCard,
} from './flashcardScore';
import {
  normalizeFlashcardWordKey,
  type FlashcardLanguageProfile,
} from './languageProfile';
import type { FlashCard, FlashcardLanguageCode } from '../types';

/**
 * Extract a JSON array of flashcards from a free-form AI reply.
 * Tolerates markdown fences and leading/trailing prose.
 */
export function parseAiFlashcards(raw: string, limit: number): FlashCard[] {
  if (!raw || typeof raw !== 'string') return [];

  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced?.[1]?.trim() || trimmed;

  const arrayMatch = candidate.match(/\[[\s\S]*\]/);
  if (!arrayMatch) return [];

  let parsed: unknown;
  try {
    parsed = JSON.parse(arrayMatch[0]);
  } catch {
    return [];
  }

  if (!Array.isArray(parsed)) return [];

  const cards: FlashCard[] = [];
  for (const item of parsed) {
    if (!isValidFlashCard(item)) continue;
    cards.push(normalizeFlashCard(item as Record<string, unknown>));
    if (cards.length >= limit) break;
  }
  return cards;
}

export function buildFlashcardPrompt(input: {
  profile: FlashcardLanguageProfile;
  level: string;
  count: number;
  excludeWords?: string[];
  freshnessToken?: string;
  topicHint?: string;
}): string {
  const { profile } = input;
  const exclude =
    input.excludeWords && input.excludeWords.length > 0
      ? `Do NOT reuse any of these words: ${input.excludeWords.slice(0, 40).join(', ')}.`
      : 'Do not reuse the most common textbook starter words if avoidable.';

  const topic = input.topicHint
    ? `Prefer the topic cluster: ${input.topicHint}.`
    : 'Pick a random topic cluster this round.';

  const freshness = input.freshnessToken
    ? `Freshness id: ${input.freshnessToken} — invent a brand-new set; never copy a previous deck.`
    : 'Invent a brand-new set every time.';

  return [
    `Create exactly ${input.count} unique vocabulary flashcards for CEFR ${input.level}.`,
    `The learner is studying ${profile.targetLanguageName}.`,
    `Each "word" and "example" MUST be written in ${profile.targetLanguageName}.`,
    `Each "translation" MUST be written in ${profile.glossLanguageName}.`,
    profile.scriptHint,
    'Words must be level-appropriate and mutually different.',
    topic,
    exclude,
    freshness,
    'Return ONLY a valid JSON array, no markdown, no commentary, no transliteration of the word field.',
    'Schema: [{"word":"string","translation":"string","icon":"one emoji","example":"short sentence using the word"}]',
  ].join(' ');
}

const TOPIC_HINTS = [
  'food and cooking',
  'travel and transport',
  'work and study',
  'feelings and relationships',
  'nature and weather',
  'home and daily routines',
  'health and body',
  'technology and media',
  'shopping and money',
  'hobbies and sports',
  'city life',
  'time and planning',
] as const;

export function pickRandomTopicHint(random: () => number = Math.random): string {
  const index = Math.floor(random() * TOPIC_HINTS.length) % TOPIC_HINTS.length;
  return TOPIC_HINTS[index];
}

/** Drop cards whose word appeared in a recent deck (locale-aware). */
export function filterExcludedFlashcards(
  cards: FlashCard[],
  excludeWords: string[] | undefined,
  language: FlashcardLanguageCode = 'en'
): FlashCard[] {
  if (!excludeWords?.length) return cards;
  const banned = new Set(
    excludeWords
      .map((w) => normalizeFlashcardWordKey(w, language))
      .filter(Boolean)
  );
  return cards.filter(
    (c) => !banned.has(normalizeFlashcardWordKey(c.word, language))
  );
}
