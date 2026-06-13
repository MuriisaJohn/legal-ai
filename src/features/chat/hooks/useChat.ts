import { useState, useCallback, useRef } from 'react';
import { toast } from "@/shared/components/ui/use-toast";
import { answerQuestion, summarizeDocumentStreaming, analyzeDocumentContentStreaming } from '@/frontend/services/geminiService';
import type { Message } from '@/features/chat/types';
import type { Document } from '@/stores/types';

const GREETINGS = [
  "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
  "greetings", "howdy", "yo", "sup", "what's up", "morning", "afternoon", "evening"
];

const isGreeting = (text: string) => {
  const normalized = text.trim().toLowerCase();
  return GREETINGS.some(g => normalized === g || normalized.startsWith(g + " "));
};

export function useChat(activeDocument?: Document) {
  const [messages, setMessages] = useState<Message[]>(() => {
    const greeting = activeDocument
      ? `I'm your legal assistant.${activeDocument.content ? " I can analyze its content and " : " "}I'm ready to answer questions about "${activeDocument.name}" or law in general.`
      : "Welcome! I'm your legal assistant. I can help with questions about land law, business regulations, criminal law, family law, and constitutional rights. How may I assist you today?";
    return [{ id: 'welcome', content: greeting, sender: 'ai' as const, timestamp: new Date() }];
  });
  const [isLoading, setIsLoading] = useState(false);
  const messagesRef = useRef(messages);
  messagesRef.current = messages;
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  const sendMessage = useCallback(async (inputValue: string) => {
    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Gemini API key is not configured.", variant: "destructive" });
      return;
    }

    const userMsg: Message = { id: `msg-${Date.now()}-user`, content: inputValue, sender: 'user', timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);
    const currentMessages = [...messagesRef.current, userMsg];

    if (isGreeting(inputValue)) {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, content: "Hello! How can I assist you with your legal questions today?", sender: 'ai', timestamp: new Date() }]);
      return;
    }

    setIsLoading(true);
    const context = currentMessages.slice(-10).map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    try {
      const text = await answerQuestion(inputValue, context, activeDocument?.name || null, activeDocument?.content || null, apiKey);
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, content: text, sender: 'ai', timestamp: new Date() }]);
    } catch (error) {
      setMessages(prev => [...prev, { id: `msg-${Date.now()}-ai`, content: error instanceof Error ? error.message : "An error occurred.", sender: 'ai', timestamp: new Date(), isError: true }]);
      toast({ title: "Error", description: "Failed to generate a response.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  }, [apiKey, activeDocument]);

  const summarizeDocument = useCallback(async (docName: string, content: string) => {
    setIsLoading(true);
    const aiMsgId = `msg-${Date.now()}-ai`;
    setMessages(prev => [
      ...prev,
      { id: `msg-${Date.now()}-user`, content: `Summarize "${docName}"`, sender: 'user', timestamp: new Date() },
      { id: aiMsgId, content: `Document Summary for "${docName}": `, sender: 'ai', timestamp: new Date() }
    ]);

    try {
      await summarizeDocumentStreaming(docName, content, apiKey,
        (chunk: string) => setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m)),
        () => setIsLoading(false),
        (error: Error) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: error.message, isError: true } : m));
          toast({ title: "Error", description: "Failed to summarize.", variant: "destructive" });
          setIsLoading(false);
        }
      );
    } catch {
      setIsLoading(false);
    }
  }, [apiKey]);

  const analyzeDocument = useCallback(async (docName: string, content: string) => {
    setIsLoading(true);
    const aiMsgId = `msg-${Date.now()}-ai`;
    setMessages(prev => [...prev, { id: aiMsgId, content: `**Comprehensive Legal Analysis for "${docName}":**\n\n`, sender: 'ai', timestamp: new Date() }]);

    try {
      await analyzeDocumentContentStreaming(docName, content, apiKey,
        (chunk: string) => setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: m.content + chunk } : m)),
        () => setIsLoading(false),
        (error: Error) => {
          setMessages(prev => prev.map(m => m.id === aiMsgId ? { ...m, content: error.message, isError: true } : m));
          toast({ title: "Error", description: "Failed to analyze.", variant: "destructive" });
          setIsLoading(false);
        }
      );
    } catch {
      setIsLoading(false);
    }
  }, [apiKey]);

  return { messages, isLoading, sendMessage, summarizeDocument, analyzeDocument };
}
