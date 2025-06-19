
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Scale, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <nav className="bg-white border-b border-gray-200 shadow-sm relative">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Scale className="h-8 w-8 text-legal-secondary" />
          <span className="font-serif text-xl font-bold text-legal-primary">LegalAI</span>
        </Link>
        
        {/* Desktop Navigation */}
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
        
        {/* Desktop Buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link to="/register">
            <Button className="bg-legal-primary hover:bg-legal-primary/90">Sign Up</Button>
          </Link>
        </div>

        {/* Mobile Menu Button */}
        <button
          className="md:hidden p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6 text-legal-primary" />
          ) : (
            <Menu className="h-6 w-6 text-legal-primary" />
          )}
        </button>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-200 shadow-lg z-50">
          <div className="container mx-auto px-4 py-4 flex flex-col space-y-4">
            <Link
              to="/documents"
              className="text-legal-dark hover:text-legal-primary transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Documents
            </Link>
            <Link
              to="/chat"
              className="text-legal-dark hover:text-legal-primary transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Chat
            </Link>
            <Link
              to="/about"
              className="text-legal-dark hover:text-legal-primary transition-colors px-4 py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              About
            </Link>
            <div className="flex flex-col gap-3 pt-4 border-t border-gray-100">
              <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                <Button variant="outline" className="w-full">Login</Button>
              </Link>
              <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                <Button className="w-full bg-legal-primary hover:bg-legal-primary/90">Sign Up</Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
