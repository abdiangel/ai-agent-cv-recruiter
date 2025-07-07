const express = require("express");
const cors = require("cors");
import { RecruitingAgent } from "../agent/core/RecruitingAgent";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: "10mb" }));

// Initialize the recruiting agent
const recruitingAgent = new RecruitingAgent();

// Store sessions in memory (for development)
const sessions = new Map<string, any>();

// Health check endpoint
app.get("/api/health", (req: any, res: any) => {
  res.json({
    success: true,
    message: "AI Recruitment Agent API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Chat message endpoint
app.post("/api/chat/message", async (req: any, res: any) => {
  try {
    const { message, sessionId, userId } = req.body;

    if (!message || !sessionId) {
      return res.status(400).json({
        success: false,
        error: "Message and sessionId are required",
      });
    }

    // Get or create session
    let session = sessions.get(sessionId);
    if (!session) {
      session = {
        sessionId,
        userId,
        conversationHistory: [],
        createdAt: new Date().toISOString(),
        lastActivity: new Date().toISOString(),
      };
      sessions.set(sessionId, session);
    }

    // Process message with recruiting agent
    const result = await recruitingAgent.processMessage(message, sessionId);

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

    session.lastActivity = new Date().toISOString();
    sessions.set(sessionId, session);

    res.json({
      success: true,
      data: {
        response: result.response,
        sessionId: sessionId,
        currentState: result.newState,
        messageCount: session.conversationHistory.length,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Chat message error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Get session endpoint
app.get("/api/chat/session/:sessionId", (req: any, res: any) => {
  try {
    const { sessionId } = req.params;
    const session = sessions.get(sessionId);

    if (!session) {
      return res.status(404).json({
        success: false,
        error: "Session not found",
      });
    }

    res.json({
      success: true,
      data: { session },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get session error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Get active sessions (admin)
app.get("/api/admin/sessions", (req: any, res: any) => {
  try {
    const allSessions = Array.from(sessions.values());

    res.json({
      success: true,
      data: {
        totalSessions: allSessions.length,
        sessions: allSessions.map((s) => ({
          sessionId: s.sessionId,
          userId: s.userId,
          messageCount: s.conversationHistory.length,
          createdAt: s.createdAt,
          lastActivity: s.lastActivity,
        })),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("Get sessions error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Error handling middleware
app.use((error: any, req: any, res: any, next: any) => {
  console.error("Unhandled error:", error);
  res.status(500).json({
    success: false,
    error: "Internal server error",
    timestamp: new Date().toISOString(),
  });
});

// 404 handler
app.use((req: any, res: any) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`🚀 AI Recruitment Agent API Server started on port ${PORT}`);
  console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/message`);
  console.log(`📋 Session API: http://localhost:${PORT}/api/chat/session/:id`);
  console.log(`🛠️  Admin API: http://localhost:${PORT}/api/admin/sessions`);
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("\n🔄 SIGTERM received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("\n🔄 SIGINT received, shutting down gracefully...");
  server.close(() => {
    console.log("✅ Server closed successfully");
    process.exit(0);
  });
});

export default app;
