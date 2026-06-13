import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/shared/components/Navbar';
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/shared/components/ui/select";
import { useSettingsStore } from '@/shared/stores/settingsStore';
import { MessageSquare, FileText, Scale, Plus, Clock, AlertCircle } from 'lucide-react';
import { toast } from "@/shared/components/ui/use-toast";
import {
  answerQuestionStreaming,
  summarizeDocumentStreaming,
  analyzeDocumentContentStreaming
} from '@/frontend/services/geminiService';
import { formatMessageContent } from '@/shared/lib/messageFormatter';
import { useMessageStore, useInitialGreeting } from '@/stores/messageStore';
import type { Message } from '@/features/chat/types';
import type { Document } from '@/stores/types';

const isGreeting = (text: string) => {
  const greetings = [
    "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
    "greetings", "howdy", "yo", "sup", "what's up", "morning", "afternoon", "evening"
  ];
  const normalized = text.trim().toLowerCase();
  return greetings.some(greet => normalized === greet || normalized.startsWith(greet + " "));
};

const Chat = () => {
  const navigate = useNavigate();

  const {
    messages,
    activeDocument,
    isProcessing,
    addMessage,
    savedHistories,
    saveCurrentHistory,
    loadHistory,
    startNewChat,
    clearMessages,
    updateMessage,
    setProcessing,
    getConversationContext
  } = useMessageStore();

  const [inputValue, setInputValue] = useState('');
  const { jurisdiction, setJurisdiction } = useSettingsStore();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'document'>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  useInitialGreeting();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    if (isLoading || isProcessing) return;

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "The Gemini API key is not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    const userInput = inputValue.trim();
    setInputValue('');

    addMessage({
      content: userInput,
      sender: 'user',
      source: 'chat'
    });

    if (isGreeting(userInput)) {
      addMessage({
        content: "Hello! How can I assist you with your legal questions today?",
        sender: 'ai',
        source: 'chat'
      });
      return;
    }

    setIsLoading(true);
    setProcessing(true);

    const context = getConversationContext(10);
    let fullResponse = '';
    let streamingMessageId: string | null = null;
    let hasCompleted = false;
    let isFirstChunk = true;

    try {
      const jurisdictionPrefixedInput = `Jurisdiction: ${jurisdiction.name}. ${userInput}`;
      await answerQuestionStreaming(
        jurisdictionPrefixedInput,
        context,
        activeDocument?.name || null,
        activeDocument?.content || null,
        apiKey,
        (chunk: string) => {
          fullResponse += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            streamingMessageId = addMessage({ content: fullResponse, sender: 'ai', source: 'chat' });
          } else if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: fullResponse });
          }
        },
        () => {
          if (hasCompleted) return;
          hasCompleted = true;
          if (streamingMessageId && fullResponse.trim()) {
            updateMessage(streamingMessageId, { content: fullResponse });
          } else if (!streamingMessageId && fullResponse.trim()) {
            addMessage({ content: fullResponse, sender: 'ai', source: 'chat' });
          }
          const msgs = useMessageStore.getState().messages;
          saveCurrentHistory(msgs, `Legal Chat ${new Date().toLocaleDateString()}`);
          setIsLoading(false);
          setProcessing(false);
        },
        (error: Error) => {
          if (hasCompleted) return;
          hasCompleted = true;
          console.error("Gemini Streaming Error:", error);
          const errorContent = "I apologize, but I encountered an error while processing your request. Error details: " + error.message;
          if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: errorContent, isError: true });
          } else {
            addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
          }
          toast({ title: "API Error", description: "Failed to communicate with Gemini. Please check your configuration.", variant: "destructive" });
          setIsLoading(false);
          setProcessing(false);
        }
      );
    } catch (error) {
      if (hasCompleted) return;
      hasCompleted = true;
      console.error("Gemini API Error:", error);
      const errorContent = "I apologize, but I encountered an error while processing your request. " + (error instanceof Error ? error.message : "Please check the console for more details.");
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content: errorContent, isError: true });
      } else {
        addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
      }
      toast({ title: "API Error", description: "Failed to communicate with Gemini.", variant: "destructive" });
    } finally {
      if (!hasCompleted) {
        setIsLoading(false);
        setProcessing(false);
      }
    }
  };

  const handleSummarizeDocument = async () => {
    if (!activeDocument) {
      toast({ title: "No Document Selected", description: "Please select a document to summarize.", variant: "destructive" });
      return;
    }
    if (!activeDocument.content || activeDocument.content.trim() === '') {
      toast({ title: "No Document Content", description: "The selected document doesn't have extractable text.", variant: "destructive" });
      return;
    }
    if (isLoading || isProcessing) return;

    setIsLoading(true);
    setProcessing(true);

    addMessage({ content: `Summarize "${activeDocument.name}"`, sender: 'user', source: 'chat' });

    let fullSummary = '';
    const summaryPrefix = `**Document Summary for "${activeDocument.name}":**\n\n`;
    let streamingMessageId: string | null = null;
    let hasCompleted = false;
    let isFirstChunk = true;

    try {
      await summarizeDocumentStreaming(
        activeDocument.name, activeDocument.content, apiKey,
        (chunk: string) => {
          fullSummary += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            streamingMessageId = addMessage({ content: summaryPrefix + fullSummary, sender: 'ai', source: 'chat' });
          } else if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: summaryPrefix + fullSummary });
          }
        },
        () => {
          if (hasCompleted) return;
          hasCompleted = true;
          if (streamingMessageId && fullSummary.trim()) {
            updateMessage(streamingMessageId, { content: summaryPrefix + fullSummary });
          } else if (!streamingMessageId && fullSummary.trim()) {
            addMessage({ content: summaryPrefix + fullSummary, sender: 'ai', source: 'chat' });
          }
          setIsLoading(false);
          setProcessing(false);
        },
        (error: Error) => {
          if (hasCompleted) return;
          hasCompleted = true;
          console.error("Error summarizing document:", error);
          const errorContent = error.message || "Failed to summarize the document.";
          if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: errorContent, isError: true });
          } else {
            addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
          }
          toast({ title: "Error", description: "Failed to summarize document.", variant: "destructive" });
          setIsLoading(false);
          setProcessing(false);
        }
      );
    } catch (error) {
      if (hasCompleted) return;
      hasCompleted = true;
      console.error("Error summarizing document:", error);
      const errorContent = error instanceof Error ? error.message : "Failed to summarize the document.";
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content: errorContent, isError: true });
      } else {
        addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
      }
      toast({ title: "Error", description: "Failed to summarize document.", variant: "destructive" });
    } finally {
      if (!hasCompleted) { setIsLoading(false); setProcessing(false); }
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!activeDocument || !activeDocument.content) {
      toast({ title: "Requirements Missing", description: "Please select a document with content to analyze.", variant: "destructive" });
      return;
    }
    if (isLoading || isProcessing) return;

    setIsLoading(true);
    setProcessing(true);

    addMessage({ content: `Analyze "${activeDocument.name}"`, sender: 'user', source: 'chat' });

    let fullAnalysis = '';
    const analysisPrefix = `**Comprehensive Legal Analysis for "${activeDocument.name}":**\n\n`;
    let streamingMessageId: string | null = null;
    let hasCompleted = false;
    let isFirstChunk = true;

    try {
      await analyzeDocumentContentStreaming(
        activeDocument.name, activeDocument.content, apiKey,
        (chunk: string) => {
          fullAnalysis += chunk;
          if (isFirstChunk) {
            isFirstChunk = false;
            streamingMessageId = addMessage({ content: analysisPrefix + fullAnalysis, sender: 'ai', source: 'chat' });
          } else if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: analysisPrefix + fullAnalysis });
          }
        },
        () => {
          if (hasCompleted) return;
          hasCompleted = true;
          if (streamingMessageId && fullAnalysis.trim()) {
            updateMessage(streamingMessageId, { content: analysisPrefix + fullAnalysis });
          } else if (!streamingMessageId && fullAnalysis.trim()) {
            addMessage({ content: analysisPrefix + fullAnalysis, sender: 'ai', source: 'chat' });
          }
          setIsLoading(false);
          setProcessing(false);
        },
        (error: Error) => {
          if (hasCompleted) return;
          hasCompleted = true;
          console.error("Error analyzing document:", error);
          const errorContent = error.message || "Failed to analyze the document.";
          if (streamingMessageId) {
            updateMessage(streamingMessageId, { content: errorContent, isError: true });
          } else {
            addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
          }
          toast({ title: "Error", description: "Failed to analyze document.", variant: "destructive" });
          setIsLoading(false);
          setProcessing(false);
        }
      );
    } catch (error) {
      if (hasCompleted) return;
      hasCompleted = true;
      console.error("Error analyzing document:", error);
      const errorContent = error instanceof Error ? error.message : "Failed to analyze the document.";
      if (streamingMessageId) {
        updateMessage(streamingMessageId, { content: errorContent, isError: true });
      } else {
        addMessage({ content: errorContent, sender: 'ai', source: 'chat', isError: true });
      }
      toast({ title: "Error", description: "Failed to analyze document.", variant: "destructive" });
    } finally {
      if (!hasCompleted) { setIsLoading(false); setProcessing(false); }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const formatTimestamp = (timestamp: Date | string) => {
    try {
      const t = timestamp instanceof Date ? timestamp : new Date(timestamp);
      if (isNaN(t.getTime())) return '';
      return t.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#f8f6f3]">
      <Navbar />
      <main className="flex-1 container mx-auto px-3 sm:px-6 pt-20 pb-4 sm:pb-6 flex flex-col overflow-hidden max-w-6xl">
        <div className="flex items-center gap-3 mb-5 animate-fade-in">
          <div className="w-9 h-9 rounded-xl bg-[#0a1628] flex items-center justify-center shadow-sm">
            <Scale className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="font-serif text-xl sm:text-2xl font-bold text-[#0a1628] tracking-tight">Legal Assistant</h1>
            <p className="text-[13px] text-gray-400 font-medium mt-0.5">
              {jurisdiction.name} · {activeDocument ? `Reviewing: ${activeDocument.name}` : 'Ready to help'}
            </p>
          </div>
        </div>

        <div className="flex-1 flex flex-col bg-white rounded-2xl shadow-[0_1px_3px_rgba(0,0,0,0.04),0_4px_16px_rgba(0,0,0,0.02)] border border-[#e8e4de] overflow-hidden animate-slide-up">
          <div className="flex-shrink-0 flex items-center gap-2 px-4 sm:px-5 py-3 border-b border-[#e8e4de] bg-white">
            <div className="flex items-center gap-1 bg-[#f8f6f3] rounded-xl p-0.5">
              <button
                onClick={() => setActiveTab('chat')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
                  activeTab === 'chat'
                    ? 'bg-white text-[#0a1628] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <MessageSquare className="h-3.5 w-3.5" />
                Chat
              </button>
              <button
                onClick={() => setActiveTab('document')}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-[10px] text-sm font-medium transition-all duration-200 ${
                  activeTab === 'document'
                    ? 'bg-white text-[#0a1628] shadow-[0_1px_2px_rgba(0,0,0,0.04)]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                Document Info
              </button>
            </div>

            <div className="flex-1" />

            {activeDocument && activeTab === 'chat' && (
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleSummarizeDocument}
                  disabled={isLoading}
                  className="px-3 py-1.5 text-xs font-medium text-[#0a1628] bg-[#f8f6f3] rounded-lg hover:bg-[#f0ede8] transition-all duration-200 active:scale-95 disabled:opacity-40"
                >
                  Summarize
                </button>
                {activeDocument.content && (
                  <button
                    onClick={handleAnalyzeDocument}
                    disabled={isLoading}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-[#0a1628] rounded-lg hover:bg-[#1a2a4a] transition-all duration-200 active:scale-95 disabled:opacity-40"
                  >
                    Full Analysis
                  </button>
                )}
              </div>
            )}

            <Select
              value={jurisdiction.code}
              onValueChange={(val) => {
                const mapping: Record<string, { code: string; name: string }> = {
                  UG: { code: 'UG', name: 'Uganda' },
                  KE: { code: 'KE', name: 'Kenya' },
                  TZ: { code: 'TZ', name: 'Tanzania' },
                  RW: { code: 'RW', name: 'Rwanda' },
                  NG: { code: 'NG', name: 'Nigeria' },
                  ZA: { code: 'ZA', name: 'South Africa' },
                  GB: { code: 'GB', name: 'United Kingdom' },
                  US: { code: 'US', name: 'United States' },
                };
                const selected = mapping[val] || mapping.UG;
                setJurisdiction(selected);
                toast({ title: 'Jurisdiction set', description: selected.name });
              }}
            >
              <SelectTrigger className="h-8 w-auto min-w-[100px] border-0 bg-[#f8f6f3] rounded-lg text-xs font-medium text-gray-500 hover:text-[#0a1628] transition-colors shadow-none">
                <SelectValue placeholder="Jurisdiction" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="UG">Uganda</SelectItem>
                <SelectItem value="KE">Kenya</SelectItem>
                <SelectItem value="TZ">Tanzania</SelectItem>
                <SelectItem value="RW">Rwanda</SelectItem>
                <SelectItem value="NG">Nigeria</SelectItem>
                <SelectItem value="ZA">South Africa</SelectItem>
                <SelectItem value="GB">United Kingdom</SelectItem>
                <SelectItem value="US">United States</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center gap-1">
              <Select onValueChange={(id) => loadHistory(id)}>
                <SelectTrigger className="h-8 w-auto min-w-[32px] border-0 bg-transparent rounded-lg p-0 shadow-none hover:bg-[#f8f6f3] transition-colors">
                  <Clock className="h-3.5 w-3.5 text-gray-400" />
                </SelectTrigger>
                <SelectContent align="end">
                  {savedHistories.length === 0 ? (
                    <SelectItem value="__none" disabled>No saved histories</SelectItem>
                  ) : (
                    savedHistories.map((h) => (
                      <SelectItem key={h.id} value={h.id}>{h.title}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>

              <button
                onClick={() => { clearMessages(); startNewChat(); }}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-[#0a1628] hover:bg-[#f8f6f3] transition-all duration-200 active:scale-95"
              >
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {activeTab === 'chat' ? (
            <>
              <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5">
                <div className="max-w-4xl mx-auto space-y-5">
                  {messages.map((message, index) => (
                    <div
                      key={message.id}
                      className={`flex items-start gap-3 max-w-full animate-fade-in-up ${
                        message.sender === 'user' ? 'justify-end' : 'justify-start'
                      }`}
                      style={{ animationDelay: `${index * 0.03}s` }}
                    >
                      {message.sender === 'ai' && (
                        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
                          message.isError ? 'bg-red-50 text-red-500' : 'bg-[#0a1628] text-white'
                        }`}>
                          {message.isError ? <AlertCircle className="h-4 w-4" /> : <Scale className="h-4 w-4" />}
                        </div>
                      )}

                      <div className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[70%]`}>
                        <div className={`text-[11px] font-medium mb-1.5 px-1 tracking-wide uppercase ${
                          message.sender === 'user' ? 'text-gray-400' : message.isError ? 'text-red-400' : 'text-gray-400'
                        }`}>
                          {message.sender === 'user' ? 'You' : 'AI Assistant'}
                        </div>

                        <div className={`${
                          message.sender === 'user'
                            ? 'bg-[#0a1628] text-white rounded-2xl rounded-tr-md'
                            : message.isError
                              ? 'bg-red-50 text-red-800 rounded-2xl rounded-tl-md'
                              : 'bg-white text-[#1a1a2e] rounded-2xl rounded-tl-md shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)] border border-[#f0ede8]'
                        } px-5 py-3.5 leading-relaxed`}>
                          <div className="text-[15px]">
                            {formatMessageContent(message.content)}
                          </div>
                        </div>

                        <div className={`text-[11px] mt-1.5 px-1 text-gray-400 font-medium ${message.sender === 'user' ? 'text-right' : 'text-left'}`}>
                          {formatTimestamp(message.timestamp)}
                        </div>
                      </div>

                      {message.sender === 'user' && (
                        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#f0ede8] text-[#0a1628] shadow-sm">
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                        </div>
                      )}
                    </div>
                  ))}

                  {isLoading && (
                    <div className="flex items-start gap-3 animate-fade-in-up">
                      <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-[#0a1628] flex items-center justify-center">
                        <Scale className="h-4 w-4 text-white" />
                      </div>
                      <div className="flex flex-col items-start">
                        <div className="text-[11px] font-medium mb-2 px-1 tracking-wide uppercase text-gray-400">AI Assistant</div>
                        <div className="bg-white rounded-2xl rounded-tl-md px-5 py-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#f0ede8]">
                          <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-[#0a1628] animate-pulse-dot" style={{ animationDelay: '0s' }} />
                            <span className="w-2 h-2 rounded-full bg-[#0a1628] animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
                            <span className="w-2 h-2 rounded-full bg-[#0a1628] animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="flex-shrink-0 px-4 sm:px-5 py-4 bg-white border-t border-[#e8e4de]">
                <div className="flex gap-2.5 items-center max-w-4xl mx-auto">
                  <button
                    onClick={() => navigate('/voice')}
                    disabled={isLoading}
                    className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#0a1628] hover:bg-[#f8f6f3] transition-all duration-200 active:scale-95 disabled:opacity-40"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="8"/><path d="M12 11a2 2 0 0 0 2-2V6a2 2 0 1 0-4 0v3a2 2 0 0 0 2 2z"/><path d="M7.5 6.5v1a4.5 4.5 0 0 0 9 0v-1"/><line x1="12" x2="12" y1="16" y2="22"/><line x1="8" x2="16" y1="22" y2="22"/></svg>
                  </button>

                  <div className="flex-1 relative group">
                    <input
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={activeDocument
                        ? `Ask about "${activeDocument.name}" or ${jurisdiction.name} law...`
                        : `Ask a question about ${jurisdiction.name} law...`}
                      disabled={isLoading}
                      className="w-full h-12 pl-5 pr-14 bg-[#f8f6f3] border border-[#e8e4de] rounded-2xl text-[15px] text-[#0a1628] placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#0a1628] focus:bg-white focus:shadow-[0_0_0_3px_rgba(10,22,40,0.08)] disabled:opacity-50"
                    />

                    <button
                      onClick={handleSendMessage}
                      disabled={inputValue.trim() === '' || isLoading}
                      className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center bg-[#0a1628] text-white transition-all duration-200 hover:bg-[#1a2a4a] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-11 20L9 13 2 9l20-7"/><path d="M22 2 15 22l-4-9-5-4 16-7"/></svg>
                    </button>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 overflow-y-auto px-4 sm:px-5 py-5">
              <div className="max-w-2xl mx-auto">
                {activeDocument ? (
                  <div className="space-y-4 animate-fade-in">
                    <div className="bg-[#f8f6f3] rounded-2xl p-5 border border-[#e8e4de]">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[#0a1628] flex items-center justify-center">
                          <FileText className="h-5 w-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-serif text-lg font-bold text-[#0a1628]">{activeDocument.name}</h3>
                          <p className="text-xs text-gray-400 font-medium">Legal Document · {activeDocument.date || "Uploaded recently"}</p>
                        </div>
                      </div>
                      <div className="space-y-3">
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">Document Type</p>
                          <p className="text-sm text-[#0a1628]">Legal Document</p>
                        </div>
                        <div>
                          <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">AI Analysis</p>
                          <p className="text-sm text-gray-500 leading-relaxed">
                            This document is ready for AI-powered analysis. Use the summarize or full analysis buttons above, or ask specific questions in the chat.
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleSummarizeDocument}
                        disabled={isLoading}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-[#0a1628] bg-[#f8f6f3] rounded-xl hover:bg-[#f0ede8] transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
                      >
                        Summarize Document
                      </button>
                      <button
                        onClick={handleAnalyzeDocument}
                        disabled={isLoading || !activeDocument.content}
                        className="flex-1 px-4 py-2.5 text-sm font-medium text-white bg-[#0a1628] rounded-xl hover:bg-[#1a2a4a] transition-all duration-200 active:scale-[0.98] disabled:opacity-40"
                      >
                        Full Analysis
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-16 animate-fade-in">
                    <div className="w-14 h-14 rounded-2xl bg-[#f8f6f3] flex items-center justify-center mx-auto mb-4 border border-[#e8e4de]">
                      <FileText className="h-6 w-6 text-gray-400" />
                    </div>
                    <h3 className="font-serif text-lg font-bold text-[#0a1628] mb-2">No Document Selected</h3>
                    <p className="text-sm text-gray-400 max-w-sm mx-auto leading-relaxed">
                      Upload or select a document to view its details and get AI-powered legal analysis.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Chat;
