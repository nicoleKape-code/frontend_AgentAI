/**
 * Servicio DIPOMEX para consulta de códigos postales mexicanos
 * Integrado con la API oficial del gobierno mexicano
 */

import { apiClient } from '../client'
import type {
  EstadoData,
  MunicipioData,
  ColoniaData,
  CodigoPostalData
} from '../../../types/api'

export class DipomexService {
  private static instance: DipomexService
  
  // Cache para mejorar performance
  private estadosCache: EstadoData[] | null = null
  private municipiosCache = new Map<string, MunicipioData[]>()
  private coloniasCache = new Map<string, ColoniaData[]>()

  constructor() {
    // Singleton pattern
  }

  static getInstance(): DipomexService {
    if (!DipomexService.instance) {
      DipomexService.instance = new DipomexService()
    }
    return DipomexService.instance
  }

  // ==================== ESTADOS ====================

  /**
   * Obtener todos los estados de México
   */
  async getEstados(): Promise<EstadoData[]> {
    if (this.estadosCache) {
      return this.estadosCache
    }

    try {
      const estados = await apiClient.get<EstadoData[]>('/api/v1/dipomex/estados')
      this.estadosCache = estados
      return estados
    } catch (error) {
      console.error('Error fetching estados:', error)
      // Fallback con estados principales
      return this.getFallbackEstados()
    }
  }

  /**
   * Buscar estado por nombre o abreviatura
   */
  async findEstado(query: string): Promise<EstadoData | null> {
    const estados = await this.getEstados()
    const normalizedQuery = query.toLowerCase().trim()
    
    return estados.find(estado => 
      estado.nombre.toLowerCase().includes(normalizedQuery) ||
      estado.abreviatura.toLowerCase() === normalizedQuery
    ) || null
  }

  // ==================== MUNICIPIOS ====================

  /**
   * Obtener municipios por estado
   */
  async getMunicipios(estadoId: string): Promise<MunicipioData[]> {
    const cacheKey = estadoId
    
    if (this.municipiosCache.has(cacheKey)) {
      return this.municipiosCache.get(cacheKey)!
    }

    try {
      const municipios = await apiClient.get<MunicipioData[]>(
        `/api/v1/dipomex/municipios/${estadoId}`
      )
      
      this.municipiosCache.set(cacheKey, municipios)
      return municipios
    } catch (error) {
      console.error(`Error fetching municipios for estado ${estadoId}:`, error)
      return []
    }
  }

  /**
   * Buscar municipio por nombre en un estado específico
   */
  async findMunicipio(estadoId: string, municipioName: string): Promise<MunicipioData | null> {
    const municipios = await this.getMunicipios(estadoId)
    const normalizedName = municipioName.toLowerCase().trim()
    
    return municipios.find(municipio => 
      municipio.nombre.toLowerCase().includes(normalizedName)
    ) || null
  }

  // ==================== COLONIAS ====================

  /**
   * Obtener colonias por estado y municipio
   */
  async getColonias(estadoId: string, municipioId: string): Promise<ColoniaData[]> {
    const cacheKey = `${estadoId}-${municipioId}`
    
    if (this.coloniasCache.has(cacheKey)) {
      return this.coloniasCache.get(cacheKey)!
    }

    try {
      const colonias = await apiClient.get<ColoniaData[]>(
        `/api/v1/dipomex/colonias/${estadoId}/${municipioId}`
      )
      
      this.coloniasCache.set(cacheKey, colonias)
      return colonias
    } catch (error) {
      console.error(`Error fetching colonias for ${estadoId}/${municipioId}:`, error)
      return []
    }
  }

  /**
   * Buscar colonia por nombre
   */
  async findColonia(
    estadoId: string, 
    municipioId: string, 
    coloniaName: string
  ): Promise<ColoniaData | null> {
    const colonias = await this.getColonias(estadoId, municipioId)
    const normalizedName = coloniaName.toLowerCase().trim()
    
    return colonias.find(colonia => 
      colonia.nombre.toLowerCase().includes(normalizedName)
    ) || null
  }

  // ==================== CÓDIGOS POSTALES ====================

