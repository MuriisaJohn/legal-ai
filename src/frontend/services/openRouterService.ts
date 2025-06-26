export interface OpenRouterMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OpenRouterResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

// Utility for sending a chat completion request
export const generateResponseWithOpenRouter = async (
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string> => {
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Legal AI Assistant'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-chat-v3-0324:free',
      messages,
      temperature: 0.3,
      max_tokens: 1500,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    throw new Error(`OpenRouter API error: ${response.status}`);
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || 
    "I apologize, but I couldn't generate a response.";
};

// Enhanced system prompt for document analysis
const analysisSystemPrompt = `You are an expert legal AI assistant specializing in Ugandan law. For each request, you must:
1. Cite the exact Ugandan statutes, acts, or regulations by name, year, and section number.
2. Use the most recent consolidated versions and amendments available as of today's date (June 23, 2025).
3. Reference government publications or gazette notifications where relevant.
4. Provide footnote-style citations for each legal principle, using a consistent style (e.g., [Civil Aviation Act, 2019, s. 10]).
5. Highlight critical implications, compliance requirements, and practical recommendations based on current Ugandan legal practice.`;

// Analyze a legal document
export const analyzeDocumentContent = async (
  documentName: string,
  documentContent: string,
  apiKey: string
): Promise<string> => {
  const messages: OpenRouterMessage[] = [
    { role: 'system', content: analysisSystemPrompt },
    {
      role: 'user',
      content: `Please analyze this legal document "${documentName}" thoroughly. Your response should include:

1. Document Summary
2. Key Legal Provisions (with statute citations)
3. Parties and Roles
4. Critical Dates and Deadlines
5. Potential Risks and Compliance Issues
6. Alignment with Ugandan Law (cite latest amendments)
7. Recommendations and Next Steps`
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};

// Enhanced system prompt for summaries
const summarySystemPrompt = `You are a seasoned Ugandan legal AI assistant. Provide concise summaries of legal documents, ensuring:
1. Identification of document type and legal purpose.
2. Naming of parties and their roles.
3. Enumeration of key dates and obligations.
4. Reference to relevant Uganda Acts or Regulations (with year and section).
5. Contextual notes on recent amendments or judicial interpretations.`;

export const summarizeDocument = async (
  documentName: string,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  if (!documentContent) {
    throw new Error('No document content provided for summary.');
  }

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: summarySystemPrompt },
    {
      role: 'user',
      content: `Summarize the document "${documentName}". Include:

1. Document type and purpose
2. Parties involved
3. Important dates and deadlines
4. Main obligations and rights
5. Key legal provisions with citations
6. Relevant Ugandan law context and amendments`
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};

// Enhanced system prompt for Q&A
const qaSystemPromptBase = `You are a knowledgeable Ugandan legal AI assistant. Answer questions based on provided context and general Ugandan law, ensuring you:
1. Cite specific statutes, regulations, or case law by name, year, and section.
2. Use the latest consolidated versions as of  2025.
3. Provide brief footnote citations for each legal reference.
4. Offer clear, actionable guidance rooted in current Ugandan legal practice.`;

export const answerQuestion = async (
  question: string,
  conversationContext: string,
  documentContext: string | null,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  let systemPrompt = qaSystemPromptBase;
  
  if (conversationContext) {
    systemPrompt += `\n\nConversation History:\n${conversationContext}`;
  }
  
  if (documentContext) {
    systemPrompt += `\n\nDocument Context: "${documentContext}"`;
  }

  const userContent = documentContent
    ? `Based on the conversation history and document content, please answer: ${question}

DOCUMENT CONTENT:
${documentContent}`
    : `Based on the conversation history, please answer: ${question}`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userContent }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};
