/**
 * AI Recruitment Agent API
 * Main entry point for the Express.js API server
 */

export * from "./types";
export { errorHandler, notFoundHandler } from "./middleware/errorHandler";
export { validate, validateFileUpload, sanitizeInput } from "./middleware/validation";
export { addRequestId } from "./middleware/requestId";
export { corsMiddleware } from "./middleware/cors";
export { rateLimitMiddleware } from "./middleware/rateLimit";
export * from "./services";
export * from "./controllers";
export * from "./routes";

// Export the main server
export { default as server } from "./server";
