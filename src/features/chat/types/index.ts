export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  source?: 'chat' | 'voice';
  streaming?: boolean;
}

export interface ConversationEntry {
  role: 'user' | 'assistant';
  content: string;
}

export interface SavedHistory {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
}
