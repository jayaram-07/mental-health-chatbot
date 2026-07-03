import { useState, useEffect } from 'react';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { MoodOrb } from './components/MoodOrb';
import type { Message } from './components/MessageBubble';
import { analyze } from './lib/sentiment';
import { getRandomResponse } from './lib/responses';
import type { Emotion } from './lib/emotion';

function App() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi there. I'm here to listen. How are you feeling today?",
      sender: 'bot',
      emotion: 'neutral'
    }
  ]);
  const [isThinking, setIsThinking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [isCrisisMode, setIsCrisisMode] = useState(false);

  // Background particles
  const [particles, setParticles] = useState<{id: number, x: number, y: number, size: number, duration: number}[]>([]);

  useEffect(() => {
    // Generate some subtle background particles
    const newParticles = Array.from({ length: 15 }).map((_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 4 + 2,
      duration: Math.random() * 20 + 10
    }));
    setParticles(newParticles);
  }, []);

  const handleSendMessage = (text: string) => {
    if (isCrisisMode) return;

    const analysis = analyze(text);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      emotion: analysis.emotion,
      isCrisis: analysis.isCrisis
    };

    setMessages(prev => [...prev, userMsg]);
    setCurrentEmotion(analysis.emotion);

    if (analysis.isCrisis) {
      setIsCrisisMode(true);
      return;
    }

    setIsThinking(true);

    // Simulate thinking delay
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(analysis.emotion),
        sender: 'bot',
        emotion: analysis.emotion
      };
      setMessages(prev => [...prev, botMsg]);
      setIsThinking(false);
    }, 1500 + Math.random() * 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-white opacity-20 blur-sm"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animation: `float ${p.duration}s infinite ease-in-out alternate`
            }}
          />
        ))}
        <style>{`
          @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            100% { transform: translateY(-20px) translateX(10px); }
          }
        `}</style>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 p-4 flex items-center justify-between z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <MoodOrb 
            emotion={currentEmotion} 
            isThinking={isThinking} 
            isCrisis={isCrisisMode}
            className="w-10 h-10" 
          />
          <div>
            <h1 className="font-semibold text-slate-800">Companion</h1>
            <p className="text-xs text-slate-500">
              {isCrisisMode ? 'Support Mode' : isThinking ? 'Thinking...' : 'Online'}
            </p>
          </div>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-2xl w-full mx-auto flex flex-col z-10 bg-slate-50/50 backdrop-blur-sm shadow-2xl shadow-slate-200/50">
        <ChatWindow 
          messages={messages} 
          isThinking={isThinking} 
          currentEmotion={currentEmotion}
          isCrisisMode={isCrisisMode}
        />
        
        {!isCrisisMode && (
          <ChatInput onSend={handleSendMessage} disabled={isThinking} />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="p-3 text-center text-xs text-slate-400 z-10 bg-slate-50">
        <p>This is a portfolio demo project, not a substitute for professional mental health care.</p>
      </footer>
    </div>
  );
}

export default App;
