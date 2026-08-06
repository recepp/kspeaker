import Voice from '@react-native-community/voice';
import { preprocessTextForTTS } from '../ttsText';
import { LISTENING_POLICY } from '../../shared/speech/listeningPolicy';
import { speakWithDeviceTts, stopDeviceTts } from './deviceTts';

export type SpeakReplyHandlers = {
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
};

let speakGeneration = 0;

async function releaseMicForPlayback(): Promise<void> {
  try {
    try {
      await Voice.stop();
    } catch {
      // ignore if not recognizing
    }
    try {
      await Voice.cancel();
    } catch {
      // ignore
    }
  } catch {
    // ignore
  }
  await new Promise<void>((r) =>
    setTimeout(r, LISTENING_POLICY.preTtsReleaseMs)
  );
}

/** Stop engines only — does NOT cancel the in-flight speakReply generation. */
async function stopActivePlayback(): Promise<void> {
  await stopDeviceTts();
  await new Promise<void>((r) => setTimeout(() => r(), 60));
}

/**
 * Speak assistant reply via device TTS (reliable path).
 * ElevenLabs stays off until Railway `/tts` is live.
 */
export async function speakReply(
  text: string,
  _uiLanguage: string,
  handlers: SpeakReplyHandlers = {}
): Promise<void> {
  const processed = preprocessTextForTTS(text);
  if (!processed) {
    handlers.onFinish?.();
    return;
  }

  const generation = ++speakGeneration;
  await releaseMicForPlayback();
  if (generation !== speakGeneration) return;

  await stopActivePlayback();
  if (generation !== speakGeneration) return;

  if (__DEV__) {
    console.log('[Speech] Device TTS speaking…', processed.slice(0, 64));
  }

  await speakWithDeviceTts(processed, {
    onStart: () => {
      if (generation === speakGeneration) handlers.onStart?.();
    },
    onFinish: () => {
      if (generation === speakGeneration) handlers.onFinish?.();
    },
    onCancel: () => {
      if (generation === speakGeneration) handlers.onCancel?.();
    },
  });
}

/** User/system cancel — invalidates in-flight speakReply and stops audio. */
export async function stopSpeaking(): Promise<void> {
  speakGeneration += 1;
  await stopActivePlayback();
}
