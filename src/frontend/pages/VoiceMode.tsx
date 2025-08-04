import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Pause } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { generateResponseWithOpenRouter, OpenRouterMessage } from "@/frontend/services/openRouterService";
import { 
  answerQuestionWithVoice, 
  generateAudioFromText, 
  checkTTSServiceHealth 
} from "@/services/kyutaiTTSService";

const VoiceMode = () => {
  const navigate = useNavigate();
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversationHistory, setConversationHistory] = useState<OpenRouterMessage[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [useBrowserTTS, setUseBrowserTTS] = useState(false); // User can toggle this
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isInterruptedRef = useRef(false);
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
          
          // If we detect speech while AI is speaking, interrupt it
          if (isSpeaking && (finalTranscript || interimTranscript)) {
            interruptSpeech();
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
  
  // Function to interrupt current speech
  const interruptSpeech = () => {
    console.log('Interrupting current speech...');
    isInterruptedRef.current = true;
    if (currentAudioRef.current) {
      currentAudioRef.current.pause();
      currentAudioRef.current = null;
    }
    setIsSpeaking(false);
    // Clear browser TTS if it's speaking
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  // Text-to-Speech function using local TTS server with streaming for long responses
  const speakText = async (text: string) => {
    try {
      console.log('Generating speech with local TTS server for:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
      isInterruptedRef.current = false;
      
      // Split long text into sentences for streaming playback
      const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
      
      if (sentences.length <= 1) {
        // For short text, use single request
        await playAudioFromServer(text);
      } else {
        // For long text, stream sentence by sentence
        for (let i = 0; i < sentences.length; i++) {
          if (isInterruptedRef.current) break; // Check for interruption
          const sentence = sentences[i].trim();
          if (sentence) {
            await playAudioFromServer(sentence);
            // Small delay between sentences for natural flow
            if (!isInterruptedRef.current) {
              await new Promise(resolve => setTimeout(resolve, 200));
            }
          }
        }
      }
      
      setIsSpeaking(false);
      
      // Auto-restart listening after all audio completes
      if (!isInterruptedRef.current) {
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      }
      
    } catch (error) {
      console.error("Local TTS Server Error: ", error);
      setIsSpeaking(false);
      
      // Only fallback to browser TTS if explicitly enabled
      if (useBrowserTTS) {
        console.log('User has enabled browser TTS fallback');
        fallbackToBrowserTTS(text);
      } else {
        console.log('Browser TTS fallback is disabled. No audio will be played.');
        toast({
          title: "TTS Server Error",
          description: "Unable to connect to TTS server. Audio disabled.",
          variant: "destructive"
        });
        
        // Still restart listening even if TTS fails
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      }
    }
  };
  
  // Helper function to play audio from server
  const playAudioFromServer = async (text: string): Promise<void> => {
    return new Promise(async (resolve, reject) => {
      try {
        // Check if interrupted before making request
        if (isInterruptedRef.current) {
          resolve();
          return;
        }
        
        console.log('Making TTS request to server for text:', text.substring(0, 50) + '...');
        
        const response = await fetch('http://localhost:5000/synthesize', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: text,
            voice_id: 'default'
          })
        });
        
        if (!response.ok) {
          throw new Error(`TTS server responded with status: ${response.status}`);
        }
        
        // Get audio blob from response
        const audioBlob = await response.blob();
        console.log('Received audio blob:', {
          size: audioBlob.size,
          type: audioBlob.type
        });
        
        // Validate that we received audio data
        if (audioBlob.size === 0) {
          throw new Error('Received empty audio blob from server');
        }
        
        // Check if interrupted before playing
        if (isInterruptedRef.current) {
          resolve();
          return;
        }
        
        // Create audio object and play
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        // Store reference immediately for interruption
        currentAudioRef.current = audio;

        audio.oncanplaythrough = () => {
          console.log('Audio is ready to play.');
        };

        audio.onended = () => {
          console.log('Audio has ended.');
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          resolve();
        };

        audio.onerror = (error) => {
          console.error('Audio playback error:', error.message);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error('Failed to play audio.'));
        };

        try {
          await audio.play();
          console.log('Audio playback started successfully.');
        } catch (playbackError) {
          console.error('Error during audio playback:', playbackError);
          URL.revokeObjectURL(audioUrl);
          currentAudioRef.current = null;
          reject(new Error('Playback failed: ' + playbackError.message));
        }
        
      } catch (error) {
        console.error('Error in playAudioFromServer:', error);
        reject(error);
      }
    });
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
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      };
      
      utterance.onerror = (error) => {
        console.error('Browser TTS error:', error);
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
      
      // Build messages with conversation history
      const systemMessage: OpenRouterMessage = {
        role: 'system',
        content: `You are a knowledgeable Ugandan legal AI assistant having a natural conversation. Provide helpful, accurate legal guidance based on Ugandan law. Keep responses conversational and concise for voice interaction. Always cite relevant statutes when applicable. If the user interrupts or changes topic, acknowledge it naturally and respond to their new query while maintaining context of the previous discussion when relevant.`
      };
      
      // Include conversation history for context
      const messages: OpenRouterMessage[] = [
        systemMessage,
        ...conversationHistory,
        {
          role: 'user',
          content: text
        }
      ];
      
      // Get response from OpenRouter
      const aiResponse = await generateResponseWithOpenRouter(messages, apiKey);
      
      // Update conversation history
      setConversationHistory(prev => [
        ...prev,
        { role: 'user', content: text },
        { role: 'assistant', content: aiResponse }
      ]);
      
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
          {/* Pause button */}
          <Button
            size="lg"
            variant="ghost"
            className="text-white hover:bg-white/10 rounded-full h-12 w-12 p-0"
            onClick={stopListening}
            disabled={!isListening}
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