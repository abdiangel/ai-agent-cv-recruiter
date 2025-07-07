import { Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals, ApiResponse } from "../types";
import { ChatService } from "../services";
import { asyncHandler } from "../middleware/errorHandler";
import { ChatMessageResponse, UploadCVResponse, SessionDetailsResponse, EndSessionResponse } from "../types";

/**
 * Chat controller handles all chat-related API endpoints
 */
export class ChatController {
  private chatService: ChatService;

  constructor() {
    this.chatService = new ChatService();
  }

  /**
   * POST /api/chat/message
   * Process a chat message from the user
   */
  processMessage = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const result = await this.chatService.processMessage(req.body);

    const response: ApiResponse<ChatMessageResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/chat/upload-cv
   * Upload and parse a CV file
   */
  uploadCV = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    if (!req.file) {
      const response: ApiResponse = {
        success: false,
        error: "No file uploaded",
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };
      res.status(400).json(response);
      return;
    }

    const result = await this.chatService.uploadCV(req.body, req.file);

    const response: ApiResponse<UploadCVResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/chat/session/:sessionId
   * Get session details and conversation summary
   */
  getSession = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const { sessionId } = req.params;
    const result = await this.chatService.getSessionDetails(sessionId);

    const response: ApiResponse<SessionDetailsResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * POST /api/chat/end-session
   * End a chat session
   */
  endSession = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const result = await this.chatService.endSession(req.body);

    const response: ApiResponse<EndSessionResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/chat/sessions (admin endpoint)
   * Get all active sessions
   */
  getActiveSessions = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const sessions = this.chatService.getActiveSessions();

    const response: ApiResponse = {
      success: true,
      data: {
        sessions,
        total: sessions.length,
        activeSessions: sessions.filter((s) => !s.metadata?.endedAt).length,
      },
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * DELETE /api/chat/sessions/cleanup (admin endpoint)
   * Clean up old sessions
   */
  cleanupSessions = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const { olderThanHours } = req.query;
    const hours = olderThanHours ? parseInt(olderThanHours as string) : 24;

    this.chatService.cleanupOldSessions(hours);

    const response: ApiResponse = {
      success: true,
      message: `Cleaned up sessions older than ${hours} hours`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });
}
