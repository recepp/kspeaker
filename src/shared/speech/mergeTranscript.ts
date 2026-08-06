/**
 * Merge STT hypotheses without losing earlier words when partials regress.
 * Prefer growth / longer stable text over shorter replacements.
 */
export function mergeTranscript(current: string, incoming: string): string {
  const next = (incoming || '').trim();
  if (!next) return current;
  if (!current) return next;
  if (next === current) return current;

  // Continuations: recognizer appended more words
  if (next.startsWith(current)) return next;
  // Regression: keep the longer committed text
  if (current.startsWith(next)) return current;

  const currentNorm = normalizeForCompare(current);
  const nextNorm = normalizeForCompare(next);

  if (nextNorm.startsWith(currentNorm)) return next.length >= current.length ? next : current;
  if (currentNorm.startsWith(nextNorm)) return current;

  // Alternative hypothesis — keep the longer one (usually more complete)
  if (next.length > current.length) return next;
  return current;
}

export function pickBestHypothesis(values?: string[] | null): string {
  if (!values?.length) return '';
  let best = '';
  for (const value of values) {
    const trimmed = (value || '').trim();
    if (trimmed.length > best.length) best = trimmed;
  }
  return best;
}

function normalizeForCompare(text: string): string {
  return text.toLowerCase().replace(/\s+/g, ' ').trim();
}
