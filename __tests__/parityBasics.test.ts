import { canSendWithQuota, nextMessageCount, FREE_DAILY_MESSAGE_LIMIT } from '../src/shared/quota';
import { selectOptimalVoice, getPlatformTtsDefaults } from '../src/platform/ttsConfig';

describe('quota policy', () => {
  it('allows unlimited messages when voucher exists', () => {
    expect(
      canSendWithQuota({ hasVoucher: true, messageCount: 100 })
    ).toBe(true);
  });

  it('blocks free users at daily limit', () => {
    expect(
      canSendWithQuota({
        hasVoucher: false,
        messageCount: FREE_DAILY_MESSAGE_LIMIT,
      })
    ).toBe(false);
  });

  it('allows free users under daily limit', () => {
    expect(
      canSendWithQuota({ hasVoucher: false, messageCount: 4 })
    ).toBe(true);
  });

  it('increments message count safely', () => {
    expect(nextMessageCount(0)).toBe(1);
    expect(nextMessageCount(-1)).toBe(1);
  });
});

describe('tts voice selection', () => {
  it('returns shared conversational defaults', () => {
    const defaults = getPlatformTtsDefaults();
    expect(defaults.rate).toBe(0.5);
    expect(defaults.pitch).toBe(1.0);
    expect(defaults.language).toBe('en-US');
  });

  it('prefers known high-quality English voices', () => {
    const selected = selectOptimalVoice([
      { id: '1', name: 'Robot', language: 'en-US' },
      { id: '2', name: 'Samantha (Enhanced)', language: 'en-US', quality: 500 },
    ]);
    expect(selected?.id).toBe('2');
  });

  it('returns null for empty voice list', () => {
    expect(selectOptimalVoice([])).toBeNull();
  });
});
