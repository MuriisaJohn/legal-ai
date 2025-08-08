import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateChatTitleWithOpenRouter } from '@/frontend/services/openRouterService';
import { useSettingsStore } from './settingsStore';

// Message type shared across the application
export interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
  source?: 'chat' | 'voice'; // Track where the message originated
}

// Document type
export interface Document {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
  content?: string;
}

// Store interface
interface MessageStore {
  // State
  messages: Message[];
  conversationHistory: Array<{ role: 'user' | 'assistant'; content: string }>;
  activeDocument: Document | null;
  isProcessing: boolean;
  savedHistories: Array<{ id: string; title: string; messages: Message[]; createdAt: string }>;
  currentHistoryId: string | null;
  
  // Actions
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => void;
  updateMessage: (id: string, updates: Partial<Message>) => void;
  clearMessages: () => void;
  setActiveDocument: (document: Document | null) => void;
  setProcessing: (isProcessing: boolean) => void;
  generateHistoryTitle: () => Promise<string>;
  saveCurrentHistory: (title?: string) => string; // returns saved id
  loadHistory: (id: string) => void;
  deleteHistory: (id: string) => void;
  startNewChat: () => void;
  
  // Get conversation context for AI
  getConversationContext: (limit?: number) => string;
  
  // Add multiple messages at once (for voice mode)
  addConversationExchange: (userMessage: string, aiResponse: string, source?: 'chat' | 'voice') => void;
}

