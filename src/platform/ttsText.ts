/**
 * Preprocess assistant text for more natural on-device TTS.
 */
export function preprocessTextForTTS(text: string): string {
  let processed = text;

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
