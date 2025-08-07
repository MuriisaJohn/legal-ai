import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Scale, Server, Shield, BookOpen } from 'lucide-react';

const About = () => {
  return (
    <div className="flex flex-col min-h-screen bg-legal-light">
      <Navbar />
      <main className="flex-1">
        {/* Hero Section */}
        <section className="bg-legal-primary py-16">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl font-bold text-white mb-4">About LegalAI Assistant</h1>
            <p className="text-xl text-gray-200 max-w-2xl mx-auto">
              Revolutionizing legal document analysis with advanced artificial intelligence.
            </p>
          </div>
        </section>
        
        {/* Team */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <h2 className="font-serif text-3xl font-bold text-legal-primary mb-4 text-center">Our Leadership</h2>
            <p className="text-legal-accent max-w-2xl mx-auto text-center mb-12">
              Meet the visionary behind LegalAI.
            </p>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="col-span-full flex flex-col md:flex-row items-center justify-center">
                <div className="w-64 h-64 mb-6 md:mb-0 md:mr-12 rounded-full overflow-hidden shadow-lg">
<img
                    src="/lovable-uploads/me.jpg"
                    alt="Murisa John"
className="w-full aspect-square object-contain"
                    loading="lazy"
                  />
                </div>
                <div className="text-center md:text-left max-w-lg">
                  <h3 className="font-serif text-2xl font-semibold mb-2 text-legal-primary">Murisa John</h3>
                  <p className="text-legal-accent mb-2 font-medium">Founder & CEO</p>
                  <p className="text-gray-600 mb-4">
                    A passionate legal technologist dedicated to democratizing legal information. With over a decade of experience in law and technology, Murisa founded LegalAI to bridge the gap between complex legal systems and everyday citizens.
                  </p>
                  <p className="text-gray-600">
                    His vision is to leverage artificial intelligence to make legal information more accessible, understandable, and actionable for all.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
        
        {/* Mission */}
        <section className="py-16">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2">
                <Scale className="h-16 w-16 text-legal-secondary mb-6" />
                <h2 className="font-serif text-3xl font-bold text-legal-primary mb-4">Our Mission</h2>
                <p className="text-legal-accent mb-4">
                  At LegalAI, our mission is to make legal document analysis faster, more accessible, and more accurate through the power of artificial intelligence.
                </p>
                <p className="text-legal-accent">
                  We believe that legal professionals should spend their valuable time on strategic thinking and client relationships, not on repetitive document review tasks that can be automated with modern technology.
                </p>
              </div>
              
              <div className="md:w-1/2 bg-white p-8 rounded-lg shadow-md border border-gray-100">
                <h3 className="font-serif text-xl font-bold text-legal-primary mb-3">Why We Built LegalAI</h3>
                <ul className="space-y-2">
                  <li className="flex items-start">
                    <div className="bg-legal-primary/10 p-1 rounded-full mr-2 mt-1">
                      <svg className="h-3 w-3 text-legal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Legal professionals spend 30-60% of their time on document review</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-legal-primary/10 p-1 rounded-full mr-2 mt-1">
                      <svg className="h-3 w-3 text-legal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Manual document analysis is prone to human error and inconsistency</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-legal-primary/10 p-1 rounded-full mr-2 mt-1">
                      <svg className="h-3 w-3 text-legal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>AI can process and analyze thousands of documents in minutes</p>
                  </li>
                  <li className="flex items-start">
                    <div className="bg-legal-primary/10 p-1 rounded-full mr-2 mt-1">
                      <svg className="h-3 w-3 text-legal-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p>Legal services should be more affordable and accessible</p>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>
        
        {/* Technology */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-serif text-3xl font-bold text-legal-primary mb-4">Our Technology</h2>
              <p className="text-legal-accent max-w-2xl mx-auto">
                LegalAI combines cutting-edge AI models with legal domain expertise to deliver accurate, reliable document analysis.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Server className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Advanced NLP</h3>
                <p className="text-legal-accent">
                  Our natural language processing models are specifically trained on legal texts, enabling them to understand complex legal terminology and concepts.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <Shield className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Secure Processing</h3>
                <p className="text-legal-accent">
                  All documents are processed using enterprise-grade security protocols, ensuring confidentiality and compliance with legal standards.
                </p>
              </div>
              
              <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                <BookOpen className="h-10 w-10 text-legal-secondary mb-4" />
                <h3 className="font-serif text-xl font-semibold mb-3 text-legal-primary">Contextual Understanding</h3>
                <p className="text-legal-accent">
                  Our AI doesn't just extract text—it understands the context and relationships between different parts of legal documents.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default About;
