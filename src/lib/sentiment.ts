import Sentiment from 'sentiment';
import { detectEmotion } from "./emotion";
import type { Emotion } from "./emotion";

const sentimentAnalyzer = new Sentiment();

const crisisKeywords = [
  'suicide', 'kill myself', 'end it all', 'self harm', 'want to die', 
  'better off dead', 'hurt myself', 'take my own life', 'no reason to live'
];

export interface AnalysisResult {
  score: number;
  emotion: Emotion;
  isCrisis: boolean;
}

export function analyze(message: string): AnalysisResult {
  const lowerMessage = message.toLowerCase();
  
  // Check for crisis first
  const isCrisis = crisisKeywords.some(keyword => lowerMessage.includes(keyword));
  
  // Get AFINN sentiment score
  const result = sentimentAnalyzer.analyze(message);
  
  // Get emotion category
  let emotion = detectEmotion(message);
  
  // Fallback emotion based on score if neutral
  if (emotion === 'neutral') {
    if (result.score > 2) emotion = 'joy';
    else if (result.score < -2) emotion = 'sadness';
  }

  return {
    score: result.score,
    emotion,
    isCrisis
  };
}
