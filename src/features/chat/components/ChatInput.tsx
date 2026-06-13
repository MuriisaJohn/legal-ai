import { useState, useRef, useEffect } from 'react';
import { Send, Mic } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => void;
  onVoiceToggle?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

export const ChatInput = ({ onSend, onVoiceToggle, disabled, placeholder }: ChatInputProps) => {
  const [value, setValue] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled && inputRef.current) {
      inputRef.current.focus();
    }
  }, [disabled]);

  const handleSend = () => {
    if (value.trim() === '' || disabled) return;
    onSend(value);
    setValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="px-4 py-4 bg-white border-t border-[#e8e4de]">
      <div className="flex gap-2.5 items-center max-w-4xl mx-auto">
        {onVoiceToggle && (
          <button
            onClick={onVoiceToggle}
            disabled={disabled}
            className="flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center text-gray-400 hover:text-[#0a1628] hover:bg-[#f0ede8] transition-all duration-200 active:scale-95 disabled:opacity-40"
          >
            <Mic className="h-5 w-5" />
          </button>
        )}

        <div className="flex-1 relative group">
          <input
            ref={inputRef}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder ?? "Type your message..."}
            disabled={disabled}
            className="w-full h-12 pl-5 pr-14 bg-[#f8f6f3] border border-[#e8e4de] rounded-2xl text-[15px] text-[#0a1628] placeholder:text-gray-400 outline-none transition-all duration-200 focus:border-[#0a1628] focus:bg-white focus:shadow-[0_0_0_3px_rgba(10,22,40,0.08)] disabled:opacity-50"
          />

          <button
            onClick={handleSend}
            disabled={value.trim() === '' || disabled}
            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-9 h-9 rounded-xl flex items-center justify-center bg-[#0a1628] text-white transition-all duration-200 hover:bg-[#1a2a4a] active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
