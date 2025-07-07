import { CandidateIntention } from "../intention/IntentionTypes";

/**
 * Agent state types for the recruitment conversation flow
 */
export enum AgentState {
  GREETING = "greeting",
  JOB_PRESENTATION = "job_presentation",
  Q_AND_A = "q_and_a",
  SURVEY = "survey",
  CV_PROCESSING = "cv_processing",
  TECHNICAL_VALIDATION = "technical_validation",
  SKILL_ASSESSMENT = "skill_assessment",
  FINAL_INTERVIEW = "final_interview",
  CLOSING = "closing",
  EVALUATION = "evaluation",
  ERROR = "error",
  JAILBREAK_DETECTED = "jailbreak_detected",
  // Additional enum values needed by tests
  INTERVIEW_PREPARATION = "interview_preparation",
  JOB_DISCUSSION = "job_discussion",
  DOCUMENT_COLLECTION = "document_collection",
  CV_UPLOADED = "cv_uploaded",
  APPLICATION_REVIEW = "application_review",
  INTERVIEW_SCHEDULING = "interview_scheduling",
}

/**
 * Available actions for each agent state
 */
export enum AgentAction {
  SEND_GREETING = "send_greeting",
  PRESENT_JOB = "present_job",
  ANSWER_QUESTION = "answer_question",
  ASK_SURVEY_QUESTION = "ask_survey_question",
  PROCESS_CV = "process_cv",
  VALIDATE_TECHNICAL_SKILLS = "validate_technical_skills",
  CONDUCT_SKILL_ASSESSMENT = "conduct_skill_assessment",
  CONDUCT_FINAL_INTERVIEW = "conduct_final_interview",
  GENERATE_REPORT = "generate_report",
  END_CONVERSATION = "end_conversation",
  HANDLE_ERROR = "handle_error",
  BLOCK_JAILBREAK = "block_jailbreak",
  REQUEST_CLARIFICATION = "request_clarification",
}

/**
 * State transition configuration interface
 */
export interface StateTransition {
  from: AgentState;
  to: AgentState;
  trigger: CandidateIntention;
  condition?: (context: any) => boolean;
}

/**
 * Agent state context interface
 */
export interface AgentStateContext {
  currentState: AgentState;
  previousState?: AgentState;
  candidateId?: string;
  jobId?: string;
  conversationData: Record<string, any>;
  timestamp: Date;
  // Additional properties needed by RecruitingAgent
  candidateProfile?: any;
  jobApplication?: any;
  conversationHistory?: any[];
  sessionId?: string;
  metadata?: Record<string, any>;
}

/**
 * State machine result interface
 */
export interface StateTransitionResult {
  success: boolean;
  newState: AgentState;
  previousState?: AgentState;
  availableActions: AgentAction[];
  message?: string;
  reason?: string;
  actions?: any[];
  metadata?: Record<string, any>;
}

/**
 * State machine configuration interface
 */
export interface StateMachineConfig {
  initialState?: AgentState;
  enableLogging?: boolean;
  enableStateHistory?: boolean;
  customTransitions?: StateTransition[];
}
