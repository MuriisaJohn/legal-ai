
import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatInterface from '@/components/ChatInterface';
import DocumentList from '@/frontend/components/DocumentList';
import { FileText, MessageSquare } from 'lucide-react';

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

// Define proper document type
type Document = {
  id: string;
  name: string;
  type: string;
  date: string;
  starred?: boolean;
};

const Chat = () => {
  const [activeDocument, setActiveDocument] = useState<Document | undefined>(undefined);

  // Properly type the handler function
  const handleSelectDocument = (document: Document) => {
    setActiveDocument(document);
  };

  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center">
          <MessageSquare className="mr-3 h-7 w-7 text-legal-secondary" />
          <h1 className="font-serif text-3xl font-bold text-legal-primary">AI Legal Assistant</h1>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Documents sidebar */}
          <div className="md:col-span-1 bg-white rounded-lg shadow-sm border border-gray-100 p-4">
            <div className="flex items-center mb-4">
              <FileText className="mr-2 h-5 w-5 text-legal-primary" />
              <h2 className="font-serif font-semibold">Your Documents</h2>
            </div>
            
            <div className="h-[calc(100vh-18rem)]">
              <DocumentList 
                documents={sampleDocuments} 
                onSelectDocument={handleSelectDocument} 
              />
            </div>
          </div>
          
          {/* Main chat area */}
          <div className="md:col-span-3 bg-white rounded-lg shadow-sm border border-gray-100 h-[calc(100vh-12rem)]">
            <ChatInterface activeDocument={activeDocument} />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Chat;
