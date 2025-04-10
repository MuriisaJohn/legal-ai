
// This service simulates using the OpenAI API for generating responses
// In a real backend implementation, this would make actual API calls to OpenAI

// Define the input structure for the OpenAI prompt
type OpenAIPromptInput = {
  question: string;
  context: string;
  language: string;
};

// Simulating the OpenAI prompt template from the user's requirements
const OPENAI_PROMPT_TEMPLATE = `
You are a helpful legal assistant trained to analyze legal documents and answer questions clearly and accurately.

Context:
{context}

Question (original language: {language}):
{question}

Instructions:
- If the context is in a different language, translate it to English internally before answering.
- Base your answer strictly on the provided context. If the answer is not in the context, say: "The document does not contain enough information to answer this."
- Summarize any long sections as needed.
- Keep the answer concise and formal, in the same language as the original question ({language}).

Answer:
`;

// Legal knowledge base for answering common legal questions
const legalKnowledgeBase = {
  contract: [
    "A contract is a legally binding agreement between two or more parties.",
    "Essential elements of a valid contract include offer, acceptance, consideration, legal capacity, and lawful purpose.",
    "Contracts can be written, oral, or implied by conduct, though some types (like real estate) must be in writing.",
    "Contract breaches can result in remedies such as damages, specific performance, or contract rescission."
  ],
  liability: [
    "Liability refers to legal responsibility for one's actions or omissions.",
    "Types include strict liability, vicarious liability, joint and several liability, and limited liability.",
    "Professional liability insurance can protect against claims of negligence or inadequate work.",
    "Liability waivers may limit liability but aren't always enforceable, especially for gross negligence."
  ],
  copyright: [
    "Copyright protects original works of authorship fixed in a tangible medium.",
    "Protection covers literary, dramatic, musical, and artistic works, including software and architecture.",
    "Copyright duration is typically the author's life plus 70 years (in the US).",
    "Fair use exceptions allow limited use without permission for purposes like criticism, comment, news reporting, teaching, scholarship, or research."
  ],
  divorce: [
    "Divorce is the legal dissolution of a marriage by a court or other competent body.",
    "Issues typically addressed include division of assets, child custody, child support, and spousal support.",
    "Divorce can be contested (parties disagree on terms) or uncontested (parties agree on terms).",
    "Approaches include litigation, mediation, collaborative divorce, and arbitration."
  ],
  ugandan: [
    "The legal system in Uganda is based on English common law and customary law.",
    "The Constitution of Uganda is the supreme law of the country.",
    "Uganda's court system includes Magistrates Courts, High Court, Court of Appeal, and the Supreme Court.",
    "Land law in Uganda recognizes both customary and freehold tenure systems."
  ]
};

// Define categories for document analysis
const documentCategories = {
  'agreement': ['terms', 'clause', 'party', 'provision', 'agreement', 'contract'],
  'legal case': ['plaintiff', 'defendant', 'court', 'judge', 'ruling', 'case', 'vs', 'versus'],
  'property': ['property', 'tenant', 'landlord', 'lease', 'rent', 'premises'],
  'employment': ['employee', 'employer', 'work', 'compensation', 'termination', 'salary']
};

/**
 * Simulates an OpenAI API call for generating responses
 * In a real application, this would make an actual API call to OpenAI
 */
export const simulateOpenAIResponse = async (input: OpenAIPromptInput): Promise<string> => {
  // Simulate API processing time
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 1000));
  
  const { question, context, language } = input;
  const queryLower = question.toLowerCase();
  
  // If we have context (document), provide document-specific responses
  if (context && context.length > 0) {
    // Extract document category based on name
    let documentCategory = 'agreement'; // Default
    
    for (const [category, keywords] of Object.entries(documentCategories)) {
      if (keywords.some(keyword => context.toLowerCase().includes(keyword))) {
        documentCategory = category;
        break;
      }
    }
    
    // Check for specific query types
    if (queryLower.includes('summarize') || queryLower.includes('summary')) {
      return `Based on my analysis of the document, it appears to be a ${documentCategory} that contains several key sections: (1) Definitions of terms used throughout the document, (2) Obligations of the parties including payment terms and delivery schedules, and (3) Termination clauses that outline conditions for ending the agreement. The agreement is governed by the laws of Uganda and includes standard dispute resolution procedures.`;
    } 
    
    if (queryLower.includes('deadline') || queryLower.includes('date') || queryLower.includes('when')) {
      return `According to the document, important dates include: (1) Effective date: January 15, 2025, (2) Performance deadline: June 30, 2025, (3) Payment schedule: quarterly starting March 31, 2025, (4) Automatic renewal: 30 days before expiration unless terminated. There's a provision for a 15-day grace period for deliverables.`;
    }
    
    if (queryLower.includes('payment') || queryLower.includes('fee') || queryLower.includes('cost')) {
      return `In the document, payment terms specify: (1) Base compensation of UGX 50,000,000 payable in quarterly installments, (2) Late payment penalty of 1.5% per month, (3) Dispute procedure requiring written notice within 10 business days of invoice receipt, (4) All payments due in Ugandan Shillings via bank transfer.`;
    }
    
    if (queryLower.includes('terminate') || queryLower.includes('end') || queryLower.includes('cancel')) {
      return `The document allows termination: (1) For convenience with 60 days written notice, (2) For cause with 30 days to cure deficiencies, (3) Automatically if either party becomes insolvent or files for bankruptcy. Post-termination obligations include confidentiality (survives 5 years) and return of all materials within 15 days.`;
    }
    
    // Default document response
    return `Based on my analysis of the document, I found information that might answer your query. The document contains provisions regarding ${documentCategory}-related matters including dispute resolution procedures, governing law (Ugandan), and confidentiality obligations. Could you specify which aspect of the document you'd like me to elaborate on?`;
  }
  
  // General legal knowledge responses
  for (const [topic, information] of Object.entries(legalKnowledgeBase)) {
    if (queryLower.includes(topic)) {
      // Return a random piece of information about the topic
      const randomInfo = information[Math.floor(Math.random() * information.length)];
      return randomInfo + " Would you like to know more about this topic?";
    }
  }
  
  // Handle questions about capabilities
  if (queryLower.includes('what can you do') || queryLower.includes('help me with')) {
    return "I can assist with various legal tasks including: (1) Analyzing legal documents you upload, (2) Answering general legal questions about contracts, liability, copyright, and Ugandan law, (3) Explaining legal terminology, and (4) Providing summaries of document provisions. For the best assistance, try uploading a document so I can provide specific insights.";
  }
  
  // Default response for when we don't have enough context
  return "The document does not contain enough information to answer this question. Could you please provide more context or upload a relevant document?";
};
