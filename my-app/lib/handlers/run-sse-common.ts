/**
 * Common utilities for run_sse API route
 *
 * This module contains shared types, request parsing, validation, and utility functions
 * used for streaming endpoints.
 */

import { NextRequest } from "next/server";

/**
 * Common request data structure for streaming
 */
export interface ProcessedStreamRequest {
  message: string;
  userId: string;
  sessionId: string;
  jwtToken?: string;
}

/**
 * Validation result for request parsing
 */
export interface StreamValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * SSE response headers for streaming endpoints
 */
export const SSE_HEADERS = {
  "Content-Type": "text/event-stream",
  "Cache-Control": "no-cache",
  Connection: "keep-alive",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

/**
 * CORS headers for OPTIONS requests
 */
export const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
} as const;

/**
 * Parse and validate the incoming stream request body
 *
 * @param request - The incoming HTTP request
 * @returns Parsed request data and validation result
 */
export async function parseStreamRequest(request: NextRequest): Promise<{
  data: ProcessedStreamRequest | null;
  validation: StreamValidationResult;
}> {
  try {
    const requestBody = (await request.json()) as {
      message?: string;
      userId?: string;
      sessionId?: string;
      jwtToken?: string;
    };

    // Validate the request structure
    const validation = validateStreamRequest(requestBody);
    if (!validation.isValid) {
      return { data: null, validation };
    }

    return {
      data: {
        message: requestBody.message!,
        userId: requestBody.userId!,
        sessionId: requestBody.sessionId!,
        jwtToken: requestBody.jwtToken,
      },
      validation: { isValid: true },
    };
  } catch (error) {
    console.error("Error parsing stream request:", error);
    return {
      data: null,
      validation: {
        isValid: false,
        error: "Invalid request format",
      },
    };
  }
}

/**
 * Validate the stream request structure
 *
 * @param requestBody - The parsed request body
 * @returns Validation result
 */
export function validateStreamRequest(requestBody: {
  message?: string;
  userId?: string;
  sessionId?: string;
  jwtToken?: string;
}): StreamValidationResult {
  if (!requestBody.message?.trim()) {
    return {
      isValid: false,
      error: "Message is required",
    };
  }

  if (!requestBody.userId?.trim()) {
    return {
      isValid: false,
      error: "User ID is required",
    };
  }

  if (!requestBody.sessionId?.trim()) {
    return {
      isValid: false,
      error: "Session ID is required",
    };
  }

  return { isValid: true };
}


/**
 * Centralized logging for stream operations
 *
 * @param sessionId - Session identifier
 * @param userId - User identifier
 * @param message - Stream message (truncated for logging)
 */
export function logStreamRequest(
  sessionId: string,
  userId: string,
  message: string
): void {
  const truncatedMessage =
    message.length > 50 ? message.substring(0, 50) + "..." : message;
  console.log(
    `📨 Stream Request - Session: ${sessionId}, User: ${userId}, Message: ${truncatedMessage}`
  );
}

/**
 * Log stream operation start
 *
 * @param url - Target URL for streaming
 * @param payload - Request payload (truncated for logging)
 */
export function logStreamStart(
  url: string,
  payload: unknown
): void {
  console.log(`🔗 Forwarding stream request to: ${url}`);
  console.log(`📤 Payload:`, payload);
}

/**
 * Log stream response details
 *
 * @param status - HTTP status code
 * @param statusText - HTTP status text
 * @param headers - Response headers
 */
export function logStreamResponse(
  status: number,
  statusText: string,
  headers: Headers
): void {
  console.log(
    `✅ Stream response received, status: ${status} ${statusText}`
  );
  console.log(`📋 Content-Type: ${headers.get("content-type")}`);
}

/**
 * Create error SSE event
 *
 * @param errorMessage - Error message to send
 * @param author - Author/agent name for the error
 * @returns Formatted SSE error event string
 */
export function createErrorSSEEvent(
  errorMessage: string,
  author: string = "error"
): string {
  const errorEvent = {
    content: {
      parts: [{ text: `Error processing response: ${errorMessage}` }],
    },
    author,
  };

  return `data: ${JSON.stringify(errorEvent)}\n\n`;
}

/**
 * Creates a debug log message with consistent formatting
 *
 * @param category - Log category (e.g., "SSE", "PARSER", "CONNECTION")
 * @param message - Log message
 * @param data - Optional data to include
 */
export function createDebugLog(
  category: string,
  message: string,
  data?: unknown
): void {
  if (data !== undefined) {
    console.log(`[${category}] ${message}:`, data);
  } else {
    console.log(`[${category}] ${message}`);
  }
}