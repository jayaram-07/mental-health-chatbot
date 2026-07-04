import { motion } from 'framer-motion';
import type { Emotion } from '../lib/emotion';

interface EmotionChipProps {
  emotion: Emotion;
}

const emotionLabels: Record<Emotion, string> = {
  joy: '🌤 mood: hopeful',
  sadness: '💭 sadness detected',
  anxiety: '〰️ anxiety detected',
  anger: '⚡ frustration detected',
  gratitude: '✨ gratitude detected',
  neutral: '🌱 calm',
};

const emotionColors: Record<Emotion, string> = {
  joy: 'bg-amber-50/80 text-amber-700 border-amber-200/50 shadow-sm backdrop-blur-sm',
  sadness: 'bg-violet-50/80 text-violet-700 border-violet-200/50 shadow-sm backdrop-blur-sm',
  anxiety: 'bg-rose-50/80 text-rose-700 border-rose-200/50 shadow-sm backdrop-blur-sm',
  anger: 'bg-red-50/80 text-red-700 border-red-200/50 shadow-sm backdrop-blur-sm',
  gratitude: 'bg-emerald-50/80 text-emerald-700 border-emerald-200/50 shadow-sm backdrop-blur-sm',
  neutral: 'bg-sky-50/80 text-sky-700 border-sky-200/50 shadow-sm backdrop-blur-sm',
};

export function EmotionChip({ emotion }: EmotionChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={`inline-flex items-center px-3 py-1 rounded-full text-[11px] font-medium border ${emotionColors[emotion]} mt-1`}
    >
      {emotionLabels[emotion]}
    </motion.div>
  );
}
