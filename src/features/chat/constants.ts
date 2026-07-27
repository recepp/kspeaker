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
