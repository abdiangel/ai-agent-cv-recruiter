import { NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals } from "../types";
import { randomUUID } from "crypto";

/**
 * Add unique request ID to each request
 */
export function addRequestId(req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction): void {
  req.requestId = randomUUID();
  res.locals.requestId = req.requestId;
  res.locals.startTime = Date.now();

  next();
}
