import { randomUUID } from "crypto";
import { IntentionDetector } from "../intention/IntentionDetector";
import { AgentStateMachine } from "../state/AgentStateMachine";
import { CVParser } from "../cv/CVParser";
import { JailbreakDetector } from "../security/JailbreakDetector";
import { Logger } from "../utils/Logger";
import { CandidateIntention, IntentionDetectionResult, ConversationContext as IntentionContext } from "../intention/IntentionTypes";
import { AgentState, AgentAction as StateAction, AgentStateContext, StateTransitionResult } from "../state/AgentStates";
import { JailbreakDetectionResult, ConversationContext } from "../security/JailbreakTypes";
import { CVParsingResult } from "../cv/CVTypes";
import {
  UserSession,
  ConversationMessage,
  MessageProcessingResult,
  AgentAction,
  ResponseContext,
  RecruitingAgentConfig,
  ResponseTemplate,
  InterviewQuestion,
  AgentAnalytics,
  NotificationEvent,
} from "./RecruitingAgentTypes";

/**
 * Main RecruitingAgent class that orchestrates all components
 * Handles message processing, state transitions, and response generation
 */
export class RecruitingAgent {
  private readonly intentionDetector: IntentionDetector;
  private readonly stateMachine: AgentStateMachine;
  private readonly cvParser: CVParser;
  private readonly jailbreakDetector: JailbreakDetector;
  private readonly logger: Logger;
  private readonly config: RecruitingAgentConfig;

  // Session management
  private readonly sessions: Map<string, UserSession> = new Map();
  private readonly analytics: AgentAnalytics;

  // Response templates
  private readonly responseTemplates: Map<string, ResponseTemplate> = new Map();

  // Interview questions
  private readonly interviewQuestions: Map<string, InterviewQuestion> = new Map();

  constructor(config: RecruitingAgentConfig = {}) {
    this.config = {
      enableSmartResponses: true,
      personalizedResponses: true,
      enableJailbreakDetection: true,
      blockOnSecurity: true,
      logSecurityEvents: true,
      sessionTimeout: 30, // 30 minutes
      maxConversationLength: 50,
      enableSessionPersistence: true,
      enableCVParsing: true,
      autoExtractProfile: true,
      enableInterviewFlow: true,
      enableNotifications: false,
      enableAnalytics: true,
      trackUserEngagement: true,
      supportedLanguages: ["en", "es", "fr"],
      defaultLanguage: "en",
      enableRateLimiting: true,
      maxMessagesPerMinute: 30,
      ...config,
    };

    // Initialize components
    this.intentionDetector = new IntentionDetector(this.config.intentionDetector);
    this.stateMachine = new AgentStateMachine(this.config.stateMachine);
    this.cvParser = new CVParser(this.config.cvParser);
    this.jailbreakDetector = new JailbreakDetector(this.config.jailbreakDetector);
    this.logger = Logger.getInstance();

    // Initialize analytics
    this.analytics = {
      totalSessions: 0,
      averageSessionDuration: 0,
      completionRate: 0,
      intentionAccuracy: 0,
      commonIntentions: [],
      stateTransitions: [],
      userSatisfactionScore: 0,
      securityEvents: 0,
      cvParsingSuccessRate: 0,
    };

    // Initialize default response templates
    this.initializeResponseTemplates();

    // Initialize interview questions
    this.initializeInterviewQuestions();

    this.logger.info("RecruitingAgent initialized", {
      componentsEnabled: {
        intentionDetection: true,
        stateMachine: true,
        cvParsing: this.config.enableCVParsing,
        jailbreakDetection: this.config.enableJailbreakDetection,
        analytics: this.config.enableAnalytics,
      },
    });
  }

