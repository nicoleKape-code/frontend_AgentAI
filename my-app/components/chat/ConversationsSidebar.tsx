"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
// Standard conversation type
type ConversationResponse = {
  id: string;
  title?: string;
  updated_at: string;
};

interface ConversationsSidebarProps {
  conversations: ConversationResponse[];
  activeConversationId?: string;
  onSelectConversation: (conversation: ConversationResponse) => void;
  onNewConversation: () => void;
  onDeleteConversation: (conversationId: string) => void;
  isLoading?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  onLayoutChange?: (isOpen: boolean, isLargeScreen: boolean) => void;
}

export function ConversationsSidebar({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  isLoading = false,
  open: controlledOpen,
  onOpenChange,
  onLayoutChange,
}: ConversationsSidebarProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [isLargeScreen, setIsLargeScreen] = useState(false);
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = onOpenChange || setInternalOpen;

  useEffect(() => {
    const checkScreenSize = () => {
      setIsLargeScreen(window.innerWidth >= 1024); // lg breakpoint
    };

    checkScreenSize();
    window.addEventListener("resize", checkScreenSize);
    return () => window.removeEventListener("resize", checkScreenSize);
  }, []);

  // Notify parent of layout changes
  useEffect(() => {
    onLayoutChange?.(open, isLargeScreen);
  }, [open, isLargeScreen, onLayoutChange]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffInDays === 0) {
      return date.toLocaleTimeString("es-ES", {
        hour: "2-digit",
        minute: "2-digit",
      });
    } else if (diffInDays < 7) {
      return date.toLocaleDateString("es-ES", { weekday: "short" });
    } else {
      return date.toLocaleDateString("es-ES", {
        month: "short",
        day: "numeric",
      });
    }
  };

  return (
    <>
      {/* Trigger Button */}
      {!open && (
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 left-4 z-30 backdrop-blur-md bg-black/30 border border-white/20 text-white hover:bg-black/40 hover:text-white transition-all rounded-xl"
          onClick={() => setOpen(!open)}
        >
          <MessageSquare className="h-5 w-5" />
        </Button>
      )}

      {/* Mobile Overlay */}
      {open && !isLargeScreen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar Panel */}
      <div
        className={cn(
          "fixed top-0 left-0 h-full w-80 z-40 backdrop-blur-md bg-black/30 border-r border-white/20",
          "transform transition-transform duration-300 ease-in-out",
          "flex flex-col scrollbar-aurora",
          open ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="p-6 pb-4 flex items-center justify-between">
          <h2 className="text-white font-semibold text-lg">Conversations</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/70 hover:text-white hover:bg-white/10 rounded-lg"
            onClick={() => setOpen(false)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {/* New Conversation Button */}
        <div className="px-6 pb-4">
          <Button
            onClick={() => {
              onNewConversation();
              if (!isLargeScreen) {
                setOpen(false);
              }
            }}
            className={cn(
              "w-full bg-white/20 hover:bg-white/30 text-white border border-white/30",
              "backdrop-blur-sm transition-all duration-200 rounded-xl"
            )}
          >
            <Plus className="h-4 w-4 mr-2" />
            New Conversation
          </Button>
        </div>

        {/* Conversations List */}
        <div className="flex-1 px-6 overflow-y-auto scrollbar-aurora">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : conversations.length === 0 ? (
            <div className="text-center py-8 text-white/70">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs opacity-70">Create a new one to start</p>
            </div>
          ) : (
            <div className="space-y-2 pb-6">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={cn(
                    "group relative p-3 rounded-xl cursor-pointer transition-all",
                    "backdrop-blur-sm bg-black/20 border border-white/10 hover:bg-black/40 hover:border-white/20",
                    activeConversationId === conversation.id &&
                      "bg-white/10 border-white/30 shadow-lg"
                  )}
                  onClick={() => {
                    onSelectConversation(conversation);
                    if (!isLargeScreen) {
                      setOpen(false);
                    }
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-white truncate">
                        {conversation.title || "Untitled"}
                      </h4>
                      <p className="text-xs text-white/60 mt-1">
                        {formatDate(conversation.updated_at)}
                      </p>
                    </div>

                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity text-white/60 hover:text-red-400 hover:bg-red-500/20 rounded-lg"
                      onClick={(e: React.MouseEvent) => {
                        e.stopPropagation();
                        onDeleteConversation(conversation.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}