import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";
import rateLimit from "express-rate-limit";

import simpleRoutes from "./routes/simple";

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
    origin: ["http://localhost:3000", "http://localhost:5173", "http://127.0.0.1:3000", "http://127.0.0.1:5173"],
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
 * API Routes
 */
app.use("/api", simpleRoutes);

/**
 * Error handling middleware
 */
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("API Error:", error);

  res.status(error.status || 500).json({
    success: false,
    error: error.message || "Internal server error",
    timestamp: new Date().toISOString(),
    requestId: (req as any).requestId,
  });
});

/**
 * 404 handler
 */
app.use("*", (req: express.Request, res: express.Response) => {
  res.status(404).json({
    success: false,
    error: "Endpoint not found",
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
      console.log(`💬 Chat API: http://localhost:${PORT}/api/chat/message`);
      console.log(`📋 Session API: http://localhost:${PORT}/api/chat/session/:id`);
      console.log(`📄 CV Upload: http://localhost:${PORT}/api/chat/upload-cv`);
      resolve(server);
    });

    server.on("error", reject);
  });
};

// Start server if this file is run directly
if (require.main === module) {
  startServer().catch(console.error);
}

export default app;
