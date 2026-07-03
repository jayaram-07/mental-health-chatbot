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
      className="flex items-center gap-2 p-4 bg-white border-t border-slate-100"
    >
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        disabled={disabled}
        placeholder="Type a message..."
        className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent disabled:opacity-50 transition-all"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="bg-slate-800 text-white p-3 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:hover:bg-slate-800 transition-colors flex items-center justify-center shrink-0"
      >
        <Send size={18} className="ml-0.5" />
      </button>
    </form>
  );
}
