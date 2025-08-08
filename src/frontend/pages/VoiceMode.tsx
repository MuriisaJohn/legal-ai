import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Pause, Bot, User, AlertCircle } from 'lucide-react';
import { toast } from "@/components/ui/use-toast";
import { generateStreamingResponseWithOpenRouter, OpenRouterMessage } from "@/frontend/services/openRouterService";
import { streamAudioFromMoshi, streamTextToSpeech } from "@/services/kyutaiTTSService";
import { formatMessageContent } from '@/pages/Chat';
import AudioVisualizer from '@/components/AudioVisualizer';
import { useMessageStore } from '@/stores/messageStore';
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSettingsStore } from '@/stores/settingsStore';
const VoiceMode = () => {
  const navigate = useNavigate();
  
  // Use shared message store
  const {
    messages,
    conversationHistory,
    addMessage,
    addConversationExchange,
    getConversationContext,
    setProcessing: setGlobalProcessing
  } = useMessageStore();
  
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [animatedWords, setAnimatedWords] = useState<string[]>([]);
  const [audioLevel, setAudioLevel] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [isAudioPaused, setIsAudioPaused] = useState(false);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isInterruptedRef = useRef(false);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const animationRef = useRef<number>();
  const { jurisdiction } = useSettingsStore();

  // Voice visualization effect
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true
      });
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
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      audioContextRef.current.close();
      audioContextRef.current = null;
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
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setIsSpeaking(false);
    // Clear browser TTS if it's speaking
    if ('speechSynthesis' in window) {
      speechSynthesis.cancel();
    }
  };

  // Stream audio using Kyutai TTS with WebAudio API
  const streamAudio = async (text: string) => {
    try {
      console.log('Streaming audio for:', text.substring(0, 50) + '...');
      setIsSpeaking(true);
      isInterruptedRef.current = false;
      let audioChunks: Uint8Array[] = [];
      const audioContext = new AudioContext();
      await streamAudioFromMoshi(text, {
        voiceId: 'default',
        onAudioChunk: chunk => {
          if (!isInterruptedRef.current) {
            audioChunks.push(chunk);
          }
        },
        onComplete: async () => {
          if (!isInterruptedRef.current && audioChunks.length > 0) {
            // Combine all chunks into a single blob
            const audioBlob = new Blob(audioChunks, {
              type: 'audio/wav'
            });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            setCurrentAudio(audio);
            currentAudioRef.current = audio;
            audio.onended = () => {
              console.log('Audio playback completed');
              setIsSpeaking(false);
              setCurrentAudio(null);
              currentAudioRef.current = null;
              URL.revokeObjectURL(audioUrl);

              // Auto-restart listening
              setTimeout(() => {
                if (!isListening && !isProcessing) {
                  startListening();
                }
              }, 1000);
            };
            audio.onerror = () => {
              console.error('Audio playback error');
              setIsSpeaking(false);
              URL.revokeObjectURL(audioUrl);
              fallbackToBrowserTTS(text);
            };
            try {
              await audio.play();
            } catch (playError) {
              console.error('Play error:', playError);
              fallbackToBrowserTTS(text);
            }
          }
        },
        onError: error => {
          console.error('Streaming error:', error);
          setIsSpeaking(false);
          fallbackToBrowserTTS(text);
        }
      });
    } catch (error) {
      console.error('TTS Error:', error);
      setIsSpeaking(false);
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
    // Skip if speaking is already false (user hasn't interacted)
    if (!isSpeaking) {
      console.log('Skipping TTS - no user interaction yet');
      // Just restart listening
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          startListening();
        }
      }, 1000);
      return;
    }
    if ('speechSynthesis' in window) {
      console.log('Falling back to browser TTS');
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1;
      utterance.volume = 0.8;
      utterance.onend = () => {
        setIsAudioPaused(false);
        setIsSpeaking(false);
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      };
      utterance.onerror = error => {
        console.error('Browser TTS error:', error);
        setIsAudioPaused(false);
        setIsSpeaking(false);

        // Don't show error toast for permission issues
        if (error.error !== 'not-allowed') {
          toast({
            title: "Speech Synthesis Error",
            description: "Audio playback requires user interaction. Please click the microphone button.",
            variant: "destructive"
          });
        }

        // Still restart listening even if TTS fails
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 2000);
      };
      try {
        speechSynthesis.speak(utterance);
      } catch (e) {
        console.error('Speech synthesis failed:', e);
        setIsSpeaking(false);
        // Restart listening
        setTimeout(() => {
          if (!isListening && !isProcessing) {
            startListening();
          }
        }, 1000);
      }
    } else {
      setIsSpeaking(false);
      // Don't show error, just restart listening
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          startListening();
        }
      }, 2000);
    }
  };

  // Animate response text word by word like Spotify lyrics
  const animateResponseText = (text: string) => {
    const words = text.split(' ');
    setAnimatedWords([]);
    words.forEach((word, index) => {
      setTimeout(() => {
        setAnimatedWords(prev => [...prev, word]);
      }, index * 200); // 200ms delay between words
    });
  };
  const processVoiceInput = async (text: string) => {
    setIsProcessing(true);
    setGlobalProcessing(true);
    stopListening(); // Stop listening while processing

    // Add user message to shared store immediately
    addMessage({
      content: text,
      sender: 'user',
      source: 'voice'
    });

    // Clear previous response
    setResponse('');
    setAnimatedWords([]);
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

      // Build messages with conversation history from shared store
      const systemMessage: OpenRouterMessage = {
        role: 'system',
        content: `You are a knowledgeable Ugandan legal AI assistant having a natural conversation. Provide helpful, 
        accurate legal guidance based on Ugandan law. Keep responses conversational and concise for voice interaction. Always cite relevant statutes when applicable. If the user interrupts or changes topic, acknowledge it naturally
         and respond to their new query while maintaining context of the previous discussion when relevant.responses should be very short and concise, ideally under 30 words.`
      };

      // Get conversation history from the shared store
      const sharedHistory: OpenRouterMessage[] = conversationHistory.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant' as const,
        content: msg.content
      }));

      // Include shared conversation history for context
      const messages: OpenRouterMessage[] = [systemMessage, ...sharedHistory, {
        role: 'user',
        content: `Jurisdiction: ${jurisdiction.name}. ${text}`
      }];
      let fullResponse = '';
      let hasStartedAudio = false;
      // Prevent duplicate completion handling (e.g., from both finish_reason and stream end)
      let hasCompleted = false;

      // Get response from OpenRouter
      await generateStreamingResponseWithOpenRouter(messages, apiKey, chunk => {
        fullResponse += chunk;
        setResponse(fullResponse);
        animateResponseText(fullResponse);
      }, () => {
        if (hasCompleted) return;
        hasCompleted = true;
        setIsProcessing(false);
        setGlobalProcessing(false);

        // Add AI response to shared store
        if (fullResponse.trim()) {
          addMessage({
            content: fullResponse,
            sender: 'ai',
            source: 'voice'
          });
        }

        // Only stream audio once when complete
        if (!hasStartedAudio && fullResponse.trim()) {
          hasStartedAudio = true;

          // Enhanced audio streaming - process sentences separately but play sequentially
          const sentences = fullResponse.match(/[^.!?]+[.!?]+/g) || [fullResponse];
          const audioQueue: Array<{
            index: number;
            chunks: Uint8Array[];
          }> = [];
          let currentPlayingIndex = 0;
          let processedCount = 0;
          setIsSpeaking(true);

          // Function to play audio chunks sequentially
          const playNextAudio = async () => {
            if (isInterruptedRef.current) return;
            const nextAudio = audioQueue.find(a => a.index === currentPlayingIndex);
            if (!nextAudio || nextAudio.chunks.length === 0) {
              // Check if all sentences have been processed
              if (processedCount === sentences.length) {
                setIsSpeaking(false);
                // Auto-restart listening
                setTimeout(() => {
                  if (!isListening && !isProcessing) {
                    startListening();
                  }
                }, 1000);
              }
              return;
            }
            const audioBlob = new Blob(nextAudio.chunks, {
              type: 'audio/wav'
            });
            const audioUrl = URL.createObjectURL(audioBlob);
            const audio = new Audio(audioUrl);
            setCurrentAudio(audio);
            currentAudioRef.current = audio;
            audio.onended = () => {
              URL.revokeObjectURL(audioUrl);
              currentPlayingIndex++;
              playNextAudio(); // Play next audio in queue
            };
            audio.onerror = () => {
              console.error('Audio playback error');
              URL.revokeObjectURL(audioUrl);
              currentPlayingIndex++;
              playNextAudio(); // Try next audio even if current fails
            };
            try {
              await audio.play();
            } catch (playError) {
              console.error('Play error:', playError);
              if (playError.name === 'NotAllowedError') {
                fallbackToBrowserTTS(fullResponse);
              } else {
                currentPlayingIndex++;
                playNextAudio();
              }
            }
          };

          // Process each sentence for TTS
          sentences.forEach((sentence, index) => {
            const audioChunks: Uint8Array[] = [];
            streamAudioFromMoshi(sentence.trim(), {
              voiceId: 'default',
              onAudioChunk: chunk => {
                if (!isInterruptedRef.current) {
                  audioChunks.push(chunk);
                }
              },
              onComplete: () => {
                if (!isInterruptedRef.current) {
                  audioQueue.push({
                    index,
                    chunks: audioChunks
                  });
                  audioQueue.sort((a, b) => a.index - b.index);
                  processedCount++;

                  // Start playing if this is the first audio ready
                  if (currentPlayingIndex === index) {
                    playNextAudio();
                  }
                }
              },
              onError: error => {
                console.error('Error streaming audio for sentence:', error);
                processedCount++;
                // Try to continue with next sentence
                if (currentPlayingIndex === index) {
                  currentPlayingIndex++;
                  playNextAudio();
                }
              }
            });
          });
        }
      }, error => {
        if (hasCompleted) return;
        hasCompleted = true;
        console.error('Error in OpenRouter streaming:', error);
        setIsProcessing(false);
        setGlobalProcessing(false);
        const errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again.";
        setResponse(errorMessage);
        
        // Add error message to shared store
        addMessage({
          content: errorMessage,
          sender: 'ai',
          source: 'voice',
          isError: true
        });
        
        if (!hasStartedAudio) {
          hasStartedAudio = true;
          streamAudio(errorMessage);
        }
        toast({
          title: "Processing Error",
          description: "Failed to get AI response. Please check your connection and API key.",
          variant: "destructive"
        });
      });
    } catch (error) {
      console.error('Error processing voice input:', error);
      setIsProcessing(false);
      setGlobalProcessing(false);
      const errorMessage = "I apologize, but I'm having trouble processing your request right now. Please try again.";
      setResponse(errorMessage);
      
      // Add error message to shared store
      addMessage({
        content: errorMessage,
        sender: 'ai',
        source: 'voice',
        isError: true
      });

      // Stream error message audio
      streamAudio(errorMessage);
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

    // Clean up on unmount
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      stopAudioAnalysis();
      if (currentAudioRef.current) {
        currentAudioRef.current.pause();
      }
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel();
      }
    };
  }, []);

  // Calculate circle scale based on audio level
  const circleScale = 1 + audioLevel * 0.5;
  const glowIntensity = audioLevel * 100;
  return (
    <div className="h-screen bg-gradient-to-b from-gray-600 via-gray-700 to-gray-700 flex flex-col overflow-hidden">
      {/* AudioVisualizer with integrated controls */}
      <AudioVisualizer 
        onStartListening={startListening}
        onStopListening={stopListening}
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        currentAudio={currentAudio}
        onClose={handleClose}
      />
    </div>
  );
};
export default VoiceMode;