import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals, ValidationError, ApiError } from "../types";

/**
 * Validation schemas for different endpoints
 */
export const validationSchemas = {
  chatMessage: {
    body: {
      message: { required: true, type: "string", minLength: 1, maxLength: 5000 },
      sessionId: { required: true, type: "string", pattern: /^[a-zA-Z0-9\-_]+$/ },
      userId: { required: false, type: "string" },
      metadata: { required: false, type: "object" },
    },
  },

  uploadCV: {
    body: {
      sessionId: { required: true, type: "string", pattern: /^[a-zA-Z0-9\-_]+$/ },
      userId: { required: false, type: "string" },
    },
  },

  sessionId: {
    params: {
      sessionId: { required: true, type: "string", pattern: /^[a-zA-Z0-9\-_]+$/ },
    },
  },

  endSession: {
    body: {
      sessionId: { required: true, type: "string", pattern: /^[a-zA-Z0-9\-_]+$/ },
      reason: { required: false, type: "string", maxLength: 500 },
      feedback: { required: false, type: "object" },
    },
  },

  candidateList: {
    query: {
      page: { required: false, type: "number", min: 1 },
      limit: { required: false, type: "number", min: 1, max: 100 },
      status: { required: false, type: "string", enum: ["active", "completed", "rejected", "pending"] },
      sortBy: { required: false, type: "string", enum: ["name", "score", "date", "experience"] },
      sortOrder: { required: false, type: "string", enum: ["asc", "desc"] },
      search: { required: false, type: "string", maxLength: 100 },
      minExperience: { required: false, type: "number", min: 0 },
      maxExperience: { required: false, type: "number", min: 0 },
    },
  },

  candidateId: {
    params: {
      candidateId: { required: true, type: "string", pattern: /^[a-zA-Z0-9\-_]+$/ },
    },
  },
};

/**
 * Generic validation function
 */
function validateField(value: any, field: string, rules: any): ValidationError | null {
  // Required field check
  if (rules.required && (value === undefined || value === null || value === "")) {
    return { field, message: `${field} is required`, value };
  }

  // Skip validation if field is not required and empty
  if (!rules.required && (value === undefined || value === null)) {
    return null;
  }

  // Type validation
  if (rules.type) {
    const actualType = Array.isArray(value) ? "array" : typeof value;
    if (actualType !== rules.type) {
      return { field, message: `${field} must be of type ${rules.type}`, value };
    }
  }

  // String validations
  if (rules.type === "string" && typeof value === "string") {
    if (rules.minLength && value.length < rules.minLength) {
      return { field, message: `${field} must be at least ${rules.minLength} characters long`, value };
    }
    if (rules.maxLength && value.length > rules.maxLength) {
      return { field, message: `${field} must be no more than ${rules.maxLength} characters long`, value };
    }
    if (rules.pattern && !rules.pattern.test(value)) {
      return { field, message: `${field} format is invalid`, value };
    }
    if (rules.enum && !rules.enum.includes(value)) {
      return { field, message: `${field} must be one of: ${rules.enum.join(", ")}`, value };
    }
  }

  // Number validations
  if (rules.type === "number" && typeof value === "number") {
    if (rules.min !== undefined && value < rules.min) {
      return { field, message: `${field} must be at least ${rules.min}`, value };
    }
    if (rules.max !== undefined && value > rules.max) {
      return { field, message: `${field} must be no more than ${rules.max}`, value };
    }
  }

  // Array validations
  if (rules.type === "array" && Array.isArray(value)) {
    if (rules.minItems && value.length < rules.minItems) {
      return { field, message: `${field} must have at least ${rules.minItems} items`, value };
    }
    if (rules.maxItems && value.length > rules.maxItems) {
      return { field, message: `${field} must have no more than ${rules.maxItems} items`, value };
    }
  }

  return null;
}

/**
 * Validation middleware factory
 */
export function validate(schemaName: keyof typeof validationSchemas) {
  return (req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction) => {
    const schema = validationSchemas[schemaName] as any;
    const errors: ValidationError[] = [];

    // Validate body
    if (schema.body) {
      for (const [field, rules] of Object.entries(schema.body)) {
        const error = validateField(req.body?.[field], `body.${field}`, rules);
        if (error) errors.push(error);
      }
    }

    // Validate params
    if (schema.params) {
      for (const [field, rules] of Object.entries(schema.params)) {
        const error = validateField(req.params?.[field], `params.${field}`, rules);
        if (error) errors.push(error);
      }
    }

    // Validate query
    if (schema.query) {
      for (const [field, rules] of Object.entries(schema.query)) {
        let value = req.query?.[field];

        // Convert string numbers to numbers for query params
        if ((rules as any).type === "number" && typeof value === "string") {
          const numValue = Number(value);
          if (!isNaN(numValue)) {
            (req.query as any)[key] = numValue;
            (req.query as any)[field] = numValue;
          }
        }

        const error = validateField(value, `query.${field}`, rules);
        if (error) errors.push(error);
      }
    }

    // If there are validation errors, return 400
    if (errors.length > 0) {
      const apiError: ApiError = {
        success: false,
        error: "Validation failed",
        code: "VALIDATION_ERROR",
        details: errors,
        timestamp: new Date().toISOString(),
        requestId: req.requestId,
      };

      return res.status(400).json(apiError);
    }

    next();
  };
}

/**
 * File upload validation middleware
 */
export function validateFileUpload(req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction) {
  if (!req.file) {
    const apiError: ApiError = {
      success: false,
      error: "No file uploaded",
      code: "FILE_REQUIRED",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    return res.status(400).json(apiError);
  }

  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024; // 10MB
  if (req.file.size > maxSize) {
    const apiError: ApiError = {
      success: false,
      error: "File size exceeds 10MB limit",
      code: "FILE_TOO_LARGE",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    return res.status(400).json(apiError);
  }

  // Check file type
  const allowedMimeTypes = [
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "text/plain",
  ];

  if (!allowedMimeTypes.includes(req.file.mimetype)) {
    const apiError: ApiError = {
      success: false,
      error: "File type not supported. Please upload PDF, DOC, DOCX, or TXT files.",
      code: "INVALID_FILE_TYPE",
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };
    return res.status(400).json(apiError);
  }

  next();
}

/**
 * Sanitize input data
 */
export function sanitizeInput(req: AuthenticatedRequest, res: ApiResponseLocals, next: NextFunction) {
  // Recursively sanitize strings in request body
  function sanitize(obj: any): any {
    if (typeof obj === "string") {
      return obj.trim();
    } else if (Array.isArray(obj)) {
      return obj.map(sanitize);
    } else if (obj && typeof obj === "object") {
      const sanitized: any = {};
      for (const [key, value] of Object.entries(obj)) {
        sanitized[key] = sanitize(value);
      }
      return sanitized;
    }
    return obj;
  }

  if (req.body) {
    req.body = sanitize(req.body);
  }

  if (req.query) {
    req.query = sanitize(req.query);
  }

  next();
}
