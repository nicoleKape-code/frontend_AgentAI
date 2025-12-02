/**
 * ADK FastAPI Handler for Run SSE API Route
 *
 * Handles requests for ADK FastAPI deployment configuration.
 * This handler processes streaming responses from ADK and converts them to SSE format.
 * ADK returns Server-Sent Events natively, so we can pass them through more directly.
 */

import { getAdkStreamEndpoint, getAdkHeaders, endpointConfig } from "@/lib/config";
import {
  ProcessedStreamRequest,
  logStreamStart,
  logStreamResponse,
  SSE_HEADERS,
} from "./run-sse-common";
import {
  createInternalServerError,
  createBackendConnectionError,
} from "./error-utils";

/**
 * ADK streaming payload format based on RunAgentRequest
 */
interface AdkStreamPayload {
  app_name: string;
  user_id: string;
  session_id: string;
  new_message: {
    parts: Array<{ text: string }>;
    role: "user";
  };
  streaming: boolean;
  state_delta?: {
    jwt_token?: string;
  };
}

/**
 * Format request data for ADK API according to RunAgentRequest schema
 */
function formatAdkPayload(requestData: ProcessedStreamRequest, appName: string): AdkStreamPayload {
  const payload: AdkStreamPayload = {
    app_name: appName,
    user_id: requestData.userId,
    session_id: requestData.sessionId,
    new_message: {
      parts: [{ text: requestData.message }],
      role: "user",
    },
    streaming: true,
  };

  // Include JWT token in state_delta if provided
  if (requestData.jwtToken) {
    payload.state_delta = {
      jwt_token: requestData.jwtToken,
    };
    console.log('🔐 [ADK HANDLER] Including JWT token in state_delta');
  }

  return payload;
}

/**
 * Handle ADK FastAPI streaming request
 *
 * @param requestData - Processed request data
 * @returns Streaming SSE Response from ADK
 */
export async function handleAdkStreamRequest(
  requestData: ProcessedStreamRequest
): Promise<Response> {
  console.log("🚀 [ADK HANDLER] Starting ADK streaming request");
  console.log(`📊 [ADK HANDLER] Request data:`, JSON.stringify(requestData, null, 2));

  try {
    // Format payload for ADK
    const adkPayload = formatAdkPayload(requestData, endpointConfig.appName);
    
    // Build ADK streaming URL
    const adkStreamUrl = getAdkStreamEndpoint(requestData.userId, requestData.sessionId);
    
    // Log operation start
    logStreamStart(adkStreamUrl, adkPayload);
    
    // Get standard headers (no authentication needed for local ADK)
    const headers = getAdkHeaders();
    
    console.log(`📡 [ADK HANDLER] Making request to: ${adkStreamUrl}`);
    console.log(`📤 [ADK HANDLER] Payload:`, adkPayload);
    
    // Forward request to ADK streaming endpoint
    const response = await fetch(adkStreamUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(adkPayload),
    });
    
    // Log the response from ADK
    logStreamResponse(response.status, response.statusText, response.headers);
    
    // Check for errors from ADK
    if (!response.ok) {
      let errorDetails = `ADK returned an error: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error(`❌ [ADK HANDLER] Error details:`, errorText);
        if (errorText) {
          errorDetails += `. ${errorText}`;
        }
      } catch (error) {
        console.error("Error reading ADK error response:", error);
      }
      
      return createBackendConnectionError(
        "adk_fastapi",
        response.status,
        response.statusText,
        errorDetails
      );
    }
    
    // ADK should return SSE directly, but we'll create a passthrough stream
    // to ensure compatibility and add our own logging
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        
        if (!reader) {
          controller.error(new Error("No readable stream from ADK"));
          return;
        }
        
        console.log("🔄 [ADK HANDLER] Starting stream passthrough");
        
        try {
          // Set up timeout mechanism (10 minutes max for ADK)
          const timeoutMs = 10 * 60 * 1000; // 10 minutes
          const startTime = Date.now();
          let isStreamActive = true;
          
          const pump = async (): Promise<void> => {
            // Check for timeout
            if (Date.now() - startTime > timeoutMs) {
              console.error("❌ [ADK HANDLER] Stream timeout after 10 minutes");
              controller.close();
              return;
            }
            
            if (!isStreamActive) {
              return;
            }
            
            const { done, value } = await reader.read();
            
            if (value) {
              const chunk = decoder.decode(value, { stream: true });
              console.log(`📥 [ADK HANDLER] Received chunk: ${chunk.length} bytes`);
              
              // ADK sends SSE format, so we can pass it through directly
              // but we'll ensure it's properly formatted
              if (chunk.trim()) {
                // Ensure proper SSE format
                const lines = chunk.split('\n');
                const formattedChunk = lines
                  .map(line => {
                    if (line.startsWith('data: ')) {
                      return line;
                    } else if (line.trim() === '') {
                      return '';
                    } else if (line.trim()) {
                      // Ensure data lines have proper prefix
                      return `data: ${line}`;
                    }
                    return line;
                  })
                  .join('\n');
                
                controller.enqueue(new TextEncoder().encode(formattedChunk));
              }
            }
            
            if (done) {
              console.log("✅ [ADK HANDLER] Stream completed successfully");
              controller.close();
              isStreamActive = false;
              return;
            }
            
            // Continue processing next chunk
            return pump();
          };
          
          await pump();
        } catch (error) {
          console.error("❌ [ADK HANDLER] Stream processing error:", error);
          controller.error(error);
        } finally {
          reader.releaseLock();
        }
      },
    });
    
    // Return streaming SSE response with proper headers
    console.log("✅ [ADK HANDLER] Returning streaming response");
    return new Response(stream, {
      status: 200,
      headers: SSE_HEADERS,
    });
    
  } catch (error) {
    console.error("❌ [ADK HANDLER] Handler error:", error);
    
    if (error instanceof TypeError && error.message.includes("fetch")) {
      return createBackendConnectionError(
        "adk_fastapi",
        500,
        "Connection failed",
        "Failed to connect to ADK FastAPI server"
      );
    }
    
    return createInternalServerError(
      "adk_fastapi",
      error,
      "Failed to process ADK streaming request"
    );
  }
}