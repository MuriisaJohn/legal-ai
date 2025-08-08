/**
 * Utility functions for Legal AI Service
 * Includes validation, preprocessing, postprocessing, and error handling
 */

import { 
  ContractReviewResponse, 
  DocumentSummaryResponse, 
  ClassificationResponse,
  ValidationError,
  LegalIntent,
  RetryConfig 
} from './legalAITypes';

// Citation pattern for Ugandan law references
const CITATION_PATTERN = /\[([A-Za-z\s]+(?:Act|Law|Regulation|Code|Constitution)),\s*(\d{4}),\s*s\.\s*([0-9]+(?:\([a-z0-9]+\))?)\]/g;

// Named Entity Recognition (NER) for legal documents
export interface ExtractedEntities {
  dates: Array<{ value: string; context: string }>;
  names: Array<{ value: string; type: 'person' | 'organization' }>;
  amounts: Array<{ value: string; currency?: string }>;
  statutes: Array<{ name: string; year?: string; section?: string }>;
  contractClauses: Array<{ number: string; title?: string }>;
}

export function extractEntities(text: string): ExtractedEntities {
  const entities: ExtractedEntities = {
    dates: [],
    names: [],
    amounts: [],
    statutes: [],
    contractClauses: []
  };

  // Extract dates (various formats)
  const datePatterns = [
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/g,
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/g,
    /\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}\b/gi,
    /\b\d{1,2}\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/gi
  ];

  datePatterns.forEach(pattern => {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const context = text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + match[0].length + 30));
      entities.dates.push({ value: match[0], context });
    }
  });

  // Extract monetary amounts
  const amountPattern = /\b(?:UGX|USD|EUR|GBP|KES)?\s*[\d,]+(?:\.\d{2})?\s*(?:million|billion|thousand|hundred)?\s*(?:UGX|USD|EUR|GBP|KES|shillings?|dollars?|euros?|pounds?)?\b/gi;
  let amountMatch;
  while ((amountMatch = amountPattern.exec(text)) !== null) {
    if (/\d/.test(amountMatch[0])) {
      entities.amounts.push({ value: amountMatch[0].trim() });
    }
  }

  // Extract statutes and legal references
  const statutePattern = /\b([A-Z][A-Za-z\s]+(?:Act|Law|Code|Regulation|Constitution))(?:,?\s*(\d{4}))?(?:,?\s*(?:s\.|section)\s*(\d+(?:\([a-z0-9]+\))?))?/g;
  let statuteMatch;
  while ((statuteMatch = statutePattern.exec(text)) !== null) {
    entities.statutes.push({
      name: statuteMatch[1].trim(),
      year: statuteMatch[2] || undefined,
      section: statuteMatch[3] || undefined
    });
  }

  // Extract contract clauses
  const clausePattern = /\b(?:Clause|Article|Section|Paragraph)\s*(\d+(?:\.\d+)*)\s*(?:[:\-]\s*([A-Z][^.!?\n]*?))?(?=[.!?\n])/gi;
  let clauseMatch;
  while ((clauseMatch = clausePattern.exec(text)) !== null) {
    entities.contractClauses.push({
      number: clauseMatch[1],
      title: clauseMatch[2]?.trim()
    });
  }

  // Extract organization names (simple heuristic - capitalized multi-word phrases)
  const orgPattern = /\b(?:(?:[A-Z][a-z]+\s+){2,}(?:Ltd|Limited|Inc|Corporation|Corp|Company|Co|PLC|LLC|LLP|Partnership))\b/g;
  let orgMatch;
  while ((orgMatch = orgPattern.exec(text)) !== null) {
    entities.names.push({ value: orgMatch[0], type: 'organization' });
  }

  // Extract person names (Title + Name pattern)
  const personPattern = /\b(?:Mr\.|Mrs\.|Ms\.|Dr\.|Prof\.|Hon\.)\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,2}\b/g;
  let personMatch;
  while ((personMatch = personPattern.exec(text)) !== null) {
    entities.names.push({ value: personMatch[0], type: 'person' });
  }

  return entities;
}

