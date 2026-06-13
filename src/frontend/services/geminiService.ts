/**
 * Gemini AI Service with Unified Legal AI Framework
 * Uses GeminiClient internally for HTTP, retries, and error handling.
 */

import { GeminiClient } from '@/services/gemini';

import { 
  ContractReviewResponse, 
  DocumentSummaryResponse, 
  ClassificationResponse,
  QAResponse,
  TranslationResponse,
  SearchResponse,
  LegalAIRequest,
  LegalAIResponse,
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
  extractEntities,
  verifyCitations,
  validateJSONResponse,
  retryWithBackoff,
  truncateContext,
  LegalAILogger,
  formatLegalResponse,
  detectIntent
} from './legalAIUtils';

const logger = LegalAILogger.getInstance();

export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

/**
 * Validates Gemini API Key using GeminiClient
 */
export const validateGeminiApiKey = async (apiKey: string): Promise<{ valid: boolean; error?: string }> => {
  const client = new GeminiClient(apiKey);
  return client.validateApiKey();
};

/**
 * Base utility for sending a Gemini chat completion request
 */
export const generateResponseWithGemini = async (
  systemInstruction: string,
  userPrompt: string,
  apiKey: string,
  responseMimeType: string = "text/plain"
): Promise<string> => {
  const client = new GeminiClient(apiKey);
  return client.generateResponse(systemInstruction, userPrompt, responseMimeType);
};

/**
 * Streaming version of generateResponseWithGemini
 */
export const generateStreamingResponseWithGemini = async (
  systemInstruction: string,
  userPrompt: string,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  const client = new GeminiClient(apiKey);
  return client.generateStreamingResponse(systemInstruction, userPrompt, onChunk, onComplete, onError);
};

/**
 * Main unified legal AI service handler for Gemini
 */
export const processLegalAIRequest = async (
  request: LegalAIRequest,
  apiKey: string
): Promise<LegalAIResponse> => {
  const startTime = Date.now();
  try {
    const entities = extractEntities(request.content);
    let systemPrompt: string;
    let userPrompt: string;
    let isJsonResponse = false;

    // Build prompts using existing builders
    switch (request.intent) {
      case 'contract_review': {
        const p = buildContractReviewPrompt(request.content, request.metadata?.documentName, { entities, ...request.metadata });
        systemPrompt = p.system; userPrompt = p.user; isJsonResponse = true;
        break;
      }
      case 'summarize': {
        const p = buildSummarizePrompt(request.content, request.metadata?.documentName, request.metadata?.documentType);
        systemPrompt = p.system; userPrompt = p.user; isJsonResponse = true;
        break;
      }
      case 'qa': {
        const history = request.context?.conversationHistory ? truncateContext(request.context.conversationHistory, 2000) : undefined;
        const p = buildQAPrompt(request.content, history, request.context?.documentContext, request.context?.searchResults);
        systemPrompt = p.system; userPrompt = p.user;
        break;
      }
      case 'translate': {
        const p = buildTranslatePrompt(request.content, request.metadata?.language || 'English');
        systemPrompt = p.system; userPrompt = p.user;
        break;
      }
      case 'search': {
        if (!request.context?.searchResults) throw new Error('Search requires results in context');
        const p = buildSearchPrompt(request.content, request.context.searchResults);
        systemPrompt = p.system; userPrompt = p.user;
        break;
      }
      case 'classify': {
        const p = buildClassifyPrompt(request.content, request.metadata?.documentName);
        systemPrompt = p.system; userPrompt = p.user; isJsonResponse = true;
        break;
      }
      default: throw new Error(`Unknown intent: ${request.intent}`);
    }

    const responseText = await retryWithBackoff(() => 
      generateResponseWithGemini(systemPrompt, userPrompt, apiKey, isJsonResponse ? "application/json" : "text/plain")
    );

    let data = responseText;
    if (isJsonResponse) {
      const validation = validateJSONResponse(responseText, request.intent === 'contract_review' ? 'ContractReviewResponse' : '');
      if (validation.valid) data = validation.data;
    }

    // Post-process citations
    if (typeof data === 'string') {
      const { verified } = verifyCitations(data);
      data = verified;
    }

    return {
      success: true,
      data,
      metadata: {
        processingTime: Date.now() - startTime,
        tokensUsed: 0,
        model: 'gemini-3.5-flash',
        timestamp: new Date().toISOString()
      }
    };
  } catch (error) {
    return {
      success: false,
      error: { code: 'GEMINI_ERROR', message: error instanceof Error ? error.message : 'Unknown error' },
      metadata: { processingTime: Date.now() - startTime, tokensUsed: 0, model: 'gemini-3.5-flash', timestamp: new Date().toISOString() }
    };
  }
};

