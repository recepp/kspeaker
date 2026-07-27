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
 * Apply shared TTS configuration once at app chat bootstrap.
 */
export async function configureTtsEngine(): Promise<void> {
  const defaults = getPlatformTtsDefaults();
  await Tts.setDefaultLanguage(defaults.language);

  const voices = (await Tts.voices()) as TtsVoiceLike[];
  const selected = selectOptimalVoice(voices);
  if (selected) {
    await Tts.setDefaultVoice(selected.id);
  }

  await Tts.setDefaultRate(defaults.rate);
  await Tts.setDefaultPitch(defaults.pitch);

  if (Platform.OS === 'ios') {
    try {
      await Tts.setDucking(true);
      await Tts.setIgnoreSilentSwitch('ignore');
    } catch {
      // Non-fatal on older iOS bridges
    }
  }
}
