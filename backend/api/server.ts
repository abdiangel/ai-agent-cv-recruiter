import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

// Route imports
import chatRoutes from "./routes/chat";
import hrRoutes from "./routes/hr";
import systemRoutes from "./routes/system";
import simpleRoutes from "./routes/simple";
import apiRoutes from "./routes/index";

// Middleware imports
import { errorHandler } from "./middleware/errorHandler";
import { addRequestId } from "./middleware/requestId";

// Agent import
import { RecruitingAgent } from "../agent/core/RecruitingAgent";

/**
 * Create Express application
 */
const app = express();

/**
 * Security middleware
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
  }),
);

/**
 * CORS configuration
 */
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173", "http://localhost:3001"],
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  }),
);

/**
 * Rate limiting
 */
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === "production" ? 100 : 1000,
  message: {
    success: false,
    error: "Too many requests from this IP",
    timestamp: new Date().toISOString(),
  },
});

app.use(limiter);

/**
 * Request ID middleware
 */
app.use(addRequestId as any);

/**
 * Body parsing and compression
 */
app.use(compression());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

/**
 * Logging
 */
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

/**
 * Initialize the recruiting agent
 */
const recruitingAgent = new RecruitingAgent();

/**
 * Store sessions in memory (for development)
 */
const sessions = new Map<string, any>();

/**
 * API Routes - Mount all route modules
 */
app.use("/api", apiRoutes); // Main API routes (includes chat, hr, system)
app.use("/api/simple", simpleRoutes); // Simple routes under /api/simple prefix

/**
 * Legacy endpoints for backward compatibility
 * These maintain the original server.ts functionality
 */

// Health check endpoint (legacy)
app.get("/api/health", (req: any, res: any) => {
  res.json({
    success: true,
    message: "AI Recruitment Agent API is running",
    timestamp: new Date().toISOString(),
    version: "1.0.0",
  });
});

// Legacy chat message endpoint with direct RecruitingAgent integration
app.post("/api/legacy/chat/message", async (req: any, res: any) => {
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
    console.error("Legacy chat message error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Legacy get session endpoint
app.get("/api/legacy/chat/session/:sessionId", (req: any, res: any) => {
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
    console.error("Legacy get session error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

// Legacy get active sessions (admin)
app.get("/api/legacy/admin/sessions", (req: any, res: any) => {
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
    console.error("Legacy get sessions error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Internal server error",
    });
  }
});

/**
 * Error handling middleware
 */
app.use(errorHandler as any);

/**
 * 404 handler
 */
app.use((req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
  });
});

/**
 * Server configuration
 */
const PORT = parseInt(process.env.PORT || "3001");

/**
 * Start server
 */
export const startServer = () => {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, () => {
      console.log(`🚀 AI Recruitment Agent API Server started on port ${PORT}`);
      console.log(`📖 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📋 API Documentation: http://localhost:${PORT}/api/`);
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/message`);
      console.log(`📄 CV Upload: http://localhost:${PORT}/api/chat/upload-cv`);
      console.log(`👥 HR API: http://localhost:${PORT}/api/hr/candidates`);
      console.log(`🔧 System API: http://localhost:${PORT}/api/system/health`);
      console.log(`🔄 Legacy API: http://localhost:${PORT}/api/legacy/chat/message`);
      resolve(server);
    });

    server.on("error", reject);

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
  });
};

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}

export default app;
