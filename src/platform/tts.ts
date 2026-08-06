import Tts from 'react-native-tts';
import { Platform } from 'react-native';
import {
  getPlatformTtsDefaults,
  listVoiceCandidates,
  selectOptimalVoice,
  type TtsVoiceLike,
} from './ttsConfig';

export { getPlatformTtsDefaults, selectOptimalVoice, listVoiceCandidates };
export type { TtsVoiceLike };

/**
 * Apply shared TTS configuration for the current screen language.
 * Language-first; voice pick is best-effort and never blocks speech.
 */
export async function configureTtsEngine(uiLanguage: string = 'en'): Promise<void> {
  const defaults = getPlatformTtsDefaults(uiLanguage);

  try {
    await Tts.setDefaultLanguage(defaults.language);
  } catch (error) {
    console.warn('[TTS] setDefaultLanguage failed, continuing with voice probe:', error);
  }

  try {
    const voices = (await Tts.voices()) as TtsVoiceLike[];
    const candidates = listVoiceCandidates(voices, uiLanguage);
    let applied = false;
    for (const candidate of candidates.slice(0, 5)) {
      try {
        await Tts.setDefaultVoice(candidate.id);
        applied = true;
        if (__DEV__) {
          console.log(
            '[TTS] Voice set:',
            candidate.name,
            candidate.language,
            `q=${candidate.quality ?? '?'}`,
            `(${uiLanguage})`
          );
        }
        break;
      } catch {
        // try next installed voice
      }
    }
    if (!applied && __DEV__) {
      console.warn('[TTS] No setDefaultVoice candidate worked; using language default');
    }
  } catch (error) {
    console.warn('[TTS] voice selection failed, using language default:', error);
  }

  try {
    // skipTransform=true on Android so 0.5 stays mid-speed
    await Tts.setDefaultRate(defaults.rate, true);
  } catch (error) {
    console.warn('[TTS] setDefaultRate failed:', error);
  }

  try {
    await Tts.setDefaultPitch(defaults.pitch);
  } catch (error) {
    console.warn('[TTS] setDefaultPitch failed:', error);
  }

  try {
    // Android: request AudioFocus so TTS is audible after SpeechRecognizer.
    // iOS: ducking historically gated setActive; native patch also activates.
    await Tts.setDucking(true);
  } catch {
    // Non-fatal on older bridges
  }

  if (Platform.OS === 'ios') {
    try {
      await Tts.setIgnoreSilentSwitch('ignore');
    } catch {
      // Non-fatal
    }
  }
}
