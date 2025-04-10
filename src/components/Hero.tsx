
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileUp, MessageSquare, FileText } from 'lucide-react';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-legal-primary to-legal-primary/90 text-white py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Revolutionize Your Legal Research with AI
          </h1>
          <p className="text-lg mb-8 text-gray-200 max-w-lg">
            Upload documents, ask questions, and get insights from our powerful legal assistant powered by advanced AI technology.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/documents">
              <Button size="lg" className="bg-legal-secondary text-legal-dark hover:bg-legal-secondary/90 font-medium">
                <FileUp className="mr-2 h-5 w-5" /> Upload Documents
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <MessageSquare className="mr-2 h-5 w-5" /> Try the AI Assistant
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center">
                <FileText className="h-5 w-5 text-legal-primary mr-2" />
                <span className="font-medium text-legal-dark">Legal Document Analysis</span>
              </div>
            </div>
            <div className="p-4 text-legal-dark">
              <div className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                <span className="text-legal-primary font-medium">User:</span> Summarize the key provisions in this contract.
              </div>
              <div className="bg-legal-primary/5 p-3 rounded border border-legal-primary/10">
                <span className="text-legal-primary font-medium">AI Assistant:</span> <span className="text-gray-700">The contract contains three key provisions: (1) a 24-month term with automatic renewal, (2) confidentiality obligations that survive termination by 5 years, and (3) a limitation of liability capped at the fees paid during the prior 12 months, excluding indemnification obligations.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
