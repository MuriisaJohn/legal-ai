export interface GeminiMessage {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

export interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
    };
    finishReason?: string;
  }>;
}

export interface GeminiStreamChunk {
  candidates?: Array<{
    content?: {
      parts?: Array<{ text: string }>;
    };
  }>;
}

export interface GeminiRequestConfig {
  model: string;
  temperature: number;
  maxOutputTokens: number;
  topP: number;
}

export const DEFAULT_GEMINI_CONFIG: GeminiRequestConfig = {
  model: 'gemini-3.5-flash',
  temperature: 0.3,
  maxOutputTokens: 2000,
  topP: 0.9,
};
