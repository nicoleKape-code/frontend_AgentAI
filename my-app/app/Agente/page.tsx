"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { TramiteType } from "@/types/api";
import { useChat } from "@/hooks/use-chat";
import { useTramites } from "@/hooks/use-tramites";
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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  PaperclipIcon,
  CheckCircleIcon,
  AlertCircleIcon,
  MenuIcon,
  XIcon,
  ArrowUpIcon,
} from "lucide-react";
import { BubbleBackground } from "@/components/ui/BubbleBackground";
import { cn } from "@/lib/utils";

// Interfaces para componentes UI
interface BaseComponentProps {
  children: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

// Componentes UI que necesitamos crear temporalmente
const Card = ({ children, className, ...props }: BaseComponentProps) => (
  <div
    className={cn(
      "rounded-lg border bg-card text-card-foreground shadow-sm",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const CardHeader = ({ children, className, ...props }: BaseComponentProps) => (
  <div className={cn("flex flex-col space-y-1.5 p-6", className)} {...props}>
    {children}
  </div>
);

const CardTitle = ({ children, className, ...props }: BaseComponentProps) => (
  <h3
    className={cn(
      "text-2xl font-semibold leading-none tracking-tight",
      className
    )}
    {...props}
  >
    {children}
  </h3>
);

const CardDescription = ({
  children,
  className,
  ...props
}: BaseComponentProps) => (
  <p className={cn("text-sm text-muted-foreground", className)} {...props}>
    {children}
  </p>
);

const CardContent = ({ children, className, ...props }: BaseComponentProps) => (
  <div className={cn("p-6 pt-0", className)} {...props}>
    {children}
  </div>
);

const Alert = ({ children, className, ...props }: BaseComponentProps) => (
  <div
    className={cn(
      "relative w-full rounded-lg border p-4 [&>svg~*]:pl-7 [&>svg+div]:translate-y-[-3px] [&>svg]:absolute [&>svg]:left-4 [&>svg]:top-4 [&>svg]:text-foreground",
      className
    )}
    {...props}
  >
    {children}
  </div>
);

const AlertDescription = ({
  children,
  className,
  ...props
}: BaseComponentProps) => (
  <div className={cn("text-sm [&_p]:leading-relaxed", className)} {...props}>
    {children}
  </div>
);

export default function AgentePage() {
  const [input, setInput] = useState("");
  const [showSidebar, setShowSidebar] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Ref para el scroll automático
  const messagesEndRef = useRef<HTMLDivElement>(null);
  // Ref para mantener el foco en el input
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Hooks integrados
  const chat = useChat({
    enableStreaming: true,
    debug: true,
    autoCreate: true,
    onNewConversation: (conversationId) => {
      console.log("Nueva conversación creada:", conversationId);
    },
  });

  const tramites = useTramites({
    autoLoadSession: false,
    onError: (error) => {
      console.error("Error en trámites:", error);
    },
  });

  // Función para scroll automático
  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Auto-scroll cuando cambian los mensajes o el streaming
  useEffect(() => {
    scrollToBottom();
  }, [chat.messages, chat.isStreaming, scrollToBottom]);

  // Auto-crear sesión de trámite cuando se crea conversación
  useEffect(() => {
    const initializeSession = async () => {
      if (chat.conversationId && !tramites.sessionId && !tramites.isLoading) {
        try {
          console.log(
            "Creando sesión de trámite para conversación:",
            chat.conversationId
          );
          await tramites.createSession(
            TramiteType.SAT_RFC_INSCRIPCION_PF,
            chat.conversationId
          );
        } catch (error) {
          console.error("Error al crear sesión de trámite:", error);
        }
      }
      setIsInitializing(false);
    };

    initializeSession();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chat.conversationId]);

  // Manejo del envío de mensajes
  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || chat.isLoading || chat.isStreaming) return;

      const message = input.trim();
      setInput("");

      try {
        await chat.sendMessage(message);
      } catch (error) {
        console.error("Error al enviar mensaje:", error);
      }

      // Mantener el foco en el input después de enviar
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    },
    [input, chat]
  );

  // Loading state inicial
  if (isInitializing) {
    return (
      <main className="relative min-h-screen w-full overflow-hidden">
        <BubbleBackground interactive={true} className="fixed inset-0 z-0" />
        <div className="relative z-10 flex items-center justify-center min-h-screen">
          <div className="text-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
            <p>Inicializando agente gubernamental...</p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="relative h-screen w-full flex flex-col">
      {/* Background - siempre visible */}
      <BubbleBackground interactive={true} className="fixed inset-0 z-0" />

      {chat.messages.length === 0 ? (
        /* Estado inicial - Input centrado */
        <div className="flex-1 flex flex-col items-center justify-center p-4 relative z-10">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4">
              Agente Gubernamental
            </h1>
            <p className="text-white opacity-70">
              ¿En qué puedo ayudarte hoy?
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
                placeholder="¿En qué puedo ayudarte hoy?"
                disabled={chat.isLoading || chat.isStreaming}
                className="text-white placeholder:text-white/60 bg-transparent resize-none rounded-2xl"
              />
              <PromptInputToolbar className="flex items-center gap-2">
                <PromptInputButton className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-8 h-8 flex items-center justify-center">
                  <PaperclipIcon className="w-4 h-4" />
                </PromptInputButton>
                <PromptInputSubmit
                  disabled={!input.trim() || chat.isLoading || chat.isStreaming}
                  status={chat.isStreaming ? "streaming" : undefined}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-0 p-0",
                    !input.trim() || chat.isLoading || chat.isStreaming
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
              {chat.messages.map((message) => (
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
                    name={message.role === "user" ? "Usuario" : "Agente SAT"}
                  />
                  <MessageContent>
                    <Response>{message.content}</Response>
                  </MessageContent>
                </Message>
              ))}

              {/* Indicador de carga simple cuando está escribiendo */}
              {chat.isStreaming && (
                <div className="flex items-center gap-2 text-white/70 text-sm">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-100"></div>
                    <div className="w-2 h-2 bg-white/50 rounded-full animate-pulse delay-200"></div>
                  </div>
                  <span>Agente está escribiendo...</span>
                </div>
              )}

              {/* Errores */}
              {chat.error && (
                <Alert className="bg-red-500/20 border-red-400/30">
                  <AlertCircleIcon className="h-4 w-4 text-red-400" />
                  <AlertDescription className="text-red-100">
                    Error: {chat.error.message}
                  </AlertDescription>
                </Alert>
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
                  placeholder="¿En qué puedo ayudarte hoy?"
                  disabled={chat.isLoading || chat.isStreaming}
                  className="text-white placeholder:text-white/60 bg-transparent resize-none rounded-2xl"
                />
                <PromptInputToolbar className="flex items-center gap-2">
                  <PromptInputButton className="text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition-colors w-8 h-8 flex items-center justify-center">
                    <PaperclipIcon className="w-4 h-4" />
                  </PromptInputButton>
                  <PromptInputSubmit
                    disabled={!input.trim() || chat.isLoading || chat.isStreaming}
                    status={chat.isStreaming ? "streaming" : undefined}
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 border-0 p-0",
                      !input.trim() || chat.isLoading || chat.isStreaming
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

      {/* Botón flotante para mostrar sidebar cuando hay mensajes */}
      {chat.messages.length > 0 && tramites.session && (
        <Button
          variant="outline"
          size="icon"
          className="fixed top-4 right-4 z-30 backdrop-blur-sm bg-black/20 border-white/20 text-white hover:bg-black/40"
          onClick={() => setShowSidebar(!showSidebar)}
        >
          <MenuIcon className="h-5 w-5" />
        </Button>
      )}

      {/* Sidebar opcional */}
      <TramiteSidebar
        tramites={tramites}
        isVisible={showSidebar}
        onClose={() => setShowSidebar(false)}
      />
    </main>
  );
}

// Interfaces para el sidebar
interface TramiteSidebarProps {
  tramites: ReturnType<typeof useTramites>;
  isVisible: boolean;
  onClose: () => void;
}

// Sidebar de información de trámite
function TramiteSidebar({ tramites, isVisible, onClose }: TramiteSidebarProps) {
  if (!tramites.session) {
    return null;
  }

  return (
    <>
      {/* Overlay para móvil */}
      {isVisible && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "fixed right-0 top-0 h-full w-80 backdrop-blur-md bg-black/40 border-l border-white/10 transform transition-transform duration-200 ease-in-out z-40 overflow-y-auto",
          isVisible ? "translate-x-0" : "translate-x-full"
        )}
      >
        <div className="p-4">
          {/* Header del sidebar */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg text-white">
              Estado del Trámite
            </h3>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="text-white hover:bg-white/20"
            >
              <XIcon className="h-4 w-4" />
            </Button>
          </div>

          {/* Progreso */}
          <Card className="mb-4 bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">
                Progreso General
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-white">
                  <span>Completado</span>
                  <span>{tramites.progress.percentage}%</span>
                </div>
                <div className="w-full bg-white/20 rounded-full h-2">
                  <div
                    className="bg-blue-400 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${tramites.progress.percentage}%` }}
                  />
                </div>
                <p className="text-xs text-white/70">
                  {tramites.progress.completedSteps} de{" "}
                  {tramites.progress.totalSteps} pasos completados
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Información de la sesión */}
          <Card className="mb-4 bg-white/10 border-white/20">
            <CardHeader className="pb-3">
              <CardTitle className="text-base text-white">
                RFC - Persona Física
              </CardTitle>
              <CardDescription className="text-white/70">
                Inscripción al Registro Federal de Contribuyentes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className="text-xs text-white border-white/30"
                  >
                    {tramites.session.current_phase}
                  </Badge>
                </div>
                <p className="text-white/70">Modalidad recomendada: En línea</p>
              </div>
            </CardContent>
          </Card>

          {/* Checklist */}
          {tramites.checklist && (
            <Card className="bg-white/10 border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-base text-white">
                  Requisitos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {tramites.checklist.checklist.map((item, index: number) => (
                    <div key={index} className="flex items-start gap-2">
                      {item.status === "completed" ? (
                        <CheckCircleIcon className="h-4 w-4 text-green-400 mt-0.5 shrink-0" />
                      ) : (
                        <div className="h-4 w-4 border border-white/50 rounded-full mt-0.5 shrink-0" />
                      )}
                      <div className="flex-1">
                        <p
                          className={cn(
                            "text-sm text-white",
                            item.status === "completed" &&
                              "line-through text-white/50"
                          )}
                        >
                          {item.name}
                        </p>
                        {item.is_mandatory && (
                          <Badge variant="destructive" className="text-xs mt-1">
                            Obligatorio
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
