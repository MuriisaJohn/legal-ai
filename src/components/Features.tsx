
import React from 'react';
import { FileUp, Search, MessageSquare, Globe, Lock, FileText } from 'lucide-react';

const features = [
  {
    icon: <FileUp className="h-8 w-8 text-legal-secondary" />,
    title: 'Upload Documents',
    description: 'Easily upload PDFs, images, and text files containing legal documents for analysis.'
  },
  {
    icon: <Search className="h-8 w-8 text-legal-secondary" />,
    title: 'Smart Analysis',
    description: 'Our AI engine extracts and summarizes key information from your legal documents.'
  },
  {
    icon: <MessageSquare className="h-8 w-8 text-legal-secondary" />,
    title: 'Ask Questions',
    description: 'Ask specific questions about your documents and get accurate, contextual answers.'
  },
  {
    icon: <Globe className="h-8 w-8 text-legal-secondary" />,
    title: 'Multilingual Support',
    description: 'Support for documents in multiple languages with automatic translation capabilities.'
  },
  {
    icon: <Lock className="h-8 w-8 text-legal-secondary" />,
    title: 'Secure Storage',
    description: 'Your documents are encrypted and securely stored with enterprise-grade security.'
  },
  {
    icon: <FileText className="h-8 w-8 text-legal-secondary" />,
    title: 'Document History',
    description: 'Access your document history and previous conversations at any time.'
  }
];

const Features = () => {
  return (
    <section className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4 text-legal-primary">Powerful Features</h2>
        <p className="text-center text-legal-accent max-w-2xl mx-auto mb-12">
          Our platform combines cutting-edge AI technology with an intuitive interface to streamline your legal document workflows.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div key={index} className="bg-gray-50 p-6 rounded-lg border border-gray-100 hover:shadow-md transition-shadow">
              <div className="mb-4">{feature.icon}</div>
              <h3 className="font-serif text-xl font-semibold mb-2 text-legal-primary">{feature.title}</h3>
              <p className="text-legal-accent">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
