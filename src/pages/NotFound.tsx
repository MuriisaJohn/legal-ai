
import React, { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Scale } from 'lucide-react';

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-legal-light px-4 py-16">
      <Link to="/" className="flex items-center gap-2 mb-12">
        <Scale className="h-10 w-10 text-legal-secondary" />
        <span className="font-serif text-2xl font-bold text-legal-primary">LegalAI</span>
      </Link>
      
      <div className="text-center max-w-md">
        <h1 className="font-serif text-9xl font-bold text-legal-primary mb-4">404</h1>
        <h2 className="font-serif text-2xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-legal-accent mb-8">
          The page you are looking for doesn't exist or has been moved. Please check the URL or return to the homepage.
        </p>
        
        <Link to="/">
          <Button className="bg-legal-primary hover:bg-legal-primary/90">
            Return to Homepage
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
