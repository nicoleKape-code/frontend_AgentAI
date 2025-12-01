/**
 * Run SSE API Route - Agent Engine Version
 * 
 * This API route handles streaming chat requests and forwards them to Agent Engine.
 * It processes JSON fragments from Agent Engine and converts them to standard SSE format.
 */

import { NextRequest, NextResponse } from "next/server";
import { handleAgentEngineStreamRequest } from "@/lib/handlers/run-sse-agent-engine-handler";
import {
  parseStreamRequest,
  logStreamRequest,
  CORS_HEADERS,
} from "@/lib/handlers/run-sse-common";
import { createValidationError } from "@/lib/handlers/error-utils";

/**
 * Handle OPTIONS requests for CORS preflight
 */
export async function OPTIONS(): Promise<NextResponse> {
  console.log("🔧 [API] Handling CORS preflight request");
  return new NextResponse(null, {
    status: 200,
    headers: CORS_HEADERS,
  });
}

/**
 * Handle POST requests for streaming chat
 */
export async function POST(request: NextRequest): Promise<Response> {
  console.log("🚀 [API] Run SSE endpoint called (Agent Engine version)");
  
  try {
    // Parse and validate the request
    const { data: requestData, validation } = await parseStreamRequest(request);
    
    if (!validation.isValid || !requestData) {
      console.error(`❌ [API] Request validation failed: ${validation.error}`);
      return createValidationError(
        validation.error || "Invalid request format"
      );
    }
    
    // Log the stream request
    logStreamRequest(
      requestData.sessionId,
      requestData.userId,
      requestData.message
    );
    
    // Forward to Agent Engine handler
    console.log("🔀 [API] Forwarding to Agent Engine handler");
    const response = await handleAgentEngineStreamRequest(requestData);
    
    console.log("✅ [API] Agent Engine handler completed successfully");
    return response;
    
  } catch (error) {
    console.error("❌ [API] Unexpected error in run_sse endpoint:", error);
    
    // Return a streaming error response
    const errorEvent = `data: ${JSON.stringify({
      error: "Internal server error",
      details: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    })}\n\n`;
    
    return new Response(errorEvent, {
      status: 200, // SSE should return 200 even for errors
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
}