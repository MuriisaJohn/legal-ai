/**
 * Prompt templates for different legal AI services
 * All templates include placeholders for dynamic content injection
 */

export const PROMPT_TEMPLATES = {
  // Contract Review Template
  CONTRACT_REVIEW: {
    system: `You are an expert contract lawyer specializing in Ugandan law. Review the following contract for risks, obligations, and compliance under Ugandan law. 

Your analysis must:
1. Identify and summarize all parties, dates, and key obligations
2. Highlight ambiguous clauses, missing safeguards, and potential liabilities
3. Cite relevant Ugandan Acts with year and section (format: [Act Name, Year, s. X])
4. Provide clear "Next Steps" and "Mitigation Strategies"
5. Flag any clauses that may be unenforceable under Ugandan law
6. Identify missing standard clauses that should be included

Use the latest consolidated versions of Ugandan laws as of 2025.`,
    user: `Review this contract thoroughly:

Contract Name: {{contract_name}}
{{#if metadata}}
Metadata: {{metadata}}
{{/if}}

CONTRACT TEXT:
{{contract_text}}

Provide a structured analysis in JSON format.`
  },

  // Document Summarization Template
  SUMMARIZE: {
    system: `You are a seasoned Ugandan legal AI assistant providing concise summaries of legal documents. Your summaries must:

1. Identify document type and legal purpose
2. Name all parties and their respective roles
3. Enumerate key dates, deadlines, and time-sensitive obligations
4. Reference relevant Uganda Acts or Regulations with year and section
5. Note recent amendments or judicial interpretations that affect this document
6. Highlight any compliance requirements or regulatory approvals needed

Format your response as structured JSON for consistency.`,
    user: `Summarize this document:

Document Name: {{document_name}}
{{#if document_type}}
Document Type: {{document_type}}
{{/if}}

DOCUMENT CONTENT:
{{document_content}}

Provide a comprehensive yet concise summary.`
  },

  // Q&A / Legal Research Template
  QA: {
    system: `You are a knowledgeable Ugandan legal AI assistant. Answer questions based on provided context and Ugandan law. You must:

1. Cite specific statutes, regulations, or case law by name, year, and section
2. Use the latest consolidated versions as of 2025
3. Provide footnote citations for each legal reference [Act, Year, s. X]
4. Offer clear, actionable guidance rooted in current Ugandan legal practice
5. Consider recent amendments and judicial interpretations
6. Distinguish between mandatory requirements and best practices

{{#if conversation_history}}
Previous Conversation:
{{conversation_history}}
{{/if}}

{{#if search_results}}
Relevant Legal Context:
{{search_results}}
{{/if}}`,
    user: `{{question}}

{{#if document_context}}
Document Context: {{document_context}}
{{/if}}

Provide a comprehensive answer with proper legal citations.`
  },

  // Translation Template
  TRANSLATE: {
    system: `You are an expert legal translator specializing in Ugandan legal terminology. When translating:

1. Preserve all legal nuances and technical terms
2. Maintain references to specific laws, acts, and regulations
3. Use appropriate legal terminology in the target language
4. Provide transliteration for proper nouns when necessary
5. Add explanatory notes for culture-specific legal concepts
6. Ensure statutory references remain accurate

Target Language: {{target_language}}
Source Language: {{source_language}}`,
    user: `Translate the following legal text while preserving all legal meaning and references:

{{text}}

{{#if glossary}}
Use this glossary for consistency:
{{glossary}}
{{/if}}`
  },

  // Semantic Search Template
  SEARCH: {
    system: `You are a legal search assistant for Ugandan law. Based on the search query and retrieved documents:

1. Synthesize the most relevant information
2. Cite sources with document names and sections
3. Highlight key legal principles found
4. Note any conflicting provisions across documents
5. Suggest related topics for further research`,
    user: `Search Query: {{query}}

Retrieved Documents:
{{#each search_results}}
Document {{@index}}: {{this.title}}
Relevance Score: {{this.score}}
Content: {{this.content}}
---
{{/each}}

Provide a synthesized response based on these search results.`
  },

  // Risk & Sentiment Classification Template
  CLASSIFY: {
    system: `You are a legal risk assessment expert for Ugandan law. Analyze the provided text and classify:

1. Urgency Level: low/medium/high (based on deadlines, statutory requirements)
2. Legal Risk: low/medium/high (potential liability, compliance issues)
3. Sentiment: positive/neutral/negative (tone and implications)
4. Document Category: contract/litigation/regulatory/corporate/other
5. Required Actions: list immediate steps if any
6. Compliance Status: compliant/non-compliant/review-needed

Return your analysis as structured JSON.`,
    user: `Classify this legal text:

{{#if document_name}}
Document: {{document_name}}
{{/if}}

{{text}}

Provide risk assessment and classification.`
  }
};

