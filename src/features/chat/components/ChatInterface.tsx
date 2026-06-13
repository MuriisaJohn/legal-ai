import { useEffect, useCallback } from 'react';
import { Button } from "@/shared/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { FileText, MessageSquare } from 'lucide-react';
import { toast } from "@/shared/components/ui/use-toast";
import { validateGeminiApiKey } from '@/frontend/services/geminiService';
import { useChat } from '@/features/chat/hooks/useChat';
import { MessageList } from './MessageList';
import { ChatInput } from './ChatInput';
import { DocumentInfoPanel } from '@/features/documents/components/DocumentInfoPanel';

type Document = {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
  content?: string;
};

type ChatInterfaceProps = {
  activeDocument?: Document;
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ activeDocument }) => {
  const { messages, isLoading, sendMessage, summarizeDocument, analyzeDocument } = useChat(activeDocument);
  const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';

  useEffect(() => {
    if (!apiKey) return;
    validateGeminiApiKey(apiKey).then(validation => {
      if (!validation.valid) {
        toast({ title: "API Key Issue", description: validation.error || "Please check your Gemini API key.", variant: "destructive" });
      }
    });
  }, [apiKey]);

  const handleSummarize = useCallback(() => {
    if (!activeDocument?.content) {
      toast({ title: "No Content", description: "Selected document has no extractable text.", variant: "destructive" });
      return;
    }
    summarizeDocument(activeDocument.name, activeDocument.content);
  }, [activeDocument, summarizeDocument]);

  const handleAnalyze = useCallback(() => {
    if (!activeDocument?.content) {
      toast({ title: "No Content", description: "Selected document has no extractable text.", variant: "destructive" });
      return;
    }
    analyzeDocument(activeDocument.name, activeDocument.content);
  }, [activeDocument, analyzeDocument]);

  return (
    <div className="flex flex-col h-[600px] bg-white rounded-lg shadow-lg border border-gray-100 relative">
      <Tabs defaultValue="chat" className="flex-1 flex flex-col min-h-0">
        <div className="border-b bg-gray-50 px-4 py-3 rounded-t-lg">
          <div className="flex justify-between items-center">
            <TabsList className="grid w-full max-w-md grid-cols-2 bg-gray-100">
              <TabsTrigger value="chat" className="flex items-center gap-2 data-[state=active]:bg-legal-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                <MessageSquare className="h-4 w-4" /> <span>Chat</span>
              </TabsTrigger>
              <TabsTrigger value="document" className="flex items-center gap-2 data-[state=active]:bg-legal-primary data-[state=active]:text-white data-[state=active]:shadow-sm">
                <FileText className="h-4 w-4" /> <span>Document Info</span>
              </TabsTrigger>
            </TabsList>
            {activeDocument && (
              <div className="flex gap-2">
                <Button onClick={handleSummarize} disabled={isLoading} variant="outline" size="sm" className="hover:bg-legal-light text-legal-primary border-legal-primary">Summarize</Button>
                {activeDocument.content && (
                  <Button onClick={handleAnalyze} disabled={isLoading} variant="outline" size="sm" className="hover:bg-legal-light text-legal-primary border-legal-primary">Full Analysis</Button>
                )}
              </div>
            )}
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <MessageList messages={messages} />
          <ChatInput onSend={handleSend} disabled={isLoading} placeholder={activeDocument ? `Ask about "${activeDocument.name}"...` : "Ask a question about the contract..."} />
        </TabsContent>

        <TabsContent value="document" className="flex-1 overflow-hidden">
          <DocumentInfoPanel document={activeDocument ?? null} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ChatInterface;