import Voice from '@react-native-community/voice';
import { preprocessTextForTTS } from '../ttsText';
import { LISTENING_POLICY } from '../../shared/speech/listeningPolicy';
import { speakWithDeviceTts, stopDeviceTts } from './deviceTts';
import { elevenLabsClient } from './elevenLabsClient';
import { isNativeSoundAvailable } from './nativeSoundAvailability';

export type SpeakReplyHandlers = {
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
};

let speakGeneration = 0;
let audioPlayerPromise: Promise<typeof import('./audioPlayer')> | null = null;

async function getAudioPlayer() {
  if (!audioPlayerPromise) {
    audioPlayerPromise = import('./audioPlayer');
  }
  try {
    const mod = await audioPlayerPromise;
    if (!mod.audioFilePlayer.isAvailable() && !isNativeSoundAvailable()) {
      return null;
    }
    return mod.audioFilePlayer;
  } catch (error) {
    audioPlayerPromise = null;
    if (__DEV__) console.warn('[Speech] audioPlayer import failed:', error);
    return null;
  }
}

async function releaseMicForPlayback(): Promise<void> {
  try {
    try {
      await Voice.stop();
    } catch {
      // ignore
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
  const stops: Promise<void>[] = [stopDeviceTts()];
  if (audioPlayerPromise) {
    stops.push(
      audioPlayerPromise
        .then((mod) => mod.audioFilePlayer.stop())
        .catch(() => undefined)
        .then(() => undefined)
    );
  }
  await Promise.all(stops);
  await new Promise<void>((r) => setTimeout(() => r(), 80));
}

/**
 * Prefer Railway ElevenLabs (premium); always fall back to device TTS.
 */
export async function speakReply(
  text: string,
  uiLanguage: string,
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

  const stillCurrent = () => generation === speakGeneration;

  const runDevice = async () => {
    if (!stillCurrent()) return;
    if (__DEV__) console.log('[Speech] Device TTS speaking…');
    await speakWithDeviceTts(processed, {
      onStart: () => {
        if (stillCurrent()) handlers.onStart?.();
      },
      onFinish: () => {
        if (stillCurrent()) handlers.onFinish?.();
      },
      onCancel: () => {
        if (stillCurrent()) handlers.onCancel?.();
      },
    });
  };

  // Premium needs native Sound to play the MP3 returned by Railway
  if (!isNativeSoundAvailable()) {
    if (__DEV__) {
      console.warn(
        '[Speech] RNSound missing — premium TTS skipped (rebuild app with pods)'
      );
    }
    await runDevice();
    return;
  }

  // Leave "processing" while we fetch; real audio start may come from player
  handlers.onStart?.();

  const synth = await Promise.race([
    elevenLabsClient.synthesize(processed, uiLanguage),
    new Promise<Awaited<ReturnType<typeof elevenLabsClient.synthesize>>>(
      (resolve) =>
        setTimeout(
          () => resolve({ ok: false, reason: 'network' as const }),
          8_000
        )
    ),
  ]);

  if (!stillCurrent()) return;

  if (!synth.ok) {
    if (__DEV__) {
      console.log(
        '[Speech] ElevenLabs unavailable → device TTS:',
        synth.reason,
        'status' in synth ? synth.status : ''
      );
    }
    await runDevice();
    return;
  }

  const player = await getAudioPlayer();
  if (!player || !stillCurrent()) {
    await runDevice();
    return;
  }

  try {
    if (__DEV__) console.log('[Speech] Premium ElevenLabs speaking…');
    await Promise.race([
      player.playBase64Mp3(synth.audioBase64, {
        onStart: () => {
          if (stillCurrent()) handlers.onStart?.();
        },
        onFinish: () => {
          if (stillCurrent()) handlers.onFinish?.();
        },
        onError: () => {},
      }),
      new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('ElevenLabs play timeout')), 45_000);
      }),
    ]);
  } catch (error) {
    if (!stillCurrent()) return;
    if (__DEV__) {
      console.warn('[Speech] ElevenLabs playback failed → device TTS', error);
    }
    await runDevice();
  }
}

/** User/system cancel — invalidates in-flight speakReply and stops audio. */
export async function stopSpeaking(): Promise<void> {
  speakGeneration += 1;
  await stopActivePlayback();
}
