import React, { useState } from 'react';
import Navbar from '@/shared/components/Navbar';
import DocumentList from '@/shared/components/DocumentList';
import FileUpload from '@/shared/components/FileUpload';
import ChatInterface from '@/features/chat/components/ChatInterface';
import { Button } from '@/shared/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/components/ui/tabs";
import { FileUp, ListFilter } from 'lucide-react';

// Enhanced document type to include content
type DocumentWithContent = {
  id: string;
  name: string;
  type: string;
  date: string;
  starred?: boolean;
  content?: string;
};

// Sample document data
const sampleDocuments: DocumentWithContent[] = [
  { 
    id: 'doc1', 
    name: 'Service Agreement.pdf', 
    type: 'PDF', 
    date: 'April 10, 2025',
    starred: true
  },
  { 
    id: 'doc2', 
    name: 'Employment Contract.pdf', 
    type: 'PDF', 
    date: 'April 9, 2025' 
  },
  
];

const Documents = () => {
  const [documents, setDocuments] = useState<DocumentWithContent[]>(sampleDocuments);
  const [activeDocument, setActiveDocument] = useState<DocumentWithContent | undefined>(undefined);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('upload');

  const handleFileUploadComplete = (fileId: string, fileData: any) => {
    const newDocument: DocumentWithContent = {
      id: fileId,
      name: fileData.name,
      type: fileData.type.split('/')[1].toUpperCase(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
      content: fileData.content
    };
    
    setDocuments(prev => [newDocument, ...prev]);
    setActiveDocument(newDocument);
    setCurrentTab('chat');
  };

  const handleSelectDocument = (document: DocumentWithContent) => {
    setActiveDocument(document);
    setCurrentTab('chat');
  };

  const handleDeleteDocument = (document: DocumentWithContent) => {
    setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    if (activeDocument?.id === document.id) {
      setActiveDocument(undefined);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 pt-20 pb-8 flex flex-col">
        <h1 className="font-serif text-3xl font-bold text-legal-primary mb-6">Legal Document Center</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-4 flex flex-col">
            {/* Mobile Filters Toggle */}
            <div className="flex justify-between items-center mb-4 lg:hidden">
              <h2 className="font-serif text-xl font-semibold text-legal-primary">Documents</h2>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsMobileFiltersVisible(!isMobileFiltersVisible)}
              >
                <ListFilter className="h-4 w-4 mr-2" /> {isMobileFiltersVisible ? 'Hide' : 'Show'} Documents
              </Button>
            </div>
            <h2 className="font-serif text-xl font-semibold text-legal-primary mb-4 hidden lg:block">Documents</h2>
            
            {/* Document List - Hidden on mobile unless toggled */}
            <div className={`${isMobileFiltersVisible ? 'block' : 'hidden'} lg:block flex-1 overflow-y-auto`}>
              <DocumentList 
                documents={documents} 
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </div>
          
          {/* Main Content Area */}
      <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col">
            <Tabs value={currentTab} onValueChange={setCurrentTab} className="flex flex-col flex-1">
              <TabsList className="w-full grid grid-cols-2 rounded-t-lg bg-gray-50 border-b border-gray-200 shrink-0">
                <TabsTrigger value="upload">Upload & Manage Documents</TabsTrigger>
                <TabsTrigger value="chat" disabled={!activeDocument}>
                  Ask Questions
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="p-6 flex-1 overflow-y-auto">
                <FileUpload onFileUploadComplete={handleFileUploadComplete} />
              </TabsContent>
              
              <TabsContent value="chat" className="flex-1 flex flex-col">
                {activeDocument ? (
                  <ChatInterface activeDocument={activeDocument} />
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <p className="text-gray-500">Select a document to start asking questions</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Documents;
