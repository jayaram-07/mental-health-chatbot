import { motion } from 'framer-motion';
import type { Emotion } from '../lib/emotion';
import { EmotionChip } from './EmotionChip';
import { MoodOrb } from './MoodOrb';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  emotion?: Emotion;
  isCrisis?: boolean;
}

interface MessageBubbleProps {
  message: Message;
}

const emotionGradients: Record<Emotion, string> = {
  joy: 'from-amber-50 to-white',
  sadness: 'from-violet-50 to-white',
  anxiety: 'from-rose-50 to-white',
  anger: 'from-red-50 to-white',
  gratitude: 'from-emerald-50 to-white',
  neutral: 'from-sky-50 to-white',
};

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';
  const botGradient = message.emotion ? emotionGradients[message.emotion] : emotionGradients.neutral;

  return (
    <motion.div
      initial={{ opacity: 0, y: 15, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-6`}
    >
      <div className={`flex max-w-[85%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-3`}>
        
        {!isUser && (
          <div className="shrink-0 mb-1">
            <MoodOrb 
              emotion={message.emotion || 'neutral'} 
              isThinking={false} 
              isCrisis={message.isCrisis || false}
              className="w-10 h-10" 
            />
          </div>
        )}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-5 py-3.5 rounded-3xl text-[15px] leading-relaxed shadow-sm ${
              isUser
                ? 'bg-gradient-to-br from-slate-800 to-slate-700 text-white rounded-br-sm shadow-slate-900/10'
                : `bg-gradient-to-br ${botGradient} text-slate-700 border border-white/60 rounded-bl-sm shadow-indigo-900/5`
            }`}
          >
            {message.text}
          </div>
          
          {isUser && message.emotion && !message.isCrisis && (
            <div className="mt-1.5">
              <EmotionChip emotion={message.emotion} />
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
