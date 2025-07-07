import { Router } from "express";
import chatRoutes from "./chat";
import hrRoutes from "./hr";
import systemRoutes from "./system";

const router = Router();

// Mount route modules
router.use("/chat", chatRoutes);
router.use("/hr", hrRoutes);
router.use("/system", systemRoutes);

// API documentation endpoint
router.get("/", (req, res) => {
  res.json({
    message: "AI Recruitment Agent API",
    version: "1.0.0",
    endpoints: {
      chat: {
        "POST /api/chat/message": "Process a chat message",
        "POST /api/chat/upload-cv": "Upload and parse CV",
        "GET /api/chat/session/:sessionId": "Get session details",
        "POST /api/chat/end-session": "End a session",
        "GET /api/chat/sessions": "Get active sessions (admin)",
        "DELETE /api/chat/sessions/cleanup": "Cleanup old sessions (admin)",
      },
      hr: {
        "GET /api/hr/candidates": "List candidates with filters",
        "GET /api/hr/reports/:candidateId": "Get candidate report",
        "PUT /api/hr/candidates/:candidateId/status": "Update candidate status",
        "GET /api/hr/analytics": "HR analytics",
        "GET /api/hr/export/candidates": "Export candidates CSV",
      },
      system: {
        "GET /api/system/health": "Health check",
        "GET /api/system/stats": "System statistics (admin)",
        "GET /api/system/info": "System information (admin)",
      },
    },
    documentation: "https://docs.example.com/api",
    timestamp: new Date().toISOString(),
  });
});

export default router;
