import { useState, useRef, useCallback } from 'react';
import { streamAudioFromMoshi } from "@/frontend/services/kyutaiTTSService";

export function useVoiceStream(voiceURI?: string | null) {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const isInterruptedRef = useRef(false);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const chunkBufferRef = useRef('');
  const pendingUtterancesRef = useRef<SpeechSynthesisUtterance[]>([]);
  const utteranceCountRef = useRef(0);

  const getVoice = useCallback((): SpeechSynthesisVoice | null => {
    if (!voiceURI || !('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices();
    return voices.find(v => v.voiceURI === voiceURI) || null;
  }, [voiceURI]);

  const speakUtterance = useCallback((text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isInterruptedRef.current) return;
    const utterance = new SpeechSynthesisUtterance(text);
    const voice = getVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.9;
    utteranceCountRef.current++;
    const id = utteranceCountRef.current;
    pendingUtterancesRef.current.push(utterance);
    utterance.onend = () => {
      pendingUtterancesRef.current = pendingUtterancesRef.current.filter(u => u !== utterance);
      if (pendingUtterancesRef.current.length === 0 && id === utteranceCountRef.current) {
        setIsSpeaking(false);
      }
    };
    utterance.onerror = () => {
      pendingUtterancesRef.current = pendingUtterancesRef.current.filter(u => u !== utterance);
      if (pendingUtterancesRef.current.length === 0) {
        setIsSpeaking(false);
      }
    };
    speechSynthesis.speak(utterance);
  }, [getVoice]);

  const speakChunk = useCallback((chunk: string) => {
    if (!('speechSynthesis' in window) || isInterruptedRef.current) return;
    chunkBufferRef.current += chunk;
    setIsSpeaking(true);

    const sentenceBreaks = chunkBufferRef.current.match(/[^.!?\n]*[.!?\n]+/g) || [];
    if (sentenceBreaks.length > 0) {
      const full = chunkBufferRef.current;
      const lastMatch = sentenceBreaks[sentenceBreaks.length - 1];
      const idx = full.lastIndexOf(lastMatch);
      const complete = full.slice(0, idx + lastMatch.length);
      const rest = full.slice(idx + lastMatch.length);
      chunkBufferRef.current = rest;
      speakUtterance(complete);
    } else if (chunkBufferRef.current.length > 200) {
      speakUtterance(chunkBufferRef.current);
      chunkBufferRef.current = '';
    }
  }, [speakUtterance]);

  const flushBuffer = useCallback(() => {
    if (chunkBufferRef.current.trim() && !isInterruptedRef.current) {
      speakUtterance(chunkBufferRef.current);
      chunkBufferRef.current = '';
    }
  }, [speakUtterance]);

  const interrupt = useCallback(() => {
    isInterruptedRef.current = true;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
      pendingUtterancesRef.current = [];
    }
    chunkBufferRef.current = '';
    setIsSpeaking(false);
  }, []);

  const streamAudio = useCallback(async (text: string) => {
    setIsSpeaking(true);
    isInterruptedRef.current = false;
    const audioChunks: Uint8Array[] = [];

    try {
      await streamAudioFromMoshi(text, {
        voiceId: voiceURI || 'default',
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
            speakUtterance(text);
          };
          try { await audio.play(); } catch { speakUtterance(text); }
        },
        onError: (error) => {
          console.error('TTS error:', error);
          setIsSpeaking(false);
          speakUtterance(text);
        }
      });
    } catch {
      setIsSpeaking(false);
      speakUtterance(text);
    }
  }, [voiceURI, speakUtterance]);

  const togglePause = useCallback(() => {
    if (currentAudio) {
      if (isAudioPaused) { currentAudio.play(); setIsAudioPaused(false); }
      else { currentAudio.pause(); setIsAudioPaused(true); }
    }
  }, [currentAudio, isAudioPaused]);

  return { isSpeaking, currentAudio, isAudioPaused, streamAudio, interrupt, togglePause, speakChunk, flushBuffer };
}
