import { CandidateIntention, ContextValidation } from "../types/enums";

/**
 * Context interface for conversation tracking
 */
export interface ConversationContext {
  currentState: string;
  candidateId?: string;
  jobId?: string;
  previousIntentions: CandidateIntention[];
  conversationHistory: string[];
  candidateProfile?: {
    name?: string;
    email?: string;
    skills?: string[];
    experience?: number;
  };
}

/**
 * Intention detection result interface
 */
export interface IntentionDetectionResult {
  intention: CandidateIntention;
  confidence: number;
  context: ContextValidation;
  metadata?: Record<string, any>;
}

/**
 * IntentionDetector class for analyzing candidate messages and detecting intentions
 */
export class IntentionDetector {
  private readonly greetingPatterns: RegExp[] = [
    /^(hi|hello|hey|good morning|good afternoon|good evening)\b/i,
    /^(hola|buenos días|buenas tardes|buenas noches)\b/i,
    /^(bonjour|bonsoir|salut)\b/i,
  ];

  private readonly jobInquiryPatterns: RegExp[] = [
    /\b(job|position|role|opening|vacancy|opportunity)\b/i,
    /\b(work|working|employment|career)\b/i,
    /\b(apply|application|applying)\b/i,
    /\b(requirements|qualifications|skills needed)\b/i,
  ];

  private readonly salaryPatterns: RegExp[] = [
    /\b(salary|wage|pay|compensation|money|income)\b/i,
    /\b(how much|price|cost|rate|budget)\b/i,
    /\b(dollars|euro|currency|payment)\b/i,
    /\bsalary\s+(for|range|is|amount)\b/i,
  ];

  private readonly benefitsPatterns: RegExp[] = [
    /\b(benefits|perks|advantages|insurance|health)\b/i,
    /\b(vacation|holidays|time off|pto)\b/i,
    /\b(retirement|pension|401k|bonus)\b/i,
  ];

  private readonly jailbreakPatterns: RegExp[] = [
    /\b(ignore|forget|disregard)\s+(previous|all|your)\s+(instructions|rules|guidelines)\b/i,
    /\b(ignore|forget|disregard)\s*all\s*(previous|instructions)\b/i,
    /\b(system|admin|debug|test|override)\b/i,
    /\b(pretend|act as|role.?play)\b/i,
    /\b(off.?topic|change subject|different topic)\b/i,
    /\boverride\s+(your|the)\s+(guidelines|rules|instructions)\b/i,
  ];

