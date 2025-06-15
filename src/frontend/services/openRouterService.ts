
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

export const generateResponseWithOpenRouter = async (
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string> => {
  try {
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
        messages: messages,
        temperature: 0.7,
        max_tokens: 1500,
        top_p: 0.9
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data: OpenRouterResponse = await response.json();
    return data.choices[0]?.message?.content || "I apologize, but I couldn't generate a response.";
  } catch (error) {
    console.error('OpenRouter API error:', error);
    throw new Error('Failed to communicate with AI service. Please check your API key and try again.');
  }
};

export const analyzeDocumentContent = async (
  documentName: string,
  documentContent: string,
  apiKey: string
): Promise<string> => {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a legal AI assistant specializing in Ugandan law. Analyze legal documents thoroughly, identifying key provisions, legal implications, compliance issues, and provide actionable insights based on Ugandan legal framework.'
    },
    {
      role: 'user',
      content: `Please analyze this legal document "${documentName}" and provide a comprehensive review:

DOCUMENT CONTENT:
${documentContent}

Please provide:
1. Document Summary
2. Key Legal Provisions
3. Important Parties and Roles
4. Critical Dates and Deadlines
5. Potential Legal Issues or Risks
6. Compliance with Ugandan Law
7. Recommendations and Next Steps`
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};

export const summarizeDocument = async (
  documentName: string,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a legal AI assistant specializing in Ugandan law. Provide detailed, accurate summaries of legal documents and answer questions about Ugandan legal matters.'
    },
    {
      role: 'user',
      content: documentContent 
        ? `Please provide a comprehensive summary of this document "${documentName}":

DOCUMENT CONTENT:
${documentContent}

Focus on key legal provisions, important dates, parties involved, and any relevant Ugandan law context.`
        : `Please provide a comprehensive summary of the document "${documentName}". Focus on key legal provisions, important dates, parties involved, and any relevant Ugandan law context.`
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};

export const answerQuestion = async (
  question: string,
  documentContext: string | null,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  const systemPrompt = documentContext && documentContent
    ? `You are a legal AI assistant specializing in Ugandan law. You have access to the document "${documentContext}" with its full content. Answer questions based on this document and general Ugandan legal knowledge.`
    : documentContext
    ? `You are a legal AI assistant specializing in Ugandan law. You have access to the document "${documentContext}". Answer questions based on this document and general Ugandan legal knowledge.`
    : 'You are a legal AI assistant specializing in Ugandan law. Provide accurate information about Ugandan legal matters, regulations, and procedures.';

  const userContent = documentContent
    ? `Based on this document content and your knowledge of Ugandan law, please answer: ${question}

DOCUMENT CONTENT:
${documentContent}`
    : question;

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userContent
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};
