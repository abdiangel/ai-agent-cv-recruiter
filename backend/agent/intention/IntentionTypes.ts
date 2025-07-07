/**
 * Candidate intention types during recruitment conversations
 */
export enum CandidateIntention {
  GREETING = "greeting",
  JOB_INQUIRY = "job_inquiry",
  SALARY_QUESTION = "salary_question",
  BENEFITS_QUESTION = "benefits_question",
  EXPERIENCE_VALIDATION = "experience_validation",
  TECHNICAL_SKILLS_DISCUSSION = "technical_skills_discussion",
  EDUCATION_DISCUSSION = "education_discussion",
  AVAILABILITY_DISCUSSION = "availability_discussion",
  LOCATION_QUESTION = "location_question",
  COMPANY_CULTURE_QUESTION = "company_culture_question",
  CAREER_GROWTH_QUESTION = "career_growth_question",
  CV_UPLOAD = "cv_upload",
  HELP_REQUEST = "help_request",
  JAILBREAK_ATTEMPT = "jailbreak_attempt",
  UNKNOWN = "unknown",
  // Additional enum values needed by tests
  APPLICATION_STATUS = "application_status",
  INTERVIEW_PREP = "interview_prep",
  FAREWELL = "farewell",
  ESCALATION = "escalation",
}

/**
 * Context validation types for intention detection
 */
export enum ContextValidation {
  VALID = "valid",
  INVALID = "invalid",
  REQUIRES_CLARIFICATION = "requires_clarification",
}

/**
 * Context interface for conversation tracking
 */
export interface ConversationContext {
  currentState: string;
  candidateId?: string;
  jobId?: string;
  previousIntentions: CandidateIntention[];
  conversationHistory:
    | string[]
    | Array<{
        role: string;
        content: string;
        timestamp: Date;
      }>;
  candidateProfile?: {
    name?: string;
    email?: string;
    skills?: string[];
    experience?: number;
  };
  sessionId?: string;
  language?: string;
  userProfile?: any;
}

/**
 * Intention detection result interface
 */
export interface IntentionDetectionResult {
  intention: CandidateIntention;
  confidence: number;
  context:
    | ContextValidation
    | {
        isValid: boolean;
        validationErrors?: string[];
      };
  metadata?: Record<string, any>;
}

/**
 * Intention detector configuration interface
 */
export interface IntentionDetectorConfig {
  confidenceThreshold?: number;
  enableJailbreakDetection?: boolean;
  enableMultiLanguageSupport?: boolean;
  customPatterns?: Partial<Record<CandidateIntention, RegExp[]>>;
}
