"use server";

/**
 * Server Actions for Session Management
 * 
 * These server actions provide a secure way to create and manage sessions
 * from client components while keeping sensitive API calls on the server.
 */

import { createSession, validateUserId, SessionCreationResult } from "@/lib/services/session-service";

/**
 * Server Action to create a new session for a user
 * 
 * @param userId - The user ID for the new session
 * @returns Session creation result
 */
export async function createSessionAction(userId: string): Promise<SessionCreationResult> {
  console.log(`🔧 [SESSION ACTION] Creating session for user: ${userId}`);
  
  // Validate user ID
  if (!validateUserId(userId)) {
    console.error(`❌ [SESSION ACTION] Invalid user ID: ${userId}`);
    return {
      success: false,
      error: "Invalid user ID provided",
    };
  }
  
  try {
    // Delegate to session service
    const result = await createSession(userId);
    
    if (result.success) {
      console.log(`✅ [SESSION ACTION] Session created successfully: ${result.sessionId}`);
    } else {
      console.error(`❌ [SESSION ACTION] Session creation failed: ${result.error}`);
    }
    
    return result;
    
  } catch (error) {
    console.error(`❌ [SESSION ACTION] Unexpected error:`, error);
    
    return {
      success: false,
      error: "An unexpected error occurred during session creation",
    };
  }
}