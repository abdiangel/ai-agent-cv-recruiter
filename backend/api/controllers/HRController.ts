import { Response, NextFunction } from "express";
import { AuthenticatedRequest, ApiResponseLocals, ApiResponse } from "../types";
import { HRService } from "../services";
import { asyncHandler } from "../middleware/errorHandler";
import { CandidateListResponse, CandidateReportResponse } from "../types";

/**
 * HR controller handles all HR-related API endpoints
 */
export class HRController {
  private hrService: HRService;

  constructor() {
    this.hrService = new HRService();
  }

  /**
   * GET /api/hr/candidates
   * Get list of candidates with filtering and pagination
   */
  getCandidates = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const result = await this.hrService.getCandidates(req.query);

    res.status(200).json(result);
  });

  /**
   * GET /api/hr/reports/:candidateId
   * Get detailed report for a specific candidate
   */
  getCandidateReport = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const { candidateId } = req.params;
    const result = await this.hrService.getCandidateReport(candidateId);

    const response: ApiResponse<CandidateReportResponse> = {
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * PUT /api/hr/candidates/:candidateId/status
   * Update candidate status
   */
  updateCandidateStatus = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const { candidateId } = req.params;
    const { status } = req.body;

    this.hrService.updateCandidateStatus(candidateId, status);

    const response: ApiResponse = {
      success: true,
      message: `Candidate ${candidateId} status updated to ${status}`,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/hr/analytics
   * Get HR analytics and statistics
   */
  getAnalytics = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    // Mock analytics data
    const analytics = {
      overview: {
        totalCandidates: 150,
        activeCandidates: 45,
        interviewsCompleted: 78,
        averageScore: 73.5,
        topPerformers: 12,
      },
      trends: {
        applicationsThisWeek: 23,
        applicationsLastWeek: 18,
        averageSessionDuration: 1200, // seconds
        completionRate: 0.85,
      },
      skills: {
        mostDemanded: [
          { skill: "JavaScript", count: 45 },
          { skill: "Python", count: 38 },
          { skill: "React", count: 32 },
        ],
        skillGaps: [
          { skill: "Machine Learning", gap: 15 },
          { skill: "DevOps", gap: 12 },
          { skill: "Cloud Computing", gap: 10 },
        ],
      },
      performance: {
        averageResponseTime: 2.3,
        systemUptime: 0.999,
        errorRate: 0.001,
      },
    };

    const response: ApiResponse = {
      success: true,
      data: analytics,
      timestamp: new Date().toISOString(),
      requestId: req.requestId,
    };

    res.status(200).json(response);
  });

  /**
   * GET /api/hr/export/candidates
   * Export candidates data (CSV format)
   */
  exportCandidates = asyncHandler(async (req: AuthenticatedRequest, res: ApiResponseLocals): Promise<void> => {
    const candidates = await this.hrService.getCandidates({ page: 1, limit: 1000 });

    // Generate CSV content
    const csvHeaders = ["Candidate ID", "Full Name", "Email", "Experience (Years)", "Overall Score", "Status", "Application Date", "Top Skills"];

    const csvRows =
      candidates.data?.map((candidate) => [
        candidate.candidateId,
        candidate.profile.fullName,
        candidate.profile.contactInfo.email,
        candidate.profile.totalYearsExperience.toString(),
        candidate.evaluation.overallScore.toString(),
        candidate.evaluation.status,
        candidate.applicationDate,
        candidate.topSkills.join("; "),
      ]) || [];

    const csvContent = [csvHeaders, ...csvRows].map((row) => row.map((field) => `"${field}"`).join(",")).join("\n");

    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", 'attachment; filename="candidates.csv"');
    res.status(200).send(csvContent);
  });
}
