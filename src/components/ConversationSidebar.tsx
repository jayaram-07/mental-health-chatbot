import { Plus, Trash2, X, MessageSquare } from 'lucide-react';
import type { Conversation } from '../lib/conversationStore';
import { MoodOrb } from './MoodOrb';

interface ConversationSidebarProps {
  conversations: Conversation[];
  currentId: string | null;
  open: boolean;
  onSelect: (id: string) => void;
  onNew: () => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now();
  const diff = now - timestamp;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m`;
  if (hours < 24) return `${hours}h`;
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days}d`;
  
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

export function ConversationSidebar({
  conversations,
  currentId,
  open,
  onSelect,
  onNew,
  onDelete,
  onClose
}: ConversationSidebarProps) {
  return (
    <>
      {/* Mobile Scrim */}
      {open && (
        <div 
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-40 sm:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar Panel */}
      <div 
        className={`fixed sm:relative inset-y-0 left-0 z-50 w-[260px] bg-white/60 backdrop-blur-xl border-r border-white/40 flex flex-col transition-all duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full sm:translate-x-0 sm:w-0 sm:border-r-0 sm:opacity-0 sm:overflow-hidden'
        }`}
      >
        {/* Mobile Close Button */}
        <div className="sm:hidden absolute top-4 right-4 z-10">
          <button 
            onClick={onClose}
            className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100/50 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 flex flex-col gap-4">
          <div className="flex items-center gap-2 px-2 pt-1">
            <MoodOrb emotion="neutral" isThinking={false} isCrisis={false} className="w-6 h-6" />
            <span className="font-semibold text-slate-700 tracking-tight">Companion</span>
          </div>
          <button
            onClick={() => {
              onNew();
              if (window.innerWidth < 640) onClose();
            }}
            className="w-full flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 hover:from-indigo-100 hover:to-violet-100 text-indigo-700 rounded-xl font-medium transition-all duration-300 shadow-sm border border-indigo-100/50 hover:shadow-md hover:scale-[1.02]"
          >
            <Plus size={18} />
            New chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1">
          {conversations.map(conv => {
            const isActive = conv.id === currentId;
            return (
              <button
                key={conv.id}
                onClick={() => {
                  onSelect(conv.id);
                  if (window.innerWidth < 640) onClose();
                }}
                className={`w-full group flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-all duration-300 relative overflow-hidden ${
                  isActive 
                    ? 'bg-gradient-to-r from-indigo-50/80 to-violet-50/80 text-indigo-900 shadow-sm border border-indigo-100/50' 
                    : 'hover:bg-white/60 text-slate-700 hover:shadow-sm'
                }`}
              >
                {isActive && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-400 to-violet-400 rounded-l-xl" />
                )}
                <MessageSquare size={16} className={`shrink-0 ${isActive ? 'text-indigo-500' : 'text-slate-400 group-hover:text-indigo-400 transition-colors'}`} />
                
                <div className="flex-1 min-w-0">
                  <div className="truncate text-sm font-medium">
                    {conv.title}
                  </div>
                  <div className={`text-xs mt-0.5 ${isActive ? 'text-indigo-400' : 'text-slate-400'}`}>
                    {formatRelativeTime(conv.updatedAt)}
                  </div>
                </div>

                <div 
                  className={`absolute right-2 p-1.5 rounded-md text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-colors opacity-0 group-hover:opacity-100 ${
                    isActive ? 'bg-indigo-50/80' : 'bg-white/80'
                  }`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conv.id);
                  }}
                  title="Delete conversation"
                >
                  <Trash2 size={14} />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </>
  );
}
