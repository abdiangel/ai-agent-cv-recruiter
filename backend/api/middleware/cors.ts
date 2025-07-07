import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals } from "../types";

/**
 * CORS middleware
 */
export function corsMiddleware(req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction): void {
  // Allow origins (configure based on environment)
  const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || [
    "http://localhost:3000",
    "http://localhost:5173", // Vite default
  ];

  const origin = req.headers.origin;
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  next();
}
