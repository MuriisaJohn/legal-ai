import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { createChatSlice, ChatSlice } from '@/features/chat/stores/chatSlice';
import { createDocumentSlice, DocumentSlice } from '@/features/documents/stores/documentSlice';
import { createHistorySlice, HistorySlice } from '@/shared/stores/historySlice';

export type AppStore = ChatSlice & DocumentSlice & HistorySlice;

function hydrateTimestamps(state: AppStore): AppStore {
  if (!state.messages) return state;
  return {
    ...state,
    messages: state.messages.map((msg) => {
      if (!msg.timestamp) return { ...msg, timestamp: new Date() };
      const ts = msg.timestamp instanceof Date ? msg.timestamp : new Date(msg.timestamp as any);
      return { ...msg, timestamp: isNaN(ts.getTime()) ? new Date() : ts };
    }),
  };
}

export const useStore = create<AppStore>()(
  persist(
    (...a) => ({
      ...createChatSlice(...a),
      ...createDocumentSlice(...a),
      ...createHistorySlice(...a),
    }),
    {
      name: 'app-store',
      partialize: (state) => ({
        messages: state.messages.slice(-50),
        activeDocument: state.activeDocument,
        savedHistories: state.savedHistories.slice(0, 100),
        currentHistoryId: state.currentHistoryId,
      }),
      merge: (persisted, current) =>
        hydrateTimestamps({ ...current, ...(persisted as Partial<AppStore>) }),
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          } catch {
            return null;
          }
        },
        setItem: (name, value) => {
          try { localStorage.setItem(name, JSON.stringify(value)); } catch {}
        },
        removeItem: (name) => {
          try { localStorage.removeItem(name); } catch {}
        },
      },
    }
  )
);
