import { getReplyLanguageLock } from '../language/replyLanguageLock';

/**
 * Light reply-style hint appended only to the outbound API payload
 * (not shown in the chat UI). Encourages occasional natural emoji use.
 */
const OCCASIONAL_EMOJI_STYLE =
  '[Reply style: sound natural. Occasionally use one relevant emoji when it fits; never spam emojis.]';

/**
 * Compose the outbound /generate text: user content + screen-language lock + style.
 * UI never shows these directives — they only travel on the wire.
 */
export function composeOutboundMessage(
  userText: string,
  uiLanguage: string
): string {
  const trimmed = userText.trim();
  if (!trimmed) return trimmed;

  return [trimmed, getReplyLanguageLock(uiLanguage), OCCASIONAL_EMOJI_STYLE].join(
    '\n\n'
  );
}

/** @deprecated use composeOutboundMessage — kept for call-site migration safety */
export function withOccasionalEmojiStyle(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return trimmed;
  if (trimmed.includes('[Reply style:')) return trimmed;
  return `${trimmed}\n\n${OCCASIONAL_EMOJI_STYLE}`;
}
