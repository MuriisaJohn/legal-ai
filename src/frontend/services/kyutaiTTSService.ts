import { MoshiTTSClient } from '@/services/tts';

const client = new MoshiTTSClient();

export interface TTSOptions {
  voiceId?: string;
  onAudioChunk?: (audioChunk: Uint8Array) => void;
  onComplete?: () => void;
  onError?: (error: Error) => void;
}

export const streamAudioFromMoshi = async (
  text: string,
  options: TTSOptions = {}
): Promise<void> => {
  const { voiceId = 'default', onAudioChunk, onComplete, onError } = options;
  await client.streamSynthesize(
    text,
    voiceId,
    (chunk) => onAudioChunk?.(chunk),
    () => onComplete?.(),
    (err) => onError?.(new Error(err.message))
  );
};
