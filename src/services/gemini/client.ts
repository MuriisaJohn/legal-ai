import { HttpClient } from '@/services/http/client';
import {
  GeminiMessage,
  GeminiResponse,
  GeminiStreamChunk,
  GeminiRequestConfig,
  DEFAULT_GEMINI_CONFIG,
} from './types';

export interface IGeminiService {
  generateResponse(systemInstruction: string, userPrompt: string): Promise<string>;
  generateStreamingResponse(
    systemInstruction: string,
    userPrompt: string,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void>;
  validateApiKey(): Promise<{ valid: boolean; error?: string }>;
}

export class GeminiClient implements IGeminiService {
  private http: HttpClient;
  private config: GeminiRequestConfig;

  constructor(
    private apiKey: string,
    config?: Partial<GeminiRequestConfig>
  ) {
    this.config = { ...DEFAULT_GEMINI_CONFIG, ...config };
    this.http = new HttpClient({
      baseUrl: 'https://generativelanguage.googleapis.com/v1beta',
      defaultHeaders: { 'Content-Type': 'application/json' },
      retries: 2,
      timeout: 30000,
    });
  }

  async generateResponse(
    systemInstruction: string,
    userPrompt: string,
    responseMimeType: string = 'text/plain'
  ): Promise<string> {
    this.ensureApiKey();

    const data = await this.http.post<
      Record<string, unknown>,
      GeminiResponse
    >(
      `/models/${this.config.model}:generateContent?key=${this.apiKey}`,
      {
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: {
          temperature: this.config.temperature,
          maxOutputTokens: this.config.maxOutputTokens,
          topP: this.config.topP,
          response_mime_type: responseMimeType,
        },
      }
    );

    return data.candidates?.[0]?.content?.parts?.[0]?.text ?? 'No response generated.';
  }

  async generateStreamingResponse(
    systemInstruction: string,
    userPrompt: string,
    onChunk: (chunk: string) => void,
    onComplete?: () => void,
    onError?: (error: Error) => void
  ): Promise<void> {
    try {
      this.ensureApiKey();

      const url = `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:streamGenerateContent?alt=sse&key=${this.apiKey}`;

      const maxRetries = 3;

      for (let attempt = 0; attempt <= maxRetries; attempt++) {
        try {
          const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              system_instruction: { parts: [{ text: systemInstruction }] },
              contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
              generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxOutputTokens,
                topP: this.config.topP,
              },
            }),
          });

          if (!response.ok) {
            const errorText = await response.text();
            if (response.status === 429 && attempt < maxRetries) {
              let delay = 1000 * Math.pow(2, attempt);
              try {
                const parsed = JSON.parse(errorText);
                const retryInfo = parsed.error?.details?.find(
                  (d: Record<string, unknown>) =>
                    String(d['@type']).includes('RetryInfo')
                );
                if (retryInfo?.retryDelay) {
                  const seconds = parseFloat(String(retryInfo.retryDelay).replace('s', ''));
                  if (seconds > 0) delay = seconds * 1000 + 500;
                }
              } catch {}
              await new Promise(r => setTimeout(r, delay));
              continue;
            }
            throw new Error(`Gemini streaming error: ${response.status} - ${errorText}`);
          }

          if (!response.body) throw new Error('No response body');

          const reader = response.body.getReader();
          const decoder = new TextDecoder();
          let buffer = '';

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() ?? '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const parsed: GeminiStreamChunk = JSON.parse(line.slice(6));
                  const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text;
                  if (content) onChunk(content);
                } catch {
                  console.warn('Failed to parse Gemini chunk');
                }
              }
            }
          }

          onComplete?.();
          return;
        } catch (error) {
          if (attempt < maxRetries) {
            await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
            continue;
          }
          throw error;
        }
      }
    } catch (error) {
      onError?.(error instanceof Error ? error : new Error('Unknown Gemini streaming error'));
    }
  }

  async validateApiKey(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      return { valid: false, error: 'API key is missing' };
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${this.apiKey}`,
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (response.ok) return { valid: true };

      const errorData = await response.json();
      return {
        valid: false,
        error: errorData.error?.message ?? `API validation failed: ${response.status}`,
      };
    } catch {
      return { valid: false, error: 'Network error while validating API key' };
    }
  }

  private ensureApiKey(): void {
    if (!this.apiKey || this.apiKey.trim() === '') {
      throw new Error('Gemini API key is missing. Check your environment variables.');
    }
  }
}
