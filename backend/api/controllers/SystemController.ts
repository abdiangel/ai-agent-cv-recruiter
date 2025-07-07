import { Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals, ApiResponse } from "../types";
import { asyncHandler } from "../middleware/errorHandler";
import { HealthCheckResponse, SystemStatsResponse } from "../types";
import { CandidateIntention, AgentState } from "../../agent";
/**
 * System controller handles system-related endpoints
 */
export class SystemController {
  /**
   * GET /api/system/health
   * Health check endpoint
   */
  healthCheck = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const startTime = Date.now();

    // Perform basic health checks
    const healthData: HealthCheckResponse = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      version: process.env.npm_package_version || "1.0.0",
      services: {
        agent: "up",
        database: "up", // Would check real database in production
        storage: "up",
      },
      performance: {
        uptime: process.uptime(),
        memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        cpuUsage: process.cpuUsage().user / 1000000, // Convert to seconds
      },
    };

    // Determine overall status
    const serviceStatuses = Object.values(healthData.services);
    if (serviceStatuses.includes("down")) {
      healthData.status = "unhealthy";
    } else if (healthData.performance.memoryUsage > 500) {
      // 500MB threshold
      healthData.status = "degraded";
    }

    const responseTime = Date.now() - startTime;

    const response: ApiResponse<HealthCheckResponse> = {
      success: true,
      data: healthData,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    const statusCode = healthData.status === "healthy" ? 200 : healthData.status === "degraded" ? 200 : 503;

    res.status(statusCode).json(response);
  });

  /**
   * GET /api/system/stats
   * System statistics endpoint
   */
  getStats = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    // Mock system statistics
    const stats: SystemStatsResponse = {
      analytics: {
        totalSessions: 1250,
        averageSessionDuration: 1200,
        completionRate: 0.85,
        intentionAccuracy: 0.92,
        commonIntentions: [
          { intention: CandidateIntention.JOB_INQUIRY, count: 340, percentage: 27.2 },
          { intention: CandidateIntention.SALARY_QUESTION, count: 287, percentage: 23.0 },
          { intention: CandidateIntention.BENEFITS_QUESTION, count: 198, percentage: 15.8 },
        ],
        stateTransitions: [
          { from: AgentState.GREETING, to: AgentState.JOB_DISCUSSION, count: 1100 },
          { from: AgentState.JOB_DISCUSSION, to: AgentState.Q_AND_A, count: 892 },
          { from: AgentState.Q_AND_A, to: AgentState.CV_PROCESSING, count: 654 },
        ],
        userSatisfactionScore: 4.2,
        securityEvents: 23,
        cvParsingSuccessRate: 0.96,
      },
      systemMetrics: {
        activeSessions: 45,
        totalSessions: 1250,
        averageSessionDuration: 1200,
        peakConcurrentSessions: 78,
        cvProcessed: 634,
        securityEvents: 23,
      },
      performance: {
        averageResponseTime: 850, // ms
        successRate: 0.997,
        errorRate: 0.003,
        uptime: process.uptime(),
      },
    };

    const response: ApiResponse<SystemStatsResponse> = {
      success: true,
      data: stats,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/system/info
   * System information endpoint
   */
  getSystemInfo = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const systemInfo = {
      node: {
        version: process.version,
        platform: process.platform,
        arch: process.arch,
      },
      application: {
        name: "AI Recruitment Agent API",
        version: process.env.npm_package_version || "1.0.0",
        environment: process.env.NODE_ENV || "development",
        startTime: new Date(Date.now() - process.uptime() * 1000).toISOString(),
      },
      resources: {
        memory: {
          used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
          total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
          external: Math.round(process.memoryUsage().external / 1024 / 1024),
        },
        uptime: Math.round(process.uptime()),
      },
    };

    const response: ApiResponse = {
      success: true,
      data: systemInfo,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });
}
