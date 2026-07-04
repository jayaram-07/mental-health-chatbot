import { useState, useEffect, useRef } from 'react';
import { Activity, Wind, PanelLeft, Plus, Volume2, VolumeX } from 'lucide-react';
import { ChatWindow } from './components/ChatWindow';
import { ChatInput } from './components/ChatInput';
import { MoodOrb } from './components/MoodOrb';
import { MoodJourney } from './components/MoodJourney';
import { BreathingExercise } from './components/BreathingExercise';
import { ConversationSidebar } from './components/ConversationSidebar';
import { EmotionalAtmosphere } from './components/EmotionalAtmosphere';
import type { Message } from './components/MessageBubble';
import { analyze } from './lib/sentiment';
import { getRandomResponse } from './lib/responses';
import { fetchChatResponse, streamChatResponse } from './lib/chatApi';
import type { Emotion } from './lib/emotion';
import { useSpeechSynthesis } from './hooks/useVoice';
import {
  type Conversation,
  loadConversations,
  saveConversations,
  createConversation,
  deriveTitle,
  getCurrentId,
  setCurrentId,
  migrateLegacy
} from './lib/conversationStore';

const INITIAL_MESSAGE: Message = {
  id: '1',
  text: "Hi there. I'm here to listen. How are you feeling today?",
  sender: 'bot',
  emotion: 'neutral',
  source: 'fallback'
};

function initStore() {
  const legacy = migrateLegacy(INITIAL_MESSAGE);
  let list = legacy ?? loadConversations();
  if (list.length === 0) {
    const initialConv = createConversation(INITIAL_MESSAGE);
    list = [initialConv];
    saveConversations(list);
  }
  let activeId = getCurrentId();
  if (!activeId || !list.some(c => c.id === activeId)) {
    activeId = list[0].id;
    setCurrentId(activeId);
  }
  return { list, activeId };
}

