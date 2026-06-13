import { useState, useRef, useCallback, useEffect } from 'react';
import { Keyboard, Mic, MicOff, X, AlertCircle } from 'lucide-react';
import VisualizerScene from './VisualizerScene';
import { useMicrophone } from '@/features/voice/hooks/useMicrophone';
import { useAudioPlayback } from '@/features/voice/hooks/useAudioPlayback';

interface AudioVisualizerProps {
  audioUrl?: string;
  onClose?: () => void;
  onStartListening?: () => void;
  onStopListening?: () => void;
  isListening?: boolean;
  isProcessing?: boolean;
  isSpeaking?: boolean;
  currentAudio?: HTMLAudioElement | null;
  error?: string | null;
  onClearError?: () => void;
}

const AudioVisualizer: React.FC<AudioVisualizerProps> = ({
  audioUrl,
  onClose,
  onStartListening,
  onStopListening,
  isListening = false,
  isProcessing = false,
  isSpeaking = false,
  currentAudio = null,
  error = null,
  onClearError,
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioLoaded, setAudioLoaded] = useState(false);
  const [isKeyboardMode, setIsKeyboardMode] = useState(false);
  const [frequency, setFrequency] = useState(0);
  const [optimisticListening, setOptimisticListening] = useState(false);
  const errorTimerRef = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    setOptimisticListening(isListening);
  }, [isListening]);

  useEffect(() => {
    if (error) {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
      errorTimerRef.current = setTimeout(() => {
        onClearError?.();
      }, 5000);
    }
    return () => {
      if (errorTimerRef.current) clearTimeout(errorTimerRef.current);
    };
  }, [error, onClearError]);

  useMicrophone((optimisticListening || isListening) && !audioUrl, setFrequency);
  useAudioPlayback(currentAudio, isSpeaking && !audioUrl, setFrequency);

  const handleMicToggle = () => {
    if (optimisticListening) {
      setOptimisticListening(false);
      onStopListening?.();
    } else {
      setOptimisticListening(true);
      onStartListening?.();
    }
  };

  const handleKeyboardToggle = () => {
    setIsKeyboardMode(!isKeyboardMode);
  };

  const handleClose = () => {
    onClose?.();
  };

  const active = optimisticListening || isListening;

  return (
    <div className="relative w-full h-screen overflow-hidden">
      <VisualizerScene frequency={frequency} />

      {audioUrl && !audioLoaded && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg">
          Loading audio...
        </div>
      )}
      {audioUrl && audioLoaded && !isPlaying && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white text-lg cursor-pointer bg-black/50 px-6 py-3 rounded-lg border border-white/20 hover:bg-black/70 transition-colors">
          Click anywhere to play audio
        </div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-6">
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={handleKeyboardToggle}
            className={`rounded-full h-12 w-12 flex items-center justify-center transition-all duration-300 ${
              isKeyboardMode
                ? 'bg-white/90 text-gray-900 shadow-lg shadow-white/20'
                : 'bg-white/20 text-white hover:bg-white/30 border border-white/20'
            }`}
            title="Toggle Keyboard Input"
          >
            <Keyboard className="w-5 h-5" />
          </button>

          <button
            onClick={handleMicToggle}
            disabled={isProcessing}
            className={`rounded-full h-16 w-16 flex items-center justify-center transition-all duration-300 active:scale-90 ${
              active
                ? 'bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 border border-red-400/50'
                : 'bg-white/90 hover:bg-white text-gray-900 shadow-lg border border-white/30 hover:scale-105'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
            title={active ? "Stop Listening" : "Start Listening"}
          >
            {active ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
          </button>

          <button
            onClick={handleClose}
            className="rounded-full h-12 w-12 flex items-center justify-center bg-white/20 text-white hover:bg-red-500/30 hover:text-red-300 transition-all duration-300 border border-white/20"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex justify-center mt-4 gap-4 text-white/80 text-sm">
          {error && (
            <span className="flex items-center gap-2 text-red-300">
              <AlertCircle className="w-4 h-4" />
              {error}
            </span>
          )}
          {!error && isProcessing && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse" />
              Processing...
            </span>
          )}
          {!error && isKeyboardMode && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-white rounded-full animate-pulse" />
              Keyboard input active
            </span>
          )}
          {!error && active && !isProcessing && !isSpeaking && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              Listening...
            </span>
          )}
          {!error && isSpeaking && (
            <span className="flex items-center gap-2">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Speaking...
            </span>
          )}
          {!error && !active && !isProcessing && !isKeyboardMode && !isSpeaking && (
            <span className="flex items-center gap-2 text-white/50">
              Tap the microphone to start
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default AudioVisualizer;
