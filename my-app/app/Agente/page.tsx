"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ChatProvider, useChatContext } from "@/contexts/ChatProvider";
import {
  Message,
  MessageContent,
  MessageAvatar,
} from "@/components/ui/shadcn-io/ai/message";
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputSubmit,
  PromptInputButton,
} from "@/components/ui/shadcn-io/ai/prompt-input";
import { Response } from "@/components/ui/shadcn-io/ai/response";
import {
  PaperclipIcon,
  AlertCircleIcon,
  ArrowUpIcon,
} from "lucide-react";
import { BubbleBackground } from "@/components/ui/BubbleBackground";
import { ConversationsSidebar } from "@/components/chat/ConversationsSidebar";
import { cn } from "@/lib/utils";


// Internal component that uses the context
function ChatPageContent() {
  const [input, setInput] = useState("");
  const [showConversationsSidebar, setShowConversationsSidebar] = useState(false);
  const [sidebarLayout, setSidebarLayout] = useState({ isOpen: false, isLargeScreen: false });

  // Ref para el scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref para mantener el foco en el input
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Get real API from context
  const { chatAPI, conversationsAPI } = useChatContext();

  // Función para scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll cuando cambian los mensajes o el streaming
  useEffect(() => {
    scrollToBottom();
  }, [chatAPI.messages, chatAPI.isStreaming, scrollToBottom]);

  // Manejo del envío de mensajes
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (!input.trim() || chatAPI.isLoading || chatAPI.isStreaming) {
        return;
      }

      const message = input.trim();
      setInput("");

      try {
        await chatAPI.sendMessage(message);
      } catch (error) {
        console.error("Error sending message:", error);
      }

      // Mantener el foco en el input después de enviar
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [input, chatAPI]
  );

  // ==================== CONVERSATION HANDLERS ====================

  const handleSelectConversation = useCallback(async (conversation: { id: string; title?: string; updated_at: string }) => {
    try {
      await chatAPI.loadConversation(conversation.id);
      setShowConversationsSidebar(false);
    } catch (error) {
      console.error("Error loading conversation:", error);
    }
  }, [chatAPI]);

  const handleNewConversation = useCallback(async () => {
    try {
      await conversationsAPI.createConversation();
      setShowConversationsSidebar(false);
    } catch (error) {
      console.error("Error creating conversation:", error);
    }
  }, [conversationsAPI]);

  const handleDeleteConversation = useCallback(async (conversationId: string) => {
    try {
      await conversationsAPI.deleteConversation(conversationId);
    } catch (error) {
      console.error("Error deleting conversation:", error);
    }
  }, [conversationsAPI]);

  const handleSidebarLayoutChange = useCallback((isOpen: boolean, isLargeScreen: boolean) => {
    setSidebarLayout({ isOpen, isLargeScreen });
  }, []);




  return (
    <main className="relative h-screen w-full flex flex-col">
      {/* Background - siempre visible */}
      <BubbleBackground interactive={true} className="fixed inset-0 z-0" />
      
      {/* Content wrapper que se ajusta al sidebar */}
      <div 
        className={cn(
          "relative flex flex-col h-full transition-all duration-300 ease-in-out",
          sidebarLayout.isOpen && sidebarLayout.isLargeScreen && "ml-80"
        )}
      >

      {chatAPI.messages.length === 0 ? (
        /* Estado inicial - Input centrado */
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              AI Assistant
            </h1>
            <p className="text-white opacity-70">
              How can I help you today?
            </p>
          </div>
          
          {/* Input centrado cuando no hay mensajes */}
          <div className="w-full max-w-2xl">
            <PromptInput
              className="w-full h-38 bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl"
              onSubmit={handleSubmit}
            >
              <PromptInputTextarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.currentTarget.value)}
                placeholder="How can I help you today?"
                disabled={chatAPI.isLoading || chatAPI.isStreaming}
                className="text-white placeholder:text-white/60 bg-transparent resize-none rounded-2xl"
              />
              <PromptInputToolbar className="flex items-center gap-2">
                <PromptInputButton className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-8 h-8 flex items-center justify-center">
                  <PaperclipIcon className="w-4 h-4" />
                </PromptInputButton>
                <PromptInputSubmit
                  disabled={!input.trim() || chatAPI.isLoading || chatAPI.isStreaming}
                  status={chatAPI.isStreaming ? "streaming" : undefined}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-0 p-0",
                    !input.trim() || chatAPI.isLoading || chatAPI.isStreaming
                      ? "bg-white/20 text-white/50 cursor-not-allowed"
                      : "bg-white hover:bg-white/90 text-black"
                  )}
                >
                  <ArrowUpIcon className="w-4 h-4" />
                </PromptInputSubmit>
              </PromptInputToolbar>
            </PromptInput>
          </div>
        </div>
      ) : (
        /* Estado con mensajes - Layout normal */
        <>
          {/* Contenedor de mensajes scrollable */}
          <div className="flex-1 overflow-y-auto p-4 relative z-10 scrollbar-aurora">
            <div className="max-w-4xl mx-auto space-y-4">
              {chatAPI.messages.map((message) => (
                <Message
                  key={message.id}
                  from={message.role}
                  className="text-white"
                >
                  <MessageAvatar
                    src={
                      message.role === "user"
                        ? "/placeholder-user.jpg"
                        : "/Logo.png"
                    }
                    name={message.role === "user" ? "User" : "Assistant"}
                  />
                  <MessageContent>
                    <Response>{message.content}</Response>
                  </MessageContent>
                </Message>
              ))}

              {/* Indicador de carga simple cuando está escribiendo */}
              {chatAPI.isStreaming && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <span>Assistant is typing...</span>
                </div>
              )}

              {/* Errores */}
              {chatAPI.error && (
                <div className="bg-red-500/20 border border-red-400/30 rounded-lg p-4">
                  <AlertCircleIcon className="h-4 w-4 text-red-400 inline mr-2" />
                  <span className="text-red-100">
                    Error: {chatAPI.error.message}
                  </span>
                </div>
              )}

              {/* Elemento invisible para scroll automático */}
              <div ref={messagesEndRef} />
            </div>
          </div>

          {/* Input fijo en la parte inferior - Solo cuando hay mensajes */}
          <div className="border-t border-white/10 p-4 relative z-20">
            <div className="w-full max-w-4xl mx-auto">
              <PromptInput
                className="w-full h-38 bg-black/30 backdrop-blur-md border border-white/20 rounded-2xl shadow-2xl"
                onSubmit={handleSubmit}
              >
                <PromptInputTextarea
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.currentTarget.value)}
                  placeholder="How can I help you today?"
                  disabled={chatAPI.isLoading || chatAPI.isStreaming}
                  className="text-white placeholder:text-white/60 bg-transparent resize-none rounded-2xl"
                />
                <PromptInputToolbar className="flex items-center gap-2">
                  <PromptInputButton className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-8 h-8 flex items-center justify-center">
                    <PaperclipIcon className="w-4 h-4" />
                  </PromptInputButton>
                  <PromptInputSubmit
                    disabled={!input.trim() || chatAPI.isLoading || chatAPI.isStreaming}
                    status={chatAPI.isStreaming ? "streaming" : undefined}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-0 p-0",
                      !input.trim() || chatAPI.isLoading || chatAPI.isStreaming
                        ? "bg-white/20 text-white/50 cursor-not-allowed"
                        : "bg-white hover:bg-white/90 text-black"
                    )}
                  >
                    <ArrowUpIcon className="w-4 h-4" />
                  </PromptInputSubmit>
                </PromptInputToolbar>
              </PromptInput>
            </div>
          </div>
        </>
      )}


      </div>

      {/* Sidebar de conversaciones */}
      <ConversationsSidebar
        conversations={conversationsAPI.conversations}
        activeConversationId={chatAPI.conversationId || undefined}
        onSelectConversation={handleSelectConversation}
        onNewConversation={handleNewConversation}
        onDeleteConversation={handleDeleteConversation}
        isLoading={conversationsAPI.isLoading}
        open={showConversationsSidebar}
        onOpenChange={setShowConversationsSidebar}
        onLayoutChange={handleSidebarLayoutChange}
      />
    </main>
  );
}

// Main component with provider wrapper
export default function ChatPage() {
  return (
    <ChatProvider>
      <ChatPageContent />
    </ChatProvider>
  );
}

