/** Types for conversation handling */

export type MessageRole = 'user' | 'assistant' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  edited_slide?: number;
  action?: string;
  created_at: string;
}

export interface Conversation {
  id: string;
  deck_id: string;
  messages: Message[];
  created_at: string;
  updated_at: string;
}

export interface UserMessage {
  content: string;
  conversation_id?: string;
}

export interface EditIntent {
  slide_index: number;
  operation: 'modify' | 'replace' | 'add_content' | 'remove_content';
  intent: string;
  confidence: number;
}