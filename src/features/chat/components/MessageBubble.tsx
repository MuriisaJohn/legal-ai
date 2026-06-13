import { Bot, User, AlertCircle, Scale } from 'lucide-react';
import { formatMessageContent } from '@/shared/lib/messageFormatter';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'ai';
  timestamp: Date;
  isError?: boolean;
}

interface MessageBubbleProps {
  message: Message;
  index: number;
}

export const MessageBubble = ({ message, index }: MessageBubbleProps) => {
  const isUser = message.sender === 'user';
  const isError = message.isError;

  return (
    <div
      className={`flex items-start gap-3 max-w-full animate-fade-in-up ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
      style={{ animationDelay: `${index * 0.05}s` }}
    >
      {!isUser && (
        <div className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center shadow-sm ${
          isError ? 'bg-red-50 text-red-500' : 'bg-[#0a1628] text-white'
        }`}>
          {isError ? (
            <AlertCircle className="h-4 w-4" />
          ) : (
            <Scale className="h-4 w-4" />
          )}
        </div>
      )}

      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[80%] sm:max-w-[70%]`}>
        <div className={`text-[11px] font-medium mb-1.5 px-1 tracking-wide uppercase ${
          isUser ? 'text-gray-400' : isError ? 'text-red-400' : 'text-gray-400'
        }`}>
          {isUser ? 'You' : 'AI Assistant'}
        </div>

        <div className={`${
          isUser
            ? 'bg-[#0a1628] text-white rounded-2xl rounded-tr-md'
            : isError
              ? 'bg-red-50 text-red-800 rounded-2xl rounded-tl-md'
              : 'bg-white text-[#1a1a2e] rounded-2xl rounded-tl-md shadow-[0_2px_8px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.02)]'
        } px-5 py-3.5 leading-relaxed`}>
          <div className="text-[15px]">
            {formatMessageContent(message.content)}
          </div>
        </div>

        <div className={`text-[11px] mt-1.5 px-1 text-gray-400 font-medium ${isUser ? 'text-right' : 'text-left'}`}>
          {(() => {
            try {
              const timestamp = message.timestamp instanceof Date
                ? message.timestamp
                : new Date(message.timestamp);
              if (isNaN(timestamp.getTime())) return '';
              return timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } catch {
              return '';
            }
          })()}
        </div>
      </div>

      {isUser && (
        <div className="flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center bg-[#f0ede8] text-[#0a1628] shadow-sm">
          <User className="h-4 w-4" />
        </div>
      )}
    </div>
  );
};
