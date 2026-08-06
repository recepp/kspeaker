import Voice from '@react-native-community/voice';
import { LISTENING_POLICY } from '../../shared/speech/listeningPolicy';

/**
 * Optional Voice session hooks (registered by speech.ts).
 * Keeps mic release in the platform layer (SRP) without circular imports.
 */
export type MicSessionHooks = {
  setSuppressingErrors?: (value: boolean) => void;
  clearPendingEnd?: () => void;
  setListening?: (value: boolean) => void;
  onWarning?: (message: string, error?: unknown) => void;
};

let sessionHooks: MicSessionHooks = {};

/** Wired once from speech.ts so STT state stays consistent during TTS handoff. */
export function registerMicSessionHooks(hooks: MicSessionHooks): void {
  sessionHooks = hooks;
}

/**
 * Stop SpeechRecognizer / Voice so device or premium TTS can take audio focus.
 * Shared by iOS + Android (Android settles faster via AUDIO_HANDOFF timings).
 */
export async function releaseMicForPlayback(): Promise<void> {
  try {
    sessionHooks.setSuppressingErrors?.(true);
    sessionHooks.clearPendingEnd?.();
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
    sessionHooks.setListening?.(false);
    await new Promise<void>((r) =>
      setTimeout(r, LISTENING_POLICY.preTtsReleaseMs)
    );
  } catch (error) {
    sessionHooks.onWarning?.('releaseMicForPlayback failed (continuing)', error);
  } finally {
    sessionHooks.setSuppressingErrors?.(false);
  }
}
