import { CandidateProfile, UserSession } from "../../agent";
import { CandidateListRequest, CandidateListResponse, CandidateListItem, CandidateReportResponse } from "../types";
import { NotFoundError } from "../middleware/errorHandler";

/**
 * HR service handles all HR-related operations
 */
export class HRService {
  // In a real application, this would be a database
  private candidates: Map<string, CandidateListItem> = new Map();
  private sessions: Map<string, UserSession> = new Map();

  constructor() {
    // Initialize with some mock data for demonstration
    this.initializeMockData();
  }

  /**
   * Get list of candidates with filtering and pagination
   */
  async getCandidates(request: CandidateListRequest): Promise<CandidateListResponse> {
    const { page = 1, limit = 20, status, sortBy = "date", sortOrder = "desc", search, skills = [], minExperience, maxExperience } = request;

    let candidates = Array.from(this.candidates.values());

    // Apply filters
    if (status) {
      // Map request status to candidate evaluation status
      const statusMap: Record<string, string[]> = {
        active: ["new", "screening", "interview"],
        completed: ["evaluation", "decision"],
        rejected: ["rejected"],
        pending: ["new"],
      };
      const validStatuses = statusMap[status] || [status];
      candidates = candidates.filter((c) => validStatuses.includes(c.evaluation.status));
    }

    if (search) {
      const searchLower = search.toLowerCase();
      candidates = candidates.filter(
        (c) => c.profile.fullName.toLowerCase().includes(searchLower) || c.topSkills.some((skill) => skill.toLowerCase().includes(searchLower)),
      );
    }

    if (skills.length > 0) {
      candidates = candidates.filter((c) => skills.some((skill) => c.topSkills.includes(skill)));
    }

    if (minExperience !== undefined) {
      candidates = candidates.filter((c) => c.profile.totalYearsExperience >= minExperience);
    }

    if (maxExperience !== undefined) {
      candidates = candidates.filter((c) => c.profile.totalYearsExperience <= maxExperience);
    }

    // Apply sorting
    candidates.sort((a, b) => {
      let aValue: any, bValue: any;

      switch (sortBy) {
        case "name":
          aValue = a.profile.fullName;
          bValue = b.profile.fullName;
          break;
        case "score":
          aValue = a.evaluation.overallScore;
          bValue = b.evaluation.overallScore;
          break;
        case "experience":
          aValue = a.profile.totalYearsExperience;
          bValue = b.profile.totalYearsExperience;
          break;
        case "date":
        default:
          aValue = new Date(a.applicationDate);
          bValue = new Date(b.applicationDate);
          break;
      }

      if (sortOrder === "asc") {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    // Apply pagination
    const total = candidates.length;
    const totalPages = Math.ceil(total / limit);
    const offset = (page - 1) * limit;
    const paginatedCandidates = candidates.slice(offset, offset + limit);

    // Calculate summary statistics
    const summary = {
      totalCandidates: total,
      averageScore: candidates.reduce((sum, c) => sum + c.evaluation.overallScore, 0) / Math.max(total, 1),
      statusBreakdown: this.calculateStatusBreakdown(candidates),
      topSkills: this.calculateTopSkills(candidates),
    };

    return {
      success: true,
      data: paginatedCandidates,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
      summary,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Get detailed report for a specific candidate
   */
  async getCandidateReport(candidateId: string): Promise<CandidateReportResponse> {
    const candidate = this.candidates.get(candidateId);
    if (!candidate) {
      throw new NotFoundError(`Candidate ${candidateId} not found`);
    }

    const session = this.sessions.get(candidate.sessionId);
    if (!session) {
      throw new NotFoundError(`Session ${candidate.sessionId} not found`);
    }

    // Create mock detailed report
    const report: CandidateReportResponse = {
      candidate: {
        profile: candidate.profile as any, // Will be properly typed in real implementation
        sessionInfo: session,
        applicationTimeline: [
          {
            timestamp: candidate.applicationDate,
            event: "Application Submitted",
            description: "Candidate applied for the position",
          },
          {
            timestamp: candidate.lastActivity,
            event: "Interview Completed",
            description: "AI interview session completed",
            state: session.currentState?.toString(),
          },
        ],
      },
      evaluation: {
        overallAssessment: {
          score: candidate.evaluation.overallScore,
          recommendation: candidate.evaluation.overallScore > 80 ? "hire" : candidate.evaluation.overallScore > 60 ? "consider" : "reject",
          reasoning: [
            `Overall score: ${candidate.evaluation.overallScore}%`,
            `Experience level: ${candidate.evaluation.experienceLevel}`,
            `Skills match: ${candidate.evaluation.skillsMatch}%`,
          ],
          strengths: ["Strong technical skills", "Good communication", "Relevant experience"],
          concerns: ["Limited leadership experience", "Some skill gaps identified"],
        },
        skillsAnalysis: {
          technicalSkills: candidate.topSkills.map((skill) => ({
            skill,
            level: Math.floor(Math.random() * 5) + 1,
            required: true,
            assessment: "Demonstrated proficiency",
          })),
          softSkills: [
            {
              skill: "Communication",
              evidence: ["Clear responses", "Professional demeanor"],
              assessment: "Strong",
            },
            {
              skill: "Problem Solving",
              evidence: ["Analytical thinking", "Structured approach"],
              assessment: "Good",
            },
          ],
        },
      },
      analytics: {
        conversationMetrics: {
          responseTime: 2.5,
          engagementLevel: 85,
          completionRate: 95,
          questionAsked: 12,
        },
        behavioralAnalysis: {
          enthusiasm: 80,
          professionalism: 90,
          clarity: 85,
          proactiveness: 75,
        },
      },
      recommendations: {
        nextSteps: ["Schedule technical interview", "Verify references", "Discuss compensation expectations"],
        interviewFocus: ["System design", "Leadership scenarios", "Cultural fit"],
        additionalSkillsNeeded: ["Advanced algorithms", "Team management"],
      },
      generatedAt: new Date().toISOString(),
    };

    return report;
  }

  /**
   * Add a new candidate (called from ChatService)
   */
  addCandidate(sessionId: string, profile: Partial<CandidateProfile>): string {
    const candidateId = `cand_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    const candidate: CandidateListItem = {
      candidateId,
      sessionId,
      profile: {
        fullName: profile.fullName || "Unknown",
        contactInfo: profile.contactInfo || { email: "" },
        totalYearsExperience: profile.totalYearsExperience || 0,
      },
      evaluation: {
        overallScore: Math.floor(Math.random() * 40) + 60, // 60-100
        skillsMatch: Math.floor(Math.random() * 30) + 70, // 70-100
        experienceLevel: this.determineExperienceLevel(profile.totalYearsExperience || 0),
        status: "new",
      },
      applicationDate: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      topSkills: profile.technicalSkills?.slice(0, 5).map((s) => s.name) || [],
    };

    this.candidates.set(candidateId, candidate);
    return candidateId;
  }

  /**
   * Update candidate status
   */
  updateCandidateStatus(candidateId: string, status: CandidateListItem["evaluation"]["status"]): void {
    const candidate = this.candidates.get(candidateId);
    if (candidate) {
      candidate.evaluation.status = status;
      candidate.lastActivity = new Date().toISOString();
    }
  }

  /**
   * Get candidate by session ID
   */
  getCandidateBySessionId(sessionId: string): CandidateListItem | undefined {
    return Array.from(this.candidates.values()).find((c) => c.sessionId === sessionId);
  }

  private calculateStatusBreakdown(candidates: CandidateListItem[]): Record<string, number> {
    const breakdown: Record<string, number> = {};
    candidates.forEach((c) => {
      breakdown[c.evaluation.status] = (breakdown[c.evaluation.status] || 0) + 1;
    });
    return breakdown;
  }

  private calculateTopSkills(candidates: CandidateListItem[]): Array<{ skill: string; count: number }> {
    const skillCount: Record<string, number> = {};
    candidates.forEach((c) => {
      c.topSkills.forEach((skill) => {
        skillCount[skill] = (skillCount[skill] || 0) + 1;
      });
    });

    return Object.entries(skillCount)
      .map(([skill, count]) => ({ skill, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }

  private determineExperienceLevel(years: number): CandidateListItem["evaluation"]["experienceLevel"] {
    if (years < 2) return "junior";
    if (years < 5) return "mid";
    if (years < 10) return "senior";
    return "lead";
  }

  private initializeMockData(): void {
    // Add some mock candidates for demonstration
    const mockCandidates = [
      {
        fullName: "Alice Johnson",
        contactInfo: { email: "alice@example.com" },
        totalYearsExperience: 5,
        technicalSkills: [
          { name: "JavaScript", proficiency: "advanced" as const },
          { name: "React", proficiency: "advanced" as const },
          { name: "Node.js", proficiency: "intermediate" as const },
        ],
      },
      {
        fullName: "Bob Smith",
        contactInfo: { email: "bob@example.com" },
        totalYearsExperience: 8,
        technicalSkills: [
          { name: "Python", proficiency: "expert" as const },
          { name: "Django", proficiency: "advanced" as const },
          { name: "PostgreSQL", proficiency: "intermediate" as const },
        ],
      },
    ];

    mockCandidates.forEach((profile, index) => {
      const sessionId = `session_${index + 1}`;
      this.addCandidate(sessionId, profile);
    });
  }
}
