import Voice from '@react-native-community/voice';
import { ANDROID_LISTEN_LOOP } from '../../shared/speech/audioPlatform';

export type AndroidRestartReason = 'empty' | 'client_glitch';

/**
 * Android STT transport + continuous-segment coordinator (SRP).
 *
 * iOS keeps one SFSpeech session open. Android SpeechRecognizer is one-shot and
 * plays system start/stop tones. Restarting every few hundred ms creates a beep
 * loop. This coordinator:
 *  - never cancel()/stop() between segments (Voice.start replaces the instance)
 *  - coalesces onError + onSpeechEnd into a single restart
 *  - enforces a minimum gap between Voice.start calls (stops beep spam)
 *  - omits EXTRA_SPEECH_INPUT_* (Samsung often ends instantly when they are set)
 */
export function buildAndroidVoiceStartOptions(): Record<
  string,
  string | number | boolean
> {
  return {
    EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
    EXTRA_MAX_RESULTS: 5,
    EXTRA_PARTIAL_RESULTS: true,
    REQUEST_PERMISSIONS_AUTO: true,
  };
}

export async function startAndroidRecognition(locale: string): Promise<void> {
  AndroidListenLoop.noteStarting();
  await Voice.start(locale, buildAndroidVoiceStartOptions());
}

export async function restartAndroidRecognition(locale: string): Promise<void> {
  await startAndroidRecognition(locale);
}

type RestartHandler = (
  reason: AndroidRestartReason
) => void | Promise<void>;

/**
 * Single-flight segment lifecycle for Android one-shot STT.
 */
class AndroidListenLoopCoordinator {
  private segmentOpen = false;
  private restartQueued = false;
  private lastStartAt = 0;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private onRestart: RestartHandler | null = null;

  setRestartHandler(handler: RestartHandler | null): void {
    this.onRestart = handler;
  }

  clear(): void {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.restartQueued = false;
    this.segmentOpen = false;
  }

  noteStarting(): void {
    this.lastStartAt = Date.now();
    this.segmentOpen = true;
    this.restartQueued = false;
  }

  /**
   * @returns true if this call owns the empty-end (caller should schedule restart)
   */
  noteEmptySegmentEnd(_source: 'error' | 'end'): boolean {
    if (!this.segmentOpen) {
      // Duplicate end/error for same segment — ignore
      return false;
    }
    this.segmentOpen = false;
    return true;
  }

  /**
   * Queue at most one restart; delay respects min gap since last Voice.start.
   */
  queueRestart(reason: AndroidRestartReason): void {
    if (this.restartQueued || !this.onRestart) return;
    this.restartQueued = true;

    const sinceStart = Date.now() - this.lastStartAt;
    const minGap = ANDROID_LISTEN_LOOP.minStartIntervalMs;
    const base =
      reason === 'client_glitch'
        ? ANDROID_LISTEN_LOOP.clientGlitchRestartMs
        : ANDROID_LISTEN_LOOP.emptyRestartMs;
    const delay = Math.max(base, minGap - sinceStart, 0);

    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = null;
      const handler = this.onRestart;
      // Allow a future queue after this restart attempt begins
      this.restartQueued = false;
      void handler?.(reason);
    }, delay);
  }
}

export const AndroidListenLoop = new AndroidListenLoopCoordinator();
