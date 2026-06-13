import { useState, useRef, useCallback } from 'react';
import { streamAudioFromMoshi } from "@/frontend/services/kyutaiTTSService";

export function useVoiceStream() {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const isInterruptedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);

  const interrupt = useCallback(() => {
    isInterruptedRef.current = true;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) speechSynthesis.cancel();
    setIsSpeaking(false);
  }, []);

  const streamAudio = useCallback(async (text: string) => {
    setIsSpeaking(true);
    isInterruptedRef.current = false;
    const audioChunks: Uint8Array[] = [];

    try {
      await streamAudioFromMoshi(text, {
        voiceId: 'default',
        onAudioChunk: (chunk) => { if (!isInterruptedRef.current) audioChunks.push(chunk); },
        onComplete: async () => {
          if (isInterruptedRef.current || audioChunks.length === 0) {
            setIsSpeaking(false);
            return;
          }
          const blob = new Blob(audioChunks, { type: 'audio/wav' });
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          setCurrentAudio(audio);
          currentAudioRef.current = audio;
          audio.onended = () => {
            setIsSpeaking(false);
            setCurrentAudio(null);
            currentAudioRef.current = null;
            URL.revokeObjectURL(url);
          };
          audio.onerror = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(url);
            fallbackTTS(text);
          };
          try { await audio.play(); } catch { fallbackTTS(text); }
        },
        onError: (error) => {
          console.error('TTS error:', error);
          setIsSpeaking(false);
          fallbackTTS(text);
        }
      });
    } catch {
      setIsSpeaking(false);
      fallbackTTS(text);
    }
  }, []);

  const fallbackTTS = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    speechSynthesis.speak(utterance);
  }, []);

  const togglePause = useCallback(() => {
    if (currentAudio) {
      if (isAudioPaused) { currentAudio.play(); setIsAudioPaused(false); }
      else { currentAudio.pause(); setIsAudioPaused(true); }
    }
  }, [currentAudio, isAudioPaused]);

  return { isSpeaking, currentAudio, isAudioPaused, streamAudio, interrupt, togglePause };
}