  /**
   * Main method to process incoming messages
   * @param message - The user message to process
   * @param sessionId - Session identifier
   * @param metadata - Optional metadata (IP, user agent, etc.)
   * @returns Processing result with response and actions
   */
  public async processMessage(
    message: string,
    sessionId: string,
    metadata?: {
      userAgent?: string;
      ipAddress?: string;
      userId?: string;
      language?: string;
    },
  ): Promise<MessageProcessingResult> {
    const startTime = Date.now();

    try {
      this.logger.info("Processing message", {
        sessionId,
        messageLength: message.length,
        userId: metadata?.userId,
      });

      // Get or create session
      const session = this.getOrCreateSession(sessionId, metadata);

      // Update session activity
      session.lastActivity = new Date();

      // Security check - jailbreak detection
      let jailbreakCheck: JailbreakDetectionResult;
      if (this.config.enableJailbreakDetection) {
        const conversationContext: ConversationContext = {
          messageHistory: session.conversationHistory.map((msg) => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
          })),
          sessionId,
          userId: metadata?.userId,
          currentMessage: message,
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          conversationLength: session.conversationHistory.length,
          timesSinceLastMessage:
            session.conversationHistory.length > 0
              ? Date.now() - session.conversationHistory[session.conversationHistory.length - 1].timestamp.getTime()
              : 0,
        };

        jailbreakCheck = await this.jailbreakDetector.detectJailbreak(message, conversationContext);

        // Block if high-risk jailbreak detected
        if (jailbreakCheck.isJailbreak && this.config.blockOnSecurity) {
          // Update analytics even when blocked
          const session = this.getOrCreateSession(sessionId, metadata);
          if (this.config.enableAnalytics) {
            this.updateAnalytics(
              session,
              { intention: CandidateIntention.JAILBREAK_ATTEMPT, confidence: jailbreakCheck.confidence, context: { isValid: false }, metadata: {} },
              jailbreakCheck,
            );
          }
          return this.createSecurityBlockedResponse(startTime, sessionId, jailbreakCheck);
        }
      } else {
        // Jailbreak detection is disabled
        jailbreakCheck = {
          isJailbreak: false,
          severity: "low" as any,
          confidence: 0,
          detectedTypes: [],
          detectionMethods: [],
          riskScore: 0,
          details: {
            matchedPatterns: [],
            suspiciousKeywords: [],
            contextFlags: ["jailbreak_detection_disabled"],
            reasoningChain: ["Jailbreak detection is disabled"],
          },
          metadata: {
            processingTime: 0,
            messageLength: message.length,
          },
        };
      }

