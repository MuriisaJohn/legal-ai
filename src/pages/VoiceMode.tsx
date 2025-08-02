import React, { useState, useEffect, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Mic, MicOff, X, Volume2, Sparkles, Brain, Settings } from 'lucide-react';

const VoiceMode = () => {
  const [isListening, setIsListening] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [conversationCount, setConversationCount] = useState(0);
  const recognitionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalySerNode | null>(null);
  const animationRef = useRef<number>();

  // Enhanced audio visualization
  const startAudioAnalysis = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioContextRef.current = new AudioContext();
      analyzerRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyzerRef.current);
      
      analyzerRef.current.fftSize = 512;
      const bufferLength = analyzerRef.current.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      const updateAudioLevel = () => {
        if (analyzerRef.current && isListening) {
          analyzerRef.current.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / bufferLength;
          setAudioLevel(Math.min(average / 128, 1));
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
        };
        
        recognitionRef.current.start();
      }
    } catch (error) {
      console.log('Voice recognition not available');
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
    stopListening();
    
    setTimeout(() => {
      setResponse(`I understand your query about "${text}". As your legal AI assistant, I'm analyzing the relevant case law and regulations to provide you with accurate guidance.`);
      setIsProcessing(false);
      setConversationCount(prev => prev + 1);
      
      setTimeout(() => {
        if (!isListening && !isProcessing) {
          startListening();
        }
      }, 3000);
    }, 2000);
  };

  useEffect(() => {
    startListening();
    return () => stopListening();
  }, []);

  // Dynamic visual effects
  const circleScale = 1 + (audioLevel * 0.3);
  const glowIntensity = audioLevel * 60;
  const waveOffset = Date.now() / 1000;

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900">
      {/* Animated background elements */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-radial from-purple-500/10 to-transparent rounded-full animate-spin" style={{ animationDuration: '20s' }}></div>
      </div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-white/40 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${3 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full transition-all duration-300 ${isListening ? 'bg-emerald-400 shadow-lg shadow-emerald-400/50' : 'bg-slate-400'}`}></div>
            <span className="text-white/90 font-medium">Legal AI Assistant</span>
          </div>
          {conversationCount > 0 && (
            <div className="flex items-center gap-1 px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full">
              <Sparkles className="h-3 w-3 text-yellow-400" />
              <span className="text-xs text-white/80">{conversationCount} exchanges</span>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
          >
            <Settings className="h-4 w-4" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            className="text-white/70 hover:text-white hover:bg-white/10 rounded-full h-10 w-10 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Voice Visualization */}
      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-6">
        {/* Voice visualization container */}
        <div className="relative mb-12">
          {/* Outer rings */}
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className={`absolute inset-0 rounded-full border transition-all duration-500 ${
                isListening 
                  ? 'border-white/20 animate-pulse' 
                  : 'border-white/5'
              }`}
              style={{
                width: `${280 + i * 40}px`,
                height: `${280 + i * 40}px`,
                left: `${-20 - i * 20}px`,
                top: `${-20 - i * 20}px`,
                animationDelay: `${i * 0.2}s`
              }}
            ></div>
          ))}

          {/* Main voice circle */}
          <div 
            className={`relative w-64 h-64 rounded-full transition-all duration-300 backdrop-blur-xl border ${
              isListening 
                ? 'border-white/30 bg-gradient-to-br from-white/10 to-white/5' 
                : 'border-white/20 bg-white/5'
            }`}
            style={{
              transform: `scale(${circleScale})`,
              boxShadow: isListening 
                ? `0 0 ${40 + glowIntensity}px rgba(255, 255, 255, 0.2), 
                   0 0 ${80 + glowIntensity * 2}px rgba(147, 51, 234, 0.3),
                   inset 0 0 ${20 + glowIntensity}px rgba(255, 255, 255, 0.1)`
                : '0 0 30px rgba(255, 255, 255, 0.1)'
            }}
          >
            {/* Dynamic wave patterns */}
            {isListening && (
              <div className="absolute inset-0 rounded-full overflow-hidden">
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute inset-0 rounded-full border-2 border-white/10"
                    style={{
                      transform: `scale(${0.3 + (audioLevel * 0.7) + (i * 0.2)})`,
                      animationDelay: `${i * 0.3}s`
                    }}
                  ></div>
                ))}
              </div>
            )}
            
            {/* Center content */}
            <div className="absolute inset-0 flex items-center justify-center">
              {isProcessing ? (
                <div className="relative">
                  <Brain className="h-12 w-12 text-white animate-pulse" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="w-16 h-16 border-2 border-purple-400 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                </div>
              ) : (
                <div className="relative">
                  <Volume2 
                    className={`h-12 w-12 text-white transition-all duration-300 ${
                      isListening ? 'scale-110 drop-shadow-lg' : 'scale-100'
                    }`} 
                  />
                  {isListening && (
                    <div className="absolute -inset-2 bg-white/20 rounded-full animate-ping"></div>
                  )}
                </div>
              )}
            </div>

            {/* Audio level indicator bars */}
            {isListening && (
              <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex items-end gap-1">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-white/60 rounded-full transition-all duration-100"
                    style={{
                      height: `${8 + (audioLevel * 20) + (Math.sin(waveOffset + i) * 4)}px`
                    }}
                  ></div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Enhanced status display */}
        <div className="text-center mb-12 max-w-2xl">
          {isProcessing ? (
            <div className="space-y-3">
              <div className="flex items-center justify-center gap-2 mb-2">
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
              </div>
              <p className="text-white/90 text-xl font-medium">Analyzing your legal query...</p>
              <p className="text-white/60 text-sm">Searching through case law and regulations</p>
            </div>
          ) : transcript ? (
            <div className="space-y-4">
              <div className="p-4 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
                <p className="text-white text-lg font-medium leading-relaxed">{transcript}</p>
              </div>
              {response && (
                <div className="p-4 bg-gradient-to-r from-purple-500/20 to-blue-500/20 backdrop-blur-sm rounded-2xl border border-purple-300/30 transform transition-all duration-500 hover:scale-105">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                      <Sparkles className="h-3 w-3 text-white" />
                    </div>
                    <p className="text-white/90 text-base leading-relaxed">{response}</p>
                  </div>
                </div>
              )}
            </div>
          ) : isListening ? (
            <div className="space-y-3">
              <p className="text-white text-2xl font-light">I'm listening...</p>
              <p className="text-white/60 text-base">Ask me anything about legal matters</p>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-white/80 text-xl font-light">Ready to assist</p>
              <p className="text-white/50 text-base">Tap the microphone to start your legal consultation</p>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced bottom controls */}
      <div className="relative z-10 p-6 pb-12">
        <div className="flex items-center justify-center">
          <div className="flex items-center gap-8 p-4 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20 shadow-2xl">
            {/* Quick actions */}
            <Button
              size="lg"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0 transition-all duration-300 hover:scale-110"
              disabled={isProcessing}
            >
              <div className="w-5 h-5 bg-gradient-to-r from-purple-400 to-blue-400 rounded opacity-70"></div>
            </Button>

            {/* Main microphone button */}
            <div className="relative">
              <Button
                onClick={isListening ? stopListening : startListening}
                size="lg"
                disabled={isProcessing}
                className={`relative rounded-full h-20 w-20 p-0 transition-all duration-500 transform hover:scale-110 ${
                  isListening
                    ? 'bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-2xl shadow-red-500/40'
                    : 'bg-gradient-to-r from-white to-gray-100 hover:from-white hover:to-white shadow-2xl shadow-white/20'
                } ${isProcessing ? 'animate-pulse' : ''}`}
                style={{
                  boxShadow: isListening 
                    ? `0 0 ${30 + glowIntensity}px rgba(239, 68, 68, 0.4), 0 10px 30px rgba(0, 0, 0, 0.3)`
                    : '0 0 20px rgba(255, 255, 255, 0.2), 0 10px 30px rgba(0, 0, 0, 0.3)'
                }}
              >
                {isProcessing ? (
                  <Brain className="h-8 w-8 text-white animate-pulse" />
                ) : isListening ? (
                  <MicOff className="h-8 w-8 text-white" />
                ) : (
                  <Mic className="h-8 w-8 text-slate-800" />
                )}
              </Button>
              
              {/* Pulse animation for listening state */}
              {isListening && (
                <>
                  <div className="absolute inset-0 rounded-full bg-red-400/30 animate-ping"></div>
                  <div className="absolute inset-0 rounded-full bg-red-400/20 animate-ping delay-75"></div>
                </>
              )}
            </div>

            {/* Settings button */}
            <Button
              size="lg"
              variant="ghost"
              className="text-white/70 hover:text-white hover:bg-white/10 rounded-2xl h-12 w-12 p-0 transition-all duration-300 hover:scale-110"
              disabled={isProcessing}
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>

        {/* Status indicator */}
        <div className="flex items-center justify-center mt-6">
          <div className="flex items-center gap-2 px-4 py-2 bg-black/20 backdrop-blur-sm rounded-full">
            <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
              isProcessing ? 'bg-yellow-400 animate-pulse' :
              isListening ? 'bg-emerald-400 animate-pulse' : 'bg-slate-400'
            }`}></div>
            <span className="text-white/70 text-sm font-medium">
              {isProcessing ? 'Processing' : isListening ? 'Listening' : 'Ready'}
            </span>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); opacity: 0.7; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 1; }
        }
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default VoiceMode;