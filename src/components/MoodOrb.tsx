import { motion } from 'framer-motion';
import type { Emotion } from '../lib/emotion';

interface MoodOrbProps {
  emotion: Emotion;
  isThinking: boolean;
  isCrisis: boolean;
  className?: string;
}

const emotionColors: Record<Emotion, string> = {
  joy: '#f59e0b', // Amber
  sadness: '#8b5cf6', // Violet
  anxiety: '#f43f5e', // Rose
  anger: '#ef4444', // Red (but muted via opacity/glow)
  gratitude: '#10b981', // Emerald
  neutral: '#0ea5e9', // Sky blue
};

export function MoodOrb({ emotion, isThinking, isCrisis, className = '' }: MoodOrbProps) {
  // Determine target color
  let targetColor = emotionColors[emotion];
  if (isCrisis) {
    targetColor = '#94a3b8'; // Slate - calm, steady, non-alarming
  }

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full blur-2xl opacity-50"
        animate={{
          backgroundColor: targetColor,
          scale: isThinking ? [1, 1.2, 1] : [1, 1.05, 1],
          opacity: isCrisis ? 0.3 : [0.4, 0.6, 0.4],
        }}
        transition={{
          backgroundColor: { duration: 2 },
          scale: {
            duration: isThinking ? 1.5 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          opacity: {
            duration: isThinking ? 1.5 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{ width: '140%', height: '140%' }}
      />
      
      {/* Core orb */}
      <motion.div
        className="relative rounded-full shadow-inner"
        animate={{
          backgroundColor: targetColor,
          scale: isThinking ? [0.95, 1.05, 0.95] : [0.98, 1.02, 0.98],
          borderRadius: isThinking 
            ? ["50%", "45%", "55%", "50%"] 
            : ["50%", "48% 52% 52% 48%", "52% 48% 48% 52%", "50%"],
        }}
        transition={{
          backgroundColor: { duration: 2 },
          scale: {
            duration: isThinking ? 1.5 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          borderRadius: {
            duration: isThinking ? 2 : 6,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.1), inset 10px 10px 20px rgba(255,255,255,0.4)`
        }}
      />
    </div>
  );
}
