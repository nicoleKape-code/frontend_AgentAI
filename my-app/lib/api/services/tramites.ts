/**
 * Servicio de Trámites para gestionar sesiones, validaciones y checklists
 * Integrado con el backend gubernamental
 */

import { apiClient } from '../client'
import {
  TramiteType,
  DocumentType
} from '../../../types/api'
import type {
  CreateTramiteSessionRequest,
  TramiteSessionResponse,
  TramiteSessionDetailResponse,
  UpdateProfileRequest,
  ValidateCurpRequest,
  ValidationResponse,
  ChecklistResponse
} from '../../../types/api'

export class TramitesService {
  private static instance: TramitesService

  constructor() {
    // Singleton pattern
  }

  static getInstance(): TramitesService {
    if (!TramitesService.instance) {
      TramitesService.instance = new TramitesService()
    }
    return TramitesService.instance
  }

  // ==================== SESIONES DE TRÁMITE ====================

  /**
   * Crear nueva sesión de trámite
   */
  async createSession(
    tramiteType: TramiteType,
    conversationId?: string
  ): Promise<TramiteSessionResponse> {
    const request: CreateTramiteSessionRequest = {
      tramite_type: tramiteType,
      conversation_id: conversationId
    }

    return apiClient.post<TramiteSessionResponse>(
      '/api/v1/tramites/sessions',
      request
    )
  }

  /**
   * Obtener sesión de trámite completa
   */
  async getSession(sessionId: string): Promise<TramiteSessionDetailResponse> {
    return apiClient.get<TramiteSessionDetailResponse>(
      `/api/v1/tramites/sessions/${sessionId}`
    )
  }

  /**
   * Listar todas las sesiones de trámite
   */
  async getSessions(): Promise<TramiteSessionResponse[]> {
    return apiClient.get<TramiteSessionResponse[]>('/api/v1/tramites/sessions')
  }

  // ==================== PERFIL DE USUARIO ====================

  /**
   * Actualizar perfil de usuario
   */
  async updateProfile(
    sessionId: string,
    profileData: UpdateProfileRequest
  ): Promise<{ updated_fields: string[]; success: boolean; message: string }> {
    return apiClient.post(
      `/api/v1/tramites/sessions/${sessionId}/update-profile`,
      profileData
    )
  }

  /**
   * Actualizar dirección fiscal
   */
  async updateAddress(
    sessionId: string,
    addressData: {
      street?: string
      exterior_number?: string
      interior_number?: string
      neighborhood?: string
      postal_code?: string
      municipality?: string
      state?: string
      is_fiscal_address?: boolean
    }
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(
      `/api/v1/tramites/sessions/${sessionId}/update-address`,
      addressData
    )
  }

  // ==================== VALIDACIONES ====================

  /**
   * Validar CURP
   */
  async validateCurp(
    sessionId: string,
    curp: string
  ): Promise<ValidationResponse> {
    const request: ValidateCurpRequest = { curp }

    return apiClient.post<ValidationResponse>(
      `/api/v1/tramites/sessions/${sessionId}/validate-curp`,
      request
    )
  }

  /**
   * Validar documento
   */
  async validateDocument(
    sessionId: string,
    documentType: DocumentType,
    file: File,
    tramiteContext?: Record<string, unknown>
  ): Promise<ValidationResponse> {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', documentType)
    
    if (tramiteContext) {
      formData.append('tramite_context', JSON.stringify(tramiteContext))
    }

    return apiClient.request<ValidationResponse>(
      `/api/v1/tramites/sessions/${sessionId}/validate-document`,
      {
        method: 'POST',
        body: formData
        // No establecer Content-Type, el navegador manejará multipart/form-data
      }
    )
  }

  // ==================== CHECKLIST ====================

  /**
   * Generar checklist de requisitos
   */
  async generateChecklist(
    sessionId: string,
    tramiteType: TramiteType = TramiteType.SAT_RFC_INSCRIPCION_PF
  ): Promise<ChecklistResponse> {
    return apiClient.post<ChecklistResponse>(
      `/api/v1/tramites/sessions/${sessionId}/checklist`,
      { tramite_type: tramiteType }
    )
  }

  /**
   * Obtener checklist actual
   */
  async getChecklist(sessionId: string): Promise<ChecklistResponse> {
    return apiClient.get<ChecklistResponse>(
      `/api/v1/tramites/sessions/${sessionId}/checklist`
    )
  }

  // ==================== ACTIVIDADES ECONÓMICAS ====================

