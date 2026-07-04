import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Emotion } from '../lib/emotion';

type DriftType = 'rise' | 'fall' | 'jitter' | 'pulse' | 'calm';

interface AtmosphereConfig {
  colors: [string, string, string];
  base: string;
  speed: number;
  drift: DriftType;
}

const ATMOSPHERE: Record<Emotion | 'crisis', AtmosphereConfig> = {
  neutral: {
    colors: ['#e0f2fe', '#e0e7ff', '#f3e8ff'],
    base: '#f8fafc',
    speed: 15,
    drift: 'calm'
  },
  joy: {
    colors: ['#fef3c7', '#fed7aa', '#fce7f3'],
    base: '#fffbeb',
    speed: 10,
    drift: 'rise'
  },
  sadness: {
    colors: ['#e0e7ff', '#ddd6fe', '#e2e8f0'],
    base: '#f1f5f9',
    speed: 20,
    drift: 'fall'
  },
  anxiety: {
    colors: ['#fef3c7', '#fecaca', '#fde68a'],
    base: '#fff7ed',
    speed: 6,
    drift: 'jitter'
  },
  anger: {
    colors: ['#fee2e2', '#fecaca', '#fecdd3'],
    base: '#fef2f2',
    speed: 12,
    drift: 'pulse'
  },
  gratitude: {
    colors: ['#d1fae5', '#ccfbf1', '#fef9c3'],
    base: '#f0fdf4',
    speed: 18,
    drift: 'calm'
  },
  crisis: {
    colors: ['#eef2f7', '#e2e8f0', '#dbeafe'],
    base: '#f8fafc',
    speed: 25,
    drift: 'calm'
  }
};

interface EmotionalAtmosphereProps {
  emotion: Emotion;
  isCrisis: boolean;
  isThinking?: boolean;
}

export const EmotionalAtmosphere: React.FC<EmotionalAtmosphereProps> = ({ emotion, isCrisis, isThinking: _isThinking }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [bloomKey, setBloomKey] = useState(0);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const currentKey = isCrisis ? 'crisis' : emotion;
  const config = ATMOSPHERE[currentKey];

  useEffect(() => {
    setBloomKey(prev => prev + 1);
  }, [currentKey]);

  const motes = useMemo(() => {
    return Array.from({ length: 20 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      delay: Math.random() * 5,
      duration: Math.random() * 10 + 10
    }));
  }, []);

  const getAuraAnimation = (index: number, config: AtmosphereConfig) => {
    if (prefersReducedMotion) return {};

    const baseScale = [1, 1.1, 0.9, 1];
    const baseOpacity = [0.4, 0.6, 0.4];
    
    let x = ['0%', '5%', '-5%', '0%'];
    let y = ['0%', '5%', '-5%', '0%'];

    if (config.drift === 'jitter') {
      x = ['0%', '2%', '-2%', '3%', '-1%', '0%'];
      y = ['0%', '-2%', '2%', '-3%', '1%', '0%'];
    } else if (config.drift === 'pulse') {
      x = ['0%', '0%'];
      y = ['0%', '0%'];
    } else if (config.drift === 'rise') {
      y = ['0%', '-10%', '0%'];
    } else if (config.drift === 'fall') {
      y = ['0%', '10%', '0%'];
    }

    // Offset animations for different blobs
    const xOffset = x.map(val => `calc(${val} + ${index === 1 ? 20 : index === 2 ? -20 : 0}%)`);
    const yOffset = y.map(val => `calc(${val} + ${index === 1 ? -20 : index === 2 ? 20 : 0}%)`);

    return {
      scale: baseScale,
      opacity: baseOpacity,
      x: xOffset,
      y: yOffset,
      transition: {
        duration: config.speed,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: index * (config.speed / 3)
      }
    };
  };

  const getMoteAnimation = (mote: { id: number; x: number; y: number; size: number; delay: number; duration: number }, config: AtmosphereConfig) => {
    if (prefersReducedMotion) return {};

    let yAnim = ['0vh', '-20vh'];
    let xAnim = ['0vw', '5vw', '-5vw', '0vw'];
    
    if (config.drift === 'rise') {
      yAnim = ['0vh', '-40vh'];
    } else if (config.drift === 'fall') {
      yAnim = ['0vh', '40vh'];
    } else if (config.drift === 'jitter') {
      xAnim = ['0vw', '2vw', '-2vw', '1vw', '-1vw', '0vw'];
      yAnim = ['0vh', '-5vh', '5vh', '-2vh', '2vh', '0vh'];
    } else if (config.drift === 'pulse') {
      yAnim = ['0vh', '-5vh', '0vh'];
      xAnim = ['0vw', '2vw', '0vw'];
    }

    return {
      y: yAnim,
      x: xAnim,
      opacity: [0, 0.5, 0],
      transition: {
        duration: config.drift === 'jitter' ? mote.duration * 0.5 : mote.duration,
        repeat: Infinity,
        ease: "easeInOut" as const,
        delay: mote.delay
      }
    };
  };

  return (
    <motion.div 
      className="fixed inset-0 -z-0 overflow-hidden pointer-events-none"
      animate={{ backgroundColor: config.base }}
      transition={{ duration: 1.6, ease: "easeInOut" }}
    >
      {/* Bloom effect on emotion change */}
      <AnimatePresence>
        <motion.div
          key={bloomKey}
          initial={{ opacity: 0.3, scale: 0.8 }}
          animate={{ opacity: 0, scale: 1.2 }}
          transition={{ duration: 1.5, ease: "easeOut" }}
          className="absolute inset-0 bg-white/20 mix-blend-overlay"
        />
      </AnimatePresence>

      {/* Aura Blobs */}
      <div className="absolute inset-0 opacity-60 mix-blend-multiply filter blur-3xl">
        {config.colors.map((color, i) => (
          <motion.div
            key={`aura-${i}`}
            className="absolute rounded-full"
            style={{
              backgroundColor: color,
              width: i === 0 ? '60vw' : i === 1 ? '50vw' : '70vw',
              height: i === 0 ? '60vh' : i === 1 ? '70vh' : '50vh',
              left: i === 0 ? '-10vw' : i === 1 ? '40vw' : '10vw',
              top: i === 0 ? '-10vh' : i === 1 ? '10vh' : '40vh',
            }}
            animate={getAuraAnimation(i, config)}
          />
        ))}
      </div>

      {/* Motes */}
      <div className="absolute inset-0">
        {motes.map(mote => (
          <motion.div
            key={`mote-${mote.id}`}
            className="absolute rounded-full"
            style={{
              left: `${mote.x}%`,
              top: `${mote.y}%`,
              width: mote.size,
              height: mote.size,
              backgroundColor: config.colors[mote.id % 3],
              opacity: 0
            }}
            animate={getMoteAnimation(mote, config)}
          />
        ))}
      </div>
    </motion.div>
  );
};
