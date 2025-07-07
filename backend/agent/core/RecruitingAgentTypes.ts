/**
 * Types for the main RecruitingAgent
 */

import { CandidateProfile } from "../cv/CVTypes";
import { JailbreakDetectionResult } from "../security/JailbreakTypes";
import { CandidateIntention, IntentionDetectionResult } from "../intention/IntentionTypes";
import { AgentState, StateTransitionResult } from "../state/AgentStates";

/**
 * Session information for tracking user conversations
 */
export interface UserSession {
  sessionId: string;
  userId?: string;
  currentState: AgentState;
  candidateProfile?: CandidateProfile;
  jobApplication?: JobApplication;
  conversationHistory: ConversationMessage[];
  createdAt: Date;
  lastActivity: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    language?: string;
  };
}

/**
 * Job application details
 */
export interface JobApplication {
  jobId: string;
  jobTitle: string;
  company: string;
  description: string;
  requirements: {
    requiredSkills: string[];
    preferredSkills: string[];
    minExperience: number;
    education?: string[];
  };
  applicationStatus: "pending" | "in_review" | "interview_scheduled" | "rejected" | "hired";
  appliedAt: Date;
  stages: ApplicationStage[];
}

/**
 * Application stage tracking
 */
export interface ApplicationStage {
  stage: "application" | "screening" | "phone_interview" | "technical_test" | "final_interview" | "offer";
  status: "pending" | "in_progress" | "completed" | "skipped";
  completedAt?: Date;
  notes?: string;
  score?: number;
}

/**
 * Conversation message
 */
export interface ConversationMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: Date;
  intention?: CandidateIntention;
  confidence?: number;
  metadata?: {
    jailbreakCheck?: JailbreakDetectionResult;
    processingTime?: number;
  };
}

/**
 * Message processing result
 */
export interface MessageProcessingResult {
  response: string;
  newState: AgentState;
  intention: IntentionDetectionResult;
  jailbreakCheck: JailbreakDetectionResult;
  stateTransition: StateTransitionResult;
  actions: AgentAction[];
  confidence: number;
  metadata: {
    processingTime: number;
    securityFlags: string[];
    recommendedNextSteps: string[];
  };
}

/**
 * Agent actions that can be performed
 */
export interface AgentAction {
  type: "send_message" | "update_profile" | "schedule_interview" | "request_documents" | "end_conversation" | "escalate_to_human";
  payload?: any;
  timestamp: Date;
  executed?: boolean;
}

/**
 * Response generation context
 */
export interface ResponseContext {
  session: UserSession;
  currentMessage: string;
  intention: IntentionDetectionResult;
  previousResponses: string[];
  availableActions: AgentAction[];
}

/**
 * Agent configuration
 */
export interface RecruitingAgentConfig {
  // Component configurations
  intentionDetector?: any;
  stateMachine?: any;
  cvParser?: any;
  jailbreakDetector?: any;

  // Response generation
  enableSmartResponses?: boolean;
  responseTemplates?: ResponseTemplate[];
  personalizedResponses?: boolean;

  // Security settings
  enableJailbreakDetection?: boolean;
  blockOnSecurity?: boolean;
  logSecurityEvents?: boolean;

  // Session management
  sessionTimeout?: number; // minutes
  maxConversationLength?: number;
  enableSessionPersistence?: boolean;

  // CV processing
  enableCVParsing?: boolean;
  autoExtractProfile?: boolean;

  // Interview workflow
  enableInterviewFlow?: boolean;
  customInterviewQuestions?: string[];

  // Notifications
  enableNotifications?: boolean;
  notificationWebhook?: string;

  // Analytics
  enableAnalytics?: boolean;
  trackUserEngagement?: boolean;

  // Multi-language support
  supportedLanguages?: string[];
  defaultLanguage?: string;

  // Rate limiting
  enableRateLimiting?: boolean;
  maxMessagesPerMinute?: number;
}

/**
 * Response template for different situations
 */
export interface ResponseTemplate {
  id: string;
  name: string;
  triggers: {
    intentions?: CandidateIntention[];
    states?: AgentState[];
    conditions?: string[];
  };
  template: string;
  variables?: Record<string, any>;
  priority: number;
  enabled: boolean;
  language?: string;
}

/**
 * Interview question configuration
 */
export interface InterviewQuestion {
  id: string;
  question: string;
  category: "technical" | "behavioral" | "experience" | "company_fit";
  difficulty: "easy" | "medium" | "hard";
  skills?: string[];
  expectedAnswer?: string;
  followUpQuestions?: string[];
  scoringCriteria?: ScoringCriteria;
}

/**
 * Scoring criteria for interview questions
 */
export interface ScoringCriteria {
  maxScore: number;
  criteria: Array<{
    aspect: string;
    weight: number;
    description: string;
  }>;
}

/**
 * Agent analytics data
 */
export interface AgentAnalytics {
  totalSessions: number;
  averageSessionDuration: number;
  completionRate: number;
  intentionAccuracy: number;
  commonIntentions: Array<{
    intention: CandidateIntention;
    count: number;
    percentage: number;
  }>;
  stateTransitions: Array<{
    from: AgentState;
    to: AgentState;
    count: number;
  }>;
  userSatisfactionScore: number;
  securityEvents: number;
  cvParsingSuccessRate: number;
}

/**
 * Job matching result
 */
export interface JobMatchResult {
  jobId: string;
  jobTitle: string;
  company: string;
  matchScore: number; // 0-100
  reasons: string[];
  skillMatches: string[];
  skillGaps: string[];
  salaryRange?: {
    min: number;
    max: number;
    currency: string;
  };
  location?: string;
  remote?: boolean;
  matchingFactors: Array<{
    factor: string;
    score: number;
    weight: number;
  }>;
}

/**
 * Candidate evaluation result
 */
export interface CandidateEvaluation {
  overallScore: number; // 0-100
  strengths: string[];
  weaknesses: string[];
  recommendations: string[];
  skillAssessment: Array<{
    skill: string;
    level: "beginner" | "intermediate" | "advanced" | "expert";
    verified: boolean;
    score: number;
  }>;
  experienceAssessment: {
    totalYears: number;
    relevantYears: number;
    progressionRate: number;
    leadershipExperience: boolean;
  };
  culturalFit: {
    score: number;
    factors: string[];
    concerns: string[];
  };
  interviewReadiness: {
    score: number;
    preparationLevel: "low" | "medium" | "high";
    suggestedPreparation: string[];
  };
}

/**
 * Notification event
 */
export interface NotificationEvent {
  type: "session_started" | "cv_uploaded" | "interview_scheduled" | "security_alert" | "evaluation_completed";
  sessionId: string;
  timestamp: Date;
  data: any;
  severity: "info" | "warning" | "error";
}
