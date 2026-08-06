import { detectResponseLanguage } from '../src/shared/language/detectResponseLanguage';

describe('detectResponseLanguage', () => {
  it('detects English', () => {
    expect(detectResponseLanguage('How are you today?')).toBe('en');
  });

  it('detects Turkish via special characters', () => {
    expect(detectResponseLanguage('Merhaba, nasılsın?')).toBe('tr');
  });

  it('detects Turkish via common words without special chars', () => {
    expect(detectResponseLanguage('bugun hava cok guzel ve ben mutluyum')).toBe('tr');
  });

  it('detects Arabic script', () => {
    expect(detectResponseLanguage('مرحبا كيف حالك')).toBe('ar');
  });

  it('detects Cyrillic / Russian', () => {
    expect(detectResponseLanguage('Привет, как дела?')).toBe('ru');
  });

  it('uses fallback for empty text', () => {
    expect(detectResponseLanguage('', 'tr')).toBe('tr');
  });
});
