import { StateCreator } from 'zustand';
import type { Message, ConversationEntry } from '@/stores/types';

let _nextId = 1;
function nextId(): string {
  return `msg-${Date.now().toString(36)}-${(_nextId++).toString(36)}`;
}

export interface ChatSlice {
  messages: Message[];
  isProcessing: boolean;
  currentHistoryId: string | null;

  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => string;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setProcessing: (isProcessing: boolean) => void;
  getConversationContext: (limit?: number) => string;
  getConversationHistory: () => ConversationEntry[];
  addConversationExchange: (userMessage: string, aiResponse: string, source?: 'chat' | 'voice') => void;
}

export const createChatSlice: StateCreator<ChatSlice, [], [], ChatSlice> = (set, get) => ({
  messages: [],
  isProcessing: false,
  currentHistoryId: null,

  addMessage: (messageData) => {
    const id = nextId();
    const newMessage: Message = {
      ...messageData,
      id,
      timestamp: new Date(),
    };
    set((state) => ({
      messages: [...state.messages, newMessage],
    }));
    return id;
  },

  updateMessage: (id, updates) => {
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, ...updates } : msg
      ),
    }));
  },

  clearMessages: () => {
    set({ messages: [] });
  },

  setProcessing: (isProcessing) => {
    set({ isProcessing });
  },

  getConversationContext: (limit = 10) => {
    const { messages } = get();
    return messages.slice(-limit)
      .map((m) => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
      .join('\n');
  },

  getConversationHistory: () => {
    return get().messages.map((m) => ({
      role: (m.sender === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.content,
    })).slice(-20);
  },

  addConversationExchange: (userMessage, aiResponse, source = 'chat') => {
    const now = Date.now();
    const userMsg: Message = {
      id: `${now.toString(36)}-user`,
      content: userMessage,
      sender: 'user',
      timestamp: new Date(now),
      source,
    };
    const aiMsg: Message = {
      id: `${(now + 1).toString(36)}-ai`,
      content: aiResponse,
      sender: 'ai',
      timestamp: new Date(now + 1),
      source,
    };
    set((state) => ({
      messages: [...state.messages, userMsg, aiMsg],
    }));
  },
});
