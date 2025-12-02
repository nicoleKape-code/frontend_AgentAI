/**
 * Client-safe configuration utilities for ADK FastAPI
 *
 * This module provides configuration functions that can be safely used
 * in both client and server environments without importing server dependencies.
 */

/**
 * Determines if we should use ADK FastAPI based on environment variables
 * This is safe to use in client-side code (SSE parser, hooks, etc.)
 */
export function shouldUseAdk(): boolean {
  // For this implementation, we always use ADK FastAPI
  // ADK is available locally, so we default to true
  return true;
}