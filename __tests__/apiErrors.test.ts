import {
  getErrorDisplayMessage,
  resolveApiErrorKey,
} from '../src/shared/chat/resolveApiErrorMessage';

describe('resolveApiErrorMessage', () => {
  const t = (key: string) => key;

  it('maps network failures', () => {
    expect(resolveApiErrorKey(new Error('Network request failed'))).toBe('networkError');
  });

  it('maps quota errors', () => {
    expect(resolveApiErrorKey(new Error('QUOTA_EXCEEDED'))).toBe('quotaMessage');
  });

  it('returns short custom backend text when available', () => {
    expect(getErrorDisplayMessage(new Error('Custom short backend note'), t)).toBe(
      'Custom short backend note'
    );
  });

  it('falls back to translation key for unknown errors', () => {
    expect(getErrorDisplayMessage(new Error('API_ERROR_500'), t)).toBe('approvalMessage');
  });
});
