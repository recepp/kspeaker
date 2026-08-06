import {
  AUDIO_HANDOFF,
  ANDROID_LISTEN_LOOP,
  androidEmptyRestartDelayMs,
  VOICE_AGGRESSIVE_DESTROY_PASSES,
} from '../src/shared/speech/audioPlatform';
import { LISTENING_POLICY } from '../src/shared/speech/listeningPolicy';
import {
  AndroidListenLoop,
  buildAndroidVoiceStartOptions,
} from '../src/platform/speech/androidSttEngine';

describe('audioPlatform handoff', () => {
  it('exposes finite handoff timings used by LISTENING_POLICY', () => {
    expect(AUDIO_HANDOFF.preTtsReleaseMs).toBeGreaterThan(0);
    expect(LISTENING_POLICY.preTtsReleaseMs).toBe(AUDIO_HANDOFF.preTtsReleaseMs);
  });

  it('limits aggressive destroy passes', () => {
    expect(VOICE_AGGRESSIVE_DESTROY_PASSES).toBeGreaterThanOrEqual(1);
    expect(VOICE_AGGRESSIVE_DESTROY_PASSES).toBeLessThanOrEqual(3);
  });
});

describe('ANDROID_LISTEN_LOOP anti-beep policy', () => {
  it('enforces a long min interval between Voice.start calls', () => {
    expect(ANDROID_LISTEN_LOOP.minStartIntervalMs).toBeGreaterThanOrEqual(3000);
    expect(ANDROID_LISTEN_LOOP.emptyRestartMs).toBeGreaterThanOrEqual(3000);
    expect(androidEmptyRestartDelayMs(1)).toBe(ANDROID_LISTEN_LOOP.emptyRestartMs);
  });

  it('omits Samsung-hostile silence extras', () => {
    const opts = buildAndroidVoiceStartOptions();
    expect(opts.EXTRA_PARTIAL_RESULTS).toBe(true);
    expect(opts.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS).toBeUndefined();
    expect(opts.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS).toBeUndefined();
  });

  it('coalesces duplicate empty segment ends into one restart owner', () => {
    AndroidListenLoop.clear();
    AndroidListenLoop.noteStarting();
    expect(AndroidListenLoop.noteEmptySegmentEnd('error')).toBe(true);
    expect(AndroidListenLoop.noteEmptySegmentEnd('end')).toBe(false);
    AndroidListenLoop.clear();
  });
});