  /**
   * Buscar información por código postal
   */
  async searchByCodigoPostal(codigoPostal: string): Promise<CodigoPostalData | null> {
    // Limpiar y validar CP
    const cleanCP = codigoPostal.replace(/\D/g, '')
    
    if (cleanCP.length !== 5) {
      throw new Error('El código postal debe tener exactamente 5 dígitos')
    }

    try {
      return await apiClient.get<CodigoPostalData>(
        `/api/v1/dipomex/codigo_postal/${cleanCP}`
      )
    } catch (error) {
      console.error(`Error fetching data for CP ${cleanCP}:`, error)
      return null
    }
  }

  /**
   * Validar código postal
   */
  async validateCodigoPostal(codigoPostal: string): Promise<{
    isValid: boolean
    data?: CodigoPostalData
    error?: string
  }> {
    const cleanCP = codigoPostal.replace(/\D/g, '')
    
    if (cleanCP.length !== 5) {
      return {
        isValid: false,
        error: 'El código postal debe tener 5 dígitos'
      }
    }

    const data = await this.searchByCodigoPostal(cleanCP)
    
    if (!data) {
      return {
        isValid: false,
        error: 'Código postal no encontrado'
      }
    }

    return {
      isValid: true,
      data
    }
  }

  // ==================== UTILIDADES ====================

  /**
   * Limpiar cache
   */
  clearCache(): void {
    this.estadosCache = null
    this.municipiosCache.clear()
    this.coloniasCache.clear()
  }

  /**
   * Formatear dirección completa
   */
  formatAddress(data: {
    street?: string
    exterior_number?: string
    interior_number?: string
    neighborhood?: string
    postal_code?: string
    municipality?: string
    state?: string
  }): string {
    const parts: string[] = []
    
    if (data.street) {
      let streetPart = data.street
      if (data.exterior_number) {
        streetPart += ` #${data.exterior_number}`
      }
      if (data.interior_number) {
        streetPart += ` Int. ${data.interior_number}`
      }
      parts.push(streetPart)
    }
    
    if (data.neighborhood) {
      parts.push(`Col. ${data.neighborhood}`)
    }
    
    if (data.postal_code) {
      parts.push(`CP ${data.postal_code}`)
    }
    
    if (data.municipality) {
      parts.push(data.municipality)
    }
    
    if (data.state) {
      parts.push(data.state)
    }
    
    return parts.join(', ')
  }

  /**
   * Autocompletar dirección por CP
   */
  async autocompleteAddress(codigoPostal: string): Promise<{
    success: boolean
    suggestions?: {
      estado: string
      municipio: string
      colonias: string[]
      codigo_postal: string
    }
    error?: string
  }> {
    const validation = await this.validateCodigoPostal(codigoPostal)
    
    if (!validation.isValid) {
      return {
        success: false,
        error: validation.error
      }
    }

    return {
      success: true,
      suggestions: {
        estado: validation.data!.estado,
        municipio: validation.data!.municipio,
        colonias: validation.data!.colonias,
        codigo_postal: validation.data!.codigo_postal
      }
    }
  }

  // ==================== FALLBACKS ====================

  /**
   * Estados principales como fallback
   */
  private getFallbackEstados(): EstadoData[] {
    return [
      { id: '09', nombre: 'Ciudad de México', abreviatura: 'CDMX' },
      { id: '15', nombre: 'Estado de México', abreviatura: 'MEX' },
      { id: '14', nombre: 'Jalisco', abreviatura: 'JAL' },
      { id: '19', nombre: 'Nuevo León', abreviatura: 'NL' },
      { id: '21', nombre: 'Puebla', abreviatura: 'PUE' },
      { id: '11', nombre: 'Guanajuato', abreviatura: 'GTO' },
      { id: '30', nombre: 'Veracruz', abreviatura: 'VER' },
      { id: '16', nombre: 'Michoacán', abreviatura: 'MICH' },
      { id: '20', nombre: 'Oaxaca', abreviatura: 'OAX' },
      { id: '08', nombre: 'Chihuahua', abreviatura: 'CHIH' }
    ]
  }
}

// Instancia global del servicio
export const dipomexService = DipomexService.getInstance()

// Debug helper
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
  (window as unknown as { __dipomexService: DipomexService }).__dipomexService = dipomexService
}