/**
 * Tipos TypeScript para la API del backend gubernamental
 * Sincronizados con los schemas de FastAPI
 */

// ==================== BASE TYPES ====================

export interface BaseResponse {
  success?: boolean
  message?: string
  errors?: string[]
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  size: number
  pages: number
}

// ==================== CHAT & CONVERSATIONS ====================

export interface ChatRequest {
  message: string
}

export interface CreateConversationRequest {
  title?: string
}

export interface MessageResponse {
  id: number
  role: 'user' | 'assistant'
  content: string
  created_at: string
}

export interface ConversationResponse {
  id: string
  title: string | null
  created_at: string
  updated_at: string
}

export interface ConversationDetailResponse extends ConversationResponse {
  messages: MessageResponse[]
}

export interface ChatResponse {
  response: string
  conversation_id: string
  title_updated: boolean
  new_title?: string
}

// ==================== STREAMING EVENTS ====================

export interface StreamEventBase {
  event: string
  data: Record<string, unknown>
  timestamp?: string
}

export interface AgentStartEvent extends StreamEventBase {
  event: 'agent_start'
  data: {
    conversation_id: string
    session_id: string
    user_message: string
  }
}

export interface ReasoningTokenEvent extends StreamEventBase {
  event: 'reasoning_token'
  data: {
    token: string
    full_reasoning?: string
  }
}

export interface ToolStartEvent extends StreamEventBase {
  event: 'tool_start'
  data: {
    tool_name: string
    tool_input: Record<string, unknown>
  }
}

export interface ToolEndEvent extends StreamEventBase {
  event: 'tool_end'
  data: {
    tool_name: string
    tool_output: unknown
  }
}

export interface FinalResponseEvent extends StreamEventBase {
  event: 'final_response'
  data: {
    response: string
    conversation_id: string
    session_id: string
    title_update_result?: string
  }
}

export interface ErrorEvent extends StreamEventBase {
  event: 'error'
  data: {
    error: string
    details?: string
  }
}

export type StreamEvent = 
  | AgentStartEvent 
  | ReasoningTokenEvent 
  | ToolStartEvent 
  | ToolEndEvent 
  | FinalResponseEvent 
  | ErrorEvent

// ==================== TRAMITE SESSIONS ====================

export interface CreateTramiteSessionRequest {
  tramite_type: TramiteType
  conversation_id?: string
}

export interface TramiteSessionResponse {
  session_id: string
  conversation_id: string
  tramite_type: string
  current_phase: string
  completion_percentage: number
  is_completed: boolean
  created_at: string
}

export interface TramiteSessionDetailResponse extends TramiteSessionResponse {
  user_profile?: UserProfileData
  validated_documents: ValidatedDocumentData[]
  checklist: ChecklistItemData[]
  updated_at?: string
}

// ==================== USER PROFILE ====================

export interface UpdateProfileRequest {
  full_name?: string
  first_name?: string
  last_name?: string
  mother_last_name?: string
  birth_date?: string // ISO date
  nationality?: string
  email?: string
  phone?: string
}

export interface ContactInfoData {
  email?: string
  phone?: string
  alternative_phone?: string
}

export interface AddressData {
  street?: string
  exterior_number?: string
  interior_number?: string
  neighborhood?: string
  postal_code?: string
  municipality?: string
  state?: string
  country?: string
  is_fiscal_address?: boolean
}

export interface UserProfileData {
  id: number
  full_name?: string
  first_name?: string
  last_name?: string
  mother_last_name?: string
  birth_date?: string
  nationality: string
  is_minor: boolean
  has_legal_representative: boolean
  contact_info?: ContactInfoData
  address?: AddressData
}

// ==================== VALIDATION ====================

export interface ValidateCurpRequest {
  curp: string
}

export interface ValidateDocumentRequest {
  document_type: DocumentType
  tramite_context?: Record<string, unknown>
}

export interface ValidationResponse {
  is_valid: boolean
  confidence_score: number
  confidence_level: string
  extracted_data: Record<string, unknown>
  errors: string[]
  warnings: string[]
  suggestions: string[]
}

