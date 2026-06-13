import { StateCreator } from 'zustand';
import type { SavedHistory, Message } from '@/stores/types';

export interface HistorySlice {
  savedHistories: SavedHistory[];

  saveCurrentHistory: (messages: Message[], title?: string) => string;
  loadHistory: (id: string) => { messages: Message[]; title: string } | null;
  deleteHistory: (id: string) => void;
  startNewChat: () => void;
  generateHistoryTitle: () => Promise<string>;
}

export const createHistorySlice: StateCreator<HistorySlice, [], [], HistorySlice> = (set, get) => ({
  savedHistories: [],

  generateHistoryTitle: async () => {
    return `Chat ${new Date().toLocaleDateString()}`;
  },

  saveCurrentHistory: (messages, title) => {
    const id = `hist-${Date.now().toString(36)}`;
    const newHist: SavedHistory = {
      id,
      title: title || `Chat ${new Date().toLocaleDateString()}`,
      messages: messages.map((m) => ({ ...m })),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      savedHistories: [newHist, ...state.savedHistories].slice(0, 50),
    }));
    return id;
  },

  loadHistory: (id) => {
    const { savedHistories } = get();
    const found = savedHistories.find((h) => h.id === id);
    if (!found) return null;
    return {
      messages: found.messages.map((m) => ({
        ...m,
        timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as any),
      })),
      title: found.title,
    };
  },

  deleteHistory: (id) => {
    set((state) => ({
      savedHistories: state.savedHistories.filter((h) => h.id !== id),
    }));
  },

  startNewChat: () => {},
});
