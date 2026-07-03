import { useState } from 'react';
import type { FormEvent } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form 
      onSubmit={handleSubmit}
      className="flex items-center gap-3 p-5 bg-white/60 backdrop-blur-md border-t border-white/40"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type a message..."
        className="flex-1 bg-white/80 border border-slate-200/60 rounded-full px-5 py-3.5 text-[15px] shadow-inner shadow-slate-100/50 focus:outline-none focus:ring-2 focus:ring-indigo-300/50 focus:border-transparent disabled:opacity-50 transition-all placeholder:text-slate-400"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="bg-slate-800 text-white p-3.5 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-all shadow-md shadow-slate-800/20 flex items-center justify-center shrink-0 active:scale-95"
      >
        <Send size={20} className="ml-0.5" />
      </button>
    </form>
  );
}
