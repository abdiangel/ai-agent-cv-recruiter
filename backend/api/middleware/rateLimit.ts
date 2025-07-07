import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals } from "../types";
import { TooManyRequestsError } from "./errorHandler";

// Simple in-memory rate limit store (use Redis in production)
const rateLimitStore = new Map<string, { count: number; resetTime: Date }>();

/**
 * Basic rate limiting middleware
 */
export function rateLimitMiddleware(
  windowMs: number = 15 * 60 * 1000, // 15 minutes
  maxRequests: number = 100,
) {
  return (req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction): void => {
    const clientId = req.ip || req.connection.remoteAddress || "unknown";
    const now = new Date();

    // Clean up expired entries
    for (const [key, value] of rateLimitStore.entries()) {
      if (value.resetTime < now) {
        rateLimitStore.delete(key);
      }
    }

    const existing = rateLimitStore.get(clientId);

    if (!existing) {
      // First request from this client
      rateLimitStore.set(clientId, {
        count: 1,
        resetTime: new Date(now.getTime() + windowMs),
      });
    } else if (existing.resetTime < now) {
      // Window has expired, reset
      existing.count = 1;
      existing.resetTime = new Date(now.getTime() + windowMs);
    } else if (existing.count >= maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((existing.resetTime.getTime() - now.getTime()) / 1000);

      res.setHeader("X-RateLimit-Limit", maxRequests.toString());
      res.setHeader("X-RateLimit-Remaining", "0");
      res.setHeader("X-RateLimit-Reset", existing.resetTime.toISOString());
      res.setHeader("Retry-After", retryAfter.toString());

      throw new TooManyRequestsError(`Rate limit exceeded. Try again in ${retryAfter} seconds.`);
    } else {
      // Increment counter
      existing.count++;
    }

    // Add rate limit headers
    const remaining = Math.max(0, maxRequests - (existing?.count || 0));
    res.setHeader("X-RateLimit-Limit", maxRequests.toString());
    res.setHeader("X-RateLimit-Remaining", remaining.toString());
    res.setHeader("X-RateLimit-Reset", (existing?.resetTime || now).toISOString());

    next();
  };
}
