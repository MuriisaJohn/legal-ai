import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ChatInterface from '@/components/ChatInterface';
import { MessageSquare } from 'lucide-react';

const Chat = () => {
  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1 container mx-auto px-4 py-8 flex flex-col">
        <div className="mb-6 flex items-center">
          <MessageSquare className="mr-3 h-7 w-7 text-legal-secondary" />
          <h1 className="font-serif text-3xl font-bold text-legal-primary">AI Legal Assistant</h1>
        </div>
        
        {/* Main chat area - now full width */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-100 flex flex-col flex-1">
          <ChatInterface />
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Chat;