import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Pause } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { generateResponseWithOpenRouter, OpenRouterMessage } from "@/frontend/services/openRouterService";

const VoiceMode = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
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

  // Text-to-Speech function using ElevenLabs
  const speakText = async (text: string) => {
    try {
      // Check if we have ElevenLabs API key
      const elevenLabsKey = localStorage.getItem('elevenlabs_api_key');
      
      if (!elevenLabsKey) {
        // Fallback to browser TTS if no ElevenLabs key
        fallbackToBrowserTTS(text);
        return;
      }

      console.log('Generating speech with ElevenLabs for:', text.substring(0, 50) + '...');
      
      // Use ElevenLabs API
      const response = await fetch('https://api.elevenlabs.io/v1/text-to-speech/9BWtsMINqrJLrRacOk9x', {
        method: 'POST',
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': elevenLabsKey
        },
        body: JSON.stringify({
          text: text,
          model_id: 'eleven_turbo_v2_5',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.5
          }
        })
      });

      if (!response.ok) {
        throw new Error(`ElevenLabs API error: ${response.status}`);
      }

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      const audio = new Audio(audioUrl);
      
      // Track current audio for pause functionality
      setCurrentAudio(audio);
      setIsAudioPaused(false);

      audio.onended = () => {
        // Clear current audio reference
        setCurrentAudio(null);
        setIsAudioPaused(false);
        
        // Auto-restart listening after TTS completes
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
        
        // Clean up the blob URL
        URL.revokeObjectURL(audioUrl);
      };

      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        
        // Clear current audio reference
        setCurrentAudio(null);
        setIsAudioPaused(false);
        
        // Clean up the blob URL on error
        URL.revokeObjectURL(audioUrl);
        
        // Fallback to browser TTS
        fallbackToBrowserTTS(text);
      };

      await audio.play();
      console.log('Audio playback started successfully');
      
    } catch (error) {
      console.error("TTS Error: ", error);
      
      // Fallback to browser TTS if ElevenLabs fails
      fallbackToBrowserTTS(text);
    }
  };
  
  // Audio pause/resume functionality
  const handleAudioPause = () => {
    if (currentAudio) {
      if (isAudioPaused) {
        currentAudio.play();
        setIsAudioPaused(false);
      } else {
        currentAudio.pause();
        setIsAudioPaused(true);
      }
    } else if ('speechSynthesis' in window) {
      // Handle browser TTS pause/resume
      if (speechSynthesis.speaking) {
        if (speechSynthesis.paused) {
          speechSynthesis.resume();
          setIsAudioPaused(false);
        } else {
          speechSynthesis.pause();
          setIsAudioPaused(true);
        }
      }
    }
  };

  // Fallback function to use browser TTS
  const fallbackToBrowserTTS = (text: string) => {
    if ('speechSynthesis' in window) {
      console.log('Falling back to browser TTS');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setIsAudioPaused(false);
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      };
      
      utterance.onerror = (error) => {
        console.error('Browser TTS error:', error);
        setIsAudioPaused(false);
        toast({
          title: "Speech Synthesis Error",
          description: "Failed to play speech using browser TTS.",
          variant: "destructive"
        });
        
        // Still restart listening even if TTS fails
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 2000);
      };
      
      speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "TTS Error",
        description: "Text-to-speech is not supported in this browser.",
        variant: "destructive"
      });
      
      // Still restart listening even if TTS fails
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          startListening();
        }
      }, 2000);
    }
  };

  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    stopListening(); // Stop listening while processing
    
    try {
      // Get API key
      const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY || localStorage.getItem('openrouter_api_key');
      
      if (!apiKey) {
        toast({
          title: "API Key Missing",
          description: "Please set your OpenRouter API key in settings.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }
      
      // Prepare messages for OpenRouter
      const messages: OpenRouterMessage[] = [
        {
          role: 'system',
          content: `You are a knowledgeable Ugandan legal AI assistant. Provide helpful, accurate legal guidance based on Ugandan law. Keep responses conversational and concise for voice interaction. Always cite relevant statutes when applicable.`
        },
        {
          role: 'user',
          content: text
        }
      ];
      
      // Get response from OpenRouter
      const aiResponse = await generateResponseWithOpenRouter(messages, apiKey);
      
      setResponse(aiResponse);
      setIsProcessing(false);
      
      // Speak the response using TTS
      speakText(aiResponse);
      
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      
      const errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again.";
      setResponse(errorMessage);
      
      // Speak error message
      speakText(errorMessage);
      
      toast({
        title: "Processing Error",
        description: "Failed to get AI response. Please check your connection and API key.",
        variant: "destructive"
      });
    }
  };

  const handleClose = () => {
    stopListening();
    navigate('/chat');
  };

  useEffect(() => {
    // Store ElevenLabs API key
    localStorage.setItem('elevenlabs_api_key', 'sk_d91f55420e595ec0f8a45c4588f7846ecbbcd91e340591c9');
    
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
                <div 
                  className="absolute inset-4 rounded-full border border-white/30 transition-all duration-150"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.3})`,
                    opacity: 0.3 + audioLevel * 0.4,
                    borderWidth: `${1 + audioLevel * 2}px`
                  }}
                ></div>
                <div 
                  className="absolute inset-8 rounded-full border border-white/20 transition-all duration-200"
                  style={{
                    transform: `scale(${1 + audioLevel * 0.5})`,
                    opacity: 0.2 + audioLevel * 0.3
                  }}
                ></div>
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
          {/* Pause button */}
          <Button
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
            onClick={handleAudioPause}
            disabled={!currentAudio && !speechSynthesis?.speaking}
          >
            <Pause className="h-5 w-5" />
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