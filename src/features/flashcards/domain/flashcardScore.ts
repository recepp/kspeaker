import type { FlashCard, FlashcardScore } from '../types';

export function computeFlashcardScore(
  correct: number,
  wrong: number
): FlashcardScore {
  const safeCorrect = Math.max(0, correct);
  const safeWrong = Math.max(0, wrong);
  const total = safeCorrect + safeWrong;
  return {
    correct: safeCorrect,
    wrong: safeWrong,
    total,
    percentage: total === 0 ? 0 : Math.round((safeCorrect / total) * 100),
  };
}

export function isValidFlashCard(value: unknown): value is FlashCard {
  if (!value || typeof value !== 'object') return false;
  const card = value as Record<string, unknown>;
  return (
    typeof card.word === 'string' &&
    card.word.trim().length > 0 &&
    typeof card.translation === 'string' &&
    card.translation.trim().length > 0 &&
    typeof card.example === 'string' &&
    card.example.trim().length > 0
  );
}

export function normalizeFlashCard(raw: Record<string, unknown>): FlashCard {
  const icon =
    typeof raw.icon === 'string' && raw.icon.trim().length > 0
      ? raw.icon.trim()
      : '✨';
  return {
    word: String(raw.word).trim(),
    translation: String(raw.translation).trim(),
    icon,
    example: String(raw.example).trim(),
  };
}
