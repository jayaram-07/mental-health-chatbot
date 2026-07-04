import { useState } from 'react';
import { motion } from 'framer-motion';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Copy, Check, RotateCcw, Volume2 } from 'lucide-react';
import type { Emotion } from '../lib/emotion';
import { EmotionChip } from './EmotionChip';
import { MoodOrb } from './MoodOrb';

export interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  emotion?: Emotion;
  isCrisis?: boolean;
  source?: 'llm' | 'fallback';
  suggestBreathing?: boolean;
  streaming?: boolean;
}

interface MessageRowProps {
  message: Message;
  onBreathe?: () => void;
  onRegenerate?: () => void;
  canRegenerate?: boolean;
  onSpeak?: (text: string) => void;
}

export function MessageRow({ message, onBreathe, onRegenerate, canRegenerate, onSpeak }: MessageRowProps) {
  const isUser = message.sender === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      className={`group flex w-full py-6 px-4 sm:px-6 my-2 rounded-2xl transition-all duration-300 ${
        isUser 
          ? '' 
          : 'bg-white/40 backdrop-blur-md border border-white/50 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.02)]'
      }`}
    >
      <div className="flex w-full gap-4">
        <div className="shrink-0 flex flex-col items-center">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-100 to-slate-200 flex items-center justify-center text-slate-600 text-xs font-medium shadow-sm border border-white/60">
              You
            </div>
          ) : (
            <div className="relative">
              <div className="absolute inset-0 bg-indigo-400/10 rounded-full blur-md" />
              <MoodOrb 
                emotion={message.emotion || 'neutral'} 
                isThinking={false} 
                isCrisis={message.isCrisis || false}
                className="w-8 h-8 relative z-10" 
              />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <span className="font-semibold text-sm text-slate-800">
              {isUser ? 'You' : 'Companion'}
            </span>
            {!isUser && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                {onSpeak && !message.streaming && (
                  <button
                    onClick={() => onSpeak(message.text)}
                    className="p-1 text-slate-400 hover:text-indigo-500 transition-colors rounded"
                    title="Read aloud"
                  >
                    <Volume2 size={14} />
                  </button>
                )}
                <button
                  onClick={handleCopy}
                  className="p-1 text-slate-400 hover:text-indigo-500 transition-colors rounded"
                  title="Copy message"
                >
                  {copied ? <Check size={14} /> : <Copy size={14} />}
                </button>
                {canRegenerate && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    className="p-1 text-slate-400 hover:text-indigo-500 transition-colors rounded"
                    title="Regenerate response"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
              </div>
            )}
          </div>

          <div className="text-[15px] text-slate-700 leading-relaxed">
            {isUser ? (
              <div className="whitespace-pre-wrap">{message.text}</div>
            ) : message.streaming && !message.text ? (
              <div className="flex gap-1.5 items-center h-6">
                <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-indigo-400/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            ) : (
              <div className="markdown-body space-y-4">
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    p: ({ children }) => <p className="leading-relaxed">{children}</p>,
                    ul: ({ children }) => <ul className="list-disc pl-5 space-y-1">{children}</ul>,
                    ol: ({ children }) => <ol className="list-decimal pl-5 space-y-1">{children}</ol>,
                    li: ({ children }) => <li className="pl-1">{children}</li>,
                    strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
                    em: ({ children }) => <em className="italic text-slate-600">{children}</em>,
                    a: ({ href, children }) => (
                      <a href={href} target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline hover:text-indigo-800 transition-colors">
                        {children}
                      </a>
                    ),
                    code: ({ inline, className, children, ...props }: any) => {
                      return !inline ? (
                        <div className="overflow-x-auto bg-slate-900/5 rounded-lg p-4 my-2 border border-slate-900/10">
                          <code className={className} {...props}>
                            {children}
                          </code>
                        </div>
                      ) : (
                        <code className="bg-slate-100 text-slate-800 px-1.5 py-0.5 rounded text-sm border border-slate-200/60" {...props}>
                          {children}
                        </code>
                      );
                    }
                  }}
                >
                  {message.text + (message.streaming ? ' ▍' : '')}
                </ReactMarkdown>
              </div>
            )}
          </div>

          {isUser && message.emotion && !message.isCrisis && (
            <div className="mt-3">
              <EmotionChip emotion={message.emotion} />
            </div>
          )}

          {!isUser && message.suggestBreathing && onBreathe && (
            <motion.button
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={onBreathe}
              className="mt-4 inline-flex items-center px-4 py-2 rounded-full text-xs font-medium bg-gradient-to-r from-teal-50 to-emerald-50 text-teal-700 border border-teal-100/50 hover:from-teal-100 hover:to-emerald-100 transition-all duration-300 shadow-sm hover:shadow w-fit gap-1.5"
            >
              <span className="text-sm">🌬</span> Try a 1-minute breathing exercise
            </motion.button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
