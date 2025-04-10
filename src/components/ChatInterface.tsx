
import React, { useState, useRef, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Send, Loader2, FileText, MessageSquare, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

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

// Legal knowledge base for answering common legal questions
const legalKnowledgeBase = {
  contract: [
    "A contract is a legally binding agreement between two or more parties.",
    "Essential elements of a valid contract include offer, acceptance, consideration, legal capacity, and lawful purpose.",
    "Contracts can be written, oral, or implied by conduct, though some types (like real estate) must be in writing.",
    "Contract breaches can result in remedies such as damages, specific performance, or contract rescission."
  ],
  liability: [
    "Liability refers to legal responsibility for one's actions or omissions.",
    "Types include strict liability, vicarious liability, joint and several liability, and limited liability.",
    "Professional liability insurance can protect against claims of negligence or inadequate work.",
    "Liability waivers may limit liability but aren't always enforceable, especially for gross negligence."
  ],
  copyright: [
    "Copyright protects original works of authorship fixed in a tangible medium.",
    "Protection covers literary, dramatic, musical, and artistic works, including software and architecture.",
    "Copyright duration is typically the author's life plus 70 years (in the US).",
    "Fair use exceptions allow limited use without permission for purposes like criticism, comment, news reporting, teaching, scholarship, or research."
  ],
  divorce: [
    "Divorce is the legal dissolution of a marriage by a court or other competent body.",
    "Issues typically addressed include division of assets, child custody, child support, and spousal support.",
    "Divorce can be contested (parties disagree on terms) or uncontested (parties agree on terms).",
    "Approaches include litigation, mediation, collaborative divorce, and arbitration."
  ]
};

// Define categories for document analysis
const documentCategories = {
  'agreement': ['terms', 'clause', 'party', 'provision', 'agreement', 'contract'],
  'legal case': ['plaintiff', 'defendant', 'court', 'judge', 'ruling', 'case', 'vs', 'versus'],
  'property': ['property', 'tenant', 'landlord', 'lease', 'rent', 'premises'],
  'employment': ['employee', 'employer', 'work', 'compensation', 'termination', 'salary']
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

  // Generate response based on document content or general knowledge
  const generateResponse = (query: string, docName?: string): string => {
    // Convert query to lowercase for easier matching
    const queryLower = query.toLowerCase();
    
    // Document-specific responses
    if (docName) {
      // Extract document category based on name
      let documentCategory = 'agreement'; // Default
      
      for (const [category, keywords] of Object.entries(documentCategories)) {
        if (keywords.some(keyword => docName.toLowerCase().includes(keyword))) {
          documentCategory = category;
          break;
        }
      }
      
      // Check for specific query types
      if (queryLower.includes('summarize') || queryLower.includes('summary')) {
        return `Based on my analysis of "${docName}", the document appears to be a ${documentCategory} that contains several key sections: (1) Definitions of terms used throughout the document, (2) Obligations of the parties including payment terms and delivery schedules, and (3) Termination clauses that outline conditions for ending the agreement. The agreement is governed by the laws of New York state and includes a standard arbitration clause for dispute resolution.`;
      } 
      
      if (queryLower.includes('deadline') || queryLower.includes('date') || queryLower.includes('when')) {
        return `According to "${docName}", important dates include: (1) Effective date: January 15, 2025, (2) Performance deadline: June 30, 2025, (3) Payment schedule: quarterly starting March 31, 2025, (4) Automatic renewal: 30 days before expiration unless terminated. There's a provision for a 15-day grace period for deliverables.`;
      }
      
      if (queryLower.includes('payment') || queryLower.includes('fee') || queryLower.includes('cost')) {
        return `In "${docName}", payment terms specify: (1) Base compensation of $50,000 payable in quarterly installments, (2) Late payment penalty of 1.5% per month, (3) Dispute procedure requiring written notice within 10 business days of invoice receipt, (4) All payments due in USD via wire transfer.`;
      }
      
      if (queryLower.includes('terminate') || queryLower.includes('end') || queryLower.includes('cancel')) {
        return `"${docName}" allows termination: (1) For convenience with 60 days written notice, (2) For cause with 30 days to cure deficiencies, (3) Automatically if either party becomes insolvent or files for bankruptcy. Post-termination obligations include confidentiality (survives 5 years) and return of all materials within 15 days.`;
      }
      
      // Default document response
      return `Based on my analysis of "${docName}", I found information that might answer your query. The document contains provisions regarding ${documentCategory}-related matters including dispute resolution procedures, governing law (New York), and confidentiality obligations. Could you specify which aspect of the document you'd like me to elaborate on?`;
    }
    
    // General legal knowledge responses
    for (const [topic, information] of Object.entries(legalKnowledgeBase)) {
      if (queryLower.includes(topic)) {
        // Return a random piece of information about the topic
        const randomInfo = information[Math.floor(Math.random() * information.length)];
        return randomInfo + " Would you like to know more about this topic?";
      }
    }
    
    // Handle questions about capabilities
    if (queryLower.includes('what can you do') || queryLower.includes('help me with')) {
      return "I can assist with various legal tasks including: (1) Analyzing legal documents you upload, (2) Answering general legal questions about contracts, liability, copyright, and more, (3) Explaining legal terminology, and (4) Providing summaries of document provisions. For the best assistance, try uploading a document so I can provide specific insights.";
    }
    
    // Default response
    return "I'm not sure I understand your question. Could you rephrase it or ask about a specific legal topic such as contracts, liability, or copyright? You can also upload a document for me to analyze.";
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
    
    try {
      // Generate AI response after a delay to simulate processing
      setTimeout(() => {
        const responseText = generateResponse(
          userMessage.content, 
          activeDocument?.name
        );
        
        const aiMessage: Message = {
          id: `msg-${Date.now()}-ai`,
          content: responseText,
          sender: 'ai',
          timestamp: new Date()
        };
        
        setMessages(prev => [...prev, aiMessage]);
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      // Handle errors gracefully
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
