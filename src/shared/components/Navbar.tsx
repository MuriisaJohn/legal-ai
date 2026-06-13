
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/shared/components/ui/button";
import { Scale, Menu, X } from 'lucide-react';

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white border-b border-gray-200 shadow-sm z-50">
      <div className="container mx-auto px-4 h-16 flex justify-between items-center">
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
        
        {/* Desktop Auth Buttons */}
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
          className="md:hidden p-2 text-legal-dark hover:text-legal-primary transition-colors"
          onClick={toggleMobileMenu}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <Menu className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 bg-white">
          <div className="container mx-auto px-4 py-8">
            <div className="space-y-8">
              {/* Mobile Navigation Links */}
              <div className="flex flex-col space-y-4">
                <Link
                  to="/documents"
                  className="text-lg text-legal-dark hover:text-legal-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Documents
                </Link>
                <Link
                  to="/chat"
                  className="text-lg text-legal-dark hover:text-legal-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Chat
                </Link>
                <Link
                  to="/about"
                  className="text-lg text-legal-dark hover:text-legal-primary transition-colors"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  About
                </Link>
              </div>

              {/* Mobile Auth Buttons */}
              <div className="flex flex-col space-y-3">
                <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button variant="outline" className="w-full">Login</Button>
                </Link>
                <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                  <Button className="w-full bg-legal-primary hover:bg-legal-primary/90">Sign Up</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
