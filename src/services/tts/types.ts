export interface TTSChunk {
  audioData: Uint8Array;
}

export interface TTSError {
  message: string;
  status?: number;
}

export interface ITTSService {
  synthesize(text: string, voiceId?: string): Promise<ArrayBuffer>;
  streamSynthesize(
    text: string,
    voiceId: string | undefined,
    onChunk: (chunk: Uint8Array) => void,
    onComplete: () => void,
    onError: (error: TTSError) => void
  ): Promise<void>;
}
