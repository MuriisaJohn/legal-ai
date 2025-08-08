/**
 * Type definitions for Legal AI Service responses and requests
 */

// Intent types for routing
export type LegalIntent = 
  | 'contract_review' 
  | 'summarize' 
  | 'qa' 
  | 'translate' 
  | 'search' 
  | 'classify';

// Risk levels
export type RiskLevel = 'low' | 'medium' | 'high';
export type Sentiment = 'positive' | 'neutral' | 'negative';
export type ComplianceStatus = 'compliant' | 'non-compliant' | 'review-needed';
export type DocumentCategory = 'contract' | 'litigation' | 'regulatory' | 'corporate' | 'other';

// Contract Review Response Schema
export interface ContractReviewResponse {
  summary: string;
  parties: Array<{
    name: string;
    role: string;
    obligations: string[];
  }>;
  key_provisions: Array<{
    clause: number | string;
    title: string;
    content: string;
    issue?: string;
    statute?: string;
    risk_level?: RiskLevel;
  }>;
  important_dates: Array<{
    date: string;
    description: string;
    type: 'deadline' | 'effective_date' | 'expiry' | 'review' | 'other';
  }>;
  risks: Array<{
    description: string;
    severity: RiskLevel;
    mitigation: string;
    relevant_law?: string;
  }>;
  missing_clauses: Array<{
    clause_type: string;
    importance: RiskLevel;
    recommendation: string;
    statute?: string;
  }>;
  compliance: {
    status: ComplianceStatus;
    issues: string[];
    required_actions: string[];
  };
  recommendations: string[];
  next_steps: string[];
  citations: Array<{
    act_name: string;
    year: number;
    section: string;
    relevance: string;
  }>;
}

// Document Summary Response Schema
export interface DocumentSummaryResponse {
  document_type: string;
  legal_purpose: string;
  parties: Array<{
    name: string;
    role: string;
  }>;
  key_dates: Array<{
    date: string;
    description: string;
    importance: RiskLevel;
  }>;
  main_provisions: Array<{
    title: string;
    summary: string;
    legal_reference?: string;
  }>;
  obligations_and_rights: {
    obligations: string[];
    rights: string[];
  };
  compliance_requirements: string[];
  regulatory_approvals: string[];
  relevant_laws: Array<{
    act_name: string;
    year: number;
    sections: string[];
    recent_amendments?: string;
  }>;
  summary: string;
}

// Q&A Response Schema
export interface QAResponse {
  answer: string;
  legal_basis: Array<{
    statute: string;
    year: number;
    section: string;
    summary: string;
  }>;
  case_law?: Array<{
    case_name: string;
    year: number;
    court: string;
    relevance: string;
  }>;
  practical_guidance: string[];
  mandatory_requirements: string[];
  best_practices: string[];
  warnings?: string[];
  further_reading?: Array<{
    title: string;
    type: 'statute' | 'case' | 'article' | 'regulation';
    relevance: string;
  }>;
}

// Translation Response Schema
export interface TranslationResponse {
  original_text: string;
  translated_text: string;
  source_language: string;
  target_language: string;
  legal_terms_glossary: Array<{
    original: string;
    translation: string;
    explanation?: string;
  }>;
  cultural_notes?: string[];
  warnings?: string[];
}

// Search Response Schema
export interface SearchResponse {
  query: string;
  synthesized_answer: string;
  relevant_documents: Array<{
    title: string;
    relevance_score: number;
    key_points: string[];
    citations: string[];
  }>;
  legal_principles: string[];
  conflicting_provisions?: Array<{
    provision1: string;
    provision2: string;
    explanation: string;
  }>;
  related_topics: string[];
}

// Classification Response Schema
export interface ClassificationResponse {
  urgency: RiskLevel;
  legal_risk: RiskLevel;
  sentiment: Sentiment;
  document_category: DocumentCategory;
  required_actions: Array<{
    action: string;
    deadline?: string;
    priority: RiskLevel;
  }>;
  compliance_status: ComplianceStatus;
  key_issues: string[];
  recommendations: string[];
}

// Intent Detection Request
export interface IntentDetectionRequest {
  text: string;
  context?: string;
  previousIntent?: LegalIntent;
}

// Intent Detection Response
export interface IntentDetectionResponse {
  intent: LegalIntent;
  confidence: number;
  entities?: Record<string, any>;
  suggestedPrompt?: string;
}

// Service Request wrapper
export interface LegalAIRequest {
  intent: LegalIntent;
  content: string;
  metadata?: {
    documentName?: string;
    documentType?: string;
    language?: string;
    jurisdiction?: string;
    userId?: string;
    sessionId?: string;
    timestamp?: string;
  };
  context?: {
    conversationHistory?: string;
    searchResults?: any[];
    documentContext?: string;
  };
  options?: {
    streaming?: boolean;
    maxTokens?: number;
    temperature?: number;
    includesCitations?: boolean;
  };
}

// Service Response wrapper
export interface LegalAIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  metadata?: {
    processingTime: number;
    tokensUsed: number;
    model: string;
    timestamp: string;
  };
}

// Validation Error
export interface ValidationError {
  field: string;
  message: string;
  received?: any;
  expected?: string;
}

// Retry Configuration
export interface RetryConfig {
  maxAttempts: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

// Logger Configuration
export interface LogConfig {
  level: 'debug' | 'info' | 'warn' | 'error';
  sanitizePII: boolean;
  logToConsole: boolean;
  logToFile?: boolean;
  filePath?: string;
}

// Metrics
export interface ServiceMetrics {
  requestCount: number;
  errorCount: number;
  averageLatency: number;
  tokenUsage: {
    total: number;
    byIntent: Record<LegalIntent, number>;
  };
  successRate: number;
}
