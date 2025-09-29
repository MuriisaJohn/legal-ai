/**
 * Enhanced OpenRouter Service with Unified Legal AI Framework
 * Provides structured, intent-based legal AI services for Ugandan law
 */

// Import existing types and utilities
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

export interface OpenRouterStreamChunk {
  choices: Array<{
    delta: {
      content?: string;
    };
    finish_reason?: string | null;
  }>;
}

// Import the comprehensive legal AI framework components
import { 
  ContractReviewResponse, 
  DocumentSummaryResponse, 
  ClassificationResponse,
  QAResponse,
  TranslationResponse,
  SearchResponse,
  LegalAIRequest,
  LegalAIResponse,
  LegalIntent
} from './legalAITypes';

import {
  buildContractReviewPrompt,
  buildSummarizePrompt,
  buildQAPrompt,
  buildTranslatePrompt,
  buildSearchPrompt,
  buildClassifyPrompt
} from './prompts';

import {
  detectIntent,
  extractEntities,
  verifyCitations,
  validateJSONResponse,
  retryWithBackoff,
  truncateContext,
  LegalAILogger,
  formatLegalResponse
} from './legalAIUtils';

// Initialize logger
const logger = LegalAILogger.getInstance();

// API key validation utility
export const validateOpenRouterApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  if (!apiKey || apiKey.trim() === '') {
    return { valid: false, error: 'API key is missing' };
  }

  if (!apiKey.startsWith('sk-or-')) {
    return { valid: false, error: 'Invalid API key format. OpenRouter keys should start with "sk-or-"' };
  }

  try {
    const response = await fetch('https://openrouter.ai/api/v1/models', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Legal AI Assistant'
      }
    });

    if (response.ok) {
      return { valid: true };
    } else if (response.status === 401) {
      return { valid: false, error: 'API key is invalid or expired' };
    } else {
      return { valid: false, error: `API validation failed: ${response.status}` };
    }
  } catch (error) {
    return { valid: false, error: 'Network error while validating API key' };
  }
};

// Base utility for sending a chat completion request
export const generateResponseWithOpenRouter = async (
  messages: OpenRouterMessage[],
  apiKey: string
): Promise<string> => {
  // Validate API key
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenRouter API key is missing. Please check your environment variables.');
  }

  if (!apiKey.startsWith('sk-or-')) {
    throw new Error('Invalid OpenRouter API key format. Please check your API key.');
  }

  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': window.location.origin,
      'X-Title': 'Legal AI Assistant'
    },
    body: JSON.stringify({
      model: 'deepseek/deepseek-r1-0528:free',
      messages,
      temperature: 0.3,
      max_tokens: 2000,
      top_p: 0.9
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('OpenRouter API Error:', response.status, errorText);
    
    if (response.status === 401) {
      throw new Error('OpenRouter API authentication failed. Please check your API key is valid and not expired.');
    } else if (response.status === 429) {
      throw new Error('OpenRouter API rate limit exceeded. Please try again later.');
    } else if (response.status >= 500) {
      throw new Error('OpenRouter API server error. Please try again later.');
    } else {
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }
  }

  const data: OpenRouterResponse = await response.json();
  return data.choices[0]?.message?.content || 
    "I apologize, but I couldn't generate a response.";
};

