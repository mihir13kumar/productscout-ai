import { create } from 'zustand';
import { get, set, keys, del } from 'idb-keyval';

const generateId = () => Date.now().toString(36) + Math.random().toString(36).substr(2);

const useAppStore = create((setStore, getStore) => ({
  conversations: [],
  currentConversationId: null,

  // Active session state (mapped to current conversation)
  url: '',
  isScraping: false,
  scrapingLogs: [],
  scrapeStatus: 'idle', // 'idle' | 'scraping' | 'success' | 'error'
  messages: [],
  title: 'New Chat',

  // ------------------------------------------
  // Core Storage Logic
  // ------------------------------------------
  initStore: async () => {
    try {
      const allKeys = await keys();
      const chatKeys = allKeys.filter(k => typeof k === 'string' && k.startsWith('chat_'));
      
      const loadedConversations = [];
      for (const key of chatKeys) {
        const chat = await get(key);
        if (chat) loadedConversations.push(chat);
      }
      
      // Sort newest first
      loadedConversations.sort((a, b) => b.updatedAt - a.updatedAt);
      
      setStore({ conversations: loadedConversations });
    } catch (e) {
      console.error("Failed to load conversations from IndexedDB", e);
    }
  },

  saveCurrentConversation: async () => {
    const state = getStore();
    if (!state.currentConversationId) return;

    const chatData = {
      id: state.currentConversationId,
      title: state.title,
      url: state.url,
      messages: state.messages,
      scrapingLogs: state.scrapingLogs,
      scrapeStatus: state.scrapeStatus,
      updatedAt: Date.now(),
    };

    try {
      await set(`chat_${state.currentConversationId}`, chatData);
      
      // Update the conversations list in memory
      setStore((prev) => {
        const existing = prev.conversations.filter(c => c.id !== state.currentConversationId);
        return {
          conversations: [chatData, ...existing].sort((a, b) => b.updatedAt - a.updatedAt)
        };
      });
    } catch (e) {
      console.error("Failed to save conversation", e);
    }
  },

  // ------------------------------------------
  // Conversation Management
  // ------------------------------------------
  createNewConversation: () => {
    const newId = generateId();
    setStore({
      currentConversationId: newId,
      url: '',
      isScraping: false,
      scrapingLogs: [],
      scrapeStatus: 'idle',
      messages: [],
      title: 'New Chat'
    });
    // Don't auto-save immediately to avoid cluttering DB with empty chats, 
    // it will save when they start scraping.
  },

  switchConversation: async (id) => {
    const chat = await get(`chat_${id}`);
    if (chat) {
      setStore({
        currentConversationId: chat.id,
        title: chat.title || 'Chat',
        url: chat.url || '',
        messages: chat.messages || [],
        scrapingLogs: chat.scrapingLogs || [],
        scrapeStatus: chat.scrapeStatus || 'idle',
        isScraping: false // Always reset active scraping state on switch
      });
    }
  },

  deleteConversation: async (id) => {
    try {
      await del(`chat_${id}`);
      setStore((state) => {
        const newConvos = state.conversations.filter(c => c.id !== id);
        
        // If we deleted the active one, switch to new chat
        if (state.currentConversationId === id) {
          return {
            conversations: newConvos,
            currentConversationId: null,
            url: '',
            scrapeStatus: 'idle',
            scrapingLogs: [],
            messages: [],
            title: 'New Chat'
          };
        }
        return { conversations: newConvos };
      });
    } catch (e) {
      console.error("Failed to delete", e);
    }
  },

  setTitle: (title) => {
    setStore({ title });
    getStore().saveCurrentConversation();
  },

  // ------------------------------------------
  // Active Session Updates (Auto-save triggered)
  // ------------------------------------------
  setUrl: (url) => {
    setStore({ url });
    // Don't auto save just for typing URL
  },
  
  setIsScraping: (isScraping) => setStore({ isScraping }),
  
  addScrapingLog: (log) => {
    setStore((state) => ({ 
      scrapingLogs: [...state.scrapingLogs, { id: generateId(), text: log, time: new Date() }] 
    }));
    getStore().saveCurrentConversation();
  },
  
  clearScrapingLogs: () => {
    setStore({ scrapingLogs: [] });
    getStore().saveCurrentConversation();
  },

  setScrapeStatus: (status) => {
    setStore({ scrapeStatus: status });
    // Ensure we have an ID when we start scraping
    if (status === 'scraping' && !getStore().currentConversationId) {
      setStore({ currentConversationId: generateId() });
    }
    getStore().saveCurrentConversation();
  },

  addMessage: (message) => {
    setStore((state) => ({ messages: [...state.messages, message] }));
    getStore().saveCurrentConversation();
  },
  
  updateLastMessage: (chunk) => {
    setStore((state) => {
      const newMessages = [...state.messages];
      const lastMsgIndex = newMessages.length - 1;
      if (lastMsgIndex >= 0 && newMessages[lastMsgIndex].role === 'assistant') {
        newMessages[lastMsgIndex] = {
          ...newMessages[lastMsgIndex],
          content: newMessages[lastMsgIndex].content + chunk
        };
      } else {
          newMessages.push({ role: 'assistant', content: chunk, id: generateId() });
      }
      return { messages: newMessages };
    });
    // We might not want to save to IDB on *every single token* for performance, 
    // but idb-keyval is fast enough for small chunks usually. For safety, we can throttle 
    // or just let it save.
    getStore().saveCurrentConversation();
  },
  
  clearMessages: () => {
    setStore({ messages: [] });
    getStore().saveCurrentConversation();
  }
}));

// Initialize store on load
useAppStore.getState().initStore();

export default useAppStore;
