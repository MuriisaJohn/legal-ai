import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2 } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";

const VoiceMode = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();

  // Voice visualization effect
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      
      analyzerRef.current.fftSize = 256;
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyzerRef.current && isListening) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(average / 255);
          animationRef.current = requestAnimationFrame(updateAudioLevel);
        }
      };
      
      updateAudioLevel();
    } catch (error) {
      console.error('Audio analysis error:', error);
    }
  };

  const stopAudioAnalysis = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setAudioLevel(0);
  };

  const startListening = async () => {
    try {
      if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
        recognitionRef.current = new SpeechRecognition();
        
        recognitionRef.current.continuous = true;
        recognitionRef.current.interimResults = true;
        recognitionRef.current.lang = 'en-US';
        
        recognitionRef.current.onstart = () => {
          setIsListening(true);
          setTranscript('');
          startAudioAnalysis();
        };
        
        recognitionRef.current.onresult = (event: any) => {
          let finalTranscript = '';
          let interimTranscript = '';
          
          for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          
          setTranscript(finalTranscript || interimTranscript);
          
          if (finalTranscript) {
            processVoiceInput(finalTranscript);
          }
        };
        
        recognitionRef.current.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          stopListening();
          toast({
            title: "Voice Recognition Error",
            description: "Could not process voice input. Please try again.",
            variant: "destructive"
          });
        };
        
        recognitionRef.current.start();
      } else {
        throw new Error('Speech recognition not supported');
      }
    } catch (error) {
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to use voice mode.",
        variant: "destructive"
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    stopAudioAnalysis();
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    
    // Simulate AI processing - replace with actual API call
    setTimeout(() => {
      setResponse(`I heard you say: "${text}". This is a simulated response from your legal AI assistant.`);
      setIsProcessing(false);
      
      // Auto-restart listening after response
      setTimeout(() => {
        if (!isListening) {
          startListening();
        }
      }, 2000);
    }, 1500);
  };

  const handleClose = () => {
    stopListening();
    navigate('/chat');
  };

  useEffect(() => {
    // Auto-start listening when component mounts
    startListening();
    
    return () => {
      stopListening();
    };
  }, []);

  // Calculate circle scale based on audio level
  const circleScale = 1 + (audioLevel * 0.5);
  const glowIntensity = audioLevel * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-legal-dark via-gray-900 to-legal-primary flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 text-white">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-sm font-medium">Speaking to Legal AI</span>
        </div>
        <Button
          onClick={handleClose}
          size="sm"
          variant="ghost"
          className="text-white hover:bg-white/10 rounded-full h-8 w-8 p-0"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Main Voice Visualization */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        {/* Central Voice Circle */}
        <div className="relative mb-8">
          <div 
            className={`w-48 h-48 rounded-full border-2 transition-all duration-300 ${
              isListening 
                ? 'border-white shadow-lg' 
                : 'border-white/50'
            }`}
            style={{
              transform: `scale(${circleScale})`,
              boxShadow: isListening 
                ? `0 0 ${20 + glowIntensity}px rgba(255, 255, 255, 0.3), inset 0 0 ${10 + glowIntensity}px rgba(255, 255, 255, 0.1)`
                : '0 0 20px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Inner animated circles */}
            {isListening && (
              <>
                <div className="absolute inset-4 rounded-full border border-white/30 animate-ping"></div>
                <div className="absolute inset-8 rounded-full border border-white/20 animate-pulse"></div>
              </>
            )}
            
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isProcessing ? (
                <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Volume2 className={`h-8 w-8 text-white ${isListening ? 'animate-pulse' : ''}`} />
              )}
            </div>
          </div>
        </div>

        {/* Status Text */}
        <div className="text-center mb-8">
          {isProcessing ? (
            <p className="text-white/80 text-lg">Processing your request...</p>
          ) : transcript ? (
            <div className="space-y-2">
              <p className="text-white text-xl font-medium">{transcript}</p>
              {response && (
                <p className="text-legal-accent text-base">{response}</p>
              )}
            </div>
          ) : isListening ? (
            <p className="text-white/80 text-lg">Go ahead, I'm listening</p>
          ) : (
            <p className="text-white/60 text-lg">Tap to start speaking</p>
          )}
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="p-6 pb-8">
        <div className="flex items-center justify-center gap-6">
          {/* Placeholder buttons for future features */}
          <Button
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
            disabled
          >
            <div className="w-6 h-6 bg-white/20 rounded"></div>
          </Button>

          {/* Main microphone button */}
          <Button
            onClick={isListening ? stopListening : startListening}
            size="lg"
            disabled={isProcessing}
            className={`rounded-full h-16 w-16 p-0 transition-all duration-300 ${
              isListening
                ? 'bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/30'
                : 'bg-white hover:bg-white/90 shadow-lg'
            }`}
          >
            {isListening ? (
              <MicOff className={`h-6 w-6 ${isListening ? 'text-white' : 'text-legal-primary'}`} />
            ) : (
              <Mic className="h-6 w-6 text-legal-primary" />
            )}
          </Button>

          {/* Close button */}
          <Button
            onClick={handleClose}
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VoiceMode;