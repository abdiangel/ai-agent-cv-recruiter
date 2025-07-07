import { Router } from "express";
import multer from "multer";
import { SimpleChatController } from "../controllers/simple/ChatController";

const router = Router();
const chatController = new SimpleChatController();

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// Add request ID middleware
router.use((req, res, next) => {
  (req as any).requestId = `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  next();
});

/**
 * Chat Routes
 */
router.post("/chat/message", chatController.processMessage);
router.post("/chat/upload-cv", upload.single("cv"), chatController.uploadCV);
router.get("/chat/session/:sessionId", chatController.getSession);
router.post("/chat/end-session", chatController.endSession);

/**
 * Admin Routes
 */
router.get("/admin/sessions", chatController.getActiveSessions);
router.delete("/admin/sessions/cleanup", chatController.cleanupSessions);

/**
 * Health Check
 */
router.get("/health", (req, res) => {
  res.json({
    success: true,
    data: {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
