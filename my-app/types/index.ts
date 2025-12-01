/**
 * Core types for Agent Engine chat application
 */

export interface Message {
  id: string;
  type: "user" | "ai";
  content: string;
  timestamp: Date;
  agent?: string;
}

export interface GoalInput {
  title: string;
  description: string;
}

export interface User {
  id: string;
  name?: string;
}

export interface ChatSession {
  id: string;
  userId: string;
  createdAt: Date;
  lastMessageAt?: Date;
  title?: string;
}

export interface ProcessedEvent {
  title: string;
  data: {
    type: string;
    content?: string;
    name?: string;
    args?: Record<string, unknown>;
    response?: Record<string, unknown>;
    id?: string;
  };
}