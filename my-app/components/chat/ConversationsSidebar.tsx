"use client";

import { useState, useEffect } from "react";
import { Plus, MessageSquare, Trash2, X, ChevronUp, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
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
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
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

  // Get user information
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };
    
    getUser();
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/');
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showProfileDropdown && event.target) {
        const target = event.target as Element;
        if (!target.closest('.profile-dropdown-container')) {
          setShowProfileDropdown(false);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showProfileDropdown]);

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

        {/* Profile Section */}
        <div className="px-6 pb-6 pt-4 border-t border-white/10">
          <div className="relative profile-dropdown-container">
            {/* Dropdown Menu */}
            {showProfileDropdown && (
              <div className="absolute bottom-full left-0 right-0 mb-2 bg-black/40 backdrop-blur-md border border-white/20 rounded-xl shadow-xl z-50">
                <div className="p-2">
                  <Button
                    variant="ghost"
                    onClick={handleLogout}
                    className="w-full justify-start text-white/80 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors text-sm"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Logout
                  </Button>
                </div>
              </div>
            )}

            {/* Profile Button */}
            <Button
              variant="ghost"
              onClick={() => setShowProfileDropdown(!showProfileDropdown)}
              className={cn(
                "w-full justify-between p-3 h-auto bg-black/20 backdrop-blur-sm border border-white/10",
                "hover:bg-black/40 hover:border-white/20 rounded-xl transition-all",
                showProfileDropdown && "bg-white/10 border-white/30"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <User className="h-4 w-4 text-white" />
                </div>
                <div className="flex flex-col items-start">
                  <span className="text-white text-sm font-medium">
                    {user?.user_metadata?.first_name ? 
                      `${user.user_metadata.first_name} ${user.user_metadata.last_name || ''}`.trim() :
                      user?.email?.split('@')[0] || 'User'
                    }
                  </span>
                  <span className="text-white/60 text-xs">
                    {user?.email || 'user@example.com'}
                  </span>
                </div>
              </div>
              <ChevronUp 
                className={cn(
                  "h-4 w-4 text-white/60 transition-transform",
                  showProfileDropdown && "rotate-180"
                )} 
              />
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}