import RNFS from 'react-native-fs';
import { isNativeSoundAvailable } from './nativeSoundAvailability';

type PlayHandlers = {
  onStart?: () => void;
  onFinish?: () => void;
  onError?: (error: Error) => void;
};

type SoundConstructor = new (
  filename: string,
  basePath: string,
  onError: (error: string) => void
) => {
  play: (cb: (success: boolean) => void) => void;
  stop: (cb?: () => void) => void;
  release: () => void;
  setVolume: (value: number) => void;
};

type SoundModule = SoundConstructor & {
  setCategory: (value: string, mixWithOthers?: boolean) => void;
};

function loadSoundModule(): SoundModule | null {
  if (!isNativeSoundAvailable()) return null;
  try {
    // Lazy require — package constructs NativeEventEmitter on load
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require('react-native-sound');
    const Sound = (mod.default || mod) as SoundModule;
    try {
      // Android: STREAM_MUSIC + audio focus; iOS: Playback category.
      // mixWithOthers=false so SpeechRecognizer / other apps duck.
      Sound.setCategory('Playback', false);
    } catch {
      try {
        Sound.setCategory('Playback');
      } catch {
        // non-fatal
      }
    }
    return Sound;
  } catch (error) {
    if (__DEV__) {
      console.warn('[Audio] Failed to load react-native-sound:', error);
    }
    return null;
  }
}

/**
 * Thin MP3 file player for ElevenLabs audio (SRP).
 * Never imports Sound at module top-level — prevents NativeEventEmitter crash
 * when the app binary was not rebuilt / RNSound is missing.
 */
class AudioFilePlayer {
  private sound: InstanceType<SoundConstructor> | null = null;
  private tempPath: string | null = null;

  isAvailable(): boolean {
    return isNativeSoundAvailable();
  }

  async stop(): Promise<void> {
    const current = this.sound;
    this.sound = null;
    if (current) {
      try {
        current.stop(() => {
          current.release();
        });
      } catch {
        try {
          current.release();
        } catch {
          // ignore
        }
      }
    }
    await this.cleanupTemp();
  }

  async playBase64Mp3(base64: string, handlers: PlayHandlers = {}): Promise<void> {
    const Sound = loadSoundModule();
    if (!Sound) {
      const err = new Error('RNSound native module unavailable');
      handlers.onError?.(err);
      throw err;
    }

    await this.stop();

    const path = `${RNFS.CachesDirectoryPath}/kspeaker-el-${Date.now()}.mp3`;
    this.tempPath = path;
    await RNFS.writeFile(path, base64, 'base64');

    await new Promise<void>((resolve, reject) => {
      const sound = new Sound(path, '', (error) => {
        if (error) {
          const err = new Error(String(error));
          handlers.onError?.(err);
          reject(err);
          return;
        }

        this.sound = sound;
        try {
          sound.setVolume(1.0);
        } catch {
          // ignore
        }
        handlers.onStart?.();

        sound.play((success) => {
          try {
            sound.release();
          } catch {
            // ignore
          }
          if (this.sound === sound) {
            this.sound = null;
          }
          this.cleanupTemp().finally(() => {
            if (success) {
              handlers.onFinish?.();
              resolve();
            } else {
              const err = new Error('Audio playback failed');
              handlers.onError?.(err);
              reject(err);
            }
          });
        });
      });
    });
  }

  private async cleanupTemp(): Promise<void> {
    const path = this.tempPath;
    this.tempPath = null;
    if (!path) return;
    try {
      const exists = await RNFS.exists(path);
      if (exists) await RNFS.unlink(path);
    } catch {
      // ignore
    }
  }
}

export const audioFilePlayer = new AudioFilePlayer();
