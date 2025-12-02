/**
 * Health Check API Route
 * 
 * This endpoint provides a simple health check for the ADK FastAPI frontend.
 * It can be used to verify that the API is operational and ready to handle requests.
 */

import { NextResponse } from "next/server";
import { CORS_HEADERS } from "@/lib/handlers/run-sse-common";
import { getAdkEndpoint, getAdkHeaders } from "@/lib/config";

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
    // Check ADK server connectivity
    let adkHealthy = false;
    let adkError = "";
    
    try {
      const adkHealthUrl = getAdkEndpoint("health");
      const headers = getAdkHeaders();
      
      console.log(`🔍 [HEALTH] Checking ADK health at: ${adkHealthUrl}`);
      
      const adkResponse = await fetch(adkHealthUrl, {
        method: "GET",
        headers,
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      
      adkHealthy = adkResponse.ok;
      if (!adkResponse.ok) {
        adkError = `ADK returned ${adkResponse.status}: ${adkResponse.statusText}`;
      }
    } catch (error) {
      adkError = error instanceof Error ? error.message : "Unknown error";
    }
    
    const healthStatus = {
      status: adkHealthy ? "healthy" : "unhealthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
      deployment: "adk_fastapi",
      checks: {
        adk_server: adkHealthy ? "connected" : "failed",
        adk_error: adkError || "none",
      },
      ready: adkHealthy,
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
        deployment: "adk_fastapi",
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