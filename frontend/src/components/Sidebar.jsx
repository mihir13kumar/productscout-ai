import React from 'react';
import useAppStore from '../store/useAppStore';
import { MessageSquare, Plus, Trash2, Menu } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { 
    conversations, 
    currentConversationId, 
    createNewConversation, 
    switchConversation, 
    deleteConversation 
  } = useAppStore();

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <div className={`fixed top-0 left-0 h-full bg-muted/30 border-r border-border w-64 z-50 flex flex-col transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
      }`}>
        
        {/* Header / New Chat */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-4 md:hidden">
            <span className="font-semibold">ProductScout</span>
            <button onClick={() => setIsOpen(false)} className="text-muted-foreground hover:text-foreground">
              <Menu className="w-5 h-5" />
            </button>
          </div>
          <button 
            onClick={() => {
              createNewConversation();
              if (window.innerWidth < 768) setIsOpen(false);
            }}
            className="w-full flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 transition-opacity py-2.5 rounded-xl text-sm font-medium"
          >
            <Plus className="w-4 h-4" />
            New Chat
          </button>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <p className="px-2 text-xs font-semibold text-muted-foreground mb-3 mt-2 uppercase tracking-wider">
            Previous Chats
          </p>
          
          {conversations.length === 0 && (
            <p className="px-2 text-xs text-muted-foreground/60 italic">No previous chats.</p>
          )}

          {conversations.map((chat) => (
            <div 
              key={chat.id}
              onClick={() => {
                switchConversation(chat.id);
                if (window.innerWidth < 768) setIsOpen(false);
              }}
              className={`group flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer transition-colors ${
                currentConversationId === chat.id 
                  ? 'bg-muted text-foreground' 
                  : 'hover:bg-muted/50 text-muted-foreground'
              }`}
            >
              <MessageSquare className="w-4 h-4 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm truncate">
                  {chat.title}
                </p>
              </div>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  deleteConversation(chat.id);
                }}
                className="opacity-0 group-hover:opacity-100 hover:text-destructive transition-opacity p-1"
                title="Delete Chat"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-border mt-auto">
          <div className="flex items-center gap-3 px-2">
            <div className="w-8 h-8 rounded-full bg-foreground text-background flex items-center justify-center text-xs font-bold">
              U
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium">User</span>
              <span className="text-xs text-muted-foreground">Free Tier</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
