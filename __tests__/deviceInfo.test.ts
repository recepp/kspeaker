import { formatPlatformLabel } from '../src/platform/deviceInfoFormat';

describe('device information helpers', () => {
  it('formats known platforms for display', () => {
    expect(formatPlatformLabel('ios')).toBe('iOS');
    expect(formatPlatformLabel('android')).toBe('Android');
    expect(formatPlatformLabel('web')).toBe('web');
  });
});
