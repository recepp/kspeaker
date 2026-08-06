/**
 * Preprocess assistant text for more natural on-device TTS.
 * Strips emoji so speech engines don't read glyph names aloud.
 */
export function preprocessTextForTTS(text: string): string {
  let processed = text;

  // Common emoji / pictograph ranges (Hermes-safe without requiring \p{})
  processed = processed.replace(
    /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}\u{FE00}-\u{FE0F}\u{200D}]/gu,
    ''
  );
  processed = processed.replace(/\s{2,}/g, ' ');

  processed = processed.replace(/\bDr\./gi, 'Doctor');
  processed = processed.replace(/\bMr\./gi, 'Mister');
  processed = processed.replace(/\bMrs\./gi, 'Missus');
  processed = processed.replace(/\bMs\./gi, 'Miss');
  processed = processed.replace(/\bProf\./gi, 'Professor');
  processed = processed.replace(/\be\.g\./gi, 'for example');
  processed = processed.replace(/\bi\.e\./gi, 'that is');
  processed = processed.replace(/\betc\./gi, 'et cetera');

  return processed.trim();
}
