# 🔐 JWT Authentication Flow for ADK Profile Agent

Este documento explica cómo funciona la autenticación JWT entre el frontend y el ADK Profile Agent.

## 📊 **Flujo de Autenticación**

```
Frontend (Supabase) → ADK Payload → Profile Agent
     [JWT]          [state_delta]   [tool_context.state]
```

### 1. **Frontend: Obtención del JWT Token**
```typescript
// contexts/ChatProvider.tsx
const getJWTToken = async (): Promise<string | null> => {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || null;
};
```

### 2. **Payload ADK: Inclusión en state_delta**
```typescript
// lib/handlers/run-sse-adk-handler.ts
const payload = {
  app_name: "profile_agent",
  user_id: "user123", 
  session_id: "session456",
  new_message: {
    parts: [{ text: "Hola" }],
    role: "user"
  },
  streaming: true,
  state_delta: {
    jwt_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." // 🔐 JWT Token
  }
}
```

### 3. **Profile Agent: Acceso al Token**
```python
# gubernamental-agent/services/agent_adk/profile_agent/agent.py
def get_user_profile(tool_context: ToolContext):
    jwt_token = tool_context.state.get("jwt_token")
    if not jwt_token:
        return {"status": "error", "message": "No JWT token found"}
    
    # Usar el token para llamadas autenticadas a Supabase
    headers = {"Authorization": f"Bearer {jwt_token}"}
```

## 🔄 **Flujo Detallado**

### Paso 1: Usuario Autenticado
- Usuario hace login en el frontend con Supabase
- Supabase devuelve un JWT `access_token`
- Token queda almacenado en la sesión del navegador

### Paso 2: Envío de Mensaje
- Usuario envía mensaje en el chat
- `ChatProvider` obtiene JWT token de Supabase
- Token se pasa a través del hook `useStreaming`

### Paso 3: API Request
- Frontend envía request a `/api/run_sse`
- Payload incluye `jwtToken` junto con mensaje y sesión
- Handler ADK recibe el token

### Paso 4: ADK Integration
- Handler ADK incluye JWT en `state_delta`
- ADK almacena token en el estado de la sesión
- Profile Agent puede acceder al token

### Paso 5: Authenticated API Calls
- Profile Agent usa token para llamadas a Supabase
- RLS (Row Level Security) filtra datos por usuario
- Solo datos del usuario autenticado son accesibles

## 🛡️ **Seguridad**

### ✅ **Características de Seguridad**
- **JWT Verification**: Supabase valida automáticamente el token
- **Row Level Security**: Base de datos filtra por usuario
- **Token Expiry**: Tokens JWT tienen vencimiento automático
- **HTTPS Only**: Tokens solo se transmiten por conexiones seguras

### 🔐 **Flujo de Tokens**
1. **Login** → JWT Token generado por Supabase
2. **Chat** → Token enviado en cada request
3. **ADK** → Token almacenado en estado de sesión
4. **Agent** → Token usado para llamadas autenticadas
5. **Database** → RLS filtra datos por usuario

## 🧪 **Testing del Flujo**

### Verificar Token en Logs
```bash
# 1. Ejecutar frontend en modo desarrollo
npm run dev

# 2. Verificar logs del JWT token
# En consola del navegador buscar:
🔐 [CHAT PROVIDER] JWT token obtained: Present
🔐 [ADK HANDLER] Including JWT token in state_delta
```

### Verificar Funcionalidad del Agent
```bash
# 1. Ejecutar ADK server
cd /path/to/gubernamental-agent/services/agent_adk
python main.py

# 2. Enviar mensaje "dame mi perfil"
# 3. Verificar que el agent puede acceder a datos de usuario
```

## 🔧 **Configuración Requerida**

### Variables de Entorno (.env.local)
```bash
# Supabase (para autenticación)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_OR_ANON_KEY=your-anon-key

# ADK Configuration  
ADK_BASE_URL=http://localhost:8081
ADK_APP_NAME=profile_agent
```

### Agente ADK
- Asegurar que el `profile_agent` esté configurado correctamente
- Verificar que las variables de entorno de Supabase estén en el ADK

## ❗ **Troubleshooting**

### Token No Found
- **Problema**: `No JWT token found`
- **Solución**: Verificar que usuario esté loggeado en Supabase

### RLS Error
- **Problema**: `Row Level Security policy violation`
- **Solución**: Verificar políticas RLS en Supabase

### Token Invalid  
- **Problema**: `JWT verification failed`
- **Solución**: Token expirado, hacer re-login

## 📝 **Archivos Modificados**

- `lib/streaming/types.ts` - Añadido `jwtToken` a `StreamingAPIPayload`
- `hooks/useStreaming.ts` - Soporte para pasar JWT token
- `contexts/ChatProvider.tsx` - Obtención de JWT de Supabase
- `lib/handlers/run-sse-common.ts` - Procesamiento de JWT token
- `lib/handlers/run-sse-adk-handler.ts` - Inclusión en `state_delta`

¡El flujo de autenticación JWT está completamente implementado! 🎉