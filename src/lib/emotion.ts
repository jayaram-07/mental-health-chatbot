export type Emotion = 'joy' | 'sadness' | 'anxiety' | 'anger' | 'neutral' | 'gratitude';

const emotionKeywords: Record<Emotion, string[]> = {
  joy: ['happy', 'great', 'good', 'awesome', 'wonderful', 'excited', 'glad', 'better', 'amazing'],
  sadness: ['sad', 'depressed', 'down', 'lonely', 'crying', 'hopeless', 'miserable', 'unhappy', 'grief', 'loss'],
  anxiety: ['anxious', 'worried', 'nervous', 'panic', 'stressed', 'overwhelmed', 'scared', 'fear', 'afraid'],
  anger: ['angry', 'mad', 'frustrated', 'annoyed', 'furious', 'hate', 'rage'],
  gratitude: ['thank', 'thanks', 'appreciate', 'grateful', 'helpful'],
  neutral: []
};

export function detectEmotion(message: string): Emotion {
  const lowerMessage = message.toLowerCase();
  
  let maxMatches = 0;
  let detectedEmotion: Emotion = 'neutral';

  for (const [emotion, keywords] of Object.entries(emotionKeywords)) {
    let matches = 0;
    for (const keyword of keywords) {
      // Simple word boundary match
      const regex = new RegExp(`\\b${keyword}\\b`, 'i');
      if (regex.test(lowerMessage)) {
        matches++;
      }
    }
    
    if (matches > maxMatches) {
      maxMatches = matches;
      detectedEmotion = emotion as Emotion;
    }
  }

  return detectedEmotion;
}
