import Tts from 'react-native-tts';
import { Platform } from 'react-native';

type DeviceHandlers = {
  onStart?: () => void;
  onFinish?: () => void;
  onCancel?: () => void;
};

async function stopWithTimeout(ms = 400): Promise<void> {
  await Promise.race([
    Tts.stop(false).catch(() => undefined),
    new Promise<void>((r) => setTimeout(r, ms)),
  ]);
}

/**
 * Device TTS adapter (SRP). One-shot listeners + watchdog so conversation
 * never stays stuck on "processing" if native finish events are missed.
 */
export async function speakWithDeviceTts(
  text: string,
  handlers: DeviceHandlers = {}
): Promise<void> {
  // Android needs AudioFocus (setDucking); iOS also needs silent-switch ignore.
  try {
    await Tts.setDucking(true);
  } catch {
    // older bridges
  }
  if (Platform.OS === 'ios') {
    try {
      await Tts.setIgnoreSilentSwitch('ignore');
    } catch {
      // older bridges
    }
  }

  await stopWithTimeout();
  await new Promise<void>((r) => setTimeout(r, Platform.OS === 'android' ? 50 : 80));

  await new Promise<void>((resolve) => {
    let settled = false;
    let watchdog: ReturnType<typeof setTimeout> | null = null;
    let started = false;

    const cleanup = () => {
      try {
        Tts.removeEventListener('tts-start', onStart);
        Tts.removeEventListener('tts-finish', onFinish);
        Tts.removeEventListener('tts-cancel', onCancel);
      } catch {
        // older bridges
      }
    };

    const finish = (kind: 'finish' | 'cancel') => {
      if (settled) return;
      settled = true;
      if (watchdog) clearTimeout(watchdog);
      cleanup();
      if (kind === 'finish') handlers.onFinish?.();
      else handlers.onCancel?.();
      resolve();
    };

    const onStart = () => {
      started = true;
      handlers.onStart?.();
    };
    const onFinish = () => finish('finish');
    const onCancel = () => finish('cancel');

    // UI leaves "processing" immediately
    handlers.onStart?.();

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);

    const watchdogMs = Math.min(60_000, Math.max(5_000, 2_000 + text.length * 60));
    watchdog = setTimeout(() => {
      if (__DEV__) {
        console.warn(
          '[TTS] Device finish watchdog — forcing onFinish',
          started ? '(started)' : '(never started)'
        );
      }
      finish('finish');
    }, watchdogMs);

    try {
      if (__DEV__) console.log('[TTS] Tts.speak len=', text.length);
      const maybePromise = Tts.speak(text) as void | Promise<void>;
      if (maybePromise && typeof (maybePromise as Promise<void>).then === 'function') {
        (maybePromise as Promise<void>).catch((err) => {
          if (__DEV__) console.warn('[TTS] Tts.speak rejected:', err);
          finish('cancel');
        });
      }
    } catch (err) {
      if (__DEV__) console.warn('[TTS] Tts.speak threw:', err);
      finish('cancel');
    }
  });
}

export async function stopDeviceTts(): Promise<void> {
  await stopWithTimeout();
}