// Verify and fix citation format
export function verifyCitations(text: string): { verified: string; issues: string[] } {
  const issues: string[] = [];
  let verified = text;

  // Find potentially malformed citations
  const potentialCitations = text.match(/\[[^\]]*\]/g) || [];
  
  potentialCitations.forEach(citation => {
    if (!CITATION_PATTERN.test(citation)) {
      issues.push(`Malformed citation: ${citation}`);
      
      // Try to fix common issues
      let fixed = citation;
      
      // Fix missing spaces after commas
      fixed = fixed.replace(/,(\S)/g, ', $1');
      
      // Fix 'section' to 's.'
      fixed = fixed.replace(/\bsection\s+/gi, 's. ');
      
      // Ensure year is 4 digits
      fixed = fixed.replace(/,\s*(\d{2})(?=,|\])/g, (match, year) => {
        const fullYear = parseInt(year) > 50 ? `19${year}` : `20${year}`;
        return `, ${fullYear}`;
      });
      
      verified = verified.replace(citation, fixed);
    }
  });

  return { verified, issues };
}

// Intent detection from user input
export function detectIntent(text: string): { intent: LegalIntent; confidence: number } {
  const lowerText = text.toLowerCase();
  
  const intentPatterns: Record<LegalIntent, RegExp[]> = {
    contract_review: [
      /review.*contract/i,
      /analyze.*agreement/i,
      /check.*contract/i,
      /contract.*analysis/i,
      /find.*risks.*contract/i,
      /contract.*compliance/i
    ],
    summarize: [
      /summar/i,
      /brief/i,
      /overview/i,
      /key points/i,
      /main points/i,
      /tldr/i
    ],
    qa: [
      /what\s+(?:is|are|does|do)/i,
      /how\s+(?:do|does|can|should)/i,
      /when\s+(?:is|are|does|do)/i,
      /why\s+(?:is|are|does|do)/i,
      /explain/i,
      /tell me about/i
    ],
    translate: [
      /translate/i,
      /translation/i,
      /convert.*language/i,
      /in\s+(?:luganda|swahili|french|spanish)/i
    ],
    search: [
      /search/i,
      /find.*(?:law|act|regulation|statute)/i,
      /look up/i,
      /precedent/i,
      /case law/i
    ],
    classify: [
      /classify/i,
      /categorize/i,
      /risk.*assessment/i,
      /urgency/i,
      /priority/i,
      /sentiment/i
    ]
  };

  let detectedIntent: LegalIntent = 'qa'; // default
  let highestConfidence = 0;

  for (const [intent, patterns] of Object.entries(intentPatterns)) {
    const matchCount = patterns.filter(pattern => pattern.test(lowerText)).length;
    const confidence = matchCount / patterns.length;
    
    if (confidence > highestConfidence) {
      highestConfidence = confidence;
      detectedIntent = intent as LegalIntent;
    }
  }

  // If no strong match, use keyword density
  if (highestConfidence < 0.3) {
    if (lowerText.includes('contract') || lowerText.includes('agreement')) {
      detectedIntent = 'contract_review';
      highestConfidence = 0.5;
    } else if (lowerText.includes('summar') || lowerText.length < 50) {
      detectedIntent = 'summarize';
      highestConfidence = 0.4;
    }
  }

  return { intent: detectedIntent, confidence: highestConfidence };
}

// JSON Schema validation
export function validateJSONResponse<T>(response: string, schema: any): { valid: boolean; data?: T; errors?: ValidationError[] } {
  try {
    const parsed = JSON.parse(response);
    // Simple validation - can be enhanced with a proper JSON schema validator like Ajv
    const errors: ValidationError[] = [];
    
    // Check required fields based on response type
    if (schema === 'ContractReviewResponse') {
      const required = ['summary', 'parties', 'key_provisions', 'risks', 'recommendations'];
      required.forEach(field => {
        if (!(field in parsed)) {
          errors.push({ field, message: `Missing required field: ${field}` });
        }
      });
    }
    
    if (errors.length > 0) {
      return { valid: false, errors };
    }
    
    return { valid: true, data: parsed as T };
  } catch (error) {
    return { 
      valid: false, 
      errors: [{ 
        field: 'response', 
        message: 'Invalid JSON format', 
        received: response 
      }] 
    };
  }
}

