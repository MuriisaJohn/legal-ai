/**
 * Central export file for all Legal AI services
 * This provides a single point of import for all service functionality
 */

// Export all from the main enhanced service
export * from './openRouterService';

// Export types
export * from './legalAITypes';

// Export utilities
export * from './legalAIUtils';

// Export prompts
export * from './prompts';

// Re-export commonly used functions for convenience
export {
  // Main processing functions
  processLegalAIRequest,
  processAutoIntent,
  processLegalAIRequestStreaming,
  
  // Legacy compatibility functions
  analyzeDocumentContent,
  summarizeDocument,
  answerQuestion,
  analyzeDocumentContentStreaming,
  summarizeDocumentStreaming,
  answerQuestionStreaming,
  
  // Base utilities
  generateResponseWithOpenRouter,
  generateStreamingResponseWithOpenRouter,
  validateOpenRouterApiKey,
  
  // Intent detection and processing
  detectIntent,
  extractEntities,
  verifyCitations,
  
  // Utilities
  LegalAILogger,
  formatLegalResponse,
  truncateContext,
  retryWithBackoff
} from './openRouterService';

// Export prompt builders
export {
  buildContractReviewPrompt,
  buildSummarizePrompt,
  buildQAPrompt,
  buildTranslatePrompt,
  buildSearchPrompt,
  buildClassifyPrompt,
  PROMPT_TEMPLATES
} from './prompts';

// Export types for easy access
export type {
  // Request/Response types
  LegalAIRequest,
  LegalAIResponse,
  LegalIntent,
  
  // Service-specific response types
  ContractReviewResponse,
  DocumentSummaryResponse,
  QAResponse,
  TranslationResponse,
  SearchResponse,
  ClassificationResponse,
  
  // Utility types
  RiskLevel,
  Sentiment,
  ComplianceStatus,
  DocumentCategory,
  
  // OpenRouter types
  OpenRouterMessage,
  OpenRouterResponse,
  OpenRouterStreamChunk
} from './legalAITypes';
