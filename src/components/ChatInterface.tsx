import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { simulateOpenAIResponse } from '@/services/openaiService';

type Document = {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
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

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeDocument }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (messages.length === 0 && activeDocument) {
      setMessages([
        {
          id: 'welcome',
          content: `I'm your legal assistant. Ask me any questions about "${activeDocument.name}".`,
          sender: 'ai',
          timestamp: new Date()
        }
      ]);
    } else if (messages.length === 0) {
      setMessages([
        {
          id: 'welcome',
          content: "I'm your legal assistant. Upload a document or ask me a general legal question.",
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
      let documentContext = "";
      if (activeDocument) {
        documentContext = `Document: ${activeDocument.name}. This is a legal document that contains information about terms, conditions, and legal agreements.`;
      }

      const responseText = await simulateOpenAIResponse({
        question: userMessage.content,
        context: documentContext,
        language: 'English'
      });
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    } catch (error) {
      console.error("Error generating response:", error);
      
      const errorMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: "I apologize, but I encountered an error while processing your request. Please try again.",
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      
      setMessages(prev => [...prev, errorMessage]);
      setIsLoading(false);
      
      toast({
        title: "Error",
        description: "Failed to generate a response. Please try again.",
        variant: "destructive"
      });
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
      <Tabs defaultValue="chat" className="flex-1 flex flex-col">
        <div className="border-b p-2 bg-white">
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
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col space-y-4 p-4 overflow-hidden">
          <div className="flex-1 overflow-y-auto">
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
                    {message.content}
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
                    <span>Analyzing {activeDocument ? `document "${activeDocument.name}"` : "your question"}...</span>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="flex gap-2">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={activeDocument 
                ? `Ask about "${activeDocument.name}"...` 
                : "Ask a legal question..."}
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
                    <p>Legal Contract</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Uploaded</h4>
                    <p>{activeDocument.date || "April 10, 2025"}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Language</h4>
                    <p>English</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Summary</h4>
                    <p className="text-sm text-legal-dark">
                      This document is a service agreement between two parties outlining terms and conditions for software development services. It includes sections on payment terms, intellectual property rights, confidentiality, and termination clauses. The agreement is governed by New York law and includes arbitration provisions for dispute resolution.
                    </p>
                  </div>
                  <div>
                    <h4 className="text-sm font-medium text-legal-accent">Key Entities</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                      <span className="bg-legal-primary/10 text-legal-primary text-xs py-1 px-2 rounded">ACME Inc.</span>
                      <span className="bg-legal-primary/10 text-legal-primary text-xs py-1 px-2 rounded">TechSolutions LLC</span>
                      <span className="bg-legal-primary/10 text-legal-primary text-xs py-1 px-2 rounded">New York</span>
                      <span className="bg-legal-primary/10 text-legal-primary text-xs py-1 px-2 rounded">June 30, 2023</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="text-center py-10">
              <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
              <h3 className="font-serif text-lg font-semibold mb-2">No Document Selected</h3>
              <p className="text-legal-accent">Upload or select a document to view its details.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatInterface;
