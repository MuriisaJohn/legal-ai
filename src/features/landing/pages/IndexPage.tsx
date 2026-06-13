import Navbar from '@/shared/components/Navbar';
import Footer from '@/shared/components/Footer';
import Hero from '@/shared/components/Hero';
import Features from '@/shared/components/Features';
import { Link } from 'react-router-dom';
import { Button } from "@/shared/components/ui/button";
import { Gavel, Users, Globe, ChevronRight } from 'lucide-react';

const IndexPage = () => {
  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1 pt-20">
        <Hero />
        <Features />
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-legal-primary mb-4">Comprehensive Legal Coverage</h2>
              <p className="text-legal-accent max-w-2xl mx-auto">
                From contract review to constitutional research, LegalAI covers a wide range of legal domains.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Gavel className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Land Law</h3>
                <p className="text-legal-accent mb-4">Navigate complex land tenure systems, registration processes, and property disputes.</p>
                <Link to="/chat" className="text-legal-secondary hover:text-legal-accent font-medium text-sm flex items-center">
                  Get Legal Guidance <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Users className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Family Law</h3>
                <p className="text-legal-accent mb-4">Understand marriage laws, divorce proceedings, child custody, and inheritance rights.</p>
                <Link to="/chat" className="text-legal-secondary hover:text-legal-accent font-medium text-sm flex items-center">
                  Get Legal Guidance <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Globe className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Business Law</h3>
                <p className="text-legal-accent mb-4">Start and manage your business with insights on regulations, contracts, and compliance.</p>
                <Link to="/chat" className="text-legal-secondary hover:text-legal-accent font-medium text-sm flex items-center">
                  Get Legal Guidance <ChevronRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <section className="py-16 bg-legal-primary">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl font-bold text-white mb-6">Ready to Get Started?</h2>
            <p className="text-gray-200 max-w-2xl mx-auto mb-8">
              Join the future of legal document analysis and legal research.
            </p>
            <div className="flex gap-4 justify-center">
              <Link to="/chat">
                <Button size="lg" className="bg-white text-legal-primary hover:bg-gray-100 font-semibold">
                  Get Started
                </Button>
              </Link>
              <Link to="/about">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-legal-primary">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default IndexPage;
