import * as React from "react";
import { MessageSquare, Plus, Trash2, Search, Bot } from "lucide-react";
import useAppStore from "../store/useAppStore";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
  SidebarRail,
} from "@/components/ui/sidebar";
import { ModeToggle } from "./ui/mode-toggle";
import { Button } from "./ui/button";

// ── Sub-components ────────────────────────────────────────────────────────────

function NewChatButton({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2 bg-foreground text-background hover:opacity-90 transition-opacity py-2.5 rounded-xl text-sm font-medium"
    >
      <Plus className="w-4 h-4" />
      New Chat
    </button>
  );
}

function SidebarSearchForm() {
  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
      <input
        type="text"
        placeholder="Search chats…"
        className="w-full bg-muted/50 border border-border rounded-lg pl-8 pr-3 py-1.5 text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-ring"
      />
    </div>
  );
}

function ConversationItem({ chat, isActive, onSwitch, onDelete }) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        className="group/item pr-1"
      >
        <div
          onClick={() => onSwitch(chat.id)}
          className="flex items-center gap-3 cursor-pointer w-full"
        >
          <MessageSquare className="w-4 h-4 flex-shrink-0" />
          <span className="flex-1 truncate text-sm">{chat.title}</span>
          <Button
            variant="ghost"
            size="icon-xs"
            tooltip="Delete chat"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(chat.id);
            }}
            className="opacity-0 group-hover/item:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-opacity"
          >
            <Trash2 />
          </Button>
        </div>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function AppSidebar({ isOpen, setIsOpen, ...props }) {
  const {
    conversations,
    currentConversationId,
    createNewConversation,
    switchConversation,
    deleteConversation,
  } = useAppStore();

  const handleNewChat = () => {
    createNewConversation();
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const handleSwitch = (id) => {
    switchConversation(id);
    if (window.innerWidth < 768) setIsOpen(false);
  };

  const recent = conversations.slice(0, 3);
  const older = conversations.slice(3);

  return (
    <Sidebar {...props}>
      {/* ── Header ── */}
      <SidebarHeader className="gap-3 p-4">
        {/* Brand */}
        <div className="flex justify-between items-center gap-2 px-1">
          <div className="flex gap-2 items-center">

          <div className="w-7 h-7 rounded-lg overflow-hidden border border-border flex items-center justify-center">
            <img src="/logo.png" alt="ProductScout Logo" className="w-full h-full object-cover" />
          </div>
          <span className="font-semibold text-sm">
            ProductScout
          </span>
          </div>
          <ModeToggle />
        </div>

        {/* New Chat */}
        <NewChatButton onClick={handleNewChat} />

        {/* Search */}
        <SidebarSearchForm />
      </SidebarHeader>

      {/* ── Content ── */}
      <SidebarContent>
        {/* Recent */}
        {recent.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Recent</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {recent.map((chat) => (
                  <ConversationItem
                    key={chat.id}
                    chat={chat}
                    isActive={currentConversationId === chat.id}
                    onSwitch={handleSwitch}
                    onDelete={deleteConversation}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Older */}
        {older.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel>Previous Chats</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {older.map((chat) => (
                  <ConversationItem
                    key={chat.id}
                    chat={chat}
                    isActive={currentConversationId === chat.id}
                    onSwitch={handleSwitch}
                    onDelete={deleteConversation}
                  />
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* Empty state */}
        {conversations.length === 0 && (
          <SidebarGroup>
            <SidebarGroupContent>
              <p className="px-3 py-2 text-xs text-muted-foreground/60 italic">
                No chats yet. Start a new conversation!
              </p>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarRail />
    </Sidebar>
  );
}

export default AppSidebar;