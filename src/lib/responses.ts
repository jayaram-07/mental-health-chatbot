import type { Emotion } from './emotion';

const responseBank: Record<Emotion, string[]> = {
  joy: [
    "I'm so glad to hear that! It's wonderful when things feel lighter.",
    "That sounds really positive. Thank you for sharing that joy with me.",
    "It's great that you're experiencing this. Hold onto these good moments.",
    "I love hearing that! It sounds like you're in a really good place right now."
  ],
  sadness: [
    "I hear how heavy things feel right now. It's okay to feel sad.",
    "I'm sorry you're going through this. I'm here to listen.",
    "That sounds really difficult. Please be gentle with yourself today.",
    "It's completely valid to feel down. You don't have to carry it all alone."
  ],
  anxiety: [
    "It sounds like you're carrying a lot of worry right now. Take a slow, deep breath.",
    "Anxiety can be so overwhelming. Let's just take things one step at a time.",
    "I hear how stressed you are. It's okay to pause and give yourself a moment to breathe.",
    "That sounds really overwhelming. Grounding yourself in the present moment might help a little."
  ],
  anger: [
    "It's completely understandable to feel frustrated about that.",
    "I hear your anger, and it's a valid response to what you're experiencing.",
    "That sounds incredibly frustrating. It's okay to feel mad about it.",
    "Your feelings are valid. Sometimes things are just genuinely unfair and upsetting."
  ],
  gratitude: [
    "You're very welcome. I'm just glad I can be here to listen.",
    "I appreciate you saying that. It's an honor to hold space for you.",
    "I'm glad I could offer some comfort. You're doing great.",
    "Thank you for sharing your thoughts with me. I'm always here."
  ],
  neutral: [
    "I'm listening. Tell me more about what's on your mind.",
    "I hear you. How does that make you feel?",
    "Thank you for sharing that with me.",
    "I'm here. Take your time.",
    "That makes sense. What else is going on?"
  ]
};

export function getRandomResponse(emotion: Emotion): string {
  const responses = responseBank[emotion];
  const randomIndex = Math.floor(Math.random() * responses.length);
  return responses[randomIndex];
}
