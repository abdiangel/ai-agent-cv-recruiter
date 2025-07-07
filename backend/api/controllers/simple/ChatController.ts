import { NextFunction } from "express";
import { RecruitingAgent } from "../../../agent/core/RecruitingAgent";
import { CVParser } from "../../../agent/cv/CVParser";
import { SimpleRequest, SimpleResponse, ApiResponse, ChatMessageRequest, UploadCVRequest, UserSession } from "../../types/simple";

/**
 * Simplified Chat Controller
 */
export class SimpleChatController {
  private agent: RecruitingAgent;
  private cvParser: CVParser;
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    this.agent = new RecruitingAgent();
    this.cvParser = new CVParser();
  }

  /**
   * Process a chat message
   */
  public processMessage = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const { message, sessionId, userId, metadata } = req.body as ChatMessageRequest;

      // Get or create session
      let session = this.sessions.get(sessionId);
      if (!session) {
        session = {
          sessionId,
          userId,
          currentState: "GREETING",
          conversationHistory: [],
          createdAt: new Date(),
          lastActivity: new Date(),
          metadata,
        };
        this.sessions.set(sessionId, session);
      }

      // Process message with agent
      const result = await this.agent.processMessage(message, sessionId);

      // Update session
      session.conversationHistory.push({
        role: "user",
        content: message,
        timestamp: new Date().toISOString(),
      });

      session.conversationHistory.push({
        role: "assistant",
        content: result.response,
        timestamp: new Date().toISOString(),
      });

      session.lastActivity = new Date();

      // Send response
      const response: ApiResponse = {
        success: true,
        data: {
          response: result.response,
          sessionId: sessionId,
          currentState: result.newState || session.currentState,
          suggestions: [],
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Upload and parse CV
   */
  public uploadCV = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const { sessionId, userId, metadata } = req.body as UploadCVRequest;
      const file = req.file;

      if (!file) {
        return res.status(400).json({
          success: false,
          error: "No file uploaded",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
      }

      // Parse CV
      const parsingResult = await this.cvParser.parseCV(file.buffer, file.originalname, file.mimetype);

      // Get session
      const session = this.sessions.get(sessionId);
      if (session) {
        session.candidateProfile = parsingResult;
        session.lastActivity = new Date();
      }

      const response: ApiResponse = {
        success: true,
        data: {
          parsingResult,
          sessionId,
        },
        message: "CV uploaded and parsed successfully",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get session details
   */
  public getSession = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
      }

      const response: ApiResponse = {
        success: true,
        data: {
          session: {
            ...session,
            messageCount: session.conversationHistory.length,
          },
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * End session
   */
  public endSession = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const { sessionId, reason, feedback } = req.body;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: "Session not found",
          timestamp: new Date().toISOString(),
          requestId: req.requestId,
        });
      }

      // Update session metadata
      session.metadata = {
        ...session.metadata,
        endReason: reason,
        endedAt: new Date().toISOString(),
        feedback,
      };

      const response: ApiResponse = {
        success: true,
        data: {
          sessionId,
          endedAt: new Date().toISOString(),
          totalMessages: session.conversationHistory.length,
        },
        message: "Session ended successfully",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Get active sessions (admin)
   */
  public getActiveSessions = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const sessions = Array.from(this.sessions.values());
      const activeSessions = sessions.filter((s) => !s.metadata?.endedAt);

      const response: ApiResponse = {
        success: true,
        data: {
          activeSessions: activeSessions.length,
          totalSessions: sessions.length,
          sessions: activeSessions.map((s) => ({
            sessionId: s.sessionId,
            userId: s.userId,
            currentState: s.currentState,
            messageCount: s.conversationHistory.length,
            createdAt: s.createdAt,
            lastActivity: s.lastActivity,
          })),
        },
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };

  /**
   * Cleanup old sessions (admin)
   */
  public cleanupSessions = async (req: SimpleRequest, res: SimpleResponse, next: NextFunction) => {
    try {
      const olderThanHours = parseInt(req.query.olderThanHours as string) || 24;
      const cutoffTime = new Date(Date.now() - olderThanHours * 60 * 60 * 1000);

      let cleanedCount = 0;
      const sessionEntries = Array.from(this.sessions.entries());
      for (const [sessionId, session] of sessionEntries) {
        if (session.lastActivity < cutoffTime) {
          this.sessions.delete(sessionId);
          cleanedCount++;
        }
      }

      const response: ApiResponse = {
        success: true,
        data: {
          cleanedSessions: cleanedCount,
          remainingSessions: this.sessions.size,
        },
        message: `Cleaned up ${cleanedCount} old sessions`,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      res.status(200).json(response);
    } catch (error: any) {
      next(error);
    }
  };
}
