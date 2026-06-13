import type { ITTSService, TTSError } from './types';

const MOSHI_TTS_BASE_URL = 'http://localhost:5000';

export class MoshiTTSClient implements ITTSService {
  private baseUrl: string;

  constructor(baseUrl: string = MOSHI_TTS_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  async synthesize(text: string, voiceId = 'default'): Promise<ArrayBuffer> {
    const response = await fetch(`${this.baseUrl}/synthesize`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, voice_id: voiceId }),
    });
    if (!response.ok) throw new Error(`TTS failed: ${response.status}`);
    return response.arrayBuffer();
  }

  async streamSynthesize(
    text: string,
    voiceId = 'default',
    onChunk: (chunk: Uint8Array) => void,
    onComplete: () => void,
    onError: (error: TTSError) => void
  ): Promise<void> {
    try {
      const response = await fetch(`${this.baseUrl}/synthesize`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice_id: voiceId }),
      });
      if (!response.ok) {
        onError({ message: `TTS request failed: ${response.status}`, status: response.status });
        return;
      }
      const reader = response.body?.getReader();
      if (!reader) {
        onError({ message: 'No response body' });
        return;
      }
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const parsed = JSON.parse(line);
            if (parsed.audio) {
              const audioData = Uint8Array.from(atob(parsed.audio), c => c.charCodeAt(0));
              onChunk(audioData);
            }
          } catch {}
        }
      }
      onComplete();
    } catch (err) {
      onError({ message: err instanceof Error ? err.message : 'Unknown TTS error' });
    }
  }
}