// Retry with exponential backoff
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  config: RetryConfig = {
    maxAttempts: 3,
    initialDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2
  }
): Promise<T> {
  let lastError: Error | null = null;
  let delay = config.initialDelay;

  for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      
      if (attempt === config.maxAttempts) {
        throw lastError;
      }

      // Check if error is retryable
      const errorMessage = lastError.message.toLowerCase();
      if (errorMessage.includes('rate limit') || 
          errorMessage.includes('timeout') || 
          errorMessage.includes('server error')) {
        
        console.log(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay = Math.min(delay * config.backoffMultiplier, config.maxDelay);
      } else {
        // Non-retryable error
        throw lastError;
      }
    }
  }

  throw lastError;
}

// Context truncation for token management
export function truncateContext(text: string, maxTokens: number = 4000): string {
  // Rough estimation: 1 token ≈ 4 characters
  const maxChars = maxTokens * 4;
  
  if (text.length <= maxChars) {
    return text;
  }

  // Smart truncation - try to preserve complete sentences
  const truncated = text.substring(0, maxChars);
  const lastPeriod = truncated.lastIndexOf('.');
  const lastNewline = truncated.lastIndexOf('\n');
  
  const cutPoint = Math.max(lastPeriod, lastNewline);
  
  if (cutPoint > maxChars * 0.8) {
    return truncated.substring(0, cutPoint + 1) + '\n...[Context truncated for length]';
  }
  
  return truncated + '...[Context truncated for length]';
}

// Sanitize PII from logs
export function sanitizePII(text: string): string {
  let sanitized = text;
  
  // Email addresses
  sanitized = sanitized.replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL_REDACTED]');
  
  // Phone numbers (various formats)
  sanitized = sanitized.replace(/\+?[\d\s\-\(\)]+\d{6,}/g, '[PHONE_REDACTED]');
  
  // National IDs (Uganda format)
  sanitized = sanitized.replace(/\b[A-Z]{2}\d{8}[A-Z]\b/g, '[NID_REDACTED]');
  
  // Bank account numbers
  sanitized = sanitized.replace(/\b\d{10,20}\b/g, '[ACCOUNT_REDACTED]');
  
  // Credit card numbers
  sanitized = sanitized.replace(/\b\d{4}[\s\-]?\d{4}[\s\-]?\d{4}[\s\-]?\d{4}\b/g, '[CARD_REDACTED]');
  
  return sanitized;
}

// Format response for display
export function formatLegalResponse(response: any, intent: LegalIntent): string {
  switch (intent) {
    case 'contract_review':
      return formatContractReview(response as ContractReviewResponse);
    case 'summarize':
      return formatDocumentSummary(response as DocumentSummaryResponse);
    case 'classify':
      return formatClassification(response as ClassificationResponse);
    default:
      return typeof response === 'string' ? response : JSON.stringify(response, null, 2);
  }
}

// Generate a short, readable chat title from earliest user content
export function generateChatTitleFromMessages(messages: Array<{ sender: 'user' | 'ai'; content: string }>): string {
  const firstUser = messages.find((m) => m.sender === 'user');
  const text = (firstUser?.content || '').trim();
  if (!text) return 'New Chat';
  // Remove any leading jurisdiction prefix "Jurisdiction: Country. "
  const cleaned = text.replace(/^Jurisdiction:\s*[^.]+\.\s*/i, '').trim();
  // Use first sentence or first ~8 words
  const sentence = cleaned.split(/[.!?]/)[0].trim();
  const words = sentence.split(/\s+/).slice(0, 8).join(' ');
  const title = words || 'New Chat';
  return title.length < cleaned.length ? `${title}…` : title;
}

