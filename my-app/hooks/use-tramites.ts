/**
 * Hook para gestión de trámites gubernamentales
 * Maneja sesiones, validaciones, checklist y progreso
 */

import { useState, useCallback } from 'react'
import { tramitesService } from '../lib/api/services/tramites'
import { ApiError } from '../lib/api/client'
import {
  TramiteType,
  DocumentType
} from '../types/api'
import type {
  TramiteSessionDetailResponse,
  ChecklistResponse,
  ValidationResponse,
  UpdateProfileRequest
} from '../types/api'

export interface UseTramitesOptions {
  sessionId?: string
  onError?: (error: ApiError) => void
  autoLoadSession?: boolean
}

export interface UseTramitesReturn {
  // Estado
  session: TramiteSessionDetailResponse | null
  checklist: ChecklistResponse | null
  isLoading: boolean
  error: ApiError | null
  progress: {
    percentage: number
    completedSteps: number
    totalSteps: number
    nextStep?: string
  }

  // Acciones
  createSession: (tramiteType: TramiteType, conversationId?: string) => Promise<string>
  loadSession: (sessionId: string) => Promise<void>
  updateProfile: (data: UpdateProfileRequest) => Promise<void>
  validateCurp: (curp: string) => Promise<ValidationResponse>
  validateDocument: (file: File, documentType: string) => Promise<ValidationResponse>
  generateChecklist: () => Promise<void>
  clearError: () => void
  reset: () => void

  // Estado útil
  sessionId: string | null
  isReady: boolean
}

export function useTramites(options: UseTramitesOptions = {}): UseTramitesReturn {
  const {
    sessionId: initialSessionId,
    onError,
    autoLoadSession = true
  } = options

  // Estado principal
  const [session, setSession] = useState<TramiteSessionDetailResponse | null>(null)
  const [checklist, setChecklist] = useState<ChecklistResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<ApiError | null>(null)
  const [sessionId, setSessionId] = useState<string | null>(initialSessionId || null)

  // Estado derivado
  const progress = session ? tramitesService.calculateProgress(session) : {
    percentage: 0,
    completedSteps: 0,
    totalSteps: 0
  }

  const isReady = session !== null && !isLoading && !error

  // Manejo de errores
  const handleError = useCallback((err: ApiError) => {
    setError(err)
    setIsLoading(false)
    onError?.(err)
  }, [onError])

  const clearError = useCallback(() => {
    setError(null)
  }, [])

  // ==================== SESIONES ====================

  // Generar checklist (declarado primero para evitar dependencias circulares)
  const generateChecklist = useCallback(async (): Promise<void> => {
    if (!sessionId) {
      throw new ApiError(400, 'No session available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const checklistData = await tramitesService.generateChecklist(
        sessionId,
        TramiteType.SAT_RFC_INSCRIPCION_PF
      )
      setChecklist(checklistData)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, handleError])

  const loadSession = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const sessionData = await tramitesService.getSession(id)
      setSession(sessionData)
      setSessionId(id)

      // Generar checklist si no existe
      if (!sessionData.checklist || sessionData.checklist.length === 0) {
        await generateChecklist()
      }
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [handleError, generateChecklist])

  const createSession = useCallback(async (
    tramiteType: TramiteType,
    conversationId?: string
  ): Promise<string> => {
    setIsLoading(true)
    setError(null)

    try {
      const newSession = await tramitesService.createSession(tramiteType, conversationId)
      setSessionId(newSession.session_id)
      
      // Cargar sesión completa
      if (autoLoadSession) {
        await loadSession(newSession.session_id)
      }
      
      return newSession.session_id
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [autoLoadSession, handleError, loadSession])

  // ==================== PERFIL ====================

  const updateProfile = useCallback(async (data: UpdateProfileRequest): Promise<void> => {
    if (!sessionId) {
      throw new ApiError(400, 'No session available')
    }

    setIsLoading(true)
    setError(null)

    try {
      // Validar datos antes de enviar
      const validation = tramitesService.validateProfileData(data)
      if (!validation.isValid) {
        throw new ApiError(400, validation.errors.join(', '))
      }

      await tramitesService.updateProfile(sessionId, data)
      
      // Recargar sesión para obtener datos actualizados
      await loadSession(sessionId)
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, handleError, loadSession])

  // ==================== VALIDACIONES ====================

  const validateCurp = useCallback(async (curp: string): Promise<ValidationResponse> => {
    if (!sessionId) {
      throw new ApiError(400, 'No session available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await tramitesService.validateCurp(sessionId, curp)
      
      // Si la validación es exitosa, actualizar perfil automáticamente
      if (result.is_valid && result.extracted_data) {
        const profileUpdate: UpdateProfileRequest = {}
        
        // Mapear datos extraídos del CURP
        if (result.extracted_data.fecha_nacimiento_parsed) {
          profileUpdate.birth_date = result.extracted_data.fecha_nacimiento_parsed as string
        }
        
        if (Object.keys(profileUpdate).length > 0) {
          await updateProfile(profileUpdate)
        }
      }
      
      return result
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, handleError, updateProfile])

  const validateDocument = useCallback(async (
    file: File,
    documentType: string
  ): Promise<ValidationResponse> => {
    if (!sessionId) {
      throw new ApiError(400, 'No session available')
    }

    setIsLoading(true)
    setError(null)

    try {
      const result = await tramitesService.validateDocument(
        sessionId,
        documentType as DocumentType,
        file
      )
      
      // Recargar sesión para reflejar documentos validados
      await loadSession(sessionId)
      
      return result
    } catch (error) {
      const apiError = error instanceof ApiError ? error : new ApiError(0, String(error))
      handleError(apiError)
      throw apiError
    } finally {
      setIsLoading(false)
    }
  }, [sessionId, handleError, loadSession])

  // ==================== RESET ====================

  const reset = useCallback(() => {
    setSession(null)
    setChecklist(null)
    setIsLoading(false)
    setError(null)
    setSessionId(initialSessionId || null)
  }, [initialSessionId])

  return {
    // Estado
    session,
    checklist,
    isLoading,
    error,
    progress,

    // Acciones
    createSession,
    loadSession,
    updateProfile,
    validateCurp,
    validateDocument,
    generateChecklist,
    clearError,
    reset,

    // Estado útil
    sessionId,
    isReady
  }
}