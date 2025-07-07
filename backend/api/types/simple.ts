import { Request, Response } from "express";

/**
 * Simplified API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Standard Express Request with optional extensions
 */
export interface SimpleRequest extends Request {
  requestId?: string;
  file?: Express.Multer.File;
}

/**
 * Standard Express Response
 */
export type SimpleResponse = Response;

/**
 * Message processing request body
 */
export interface ChatMessageRequest {
  message: string;
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * CV upload request body
 */
export interface UploadCVRequest {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

/**
 * Session data structure
 */
export interface UserSession {
  sessionId: string;
  userId?: string;
  currentState: string;
  conversationHistory: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
    intention?: string;
  }>;
  candidateProfile?: any;
  createdAt: Date;
  lastActivity: Date;
  metadata?: Record<string, any>;
}

/**
 * Pagination parameters
 */
export interface PaginationParams {
  page?: number;
  limit?: number;
}

/**
 * Candidate list filters
 */
export interface CandidateFilters extends PaginationParams {
  status?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
  search?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
}
