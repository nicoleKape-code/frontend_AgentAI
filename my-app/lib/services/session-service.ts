/**
 * Session Service for Agent Engine
 * 
 * This service handles session creation and management for the Agent Engine.
 * It provides an abstraction layer over the Agent Engine session API.
 */

import { getEndpointForPath, getAuthHeaders } from "@/lib/config";

export interface SessionCreationResult {
  success: boolean;
  sessionId?: string;
  error?: string;
}

/**
 * Creates a new session for a user using the Agent Engine Sessions API
 * 
 * @param userId - The user ID for the new session
 * @returns Session creation result with session ID or error
 */
export async function createSession(userId: string): Promise<SessionCreationResult> {
  try {
    console.log(`🚀 [SESSION SERVICE] Creating new session for user: ${userId}`);
    
    // Get the Agent Engine sessions endpoint
    const sessionsUrl = getEndpointForPath("", "sessions");
    
    // Get authentication headers
    const authHeaders = await getAuthHeaders();
    
    // Create session payload
    const payload = {
      user_id: userId,
      state: null, // Use null instead of empty object to avoid scalar field error
    };
    
    console.log(`📡 [SESSION SERVICE] Sending request to: ${sessionsUrl}`);
    console.log(`📤 [SESSION SERVICE] Payload:`, payload);
    
    // Make the request to Agent Engine
    const response = await fetch(sessionsUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...authHeaders,
      },
      body: JSON.stringify(payload),
    });
    
    console.log(`📋 [SESSION SERVICE] Response status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      let errorMessage = `Session creation failed: ${response.status} ${response.statusText}`;
      try {
        const errorText = await response.text();
        console.error(`❌ [SESSION SERVICE] Error details:`, errorText);
        if (errorText) {
          errorMessage += `. ${errorText}`;
        }
      } catch {
        // If response is already consumed, use original error
      }
      
      return {
        success: false,
        error: errorMessage,
      };
    }
    
    // Parse the response
    const sessionData = await response.json();
    console.log(`✅ [SESSION SERVICE] Session created successfully:`, sessionData);
    
    // Extract session ID from response
    let sessionId = sessionData.id || sessionData.session_id || sessionData.sessionId;
    
    // If not found in standard fields, extract from the 'name' field
    if (!sessionId && sessionData.name) {
      // Extract session ID from name like: 'projects/.../sessions/{sessionId}/operations/...'
      const nameMatch = sessionData.name.match(/\/sessions\/(\d+)\//);
      if (nameMatch && nameMatch[1]) {
        sessionId = nameMatch[1];
        console.log(`📝 [SESSION SERVICE] Extracted session ID from name field: ${sessionId}`);
      }
    }
    
    if (!sessionId) {
      console.error(`❌ [SESSION SERVICE] No session ID found in response:`, sessionData);
      return {
        success: false,
        error: "Session created but no session ID was returned",
      };
    }
    
    console.log(`🎉 [SESSION SERVICE] New session created: ${sessionId}`);
    
    return {
      success: true,
      sessionId,
    };
    
  } catch (error) {
    console.error(`❌ [SESSION SERVICE] Session creation error:`, error);
    
    const errorMessage = error instanceof Error 
      ? error.message 
      : "Unknown error occurred during session creation";
    
    return {
      success: false,
      error: errorMessage,
    };
  }
}

/**
 * Validates a user ID for session creation
 * 
 * @param userId - The user ID to validate
 * @returns True if valid, false otherwise
 */
export function validateUserId(userId: string): boolean {
  return typeof userId === "string" && userId.trim().length > 0;
}