// Create the store with persistence
export const useMessageStore = create<MessageStore>()(
  persist(
    (set, get) => ({
      // Initial state
      messages: [],
      conversationHistory: [],
      activeDocument: null,
      isProcessing: false,
      savedHistories: [],
      currentHistoryId: null,
      
      // Add a new message
      addMessage: (messageData) => {
        const newMessage: Message = {
          ...messageData,
          id: `msg-${Date.now()}-${messageData.sender}`,
          timestamp: new Date(),
        };
        
        const role: 'user' | 'assistant' = messageData.sender === 'user' ? 'user' : 'assistant';
        set((state) => ({
          messages: [...state.messages, newMessage],
          conversationHistory: [
            ...state.conversationHistory,
            {
              role,
              content: messageData.content,
            },
          ].slice(-20), // Keep last 20 exchanges for context
        }));
      },
      
      // Update an existing message
      updateMessage: (id, updates) => {
        set((state) => ({
          messages: state.messages.map((msg) =>
            msg.id === id ? { ...msg, ...updates } : msg
          ),
        }));
      },
      
      // Clear all messages
      clearMessages: () => {
        set({
          messages: [],
          conversationHistory: [],
        });
      },
      
      // Set active document
      setActiveDocument: (document) => {
        set({ activeDocument: document });
      },
      
      // Set processing state
      setProcessing: (isProcessing) => {
        set({ isProcessing });
      },
      
      // Save current messages as a history entry
      saveCurrentHistory: (title) => {
        const { messages } = get();
        const id = `hist-${Date.now()}`;
        const newHist = {
          id,
          title: title || 'New Chat',
          messages: [...messages],
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          savedHistories: [newHist, ...state.savedHistories].slice(0, 50),
          currentHistoryId: id,
        }));
        return id;
      },
      
      // Load a saved history into current messages
      loadHistory: (id) => {
        const { savedHistories } = get();
        const found = savedHistories.find((h) => h.id === id);
        if (!found) return;
        set({
          messages: found.messages.map((m) => ({
            ...m,
            timestamp: m.timestamp instanceof Date ? m.timestamp : new Date(m.timestamp as any),
          })),
          conversationHistory: found.messages
            .map((m) => ({
              role: m.sender === 'user' ? 'user' as 'user' : 'assistant' as 'assistant',
              content: m.content
            }))
            .slice(-20),
          currentHistoryId: id,
        });
      },
      
      // Delete a saved history
      deleteHistory: (id) => {
        set((state) => ({
          savedHistories: state.savedHistories.filter((h) => h.id !== id),
          currentHistoryId: state.currentHistoryId === id ? null : state.currentHistoryId,
        }));
      },

      // Start a brand new empty chat
      startNewChat: () => {
        set({ messages: [], conversationHistory: [], currentHistoryId: null });
      },
      
      // Get conversation context for AI
      getConversationContext: (limit = 10) => {
        const { messages } = get();
        const lastMessages = messages.slice(-limit);
        return lastMessages
          .map((m) => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
          .join('\n');
      },
      
      // Add a conversation exchange (user message + AI response)
      addConversationExchange: (userMessage, aiResponse, source = 'chat') => {
        const userMsg: Message = {
          id: `msg-${Date.now()}-user`,
          content: userMessage,
          sender: 'user',
          timestamp: new Date(),
          source,
        };
        
        const aiMsg: Message = {
          id: `msg-${Date.now() + 1}-ai`,
          content: aiResponse,
          sender: 'ai',
          timestamp: new Date(),
          source,
        };
        
        set((state) => ({
          messages: [...state.messages, userMsg, aiMsg],
          conversationHistory: [
            ...state.conversationHistory,
            { role: 'user' as 'user', content: userMessage },
            { role: 'assistant' as 'assistant', content: aiResponse },
          ].slice(-20),
        }));
      },

      // Generate a short, readable title from earliest user content
      generateHistoryTitle: async () => {
        const { messages } = get();
        const convo = messages
          .slice(0, 12)
          .map((m) => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`)
          .join('\n');
        try {
          const jurisdiction = (useSettingsStore.getState().jurisdiction?.name) || 'Uganda';
          const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';
          if (!apiKey) return 'New Chat';
          const title = await generateChatTitleWithOpenRouter(convo, jurisdiction, apiKey);
          return title || 'New Chat';
        } catch {
          return 'New Chat';
        }
      },
    }),
    {
      name: 'message-store', // unique name for localStorage
      partialize: (state) => ({
        // Only persist messages and conversation history
        messages: state.messages.slice(-50), // Keep last 50 messages
        conversationHistory: state.conversationHistory,
        activeDocument: state.activeDocument,
        savedHistories: state.savedHistories.slice(0, 100),
        currentHistoryId: state.currentHistoryId,
      }),
      // Handle date serialization/deserialization
      storage: {
        getItem: (name) => {
          try {
            const str = localStorage.getItem(name);
            if (!str) return null;
            const data = JSON.parse(str);
            // Convert timestamp strings back to Date objects
            if (data.state?.messages) {
              data.state.messages = data.state.messages.map((msg: any) => {
                // Ensure timestamp is always a Date object
                let timestamp = new Date();
                if (msg.timestamp) {
                  // Handle both string and Date object cases
                  if (typeof msg.timestamp === 'string') {
                    timestamp = new Date(msg.timestamp);
                  } else if (msg.timestamp instanceof Date) {
                    timestamp = msg.timestamp;
                  } else {
                    // Fallback for any other format
                    timestamp = new Date(msg.timestamp);
                  }
                  // Validate the date
                  if (isNaN(timestamp.getTime())) {
                    timestamp = new Date();
                  }
                }
                return {
                  ...msg,
                  timestamp,
                };
              });
            }
            return data;
          } catch (error) {
            console.error('Error deserializing message store data:', error);
            return null;
          }
        },
        setItem: (name, value) => {
          try {
            localStorage.setItem(name, JSON.stringify(value));
          } catch (error) {
            console.error('Error serializing message store data:', error);
          }
        },
        removeItem: (name) => {
          try {
            localStorage.removeItem(name);
          } catch (error) {
            console.error('Error removing message store data:', error);
          }
        },
      },
    }
  )
);

// Helper hook to get initial greeting message
export const useInitialGreeting = () => {
  const { messages, activeDocument, addMessage } = useMessageStore();
  
  // Add initial greeting if no messages exist
  if (messages.length === 0) {
    if (activeDocument) {
      const hasContent = activeDocument.content ? " I can analyze its content and " : " ";
      addMessage({
        content: `I'm your legal assistant.${hasContent}I'm ready to answer questions about "${activeDocument.name}" or  law in general.`,
        sender: 'ai',
        source: 'chat',
      });
    } else {
      addMessage({
        content: "Welcome! I'm your Ugandan legal assistant. I can help with questions about land law, business regulations, criminal law, family law, and constitutional rights. How may I assist you today?",
        sender: 'ai',
        source: 'chat',
      });
    }
  }
};
