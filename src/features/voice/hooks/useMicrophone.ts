import { useRef, useEffect, useCallback } from 'react';

export interface MicrophoneData {
  analyserNode: AnalyserNode;
  dataArray: Uint8Array;
}

export function useMicrophone(isListening: boolean, onFrequency: (freq: number) => void) {
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const dataArrayRef = useRef<Uint8Array | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

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
    if (!isListening) {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      analyserRef.current = null;
      dataArrayRef.current = null;
      return;
    }

    navigator.mediaDevices.getUserMedia({ audio: true, video: false })
      .then((stream) => {
        mediaStreamRef.current = stream;
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = audioCtx;
        const source = audioCtx.createMediaStreamSource(stream);
        const analyser = audioCtx.createAnalyser();
        analyser.fftSize = 64;
        analyser.smoothingTimeConstant = 0.8;
        source.connect(analyser);
        analyserRef.current = analyser;
        dataArrayRef.current = new Uint8Array(analyser.frequencyBinCount);
      })
      .catch((err) => console.error('Microphone access error:', err));

    return () => {
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
        mediaStreamRef.current = null;
      }
      analyserRef.current = null;
      dataArrayRef.current = null;
    };
  }, [isListening]);

  useEffect(() => {
    if (!isListening) return;
    const interval = setInterval(() => {
      onFrequency(getFrequency());
    }, 50);
    return () => clearInterval(interval);
  }, [isListening, getFrequency, onFrequency]);

  return { getFrequency };
}
