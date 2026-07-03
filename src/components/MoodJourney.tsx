import { motion, AnimatePresence } from 'framer-motion';
import type { Message } from './MessageBubble';
import type { Emotion } from '../lib/emotion';
import { EmotionChip } from './EmotionChip';

interface MoodJourneyProps {
  isOpen: boolean;
  messages: Message[];
}

const valenceMap: Record<Emotion, number> = {
  joy: 2,
  gratitude: 1.5,
  neutral: 0,
  anxiety: -1,
  sadness: -1.5,
  anger: -2,
};

const emotionColors: Record<Emotion, string> = {
  joy: '#f59e0b', // Amber
  sadness: '#8b5cf6', // Violet
  anxiety: '#f43f5e', // Rose
  anger: '#ef4444', // Red
  gratitude: '#10b981', // Emerald
  neutral: '#0ea5e9', // Sky blue
};

function getSummary(averageValence: number): string {
  if (averageValence > 1) return 'Mostly positive';
  if (averageValence > 0.3) return 'Slightly positive';
  if (averageValence > -0.3) return 'Mostly calm';
  if (averageValence > -1) return 'Slightly heavy';
  return 'Mostly heavy';
}

export function MoodJourney({ isOpen, messages }: MoodJourneyProps) {
  const userMessages = messages.filter(m => m.sender === 'user' && m.emotion);
  
  const dataPoints = userMessages.map((m, i) => ({
    x: i,
    y: valenceMap[m.emotion as Emotion] || 0,
    emotion: m.emotion as Emotion,
  }));

  const width = 280;
  const height = 100;
  const padding = 20;

  const minX = 0;
  const maxX = Math.max(1, dataPoints.length - 1);
  const minY = -2;
  const maxY = 2;

  const scaleX = (x: number) => padding + (x - minX) * ((width - padding * 2) / maxX);
  const scaleY = (y: number) => height - padding - (y - minY) * ((height - padding * 2) / (maxY - minY));
  
  // Create a smooth path using bezier curves if there are enough points
  let pathD = '';
  if (dataPoints.length > 0) {
    pathD = `M ${scaleX(dataPoints[0].x)},${scaleY(dataPoints[0].y)}`;
    for (let i = 1; i < dataPoints.length; i++) {
      const prev = dataPoints[i - 1];
      const curr = dataPoints[i];
      const cp1x = scaleX(prev.x) + (scaleX(curr.x) - scaleX(prev.x)) / 2;
      const cp1y = scaleY(prev.y);
      const cp2x = scaleX(prev.x) + (scaleX(curr.x) - scaleX(prev.x)) / 2;
      const cp2y = scaleY(curr.y);
      pathD += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${scaleX(curr.x)},${scaleY(curr.y)}`;
    }
  }

  const areaD = dataPoints.length > 0 
    ? `${pathD} L ${scaleX(dataPoints[dataPoints.length - 1].x)},${height - padding} L ${scaleX(dataPoints[0].x)},${height - padding} Z`
    : '';

  const averageValence = dataPoints.length > 0 
    ? dataPoints.reduce((sum, dp) => sum + dp.y, 0) / dataPoints.length 
    : 0;

  const latestEmotion = dataPoints.length > 0 ? dataPoints[dataPoints.length - 1].emotion : 'neutral';

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="absolute top-full right-0 mt-2 w-80 bg-white/90 backdrop-blur-xl border border-white/60 shadow-xl shadow-indigo-900/10 rounded-2xl p-4 z-50 origin-top-right"
        >
          <h3 className="text-sm font-semibold text-slate-700 mb-3">Mood Journey</h3>
          
          {dataPoints.length < 2 ? (
            <div className="text-sm text-slate-500 text-center py-6 bg-slate-50/50 rounded-xl border border-slate-100">
              Your mood journey will appear here as we talk.
            </div>
          ) : (
            <>
              <div className="relative w-full h-[100px] mb-4 bg-slate-50/50 rounded-xl border border-slate-100 overflow-hidden">
                <svg width={width} height={height} className="w-full h-full overflow-visible">
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={emotionColors[latestEmotion]} stopOpacity="0.2" />
                      <stop offset="100%" stopColor={emotionColors[latestEmotion]} stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  
                  {/* Zero line */}
                  <line 
                    x1={padding} 
                    y1={scaleY(0)} 
                    x2={width - padding} 
                    y2={scaleY(0)} 
                    stroke="#cbd5e1" 
                    strokeWidth="1" 
                    strokeDasharray="4 4" 
                  />

                  {/* Area */}
                  <path d={areaD} fill="url(#areaGradient)" />
                  
                  {/* Line */}
                  <path d={pathD} fill="none" stroke={emotionColors[latestEmotion]} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  
                  {/* Points */}
                  {dataPoints.map((dp, i) => (
                    <circle 
                      key={i} 
                      cx={scaleX(dp.x)} 
                      cy={scaleY(dp.y)} 
                      r="4" 
                      fill={emotionColors[dp.emotion]} 
                      stroke="#ffffff"
                      strokeWidth="1.5"
                    />
                  ))}
                </svg>
              </div>

              <div className="flex items-center justify-between text-xs">
                <div className="flex flex-col gap-1">
                  <span className="text-slate-500 font-medium">Summary</span>
                  <span className="text-slate-700 font-semibold">{getSummary(averageValence)}</span>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <span className="text-slate-500 font-medium">Current</span>
                  <EmotionChip emotion={latestEmotion} />
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 text-center">
                Based on {dataPoints.length} messages
              </div>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
