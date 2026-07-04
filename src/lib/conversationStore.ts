import type { Message } from '../components/MessageBubble';

export interface Conversation {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
}

const STORE_KEY = 'mh-conversations-v1';
const CURRENT_ID_KEY = 'mh-current-conversation-v1';
const LEGACY_KEY = 'mh-chat-session-v1';

export function loadConversations(): Conversation[] {
  try {
    const data = localStorage.getItem(STORE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        return parsed.sort((a, b) => b.updatedAt - a.updatedAt);
      }
    }
  } catch (e) {
    console.warn('Failed to load conversations', e);
  }
  return [];
}

export function saveConversations(list: Conversation[]): void {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(list));
  } catch (e) {
    console.warn('Failed to save conversations', e);
  }
}

export function createConversation(initial: Message): Conversation {
  const now = Date.now();
  const id = typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : `${now}-${Math.random().toString(36).slice(2)}`;
  
  return {
    id,
    title: 'New conversation',
    messages: [initial],
    createdAt: now,
    updatedAt: now
  };
}

export function deriveTitle(messages: Message[]): string {
  const firstUserMsg = messages.find(m => m.sender === 'user');
  if (!firstUserMsg || !firstUserMsg.text) {
    return 'New conversation';
  }
  const text = firstUserMsg.text.trim();
  if (text.length > 40) {
    return text.slice(0, 40) + '...';
  }
  return text;
}

export function getCurrentId(): string | null {
  try {
    return localStorage.getItem(CURRENT_ID_KEY);
  } catch {
    return null;
  }
}

export function setCurrentId(id: string): void {
  try {
    localStorage.setItem(CURRENT_ID_KEY, id);
  } catch (e) {
    console.warn('Failed to set current conversation id', e);
  }
}

export function migrateLegacy(initial: Message): Conversation[] | null {
  try {
    const hasNewStore = localStorage.getItem(STORE_KEY);
    if (hasNewStore) return null;

    const legacyData = localStorage.getItem(LEGACY_KEY);
    if (legacyData) {
      const parsed = JSON.parse(legacyData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const conv = createConversation(initial);
        conv.messages = parsed;
        conv.title = deriveTitle(parsed);
        
        const list = [conv];
        saveConversations(list);
        setCurrentId(conv.id);
        localStorage.removeItem(LEGACY_KEY);
        return list;
      }
    }
  } catch (e) {
    console.warn('Failed to migrate legacy conversation', e);
  }
  return null;
}
