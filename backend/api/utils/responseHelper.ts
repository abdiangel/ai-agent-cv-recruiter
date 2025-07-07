import { Response } from "express";
import { ApiResponse, ApiError } from "../types";

/**
 * Response helper utilities for consistent API responses
 */
export class ResponseHelper {
  /**
   * Send success response
   */
  static success<T>(res: Response, data: T, message?: string, statusCode: number = 200): void {
    const response: ApiResponse<T> = {
      success: true,
      data,
      message,
      timestamp: new Date().toISOString(),
      requestId: (res.locals as any)?.requestId,
    };

    res.status(statusCode).json(response);
  }

  /**
   * Send error response
   */
  static error(res: Response, error: string, statusCode: number = 500, code?: string, details?: any): void {
    const response: ApiError = {
      success: false,
      error,
      code: code || "INTERNAL_ERROR",
      details,
      timestamp: new Date().toISOString(),
      requestId: (res.locals as any)?.requestId,
    };

    // Add stack trace in development
    if (process.env.NODE_ENV === "development" && details instanceof Error) {
      response.stack = details.stack;
    }

    res.status(statusCode).json(response);
  }

  /**
   * Send validation error response
   */
  static validationError(res: Response, errors: any[]): void {
    ResponseHelper.error(res, "Validation failed", 400, "VALIDATION_ERROR", errors);
  }

  /**
   * Send not found response
   */
  static notFound(res: Response, resource: string = "Resource"): void {
    ResponseHelper.error(res, `${resource} not found`, 404, "NOT_FOUND");
  }

  /**
   * Send unauthorized response
   */
  static unauthorized(res: Response, message: string = "Unauthorized"): void {
    ResponseHelper.error(res, message, 401, "UNAUTHORIZED");
  }

  /**
   * Send forbidden response
   */
  static forbidden(res: Response, message: string = "Forbidden"): void {
    ResponseHelper.error(res, message, 403, "FORBIDDEN");
  }
}
