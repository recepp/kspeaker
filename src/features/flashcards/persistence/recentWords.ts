import AsyncStorage from '@react-native-async-storage/async-storage';
import type { CefrLevel, FlashcardLanguageCode } from '../types';

const KEY = '@kspeaker/flashcard_recent_words_v1';
const MAX_WORDS = 60;

type Store = Record<string, string[]>;

function bucketKey(language: FlashcardLanguageCode, level: CefrLevel): string {
  return `${language}:${level}`;
}

async function readStore(): Promise<Store> {
  try {
    const raw = await AsyncStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? (parsed as Store) : {};
  } catch {
    return {};
  }
}

async function writeStore(store: Store): Promise<void> {
  try {
    await AsyncStorage.setItem(KEY, JSON.stringify(store));
  } catch {
    // non-fatal
  }
}

/** Words recently shown for this language+level (persisted across sessions). */
export async function loadRecentFlashcardWords(
  language: FlashcardLanguageCode,
  level: CefrLevel
): Promise<string[]> {
  const store = await readStore();
  return store[bucketKey(language, level)] || [];
}

export async function rememberFlashcardWords(
  language: FlashcardLanguageCode,
  level: CefrLevel,
  words: string[]
): Promise<string[]> {
  const store = await readStore();
  const key = bucketKey(language, level);
  const merged = [...words, ...(store[key] || [])];
  const seen = new Set<string>();
  const unique: string[] = [];
  for (const w of merged) {
    const normalized = w.trim();
    if (!normalized) continue;
    const lower = normalized.toLowerCase();
    if (seen.has(lower)) continue;
    seen.add(lower);
    unique.push(normalized);
    if (unique.length >= MAX_WORDS) break;
  }
  store[key] = unique;
  await writeStore(store);
  return unique;
}
