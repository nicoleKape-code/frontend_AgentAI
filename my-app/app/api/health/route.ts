/**
 * Health Check API Route
 * 
 * This endpoint provides a simple health check for the Agent Engine frontend.
 * It can be used to verify that the API is operational and ready to handle requests.
 */

import { NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/handlers/run-sse-common";

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Handle GET requests for health check
 */
export async function GET(): Promise<NextResponse> {
  console.log("💓 [HEALTH] Health check requested");
  
  try {
    // Basic health check - verify environment variables are set
    const hasAgentEngineEndpoint = Boolean(process.env.AGENT_ENGINE_ENDPOINT);
    const hasServiceAccountKey = Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_KEY_BASE64);
    
    const healthStatus = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      deployment: "agent_engine",
      checks: {
        agent_engine_endpoint: hasAgentEngineEndpoint ? "configured" : "missing",
        google_service_account: hasServiceAccountKey ? "configured" : "missing",
      },
      ready: hasAgentEngineEndpoint && hasServiceAccountKey,
    };
    
    const status = healthStatus.ready ? 200 : 503;
    
    console.log(`💓 [HEALTH] Health check result:`, {
      status,
      ready: healthStatus.ready,
      checks: healthStatus.checks,
    });
    
    return NextResponse.json(healthStatus, {
      status,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Cache-Control": "no-cache",
      },
    });
    
  } catch (error) {
    console.error("❌ [HEALTH] Health check failed:", error);
    
    return NextResponse.json(
      {
        status: "unhealthy",
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : "Unknown error",
        deployment: "agent_engine",
      },
      {
        status: 503,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "no-cache",
        },
      }
    );
  }
}