      // Intention detection
      const intentionContext: IntentionContext = {
        conversationHistory: session.conversationHistory.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
        })),
        currentState: session.currentState,
        userProfile: session.candidateProfile,
        sessionId,
        language: metadata?.language || this.config.defaultLanguage || "en",
        previousIntentions: session.conversationHistory
          .filter((msg) => msg.role === "user" && msg.intention)
          .map((msg) => msg.intention!)
          .filter(Boolean) as CandidateIntention[],
        candidateId: metadata?.userId,
        jobId: session.jobApplication?.jobId,
        candidateProfile: session.candidateProfile
          ? {
              name: session.candidateProfile.fullName,
              email: session.candidateProfile.contactInfo?.email,
              skills: session.candidateProfile.technicalSkills?.map((s) => s.name),
              experience: session.candidateProfile.workExperience?.length,
            }
          : undefined,
      };

      const intention = await this.intentionDetector.detectIntention(message, intentionContext);

      // State transition
      const stateContext: AgentStateContext = {
        currentState: session.currentState,
        previousState: session.currentState,
        conversationData: {},
        timestamp: new Date(),
        candidateProfile: session.candidateProfile,
        jobApplication: session.jobApplication,
        conversationHistory: session.conversationHistory,
        sessionId,
        metadata: {
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          language: metadata?.language,
        },
      };

      const stateTransition = this.stateMachine.transition(intention.intention, stateContext.conversationData);

      // Update session state if transition was successful
      if (stateTransition.success) {
        session.currentState = stateTransition.newState;
      }

      // Generate response
      const responseContext: ResponseContext = {
        session,
        currentMessage: message,
        intention,
        previousResponses: session.conversationHistory
          .filter((msg) => msg.role === "assistant")
          .map((msg) => msg.content)
          .slice(-3), // Last 3 responses
        availableActions: [],
      };

      const response = await this.generateResponse(responseContext);

      // Determine actions
      const actions = await this.determineActions(session, intention, stateTransition);

      // Execute actions
      await this.executeActions(actions, session);

      // Add messages to conversation history
      const userMessage: ConversationMessage = {
        id: randomUUID(),
        role: "user",
        content: message,
        timestamp: new Date(),
        intention: intention.intention,
        confidence: intention.confidence,
        metadata: {
          jailbreakCheck,
          processingTime: Date.now() - startTime,
        },
      };

      const assistantMessage: ConversationMessage = {
        id: randomUUID(),
        role: "assistant",
        content: response,
        timestamp: new Date(),
      };

      session.conversationHistory.push(userMessage, assistantMessage);

      // Trim conversation history if too long
      if (session.conversationHistory.length > this.config.maxConversationLength!) {
        session.conversationHistory = session.conversationHistory.slice(-this.config.maxConversationLength!);
      }

      // Update analytics
      if (this.config.enableAnalytics) {
        this.updateAnalytics(session, intention, jailbreakCheck);
      }

      const result: MessageProcessingResult = {
        response,
        newState: stateTransition.newState,
        intention,
        jailbreakCheck,
        stateTransition,
        actions,
        confidence: intention.confidence,
        metadata: {
          processingTime: Date.now() - startTime,
          securityFlags: jailbreakCheck.isJailbreak ? ["jailbreak_detected"] : [],
          recommendedNextSteps: await this.getRecommendedNextSteps(session, intention),
        },
      };

      this.logger.info("Message processed successfully", {
        sessionId,
        intention: intention.intention,
        newState: stateTransition.newState,
        confidence: intention.confidence,
        processingTime: result.metadata.processingTime,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("Message processing failed", { sessionId, error: errorMessage });

      // Return error response
      return this.createErrorResponse(startTime, sessionId, errorMessage);
    }
  }

  /**
   * Handle CV upload and parsing
   * @param fileBuffer - CV file buffer
   * @param filename - Original filename
   * @param mimeType - File MIME type
   * @param sessionId - Session identifier
   * @returns CV parsing result
   */
  public async handleCVUpload(fileBuffer: Buffer, filename: string, mimeType: string, sessionId: string): Promise<CVParsingResult> {
    try {
      this.logger.info("Processing CV upload", {
        sessionId,
        filename,
        mimeType,
        size: fileBuffer.length,
      });

      if (!this.config.enableCVParsing) {
        throw new Error("CV parsing is not enabled");
      }

      const parsingResult = await this.cvParser.parseCV(fileBuffer, filename, mimeType);

      // Update session with parsed profile
      let session = this.sessions.get(sessionId);
      if (!session) {
        // Create session if it doesn't exist
        session = this.getOrCreateSession(sessionId, {});
      }

      if (session && parsingResult.success && parsingResult.profile) {
        session.candidateProfile = parsingResult.profile;

        // Trigger state transition to CV_UPLOADED
        this.stateMachine.transition(CandidateIntention.CV_UPLOAD, {
          candidateProfile: parsingResult.profile,
        });
      }

      // Send notification if enabled
      if (this.config.enableNotifications) {
        await this.sendNotification({
          type: "cv_uploaded",
          sessionId,
          timestamp: new Date(),
          data: { filename, success: parsingResult.success },
          severity: parsingResult.success ? "info" : "warning",
        });
      }

      return parsingResult;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("CV upload processing failed", { sessionId, error: errorMessage });
      throw error;
    }
  }

  /**
   * Get session information
   * @param sessionId - Session identifier
   * @returns User session or undefined
   */
  public getSession(sessionId: string): UserSession | undefined {
    return this.sessions.get(sessionId);
  }

  /**
   * Get all active sessions
   * @returns Array of user sessions
   */
  public getAllSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * End a session
   * @param sessionId - Session identifier
   * @returns Whether session was ended successfully
   */
  public endSession(sessionId: string): boolean {
    const session = this.sessions.get(sessionId);
    if (session) {
      this.logger.info("Ending session", { sessionId });
      this.sessions.delete(sessionId);
      return true;
    }
    return false;
  }

  /**
   * Get analytics data
   * @returns Current analytics
   */
  public getAnalytics(): AgentAnalytics {
    return { ...this.analytics };
  }

  /**
   * Update agent configuration
   * @param newConfig - New configuration options
   */
  public updateConfig(newConfig: Partial<RecruitingAgentConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info("Agent configuration updated", {
      updatedKeys: Object.keys(newConfig),
    });
  }

  /**
   * Get or create session
   * @private
   */
  private getOrCreateSession(
    sessionId: string,
    metadata?: { userAgent?: string; ipAddress?: string; userId?: string; language?: string },
  ): UserSession {
    let session = this.sessions.get(sessionId);

    if (!session) {
      session = {
        sessionId,
        userId: metadata?.userId,
        currentState: AgentState.GREETING,
        conversationHistory: [],
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: {
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          language: metadata?.language || this.config.defaultLanguage,
        },
      };

      this.sessions.set(sessionId, session);
      this.analytics.totalSessions++;

      this.logger.info("New session created", { sessionId, userId: metadata?.userId });

      // Send notification if enabled
      if (this.config.enableNotifications) {
        this.sendNotification({
          type: "session_started",
          sessionId,
          timestamp: new Date(),
          data: { userId: metadata?.userId },
          severity: "info",
        });
      }
    }

    return session;
  }

  /**
   * Generate response based on context
   * @private
   */
  private async generateResponse(context: ResponseContext): Promise<string> {
    const { session, currentMessage, intention, previousResponses } = context;

    // Try to find matching response template
    const template = this.findResponseTemplate(intention.intention, session.currentState);
    if (template) {
      return this.renderTemplate(template, {
        candidateName: session.candidateProfile?.fullName || "there",
        jobTitle: session.jobApplication?.jobTitle || "the position",
        company: session.jobApplication?.company || "our company",
        currentMessage,
        ...template.variables,
      });
    }

    // Default responses based on intention and state
    return this.generateDefaultResponse(intention, session);
  }

  /**
   * Find matching response template
   * @private
   */
  private findResponseTemplate(intention: CandidateIntention, state: AgentState): ResponseTemplate | undefined {
    const templates = Array.from(this.responseTemplates.values())
      .filter((template) => template.enabled)
      .filter(
        (template) =>
          (!template.triggers.intentions || template.triggers.intentions.includes(intention)) &&
          (!template.triggers.states || template.triggers.states.includes(state)),
      )
      .sort((a, b) => b.priority - a.priority);

    return templates[0];
  }

  /**
   * Render template with variables
   * @private
   */
  private renderTemplate(template: ResponseTemplate, variables: Record<string, any>): string {
    let rendered = template.template;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      rendered = rendered.replace(new RegExp(placeholder, "g"), String(value));
    }

    return rendered;
  }

  /**
   * Generate default response
   * @private
   */
  private generateDefaultResponse(intention: IntentionDetectionResult, session: UserSession): string {
    const { intention: intentionType } = intention;

    switch (intentionType) {
      case CandidateIntention.GREETING:
        const candidateName = session.candidateProfile?.fullName || "there";
        return `Hello ${candidateName}! Welcome to our recruitment system. I'm here to help you with your job application. How can I assist you today?`;

      case CandidateIntention.JOB_INQUIRY:
        return `I'd be happy to tell you about our available positions. We have several open roles that might interest you. What type of position are you looking for?`;

      case CandidateIntention.APPLICATION_STATUS:
        return session.jobApplication
          ? `Your application for ${session.jobApplication.jobTitle} is currently ${session.jobApplication.applicationStatus}. Let me know if you need more details.`
          : `I don't see any active applications for you yet. Would you like to start an application?`;

      case CandidateIntention.CV_UPLOAD:
        return `Please upload your CV/resume and I'll help you process it for your application.`;

      case CandidateIntention.INTERVIEW_PREP:
        return `I can help you prepare for your interview! Let me know what specific areas you'd like to focus on.`;

      case CandidateIntention.HELP_REQUEST:
        return `I'm here to help! I can assist you with job applications, CV reviews, interview preparation, and answering questions about our company and positions.`;

      case CandidateIntention.FAREWELL:
        return `Thank you for using our recruiting system! Feel free to reach out if you have any more questions. Good luck with your application!`;

      default:
        return `I understand you're interested in ${intentionType}. How can I help you with that?`;
    }
  }

  /**
   * Determine actions based on context
   * @private
   */
  private async determineActions(
    session: UserSession,
    intention: IntentionDetectionResult,
    stateTransition: StateTransitionResult,
  ): Promise<AgentAction[]> {
    const actions: AgentAction[] = [];

    // Default send message action
    actions.push({
      type: "send_message",
      timestamp: new Date(),
      executed: false,
    });

    // State-specific actions
    switch (stateTransition.newState) {
      case AgentState.CV_UPLOADED:
        if (session.candidateProfile) {
          actions.push({
            type: "update_profile",
            payload: { profile: session.candidateProfile },
            timestamp: new Date(),
            executed: false,
          });
        }
        break;

      case AgentState.INTERVIEW_SCHEDULING:
        actions.push({
          type: "schedule_interview",
          payload: { availableSlots: this.getAvailableInterviewSlots() },
          timestamp: new Date(),
          executed: false,
        });
        break;

      case AgentState.DOCUMENT_COLLECTION:
        actions.push({
          type: "request_documents",
          payload: { requiredDocuments: ["cv", "portfolio", "references"] },
          timestamp: new Date(),
          executed: false,
        });
        break;

      case AgentState.CLOSING:
        actions.push({
          type: "end_conversation",
          timestamp: new Date(),
          executed: false,
        });
        break;
    }

    // Intention-specific actions
    if (intention.intention === CandidateIntention.ESCALATION) {
      actions.push({
        type: "escalate_to_human",
        payload: { reason: "User requested human assistance" },
        timestamp: new Date(),
        executed: false,
      });
    }

    return actions;
  }

  /**
   * Execute actions
   * @private
   */
  private async executeActions(actions: AgentAction[], session: UserSession): Promise<void> {
    for (const action of actions) {
      try {
        switch (action.type) {
          case "send_message":
            // Already handled in main flow
            action.executed = true;
            break;

          case "update_profile":
            if (action.payload?.profile) {
              session.candidateProfile = action.payload.profile;
              this.logger.info("Profile updated", { sessionId: session.sessionId });
            }
            action.executed = true;
            break;

          case "schedule_interview":
            this.logger.info("Interview scheduling initiated", { sessionId: session.sessionId });
            action.executed = true;
            break;

          case "request_documents":
            this.logger.info("Document request sent", {
              sessionId: session.sessionId,
              documents: action.payload?.requiredDocuments,
            });
            action.executed = true;
            break;

          case "end_conversation":
            this.logger.info("Conversation ended", { sessionId: session.sessionId });
            action.executed = true;
            break;

          case "escalate_to_human":
            this.logger.info("Escalating to human", {
              sessionId: session.sessionId,
              reason: action.payload?.reason,
            });
            action.executed = true;
            break;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
        this.logger.error("Action execution failed", {
          sessionId: session.sessionId,
          action: action.type,
          error: errorMessage,
        });
        action.executed = false;
      }
    }
  }

  /**
   * Get recommended next steps
   * @private
   */
  private async getRecommendedNextSteps(session: UserSession, intention: IntentionDetectionResult): Promise<string[]> {
    const steps: string[] = [];

    switch (session.currentState) {
      case AgentState.GREETING:
        steps.push("Ask about available positions");
        steps.push("Upload your CV/resume");
        break;

      case AgentState.JOB_PRESENTATION:
      case AgentState.JOB_DISCUSSION:
        steps.push("Upload your CV if you haven't already");
        steps.push("Ask about specific job requirements");
        steps.push("Inquire about salary and benefits");
        break;

      case AgentState.CV_PROCESSING:
      case AgentState.CV_UPLOADED:
        steps.push("Review your parsed profile information");
        steps.push("Proceed with job application");
        break;

      case AgentState.APPLICATION_REVIEW:
        steps.push("Prepare for potential interview");
        steps.push("Ask about next steps in the process");
        break;

      case AgentState.INTERVIEW_SCHEDULING:
      case AgentState.INTERVIEW_PREPARATION:
        steps.push("Choose your preferred interview time");
        steps.push("Prepare for the interview");
        break;

      default:
        // Always provide some steps as fallback
        steps.push("Continue the conversation");
        steps.push("Ask if you need any help");
        break;
    }

    return steps;
  }

  /**
   * Get available interview slots (stub implementation)
   * @private
   */
  private getAvailableInterviewSlots(): string[] {
    // This would connect to a real scheduling system
    return ["Monday 10:00 AM", "Tuesday 2:00 PM", "Wednesday 9:00 AM", "Thursday 11:00 AM", "Friday 3:00 PM"];
  }

  /**
   * Create security blocked response
   * @private
   */
  private createSecurityBlockedResponse(startTime: number, sessionId: string, jailbreakCheck: JailbreakDetectionResult): MessageProcessingResult {
    const response = "I'm sorry, but I cannot process that request due to security concerns. Please rephrase your message in a professional manner.";

    this.logger.warn("Message blocked due to security", {
      sessionId,
      severity: jailbreakCheck.severity,
      riskScore: jailbreakCheck.riskScore,
    });

    return {
      response,
      newState: AgentState.GREETING, // Reset to safe state
      intention: {
        intention: CandidateIntention.JAILBREAK_ATTEMPT,
        confidence: jailbreakCheck.confidence,
        context: {
          isValid: false,
          validationErrors: ["Security violation detected"],
        },
        metadata: {
          detectionMethod: "jailbreak_detector",
          processingTime: Date.now() - startTime,
        },
      },
      jailbreakCheck,
      stateTransition: {
        success: false,
        newState: AgentState.GREETING,
        previousState: AgentState.GREETING,
        availableActions: [],
        reason: "Security violation - reset to safe state",
        actions: [],
        metadata: {
          transitionTime: Date.now() - startTime,
        },
      },
      actions: [],
      confidence: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        securityFlags: ["blocked_jailbreak"],
        recommendedNextSteps: ["Please rephrase your message professionally"],
      },
    };
  }

  /**
   * Create error response
   * @private
   */
  private createErrorResponse(startTime: number, sessionId: string, error: string): MessageProcessingResult {
    const response = "I apologize, but I encountered an error processing your message. Please try again.";

    return {
      response,
      newState: AgentState.GREETING,
      intention: {
        intention: CandidateIntention.UNKNOWN,
        confidence: 0,
        context: {
          isValid: false,
          validationErrors: [error],
        },
        metadata: {
          detectionMethod: "error_handler",
          processingTime: Date.now() - startTime,
        },
      },
      jailbreakCheck: {
        isJailbreak: false,
        severity: "low" as any,
        confidence: 0,
        detectedTypes: [],
        detectionMethods: [],
        riskScore: 0,
        details: {
          matchedPatterns: [],
          suspiciousKeywords: [],
          contextFlags: [],
          reasoningChain: [],
        },
        metadata: {
          processingTime: 0,
          messageLength: 0,
        },
      },
      stateTransition: {
        success: false,
        newState: AgentState.GREETING,
        previousState: AgentState.GREETING,
        availableActions: [],
        reason: `Error: ${error}`,
        actions: [],
        metadata: {
          transitionTime: Date.now() - startTime,
        },
      },
      actions: [],
      confidence: 0,
      metadata: {
        processingTime: Date.now() - startTime,
        securityFlags: ["processing_error"],
        recommendedNextSteps: ["Please try again"],
      },
    };
  }

  /**
   * Update analytics
   * @private
   */
  private updateAnalytics(session: UserSession, intention: IntentionDetectionResult, jailbreakCheck: JailbreakDetectionResult): void {
    // Update security events
    if (jailbreakCheck.isJailbreak) {
      this.analytics.securityEvents++;
      this.logger.info("Security event recorded", {
        sessionId: session.sessionId,
        totalSecurityEvents: this.analytics.securityEvents,
      });
    }

    // Update intention accuracy (simplified calculation)
    this.analytics.intentionAccuracy = this.analytics.intentionAccuracy * 0.9 + intention.confidence * 0.1;

    // Update common intentions
    const existingIntention = this.analytics.commonIntentions.find((ci) => ci.intention === intention.intention);
    if (existingIntention) {
      existingIntention.count++;
    } else {
      this.analytics.commonIntentions.push({
        intention: intention.intention,
        count: 1,
        percentage: 0, // Will be calculated later
      });
    }

    // Recalculate percentages
    const totalIntentions = this.analytics.commonIntentions.reduce((sum, ci) => sum + ci.count, 0);
    this.analytics.commonIntentions.forEach((ci) => {
      ci.percentage = (ci.count / totalIntentions) * 100;
    });
  }

  /**
   * Send notification
   * @private
   */
  private async sendNotification(event: NotificationEvent): Promise<void> {
    if (!this.config.enableNotifications) return;

    this.logger.info("Sending notification", {
      type: event.type,
      sessionId: event.sessionId,
      severity: event.severity,
    });

    // This would send to webhook or notification service
    if (this.config.notificationWebhook) {
      // Implementation would send HTTP request to webhook
      this.logger.info("Notification sent to webhook", {
        webhook: this.config.notificationWebhook,
        event: event.type,
      });
    }
  }

  /**
   * Initialize default response templates
   * @private
   */
  private initializeResponseTemplates(): void {
    const templates: ResponseTemplate[] = [
      {
        id: "greeting",
        name: "Greeting Response",
        triggers: {
          intentions: [CandidateIntention.GREETING],
          states: [AgentState.GREETING],
        },
        template:
          "Hello {{candidateName}}! Welcome to our recruitment system. I'm here to help you with your job application. How can I assist you today?",
        variables: {},
        priority: 10,
        enabled: true,
        language: "en",
      },
      {
        id: "job_inquiry",
        name: "Job Inquiry Response",
        triggers: {
          intentions: [CandidateIntention.JOB_INQUIRY],
        },
        template: "I'd be happy to tell you about our available positions at {{company}}. What type of role are you interested in?",
        variables: {},
        priority: 8,
        enabled: true,
        language: "en",
      },
      {
        id: "cv_upload_prompt",
        name: "CV Upload Prompt",
        triggers: {
          intentions: [CandidateIntention.CV_UPLOAD],
        },
        template: "Please upload your CV/resume and I'll help you process it for your application to {{jobTitle}}.",
        variables: {},
        priority: 9,
        enabled: true,
        language: "en",
      },
      {
        id: "help_response",
        name: "Help Response",
        triggers: {
          intentions: [CandidateIntention.HELP_REQUEST],
        },
        template:
          "I'm here to help! I can assist you with job applications, CV reviews, interview preparation, and answering questions about our company and positions. What would you like to know more about?",
        variables: {},
        priority: 7,
        enabled: true,
        language: "en",
      },
    ];

    for (const template of templates) {
      this.responseTemplates.set(template.id, template);
    }
  }

  /**
   * Initialize interview questions
   * @private
   */
  private initializeInterviewQuestions(): void {
    const questions: InterviewQuestion[] = [
      {
        id: "tell_me_about_yourself",
        question: "Tell me about yourself and your professional background.",
        category: "experience",
        difficulty: "easy",
        expectedAnswer: "Should include relevant experience, skills, and career goals",
        followUpQuestions: ["What motivated you to apply for this position?", "What are your long-term career goals?"],
        scoringCriteria: {
          maxScore: 10,
          criteria: [
            { aspect: "Clarity", weight: 0.3, description: "Clear and well-structured response" },
            { aspect: "Relevance", weight: 0.4, description: "Relevant to the position" },
            { aspect: "Professionalism", weight: 0.3, description: "Professional presentation" },
          ],
        },
      },
      {
        id: "technical_skills",
        question: "What programming languages and technologies are you most comfortable with?",
        category: "technical",
        difficulty: "medium",
        skills: ["programming", "technology"],
        expectedAnswer: "Should list relevant technologies with proficiency levels",
        followUpQuestions: ["Can you describe a recent project using these technologies?", "How do you stay updated with new technologies?"],
        scoringCriteria: {
          maxScore: 10,
          criteria: [
            { aspect: "Technical Knowledge", weight: 0.5, description: "Depth of technical understanding" },
            { aspect: "Real-world Application", weight: 0.3, description: "Practical experience" },
            { aspect: "Learning Mindset", weight: 0.2, description: "Willingness to learn" },
          ],
        },
      },
    ];

    for (const question of questions) {
      this.interviewQuestions.set(question.id, question);
    }
  }
}
