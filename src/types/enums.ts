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
  CLOSING_FAREWELL = "closing_farewell",
  CV_UPLOAD = "cv_upload",
  HELP_REQUEST = "help_request",
  JAILBREAK_ATTEMPT = "jailbreak_attempt",
  UNKNOWN = "unknown",
}

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
 * Context validation types for intention detection
 */
export enum ContextValidation {
  VALID = "valid",
  INVALID = "invalid",
  REQUIRES_CLARIFICATION = "requires_clarification",
}
