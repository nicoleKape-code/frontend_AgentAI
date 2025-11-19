/**
 * Servicio de Chat para comunicación con el agente gubernamental
 * Maneja conversaciones, mensajes y streaming en tiempo real
 */

import { apiClient, ApiError } from '../client'
import type { 
  ChatRequest,
  ChatResponse,
  CreateConversationRequest,
  ConversationResponse,
  ConversationDetailResponse,
  StreamEvent
} from '../../../types/api'

export class ChatService {
  private static instance: ChatService
  
  constructor() {
    // Singleton pattern para mantener estado global si es necesario
  }

  static getInstance(): ChatService {
    if (!ChatService.instance) {
      ChatService.instance = new ChatService()
    }
    return ChatService.instance
  }

  // ==================== CONVERSACIONES ====================

  /**
   * Crear nueva conversación
   */
  async createConversation(title?: string): Promise<ConversationResponse> {
    const request: CreateConversationRequest = title ? { title } : {}
    
    return apiClient.post<ConversationResponse>(
      '/api/v1/chat/conversations',
      request
    )
  }

  /**
   * Obtener todas las conversaciones
   */
  async getConversations(): Promise<ConversationResponse[]> {
    return apiClient.get<ConversationResponse[]>('/api/v1/chat/conversations')
  }

  /**
   * Obtener conversación específica con mensajes
   */
  async getConversation(conversationId: string): Promise<ConversationDetailResponse> {
    return apiClient.get<ConversationDetailResponse>(
      `/api/v1/chat/conversations/${conversationId}`
    )
  }

  /**
   * Eliminar conversación
   */
  async deleteConversation(conversationId: string): Promise<void> {
    return apiClient.delete(`/api/v1/chat/conversations/${conversationId}`)
  }

  // ==================== MENSAJES ====================

  /**
   * Enviar mensaje de manera tradicional (sin streaming)
   */
  async sendMessage(
    conversationId: string, 
    message: string
  ): Promise<ChatResponse> {
    const request: ChatRequest = { message }
    
    return apiClient.post<ChatResponse>(
      `/api/v1/chat/conversations/${conversationId}/messages`,
      request,
      { timeout: 60000 } // 60 segundos para respuestas de IA
    )
  }

  // ==================== STREAMING ====================

  /**
   * Enviar mensaje con streaming en tiempo real
   */
  async streamMessage(
    conversationId: string,
    message: string,
    callbacks: StreamCallbacks
  ): Promise<void> {
    const { 
      onError,
      onComplete
    } = callbacks

    try {
      await apiClient.stream(
        `/api/v1/chat/conversations/${conversationId}/stream`,
        { message },
        (chunk: unknown) => {
          this.handleStreamEvent(chunk as StreamEvent, callbacks)
        },
        onError ? (error: Error) => onError(error as ApiError) : undefined,
        { timeout: 120000 } // 2 minutos para streaming
      )
      
      onComplete?.()
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      onError?.(apiError)
    }
  }

  /**
   * Procesar eventos del stream
   */
  private handleStreamEvent(event: StreamEvent, callbacks: StreamCallbacks): void {
    try {
      switch (event.event) {
        case 'agent_start':
          callbacks.onStart?.(event.data)
          break

        case 'reasoning_token':
          callbacks.onReasoningToken?.(event.data.token, event.data.full_reasoning)
          break

        case 'tool_start':
          callbacks.onToolStart?.(event.data.tool_name, event.data.tool_input)
          break

        case 'tool_end':
          callbacks.onToolEnd?.(event.data.tool_name, event.data.tool_output)
          break

        case 'final_response':
          callbacks.onFinalResponse?.(event.data.response, event.data)
          break

        case 'error':
          callbacks.onError?.(new ApiError(500, event.data.error, event.data.details))
          break

        default:
          console.warn('Unknown stream event:', (event as StreamEvent).event, (event as StreamEvent).data)
      }
    } catch (error) {
      console.error('Error handling stream event:', error)
      callbacks.onError?.(new ApiError(500, 'Error processing stream event'))
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Verificar si el servicio está disponible
   */
  async healthCheck(): Promise<boolean> {
    try {
      await apiClient.get('/api/v1/health')
      return true
    } catch {
      return false
    }
  }

  /**
   * Limpiar estado del servicio
   */
  reset(): void {
    // Limpiar cualquier estado interno si es necesario
  }
}

// ==================== INTERFACES ====================

export interface StreamCallbacks {
  onStart?: (data: { 
    conversation_id: string
    session_id: string 
    user_message: string 
  }) => void
  
  onReasoningToken?: (token: string, fullReasoning?: string) => void
  
  onToolStart?: (toolName: string, toolInput: unknown) => void
  
  onToolEnd?: (toolName: string, toolOutput: unknown) => void
  
  onFinalResponse?: (response: string, data: {
    conversation_id: string
    session_id: string
    title_update_result?: string
    show_address_form?: boolean
  }) => void
  
  onError?: (error: ApiError) => void
  
  onComplete?: () => void
}

export interface StreamState {
  isStreaming: boolean
  currentReasoning: string
  toolsUsed: Array<{
    name: string
    input: unknown
    output?: unknown
    startTime: number
    endTime?: number
  }>
  error?: ApiError
}

// ==================== HELPERS ====================

/**
 * Helper para crear callbacks básicos de streaming
 */
export function createBasicStreamCallbacks(
  onMessage: (message: string) => void,
  onError?: (error: ApiError) => void,
  onComplete?: () => void
): StreamCallbacks {
  return {
    onFinalResponse: (response) => onMessage(response),
    onError,
    onComplete,
  }
}

/**
 * Helper para crear callbacks con debug completo
 */
export function createDebugStreamCallbacks(
  onMessage: (message: string) => void,
  onDebug?: (event: string, data: unknown) => void
): StreamCallbacks {
  return {
    onStart: (data) => {
      onDebug?.('start', data)
    },
    onReasoningToken: (token, full) => {
      onDebug?.('reasoning', { token, full })
    },
    onToolStart: (name, input) => {
      onDebug?.('tool_start', { name, input })
    },
    onToolEnd: (name, output) => {
      onDebug?.('tool_end', { name, output })
    },
    onFinalResponse: (response, data) => {
      onDebug?.('response', data)
      onMessage(response)
    },
    onError: (error) => {
      onDebug?.('error', error)
    },
  }
}

// Instancia global del servicio
export const chatService = ChatService.getInstance()

// Debug helper
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
  (window as unknown as { __chatService: ChatService }).__chatService = chatService
}