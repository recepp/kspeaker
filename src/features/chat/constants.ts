export const CONVERSATION_MODES = [
  'conversation',
  'teacher',
  'beginner',
  'casual_friend',
  'strict',
  'roleplay',
  'business',
] as const;

export type ConversationMode = (typeof CONVERSATION_MODES)[number];

/** Ionicons name for each conversation mode (dropup + composer badge). */
export const CONVERSATION_MODE_ICONS: Record<ConversationMode, string> = {
  conversation: 'chatbubbles',
  teacher: 'school',
  beginner: 'leaf',
  casual_friend: 'happy',
  strict: 'shield-checkmark',
  roleplay: 'color-palette',
  business: 'briefcase',
};

export function getConversationModeIcon(
  mode: string | null | undefined
): string | null {
  if (!mode) return null;
  return CONVERSATION_MODE_ICONS[mode as ConversationMode] ?? null;
}