// Streaming version of generateResponseWithOpenRouter
export const generateStreamingResponseWithOpenRouter = async (
  messages: OpenRouterMessage[],
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    // Validate API key
    if (!apiKey || apiKey.trim() === '') {
      throw new Error('OpenRouter API key is missing. Please check your environment variables.');
    }

    if (!apiKey.startsWith('sk-or-')) {
      throw new Error('Invalid OpenRouter API key format. Please check your API key.');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': window.location.origin,
        'X-Title': 'Legal AI Assistant'
      },
      body: JSON.stringify({
        model: 'deepseek/deepseek-chat-v3.1:free',
        messages,
        temperature: 0.3,
        max_tokens: 2000,
        top_p: 0.9,
        stream: true // Enable streaming
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenRouter API Error:', response.status, errorText);
      
      if (response.status === 401) {
        throw new Error('OpenRouter API authentication failed. Please check your API key is valid and not expired.');
      } else if (response.status === 429) {
        throw new Error('OpenRouter API rate limit exceeded. Please try again later.');
      } else if (response.status >= 500) {
        throw new Error('OpenRouter API server error. Please try again later.');
      } else {
        throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
      }
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    // Ensure completion is only signaled once even if underlying stream
    // reports a finish event and then a final done=true read.
    let completionSignaled = false;
    const signalCompleteOnce = () => {
      if (completionSignaled) return;
      completionSignaled = true;
      onComplete?.();
    };

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          signalCompleteOnce();
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmedLine = line.trim();
          
          if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
            continue;
          }

          if (trimmedLine.startsWith('data: ')) {
            try {
              const jsonStr = trimmedLine.slice(6); // Remove 'data: ' prefix
              const parsed: OpenRouterStreamChunk = JSON.parse(jsonStr);
              
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                onChunk(content);
              }

              // Check if streaming is complete
              if (parsed.choices[0]?.finish_reason) {
                signalCompleteOnce();
                break;
              }
            } catch (parseError) {
              console.warn('Failed to parse streaming chunk:', parseError);
              // Continue processing other chunks
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Streaming error:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown streaming error'));
  }
};

/**
 * Main unified legal AI service handler
 * Routes requests based on intent and applies appropriate processing
 */
export const processLegalAIRequest = async (
  request: LegalAIRequest,
  apiKey: string
): Promise<LegalAIResponse> => {
  const startTime = Date.now();
  logger.log('info', `Processing ${request.intent} request`, { 
    intent: request.intent,
    hasContext: !!request.context,
    streaming: request.options?.streaming 
  });

  try {
    // Pre-process: Extract entities for context
    const entities = extractEntities(request.content);
    logger.log('debug', 'Extracted entities', entities);

    // Route based on intent
    let response: any;
    
    switch (request.intent) {
      case 'contract_review':
        response = await handleContractReview(request, entities, apiKey);
        break;
      case 'summarize':
        response = await handleSummarize(request, entities, apiKey);
        break;
      case 'qa':
        response = await handleQA(request, entities, apiKey);
        break;
      case 'translate':
        response = await handleTranslate(request, apiKey);
        break;
      case 'search':
        response = await handleSearch(request, apiKey);
        break;
      case 'classify':
        response = await handleClassify(request, entities, apiKey);
        break;
      default:
        throw new Error(`Unknown intent: ${request.intent}`);
    }

    // Post-process: Verify citations
    if (typeof response === 'string') {
      const { verified, issues } = verifyCitations(response);
      if (issues.length > 0) {
        logger.log('warn', 'Citation issues found', issues);
      }
      response = verified;
    }

    const processingTime = Date.now() - startTime;
    logger.log('info', `Request completed in ${processingTime}ms`);

    return {
      success: true,
      data: response,
      metadata: {
        processingTime,
        tokensUsed: 0, // Would need to parse from API response
        model: 'deepseek/deepseek-r1-0528:free',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    logger.log('error', 'Request processing failed', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    // Provide user-friendly error messages
    let userMessage = errorMessage;
    if (errorMessage.includes('API key')) {
      userMessage = 'Please check your API key configuration.';
    } else if (errorMessage.includes('rate limit')) {
      userMessage = 'Too many requests—please try again in a few seconds.';
    } else if (errorMessage.includes('timeout')) {
      userMessage = 'Request timed out. Please try again.';
    }

    return {
      success: false,
      error: {
        code: 'PROCESSING_ERROR',
        message: userMessage,
        details: errorMessage
      },
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        model: 'deepseek/deepseek-r1-0528:free',
        timestamp: new Date().toISOString()
      }
    };
  }
};

// Contract Review Handler
async function handleContractReview(
  request: LegalAIRequest,
  entities: any,
  apiKey: string
): Promise<ContractReviewResponse | string> {
  const prompt = buildContractReviewPrompt(
    request.content,
    request.metadata?.documentName,
    { entities, ...request.metadata }
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  // Try to parse as JSON for structured response
  const validation = validateJSONResponse<ContractReviewResponse>(response, 'ContractReviewResponse');
  if (validation.valid && validation.data) {
    return validation.data;
  }
  
  // Fallback to string response
  return response;
}

// Summarize Handler
async function handleSummarize(
  request: LegalAIRequest,
  entities: any,
  apiKey: string
): Promise<DocumentSummaryResponse | string> {
  const prompt = buildSummarizePrompt(
    request.content,
    request.metadata?.documentName,
    request.metadata?.documentType
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  const validation = validateJSONResponse<DocumentSummaryResponse>(response, 'DocumentSummaryResponse');
  if (validation.valid && validation.data) {
    return validation.data;
  }
  
  return response;
}

// Q&A Handler
async function handleQA(
  request: LegalAIRequest,
  entities: any,
  apiKey: string
): Promise<QAResponse | string> {
  // Truncate context if needed
  const conversationHistory = request.context?.conversationHistory 
    ? truncateContext(request.context.conversationHistory, 2000)
    : undefined;

  const prompt = buildQAPrompt(
    request.content,
    conversationHistory,
    request.context?.documentContext,
    request.context?.searchResults
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  // Q&A responses are typically unstructured
  return response;
}

// Translation Handler
async function handleTranslate(
  request: LegalAIRequest,
  apiKey: string
): Promise<TranslationResponse | string> {
  const targetLanguage = request.metadata?.language || 'English';
  const sourceLanguage = 'English'; // Auto-detect could be added
  
  const prompt = buildTranslatePrompt(
    request.content,
    targetLanguage,
    sourceLanguage
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  return response;
}

// Search Handler
async function handleSearch(
  request: LegalAIRequest,
  apiKey: string
): Promise<SearchResponse | string> {
  if (!request.context?.searchResults || request.context.searchResults.length === 0) {
    throw new Error('Search requires search results in context');
  }

  const prompt = buildSearchPrompt(
    request.content,
    request.context.searchResults
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  return response;
}

// Classification Handler
async function handleClassify(
  request: LegalAIRequest,
  entities: any,
  apiKey: string
): Promise<ClassificationResponse | string> {
  const prompt = buildClassifyPrompt(
    request.content,
    request.metadata?.documentName
  );

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: prompt.system },
    { role: 'user', content: prompt.user }
  ];

  const response = await retryWithBackoff(() => 
    generateResponseWithOpenRouter(messages, apiKey)
  );

  const validation = validateJSONResponse<ClassificationResponse>(response, 'ClassificationResponse');
  if (validation.valid && validation.data) {
    return validation.data;
  }
  
  return response;
}

// Auto-detect intent and process
export const processAutoIntent = async (
  text: string,
  context?: any,
  apiKey?: string
): Promise<LegalAIResponse> => {
  const { intent, confidence } = detectIntent(text);
  
  logger.log('info', `Auto-detected intent: ${intent} (confidence: ${confidence})`);
  
  const request: LegalAIRequest = {
    intent,
    content: text,
    context,
    metadata: {
      timestamp: new Date().toISOString()
    }
  };
  
  if (!apiKey) {
    throw new Error('API key is required');
  }
  
  return processLegalAIRequest(request, apiKey);
};

// Streaming version with intent detection
export const processLegalAIRequestStreaming = async (
  request: LegalAIRequest,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    logger.log('info', `Processing streaming ${request.intent} request`);

    // Pre-process: Extract entities for context
    const entities = extractEntities(request.content);
    
    let systemPrompt: string;
    let userPrompt: string;

    // Build prompts based on intent
    const jurisdiction = request.metadata?.jurisdiction || 'Uganda';
    switch (request.intent) {
      case 'contract_review': {
        const prompt = buildContractReviewPrompt(
          request.content,
          request.metadata?.documentName,
          { entities, jurisdiction, ...request.metadata }
        );
        systemPrompt = prompt.system;
        userPrompt = prompt.user;
        break;
      }
      case 'summarize': {
        const prompt = buildSummarizePrompt(
          request.content,
          request.metadata?.documentName,
          request.metadata?.documentType
        );
        systemPrompt = prompt.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction);
        userPrompt = prompt.user;
        break;
      }
      case 'qa': {
        const conversationHistory = request.context?.conversationHistory 
          ? truncateContext(request.context.conversationHistory, 2000)
          : undefined;
        const prompt = buildQAPrompt(
          request.content,
          conversationHistory,
          request.context?.documentContext,
          request.context?.searchResults
        );
        systemPrompt = prompt.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction);
        userPrompt = prompt.user;
        break;
      }
      case 'translate': {
        const prompt = buildTranslatePrompt(
          request.content,
          request.metadata?.language || 'English',
          'English'
        );
        systemPrompt = prompt.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction);
        userPrompt = prompt.user;
        break;
      }
      case 'search': {
        if (!request.context?.searchResults) {
          throw new Error('Search requires search results in context');
        }
        const prompt = buildSearchPrompt(
          request.content,
          request.context.searchResults
        );
        systemPrompt = prompt.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction);
        userPrompt = prompt.user;
        break;
      }
      case 'classify': {
        const prompt = buildClassifyPrompt(
          request.content,
          request.metadata?.documentName
        );
        systemPrompt = prompt.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction);
        userPrompt = prompt.user;
        break;
      }
      default:
        throw new Error(`Unknown intent: ${request.intent}`);
    }

    const messages: OpenRouterMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ];

    await generateStreamingResponseWithOpenRouter(
      messages, 
      apiKey, 
      onChunk, 
      onComplete, 
      onError
    );
  } catch (error) {
    logger.log('error', 'Streaming request failed', error);
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Legacy compatibility functions
export const analyzeDocumentContent = async (
  documentName: string,
  documentContent: string,
  apiKey: string
): Promise<string> => {
  const request: LegalAIRequest = {
    intent: 'contract_review',
    content: documentContent,
    metadata: {
      documentName
    }
  };
  
  const response = await processLegalAIRequest(request, apiKey);
  
  if (response.success && response.data) {
    if (typeof response.data === 'string') {
      return response.data;
    }
    return formatLegalResponse(response.data, 'contract_review');
  }
  
  throw new Error(response.error?.message || 'Analysis failed');
};

export const summarizeDocument = async (
  documentName: string,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  if (!documentContent) {
    throw new Error('No document content provided for summary.');
  }

  const request: LegalAIRequest = {
    intent: 'summarize',
    content: documentContent,
    metadata: {
      documentName
    }
  };
  
  const response = await processLegalAIRequest(request, apiKey);
  
  if (response.success && response.data) {
    if (typeof response.data === 'string') {
      return response.data;
    }
    return formatLegalResponse(response.data, 'summarize');
  }
  
  throw new Error(response.error?.message || 'Summarization failed');
};

export const answerQuestion = async (
  question: string,
  conversationContext: string,
  documentContext: string | null,
  documentContent: string | null,
  apiKey: string
): Promise<string> => {
  const request: LegalAIRequest = {
    intent: 'qa',
    content: question,
    context: {
      conversationHistory: conversationContext,
      documentContext: documentContext || undefined
    },
    metadata: {
      documentName: documentContext || undefined
    }
  };
  
  // Add document content to the question if provided
  if (documentContent) {
    request.content = `${question}\n\nDOCUMENT CONTENT:\n${documentContent}`;
  }
  
  const response = await processLegalAIRequest(request, apiKey);
  
  if (response.success && response.data) {
    if (typeof response.data === 'string') {
      return response.data;
    }
    return formatLegalResponse(response.data, 'qa');
  }
  
  throw new Error(response.error?.message || 'Question answering failed');
};

// Streaming versions for legacy compatibility
export const answerQuestionStreaming = async (
  question: string,
  conversationContext: string,
  documentContext: string | null,
  documentContent: string | null,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  // Attempt to extract jurisdiction from the question prefix to place in metadata
  let jurisdictionMatch = question.match(/^Jurisdiction:\s*([^.]+)\./i);
  const jurisdiction = jurisdictionMatch ? jurisdictionMatch[1].trim() : undefined;
  const request: LegalAIRequest = {
    intent: 'qa',
    content: question,
    context: {
      conversationHistory: conversationContext,
      documentContext: documentContext || undefined
    },
    metadata: {
      documentName: documentContext || undefined,
      jurisdiction
    }
  };
  
  if (documentContent) {
    request.content = `${question}\n\nDOCUMENT CONTENT:\n${documentContent}`;
  }
  
  await processLegalAIRequestStreaming(request, apiKey, onChunk, onComplete, onError);
};

export const summarizeDocumentStreaming = async (
  documentName: string,
  documentContent: string | null,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  if (!documentContent) {
    onError?.(new Error('No document content provided for summary.'));
    return;
  }

  const request: LegalAIRequest = {
    intent: 'summarize',
    content: documentContent,
    metadata: {
      documentName
    }
  };
  
  await processLegalAIRequestStreaming(request, apiKey, onChunk, onComplete, onError);
};

export const analyzeDocumentContentStreaming = async (
  documentName: string,
  documentContent: string,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  const request: LegalAIRequest = {
    intent: 'contract_review',
    content: documentContent,
    metadata: {
      documentName
    }
  };
  
  await processLegalAIRequestStreaming(request, apiKey, onChunk, onComplete, onError);
};

/**
 * Generate a concise chat title from conversation text and jurisdiction.
 * Returns a 5-8 word title with key nouns/verbs, no quotes or trailing punctuation.
 */
export const generateChatTitleWithOpenRouter = async (
  conversationText: string,
  jurisdiction: string,
  apiKey: string
): Promise<string> => {
  if (!apiKey || apiKey.trim() === '') {
    throw new Error('OpenRouter API key is missing.');
  }

  const system = `You generate concise, descriptive chat titles for legal assistant conversations.
Rules:
- 5 to 8 words
- Title case (Capitalize Main Words)
- No quotes, no trailing period
- Reflect the legal topic and the jurisdiction`;

  const user = `Jurisdiction: ${jurisdiction}
Conversation:
${conversationText.slice(0, 3000)}

Output only the title.`;

  const messages: OpenRouterMessage[] = [
    { role: 'system', content: system },
    { role: 'user', content: user }
  ];

  const title = await generateResponseWithOpenRouter(messages, apiKey);
  // Sanitize title
  return (title || 'New Chat')
    .replace(/["'`]/g, '')
    .replace(/[\.\s]+$/g, '')
    .trim()
    .slice(0, 80);
};
