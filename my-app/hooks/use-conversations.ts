/**
 * Hook para manejo de conversaciones del chat
 * Incluye listado, creación y eliminación de conversaciones
 */

import { useState, useCallback, useEffect, useRef } from 'react'
import { chatService } from '../lib/api/services/chat'
import { ApiError } from '../lib/api/client'
import type { ConversationResponse } from '../types/api'

export interface UseConversationsOptions {
  autoLoad?: boolean
  onError?: (error: ApiError) => void
  debug?: boolean
}

export interface UseConversationsReturn {
  // Estado
  conversations: ConversationResponse[]
  isLoading: boolean
  error: ApiError | null
  
  // Acciones
  loadConversations: () => Promise<void>
  createConversation: (title?: string) => Promise<ConversationResponse>
  deleteConversation: (conversationId: string) => Promise<void>
  clearError: () => void
  refresh: () => Promise<void>
}

export function useConversations(options: UseConversationsOptions = {}): UseConversationsReturn {
  const {
    autoLoad = true,
    onError,
    debug = false
  } = options

  // Referencias para evitar re-renders
  const onErrorRef = useRef(onError)
  const debugRef = useRef(debug)

  // Actualizar refs cuando cambien las props
  onErrorRef.current = onError
  debugRef.current = debug

  // Estado principal
  const [conversations, setConversations] = useState<ConversationResponse[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)

  // ==================== UTILIDADES ====================

  const handleError = useCallback((err: ApiError) => {
    setError(err)
    setIsLoading(false)
    onErrorRef.current?.(err)
    
    if (debugRef.current) {
      console.error('Conversations error:', err)
    }
  }, [])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  const log = useCallback((...args: unknown[]) => {
    if (debugRef.current) {
      console.log('[useConversations]', ...args)
    }
  }, [])

  // ==================== CARGAR CONVERSACIONES ====================

  const loadConversations = useCallback(async (): Promise<void> => {
    log('Loading conversations')
    setIsLoading(true)
    setError(null)

    try {
      const loadedConversations = await chatService.getConversations()
      
      // Ordenar por fecha de actualización (más recientes primero)
      const sortedConversations = loadedConversations.sort((a, b) => 
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      )
      
      setConversations(sortedConversations)
      log('Conversations loaded', { count: sortedConversations.length })
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [handleError, log])

  // ==================== CREAR CONVERSACIÓN ====================

  const createConversation = useCallback(async (title?: string): Promise<ConversationResponse> => {
    log('Creating conversation', { title })
    setError(null)

    try {
      const newConversation = await chatService.createConversation(title)
      
      // Agregar al principio de la lista
      setConversations(prev => [newConversation, ...prev])
      log('Conversation created', newConversation.id)
      
      return newConversation
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    }
  }, [handleError, log])

  // ==================== ELIMINAR CONVERSACIÓN ====================

  const deleteConversation = useCallback(async (conversationId: string): Promise<void> => {
    log('Deleting conversation', conversationId)
    setError(null)

    try {
      await chatService.deleteConversation(conversationId)
      
      // Remover de la lista
      setConversations(prev => prev.filter(conv => conv.id !== conversationId))
      log('Conversation deleted', conversationId)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    }
  }, [handleError, log])

  // ==================== REFRESCAR ====================

  const refresh = useCallback(async (): Promise<void> => {
    log('Refreshing conversations')
    await loadConversations()
  }, [loadConversations, log])

  // ==================== EFECTOS ====================

  // Auto-cargar conversaciones al montar
  useEffect(() => {
    if (autoLoad) {
      loadConversations()
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoLoad])

  // ==================== RETORNO ====================

  return {
    // Estado
    conversations,
    isLoading,
    error,
    
    // Acciones
    loadConversations,
    createConversation,
    deleteConversation,
    clearError,
    refresh
  }
}