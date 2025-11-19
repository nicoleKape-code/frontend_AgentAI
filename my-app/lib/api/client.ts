/**
 * API Client Base para comunicación con el backend gubernamental
 * Configurado para Next.js 15 con TypeScript y mejores prácticas 2025
 */

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public response?: unknown
  ) {
    super(message)
    this.name = 'ApiError'
  }
}

export interface RequestConfig extends RequestInit {
  timeout?: number
  retries?: number
}

export class ApiClient {
  private baseURL: string
  private defaultHeaders: Record<string, string>
  private defaultTimeout: number

  constructor(baseURL: string = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000') {
    this.baseURL = baseURL.replace(/\/$/, '') // Remove trailing slash
    this.defaultHeaders = {
      'Content-Type': 'application/json',
    }
    this.defaultTimeout = 30000 // 30 seconds
  }

  /**
   * Configurar headers por defecto (útil para auth tokens)
   */
  setDefaultHeader(key: string, value: string) {
    this.defaultHeaders[key] = value
  }

  /**
   * Remover header por defecto
   */
  removeDefaultHeader(key: string) {
    delete this.defaultHeaders[key]
  }

  /**
   * Request base con manejo de errores y timeout
   */
  async request<T>(
    endpoint: string,
    options: RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = 0,
      headers,
      ...restOptions
    } = options

    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    const config: RequestInit = {
      headers: { 
        ...this.defaultHeaders, 
        ...headers 
      },
      ...restOptions,
    }

    // Crear AbortController para timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), timeout)

    try {
      const response = await fetch(url, {
        ...config,
        signal: controller.signal,
      })

      clearTimeout(timeoutId)
      
      if (!response.ok) {
        const errorText = await response.text()
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`
        
        try {
          const errorJson = JSON.parse(errorText)
          errorMessage = errorJson.message || errorJson.detail || errorMessage
        } catch {
          errorMessage = errorText || errorMessage
        }
        
        throw new ApiError(response.status, errorMessage, response)
      }
      
      // Verificar si la respuesta tiene contenido
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        return response.json()
      }
      
      return response.text() as unknown as T
    } catch (error) {
      clearTimeout(timeoutId)
      
      if (error instanceof ApiError) {
        throw error
      }
      
      if (error instanceof Error) {
        if (error.name === 'AbortError') {
          throw new ApiError(408, `Request timeout after ${timeout}ms`)
        }
        
        // Retry logic para errores de red
        if (retries > 0 && this.isRetryableError(error)) {
          await this.delay(1000) // Esperar 1 segundo antes del retry
          return this.request(endpoint, { ...options, retries: retries - 1 })
        }
        
        throw new ApiError(0, error.message)
      }
      
      throw new ApiError(0, 'Unknown error occurred')
    }
  }

  /**
   * Determinar si un error es reintentable
   */
  private isRetryableError(error: Error): boolean {
    // Reintentar en errores de red, no en errores de validación
    return error.message.includes('fetch') || 
           error.message.includes('network') ||
           error.message.includes('ECONNREFUSED')
  }

  /**
   * Delay helper para retries
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Métodos HTTP convenientes
   */
  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' })
  }

  /**
   * Upload de archivos
   */
  async upload<T>(endpoint: string, file: File, config?: RequestConfig): Promise<T> {
    const formData = new FormData()
    formData.append('file', file)

    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: formData,
      headers: {
        // No establecer Content-Type, el navegador lo hará automáticamente con boundary
        ...config?.headers,
      },
    })
  }

  /**
   * Streaming con Server-Sent Events
   */
  async stream(
    endpoint: string,
    data: unknown,
    onChunk: (chunk: unknown) => void,
    onError?: (error: Error) => void,
    config?: RequestConfig
  ): Promise<void> {
    const url = `${this.baseURL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`
    
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          ...this.defaultHeaders,
          ...config?.headers,
        },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        throw new ApiError(response.status, `Stream failed: ${response.statusText}`)
      }

      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new ApiError(500, 'No response body available')
      }

      while (true) {
        const { value, done } = await reader.read()
        if (done) break
        
        const chunk = decoder.decode(value)
        const lines = chunk.split('\n')
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6))
              onChunk(data)
            } catch {
              console.warn('Failed to parse SSE data:', line)
            }
          }
        }
      }
    } catch (error: unknown) {
      if (onError && error instanceof Error) {
        onError(error)
      } else {
        throw error
      }
    }
  }
}

// Instancia global del cliente
export const apiClient = new ApiClient()

// Debug mode helper
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_API_DEBUG === 'true') {
  (window as unknown as { __apiClient: ApiClient }).__apiClient = apiClient
  console.log('🔧 API Client disponible en window.__apiClient para debugging')
}