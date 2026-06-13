import React, { useState } from 'react';
import { Card, CardContent } from "@/shared/components/ui/card";
import { Button } from "@/shared/components/ui/button";
import { ScrollArea } from "@/shared/components/ui/scroll-area";
import { FileText, Search, Trash2, Star, Clock } from 'lucide-react';

export type Document = {
  id: string;
  name: string;
  type: string;
  date: string;
  starred?: boolean;
};

type DocumentListProps = {
  documents?: Document[];
  onSelectDocument?: (document: Document) => void;
  onDeleteDocument?: (document: Document) => void;
};

const DocumentList: React.FC<DocumentListProps> = ({ 
  documents = [], 
  onSelectDocument,
  onDeleteDocument
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'starred' | 'recent'>('all');
  
  const filteredDocuments = documents.filter(doc => {
    // Filter by search
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by category
    if (activeFilter === 'starred') {
      return matchesSearch && doc.starred;
    }
    
    if (activeFilter === 'recent') {
      // For demo purposes, show the first 3 documents as "recent"
      const index = documents.findIndex(d => d.id === doc.id);
      return matchesSearch && index < 3;
    }
    
    // Default "all" filter
    return matchesSearch;
  });

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleStarDocument = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    // In a real app, this would call a function to update the starred status
    console.log(`Starring document: ${doc.id}`);
  };

  const handleDeleteDocument = (doc: Document, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDeleteDocument) {
      onDeleteDocument(doc);
    }
  };

  return (
    <div className="h-full flex flex-col">
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-legal-primary focus:border-transparent"
          />
        </div>
      </div>
      
      <div className="mb-4 flex border-b">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'all' 
              ? 'border-legal-primary text-legal-primary' 
              : 'border-transparent text-gray-500'
          }`}
        >
          All Documents
        </button>
        <button
          onClick={() => setActiveFilter('starred')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'starred' 
              ? 'border-legal-primary text-legal-primary' 
              : 'border-transparent text-gray-500'
          }`}
        >
          Starred
        </button>
        <button
          onClick={() => setActiveFilter('recent')}
          className={`px-4 py-2 font-medium text-sm border-b-2 ${
            activeFilter === 'recent' 
              ? 'border-legal-primary text-legal-primary' 
              : 'border-transparent text-gray-500'
          }`}
        >
          Recent
        </button>
      </div>
      
      <ScrollArea className="flex-1">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-10">
            <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
            <h3 className="font-serif text-lg font-semibold mb-2">No Documents Found</h3>
            <p className="text-legal-accent">Upload a document to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredDocuments.map(doc => (
              <Card 
                key={doc.id}
                className="cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => onSelectDocument && onSelectDocument(doc)}
              >
                <CardContent className="p-4 flex items-center">
                  <FileText className="h-10 w-10 mr-4 text-legal-primary/70" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium truncate">{doc.name}</h4>
                      <div className="flex items-center">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={(e) => handleStarDocument(doc, e)}
                          className="h-8 w-8 p-0"
                        >
                          <Star className={`h-4 w-4 ${doc.starred ? 'fill-yellow-400 text-yellow-400' : 'text-gray-400'}`} />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={(e) => handleDeleteDocument(doc, e)}
                          className="h-8 w-8 p-0 text-gray-400 hover:text-red-500"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-500 mt-1">
                      <span className="bg-gray-100 rounded px-2 py-0.5">{doc.type}</span>
                      <span className="ml-2 flex items-center">
                        <Clock className="h-3 w-3 inline mr-1" />
                        {doc.date}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};

export default DocumentList;
