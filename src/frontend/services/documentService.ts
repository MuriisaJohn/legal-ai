
import { Document } from '../types';

// Sample document data
export const sampleDocuments: Document[] = [
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

// Mock document service functions
export const fetchDocuments = async (): Promise<Document[]> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(sampleDocuments);
    }, 500);
  });
};

export const createDocument = async (document: Partial<Document>): Promise<Document> => {
  // Simulate API call
  return new Promise((resolve) => {
    setTimeout(() => {
      const newDocument: Document = {
        id: `doc-${Date.now()}`,
        name: document.name || 'Untitled',
        type: document.type || 'PDF',
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        starred: document.starred || false,
      };
      
      resolve(newDocument);
    }, 500);
  });
};
