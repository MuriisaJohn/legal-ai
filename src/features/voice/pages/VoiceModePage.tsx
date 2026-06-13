import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from "@/shared/components/ui/use-toast";
import { generateStreamingResponseWithGemini } from "@/frontend/services/geminiService";
import { useMessageStore } from '@/stores/messageStore';
import { useSettingsStore } from '@/shared/stores/settingsStore';
import { useSpeechRecognition } from '@/features/voice/hooks/useSpeechRecognition';
import { useVoiceStream } from '@/features/voice/hooks/useVoiceStream';
import AudioVisualizer from '@/features/voice/components/AudioVisualizer';

const VoiceModePage = () => {
  const navigate = useNavigate();
  const { addMessage, getConversationHistory, setProcessing: setGlobalProcessing } = useMessageStore();
  const { jurisdiction } = useSettingsStore();
  const [response, setResponse] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { isSpeaking, currentAudio, streamAudio, interrupt } = useVoiceStream();
  const hasCompletedRef = useRef(false);

  const processVoiceInput = useCallback(async (text: string) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setGlobalProcessing(true);
    setResponse('');
    hasCompletedRef.current = false;

    addMessage({ content: text, sender: 'user', source: 'voice' });

    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || '';
    if (!apiKey) {
      toast({ title: "API Key Missing", description: "Please set your Gemini API key.", variant: "destructive" });
      setIsProcessing(false);
      setGlobalProcessing(false);
      return;
    }

    const systemInstruction = `You are a knowledgeable ${jurisdiction.name} legal AI assistant having a natural conversation. Provide helpful, accurate legal guidance based on ${jurisdiction.name} law. Keep responses conversational and concise for voice interaction. Always cite relevant statutes from ${jurisdiction.name} when applicable. If the user interrupts or changes topic, acknowledge it naturally and respond to their new query while maintaining context of the previous discussion when relevant. Responses should be very short and concise, ideally under 30 words.`;

    const historyContext = getConversationHistory().map(msg => `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`).join('\n');
    const userPrompt = `History:\n${historyContext}\n\nJurisdiction: ${jurisdiction.name}. User Input: ${text}`;

    let fullResponse = '';

    await generateStreamingResponseWithGemini(systemInstruction, userPrompt, apiKey,
      (chunk) => {
        fullResponse += chunk;
        setResponse(fullResponse);
      },
      () => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        setIsProcessing(false);
        setGlobalProcessing(false);

        if (fullResponse.trim()) {
          addMessage({ content: fullResponse, sender: 'ai', source: 'voice' });
          streamAudio(fullResponse);
        }
      },
      (error) => {
        if (hasCompletedRef.current) return;
        hasCompletedRef.current = true;
        console.error('Gemini streaming error:', error);
        setIsProcessing(false);
        setGlobalProcessing(false);
        const errMsg = "I apologize, but I'm having trouble processing your request right now. Please try again.";
        setResponse(errMsg);
        addMessage({ content: errMsg, sender: 'ai', source: 'voice', isError: true });
        streamAudio(errMsg);
      }
    );
  }, [addMessage, getConversationHistory, jurisdiction, streamAudio, setGlobalProcessing, isProcessing]);

  const { isListening, error, startListening, stopListening, clearError } = useSpeechRecognition(processVoiceInput);

  useEffect(() => {
    return () => { stopListening(); interrupt(); };
  }, []);

  const handleClose = () => {
    stopListening();
    interrupt();
    navigate('/chat');
  };

  return (
    <div className="h-screen bg-gradient-to-b from-gray-600 via-gray-700 to-gray-700 flex flex-col overflow-hidden">
      <AudioVisualizer
        onStartListening={startListening}
        onStopListening={stopListening}
        isListening={isListening}
        isProcessing={isProcessing}
        isSpeaking={isSpeaking}
        currentAudio={currentAudio}
        onClose={handleClose}
        error={error}
        onClearError={clearError}
      />
    </div>
  );
};

export default VoiceModePage;
