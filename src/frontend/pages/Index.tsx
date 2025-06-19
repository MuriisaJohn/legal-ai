
import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Gavel, Users, Globe, ChevronRight } from 'lucide-react';

const Index = () => {
  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <Features />
        
        {/* Testimonials */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl md:text-4xl font-bold text-center mb-4 text-legal-primary">Trusted by Legal Professionals</h2>
            <p className="text-center text-legal-accent max-w-2xl mx-auto mb-12">
              See what legal professionals are saying about our AI-powered document analysis tool.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="italic text-gray-600 mb-4">
                  "This tool has completely transformed our contract review process. What used to take hours now takes minutes with the AI assistant."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-legal-primary flex items-center justify-center text-white font-medium">
                    SJ
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Sarah Kakala</p>
                    <p className="text-sm text-gray-500">LDC</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="italic text-gray-600 mb-4">
                  "Being able to ask questions about complex legal documents and get instant, accurate answers has been a game-changer for our practice."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-legal-primary flex items-center justify-center text-white font-medium">
                    MB
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Michael Mwaga</p>
                    <p className="text-sm text-gray-500">Legal Researcher, Legal Tech Solutions</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <div className="flex items-center mb-4">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <svg key={star} className="h-5 w-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.799-2.034c-.784-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="italic text-gray-600 mb-4">
                  "The multilingual support has allowed us to handle international cases much more efficiently, saving both time and translation costs."
                </p>
                <div className="flex items-center">
                  <div className="h-10 w-10 rounded-full bg-legal-primary flex items-center justify-center text-white font-medium">
                    EL
                  </div>
                  <div className="ml-3">
                    <p className="font-medium">Elena </p>
                    <p className="text-sm text-gray-500">Partner, International Legal Associates</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* CTA */}
        <section className="py-16 bg-legal-primary text-white">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Legal Document Workflow?</h2>
            <p className="text-lg text-gray-200 max-w-2xl mx-auto mb-8">
              Join thousands of legal professionals who are saving time and gaining deeper insights with our AI-powered legal assistant.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/register">
                <Button size="lg" className="bg-legal-secondary text-legal-dark hover:bg-legal-secondary/90 font-medium">
                  Get Started Now
                </Button>
              </Link>
              <Link to="/documents">
                <Button size="lg" className="bg-legal-secondary text-legal-dark hover:bg-legal-secondary/90 font-medium">
                  Try a Demo <ChevronRight className="ml-1 h-4 w-4" />
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

export default Index;
