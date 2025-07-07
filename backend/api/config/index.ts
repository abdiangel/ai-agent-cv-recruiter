import { config } from "dotenv";

// Load environment variables
config();

/**
 * API Configuration
 */
export const apiConfig = {
  port: parseInt(process.env.PORT || "3001"),
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS settings
  cors: {
    allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || [
      "http://localhost:3000",
      "http://localhost:5173",
      "http://127.0.0.1:3000",
      "http://127.0.0.1:5173",
    ],
  },

  // Rate limiting
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: process.env.NODE_ENV === "production" ? 100 : 1000,
  },

  // File upload settings
  upload: {
    maxFileSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ],
  },

  // Security settings
  security: {
    enableHelmet: true,
    enableCors: true,
    enableRateLimit: true,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    format: process.env.NODE_ENV === "production" ? "combined" : "dev",
  },
};
