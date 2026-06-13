import { Card, CardContent } from "@/shared/components/ui/card";
import { FileText } from 'lucide-react';

interface Document {
  id: string;
  name: string;
  type?: string;
  date?: string;
  starred?: boolean;
  content?: string;
}

interface DocumentInfoPanelProps {
  document: Document | null;
}

export const DocumentInfoPanel = ({ document }: DocumentInfoPanelProps) => {
  if (!document) {
    return (
      <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
        <div className="text-center py-10">
          <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="font-serif text-lg font-semibold mb-2 text-gray-700">No Document Selected</h3>
          <p className="text-gray-500">Upload or select a document to view its details and get AI-powered analysis.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 overflow-y-auto bg-gray-50">
      <Card className="max-w-2xl mx-auto shadow-md">
        <CardContent className="p-6">
          <h3 className="font-serif text-xl font-semibold mb-4 text-legal-dark">{document.name}</h3>
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-legal-accent">Document Type</h4>
              <p className="text-gray-700">Legal Document</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-legal-accent">Uploaded</h4>
              <p className="text-gray-700">{document.date || "Recently"}</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-legal-accent">AI Analysis</h4>
              <p className="text-gray-600">
                This document is ready for AI-powered analysis. Use the "Summarize Document" button or ask specific questions about its contents in the chat.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