function formatContractReview(response: ContractReviewResponse): string {
  let formatted = `# Contract Review Analysis\n\n`;
  
  formatted += `## Summary\n${response.summary}\n\n`;
  
  formatted += `## Parties\n`;
  response.parties.forEach(party => {
    formatted += `- **${party.name}** (${party.role})\n`;
    party.obligations.forEach(obligation => {
      formatted += `  - ${obligation}\n`;
    });
  });
  
  formatted += `\n## Key Risks\n`;
  response.risks.forEach(risk => {
    formatted += `- **${risk.severity.toUpperCase()}**: ${risk.description}\n`;
    formatted += `  - Mitigation: ${risk.mitigation}\n`;
    if (risk.relevant_law) {
      formatted += `  - Relevant Law: ${risk.relevant_law}\n`;
    }
  });
  
  formatted += `\n## Recommendations\n`;
  response.recommendations.forEach(rec => {
    formatted += `- ${rec}\n`;
  });
  
  formatted += `\n## Next Steps\n`;
  response.next_steps.forEach(step => {
    formatted += `1. ${step}\n`;
  });
  
  return formatted;
}

function formatDocumentSummary(response: DocumentSummaryResponse): string {
  let formatted = `# Document Summary\n\n`;
  
  formatted += `**Type**: ${response.document_type}\n`;
  formatted += `**Purpose**: ${response.legal_purpose}\n\n`;
  
  formatted += `## Key Information\n\n`;
  formatted += response.summary + '\n\n';
  
  formatted += `## Important Dates\n`;
  response.key_dates.forEach(date => {
    formatted += `- ${date.date}: ${date.description} (${date.importance})\n`;
  });
  
  formatted += `\n## Relevant Laws\n`;
  response.relevant_laws.forEach(law => {
    formatted += `- ${law.act_name}, ${law.year}`;
    if (law.sections.length > 0) {
      formatted += ` (Sections: ${law.sections.join(', ')})`;
    }
    formatted += '\n';
  });
  
  return formatted;
}

function formatClassification(response: ClassificationResponse): string {
  let formatted = `# Document Classification\n\n`;
  
  formatted += `**Category**: ${response.document_category}\n`;
  formatted += `**Urgency**: ${response.urgency}\n`;
  formatted += `**Legal Risk**: ${response.legal_risk}\n`;
  formatted += `**Compliance**: ${response.compliance_status}\n\n`;
  
  if (response.required_actions.length > 0) {
    formatted += `## Required Actions\n`;
    response.required_actions.forEach(action => {
      formatted += `- ${action.action}`;
      if (action.deadline) {
        formatted += ` (by ${action.deadline})`;
      }
      formatted += ` [${action.priority}]\n`;
    });
  }
  
  return formatted;
}

// Logger class
export class LegalAILogger {
  private static instance: LegalAILogger;
  private logs: any[] = [];
  
  static getInstance(): LegalAILogger {
    if (!LegalAILogger.instance) {
      LegalAILogger.instance = new LegalAILogger();
    }
    return LegalAILogger.instance;
  }
  
  log(level: 'debug' | 'info' | 'warn' | 'error', message: string, data?: any) {
    const entry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      data: data ? sanitizePII(JSON.stringify(data)) : undefined
    };
    
    this.logs.push(entry);
    
    if (level === 'error') {
      console.error(`[${entry.timestamp}] ${message}`, data);
    } else if (level === 'warn') {
      console.warn(`[${entry.timestamp}] ${message}`);
    } else if (level === 'info') {
      console.info(`[${entry.timestamp}] ${message}`);
    } else {
      console.log(`[${entry.timestamp}] ${message}`);
    }
  }
  
  getLogs() {
    return this.logs;
  }
  
  clearLogs() {
    this.logs = [];
  }
}