  private readonly helpPatterns: RegExp[] = [
    /\b(help|assist|support|guide|explain)\b/i,
    /\b(how to|what is|what does|can you)\b/i,
    /\b(confused|don't understand|unclear)\b/i,
  ];

  /**
   * Detects the intention of a candidate message
   * @param message - The candidate's message
   * @param context - Current conversation context
   * @returns Promise<IntentionDetectionResult>
   */
  public async detectIntention(message: string, context: ConversationContext): Promise<IntentionDetectionResult> {
    const cleanedMessage = this.cleanMessage(message);

    // Check for jailbreak attempts first
    if (this.matchesPatterns(cleanedMessage, this.jailbreakPatterns)) {
      return this.createResult(CandidateIntention.JAILBREAK_ATTEMPT, 0.9, ContextValidation.INVALID);
    }

    // Check for greeting
    if (this.matchesPatterns(cleanedMessage, this.greetingPatterns)) {
      return this.createResult(CandidateIntention.GREETING, 0.8, this.validateGreeting(context));
    }

    // Check for salary questions first (more specific)
    if (this.matchesPatterns(cleanedMessage, this.salaryPatterns)) {
      return this.createResult(CandidateIntention.SALARY_QUESTION, 0.8, this.validateSalaryQuestion(context));
    }

    // Check for job inquiry (more general)
    if (this.matchesPatterns(cleanedMessage, this.jobInquiryPatterns)) {
      return this.createResult(CandidateIntention.JOB_INQUIRY, 0.8, this.validateJobInquiry(context));
    }

    // Check for benefits questions
    if (this.matchesPatterns(cleanedMessage, this.benefitsPatterns)) {
      return this.createResult(CandidateIntention.BENEFITS_QUESTION, 0.8, this.validateBenefitsQuestion(context));
    }

    // Check for help requests
    if (this.matchesPatterns(cleanedMessage, this.helpPatterns)) {
      return this.createResult(CandidateIntention.HELP_REQUEST, 0.7, ContextValidation.VALID);
    }

    // Check for farewell
    if (this.isFarewell(cleanedMessage)) {
      return this.createResult(CandidateIntention.CLOSING_FAREWELL, 0.8, ContextValidation.VALID);
    }

    // Check for CV upload indication
    if (this.isCVUpload(cleanedMessage)) {
      return this.createResult(CandidateIntention.CV_UPLOAD, 0.9, this.validateCVUpload(context));
    }

    // Default to unknown
    return this.createResult(CandidateIntention.UNKNOWN, 0.3, ContextValidation.REQUIRES_CLARIFICATION);
  }

  /**
   * Validates if an intention is appropriate for the current context
   * @param intention - The detected intention
   * @param context - Current conversation context
   * @returns boolean
   */
  public validateIntentionContext(intention: CandidateIntention, context: ConversationContext): boolean {
    switch (intention) {
      case CandidateIntention.GREETING:
        return context.previousIntentions.length === 0 || !context.previousIntentions.includes(CandidateIntention.GREETING);

      case CandidateIntention.JOB_INQUIRY:
        return context.jobId !== undefined;

      case CandidateIntention.SALARY_QUESTION:
      case CandidateIntention.BENEFITS_QUESTION:
        return context.currentState === "q_and_a" || context.currentState === "job_presentation";

      case CandidateIntention.CV_UPLOAD:
        return context.currentState === "survey" || context.currentState === "cv_processing";

      case CandidateIntention.JAILBREAK_ATTEMPT:
        return false; // Always invalid

      default:
        return true;
    }
  }

  /**
   * Cleans and normalizes the message for pattern matching
   * @param message - Raw message
   * @returns Cleaned message
   */
  private cleanMessage(message: string): string {
    return message.trim().toLowerCase();
  }

  /**
   * Checks if message matches any of the provided patterns
   * @param message - Message to check
   * @param patterns - Array of RegExp patterns
   * @returns boolean
   */
  private matchesPatterns(message: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(message));
  }

  /**
   * Creates an intention detection result
   * @param intention - Detected intention
   * @param confidence - Confidence score (0-1)
   * @param context - Context validation result
   * @returns IntentionDetectionResult
   */
  private createResult(intention: CandidateIntention, confidence: number, context: ContextValidation): IntentionDetectionResult {
    return {
      intention,
      confidence,
      context,
      metadata: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Validates greeting context
   */
  private validateGreeting(context: ConversationContext): ContextValidation {
    return context.previousIntentions.includes(CandidateIntention.GREETING) ? ContextValidation.INVALID : ContextValidation.VALID;
  }

  /**
   * Validates job inquiry context
   */
  private validateJobInquiry(context: ConversationContext): ContextValidation {
    return context.jobId ? ContextValidation.VALID : ContextValidation.REQUIRES_CLARIFICATION;
  }

  /**
   * Validates salary question context
   */
  private validateSalaryQuestion(context: ConversationContext): ContextValidation {
    return ["q_and_a", "job_presentation"].includes(context.currentState) ? ContextValidation.VALID : ContextValidation.REQUIRES_CLARIFICATION;
  }

  /**
   * Validates benefits question context
   */
  private validateBenefitsQuestion(context: ConversationContext): ContextValidation {
    return ["q_and_a", "job_presentation"].includes(context.currentState) ? ContextValidation.VALID : ContextValidation.REQUIRES_CLARIFICATION;
  }

  /**
   * Validates CV upload context
   */
  private validateCVUpload(context: ConversationContext): ContextValidation {
    return ["survey", "cv_processing"].includes(context.currentState) ? ContextValidation.VALID : ContextValidation.REQUIRES_CLARIFICATION;
  }

  /**
   * Checks if message is a farewell
   */
  private isFarewell(message: string): boolean {
    const farewellPatterns = [
      /\b(bye|goodbye|see you|farewell|thanks|thank you|adios|au revoir)\b/i,
      /^(that's all|no more questions|i'm done|finished)\b/i,
    ];
    return this.matchesPatterns(message, farewellPatterns);
  }

  /**
   * Checks if message indicates CV upload
   */
  private isCVUpload(message: string): boolean {
    const cvPatterns = [/\b(cv|resume|curriculum|vitae)\b/i, /\b(upload|attach|send|share)\b.*\b(file|document|pdf)\b/i];
    return this.matchesPatterns(message, cvPatterns);
  }
}
