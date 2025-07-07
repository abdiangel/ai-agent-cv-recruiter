import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals, ApiError } from "../types";

/**
 * Global error handler middleware
 * Catches all errors and formats them consistently
 */
export function errorHandler(error: Error, req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction): void {
  console.error(`[${req.requestId}] Error:`, error);

  // Default error response
  let statusCode = 500;
  let apiError: ApiError = {
    success: false,
    error: "Internal server error",
    code: "INTERNAL_ERROR",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  // Handle specific error types
  if (error.name === "ValidationError") {
    statusCode = 400;
    apiError = {
      ...apiError,
      error: "Validation failed",
      code: "VALIDATION_ERROR",
    };
  } else if (error.name === "UnauthorizedError") {
    statusCode = 401;
    apiError = {
      ...apiError,
      error: "Unauthorized access",
      code: "UNAUTHORIZED",
    };
  } else if (error.name === "ForbiddenError") {
    statusCode = 403;
    apiError = {
      ...apiError,
      error: "Access forbidden",
      code: "FORBIDDEN",
    };
  } else if (error.name === "NotFoundError") {
    statusCode = 404;
    apiError = {
      ...apiError,
      error: "Resource not found",
      code: "NOT_FOUND",
    };
  } else if (error.name === "ConflictError") {
    statusCode = 409;
    apiError = {
      ...apiError,
      error: "Resource conflict",
      code: "CONFLICT",
    };
  } else if (error.name === "TooManyRequestsError") {
    statusCode = 429;
    apiError = {
      ...apiError,
      error: "Too many requests",
      code: "RATE_LIMIT_EXCEEDED",
    };
  }

  // Add stack trace in development
  if (process.env.NODE_ENV === "development") {
    apiError.stack = error.stack;
  }

  // Custom error message if provided
  if (error.message && error.message !== "Internal server error") {
    apiError.error = error.message;
  }

  res.status(statusCode).json(apiError);
}

/**
 * 404 handler for unmatched routes
 */
export function notFoundHandler(req: AuthenticatedRequest, res: ApiResponseLocals): void {
  const apiError: ApiError = {
    success: false,
    error: `Route ${req.method} ${req.path} not found`,
    code: "ROUTE_NOT_FOUND",
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  };

  res.status(404).json(apiError);
}

/**
 * Custom error classes
 */
export class ValidationError extends Error {
  constructor(
    message: string,
    public details?: any,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends Error {
  constructor(message = "Unauthorized access") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Access forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Resource not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ConflictError extends Error {
  constructor(message = "Resource conflict") {
    super(message);
    this.name = "ConflictError";
  }
}

export class TooManyRequestsError extends Error {
  constructor(message = "Too many requests") {
    super(message);
    this.name = "TooManyRequestsError";
  }
}

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors automatically
 */
export function asyncHandler<T = any>(fn: (req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction) => Promise<T>) {
  return (req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
