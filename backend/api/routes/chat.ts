import { Router, RequestHandler } from "express";
import multer from "multer";
import { ChatController } from "../controllers";
import { validate, validateFileUpload, sanitizeInput } from "../middleware/validation";

const router = Router();
const chatController = new ChatController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Allow only specific file types
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed."));
    }
  },
});

// Cast middleware functions to RequestHandler
const sanitizeInputHandler = sanitizeInput as RequestHandler;
const validateFileUploadHandler = validateFileUpload as RequestHandler;

/**
 * @route   POST /api/chat/message
 * @desc    Process a chat message from the user
 * @access  Public
 * @body    { message: string, sessionId: string, userId?: string, metadata?: object }
 */
router.post(
  "/message",
  sanitizeInputHandler,
  validate("chatMessage") as RequestHandler,
  chatController.processMessage.bind(chatController) as RequestHandler,
);

/**
 * @route   POST /api/chat/upload-cv
 * @desc    Upload and parse a CV file
 * @access  Public
 * @body    { sessionId: string, userId?: string }
 * @file    CV file (PDF, DOC, DOCX, TXT)
 */
router.post(
  "/upload-cv",
  upload.single("cv"),
  sanitizeInputHandler,
  validate("uploadCV") as RequestHandler,
  validateFileUploadHandler,
  chatController.uploadCV.bind(chatController) as RequestHandler,
);

/**
 * @route   GET /api/chat/session/:sessionId
 * @desc    Get session details and conversation summary
 * @access  Public
 * @params  sessionId - Session identifier
 */
router.get("/session/:sessionId", validate("sessionId") as RequestHandler, chatController.getSession.bind(chatController) as RequestHandler);

/**
 * @route   POST /api/chat/end-session
 * @desc    End a chat session
 * @access  Public
 * @body    { sessionId: string, reason?: string, feedback?: object }
 */
router.post(
  "/end-session",
  sanitizeInputHandler,
  validate("endSession") as RequestHandler,
  chatController.endSession.bind(chatController) as RequestHandler,
);

/**
 * @route   GET /api/chat/sessions
 * @desc    Get all active sessions (admin endpoint)
 * @access  Admin
 */
router.get(
  "/sessions",
  // TODO: Add authentication middleware for admin endpoints
  chatController.getActiveSessions.bind(chatController) as RequestHandler,
);

/**
 * @route   DELETE /api/chat/sessions/cleanup
 * @desc    Clean up old sessions (admin endpoint)
 * @access  Admin
 * @query   olderThanHours - Hours threshold for cleanup (default: 24)
 */
router.delete(
  "/sessions/cleanup",
  // TODO: Add authentication middleware for admin endpoints
  chatController.cleanupSessions.bind(chatController) as RequestHandler,
);

export default router;
