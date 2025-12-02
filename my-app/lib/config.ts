/**
 * ADK FastAPI configuration for Next.js API endpoints
 * Simplified configuration for local ADK deployment
 */

export interface EndpointConfig {
  adkBaseUrl: string;
  appName: string;
  environment: "development" | "production";
  deploymentType: "adk_fastapi";
}

/**
 * Gets the ADK FastAPI base URL
 */
function getAdkBaseUrl(): string {
  const baseUrl = process.env.ADK_BASE_URL || "http://localhost:8081";
  return baseUrl;
}

/**
 * Gets the ADK app name - can be overridden via environment variable
 * Available options: "profile_agent", "government_service_agent"
 */
function getAdkAppName(): string {
  return process.env.ADK_APP_NAME || "profile_agent";
}

/**
 * Creates the endpoint configuration for ADK FastAPI
 */
export function createEndpointConfig(): EndpointConfig {
  const config: EndpointConfig = {
    adkBaseUrl: getAdkBaseUrl(),
    appName: getAdkAppName(),
    environment: process.env.NODE_ENV === "production" ? "production" : "development",
    deploymentType: "adk_fastapi",
  };

  // Log configuration in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 ADK FastAPI Configuration:", {
      environment: config.environment,
      deploymentType: config.deploymentType,
      adkBaseUrl: config.adkBaseUrl,
      appName: config.appName,
    });
  }

  return config;
}

/**
 * Get the current endpoint configuration
 */
export const endpointConfig = createEndpointConfig();

/**
 * Gets standard headers for ADK API calls (no authentication needed)
 */
export function getAdkHeaders(): Record<string, string> {
  return {
    "Content-Type": "application/json",
  };
}

/**
 * ADK endpoint types
 */
export type AdkEndpointType = "run" | "sessions" | "health";

/**
 * Gets the appropriate ADK endpoint for a given operation
 */
export function getAdkEndpoint(
  endpointType: AdkEndpointType,
  userId?: string,
  sessionId?: string,
  path?: string
): string {
  const { adkBaseUrl, appName } = endpointConfig;
  
  switch (endpointType) {
    case "run":
      // ADK uses /run_sse for streaming endpoints at the root level
      return `${adkBaseUrl}/run_sse`;
    
    case "sessions":
      if (!userId) {
        throw new Error("userId is required for sessions endpoint");
      }
      const basePath = `${adkBaseUrl}/apps/${appName}/users/${userId}/sessions`;
      return path ? `${basePath}${path}` : basePath;
    
    case "health":
      return `${adkBaseUrl}/health`;
    
    default:
      throw new Error(`Unsupported endpoint type: ${endpointType}`);
  }
}

/**
 * Gets the ADK streaming endpoint for chat responses
 */
export function getAdkStreamEndpoint(userId: string, sessionId: string): string {
  return getAdkEndpoint("run", userId, sessionId);
}

/**
 * Gets the ADK sessions endpoint
 */
export function getAdkSessionsEndpoint(userId: string, path?: string): string {
  return getAdkEndpoint("sessions", userId, undefined, path);
}

/**
 * Available ADK agent apps
 */
export const AVAILABLE_AGENTS = {
  PROFILE_AGENT: "profile_agent",
  GOVERNMENT_SERVICE_AGENT: "government_service_agent",
} as const;

export type AgentType = typeof AVAILABLE_AGENTS[keyof typeof AVAILABLE_AGENTS];

/**
 * Gets endpoints for a specific agent (useful for switching agents)
 */
export function getAgentEndpoints(agentName: AgentType, userId: string, sessionId?: string) {
  const tempConfig = {
    ...endpointConfig,
    appName: agentName,
  };
  
  return {
    sessions: `${tempConfig.adkBaseUrl}/apps/${agentName}/users/${userId}/sessions`,
    run: sessionId ? `${tempConfig.adkBaseUrl}/apps/${agentName}/users/${userId}/sessions/${sessionId}/run` : null,
    health: `${tempConfig.adkBaseUrl}/health`,
  };
}

/**
 * Agent descriptions for UI
 */
export const AGENT_DESCRIPTIONS = {
  [AVAILABLE_AGENTS.PROFILE_AGENT]: {
    name: "Profile Agent",
    description: "Manages user profiles and appointments with authentication",
    features: ["User profile management", "Appointment viewing", "Profile updates", "JWT authentication"]
  },
  [AVAILABLE_AGENTS.GOVERNMENT_SERVICE_AGENT]: {
    name: "Government Service Agent",
    description: "Handles Mexican government services and document processing",
    features: ["Document extraction from images", "Government appointment scheduling", "Web search", "Multi-agent coordination"]
  }
} as const;