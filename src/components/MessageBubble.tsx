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

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'} mb-4`}
    >
      <div className={`flex max-w-[80%] ${isUser ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
        
        {!isUser && (
          <div className="shrink-0 mb-1">
            <MoodOrb 
              emotion={message.emotion || 'neutral'} 
              isThinking={false} 
              isCrisis={message.isCrisis || false}
              className="w-8 h-8" 
            />
          </div>
        )}

        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}>
          <div
            className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
              isUser
                ? 'bg-slate-800 text-white rounded-br-sm'
                : 'bg-white text-slate-700 shadow-sm border border-slate-100 rounded-bl-sm'
            }`}
          >
            {message.text}
          </div>
          
          {isUser && message.emotion && !message.isCrisis && (
            <EmotionChip emotion={message.emotion} />
          )}
        </div>
      </div>
    </motion.div>
  );
}
