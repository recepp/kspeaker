import {
  getApiLanguageBody,
  getApiLanguageHeaders,
  getReplyLanguageLock,
} from '../src/shared/language/replyLanguageLock';
import { composeOutboundMessage } from '../src/shared/chat/replyStyle';

describe('replyLanguageLock', () => {
  it('locks Turkish replies when UI language is tr', () => {
    const lock = getReplyLanguageLock('tr');
    expect(lock).toContain('Turkish');
    expect(lock).toContain('Do NOT reply in English');
  });

  it('exposes BCP-47 locale in API headers and body', () => {
    expect(getApiLanguageHeaders('tr')['Accept-Language']).toContain('tr-TR');
    expect(getApiLanguageHeaders('tr')['X-Language']).toBe('tr');
    expect(getApiLanguageBody('tr')).toEqual({
      language: 'tr',
      response_language: 'tr',
      locale: 'tr-TR',
      reply_language: 'tr',
    });
  });
});

describe('composeOutboundMessage', () => {
  it('embeds language lock and style without altering user text prefix', () => {
    const outbound = composeOutboundMessage('Merhaba, nasılsın?', 'tr');
    expect(outbound.startsWith('Merhaba, nasılsın?')).toBe(true);
    expect(outbound).toContain('Language lock');
    expect(outbound).toContain('Türkçe');
    expect(outbound).toContain('Reply style');
  });
});
