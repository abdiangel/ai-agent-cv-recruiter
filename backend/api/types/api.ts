import { Request, Response } from "express";
import { CandidateProfile, MessageProcessingResult, UserSession, CVParsingResult, AgentAnalytics } from "../../agent";

/**
 * Base API Response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

/**
 * Paginated response structure
 */
export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

/**
 * Chat API Types
 */

// POST /api/chat/message
export interface ChatMessageRequest {
  message: string;
  sessionId: string;
  userId?: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    language?: string;
    timestamp?: string;
  };
}

export interface ChatMessageResponse extends MessageProcessingResult {
  sessionId: string;
  userId?: string;
}

// POST /api/chat/upload-cv
export interface UploadCVRequest {
  sessionId: string;
  userId?: string;
  filename?: string;
  // File will be in req.file from multer
}

export interface UploadCVResponse extends CVParsingResult {
  sessionId: string;
  uploadId: string;
  fileInfo: {
    originalName: string;
    mimeType: string;
    size: number;
    uploadedAt: string;
  };
}

// GET /api/chat/session/:sessionId
export interface SessionDetailsResponse {
  session: UserSession;
  conversationSummary: {
    totalMessages: number;
    averageResponseTime: number;
    intentionBreakdown: Record<string, number>;
    currentState: string;
    sessionDuration: number;
  };
  recommendations?: string[];
}

// POST /api/chat/end-session
export interface EndSessionRequest {
  sessionId: string;
  reason?: string;
  feedback?: {
    rating?: number; // 1-5
    comment?: string;
    wasHelpful?: boolean;
  };
}

export interface EndSessionResponse {
  sessionId: string;
  endedAt: string;
  sessionSummary: {
    duration: number;
    messageCount: number;
    finalState: string;
    completionStatus: "completed" | "abandoned" | "transferred";
  };
}

/**
 * HR API Types
 */

// GET /api/hr/candidates
export interface CandidateListRequest {
  page?: number;
  limit?: number;
  status?: "active" | "completed" | "rejected" | "pending";
  sortBy?: "name" | "score" | "date" | "experience";
  sortOrder?: "asc" | "desc";
  search?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
}

export interface CandidateListItem {
  candidateId: string;
  sessionId: string;
  profile: Pick<CandidateProfile, "fullName" | "contactInfo" | "totalYearsExperience">;
  evaluation: {
    overallScore: number;
    skillsMatch: number;
    experienceLevel: "junior" | "mid" | "senior" | "lead";
    status: "new" | "screening" | "interview" | "evaluation" | "decision";
  };
  applicationDate: string;
  lastActivity: string;
  topSkills: string[];
}

export interface CandidateListResponse extends PaginatedResponse<CandidateListItem> {
  summary: {
    totalCandidates: number;
    averageScore: number;
    statusBreakdown: Record<string, number>;
    topSkills: Array<{ skill: string; count: number }>;
  };
}

// GET /api/hr/reports/:candidateId
export interface CandidateReportResponse {
  candidate: {
    profile: CandidateProfile;
    sessionInfo: UserSession;
    applicationTimeline: Array<{
      timestamp: string;
      event: string;
      description: string;
      state?: string;
    }>;
  };
  evaluation: {
    overallAssessment: {
      score: number;
      recommendation: "hire" | "consider" | "reject";
      reasoning: string[];
      strengths: string[];
      concerns: string[];
    };
    skillsAnalysis: {
      technicalSkills: Array<{
        skill: string;
        level: number; // 1-5
        required: boolean;
        assessment: string;
      }>;
      softSkills: Array<{
        skill: string;
        evidence: string[];
        assessment: string;
      }>;
    };
    interviewSummary?: {
      responses: Array<{
        question: string;
        answer: string;
        score: number;
        notes: string;
      }>;
      overallPerformance: number;
      communicationScore: number;
      technicalScore: number;
    };
  };
  analytics: {
    conversationMetrics: {
      responseTime: number;
      engagementLevel: number;
      completionRate: number;
      questionAsked: number;
    };
    behavioralAnalysis: {
      enthusiasm: number;
      professionalism: number;
      clarity: number;
      proactiveness: number;
    };
  };
  recommendations: {
    nextSteps: string[];
    interviewFocus: string[];
    additionalSkillsNeeded: string[];
  };
  generatedAt: string;
}

/**
 * System API Types
 */

export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: string;
  version: string;
  services: {
    agent: "up" | "down";
    database: "up" | "down";
    storage: "up" | "down";
  };
  performance: {
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
  };
}

export interface SystemStatsResponse {
  analytics: AgentAnalytics;
  systemMetrics: {
    activeSessions: number;
    totalSessions: number;
    averageSessionDuration: number;
    peakConcurrentSessions: number;
    cvProcessed: number;
    securityEvents: number;
  };
  performance: {
    averageResponseTime: number;
    successRate: number;
    errorRate: number;
    uptime: number;
  };
}

/**
 * Error Response Types
 */

export interface ValidationError {
  field: string;
  message: string;
  value?: any;
}

export interface ApiError extends ApiResponse {
  success: false;
  error: string;
  code: string;
  details?: ValidationError[];
  stack?: string; // Only in development
}

/**
 * Extended Request/Response Types
 */

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    role: "admin" | "hr" | "interviewer";
    permissions: string[];
  };
  requestId: string;
  // Remove the custom file property - multer will add this automatically
}

export interface ApiResponseLocals extends Response {
  locals: {
    requestId: string;
    startTime: number;
    user?: AuthenticatedRequest["user"];
  };
}

/**
 * Middleware Types
 */

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: Date;
  retryAfter?: number;
}

export interface RequestValidationSchema {
  body?: any;
  params?: any;
  query?: any;
  headers?: any;
}

/**
 * Configuration Types
 */

export interface ApiConfig {
  port: number;
  host: string;
  cors: {
    origin: string | string[];
    credentials: boolean;
  };
  rateLimit: {
    windowMs: number;
    max: number;
  };
  upload: {
    maxFileSize: number;
    allowedMimeTypes: string[];
    destination: string;
  };
  security: {
    enableHelmet: boolean;
    enableCors: boolean;
    enableRateLimit: boolean;
  };
  logging: {
    level: "debug" | "info" | "warn" | "error";
    format: "json" | "text";
  };
}

/**
 * Database Types (for future use)
 */

export interface DatabaseSession {
  id: string;
  sessionId: string;
  userId?: string;
  candidateProfile?: CandidateProfile;
  conversationHistory: any[];
  currentState: string;
  startedAt: Date;
  lastActivity: Date;
  endedAt?: Date;
  metadata: Record<string, any>;
}

export interface DatabaseCandidate {
  id: string;
  sessionId: string;
  profile: CandidateProfile;
  evaluation: any;
  status: string;
  appliedAt: Date;
  updatedAt: Date;
  hrNotes?: string;
  interviewScheduled?: Date;
}

/**
 * Utility Types
 */

export type ApiHandler<T = any> = (req: AuthenticatedRequest, res: ApiResponseLocals) => Promise<ApiResponse<T> | void>;

export type MiddlewareHandler = (req: AuthenticatedRequest, res: ApiResponseLocals, next: Function) => Promise<void> | void;

export type ErrorHandler = (error: Error, req: AuthenticatedRequest, res: ApiResponseLocals, next: Function) => Promise<void> | void;
