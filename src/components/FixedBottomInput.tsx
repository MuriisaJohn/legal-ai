import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send } from 'lucide-react';

type FixedBottomInputProps = {
  onSendMessage?: (message: string) => void;
  placeholder?: string;
  disabled?: boolean;
};

const FixedBottomInput: React.FC<FixedBottomInputProps> = ({
  onSendMessage,
  placeholder = "Ask a question about Ugandan law...",
  disabled = false
}) => {
  const [inputValue, setInputValue] = useState('');

  const handleSendMessage = () => {
    if (inputValue.trim() === '' || disabled) return;
    
    if (onSendMessage) {
      onSendMessage(inputValue.trim());
    }
    
    setInputValue('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
      <div className="container mx-auto px-4 py-3">
        <div className="flex gap-3 items-center max-w-4xl mx-auto">
          <div className="flex-1 relative">
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              className="rounded-2xl border-gray-300 focus:border-legal-primary focus:ring-legal-primary pr-12 py-2.5 shadow-sm text-base h-12"
              disabled={disabled}
            />
            <Button
              onClick={handleSendMessage}
              disabled={inputValue.trim() === '' || disabled}
              size="sm"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl bg-legal-primary hover:bg-legal-primary/90 h-8 w-8 p-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FixedBottomInput;