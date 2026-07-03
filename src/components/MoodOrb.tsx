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

  // Convert hex to rgba for box-shadow
  const hexToRgba = (hex: string, alpha: number) => {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  };

  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer glow */}
      <motion.div
        className="absolute rounded-full pointer-events-none"
        animate={{
          boxShadow: `0 0 40px 15px ${hexToRgba(targetColor, 0.4)}`,
          scale: isThinking ? [1, 1.15, 1] : [1, 1.05, 1],
          opacity: isCrisis ? 0.5 : [0.6, 0.8, 0.6],
        }}
        transition={{
          boxShadow: { duration: 2 },
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
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Core orb */}
      <motion.div
        className="relative shadow-inner"
        animate={{
          backgroundColor: targetColor,
          scale: isThinking ? [0.95, 1.05, 0.95] : [0.98, 1.02, 0.98],
          borderRadius: isThinking 
            ? ["50% 50% 50% 50%", "45% 55% 45% 55%", "55% 45% 55% 45%", "50% 50% 50% 50%"] 
            : ["60% 40% 30% 70%/60% 30% 70% 40%", "30% 70% 70% 30%/30% 30% 70% 70%", "50% 50% 20% 80%/25% 80% 20% 75%", "60% 40% 30% 70%/60% 30% 70% 40%"],
        }}
        transition={{
          backgroundColor: { duration: 2 },
          scale: {
            duration: isThinking ? 1.5 : 4,
            repeat: Infinity,
            ease: "easeInOut"
          },
          borderRadius: {
            duration: isThinking ? 2 : 8,
            repeat: Infinity,
            ease: "easeInOut"
          }
        }}
        style={{ 
          width: '100%', 
          height: '100%',
          boxShadow: `inset -10px -10px 20px rgba(0,0,0,0.15), inset 10px 10px 20px rgba(255,255,255,0.5)`
        }}
      />
    </div>
  );
}
