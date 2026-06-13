import { useEffect, useRef } from 'react';
import { useStore } from './index';
import type { Message, Document } from './types';

export type { Message, Document } from './types';

export const useMessageStore = useStore;

export const useInitialGreeting = () => {
  const ran = useRef(false);
  const messages = useStore((s) => s.messages);
  const activeDocument = useStore((s) => s.activeDocument);
  const addMessage = useStore((s) => s.addMessage);

  useEffect(() => {
    if (ran.current) return;
    if (messages.length > 0) return;

    ran.current = true;

    if (activeDocument) {
      addMessage({
        content: `I'm your legal assistant. I'm ready to answer questions about "${activeDocument.name}" or law in general.`,
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
  }, [messages.length, activeDocument, addMessage]);
};
