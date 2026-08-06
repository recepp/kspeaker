import { ELEVENLABS_FREE_TIER } from '../src/platform/speech/elevenLabsLimits';
import { ElevenLabsQuotaGate } from '../src/platform/speech/elevenLabsQuota';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

describe('ElevenLabs free-tier quota helpers', () => {
  it('documents free monthly credit budget', () => {
    expect(ELEVENLABS_FREE_TIER.monthlyCredits).toBe(10_000);
    expect(ELEVENLABS_FREE_TIER.preferredModelId).toBe('eleven_flash_v2_5');
    expect(ELEVENLABS_FREE_TIER.maxCharsPerRequest).toBe(2_500);
  });

  it('marks subscription empty when character budget is used up', () => {
    const snap = ElevenLabsQuotaGate.fromSubscription({
      character_count: 10_000,
      character_limit: 10_000,
      tier: 'free',
    });
    expect(snap.remaining).toBe(0);
    expect(snap.canUse).toBe(false);
  });

  it('allows synthesis when remaining characters exist', () => {
    const snap = ElevenLabsQuotaGate.fromSubscription({
      character_count: 1_200,
      character_limit: 10_000,
      tier: 'free',
    });
    expect(snap.remaining).toBe(8_800);
    expect(snap.canUse).toBe(true);
  });
});
