
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { FileUp, Gavel, Scale } from 'lucide-react';

const Hero = () => {
  return (
    <div className="bg-gradient-to-br from-legal-primary to-legal-primary/90 text-white py-20">
      <div className="container mx-auto px-4 flex flex-col md:flex-row items-center">
        <div className="md:w-1/2 mb-10 md:mb-0">
          <h1 className="font-serif text-4xl md:text-5xl font-bold mb-4 leading-tight">
            Navigate Ugandan Legal Landscape with Confidence
          </h1>
          <p className="text-lg mb-8 text-gray-200 max-w-lg">
            Comprehensive AI-powered legal research and analysis tailored to Ugandan law, helping professionals and citizens understand their legal rights and obligations.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/documents">
              <Button size="lg" className="bg-legal-secondary text-legal-dark hover:bg-legal-secondary/90 font-medium">
                <FileUp className="mr-2 h-5 w-5" /> Upload Ugandan Documents
              </Button>
            </Link>
            <Link to="/chat">
              <Button size="lg" className="bg-legal-secondary text-legal-dark hover:bg-legal-secondary/90 font-medium">
                <Gavel className="mr-2 h-5 w-5" /> Consult Legal AI
              </Button>
            </Link>
          </div>
        </div>
        <div className="md:w-1/2 flex justify-center">
          <div className="w-full max-w-md bg-white rounded-lg shadow-xl overflow-hidden">
            <div className="bg-gray-50 p-4 border-b border-gray-200">
              <div className="flex items-center">
                <Scale className="h-5 w-5 text-legal-primary mr-2" />
                <span className="font-medium text-legal-dark">Ugandan Legal Insights</span>
              </div>
            </div>
            <div className="p-4 text-legal-dark">
              <div className="font-mono text-sm bg-gray-50 p-3 rounded border border-gray-200 mb-3">
                <span className="text-legal-primary font-medium">User:</span> What are the key provisions in Uganda's Employment Act?
              </div>
              <div className="bg-legal-primary/5 p-3 rounded border border-legal-primary/10">
                <span className="text-legal-primary font-medium">AI Assistant:</span> <span className="text-gray-700">The Uganda Employment Act covers key areas such as: (1) employment contracts, (2) protection against unfair termination, (3) minimum wage regulations, and (4) employee rights and employer obligations.</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
