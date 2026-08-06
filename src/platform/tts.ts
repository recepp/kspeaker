import Tts from 'react-native-tts';
import { Platform } from 'react-native';
import {
  getPlatformTtsDefaults,
  selectOptimalVoice,
  type TtsVoiceLike,
} from './ttsConfig';

export { getPlatformTtsDefaults, selectOptimalVoice };
export type { TtsVoiceLike };

/**
 * Apply shared TTS configuration for the current screen language.
 * Each step is isolated so a single native rejection does not block speech.
 */
export async function configureTtsEngine(uiLanguage: string = 'en'): Promise<void> {
  const defaults = getPlatformTtsDefaults(uiLanguage);

  try {
    await Tts.setDefaultLanguage(defaults.language);
  } catch (error) {
    console.warn('[TTS] setDefaultLanguage failed, using system default:', error);
  }

  try {
    const voices = (await Tts.voices()) as TtsVoiceLike[];
    const selected = selectOptimalVoice(voices, uiLanguage);
    if (selected) {
      await Tts.setDefaultVoice(selected.id);
    }
  } catch (error) {
    console.warn('[TTS] voice selection failed, using language default:', error);
  }

  try {
    await Tts.setDefaultRate(defaults.rate);
  } catch (error) {
    console.warn('[TTS] setDefaultRate failed:', error);
  }

  try {
    await Tts.setDefaultPitch(defaults.pitch);
  } catch (error) {
    console.warn('[TTS] setDefaultPitch failed:', error);
  }

  if (Platform.OS === 'ios') {
    try {
      await Tts.setDucking(true);
      await Tts.setIgnoreSilentSwitch('ignore');
    } catch {
      // Non-fatal on older iOS bridges
    }
  }
}
