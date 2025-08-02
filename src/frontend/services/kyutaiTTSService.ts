import { 
  generateStreamingResponseWithOpenRouter, 
  OpenRouterMessage,
  answerQuestionStreaming,
  summarizeDocumentStreaming,
  analyzeDocumentContentStreaming
} from './openRouterService';

// Base URL for the Moshi TTS service
const MOSHI_TTS_BASE_URL = 'http://localhost:5000';

// Interface for TTS options
export interface TTSOptions {
  voiceId?: string;
  onAudioChunk?: (audioChunk: Uint8Array) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

// Stream audio from Moshi TTS server
export const streamAudioFromMoshi = async (
  text: string, 
  options: TTSOptions = {}
): Promise<void> => {
  const { voiceId = 'default', onAudioChunk, onComplete, onError } = options;
  
  try {
    const response = await fetch(`${MOSHI_TTS_BASE_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId
      })
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
    }

    if (!response.body) {
      throw new Error('No response body received from TTS service');
    }

    const reader = response.body.getReader();
    
    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          onComplete?.();
          break;
        }
        
        if (value && onAudioChunk) {
          onAudioChunk(value);
        }
      }
    } finally {
      reader.releaseLock();
    }
  } catch (error) {
    console.error('Error streaming audio from Moshi:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown TTS error'));
  }
};

// Generate audio blob from text using Moshi TTS
export const generateAudioFromText = async (
  text: string,
  voiceId: string = 'default'
): Promise<Blob> => {
  try {
    const response = await fetch(`${MOSHI_TTS_BASE_URL}/synthesize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text,
        voice_id: voiceId
      })
    });

    if (!response.ok) {
      throw new Error(`TTS request failed: ${response.status} ${response.statusText}`);
    }

    return await response.blob();
  } catch (error) {
    console.error('Error generating audio from text:', error);
    throw error;
  }
};

