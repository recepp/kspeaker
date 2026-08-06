import { getSpeechLocale, getTtsLanguageTag, toResponseLanguage } from '../src/shared/language/appLanguageConfig';

describe('appLanguageConfig', () => {
  it('maps UI language to speech locales', () => {
    expect(getSpeechLocale('en')).toBe('en-US');
    expect(getSpeechLocale('tr')).toBe('tr-TR');
    expect(getSpeechLocale('ar')).toBe('ar-SA');
    expect(getSpeechLocale('ru')).toBe('ru-RU');
  });

  it('keeps TTS tags aligned with speech locales', () => {
    expect(getTtsLanguageTag('tr')).toBe(getSpeechLocale('tr'));
  });

  it('normalizes unknown languages to en', () => {
    expect(toResponseLanguage('de')).toBe('en');
  });
});
