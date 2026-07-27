export type Theme = 'dark' | 'light';
export type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';
export type AppLanguage = 'en' | 'tr' | 'ar' | 'ru';
export type Role = 'user' | 'assistant';

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}
