import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, FileText, MessageSquare, AlertCircle, Bot, User } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { generateResponseWithOpenRouter, answerQuestion, summarizeDocument, analyzeDocumentContent, summarizeDocumentStreaming, analyzeDocumentContentStreaming, validateOpenRouterApiKey } from '@/frontend/services/openRouterService';

type Document = {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
  content?: string;
};

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
};

type ChatInterfaceProps = {
  activeDocument?: Document;
};

// Helper to detect greetings
const isGreeting = (text: string) => {
  const greetings = [
    "hi", "hello", "hey", "good morning", "good afternoon", "good evening",
    "greetings", "howdy", "yo", "sup", "what's up", "morning", "afternoon", "evening"
  ];
  const normalized = text.trim().toLowerCase();
  return greetings.some(greet => normalized === greet || normalized.startsWith(greet + " "));
};

const formatMessageContent = (content: string): JSX.Element => {
  let formattedContent = content.replace(/#/g, '');
  // Split by **bold** and *italic*
  const parts = formattedContent.split(/(\*\*.*?\*\*|\*.*?\*)/g);

  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={index} className="font-semibold">{boldText}</strong>;
        }
        if (part.startsWith('*') && part.endsWith('*')) {
          const italicText = part.slice(1, -1);
          return <span key={index} className="italic text-legal-accent">{italicText}</span>;
        }
        return part;
      })}
    </div>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeDocument }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || '';

  useEffect(() => {
    if (messages.length === 0 && activeDocument) {
      const hasContent = activeDocument.content ? " I can analyze its content and " : " ";
      setMessages([
        {
          id: 'welcome',
          content: `I'm your legal assistant.${hasContent}I'm ready to answer questions about "${activeDocument.name}" or law in general.`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    } else if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "Welcome! I'm your legal assistant. I can help with questions about land law, business regulations, criminal law, family law, and constitutional rights. How may I assist you today?",
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [activeDocument]);

  // Validate API key on component mount
  useEffect(() => {
    const validateApiKey = async () => {
      if (apiKey) {
        const validation = await validateOpenRouterApiKey(apiKey);
        if (!validation.valid) {
          toast({
            title: "API Key Issue",
            description: validation.error || "Please check your OpenRouter API key configuration.",
            variant: "destructive"
          });
        }
      }
    };

    validateApiKey();
  }, [apiKey]);


  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;

    if (!apiKey) {
      toast({
        title: "API Key Missing",
        description: "The OpenRouter API key is not configured. Please check your environment variables.",
        variant: "destructive"
      });
      return;
    }

    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');

    // Greeting check
    if (isGreeting(inputValue)) {
      setMessages(prev => [
        ...prev,
        {
          id: `msg-${Date.now()}-ai`,
          content: "Hello! How can I assist you with your legal questions today?",
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
      return;
    }

    setIsLoading(true);

    // Prepare conversational context (last 10 messages)
    const lastMessages = [...messages, userMessage].slice(-10);
    const context = lastMessages.map(m => `${m.sender === 'user' ? 'User' : 'AI'}: ${m.content}`).join('\n');

    try {
      const responseText = await answerQuestion(
        inputValue, // question
        context, // conversationContext
        activeDocument?.name || null, // documentContext
        activeDocument?.content || null, // documentContent
        apiKey // apiKey
      );

      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: responseText,
        sender: 'ai',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      console.error("Error generating response:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: error instanceof Error ? error.message : "I apologize, but I encountered an error while processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to generate a response. Please check the API configuration.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeDocument = async () => {
    if (!activeDocument) {
      toast({
        title: "No Document Selected",
        description: "Please select a document to summarize.",
        variant: "destructive"
      });
      return;
    }

    if (!activeDocument.content || activeDocument.content.trim() === '') {
      toast({
        title: "No Document Content",
        description: "The selected document doesn't have extractable text content. Please upload a text-based document.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    const summaryRequestMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: `Summarize "${activeDocument.name}"`,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, summaryRequestMessage]);

    // Create an initial AI message for streaming summary
    const summaryMessageId = `msg-${Date.now()}-ai`;
    const initialSummaryMessage: Message = {
      id: summaryMessageId,
      content: `Document Summary for "${activeDocument.name}": `,
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, initialSummaryMessage]);

    try {
      await summarizeDocumentStreaming(
        activeDocument.name,
        activeDocument.content,
        apiKey,
        // onChunk callback
        (chunk: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === summaryMessageId 
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        // onComplete callback
        () => {
          setIsLoading(false);
        },
        // onError callback
        (error: Error) => {
          console.error("Error summarizing document:", error);
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === summaryMessageId 
                ? { ...msg, content: error.message || "Failed to summarize the document. Please try again.", isError: true }
                : msg
            )
          );
          
          toast({
            title: "Error",
            description: "Failed to summarize document. Please check the API configuration.",
            variant: "destructive"
          });
          
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error summarizing document:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: error instanceof Error ? error.message : "Failed to summarize the document. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to summarize document. Please check the API configuration.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!activeDocument || !activeDocument.content) {
      toast({
        title: "Requirements Missing",
        description: "Please select a document with content to analyze.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    // Create an initial AI message for streaming analysis
    const analysisMessageId = `msg-${Date.now()}-ai`;
    const initialAnalysisMessage: Message = {
      id: analysisMessageId,
      content: `**Comprehensive Legal Analysis for "${activeDocument.name}":**\n\n`,
      sender: 'ai',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, initialAnalysisMessage]);

    try {
      await analyzeDocumentContentStreaming(
        activeDocument.name,
        activeDocument.content,
        apiKey,
        // onChunk callback
        (chunk: string) => {
          setMessages(prev => 
            prev.map(msg => 
              msg.id === analysisMessageId 
                ? { ...msg, content: msg.content + chunk }
                : msg
            )
          );
        },
        // onComplete callback
        () => {
          setIsLoading(false);
        },
        // onError callback
        (error: Error) => {
          console.error("Error analyzing document:", error);
          
          setMessages(prev => 
            prev.map(msg => 
              msg.id === analysisMessageId 
                ? { ...msg, content: error.message || "Failed to analyze the document. Please try again.", isError: true }
                : msg
            )
          );
          
          toast({
            title: "Error",
            description: "Failed to analyze document. Please check the API configuration.",
            variant: "destructive"
          });
          
          setIsLoading(false);
        }
      );
    } catch (error) {
      console.error("Error analyzing document:", error);

      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: error instanceof Error ? error.message : "Failed to analyze the document. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };

      setMessages(prev => [...prev, errorMessage]);

      toast({
        title: "Error",
        description: "Failed to analyze document. Please check the API configuration.",
        variant: "destructive"
      });
      
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    // Outer container with a defined height (e.g., h-[600px] or max-h-[80vh]).
    // This constrains the overall chat widget.
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-100">
      {/* Tabs component, flex-1 to take available height, flex-col for its children */}
      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        {/* Header/Tab Navigation area - fixed height provided by content/padding */}
        <div className="border-b bg-gray-50 px-4 py-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100">
              <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-legal-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-legal-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" />
                <span>Document Info</span>
              </TabsTrigger>
            </TabsList>

            <div className="flex gap-2">
              {activeDocument && (
                <>
                  <Button
                    onClick={handleSummarizeDocument}
                    disabled={isLoading}
                    variant="outline"
                    size="sm"
                    className="hover:bg-legal-light text-legal-primary border-legal-primary"
                  >
                    Summarize
                  </Button>
                  {activeDocument.content && (
                    <Button
                      onClick={handleAnalyzeDocument}
                      disabled={isLoading}
                      variant="outline"
                      size="sm"
                      className="hover:bg-legal-light text-legal-primary border-legal-primary"
                    >
                      Full Analysis
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Chat Content Tab - This area is flex-1, taking remaining height, and is a flex container for its children */}
        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Messages display area - This div takes up all available space within TabsContent, pushing the input down.
              `overflow-hidden` is crucial here because `ScrollArea` inside it will handle the scrolling. */}
          <div className="flex-1 overflow-hidden bg-white p-4">
            {/* ScrollArea - It needs its parent (`.flex-1.overflow-hidden`) to be constrained in height
                for its own internal scrolling to activate. `h-full` ensures it uses all available height. */}
            <ScrollArea className="h-full">
              <div className="space-y-6 pb-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 max-w-full ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    {/* Avatar */}
                    {message.sender === 'ai' && (
                      <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                        message.isError
                          ? 'bg-red-500 text-white'
                          : 'bg-legal-primary text-white'
                      }`}>
                        {message.isError ? (
                          <AlertCircle className="h-4 w-4" />
                        ) : (
                          <Bot className="h-4 w-4" />
                        )}
                      </div>
                    )}

                    <div className={`flex flex-col ${
                        message.sender === 'user' ? 'items-end' : 'items-start'
                    } max-w-[80%] sm:max-w-[65%]`}>
                      {/* Sender Label */}
                      <div className={`text-xs font-medium mb-1 px-1 ${
                        message.sender === 'user' ? 'text-gray-600' : 'text-gray-600'
                      }`}>
                        {message.sender === 'user' ? 'You' : 'AI Assistant'}
                      </div>

                      {/* Message Content */}
                      <div className={`rounded-xl px-4 py-3 shadow-md border ${
                        message.sender === 'user'
                          ? 'bg-legal-primary text-white border-legal-primary'
                          : message.isError
                            ? 'bg-red-100 border-red-300 text-red-900'
                            : 'bg-blue-50 border-blue-200 text-gray-800'
                      }`}>
                        {formatMessageContent(message.content)}
                      </div>

                      {/* Timestamp */}
                      <div className={`text-xs mt-1 px-1 text-gray-500 ${
                        message.sender === 'user' ? 'text-right' : 'text-left'
                      }`}>
                        {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
                    </div>

                    {message.sender === 'user' && (
                        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-300 text-gray-700`}>
                            <User className="h-4 w-4" />
                        </div>
                    )}
                  </div>
                ))}

                <div ref={messagesEndRef} />
              </div>
            </ScrollArea>
          </div>

          {/* Message Input - This is the footer area, it will stay at the bottom. */}
          <div className="border-t bg-gray-50 px-4 py-4 rounded-b-lg">
            <div className="flex gap-3 items-end">
              <div className="flex-1 relative">
                <Input
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={activeDocument
                    ? `Ask about "${activeDocument.name}" or review the document...`
                    : "Ask a question about the contract..."}
                  className="rounded-full border-gray-300 focus:border-legal-primary focus:ring-legal-primary pr-12 py-3 shadow-sm bg-white"
                  disabled={isLoading}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={inputValue.trim() === '' || isLoading}
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-full bg-legal-primary hover:bg-legal-primary/90 h-9 w-9 p-0"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Document Info Tab - Also needs to be scrollable if content exceeds height */}
        <TabsContent value="document" className="flex-1 p-4 overflow-y-auto bg-gray-50">
          {activeDocument ? (
            <Card className="max-w-2xl mx-auto shadow-md">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold mb-4 text-legal-dark">{activeDocument.name}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Document Type</h4>
                    <p className="text-gray-700">Legal Document</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Uploaded</h4>
                    <p className="text-gray-700">{activeDocument.date || "Recently"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">AI Analysis</h4>
                    <p className="text-gray-600">
                      This document is ready for AI-powered analysis. Use the "Summarize Document" button or ask specific questions about its contents in the chat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2 text-gray-700">No Document Selected</h3>
              <p className="text-gray-500">Upload or select a document to view its details and get AI-powered analysis.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatInterface;