// API Response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  timestamp: string;
  requestId?: string;
}

// Chat message types
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

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

export interface ChatMessageResponse {
  response: string;
  sessionId: string;
  userId?: string;
  currentState?: string;
  messageCount?: number;
  metadata?: {
    processingTime?: number;
    tokensUsed?: number;
    confidence?: number;
  };
}

// CV upload types
export interface UploadCVRequest {
  sessionId: string;
  userId?: string;
  metadata?: Record<string, any>;
}

export interface CVParsingResult {
  success: boolean;
  profile?: CandidateProfile;
  extractedText?: string;
  confidence?: number;
  metadata?: {
    processingTime?: number;
    fileSize?: number;
    pageCount?: number;
    language?: string;
  };
  errors?: string[];
}

export interface CandidateProfile {
  personalInfo?: {
    name?: string;
    email?: string;
    phone?: string;
    address?: string;
    linkedin?: string;
    github?: string;
  };
  experience?: Array<{
    company?: string;
    position?: string;
    startDate?: string;
    endDate?: string;
    description?: string;
    technologies?: string[];
  }>;
  education?: Array<{
    institution?: string;
    degree?: string;
    field?: string;
    startDate?: string;
    endDate?: string;
    gpa?: string;
  }>;
  skills?: {
    technical?: string[];
    soft?: string[];
    languages?: string[];
  };
  projects?: Array<{
    name?: string;
    description?: string;
    technologies?: string[];
    url?: string;
  }>;
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

// Session types
export interface UserSession {
  sessionId: string;
  userId?: string;
  conversationHistory: ChatMessage[];
  candidateProfile?: CandidateProfile;
  createdAt: string;
  lastActivity: string;
  metadata?: {
    userAgent?: string;
    ipAddress?: string;
    language?: string;
  };
}

// Error types
export interface ApiError {
  message: string;
  code?: string;
  details?: any;
}
