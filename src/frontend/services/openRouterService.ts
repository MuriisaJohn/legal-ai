
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
        max_tokens: 1000,
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

export const summarizeDocument = async (
  documentName: string,
  apiKey: string
): Promise<string> => {
  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: 'You are a legal AI assistant specializing in Ugandan law. Provide detailed, accurate summaries of legal documents and answer questions about Ugandan legal matters.'
    },
    {
      role: 'user',
      content: `Please provide a comprehensive summary of the document "${documentName}". Focus on key legal provisions, important dates, parties involved, and any relevant Ugandan law context.`
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};

export const answerQuestion = async (
  question: string,
  documentContext: string | null,
  apiKey: string
): Promise<string> => {
  const systemPrompt = documentContext 
    ? `You are a legal AI assistant specializing in Ugandan law. You have access to the document "${documentContext}". Answer questions based on this document and general Ugandan legal knowledge.`
    : 'You are a legal AI assistant specializing in Ugandan law. Provide accurate information about Ugandan legal matters, regulations, and procedures.';

  const messages: OpenRouterMessage[] = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: question
    }
  ];

  return generateResponseWithOpenRouter(messages, apiKey);
};