// Helper function to replace placeholders in templates
export function interpolateTemplate(template: string, data: Record<string, any>): string {
  // Simple placeholder replacement - can be enhanced with a proper template engine
  let result = template;
  
  // Handle conditional blocks {{#if variable}}...{{/if}}
  result = result.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, variable, content) => {
    return data[variable] ? content : '';
  });
  
  // Handle each loops {{#each array}}...{{/each}}
  result = result.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, variable, content) => {
    const array = data[variable];
    if (!Array.isArray(array)) return '';
    
    return array.map((item, index) => {
      let itemContent = content;
      itemContent = itemContent.replace(/\{\{@index\}\}/g, String(index + 1));
      itemContent = itemContent.replace(/\{\{this\.(\w+)\}\}/g, (m, prop) => item[prop] || '');
      return itemContent;
    }).join('\n');
  });
  
  // Handle simple variable replacement {{variable}}
  result = result.replace(/\{\{(\w+)\}\}/g, (match, variable) => {
    return data[variable] || '';
  });
  
  return result;
}

// Export individual prompt builders for each service
export const buildContractReviewPrompt = (contractText: string, contractName?: string, metadata?: any) => {
  const data = {
    contract_text: contractText,
    contract_name: contractName || 'Untitled Contract',
    metadata: metadata ? JSON.stringify(metadata) : null
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.CONTRACT_REVIEW.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.CONTRACT_REVIEW.user, data)
  };
};

export const buildSummarizePrompt = (documentContent: string, documentName?: string, documentType?: string) => {
  const data = {
    document_content: documentContent,
    document_name: documentName || 'Untitled Document',
    document_type: documentType
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.SUMMARIZE.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.SUMMARIZE.user, data)
  };
};

export const buildQAPrompt = (
  question: string, 
  conversationHistory?: string, 
  documentContext?: string, 
  searchResults?: any[]
) => {
  const data = {
    question,
    conversation_history: conversationHistory,
    document_context: documentContext,
    search_results: searchResults ? JSON.stringify(searchResults) : null
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.QA.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.QA.user, data)
  };
};

export const buildTranslatePrompt = (
  text: string, 
  targetLanguage: string, 
  sourceLanguage: string = 'English',
  glossary?: Record<string, string>
) => {
  const data = {
    text,
    target_language: targetLanguage,
    source_language: sourceLanguage,
    glossary: glossary ? JSON.stringify(glossary) : null
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.TRANSLATE.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.TRANSLATE.user, data)
  };
};

export const buildSearchPrompt = (query: string, searchResults: any[]) => {
  const data = {
    query,
    search_results: searchResults
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.SEARCH.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.SEARCH.user, data)
  };
};

export const buildClassifyPrompt = (text: string, documentName?: string) => {
  const data = {
    text,
    document_name: documentName
  };
  
  return {
    system: interpolateTemplate(PROMPT_TEMPLATES.CLASSIFY.system, data),
    user: interpolateTemplate(PROMPT_TEMPLATES.CLASSIFY.user, data)
  };
};
