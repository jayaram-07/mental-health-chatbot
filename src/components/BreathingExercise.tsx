import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface BreathingExerciseProps {
  isOpen: boolean;
  onClose: () => void;
}

type Phase = 'in' | 'hold1' | 'out' | 'hold2';

const PHASE_DURATION = 4000; // 4 seconds per phase

export function BreathingExercise({ isOpen, onClose }: BreathingExerciseProps) {
  const [phase, setPhase] = useState<Phase>('in');
  const [cycles, setCycles] = useState(0);

  useEffect(() => {
    if (!isOpen) {
      setPhase('in');
      setCycles(0);
      return;
    }

    let timeout: ReturnType<typeof setTimeout>;

    const runCycle = () => {
      setPhase('in');
      timeout = setTimeout(() => {
        setPhase('hold1');
        timeout = setTimeout(() => {
          setPhase('out');
          timeout = setTimeout(() => {
            setPhase('hold2');
            timeout = setTimeout(() => {
              setCycles(c => c + 1);
              runCycle();
            }, PHASE_DURATION);
          }, PHASE_DURATION);
        }, PHASE_DURATION);
      }, PHASE_DURATION);
    };

    runCycle();

    return () => clearTimeout(timeout);
  }, [isOpen]);

  const getPhaseText = () => {
    switch (phase) {
      case 'in': return 'Breathe in';
      case 'hold1': return 'Hold';
      case 'out': return 'Breathe out';
      case 'hold2': return 'Hold';
    }
  };

  const getScale = () => {
    switch (phase) {
      case 'in': return 1.5;
      case 'hold1': return 1.5;
      case 'out': return 1;
      case 'hold2': return 1;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/40 backdrop-blur-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-teal-500/20 via-lavender-500/20 to-indigo-500/20 pointer-events-none" />
          
          <button
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>

          <div className="relative flex items-center justify-center w-64 h-64 mb-12">
            {/* Outer glowing ring */}
            <motion.div
              className="absolute inset-0 rounded-full border-2 border-teal-200/30"
              animate={{ scale: getScale() }}
              transition={{ duration: 4, ease: "linear" }}
            />
            
            {/* Inner breathing circle */}
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-teal-400/40 to-indigo-400/40 blur-md"
              animate={{ scale: getScale() }}
              transition={{ duration: 4, ease: "linear" }}
            />
            
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-gradient-to-tr from-teal-300/60 to-indigo-300/60 shadow-[0_0_40px_rgba(45,212,191,0.4)]"
              animate={{ scale: getScale() }}
              transition={{ duration: 4, ease: "linear" }}
            />

            <div className="relative z-10 text-white font-medium text-xl tracking-wide drop-shadow-md">
              <AnimatePresence mode="wait">
                <motion.span
                  key={phase}
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  transition={{ duration: 0.5 }}
                  className="block text-center"
                >
                  {getPhaseText()}
                </motion.span>
              </AnimatePresence>
            </div>
          </div>

          <div className="text-white/80 text-sm font-medium tracking-wider uppercase">
            {cycles} {cycles === 1 ? 'breath' : 'breaths'} completed
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
