import { useState, useRef, useEffect } from 'react';
import type { KeyboardEvent } from 'react';
import { Send, Square, Mic, MicOff } from 'lucide-react';
import { useSpeechRecognition } from '../hooks/useVoice';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  isStreaming?: boolean;
  onStop?: () => void;
}

export function ChatInput({ onSend, disabled, isStreaming, onStop }: ChatInputProps) {
  const [text, setText] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { supported: micSupported, listening, interim, start: startMic, stop: stopMic } = useSpeechRecognition({
    onFinal: (finalText) => {
      setText((prev) => {
        const newText = prev ? `${prev} ${finalText}` : finalText;
        return newText;
      });
    }
  });

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 150)}px`;
    }
  };

  useEffect(() => {
    adjustHeight();
  }, [text, interim]);

  const handleSubmit = () => {
    if (text.trim() && !disabled && !isStreaming) {
      onSend(text.trim());
      setText('');
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
      }
    }
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const toggleMic = () => {
    if (listening) {
      stopMic();
    } else {
      startMic();
    }
  };

  const displayValue = listening && interim ? (text ? `${text} ${interim}` : interim) : text;

  return (
    <div className="p-4 bg-white/60 backdrop-blur-md border-t border-white/40">
      <div className="max-w-[44rem] mx-auto relative flex items-end gap-3 bg-white/80 border border-slate-200/60 rounded-3xl p-2 shadow-sm focus-within:ring-4 focus-within:ring-indigo-500/10 focus-within:border-indigo-300/50 transition-all duration-300">
        <textarea
          ref={textareaRef}
          value={displayValue}
          onChange={(e) => {
            if (!listening) {
              setText(e.target.value);
            }
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled || listening}
          placeholder={listening ? "Listening..." : "Type a message..."}
          className="flex-1 max-h-[150px] min-h-[44px] bg-transparent resize-none px-4 py-3 text-[15px] focus:outline-none disabled:opacity-50 placeholder:text-slate-400 leading-relaxed"
          rows={1}
        />
        
        {micSupported && !isStreaming && (
          <button
            type="button"
            onClick={toggleMic}
            disabled={disabled}
            className={`mb-1 bg-transparent p-3 rounded-full transition-all duration-300 flex items-center justify-center shrink-0 active:scale-95 ${
              listening 
                ? 'text-rose-500 bg-rose-50 animate-pulse shadow-inner' 
                : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 disabled:opacity-50 disabled:hover:bg-transparent'
            }`}
            title={listening ? "Stop listening" : "Start listening"}
          >
            {listening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>
        )}

        {isStreaming ? (
          <button
            type="button"
            onClick={onStop}
            className="mb-1 mr-1 bg-slate-800 text-white p-3 rounded-full hover:bg-slate-700 transition-all duration-300 shadow-md shadow-slate-800/20 flex items-center justify-center shrink-0 active:scale-95"
            title="Stop generating"
          >
            <Square size={18} fill="currentColor" />
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!text.trim() || disabled}
            className="mb-1 mr-1 bg-gradient-to-r from-indigo-500 to-violet-500 text-white p-3 rounded-full hover:from-indigo-600 hover:to-violet-600 disabled:opacity-50 disabled:from-slate-400 disabled:to-slate-400 transition-all duration-300 shadow-md shadow-indigo-500/20 hover:shadow-lg hover:shadow-indigo-500/30 flex items-center justify-center shrink-0 active:scale-90"
          >
            <Send size={18} className="ml-0.5" />
          </button>
        )}
      </div>
    </div>
  );
}
