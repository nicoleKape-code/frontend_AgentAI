/**
 * Error handling utilities for API routes
 *
 * This module provides standardized error response functions for different
 * types of errors that can occur in API endpoints.
 */

import { NextResponse } from "next/server";

/**
 * Creates a standardized internal server error response
 *
 * @param deploymentType - Type of deployment for logging context
 * @param error - The error that occurred
 * @param message - Human-readable error message
 * @returns NextResponse with error details
 */
export function createInternalServerError(
  deploymentType: string,
  error: unknown,
  message: string = "Internal server error"
): NextResponse {
  const errorDetails = error instanceof Error ? error.message : String(error);

  console.error(`❌ [${deploymentType.toUpperCase()}] ${message}:`, error);

  return NextResponse.json(
    {
      error: message,
      details: errorDetails,
      deploymentType,
      timestamp: new Date().toISOString(),
    },
    { status: 500 }
  );
}

/**
 * Creates a standardized backend connection error response
 *
 * @param deploymentType - Type of deployment for logging context
 * @param status - HTTP status code from backend
 * @param statusText - HTTP status text from backend
 * @param details - Additional error details
 * @returns NextResponse with connection error details
 */
export function createBackendConnectionError(
  deploymentType: string,
  status: number,
  statusText: string,
  details?: string
): NextResponse {
  const errorMessage = `Failed to connect to ${deploymentType}`;

  console.error(
    `❌ [${deploymentType.toUpperCase()}] Backend connection failed:`,
    {
      status,
      statusText,
      details,
    }
  );

  return NextResponse.json(
    {
      error: errorMessage,
      backendStatus: status,
      backendStatusText: statusText,
      details: details || `Backend returned ${status} ${statusText}`,
      deploymentType,
      timestamp: new Date().toISOString(),
    },
    { status: 502 }
  );
}

/**
 * Creates a standardized validation error response
 *
 * @param message - Validation error message
 * @param field - Field that failed validation
 * @returns NextResponse with validation error details
 */
export function createValidationError(
  message: string,
  field?: string
): NextResponse {
  console.error(`❌ [VALIDATION] ${message}`, { field });

  return NextResponse.json(
    {
      error: "Validation failed",
      message,
      field,
      timestamp: new Date().toISOString(),
    },
    { status: 400 }
  );
}

/**
 * Creates a standardized streaming error response
 *
 * @param deploymentType - Type of deployment for logging context
 * @param error - The streaming error that occurred
 * @param message - Human-readable error message
 * @returns NextResponse with streaming error details
 */
export function createStreamingError(
  deploymentType: string,
  error: unknown,
  message: string = "Streaming error"
): NextResponse {
  const errorDetails = error instanceof Error ? error.message : String(error);

  console.error(`❌ [${deploymentType.toUpperCase()}] ${message}:`, error);

  // For streaming errors, we want to return a proper SSE error event
  const errorEvent = `data: ${JSON.stringify({
    error: message,
    details: errorDetails,
    deploymentType,
    timestamp: new Date().toISOString(),
  })}\n\n`;

  return new NextResponse(errorEvent, {
    status: 200, // SSE should return 200 even for errors
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

/**
 * Creates a standardized authentication error response
 *
 * @param details - Authentication error details
 * @returns NextResponse with authentication error details
 */
export function createAuthenticationError(details?: string): NextResponse {
  console.error(`❌ [AUTH] Authentication failed:`, details);

  return NextResponse.json(
    {
      error: "Authentication failed",
      details: details || "Invalid or missing authentication credentials",
      timestamp: new Date().toISOString(),
    },
    { status: 401 }
  );
}