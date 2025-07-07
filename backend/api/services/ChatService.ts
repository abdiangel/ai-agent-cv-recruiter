import {
  RecruitingAgent,
  RecruitingAgentConfig,
  CVParser,
  UserSession,
  MessageProcessingResult,
  CVParsingResult,
  CandidateProfile,
  AgentState,
} from "../../agent";
import { CVParserConfig } from "../../agent/cv/CVTypes";
import {
  ChatMessageRequest,
  ChatMessageResponse,
  UploadCVRequest,
  UploadCVResponse,
  SessionDetailsResponse,
  EndSessionRequest,
  EndSessionResponse,
} from "../types";
import { NotFoundError } from "../middleware/errorHandler";
import { randomUUID } from "crypto";

/**
 * Chat service handles all chat-related operations
 */
export class ChatService {
  private agent: RecruitingAgent;
  private cvParser: CVParser;
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    // Initialize the recruiting agent with default config
    const agentConfig: RecruitingAgentConfig = {
      enableJailbreakDetection: true,
      enableCVParsing: true,
      logSecurityEvents: true,
      enableSessionPersistence: true,
      sessionTimeout: 30, // 30 minutes
      maxConversationLength: 100,
    };

    this.agent = new RecruitingAgent(agentConfig);

    const cvConfig: CVParserConfig = {
      enableOCR: false, // Disable OCR for now
      maxFileSize: 10 * 1024 * 1024, // 10MB
      confidenceThreshold: 0.7,
      timeoutMs: 30000, // 30 seconds
    };

    this.cvParser = new CVParser(cvConfig);
  }

  /**
   * Process a chat message from the user
   */
  async processMessage(request: ChatMessageRequest): Promise<ChatMessageResponse> {
    const { message, sessionId, userId, metadata } = request;

    // Get or create session
    let session = this.sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        conversationHistory: [],
        currentState: "GREETING",
        candidateProfile: undefined,
        createdAt: new Date(),
        lastActivity: new Date(),
        metadata: {
          userAgent: metadata?.userAgent,
          ipAddress: metadata?.ipAddress,
          language: metadata?.language || "en",
        },
      };
      this.sessions.set(sessionId, session);
    }

    // Update last activity
    session.lastActivity = new Date();

    // Process message with agent
    const result = await this.agent.processMessage(message, session.sessionId);

    // Update session with new conversation history and state
    if (result.conversationHistory) {
      session.conversationHistory = result.conversationHistory;
    }
    session.currentState = result.newState;

    // If candidate profile was updated, save it
    if (result.candidateProfile) {
      session.candidateProfile = result.candidateProfile;
    }

    // Update session in store
    this.sessions.set(sessionId, session);

    return {
      ...result,
      sessionId,
      userId,
    };
  }

  /**
   * Upload and parse a CV file
   */
  async uploadCV(
    request: UploadCVRequest,
    file: {
      fieldname: string;
      originalname: string;
      encoding: string;
      mimetype: string;
      size: number;
      destination: string;
      filename: string;
      path: string;
      buffer: Buffer;
    },
  ): Promise<UploadCVResponse> {
    if (!file) {
      throw new Error("No file provided");
    }

    const { sessionId, userId } = request;

    // Get session
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError(`Session ${sessionId} not found`);
    }

    // Parse CV
    const parsingResult: CVParsingResult = await this.cvParser.parseCV(file.buffer, {
      filename: file.originalname,
      mimeType: file.mimetype,
    });

    // Update session with parsed profile
    if (parsingResult.profile) {
      session.candidateProfile = {
        ...session.candidateProfile,
        ...parsingResult.profile,
      };
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);
    }

    const uploadId = randomUUID();

    return {
      ...parsingResult,
      sessionId,
      uploadId,
      fileInfo: {
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
      },
    };
  }

  /**
   * Get session details and conversation summary
   */
  async getSessionDetails(sessionId: string): Promise<SessionDetailsResponse> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError(`Session ${sessionId} not found`);
    }

    // Calculate conversation metrics
    const totalMessages = session.conversationHistory.length;
    const sessionStart = session.createdAt;
    const sessionEnd = session.lastActivity;
    const sessionDuration = sessionEnd.getTime() - sessionStart.getTime();

    // Analyze intentions from conversation history
    const intentionBreakdown: Record<string, number> = {};
    let totalResponseTime = 0;

    session.conversationHistory.forEach((msg) => {
      if (msg.intention) {
        const intention = msg.intention || "UNKNOWN";
        intentionBreakdown[intention] = (intentionBreakdown[intention] || 0) + 1;
      }
      if (msg.metadata?.processingTime) {
        totalResponseTime += msg.metadata.processingTime;
      }
    });

    const averageResponseTime = totalMessages > 0 ? totalResponseTime / totalMessages : 0;

    // Generate recommendations based on session data
    const recommendations: string[] = [];
    if (session.candidateProfile) {
      if (session.candidateProfile.technicalSkills?.length > 5) {
        recommendations.push("Candidate has diverse technical skill set");
      }
      if (session.candidateProfile.totalYearsExperience >= 5) {
        recommendations.push("Experienced candidate");
      }
    }

    return {
      session,
      conversationSummary: {
        totalMessages,
        averageResponseTime,
        intentionBreakdown,
        currentState: session.currentState.toString(),
        sessionDuration,
      },
      recommendations,
    };
  }

  /**
   * End a chat session
   */
  async endSession(request: EndSessionRequest): Promise<EndSessionResponse> {
    const { sessionId, reason, feedback } = request;

    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new NotFoundError(`Session ${sessionId} not found`);
    }

    const endedAt = new Date().toISOString();
    const sessionStart = session.createdAt;
    const sessionEnd = new Date(endedAt);
    const duration = sessionEnd.getTime() - sessionStart.getTime();

    // Determine completion status
    let completionStatus: "completed" | "abandoned" | "transferred" = "completed";
    if (reason === "timeout" || reason === "user_left") {
      completionStatus = "abandoned";
    } else if (reason === "escalation") {
      completionStatus = "transferred";
    }

    // Mark session as ended
    session.lastActivity = new Date(endedAt);
    session.metadata = {
      ...session.metadata,
      endReason: reason,
      endedAt: new Date().toISOString(),
      feedback,
      endedAt,
    };

    // In a real application, you might want to persist this to a database
    // For now, we'll keep it in memory
    this.sessions.set(sessionId, session);

    return {
      sessionId,
      endedAt,
      sessionSummary: {
        duration,
        messageCount: session.conversationHistory.length,
        finalState: session.currentState.toString(),
        completionStatus,
      },
    };
  }

  /**
   * Get all active sessions (for admin/monitoring)
   */
  getActiveSessions(): UserSession[] {
    return Array.from(this.sessions.values());
  }

  /**
   * Clean up old sessions (call periodically)
   */
  cleanupOldSessions(olderThanHours: number = 24): void {
    const cutoffTime = Date.now() - olderThanHours * 60 * 60 * 1000;

    for (const [sessionId, session] of this.sessions.entries()) {
      const lastActivity = session.lastActivity.getTime();
      if (lastActivity < cutoffTime) {
        this.sessions.delete(sessionId);
      }
    }
  }
}
