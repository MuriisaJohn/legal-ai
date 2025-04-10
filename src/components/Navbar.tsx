
import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Scale, FileText, MessageSquare } from 'lucide-react';

const Navbar = () => {
  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="h-8 w-8 text-legal-secondary" />
          <span className="font-serif text-xl font-bold text-legal-primary">LegalAI</span>
        </Link>
        
        <div className="hidden md:flex items-center space-x-4">
          <Link to="/documents" className="text-legal-dark hover:text-legal-primary transition-colors">
            Documents
          </Link>
          <Link to="/chat" className="text-legal-dark hover:text-legal-primary transition-colors">
            Chat
          </Link>
          <Link to="/about" className="text-legal-dark hover:text-legal-primary transition-colors">
            About
          </Link>
        </div>
        
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline" className="hidden md:inline-flex">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-legal-primary hover:bg-legal-primary/90">Sign Up</Button>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
