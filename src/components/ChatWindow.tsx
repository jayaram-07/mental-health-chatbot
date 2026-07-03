import { useEffect, useRef } from 'react';
import { MessageBubble } from "./MessageBubble";
import type { Message } from "./MessageBubble";
import { CrisisSupportCard } from './CrisisSupportCard';
import { MoodOrb } from './MoodOrb';
import type { Emotion } from '../lib/emotion';

interface ChatWindowProps {
  messages: Message[];
  isThinking: boolean;
  currentEmotion: Emotion;
  isCrisisMode: boolean;
}

export function ChatWindow({ messages, isThinking, currentEmotion, isCrisisMode }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, isCrisisMode]);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-4">
          <MoodOrb emotion="neutral" isThinking={false} isCrisis={false} className="w-24 h-24 opacity-50" />
          <p className="text-sm">Say hello to start chatting.</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isCrisisMode && (
        <CrisisSupportCard />
      )}

      {isThinking && !isCrisisMode && (
        <div className="flex justify-start mb-4">
          <div className="flex items-end gap-2">
            <div className="shrink-0 mb-1">
              <MoodOrb 
                emotion={currentEmotion} 
                isThinking={true} 
                isCrisis={false}
                className="w-8 h-8" 
              />
            </div>
            <div className="bg-white text-slate-400 px-4 py-3 rounded-2xl rounded-bl-sm shadow-sm border border-slate-100 text-sm flex gap-1 items-center h-[44px]">
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
