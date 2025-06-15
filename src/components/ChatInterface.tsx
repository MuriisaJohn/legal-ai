import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, FileText, MessageSquare, AlertCircle, Settings } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { generateResponseWithOpenRouter, answerQuestion, summarizeDocument, analyzeDocumentContent } from '@/frontend/services/openRouterService';

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

const formatMessageContent = (content: string): JSX.Element => {
  // Remove # characters
  let formattedContent = content.replace(/#/g, '');
  
  // Split by **text** pattern and process
  const parts = formattedContent.split(/(\*\*.*?\*\*)/g);
  
  return (
    <div className="whitespace-pre-wrap">
      {parts.map((part, index) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          const boldText = part.slice(2, -2);
          return <strong key={index}>{boldText}</strong>;
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
  const [apiKey, setApiKey] = useState('');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add a welcome message if there are no messages
  useEffect(() => {
    if (messages.length === 0 && activeDocument) {
      const hasContent = activeDocument.content ? " I can analyze its content and " : " ";
      setMessages([
        {
          id: 'welcome',
          content: `I'm your legal assistant.${hasContent}I'm ready to answer questions about "${activeDocument.name}" or Ugandan law in general.`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    } else if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "I'm your legal assistant. Upload a document or ask me a question about Ugandan law.",
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    }
  }, [activeDocument]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (inputValue.trim() === '') return;
    
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your OpenRouter API key to use the AI assistant.",
        variant: "destructive"
      });
      setShowApiKeyInput(true);
      return;
    }
    
    // Add user message
    const userMessage: Message = {
      id: `msg-${Date.now()}-user`,
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);
    
    try {
      const responseText = await answerQuestion(
        userMessage.content,
        activeDocument?.name || null,
        activeDocument?.content || null,
        apiKey
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
        description: "Failed to generate a response. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSummarizeDocument = async () => {
    if (!activeDocument || !apiKey.trim()) {
      toast({
        title: "Requirements Missing",
        description: "Please select a document and enter your API key.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const summary = await summarizeDocument(
        activeDocument.name, 
        activeDocument.content || null, 
        apiKey
      );
      
      const summaryMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: `**Document Summary for "${activeDocument.name}":**\n\n${summary}`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, summaryMessage]);
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
        description: "Failed to summarize document. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnalyzeDocument = async () => {
    if (!activeDocument || !activeDocument.content || !apiKey.trim()) {
      toast({
        title: "Requirements Missing",
        description: "Please select a document with content and enter your API key.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);
    
    try {
      const analysis = await analyzeDocumentContent(
        activeDocument.name,
        activeDocument.content,
        apiKey
      );
      
      const analysisMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: `**Comprehensive Legal Analysis for "${activeDocument.name}":**\n\n${analysis}`,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, analysisMessage]);
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
        description: "Failed to analyze document. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
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
    <div className="flex flex-col h-[calc(100vh-12rem)]">
      {/* API Key Input Section */}
      {showApiKeyInput && (
        <div className="p-4 bg-yellow-50 border-b border-yellow-200">
          <div className="flex items-center gap-2 mb-2">
            <Settings className="h-4 w-4 text-yellow-600" />
            <span className="text-sm font-medium text-yellow-800">OpenRouter API Configuration</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter your OpenRouter API key (sk-or-v1-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={() => setShowApiKeyInput(false)}
              variant="outline"
              size="sm"
            >
              Done
            </Button>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            Your API key is stored locally and not sent to our servers.
          </p>
        </div>
      )}

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="border-b p-2 bg-white">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full max-w-md grid-cols-2">
              <TabsTrigger value="chat" className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                <span>Document Info</span>
              </TabsTrigger>
            </TabsList>
            
            <div className="flex gap-2">
              {activeDocument && (
                <>
                  <Button
                    onClick={handleSummarizeDocument}
                    disabled={isLoading || !apiKey.trim()}
                    variant="outline"
                    size="sm"
                  >
                    Summarize
                  </Button>
                  {activeDocument.content && (
                    <Button
                      onClick={handleAnalyzeDocument}
                      disabled={isLoading || !apiKey.trim()}
                      variant="outline"
                      size="sm"
                    >
                      Full Analysis
                    </Button>
                  )}
                </>
              )}
              <Button
                onClick={() => setShowApiKeyInput(!showApiKeyInput)}
                variant="outline"
                size="sm"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 p-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4 pb-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] rounded-lg p-4 ${
                    message.sender === 'user' 
                      ? 'bg-legal-primary text-white' 
                      : message.isError 
                        ? 'bg-red-100 border border-red-300 text-gray-900' 
                        : 'bg-gray-100 text-gray-900'
                  }`}>
                    {message.isError && <AlertCircle className="h-4 w-4 text-red-500 mb-1" />}
                    {formatMessageContent(message.content)}
                    <div className={`text-xs mt-1 ${
                      message.sender === 'user' ? 'text-gray-300' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="bg-gray-100 rounded-lg p-4 flex items-center space-x-2 max-w-[80%]">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>AI is analyzing {activeDocument ? `"${activeDocument.name}"` : "your question"}...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeDocument 
                ? `Ask about "${activeDocument.name}" or Ugandan law...` 
                : "Ask a question about Ugandan law..."}
              className="flex-1"
              disabled={isLoading}
            />
            <Button
              onClick={handleSendMessage}
              disabled={inputValue.trim() === '' || isLoading}
              className="bg-legal-primary hover:bg-legal-primary/90"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="document" className="flex-1 p-4 overflow-y-auto">
          {activeDocument ? (
            <Card>
              <CardContent className="p-6">
                <h3 className="font-serif text-xl font-semibold mb-4">{activeDocument.name}</h3>
                <div className="space-y-4">
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Document Type</h4>
                    <p>Legal Document</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Uploaded</h4>
                    <p>{activeDocument.date || "Recently"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">AI Analysis</h4>
                    <p className="text-sm text-legal-dark">
                      This document is ready for AI-powered analysis. Use the "Summarize Document" button or ask specific questions about its contents in the chat.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">No Document Selected</h3>
              <p className="text-legal-accent">Upload or select a document to view its details and get AI-powered analysis.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatInterface;
