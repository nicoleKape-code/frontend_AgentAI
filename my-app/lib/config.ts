/**
 * Agent Engine configuration for Next.js API endpoints
 * Simplified version focused only on Agent Engine deployment
 */

export interface EndpointConfig {
  agentEngineUrl: string;
  environment: "production";
  deploymentType: "agent_engine";
}

/**
 * Gets the Agent Engine URL for direct Agent Engine API calls
 */
function getAgentEngineUrl(): string {
  const endpoint = process.env.AGENT_ENGINE_ENDPOINT;
  if (!endpoint) {
    throw new Error(
      "AGENT_ENGINE_ENDPOINT environment variable is required for Agent Engine deployment"
    );
  }
  return endpoint;
}

/**
 * Creates the endpoint configuration for Agent Engine only
 */
export function createEndpointConfig(): EndpointConfig {
  const config: EndpointConfig = {
    agentEngineUrl: getAgentEngineUrl(),
    environment: "production",
    deploymentType: "agent_engine",
  };

  // Log configuration in development
  if (process.env.NODE_ENV === "development") {
    console.log("🔧 Agent Engine Configuration:", {
      environment: config.environment,
      deploymentType: config.deploymentType,
      agentEngineUrl: config.agentEngineUrl,
    });
  }

  return config;
}

/**
 * Get the current endpoint configuration
 */
export const endpointConfig = createEndpointConfig();

/**
 * Utility function to get authentication headers for Google Cloud API calls
 */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  try {
    // Use base64-encoded service account key from environment variables (for Vercel deployment)
    const serviceAccountKeyBase64 =
      process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64;

    if (!serviceAccountKeyBase64) {
      throw new Error(
        "GOOGLE_SERVICE_ACCOUNT_KEY_BASE64 environment variable is required for Agent Engine deployment"
      );
    }

    // Decode the base64-encoded service account key
    const serviceAccountKeyJson = Buffer.from(
      serviceAccountKeyBase64,
      "base64"
    ).toString("utf-8");
    const credentials = JSON.parse(serviceAccountKeyJson);

    // Use the service account to get an access token
    const { GoogleAuth } = await import("google-auth-library");
    const auth = new GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/cloud-platform"],
    });

    const authClient = await auth.getClient();
    const accessToken = await authClient.getAccessToken();

    if (accessToken.token) {
      headers["Authorization"] = `Bearer ${accessToken.token}`;
    }
  } catch (error) {
    console.error("Failed to get Google Cloud access token:", error);
    throw new Error("Authentication failed");
  }

  return headers;
}

/**
 * Agent Engine endpoint types
 */
export type AgentEngineEndpointType = "query" | "streamQuery" | "sessions";

/**
 * Gets the Agent Engine sessions API base URL (v1beta1)
 */
function getAgentEngineSessionsUrl(): string {
  // Sessions API uses v1beta1, construct from the base URL parts
  const urlParts = endpointConfig.agentEngineUrl.match(
    /^(https:\/\/[^\/]+)\/v1\/(projects\/[^\/]+\/locations\/[^\/]+\/reasoningEngines\/[^\/]+)/
  );

  if (urlParts) {
    const [, baseUrl, projectPath] = urlParts;
    return `${baseUrl}/v1beta1/${projectPath}`;
  }

  throw new Error(
    "Could not construct sessions API URL from AGENT_ENGINE_ENDPOINT"
  );
}

/**
 * Gets the appropriate endpoint for a given API path and operation type
 */
export function getEndpointForPath(
  path: string,
  endpointType: AgentEngineEndpointType = "streamQuery"
): string {
  // For Agent Engine, return the appropriate endpoint based on operation type
  if (endpointType === "streamQuery") {
    return `${endpointConfig.agentEngineUrl}:streamQuery`;
  } else if (endpointType === "query") {
    return `${endpointConfig.agentEngineUrl}:query`;
  } else if (endpointType === "sessions") {
    const sessionsUrl = getAgentEngineSessionsUrl();
    return `${sessionsUrl}/sessions${path}`;
  }

  throw new Error(`Unsupported endpoint type: ${endpointType}`);
}

/**
 * Gets the Agent Engine streaming endpoint for chat responses
 */
export function getAgentEngineStreamEndpoint(): string {
  return getEndpointForPath("", "streamQuery");
}