// Combined service: Stream text from OpenRouter and convert to audio
export const streamTextToSpeech = async (
  messages: OpenRouterMessage[],
  apiKey: string,
  options: TTSOptions & {
    onTextChunk?: (chunk: string) => void;
    onTextComplete?: (fullText: string) => void;
  } = {}
): Promise<void> => {
  const { 
    voiceId = 'default', 
    onTextChunk, 
    onTextComplete, 
    onAudioChunk, 
    onComplete, 
    onError 
  } = options;
  
  let fullText = '';
  let audioQueue: string[] = [];
  let isProcessingAudio = false;
  
  const processAudioQueue = async () => {
    if (isProcessingAudio || audioQueue.length === 0) return;
    
    isProcessingAudio = true;
    
    while (audioQueue.length > 0) {
      const textChunk = audioQueue.shift()!;
      
      try {
        await streamAudioFromMoshi(textChunk, {
          voiceId,
          onAudioChunk,
          onError
        });
      } catch (error) {
        console.error('Error processing audio chunk:', error);
        onError?.(error instanceof Error ? error : new Error('Audio processing error'));
      }
    }
    
    isProcessingAudio = false;
  };
  
  try {
    await generateStreamingResponseWithOpenRouter(
      messages,
      apiKey,
      (chunk: string) => {
        fullText += chunk;
        onTextChunk?.(chunk);
        
        // Queue text for audio synthesis (process sentences)
        if (chunk.includes('.') || chunk.includes('!') || chunk.includes('?')) {
          const sentences = fullText.split(/[.!?]+/).filter(s => s.trim());
          if (sentences.length > audioQueue.length) {
            const newSentences = sentences.slice(audioQueue.length);
            audioQueue.push(...newSentences.map(s => s.trim() + '.'));
            processAudioQueue();
          }
        }
      },
      () => {
        onTextComplete?.(fullText);
        
        // Process any remaining text
        if (fullText.trim() && !audioQueue.includes(fullText.trim())) {
          audioQueue.push(fullText.trim());
          processAudioQueue().then(() => {
            onComplete?.();
          });
        } else {
          onComplete?.();
        }
      },
      onError
    );
  } catch (error) {
    console.error('Error in streamTextToSpeech:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Voice-enabled question answering
export const answerQuestionWithVoice = async (
  question: string,
  conversationContext: string,
  documentContext: string | null,
  documentContent: string | null,
  apiKey: string,
  options: TTSOptions & {
    onTextChunk?: (chunk: string) => void;
    onTextComplete?: (fullText: string) => void;
  } = {}
): Promise<void> => {
  const { 
    voiceId = 'default',
    onTextChunk,
    onTextComplete,
    onAudioChunk,
    onComplete,
    onError
  } = options;
  
  let fullText = '';
  
  try {
    await answerQuestionStreaming(
      question,
      conversationContext,
      documentContext,
      documentContent,
      apiKey,
      (chunk: string) => {
        fullText += chunk;
        onTextChunk?.(chunk);
      },
      async () => {
        onTextComplete?.(fullText);
        
        // Convert the complete response to audio
        try {
          await streamAudioFromMoshi(fullText, {
            voiceId,
            onAudioChunk,
            onComplete,
            onError
          });
        } catch (audioError) {
          console.error('Error converting response to audio:', audioError);
          onError?.(audioError instanceof Error ? audioError : new Error('Audio conversion error'));
        }
      },
      onError
    );
  } catch (error) {
    console.error('Error in answerQuestionWithVoice:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Voice-enabled document summarization
export const summarizeDocumentWithVoice = async (
  documentName: string,
  documentContent: string | null,
  apiKey: string,
  options: TTSOptions & {
    onTextChunk?: (chunk: string) => void;
    onTextComplete?: (fullText: string) => void;
  } = {}
): Promise<void> => {
  const { 
    voiceId = 'default',
    onTextChunk,
    onTextComplete,
    onAudioChunk,
    onComplete,
    onError
  } = options;
  
  let fullText = '';
  
  try {
    await summarizeDocumentStreaming(
      documentName,
      documentContent,
      apiKey,
      (chunk: string) => {
        fullText += chunk;
        onTextChunk?.(chunk);
      },
      async () => {
        onTextComplete?.(fullText);
        
        // Convert the complete summary to audio
        try {
          await streamAudioFromMoshi(fullText, {
            voiceId,
            onAudioChunk,
            onComplete,
            onError
          });
        } catch (audioError) {
          console.error('Error converting summary to audio:', audioError);
          onError?.(audioError instanceof Error ? audioError : new Error('Audio conversion error'));
        }
      },
      onError
    );
  } catch (error) {
    console.error('Error in summarizeDocumentWithVoice:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Voice-enabled document analysis
export const analyzeDocumentWithVoice = async (
  documentName: string,
  documentContent: string,
  apiKey: string,
  options: TTSOptions & {
    onTextChunk?: (chunk: string) => void;
    onTextComplete?: (fullText: string) => void;
  } = {}
): Promise<void> => {
  const { 
    voiceId = 'default',
    onTextChunk,
    onTextComplete,
    onAudioChunk,
    onComplete,
    onError
  } = options;
  
  let fullText = '';
  
  try {
    await analyzeDocumentContentStreaming(
      documentName,
      documentContent,
      apiKey,
      (chunk: string) => {
        fullText += chunk;
        onTextChunk?.(chunk);
      },
      async () => {
        onTextComplete?.(fullText);
        
        // Convert the complete analysis to audio
        try {
          await streamAudioFromMoshi(fullText, {
            voiceId,
            onAudioChunk,
            onComplete,
            onError
          });
        } catch (audioError) {
          console.error('Error converting analysis to audio:', audioError);
          onError?.(audioError instanceof Error ? audioError : new Error('Audio conversion error'));
        }
      },
      onError
    );
  } catch (error) {
    console.error('Error in analyzeDocumentWithVoice:', error);
    onError?.(error instanceof Error ? error : new Error('Unknown error'));
  }
};

// Check if TTS service is available
export const checkTTSServiceHealth = async (): Promise<boolean> => {
  try {
    const response = await fetch(`${MOSHI_TTS_BASE_URL}/health`);
    return response.ok;
  } catch (error) {
    console.error('TTS service health check failed:', error);
    return false;
  }
};

// Legacy function for backward compatibility
export const kyutaiTTS = generateAudioFromText;