/**
 * Legacy compatibility functions rewritten for Gemini
 */
export const analyzeDocumentContent = async (name: string, content: string, key: string) => {
  const res = await processLegalAIRequest({ intent: 'contract_review', content, metadata: { documentName: name } }, key);
  if (res.success && res.data) return typeof res.data === 'string' ? res.data : formatLegalResponse(res.data, 'contract_review');
  throw new Error(res.error?.message || 'Analysis failed');
};

export const summarizeDocument = async (name: string, content: string | null, key: string) => {
  if (!content) throw new Error('No content');
  const res = await processLegalAIRequest({ intent: 'summarize', content, metadata: { documentName: name } }, key);
  if (res.success && res.data) return typeof res.data === 'string' ? res.data : formatLegalResponse(res.data, 'summarize');
  throw new Error(res.error?.message || 'Summarization failed');
};

export const answerQuestion = async (q: string, history: string, docCtx: string | null, docContent: string | null, key: string) => {
  const content = docContent ? `${q}\n\nDOCUMENT:\n${docContent}` : q;
  const res = await processLegalAIRequest({ intent: 'qa', content, context: { conversationHistory: history, documentContext: docCtx || undefined } }, key);
  if (res.success && res.data) return typeof res.data === 'string' ? res.data : formatLegalResponse(res.data, 'qa');
  throw new Error(res.error?.message || 'QA failed');
};

/**
 * Streaming version with intent detection
 */
export const processLegalAIRequestStreaming = async (
  request: LegalAIRequest,
  apiKey: string,
  onChunk: (chunk: string) => void,
  onComplete?: () => void,
  onError?: (error: Error) => void
): Promise<void> => {
  try {
    const entities = extractEntities(request.content);
    let systemPrompt: string;
    let userPrompt: string;

    const jurisdiction = request.metadata?.jurisdiction || 'Uganda';
    switch (request.intent) {
      case 'contract_review': {
        const p = buildContractReviewPrompt(request.content, request.metadata?.documentName, { entities, jurisdiction, ...request.metadata });
        systemPrompt = p.system; userPrompt = p.user; break;
      }
      case 'summarize': {
        const p = buildSummarizePrompt(request.content, request.metadata?.documentName, request.metadata?.documentType);
        systemPrompt = p.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction); userPrompt = p.user; break;
      }
      case 'qa': {
        const history = request.context?.conversationHistory ? truncateContext(request.context.conversationHistory, 2000) : undefined;
        const p = buildQAPrompt(request.content, history, request.context?.documentContext, request.context?.searchResults);
        systemPrompt = p.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction); userPrompt = p.user; break;
      }
      default: {
        // Fallback for streaming
        const p = buildQAPrompt(request.content, undefined, undefined, undefined);
        systemPrompt = p.system.replace(/\{\{jurisdiction\}\}/g, jurisdiction); userPrompt = p.user; break;
      }
    }

    await generateStreamingResponseWithGemini(systemPrompt, userPrompt, apiKey, onChunk, onComplete, onError);
  } catch (error) {
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

/**
 * Streaming legacy versions
 */
export const answerQuestionStreaming = async (q: string, history: string, docCtx: string | null, docContent: string | null, key: string, onChunk: any, onComplete: any, onError: any) => {
  const content = docContent ? `${q}\n\nDOCUMENT:\n${docContent}` : q;
  await processLegalAIRequestStreaming({ intent: 'qa', content, context: { conversationHistory: history, documentContext: docCtx || undefined } }, key, onChunk, onComplete, onError);
};

export const summarizeDocumentStreaming = async (name: string, content: string | null, key: string, onChunk: any, onComplete: any, onError: any) => {
  if (!content) return onError?.(new Error('No content'));
  await processLegalAIRequestStreaming({ intent: 'summarize', content, metadata: { documentName: name } }, key, onChunk, onComplete, onError);
};

export const analyzeDocumentContentStreaming = async (name: string, content: string, key: string, onChunk: any, onComplete: any, onError: any) => {
  await processLegalAIRequestStreaming({ intent: 'contract_review', content, metadata: { documentName: name } }, key, onChunk, onComplete, onError);
};

/**
 * Generate a concise chat title
 */
export const generateChatTitleWithGemini = async (text: string, jur: string, key: string): Promise<string> => {
  const system = `You generate 5-8 word chat titles for legal conversations. Title Case, no quotes, no period. Jurisdiction: ${jur}`;
  const user = `Conversation snippet: ${text.slice(0, 2000)}`;
  const title = await generateResponseWithGemini(system, user, key);
  return title.replace(/["'`]/g, '').trim().slice(0, 80);
};