export interface ValidatedIdentifierData {
  id: number
  identifier_type: string
  value: string
  is_valid: boolean
  validation_score: number
  extracted_data: Record<string, unknown>
  validation_errors: string[]
  validated_at: string
}

export interface ValidatedDocumentData {
  id: number
  document_type: string
  file_name?: string
  file_size?: number
  extracted_data: Record<string, unknown>
  validation_score: number
  confidence_level: string
  validation_errors: string[]
  expiry_date?: string
  is_valid: boolean
  validated_at: string
}

// ==================== CHECKLIST ====================

export interface RequirementResponse {
  id: string
  name: string
  description: string
  status: RequirementStatus
  is_mandatory: boolean
  validation_notes: string[]
  help_text?: string
}

export interface NextStepResponse {
  step_number: number
  title: string
  description: string
  estimated_time?: string
  url?: string
}

export interface ChecklistResponse {
  checklist: RequirementResponse[]
  completion_percentage: number
  next_steps: NextStepResponse[]
  preferred_modality: string
  warnings: string[]
  estimated_time: string
  generated_at: string
}

export interface ChecklistItemData {
  id: number
  requirement_id: string
  name: string
  description?: string
  status: string
  is_mandatory: boolean
  validation_notes: string[]
  help_text?: string
  order_index: number
}

// ==================== DIPOMEX (Códigos Postales) ====================

export interface EstadoData {
  id: string
  nombre: string
  abreviatura: string
}

export interface MunicipioData {
  id: string
  nombre: string
  estado_id: string
}

export interface ColoniaData {
  id: string
  nombre: string
  codigo_postal: string
  municipio_id: string
  estado_id: string
}

export interface CodigoPostalData {
  codigo_postal: string
  estado: string
  municipio: string
  colonias: string[]
}

// ==================== ENUMS ====================

export enum TramiteType {
  SAT_RFC_INSCRIPCION_PF = 'SAT_RFC_INSCRIPCION_PF',
  SAT_RFC_ACTUALIZACION_PF = 'SAT_RFC_ACTUALIZACION_PF',
  SAT_EFIRMA_NUEVA = 'SAT_EFIRMA_NUEVA',
  SAT_EFIRMA_RENOVACION = 'SAT_EFIRMA_RENOVACION',
  SAT_CONSTANCIA_SITUACION_FISCAL = 'SAT_CONSTANCIA_SITUACION_FISCAL'
}

export enum DocumentType {
  INE_FRONT = 'ine_front',
  INE_BACK = 'ine_back',
  PASSPORT = 'passport',
  COMPROBANTE_DOMICILIO = 'comprobante_domicilio',
  CURP_DOCUMENT = 'curp_document',
  RFC_DOCUMENT = 'rfc_document',
  BIRTH_CERTIFICATE = 'birth_certificate',
  NATURALIZATION_CARD = 'naturalization_card',
  MIGRATION_DOCUMENT = 'migration_document'
}

export enum IdentifierType {
  CURP = 'curp',
  RFC_PERSONA_FISICA = 'rfc_persona_fisica',
  RFC_PERSONA_MORAL = 'rfc_persona_moral',
  NSS = 'nss',
  PASSPORT_NUMBER = 'passport_number'
}

export enum RequirementStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
  INVALID = 'invalid',
  MISSING = 'missing',
  WARNING = 'warning'
}

export enum ValidationStatus {
  VALID = 'valid',
  INVALID = 'invalid',
  WARNING = 'warning',
  PENDING = 'pending',
  ERROR = 'error'
}

export enum ConfidenceLevel {
  HIGH = 'high',
  MEDIUM = 'medium',
  LOW = 'low',
  VERY_LOW = 'very_low'
}

// ==================== ERROR RESPONSES ====================

export interface ErrorResponse {
  error: string
  message: string
  details?: string
  status_code?: number
}

export interface ValidationErrorResponse {
  field: string
  message: string
  code?: string
}

// ==================== UTILITY TYPES ====================

export type ApiEndpoint = string
export type HTTPMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'

export interface RequestConfig {
  headers?: Record<string, string>
  timeout?: number
  retries?: number
}