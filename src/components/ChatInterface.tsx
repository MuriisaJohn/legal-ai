import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, FileText, MessageSquare, AlertCircle, Settings, Bot, User } from 'lucide-react';
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
          return <strong key={index} className="font-semibold">{boldText}</strong>;
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
    
    try {
      console.log('Summarizing document:', activeDocument.name);
      console.log('Document content length:', activeDocument.content.length);
      
      const summary = await summarizeDocument(
        activeDocument.name, 
        activeDocument.content, 
        apiKey
      );
      
      const summaryMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: `Document Summary for "${activeDocument.name}": ${summary}`,
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
        <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200">
          <div className="flex items-center gap-2 mb-3">
            <Settings className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">OpenRouter API Configuration</span>
          </div>
          <div className="flex gap-2">
            <Input
              type="password"
              placeholder="Enter your OpenRouter API key (sk-or-v1-...)"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="flex-1 bg-white border-blue-200 focus:border-blue-400"
            />
            <Button
              onClick={() => setShowApiKeyInput(false)}
              variant="outline"
              size="sm"
              className="border-blue-200 hover:bg-blue-50"
            >
              Done
            </Button>
          </div>
          <p className="text-xs text-blue-700 mt-2">
            Your API key is stored locally and not sent to our servers.
          </p>
        </div>
      )}

      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="border-b bg-white px-4 py-3">
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
                    className="hover:bg-blue-50"
                  >
                    Summarize
                  </Button>
                  {activeDocument.content && (
                    <Button
                      onClick={handleAnalyzeDocument}
                      disabled={isLoading || !apiKey.trim()}
                      variant="outline"
                      size="sm"
                      className="hover:bg-blue-50"
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
                className="hover:bg-gray-50"
              >
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col overflow-hidden">
          {/* Chat Messages Container */}
          <ScrollArea className="flex-1 px-4 py-6">
            <div className="space-y-6 max-w-4xl mx-auto">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex items-start gap-3 ${
                    message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
                  }`}
                >
                  {/* Avatar */}
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    message.sender === 'user' 
                      ? 'bg-legal-primary text-white' 
                      : message.isError 
                        ? 'bg-red-100 text-red-600' 
                        : 'bg-blue-100 text-blue-600'
                  }`}>
                    {message.sender === 'user' ? (
                      <User className="h-4 w-4" />
                    ) : message.isError ? (
                      <AlertCircle className="h-4 w-4" />
                    ) : (
                      <Bot className="h-4 w-4" />
                    )}
                  </div>

                  {/* Message Bubble */}
                  <div className={`flex flex-col max-w-[70%] ${
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  }`}>
                    {/* Sender Label */}
                    <div className={`text-xs font-medium mb-1 px-1 ${
                      message.sender === 'user' ? 'text-legal-primary' : 'text-blue-600'
                    }`}>
                      {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    </div>

                    {/* Message Content */}
                    <div className={`rounded-2xl px-4 py-3 shadow-sm ${
                      message.sender === 'user' 
                        ? 'bg-legal-primary text-white rounded-tr-sm' 
                        : message.isError 
                          ? 'bg-red-50 border border-red-200 text-gray-900 rounded-tl-sm' 
                          : 'bg-white border border-gray-200 text-gray-900 rounded-tl-sm'
                    }`}>
                      {formatMessageContent(message.content)}
                    </div>

                    {/* Timestamp */}
                    <div className={`text-xs mt-1 px-1 ${
                      message.sender === 'user' ? 'text-gray-500' : 'text-gray-500'
                    }`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}

              {/* Typing Indicator */}
              {isLoading && (
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                    <Bot className="h-4 w-4" />
                  </div>
                  <div className="flex flex-col items-start">
                    <div className="text-xs font-medium mb-1 px-1 text-blue-600">
                      AI Assistant
                    </div>
                    <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
                        </div>
                        <span className="text-sm text-gray-600">
                          {activeDocument ? `Analyzing "${activeDocument.name}"...` : "Thinking..."}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="border-t bg-white px-4 py-4">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-3 items-end">
                <div className="flex-1 relative">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={activeDocument 
                      ? `Ask about "${activeDocument.name}" or Ugandan law...` 
                      : "Ask a question about Ugandan law..."}
                    className="rounded-2xl border-gray-300 focus:border-legal-primary focus:ring-legal-primary pr-12 py-3 shadow-sm"
                    disabled={isLoading}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={inputValue.trim() === '' || isLoading}
                    size="sm"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl bg-legal-primary hover:bg-legal-primary/90 h-8 w-8 p-0"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="document" className="flex-1 p-4 overflow-y-auto">
          {activeDocument ? (
            <Card className="max-w-2xl mx-auto">
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
