import { useState, useEffect } from 'react';
import { Activity, Wind, RotateCcw } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { MoodOrb } from './components/MoodOrb';
import { MoodJourney } from './components/MoodJourney';
import { BreathingExercise } from './components/BreathingExercise';
import type { Message } from './components/MessageBubble';
import { analyze } from './lib/sentiment';
import { getRandomResponse } from './lib/responses';
import { fetchChatResponse } from './lib/chatApi';
import type { Emotion } from './lib/emotion';

const STORAGE_KEY = 'mh-chat-session-v1';

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: "Hi there. I'm here to listen. How are you feeling today?",
  sender: 'bot',
  emotion: 'neutral',
  source: 'fallback'
};

function App() {
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse saved messages', e);
    }
    return [INITIAL_MESSAGE];
  });
  const [isThinking, setIsThinking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [isCrisisMode, setIsCrisisMode] = useState(false);

  const [showMoodJourney, setShowMoodJourney] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);
  const [confirmNewChat, setConfirmNewChat] = useState(false);

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

  useEffect(() => {
    if (!isCrisisMode) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(messages));
    }
  }, [messages, isCrisisMode]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMsg && lastUserMsg.emotion) {
        setCurrentEmotion(lastUserMsg.emotion);
      }
    }
  }, [messages]);

  const handleNewChat = () => {
    if (!confirmNewChat) {
      setConfirmNewChat(true);
      setTimeout(() => setConfirmNewChat(false), 3000);
      return;
    }
    setMessages([INITIAL_MESSAGE]);
    setCurrentEmotion('neutral');
    setIsCrisisMode(false);
    setConfirmNewChat(false);
    localStorage.removeItem(STORAGE_KEY);
  };

  const handleSendMessage = async (text: string) => {
    if (isCrisisMode) return;

    const analysis = analyze(text);
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text,
      sender: 'user',
      emotion: analysis.emotion,
      isCrisis: analysis.isCrisis
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setCurrentEmotion(analysis.emotion);

    if (analysis.isCrisis) {
      setIsCrisisMode(true);
      return;
    }

    setIsThinking(true);

    try {
      // Prepare history for API (max ~20 messages)
      const history = newMessages.slice(-20).map(m => ({
        role: m.sender === 'bot' ? 'assistant' as const : 'user' as const,
        text: m.text
      }));

      const reply = await fetchChatResponse(history, analysis.emotion);
      
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: reply,
        sender: 'bot',
        emotion: analysis.emotion,
        source: 'llm',
        suggestBreathing: analysis.emotion === 'anxiety'
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (error) {
      console.warn('LLM fetch failed, falling back to local responses:', error);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: getRandomResponse(analysis.emotion),
        sender: 'bot',
        emotion: analysis.emotion,
        source: 'fallback',
        suggestBreathing: analysis.emotion === 'anxiety'
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsThinking(false);
    }
  };

  return (
    <div className="min-h-screen bg-ambient flex flex-col relative overflow-hidden font-sans">
      {/* Ambient Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        {particles.map(p => (
          <div
            key={p.id}
            className="absolute rounded-full bg-indigo-400/40 blur-[2px]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: `${p.size * 1.5}px`,
              height: `${p.size * 1.5}px`,
              animation: `float ${p.duration}s infinite ease-in-out alternate`
            }}
          />
        ))}
        <style>{`
          @keyframes float {
            0% { transform: translateY(0) translateX(0); }
            100% { transform: translateY(-40px) translateX(20px); }
          }
        `}</style>
      </div>

      {/* Header */}
      <header className="bg-white/60 backdrop-blur-xl border-b border-white/40 p-4 flex items-center justify-between z-10 sticky top-0 shadow-sm">
        <div className="flex items-center gap-4">
          <MoodOrb 
            emotion={currentEmotion} 
            isThinking={isThinking} 
            isCrisis={isCrisisMode}
            className="w-12 h-12" 
          />
          <div>
            <h1 className="font-semibold text-slate-800 text-lg tracking-tight">Companion</h1>
            <p className="text-xs text-slate-500 font-medium">
              {isCrisisMode ? 'Support Mode' : isThinking ? 'Thinking...' : 'Online'}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          <button
            onClick={() => setShowMoodJourney(!showMoodJourney)}
            className={`p-2 rounded-full transition-colors ${showMoodJourney ? 'bg-indigo-100 text-indigo-700' : 'bg-white/50 hover:bg-white/80 text-slate-600'}`}
            title="Mood Journey"
          >
            <Activity className="w-5 h-5" />
          </button>
          
          <MoodJourney isOpen={showMoodJourney} messages={messages} />

          <button
            onClick={() => setShowBreathing(true)}
            className="p-2 rounded-full bg-white/50 hover:bg-white/80 text-slate-600 transition-colors"
            title="Breathe"
          >
            <Wind className="w-5 h-5" />
          </button>
          
          <button
            onClick={handleNewChat}
            className={`px-3 py-2 rounded-full flex items-center gap-2 transition-colors text-sm font-medium ${confirmNewChat ? 'bg-rose-100 text-rose-700' : 'bg-white/50 hover:bg-white/80 text-slate-600'}`}
            title="New Chat"
          >
            <RotateCcw className="w-4 h-4" />
            {confirmNewChat && <span>Sure?</span>}
          </button>
        </div>
      </header>

      {/* Main Chat Area */}
      <main className="flex-1 max-w-3xl w-full mx-auto flex flex-col z-10 my-4 sm:my-8 bg-white/40 backdrop-blur-md shadow-2xl shadow-indigo-900/5 sm:rounded-3xl border border-white/50 overflow-hidden">
        <ChatWindow 
          messages={messages} 
          isThinking={isThinking} 
          currentEmotion={currentEmotion}
          isCrisisMode={isCrisisMode}
          onBreathe={() => setShowBreathing(true)}
        />
        
        {!isCrisisMode && (
          <ChatInput onSend={handleSendMessage} disabled={isThinking} />
        )}
      </main>

      {/* Footer Disclaimer */}
      <footer className="p-4 text-center text-xs text-slate-400 z-10">
        <p>This is a portfolio demo project, not a substitute for professional mental health care.</p>
      </footer>

      <BreathingExercise isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </div>
  );
}

export default App;
