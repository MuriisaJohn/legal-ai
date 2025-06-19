
import React from 'react';
import { Link } from 'react-router-dom';
import { Scale } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-legal-primary text-white py-10">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Scale className="h-6 w-6 text-legal-secondary" />
              <span className="font-serif text-lg font-bold text-white">LegalAI</span>
            </div>
            <p className="text-sm text-gray-300 mb-4">
              Advanced AI assistant for legal professionals to simplify document analysis and enhance legal research.
            </p>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-legal-secondary mb-4">Quick Links</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/" className="hover:text-legal-secondary transition-colors">Home</Link></li>
              <li><Link to="/documents" className="hover:text-legal-secondary transition-colors">Documents</Link></li>
              <li><Link to="/chat" className="hover:text-legal-secondary transition-colors">Chat</Link></li>
              <li><Link to="/about" className="hover:text-legal-secondary transition-colors">About</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-legal-secondary mb-4">Legal</h4>
            <ul className="space-y-2 text-sm">
              <li><Link to="/terms" className="hover:text-legal-secondary transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-legal-secondary transition-colors">Privacy Policy</Link></li>
              <li><Link to="/security" className="hover:text-legal-secondary transition-colors">Security</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-legal-secondary mb-4">Contact</h4>
            <ul className="space-y-2 text-sm">
              <li>Email: murisajon@gmail.com</li>
              <li>Phone: (256) 7056-58855</li>
            </ul>
          </div>
        </div>
        
        <div className="mt-8 pt-6 border-t border-gray-700 text-center text-sm text-gray-400">
          &copy; {new Date().getFullYear()} LegalAI. All rights reserved.
        </div>
      </div>
    </footer>
  );
};

export default Footer;
