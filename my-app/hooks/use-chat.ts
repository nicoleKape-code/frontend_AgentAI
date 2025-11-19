/**
 * Hook personalizado para manejo de chat con el agente gubernamental
 * Incluye streaming, estado y manejo de errores
 */

import { useState, useCallback, useRef } from 'react'
import { chatService, type StreamCallbacks, type StreamState } from '../lib/api/services/chat'
import { ApiError } from '../lib/api/client'
import type { ConversationDetailResponse, MessageResponse } from '../types/api'

export interface UseChatOptions {
  conversationId?: string
  autoCreate?: boolean
  onError?: (error: ApiError) => void
  onNewConversation?: (conversationId: string) => void
  enableStreaming?: boolean
  debug?: boolean
}

export interface UseChatReturn {
  // Estado
  conversation: ConversationDetailResponse | null
  messages: MessageResponse[]
  isLoading: boolean
  isStreaming: boolean
  error: ApiError | null
  streamState: StreamState
  
  // Acciones
  sendMessage: (message: string, useStreaming?: boolean) => Promise<void>
  createConversation: (title?: string) => Promise<string>
  loadConversation: (id: string) => Promise<void>
  clearError: () => void
  reset: () => void
  
  // Referencias para componentes
  conversationId: string | null
}

export function useChat(options: UseChatOptions = {}): UseChatReturn {
  const {
    conversationId: initialConversationId,
    autoCreate = true,
    onError,
    onNewConversation,
    enableStreaming = true,
    debug = false
  } = options

  // Estado principal
  const [conversation, setConversation] = useState<ConversationDetailResponse | null>(null)
  const [messages, setMessages] = useState<MessageResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(initialConversationId || null)

  // Estado de streaming
  const [streamState, setStreamState] = useState<StreamState>({
    isStreaming: false,
    currentReasoning: '',
    toolsUsed: [],
    error: undefined
  })

  // Referencias
  const abortControllerRef = useRef<AbortController | null>(null)

  // ==================== UTILIDADES ====================

  const handleError = useCallback((err: ApiError) => {
    setError(err)
    setIsLoading(false)
    setIsStreaming(false)
    onError?.(err)
    
    if (debug) {
      console.error('Chat error:', err)
    }
  }, [onError, debug])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const log = useCallback((...args: unknown[]) => {
    if (debug) {
      console.log('[useChat]', ...args)
    }
  }, [debug])

  // ==================== CONVERSACIONES ====================

  const createConversation = useCallback(async (title?: string): Promise<string> => {
    log('Creating conversation', { title })
    setIsLoading(true)
    setError(null)

    try {
      const newConversation = await chatService.createConversation(title)
      setConversationId(newConversation.id)
      setConversation({
        ...newConversation,
        messages: []
      })
      onNewConversation?.(newConversation.id)
      log('Conversation created', newConversation.id)
      return newConversation.id
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [handleError, onNewConversation, log])

  const loadConversation = useCallback(async (id: string): Promise<void> => {
    log('Loading conversation', id)
    setIsLoading(true)
    setError(null)

    try {
      const loadedConversation = await chatService.getConversation(id)
      setConversation(loadedConversation)
      setMessages(loadedConversation.messages)
      setConversationId(id)
      log('Conversation loaded', { id, messageCount: loadedConversation.messages.length })
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [handleError, log])

  // ==================== MENSAJES ====================

  // Envío tradicional sin streaming
  const sendTraditionalMessage = useCallback(async (
    convId: string, 
    message: string
  ): Promise<void> => {
    setIsLoading(true)

    try {
      const response = await chatService.sendMessage(convId, message)
      
      // Agregar respuesta del asistente
      const assistantMessage: MessageResponse = {
        id: Date.now() + 1, // ID temporal
        role: 'assistant',
        content: response.response,
        created_at: new Date().toISOString()
      }

      setMessages(prev => [...prev, assistantMessage])
      
      // Actualizar título si cambió
      if (response.title_updated && response.new_title) {
        setConversation(prev => prev ? {
          ...prev,
          title: response.new_title!
        } : null)
      }

      log('Message sent successfully')
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [handleError, log])

  // Envío con streaming
  const sendStreamingMessage = useCallback(async (
    convId: string, 
    message: string
  ): Promise<void> => {
    setIsStreaming(true)
    setStreamState({
      isStreaming: true,
      currentReasoning: '',
      toolsUsed: [],
      error: undefined
    })

    // Mensaje temporal del asistente para streaming
    const tempAssistantMessage: MessageResponse = {
      id: Date.now() + 1,
      role: 'assistant',
      content: '',
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, tempAssistantMessage])

    const callbacks: StreamCallbacks = {
      onStart: (data) => {
        log('Stream started', data)
      },

      onReasoningToken: (token, fullReasoning) => {
        setStreamState(prev => ({
          ...prev,
          currentReasoning: fullReasoning || prev.currentReasoning + token
        }))
      },

      onToolStart: (toolName, toolInput) => {
        log('Tool started', toolName, toolInput)
        setStreamState(prev => ({
          ...prev,
          toolsUsed: [...prev.toolsUsed, {
            name: toolName,
            input: toolInput,
            startTime: Date.now()
          }]
        }))
      },

      onToolEnd: (toolName, toolOutput) => {
        log('Tool ended', toolName, toolOutput)
        setStreamState(prev => ({
          ...prev,
          toolsUsed: prev.toolsUsed.map(tool => 
            tool.name === toolName && !tool.endTime ? {
              ...tool,
              output: toolOutput,
              endTime: Date.now()
            } : tool
          )
        }))
      },

      onFinalResponse: (response, data) => {
        log('Final response', { responseLength: response.length, showAddressForm: data.show_address_form })
        
        // Actualizar mensaje con respuesta final y formulario especial si es necesario
        setMessages(prev => prev.map(msg => 
          msg.id === tempAssistantMessage.id ? {
            ...msg,
            content: response,
            showAddressForm: data.show_address_form || false,
            messageType: data.show_address_form ? 'address_form' as const : undefined
          } : msg
        ))

        // Actualizar título si cambió
        if (data.title_update_result) {
          setConversation(prev => prev ? {
            ...prev,
            title: data.title_update_result || null
          } : null)
        }
      },

      onError: (error) => {
        log('Stream error', error)
        setStreamState(prev => ({ ...prev, error }))
        handleError(error)
      },

      onComplete: () => {
        log('Stream completed')
        setIsStreaming(false)
        setStreamState(prev => ({ ...prev, isStreaming: false }))
      }
    }

    try {
      await chatService.streamMessage(convId, message, callbacks)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
    }
  }, [handleError, log])

  // Función principal de envío de mensajes
  const sendMessage = useCallback(async (
    message: string, 
    useStreaming: boolean = enableStreaming
  ): Promise<void> => {
    if (!message.trim()) return

    log('Sending message', { message: message.slice(0, 50) + '...', useStreaming })

    let currentConversationId = conversationId

    // Auto-crear conversación si no existe
    if (!currentConversationId && autoCreate) {
      try {
        currentConversationId = await createConversation()
      } catch {
        return // Error ya manejado en createConversation
      }
    }

    if (!currentConversationId) {
      handleError(new ApiError(400, 'No conversation available'))
      return
    }

    // Cancelar request anterior si existe
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    abortControllerRef.current = new AbortController()

    // Agregar mensaje del usuario inmediatamente
    const userMessage: MessageResponse = {
      id: Date.now(), // ID temporal
      role: 'user',
      content: message,
      created_at: new Date().toISOString()
    }

    setMessages(prev => [...prev, userMessage])
    setError(null)

    if (useStreaming) {
      await sendStreamingMessage(currentConversationId, message)
    } else {
      await sendTraditionalMessage(currentConversationId, message)
    }
  }, [conversationId, autoCreate, enableStreaming, createConversation, handleError, log, sendStreamingMessage, sendTraditionalMessage])

  // ==================== RESET ====================

  const reset = useCallback(() => {
    log('Resetting chat state')
    setConversation(null)
    setMessages([])
    setIsLoading(false)
    setIsStreaming(false)
    setError(null)
    setConversationId(initialConversationId || null)
    setStreamState({
      isStreaming: false,
      currentReasoning: '',
      toolsUsed: [],
      error: undefined
    })
    
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [initialConversationId, log])

  return {
    // Estado
    conversation,
    messages,
    isLoading,
    isStreaming,
    error,
    streamState,
    
    // Acciones
    sendMessage,
    createConversation,
    loadConversation,
    clearError,
    reset,
    
    // Referencias
    conversationId
  }
}