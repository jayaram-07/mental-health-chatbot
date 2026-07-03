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
  joy: 'bg-amber-100 text-amber-800 border-amber-200',
  sadness: 'bg-violet-100 text-violet-800 border-violet-200',
  anxiety: 'bg-rose-100 text-rose-800 border-rose-200',
  anger: 'bg-red-100 text-red-800 border-red-200',
  gratitude: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  neutral: 'bg-sky-100 text-sky-800 border-sky-200',
};

export function EmotionChip({ emotion }: EmotionChipProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: 1, y: 0 }}
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${emotionColors[emotion]} mt-1`}
    >
      {emotionLabels[emotion]}
    </motion.div>
  );
}
