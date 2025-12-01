"use client";

import React, { createContext, useContext, useState, useRef, useCallback, useMemo } from "react";
import { v4 as uuidv4 } from "uuid";
import { useStreaming } from "@/hooks/useStreaming";
import { useSession } from "@/hooks/useSession";
import { Message as BaseMessage } from "@/types";

// Extended message type for UI
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  agent?: string;
}

// Conversation type matching your current UI
interface Conversation {
  id: string;
  title?: string;
  updated_at: string;
}

// Chat API interface matching your current implementation
interface ChatAPI {
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  conversationId: string | null;
  error: { message: string } | null;
  sendMessage: (message: string) => Promise<void>;
  loadConversation: (id: string) => Promise<void>;
  reset: () => Promise<void>;
}

// Conversations API interface
interface ConversationsAPI {
  conversations: Conversation[];
  isLoading: boolean;
  createConversation: () => Promise<void>;
  deleteConversation: (id: string) => Promise<void>;
  refreshConversations: () => Promise<void>;
}

// Combined context type
interface ChatContextType {
  chatAPI: ChatAPI;
  conversationsAPI: ConversationsAPI;
}

const ChatContext = createContext<ChatContextType | null>(null);

export function useChatContext() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error("useChatContext must be used within ChatProvider");
  }
  return context;
}

interface ChatProviderProps {
  children: React.ReactNode;
  userId?: string;
}

export function ChatProvider({ children, userId = "default-user" }: ChatProviderProps) {
  // Local state
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [error, setError] = useState<{ message: string } | null>(null);
  const [isLoadingConversations, setIsLoadingConversations] = useState(false);

  // Refs for tracking state
  const currentMessageRef = useRef<Message | null>(null);

  // Custom hooks
  const { isLoading: isStreamingLoading, startStream } = useStreaming((fn) => fn());
  const { 
    handleCreateNewSession,
    handleSessionSwitch
  } = useSession();

  // Mock conversations for now - will integrate with sessions later
  React.useEffect(() => {
    // Initialize with empty conversations for now
    if (conversations.length === 0) {
      setConversations([]);
    }
  }, [conversations.length]);

  // Message update callback for streaming
  const handleMessageUpdate = useCallback((message: BaseMessage) => {
    setMessages(prev => {
      const existing = prev.find(m => m.id === message.id);
      const uiMessage: Message = {
        id: message.id,
        role: message.type === 'user' ? 'user' : 'assistant',
        content: message.content,
        timestamp: message.timestamp,
        agent: message.agent
      };

      if (existing) {
        return prev.map(m => m.id === message.id ? uiMessage : m);
      } else {
        return [...prev, uiMessage];
      }
    });
  }, []);

  // Event update callback (for advanced features)
  const handleEventUpdate = useCallback((messageId: string, event: unknown) => {
    // Handle timeline events if needed in the future
    console.log('Event update:', messageId, event);
  }, []);

  // Website count update callback
  const handleWebsiteCountUpdate = useCallback((count: number) => {
    // Handle website count updates if needed
    console.log('Website count update:', count);
  }, []);

  // Chat API implementation
  const chatAPI: ChatAPI = useMemo(() => ({
    messages,
    isLoading: isStreamingLoading,
    isStreaming: isStreamingLoading,
    conversationId,
    error,
    
    sendMessage: async (message: string) => {
      try {
        setError(null);
        
        // Create or ensure we have a session
        let activeSessionId = conversationId;
        if (!activeSessionId) {
          // Get the session ID directly from creation
          activeSessionId = await handleCreateNewSession(userId);
          setConversationId(activeSessionId);
          console.log(`🎯 [CHAT PROVIDER] Using session ID: ${activeSessionId}`);
        }

        // Add user message immediately
        const userMessage: Message = {
          id: uuidv4(),
          role: 'user',
          content: message,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, userMessage]);
        currentMessageRef.current = userMessage;

        // Start streaming
        await startStream(
          {
            message,
            userId,
            sessionId: activeSessionId
          },
          handleMessageUpdate,
          handleEventUpdate,
          handleWebsiteCountUpdate
        );

      } catch (err) {
        console.error('Error sending message:', err);
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to send message' 
        });
      }
    },

    loadConversation: async (id: string) => {
      try {
        setError(null);
        setConversationId(id);
        handleSessionSwitch(id);
        
        // For now, just clear messages when loading a conversation
        // Session events loading will be implemented when sessions API is ready
        setMessages([]);
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to load conversation' 
        });
      }
    },

    reset: async () => {
      setMessages([]);
      setConversationId(null);
      setError(null);
      currentMessageRef.current = null;
    }
  }), [
    messages, 
    isStreamingLoading, 
    conversationId, 
    error, 
    userId,
    startStream,
    handleCreateNewSession,
    handleSessionSwitch,
    handleMessageUpdate,
    handleEventUpdate,
    handleWebsiteCountUpdate
  ]);

  // Conversations API implementation
  const conversationsAPI: ConversationsAPI = useMemo(() => ({
    conversations,
    isLoading: isLoadingConversations,

    createConversation: async () => {
      try {
        setError(null);
        
        // Get the new session ID directly
        const newSessionId = await handleCreateNewSession(userId);
        
        // Reset current chat and set new session
        await chatAPI.reset();
        setConversationId(newSessionId);
        
        // Add new conversation to the list
        const newConversation: Conversation = {
          id: newSessionId,
          title: `Session ${Date.now()}`,
          updated_at: new Date().toISOString()
        };
        setConversations(prev => [newConversation, ...prev]);
        
      } catch (err) {
        console.error('Error creating conversation:', err);
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to create conversation' 
        });
      }
    },

    deleteConversation: async (id: string) => {
      try {
        setError(null);
        
        // Remove from local conversations list
        setConversations(prev => prev.filter(conv => conv.id !== id));
        
        // If we deleted the active conversation, reset
        if (conversationId === id) {
          await chatAPI.reset();
        }
      } catch (err) {
        console.error('Error deleting conversation:', err);
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to delete conversation' 
        });
      }
    },

    refreshConversations: async () => {
      setIsLoadingConversations(true);
      try {
        // Sessions are automatically refreshed by useSession hook
        setError(null);
      } catch (err) {
        console.error('Error refreshing conversations:', err);
        setError({ 
          message: err instanceof Error ? err.message : 'Failed to refresh conversations' 
        });
      } finally {
        setIsLoadingConversations(false);
      }
    }
  }), [
    conversations,
    isLoadingConversations,
    conversationId,
    userId,
    handleCreateNewSession,
    chatAPI
  ]);

  const contextValue: ChatContextType = useMemo(() => ({
    chatAPI,
    conversationsAPI
  }), [chatAPI, conversationsAPI]);

  return (
    <ChatContext.Provider value={contextValue}>
      {children}
    </ChatContext.Provider>
  );
}