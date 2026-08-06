export type ResponseLanguage = 'en' | 'tr' | 'ar' | 'ru';

const ARABIC_RE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/;
const CYRILLIC_RE = /[\u0400-\u04FF]/;
const TURKISH_CHARS_RE = /[ğüşıöçĞÜŞİÖÇ]/;
const LATIN_RE = /[A-Za-z]/;

/** Cheap Turkish cue words (ASCII-friendly forms included). */
const TR_HINTS =
  /\b(ve|bir|bu|ne|mi|mu|mü|için|icin|çok|cok|var|yok|ben|sen|nasıl|nasil|merhaba|teşekkür|tesekkur|evet|hayır|hayir|neden|şimdi|simdi|güzel|guzel|lütfen|lutfen)\b/i;

/** Cheap English cue words. */
const EN_HINTS =
  /\b(the|and|you|are|is|what|how|please|hello|thanks|thank|yes|no|with|this|that|have|will|can|would|could)\b/i;

/**
 * Detect reply language from user text.
 * Pure, sync, O(n) over a short sample — safe on the send hot path.
 */
export function detectResponseLanguage(
  text: string,
  fallback: ResponseLanguage = 'en'
): ResponseLanguage {
  const sample = text.trim().slice(0, 480);
  if (!sample) return fallback;

  let arabic = 0;
  let cyrillic = 0;
  let turkishChars = 0;
  let latin = 0;

  for (let i = 0; i < sample.length; i++) {
    const ch = sample[i];
    if (ARABIC_RE.test(ch)) arabic += 1;
    else if (CYRILLIC_RE.test(ch)) cyrillic += 1;
    else if (TURKISH_CHARS_RE.test(ch)) turkishChars += 1;
    else if (LATIN_RE.test(ch)) latin += 1;
  }

  const scriptTotal = arabic + cyrillic + turkishChars + latin;
  if (scriptTotal === 0) return fallback;

  if (arabic >= cyrillic && arabic >= latin && arabic >= turkishChars && arabic > 0) {
    return 'ar';
  }
  if (cyrillic >= arabic && cyrillic >= latin && cyrillic >= turkishChars && cyrillic > 0) {
    return 'ru';
  }
  if (turkishChars > 0) {
    return 'tr';
  }

  // Latin-only: disambiguate TR vs EN with tiny word hints (no I/O).
  if (latin > 0) {
    const trHits = sample.match(TR_HINTS)?.length ?? 0;
    const enHits = sample.match(EN_HINTS)?.length ?? 0;
    if (trHits > enHits) return 'tr';
    if (enHits > trHits) return 'en';
  }

  return fallback;
}

export function isResponseLanguage(value: string): value is ResponseLanguage {
  return value === 'en' || value === 'tr' || value === 'ar' || value === 'ru';
}
