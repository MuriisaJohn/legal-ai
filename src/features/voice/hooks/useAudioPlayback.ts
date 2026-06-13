import { useRef, useEffect, useCallback } from 'react';

export function useAudioPlayback(
  currentAudio: HTMLAudioElement | null,
  isSpeaking: boolean,
  onFrequency: (freq: number) => void
) {
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);

  const getFrequency = useCallback((): number => {
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;
    if (!analyser || !dataArray) return 0;
    analyser.getByteFrequencyData(dataArray);
    let sum = 0;
    for (let i = 0; i < dataArray.length; i++) sum += dataArray[i];
    return sum / dataArray.length;
  }, []);

  useEffect(() => {
    if (!currentAudio || !isSpeaking) {
      analyserRef.current = null;
      dataArrayRef.current = null;
      return;
    }

    try {
      if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }

      const ctx = audioContextRef.current;
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;
      dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);

      if (!(currentAudio as any)._audioSourceConnected) {
        const source = ctx.createMediaElementSource(currentAudio);
        source.connect(analyser);
        analyser.connect(ctx.destination);
        sourceRef.current = source;
        (currentAudio as any)._audioSourceConnected = true;
      }
    } catch (err) {
      console.error('Audio playback connection error:', err);
    }

    return () => {
      sourceRef.current = null;
    };
  }, [currentAudio, isSpeaking]);

  useEffect(() => {
    if (!isSpeaking || !analyserRef.current) return;
    const interval = setInterval(() => {
      onFrequency(getFrequency());
    }, 50);
    return () => clearInterval(interval);
  }, [isSpeaking, getFrequency, onFrequency]);

  return { getFrequency };
}
