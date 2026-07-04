import { useEffect, useRef } from 'react';
import { MessageRow } from "./MessageBubble";
import type { Message } from "./MessageBubble";
import { CrisisSupportCard } from './CrisisSupportCard';
import { MoodOrb } from './MoodOrb';
import type { Emotion } from '../lib/emotion';

interface ChatWindowProps {
  messages: Message[];
  isThinking: boolean;
  currentEmotion: Emotion;
  isCrisisMode: boolean;
  onBreathe?: () => void;
  onStarter?: (text: string) => void;
  onRegenerate?: () => void;
  onSpeak?: (text: string) => void;
}

export function ChatWindow({ messages, isThinking, isCrisisMode, onBreathe, onStarter, onRegenerate, onSpeak }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isThinking, isCrisisMode]);

  const showStarters = messages.length <= 1 && !messages.some(m => m.sender === 'user');
  const starters = [
    "I'm feeling anxious",
    "I had a really good day",
    "I can't switch my brain off",
    "I'm just feeling low"
  ];

  const lastAssistantMsgIndex = messages.map(m => m.sender).lastIndexOf('bot');

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="max-w-[44rem] mx-auto flex flex-col">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400 space-y-8">
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-2xl" />
              <MoodOrb emotion="neutral" isThinking={false} isCrisis={false} className="w-32 h-32 opacity-90 relative z-10" />
            </div>
            <div className="text-center space-y-2">
              <p className="text-lg font-medium text-slate-700 tracking-tight">How are you feeling today?</p>
              <p className="text-sm text-slate-500">I'm here to listen and support you.</p>
            </div>
          </div>
        )}

        {messages.map((msg, index) => {
          const isLastAssistant = index === lastAssistantMsgIndex;
          const canRegenerate = isLastAssistant && !isThinking && !isCrisisMode && !msg.streaming;
          
          return (
            <MessageRow 
              key={msg.id} 
              message={msg} 
              onBreathe={onBreathe} 
              onRegenerate={onRegenerate}
              canRegenerate={canRegenerate}
              onSpeak={onSpeak}
            />
          );
        })}

        {showStarters && onStarter && (
          <div className="flex flex-wrap gap-3 mt-6 justify-center sm:justify-start">
            {starters.map((starter, i) => (
              <button
                key={i}
                onClick={() => onStarter(starter)}
                className="px-5 py-2.5 rounded-full bg-white/60 backdrop-blur-sm border border-white/80 text-sm text-slate-600 hover:bg-white/90 hover:text-indigo-700 hover:border-indigo-100 transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
              >
                {starter}
              </button>
            ))}
          </div>
        )}

        {isCrisisMode && (
          <div className="mt-6">
            <CrisisSupportCard />
          </div>
        )}
        
        <div ref={bottomRef} className="h-4" />
      </div>
    </div>
  );
}
