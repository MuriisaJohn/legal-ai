
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import DocumentList from '@/frontend/components/DocumentList';
import FileUpload from '@/components/FileUpload';
import ChatInterface from '@/components/ChatInterface';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, ListFilter } from 'lucide-react';

// Sample document data
const sampleDocuments = [
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
  { 
    id: 'doc3', 
    name: 'Legal Brief - Jones vs Smith.pdf', 
    type: 'PDF', 
    date: 'April 7, 2025' 
  },
  { 
    id: 'doc4', 
    name: 'Rental Agreement.pdf', 
    type: 'PDF', 
    date: 'April 5, 2025',
    starred: true
  },
  { 
    id: 'doc5', 
    name: 'Terms of Service.txt', 
    type: 'TXT', 
    date: 'April 3, 2025' 
  }
];

const Documents = () => {
  const [documents, setDocuments] = useState(sampleDocuments);
  const [activeDocument, setActiveDocument] = useState<typeof sampleDocuments[0] | undefined>(undefined);
  const [isMobileFiltersVisible, setIsMobileFiltersVisible] = useState(false);
  const [currentTab, setCurrentTab] = useState<string>('upload');

  const handleFileUploadComplete = (fileId: string, fileData: any) => {
    const newDocument = {
      id: fileId,
      name: fileData.name,
      type: fileData.type.split('/')[1].toUpperCase(),
      date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    };
    
    setDocuments(prev => [newDocument, ...prev]);
    setCurrentTab('chat');
    setActiveDocument(newDocument);
  };

  const handleSelectDocument = (document: typeof sampleDocuments[0]) => {
    setActiveDocument(document);
    setCurrentTab('chat');
  };

  const handleDeleteDocument = (document: typeof sampleDocuments[0]) => {
    setDocuments(prev => prev.filter(doc => doc.id !== document.id));
    if (activeDocument?.id === document.id) {
      setActiveDocument(undefined);
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <h1 className="font-serif text-3xl font-bold text-legal-primary mb-6">Legal Document Center</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
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
            
            {/* Document List - Hidden on mobile unless toggled */}
            <div className={`${isMobileFiltersVisible ? 'block' : 'hidden'} lg:block h-[calc(100vh-20rem)]`}>
              <DocumentList 
                documents={documents} 
                onSelectDocument={handleSelectDocument}
                onDeleteDocument={handleDeleteDocument}
              />
            </div>
          </div>
          
          {/* Main Content Area */}
          <div className="lg:col-span-2 bg-white rounded-lg shadow-sm border border-gray-100">
            <Tabs value={currentTab} onValueChange={setCurrentTab}>
              <TabsList className="w-full grid grid-cols-2 rounded-t-lg bg-gray-50 border-b border-gray-200">
                <TabsTrigger value="upload">Upload</TabsTrigger>
                <TabsTrigger value="chat">Chat Assistant</TabsTrigger>
              </TabsList>
              
              <TabsContent value="upload" className="p-6">
                <FileUpload onFileUploadComplete={handleFileUploadComplete} />
              </TabsContent>
              
              <TabsContent value="chat" className="p-0">
                <ChatInterface activeDocument={activeDocument} />
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Documents;