function App() {
  const [storeInit] = useState(() => initStore());
  const [conversations, setConversations] = useState<Conversation[]>(storeInit.list);
  const [currentId, setCurrentIdState] = useState<string | null>(storeInit.activeId);
  const [messages, setMessages] = useState<Message[]>(() => {
    const activeConv = storeInit.list.find(c => c.id === storeInit.activeId);
    return activeConv ? activeConv.messages : [INITIAL_MESSAGE];
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const [isThinking, setIsThinking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState<Emotion>('neutral');
  const [isCrisisMode, setIsCrisisMode] = useState(false);

  const [showMoodJourney, setShowMoodJourney] = useState(false);
  const [showBreathing, setShowBreathing] = useState(false);

  const [speakReplies, setSpeakReplies] = useState(() => {
    return localStorage.getItem('mh-speak-v1') === 'true';
  });
  const { supported: ttsSupported, speak, cancel: cancelSpeech } = useSpeechSynthesis();
  const lastSpokenMessageIdRef = useRef<string | null>(
    (() => {
      const activeConv = storeInit.list.find(c => c.id === storeInit.activeId);
      const msgs = activeConv ? activeConv.messages : [INITIAL_MESSAGE];
      const lastMsg = msgs[msgs.length - 1];
      return lastMsg ? lastMsg.id : null;
    })()
  );

  const abortControllerRef = useRef<AbortController | null>(null);

  const flushCurrentConversation = () => {
    if (isCrisisMode || !currentId) return;
    
    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === currentId) {
          const finalizedMessages = messages.map(m => 
            m.streaming ? { ...m, streaming: false } : m
          );
          return {
            ...c,
            messages: finalizedMessages,
            title: deriveTitle(finalizedMessages),
            updatedAt: Date.now()
          };
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  };

  useEffect(() => {
    // Set initial sidebar state based on screen width
    if (window.innerWidth < 640) {
      setSidebarOpen(false);
    }
  }, []);

  // Sync messages to current conversation
  useEffect(() => {
    if (!currentId || messages.length === 0) return;
    
    // Don't persist while streaming or in crisis mode
    if (isCrisisMode || messages.some(m => m.streaming)) return;

    setConversations(prev => {
      const updated = prev.map(c => {
        if (c.id === currentId) {
          return {
            ...c,
            messages,
            title: deriveTitle(messages),
            updatedAt: Date.now()
          };
        }
        return c;
      });
      saveConversations(updated);
      return updated;
    });
  }, [messages, currentId, isCrisisMode]);

  useEffect(() => {
    if (messages.length > 0) {
      const lastUserMsg = [...messages].reverse().find(m => m.sender === 'user');
      if (lastUserMsg && lastUserMsg.emotion) {
        setCurrentEmotion(lastUserMsg.emotion);
      }
    }
  }, [messages]);

  useEffect(() => {
    if (!speakReplies || isCrisisMode) return;
    
    const lastMsg = messages[messages.length - 1];
    if (lastMsg && lastMsg.sender === 'bot' && !lastMsg.streaming && lastMsg.id !== lastSpokenMessageIdRef.current) {
      lastSpokenMessageIdRef.current = lastMsg.id;
      speak(lastMsg.text);
    }
  }, [messages, speakReplies, isCrisisMode, speak]);

  const toggleSpeakReplies = () => {
    const next = !speakReplies;
    setSpeakReplies(next);
    localStorage.setItem('mh-speak-v1', String(next));
    if (!next) {
      cancelSpeech();
    }
  };

  const handleNewChat = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);
    
    flushCurrentConversation();
    
    const newConv = createConversation(INITIAL_MESSAGE);
    setConversations(prev => {
      const updated = [newConv, ...prev];
      saveConversations(updated);
      return updated;
    });
    
    setCurrentIdState(newConv.id);
    setCurrentId(newConv.id);
    setMessages(newConv.messages);
    setCurrentEmotion('neutral');
    setIsCrisisMode(false);
    
    const lastMsg = newConv.messages[newConv.messages.length - 1];
    lastSpokenMessageIdRef.current = lastMsg ? lastMsg.id : null;
  };

  const handleSelectConversation = (id: string) => {
    if (id === currentId) return;
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsThinking(false);

    flushCurrentConversation();

    const conv = conversations.find(c => c.id === id);
    if (conv) {
      setCurrentIdState(id);
      setCurrentId(id);
      setMessages(conv.messages);
      setIsCrisisMode(false);
      
      const lastUserMsg = [...conv.messages].reverse().find(m => m.sender === 'user');
      setCurrentEmotion(lastUserMsg?.emotion || 'neutral');
      
      const lastMsg = conv.messages[conv.messages.length - 1];
      lastSpokenMessageIdRef.current = lastMsg ? lastMsg.id : null;
    }
  };

  const handleDeleteConversation = (id: string) => {
    if (id === currentId && abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
      setIsThinking(false);
    }

    if (id === currentId) {
      flushCurrentConversation();
    }

    setConversations(prev => {
      const updated = prev.filter(c => c.id !== id);
      
      if (updated.length === 0) {
        const newConv = createConversation(INITIAL_MESSAGE);
        updated.push(newConv);
      }
      
      saveConversations(updated);
      
      if (id === currentId) {
        const nextId = updated[0].id;
        setCurrentIdState(nextId);
        setCurrentId(nextId);
        setMessages(updated[0].messages);
        setIsCrisisMode(false);
        const lastUserMsg = [...updated[0].messages].reverse().find(m => m.sender === 'user');
        setCurrentEmotion(lastUserMsg?.emotion || 'neutral');
        
        const lastMsg = updated[0].messages[updated[0].messages.length - 1];
        lastSpokenMessageIdRef.current = lastMsg ? lastMsg.id : null;
      }
      
      return updated;
    });
  };

  const handleStop = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    cancelSpeech();
  };

  const runChatFlow = async (userText: string, currentMessages: Message[], emotionOverride?: Emotion) => {
    cancelSpeech();
    const analysis = analyze(userText);
    const emotion = emotionOverride || analysis.emotion;
    
    const userMsg: Message = {
      id: Date.now().toString(),
      text: userText,
      sender: 'user',
      emotion: emotion,
      isCrisis: analysis.isCrisis
    };

    const newMessages = [...currentMessages, userMsg];
    setMessages(newMessages);
    setCurrentEmotion(emotion);

    if (analysis.isCrisis) {
      setIsCrisisMode(true);
      return;
    }

    setIsThinking(true);

    const botMsgId = (Date.now() + 1).toString();
    const placeholderMsg: Message = {
      id: botMsgId,
      text: '',
      sender: 'bot',
      emotion: emotion,
      source: 'llm',
      streaming: true,
      suggestBreathing: emotion === 'anxiety'
    };

    setMessages(prev => [...prev, placeholderMsg]);

    const history = newMessages.slice(-20).map(m => ({
      role: m.sender === 'bot' ? 'assistant' as const : 'user' as const,
      text: m.text
    }));

    const controller = new AbortController();
    abortControllerRef.current = controller;
    let hasReceivedDelta = false;
    let finalError = null;

    try {
      await streamChatResponse(
        history,
        emotion,
        (chunk) => {
          if (!hasReceivedDelta) {
            hasReceivedDelta = true;
            setIsThinking(false);
          }
          setMessages(prev => prev.map(m => 
            m.id === botMsgId ? { ...m, text: m.text + chunk } : m
          ));
        },
        controller.signal
      );
      
      if (!controller.signal.aborted) {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, streaming: false, source: 'llm' } : m
        ));
      } else {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, streaming: false } : m
        ));
      }
    } catch (error: any) {
      if (error.name === 'AbortError') {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, streaming: false } : m
        ));
      } else {
        finalError = error;
      }
    } finally {
      setIsThinking(false);
    }

    if (finalError) {
      if (!hasReceivedDelta) {
        try {
          const reply = await fetchChatResponse(history, emotion, controller.signal);
          if (!controller.signal.aborted) {
            setMessages(prev => prev.map(m => 
              m.id === botMsgId ? { ...m, text: reply, streaming: false, source: 'llm' } : m
            ));
          } else {
            setMessages(prev => prev.map(m => 
              m.id === botMsgId ? { ...m, streaming: false } : m
            ));
          }
        } catch (fallbackError: any) {
          if (fallbackError.name === 'AbortError' || controller.signal.aborted) {
            setMessages(prev => prev.map(m => 
              m.id === botMsgId ? { ...m, streaming: false } : m
            ));
          } else {
            console.warn('LLM fetch failed, falling back to local responses:', fallbackError);
            setMessages(prev => prev.map(m => 
              m.id === botMsgId ? { ...m, text: getRandomResponse(emotion), streaming: false, source: 'fallback' } : m
            ));
          }
        }
      } else {
        setMessages(prev => prev.map(m => 
          m.id === botMsgId ? { ...m, streaming: false } : m
        ));
      }
    }
    
    if (abortControllerRef.current === controller) {
      abortControllerRef.current = null;
    }
  };

  const handleSendMessage = (text: string) => {
    if (isCrisisMode) return;
    runChatFlow(text, messages);
  };

  const handleRegenerate = () => {
    if (isThinking || isCrisisMode || messages.some(m => m.streaming)) return;
    
    const lastUserMsgIndex = messages.map(m => m.sender).lastIndexOf('user');
    if (lastUserMsgIndex === -1) return;

    const lastUserMsg = messages[lastUserMsgIndex];
    const messagesBeforeLastUser = messages.slice(0, lastUserMsgIndex);
    
    runChatFlow(lastUserMsg.text, messagesBeforeLastUser, lastUserMsg.emotion);
  };

  const isStreaming = messages.some(m => m.streaming);

  return (
    <div className="h-[100dvh] bg-slate-50 flex relative overflow-hidden font-sans">
      <EmotionalAtmosphere emotion={currentEmotion} isCrisis={isCrisisMode} isThinking={isThinking} />

      <ConversationSidebar
        conversations={conversations}
        currentId={currentId}
        open={sidebarOpen}
        onSelect={handleSelectConversation}
        onNew={handleNewChat}
        onDelete={handleDeleteConversation}
        onClose={() => setSidebarOpen(false)}
      />

      <div className="flex-1 flex flex-col min-w-0 z-10 relative h-full">
        {/* Header */}
        <header className="shrink-0 bg-white/60 backdrop-blur-xl border-b border-white/40 p-4 flex items-center justify-between shadow-sm relative z-50">
          <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-indigo-200/50 to-transparent" />
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 -ml-2 rounded-full hover:bg-white/80 text-slate-600 transition-colors"
              title="Toggle Sidebar"
            >
              <PanelLeft className="w-5 h-5" />
            </button>
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/20 rounded-full blur-md" />
              <MoodOrb 
                emotion={currentEmotion} 
                isThinking={isThinking} 
                isCrisis={isCrisisMode}
                className="w-12 h-12 relative z-10" 
              />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800 text-lg tracking-tight">Companion</h1>
              <div className="flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500"></span>
                </span>
                <p className="text-xs text-slate-500 font-medium">
                  {isCrisisMode ? 'Support Mode' : isThinking ? 'Thinking...' : 'Online'}
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 relative">
            {ttsSupported && (
              <button
                onClick={toggleSpeakReplies}
                className={`p-2 rounded-full transition-colors ${speakReplies ? 'bg-indigo-100 text-indigo-700' : 'bg-white/50 hover:bg-white/80 text-slate-600'}`}
                title={speakReplies ? "Mute voice" : "Enable voice"}
              >
                {speakReplies ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
              </button>
            )}

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
              className="px-3 py-2 rounded-full flex items-center gap-2 transition-colors text-sm font-medium bg-white/50 hover:bg-white/80 text-slate-600"
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">New</span>
            </button>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 min-h-0 w-full mx-auto flex flex-col bg-white/40 backdrop-blur-md shadow-2xl shadow-indigo-900/5 overflow-hidden">
          <ChatWindow 
            messages={messages} 
            isThinking={isThinking} 
            currentEmotion={currentEmotion}
            isCrisisMode={isCrisisMode}
            onBreathe={() => setShowBreathing(true)}
            onStarter={handleSendMessage}
            onRegenerate={handleRegenerate}
            onSpeak={ttsSupported ? speak : undefined}
          />
          
          <div className="shrink-0 flex flex-col">
            {!isCrisisMode && (
              <ChatInput 
                onSend={handleSendMessage} 
                disabled={isThinking || isStreaming} 
                isStreaming={isStreaming}
                onStop={handleStop}
              />
            )}
            {/* Footer Disclaimer */}
            <footer className="pb-2 pt-1 text-center text-[10px] text-slate-400/80">
              <p>This is a portfolio demo project, not a substitute for professional mental health care.</p>
            </footer>
          </div>
        </main>
      </div>

      <BreathingExercise isOpen={showBreathing} onClose={() => setShowBreathing(false)} />
    </div>
  );
}

export default App;
