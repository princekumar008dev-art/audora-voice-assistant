export interface ConversationItem {
  id: string;
  user_id?: string;
  prompt: string;
  response: string;
  action_type?: 'chat' | 'note' | 'reminder' | 'weather' | 'media' | 'system';
  created_at?: string;
}

export interface VoiceNote {
  id: string;
  user_id?: string;
  title?: string;
  content: string;
  category?: string;
  created_at?: string;
}

export interface ReminderItem {
  id: string;
  user_id?: string;
  title: string;
  due_time?: string;
  is_completed: boolean;
  created_at?: string;
}

export type AssistantState = 'idle' | 'listening' | 'thinking' | 'speaking';

export interface AssistantResponse {
  speechText: string;
  displayText?: string;
  actionType: 'chat' | 'note' | 'reminder' | 'weather' | 'media' | 'system';
  payload?: any;
}
