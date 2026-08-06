import { getTranslation } from '../utils/translations';

describe('shared translations', () => {
  it('returns localized drawer keys', () => {
    expect(getTranslation('faq', 'tr')).toContain('Sorulan');
    expect(getTranslation('deleteAccount', 'en')).toBe('Delete Account');
    expect(getTranslation('deviceInformation', 'en')).toBe('Device Information');
    expect(getTranslation('copyDeviceId', 'tr')).toContain('Kopyala');
  });

  it('falls back to english for unknown language entry usage', () => {
    expect(getTranslation('settings', 'en')).toBe('Settings');
  });

  it('returns key when translation missing', () => {
    expect(getTranslation('notARealKey', 'en')).toBe('notARealKey');
  });
});
