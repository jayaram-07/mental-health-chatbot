import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
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
    <div className="flex-1 overflow-y-auto p-6 space-y-6">
      {messages.length === 0 && (
        <div className="flex flex-col items-center justify-center h-full text-slate-400 space-y-6">
          <MoodOrb emotion="neutral" isThinking={false} isCrisis={false} className="w-32 h-32 opacity-80" />
          <p className="text-sm font-medium tracking-wide">Say hello to start chatting.</p>
        </div>
      )}

      {messages.map((msg) => (
        <MessageBubble key={msg.id} message={msg} />
      ))}

      {isCrisisMode && (
        <CrisisSupportCard />
      )}

      {isThinking && !isCrisisMode && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-start mb-6"
        >
          <div className="flex items-end gap-3">
            <div className="shrink-0 mb-1">
              <MoodOrb 
                emotion={currentEmotion} 
                isThinking={true} 
                isCrisis={false}
                className="w-10 h-10" 
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm text-slate-400 px-5 py-3.5 rounded-3xl rounded-bl-sm shadow-sm border border-white/60 text-sm flex gap-1.5 items-center h-[48px]">
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-2 h-2 bg-slate-300 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        </motion.div>
      )}
      
      <div ref={bottomRef} />
    </div>
  );
}
