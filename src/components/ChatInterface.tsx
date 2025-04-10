
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, FileText, MessageSquare } from 'lucide-react';

type Message = {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

type ChatInterfaceProps = {
  activeDocument?: {
    id: string;
    name: string;
  };
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeDocument }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Add a welcome message if there are no messages
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

  const handleSendMessage = () => {
    if (inputValue.trim() === '') return;
    
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
    
    // Simulate AI response after a delay
    setTimeout(() => {
      let responseText = '';
      
      if (activeDocument) {
        responseText = `Based on my analysis of "${activeDocument.name}", `;
        
        if (inputValue.toLowerCase().includes('summarize') || inputValue.toLowerCase().includes('summary')) {
          responseText += "the document contains three key sections: (1) Definitions of terms used throughout the agreement, (2) Obligations of the parties including payment terms and delivery schedules, and (3) Termination clauses that outline conditions for ending the agreement. The agreement is governed by the laws of New York state and includes a standard arbitration clause for dispute resolution.";
        } else if (inputValue.toLowerCase().includes('deadline') || inputValue.toLowerCase().includes('date')) {
          responseText += "the agreement specifies that all deliverables must be completed by June 30, 2023. There's a provision for a 15-day grace period, but any delays beyond that will incur a penalty of 2% of the total contract value per week, capped at 10%.";
        } else {
          responseText += "I found relevant information that might answer your query. The document specifies that disputes shall be resolved through arbitration in New York. Parties must provide written notice of any alleged breach and allow 30 days for remediation before initiating legal proceedings. Would you like me to elaborate on any specific aspect of this?";
        }
      } else {
        responseText = "I'd be happy to help answer your question, but I don't see any uploaded documents to reference. Would you like to upload a document first, or would you prefer a general legal explanation about this topic?";
      }
      
      const aiMessage: Message = {
        id: `msg-${Date.now()}-ai`,
        content: responseText,
        sender: 'ai',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 2000);
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
                  <div className={message.sender === 'user' ? 'chat-message-user' : 'chat-message-ai'}>
                    {message.content}
                    <div className={`text-xs mt-1 ${message.sender === 'user' ? 'text-gray-300' : 'text-gray-400'}`}>
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              {isLoading && (
                <div className="flex justify-start">
                  <div className="chat-message-ai flex items-center">
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    <span>Analyzing document...</span>
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
              placeholder="Ask a question about your document..."
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
                    <p>April 10, 2025</p>
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