  /**
   * Declarar actividad económica
   */
  async declareEconomicActivity(
    sessionId: string,
    activityData: {
      activity_types: string[]
      expected_annual_income?: number
      has_employees?: boolean
      will_issue_invoices?: boolean
      additional_notes?: string
    }
  ): Promise<{ success: boolean; message: string }> {
    return apiClient.post(
      `/api/v1/tramites/sessions/${sessionId}/declare-activity`,
      activityData
    )
  }

  // ==================== UTILIDADES ====================

  /**
   * Obtener tipos de trámites disponibles
   */
  getTramiteTypes(): Array<{ value: TramiteType; label: string; description: string }> {
    return [
      {
        value: TramiteType.SAT_RFC_INSCRIPCION_PF,
        label: 'Inscripción al RFC Persona Física',
        description: 'Obtén tu Registro Federal de Contribuyentes por primera vez'
      },
      {
        value: TramiteType.SAT_RFC_ACTUALIZACION_PF,
        label: 'Actualización de RFC Persona Física',
        description: 'Actualiza datos en tu RFC existente'
      },
      {
        value: TramiteType.SAT_EFIRMA_NUEVA,
        label: 'Nueva e.firma (FIEL)',
        description: 'Obtén tu Firma Electrónica Avanzada'
      },
      {
        value: TramiteType.SAT_EFIRMA_RENOVACION,
        label: 'Renovación de e.firma',
        description: 'Renueva tu e.firma próxima a vencer'
      },
      {
        value: TramiteType.SAT_CONSTANCIA_SITUACION_FISCAL,
        label: 'Constancia de Situación Fiscal',
        description: 'Obtén tu constancia con datos fiscales actuales'
      }
    ]
  }

  /**
   * Obtener tipos de documento válidos
   */
  getDocumentTypes(): Array<{ value: DocumentType; label: string; description: string }> {
    return [
      {
        value: DocumentType.INE_FRONT,
        label: 'INE (Frente)',
        description: 'Credencial para votar lado frontal'
      },
      {
        value: DocumentType.INE_BACK,
        label: 'INE (Reverso)',
        description: 'Credencial para votar lado trasero'
      },
      {
        value: DocumentType.PASSPORT,
        label: 'Pasaporte',
        description: 'Pasaporte mexicano vigente'
      },
      {
        value: DocumentType.COMPROBANTE_DOMICILIO,
        label: 'Comprobante de Domicilio',
        description: 'Recibo de servicio no mayor a 3 meses'
      },
      {
        value: DocumentType.BIRTH_CERTIFICATE,
        label: 'Acta de Nacimiento',
        description: 'Acta de nacimiento certificada'
      }
    ]
  }

  /**
   * Validar datos antes de envío
   */
  validateProfileData(data: UpdateProfileRequest): { 
    isValid: boolean 
    errors: string[] 
  } {
    const errors: string[] = []

    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(data.email)) {
        errors.push('Formato de email inválido')
      }
    }

    if (data.phone) {
      const phoneRegex = /^\d{10,15}$/
      const cleanPhone = data.phone.replace(/\D/g, '')
      if (!phoneRegex.test(cleanPhone)) {
        errors.push('Teléfono debe tener entre 10 y 15 dígitos')
      }
    }

    if (data.birth_date) {
      const birthDate = new Date(data.birth_date)
      const now = new Date()
      const age = now.getFullYear() - birthDate.getFullYear()
      
      if (age < 0 || age > 120) {
        errors.push('Fecha de nacimiento inválida')
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calcular progreso de trámite
   */
  calculateProgress(session: TramiteSessionDetailResponse): {
    percentage: number
    completedSteps: number
    totalSteps: number
    nextStep?: string
  } {
    if (!session.checklist) {
      return { percentage: 0, completedSteps: 0, totalSteps: 0 }
    }

    const totalSteps = session.checklist.length
    const completedSteps = session.checklist.filter(
      item => item.status === 'completed'
    ).length

    const percentage = totalSteps > 0 ? (completedSteps / totalSteps) * 100 : 0

    const nextIncompleteItem = session.checklist.find(
      item => item.status !== 'completed'
    )

    return {
      percentage: Math.round(percentage),
      completedSteps,
      totalSteps,
      nextStep: nextIncompleteItem?.name
    }
  }
}

// Instancia global del servicio
export const tramitesService = TramitesService.getInstance()

// Debug helper
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
  (window as unknown as { __tramitesService: TramitesService }).__tramitesService = tramitesService
}