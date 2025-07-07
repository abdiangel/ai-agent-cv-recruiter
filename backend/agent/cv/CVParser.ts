import {
  CVFormat,
  CVParsingStatus,
  CVParsingResult,
  CVParserConfig,
  CandidateProfile,
  CVAnalysis,
  CVValidationRule,
  ExperienceLevel,
  DegreeType,
} from "./CVTypes";
import { Logger } from "../utils/Logger";

/**
 * CV Parser class for extracting candidate information from CV documents
 * This is a stub implementation that will be enhanced with actual parsing logic
 */
export class CVParser {
  private readonly config: CVParserConfig;
  private readonly logger: Logger;
  private readonly validationRules: CVValidationRule[];

  constructor(config: CVParserConfig = {}) {
    this.config = {
      maxFileSize: 10 * 1024 * 1024, // 10MB default
      supportedFormats: [CVFormat.PDF, CVFormat.DOC, CVFormat.DOCX, CVFormat.TXT],
      enableAIParsing: true,
      enableOCR: false,
      confidenceThreshold: 0.7,
      extractImages: false,
      parseStructuredData: true,
      timeoutMs: 30000, // 30 seconds
      ...config,
    };

    this.logger = Logger.getInstance();
    this.validationRules = this.initializeValidationRules();
  }

  /**
   * Parse CV from file buffer
   * @param fileBuffer - The CV file buffer
   * @param filename - Original filename
   * @param mimeType - File MIME type
   * @returns CV parsing result
   */
  public async parseCV(fileBuffer: Buffer, filename: string, mimeType: string): Promise<CVParsingResult> {
    const startTime = Date.now();

    try {
      this.logger.info("Starting CV parsing", { filename, mimeType, size: fileBuffer.length });

      // Validate file
      const validationResult = this.validateFile(fileBuffer, filename, mimeType);
      if (!validationResult.valid) {
        return {
          success: false,
          status: CVParsingStatus.INVALID_FORMAT,
          errors: validationResult.errors,
          metadata: {
            processingTime: Date.now() - startTime,
            fileSize: fileBuffer.length,
            parsingMethod: "manual",
          },
        };
      }

      // Extract format
      const format = this.detectFormat(filename, mimeType);

      // Parse based on format (stub implementation)
      const profile = await this.parseByFormat(fileBuffer, format);

      // Validate parsed profile
      const profileValidation = this.validateProfile(profile);

      const result: CVParsingResult = {
        success: true,
        status: CVParsingStatus.COMPLETED,
        profile,
        warnings: profileValidation.warnings,
        metadata: {
          processingTime: Date.now() - startTime,
          fileSize: fileBuffer.length,
          pageCount: this.estimatePageCount(fileBuffer, format),
          extractedText: `Extracted text from ${filename}`, // Stub
          parsingMethod: this.config.enableAIParsing ? "ai" : "template",
        },
      };

      this.logger.info("CV parsing completed successfully", {
        filename,
        confidence: profile.parsingConfidence,
        processingTime: result.metadata.processingTime,
      });

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("CV parsing failed", { filename, error: errorMessage });

      return {
        success: false,
        status: CVParsingStatus.FAILED,
        errors: [errorMessage],
        metadata: {
          processingTime: Date.now() - startTime,
          fileSize: fileBuffer.length,
          parsingMethod: "manual",
        },
      };
    }
  }

  /**
   * Parse CV from text content
   * @param text - CV text content
   * @returns CV parsing result
   */
  public async parseCVFromText(text: string): Promise<CVParsingResult> {
    const startTime = Date.now();

    try {
      this.logger.info("Parsing CV from text", { textLength: text.length });

      const profile = await this.parseTextContent(text);
      const profileValidation = this.validateProfile(profile);

      return {
        success: true,
        status: CVParsingStatus.COMPLETED,
        profile,
        warnings: profileValidation.warnings,
        metadata: {
          processingTime: Date.now() - startTime,
          fileSize: Buffer.byteLength(text, "utf8"),
          extractedText: text,
          parsingMethod: "ai",
        },
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("Text CV parsing failed", { error: errorMessage });

      return {
        success: false,
        status: CVParsingStatus.FAILED,
        errors: [errorMessage],
        metadata: {
          processingTime: Date.now() - startTime,
          fileSize: Buffer.byteLength(text, "utf8"),
          parsingMethod: "manual",
        },
      };
    }
  }

  /**
   * Analyze parsed CV for insights and job fit
   * @param profile - Candidate profile
   * @param jobRequirements - Job requirements to match against
   * @returns CV analysis
   */
  public analyzeCVProfile(
    profile: CandidateProfile,
    jobRequirements?: {
      requiredSkills: string[];
      preferredSkills: string[];
      minExperience: number;
      education?: DegreeType[];
    },
  ): CVAnalysis {
    this.logger.info("Analyzing CV profile", { candidateName: profile.fullName });

    // Calculate overall score (stub implementation)
    const score = this.calculateOverallScore(profile);

    // Analyze strengths and weaknesses
    const strengths = this.identifyStrengths(profile);
    const weaknesses = this.identifyWeaknesses(profile);

    // Generate suggestions
    const suggestions = this.generateSuggestions(profile, weaknesses);

    // Calculate job fit if requirements provided
    let fitScore = 75; // Default score
    let skillGaps: string[] = [];
    let experienceGaps: string[] = [];
    let keywordMatches: CVAnalysis["keywordMatches"] = [];

    if (jobRequirements) {
      const fitAnalysis = this.calculateJobFit(profile, jobRequirements);
      fitScore = fitAnalysis.score;
      skillGaps = fitAnalysis.skillGaps;
      experienceGaps = fitAnalysis.experienceGaps;
      keywordMatches = fitAnalysis.keywordMatches;
    }

    return {
      score,
      strengths,
      weaknesses,
      suggestions,
      keywordMatches,
      fitScore,
      experienceGaps,
      skillGaps,
    };
  }

  /**
   * Validate file before parsing
   * @private
   */
  private validateFile(fileBuffer: Buffer, filename: string, mimeType: string): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Check file size
    if (fileBuffer.length > this.config.maxFileSize!) {
      errors.push(`File size exceeds maximum allowed size of ${this.config.maxFileSize} bytes`);
    }

    // Check format support
    const format = this.detectFormat(filename, mimeType);
    if (!this.config.supportedFormats!.includes(format)) {
      errors.push(`Unsupported file format: ${format}`);
    }

    // Check if file is empty
    if (fileBuffer.length === 0) {
      errors.push("File is empty");
    }

    return { valid: errors.length === 0, errors };
  }

  /**
   * Detect file format from filename and MIME type
   * @private
   */
  private detectFormat(filename: string, mimeType: string): CVFormat {
    const extension = filename.toLowerCase().split(".").pop();

    switch (extension) {
      case "pdf":
        return CVFormat.PDF;
      case "doc":
        return CVFormat.DOC;
      case "docx":
        return CVFormat.DOCX;
      case "txt":
        return CVFormat.TXT;
      case "html":
      case "htm":
        return CVFormat.HTML;
      case "json":
        return CVFormat.JSON;
      default:
        // Fall back to MIME type detection
        if (mimeType.includes("pdf")) return CVFormat.PDF;
        if (mimeType.includes("word")) return CVFormat.DOCX;
        if (mimeType.includes("text")) return CVFormat.TXT;
        return CVFormat.TXT; // Default fallback
    }
  }

  /**
   * Parse CV based on detected format (stub implementation)
   * @private
   */
  private async parseByFormat(fileBuffer: Buffer, format: CVFormat): Promise<CandidateProfile> {
    // This is a stub implementation - in a real implementation, this would
    // use different parsing strategies for different file formats

    switch (format) {
      case CVFormat.PDF:
        return this.parsePDFContent(fileBuffer);
      case CVFormat.DOCX:
      case CVFormat.DOC:
        return this.parseWordContent(fileBuffer);
      case CVFormat.TXT:
        return this.parseTextContent(fileBuffer.toString("utf8"));
      case CVFormat.JSON:
        return this.parseJSONContent(fileBuffer);
      default:
        throw new Error(`Unsupported format for parsing: ${format}`);
    }
  }

  /**
   * Parse PDF content (stub implementation)
   * @private
   */
  private async parsePDFContent(fileBuffer: Buffer): Promise<CandidateProfile> {
    // Stub implementation - would use PDF parsing library
    const mockText = "John Doe\nSoftware Engineer\njohn@example.com\n5 years JavaScript, React, Node.js";
    return this.parseTextContent(mockText);
  }

  /**
   * Parse Word document content (stub implementation)
   * @private
   */
  private async parseWordContent(fileBuffer: Buffer): Promise<CandidateProfile> {
    // Stub implementation - would use Word parsing library
    const mockText = "Jane Smith\nFull Stack Developer\njane@example.com\n3 years Python, Django, React";
    return this.parseTextContent(mockText);
  }

  /**
   * Parse JSON content (stub implementation)
   * @private
   */
  private async parseJSONContent(fileBuffer: Buffer): Promise<CandidateProfile> {
    // Stub implementation - parse structured JSON CV
    const jsonData = JSON.parse(fileBuffer.toString("utf8"));

    // Convert JSON to CandidateProfile (simplified)
    return {
      fullName: jsonData.name || "Unknown",
      contactInfo: {
        email: jsonData.email || "unknown@example.com",
        phone: jsonData.phone,
        linkedin: jsonData.linkedin,
        github: jsonData.github,
      },
      workExperience: jsonData.experience || [],
      totalYearsExperience: jsonData.totalExperience || 0,
      experienceLevel: ExperienceLevel.MID,
      education: jsonData.education || [],
      technicalSkills: jsonData.skills || [],
      softSkills: jsonData.softSkills || [],
      languages: jsonData.languages || [],
      lastUpdated: new Date(),
      cvFormat: CVFormat.JSON,
      parsingConfidence: 0.95,
    };
  }

  /**
   * Parse text content using AI/NLP (stub implementation)
   * @private
   */
  private async parseTextContent(text: string): Promise<CandidateProfile> {
    // This is a simplified stub implementation
    // In a real implementation, this would use NLP/AI to extract structured data

    const lines = text.split("\n").filter((line) => line.trim());

    // Extract basic information (very simplified)
    const name = this.extractName(lines);
    const email = this.extractEmail(text);
    const skills = this.extractSkills(text);
    const experience = this.extractExperience(text);

    return {
      fullName: name,
      contactInfo: {
        email: email || "unknown@example.com",
      },
      summary: lines.slice(0, 3).join(" "), // First few lines as summary
      workExperience: experience,
      totalYearsExperience: this.calculateTotalExperience(experience),
      experienceLevel: this.determineExperienceLevel(experience),
      education: [], // Stub - would extract from text
      technicalSkills: skills,
      softSkills: ["Communication", "Problem Solving"], // Stub
      languages: [{ language: "English", proficiency: "fluent" }], // Stub
      lastUpdated: new Date(),
      cvFormat: CVFormat.TXT,
      parsingConfidence: 0.75, // Lower confidence for text parsing
    };
  }

  /**
   * Extract candidate name from text lines (stub)
   * @private
   */
  private extractName(lines: string[]): string {
    // Simple heuristic - assume first non-empty line is the name
    return lines[0] || "Unknown Candidate";
  }

  /**
   * Extract email from text (stub)
   * @private
   */
  private extractEmail(text: string): string | undefined {
    const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/;
    const match = text.match(emailRegex);
    return match ? match[0] : undefined;
  }

  /**
   * Extract skills from text (stub)
   * @private
   */
  private extractSkills(text: string): Array<{ name: string; proficiency: "beginner" | "intermediate" | "advanced" | "expert" }> {
    const commonSkills = ["JavaScript", "Python", "React", "Node.js", "Java", "TypeScript", "AWS", "Docker"];
    const foundSkills = commonSkills.filter((skill) => {
      // Use word boundaries to avoid partial matches
      const skillRegex = new RegExp(`\\b${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
      return skillRegex.test(text);
    });

    // Remove duplicates and limit to reasonable number
    return [...new Set(foundSkills)].map((skill) => ({
      name: skill,
      proficiency: "intermediate" as const, // Stub proficiency
    }));
  }

  /**
   * Extract work experience from text (stub)
   * @private
   */
  private extractExperience(text: string): Array<any> {
    // Very simplified - would use more sophisticated parsing
    const yearMatches = text.match(/\d{4}/g) || [];
    const years = yearMatches.map((y) => parseInt(y)).filter((y) => y > 1990 && y <= new Date().getFullYear());

    if (years.length >= 2) {
      return [
        {
          company: "Previous Company",
          position: "Software Developer",
          startDate: new Date(Math.min(...years), 0, 1),
          endDate: new Date(Math.max(...years), 11, 31),
          description: "Software development experience",
          technologies: ["JavaScript", "React"],
        },
      ];
    }

    return [];
  }

  /**
   * Calculate total years of experience
   * @private
   */
  private calculateTotalExperience(experience: any[]): number {
    if (experience.length === 0) return 0;

    let totalMonths = 0;
    for (const exp of experience) {
      const start = new Date(exp.startDate);
      const end = exp.endDate ? new Date(exp.endDate) : new Date();
      const months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
      totalMonths += Math.max(0, months);
    }

    return Math.round((totalMonths / 12) * 10) / 10; // Round to 1 decimal
  }

  /**
   * Determine experience level based on work history
   * @private
   */
  private determineExperienceLevel(experience: any[]): ExperienceLevel {
    const totalYears = this.calculateTotalExperience(experience);

    if (totalYears < 1) return ExperienceLevel.ENTRY;
    if (totalYears < 3) return ExperienceLevel.JUNIOR;
    if (totalYears < 6) return ExperienceLevel.MID;
    if (totalYears < 10) return ExperienceLevel.SENIOR;
    if (totalYears < 15) return ExperienceLevel.LEAD;
    return ExperienceLevel.PRINCIPAL;
  }

  /**
   * Validate parsed profile
   * @private
   */
  private validateProfile(profile: CandidateProfile): { valid: boolean; warnings: string[] } {
    const warnings: string[] = [];

    // Check required fields
    if (!profile.fullName || profile.fullName === "Unknown") {
      warnings.push("Candidate name could not be extracted reliably");
    }

    if (!profile.contactInfo.email || profile.contactInfo.email.includes("unknown")) {
      warnings.push("Email address could not be extracted");
    }

    if (profile.workExperience.length === 0) {
      warnings.push("No work experience found");
    }

    if (profile.technicalSkills.length === 0) {
      warnings.push("No technical skills identified");
    }

    if (profile.parsingConfidence < this.config.confidenceThreshold!) {
      warnings.push(`Low parsing confidence: ${(profile.parsingConfidence * 100).toFixed(1)}%`);
    }

    return { valid: warnings.length < 5, warnings }; // Valid if less than 5 warnings
  }

  /**
   * Calculate overall CV score (stub)
   * @private
   */
  private calculateOverallScore(profile: CandidateProfile): number {
    let score = 50; // Base score

    // Add points for completeness
    if (profile.contactInfo.email && !profile.contactInfo.email.includes("unknown")) score += 10;
    if (profile.workExperience.length > 0) score += 20;
    if (profile.education.length > 0) score += 10;
    if (profile.technicalSkills.length > 0) score += 15;
    if (profile.summary) score += 5;

    // Add points for experience
    score += Math.min(profile.totalYearsExperience * 2, 20);

    // Reduce points for low confidence
    score *= profile.parsingConfidence;

    return Math.round(Math.min(100, Math.max(0, score)));
  }

  /**
   * Identify candidate strengths (stub)
   * @private
   */
  private identifyStrengths(profile: CandidateProfile): string[] {
    const strengths: string[] = [];

    if (profile.totalYearsExperience >= 5) {
      strengths.push("Extensive professional experience");
    }

    if (profile.technicalSkills.length >= 5) {
      strengths.push("Diverse technical skill set");
    }

    if (profile.education.length > 0) {
      strengths.push("Strong educational background");
    }

    return strengths;
  }

  /**
   * Identify areas for improvement (stub)
   * @private
   */
  private identifyWeaknesses(profile: CandidateProfile): string[] {
    const weaknesses: string[] = [];

    if (profile.workExperience.length === 0) {
      weaknesses.push("Limited work experience");
    }

    if (profile.technicalSkills.length < 3) {
      weaknesses.push("Limited technical skills documented");
    }

    if (!profile.summary) {
      weaknesses.push("Missing professional summary");
    }

    return weaknesses;
  }

  /**
   * Generate improvement suggestions (stub)
   * @private
   */
  private generateSuggestions(profile: CandidateProfile, weaknesses: string[]): string[] {
    const suggestions: string[] = [];

    if (weaknesses.includes("Missing professional summary")) {
      suggestions.push("Add a compelling professional summary highlighting key achievements");
    }

    if (weaknesses.includes("Limited technical skills documented")) {
      suggestions.push("Include more specific technical skills and proficiency levels");
    }

    return suggestions;
  }

  /**
   * Calculate job fit score (stub)
   * @private
   */
  private calculateJobFit(
    profile: CandidateProfile,
    requirements: any,
  ): { score: number; skillGaps: string[]; experienceGaps: string[]; keywordMatches: any[] } {
    let score = 50;
    const skillGaps: string[] = [];
    const experienceGaps: string[] = [];
    const keywordMatches: any[] = [];

    // Check experience requirements
    if (profile.totalYearsExperience >= requirements.minExperience) {
      score += 20;
    } else {
      experienceGaps.push(`${requirements.minExperience - profile.totalYearsExperience} years experience gap`);
    }

    // Check skill requirements
    const candidateSkillNames = profile.technicalSkills.map((s) => s.name.toLowerCase());
    const requiredSkillsLower = requirements.requiredSkills.map((s: string) => s.toLowerCase());

    for (const requiredSkill of requirements.requiredSkills) {
      const found = candidateSkillNames.some((cs) => cs.includes(requiredSkill.toLowerCase()));
      if (found) {
        score += 15;
        keywordMatches.push({ keyword: requiredSkill, matches: 1, relevance: 0.9 });
      } else {
        skillGaps.push(requiredSkill);
      }
    }

    return {
      score: Math.min(100, score),
      skillGaps,
      experienceGaps,
      keywordMatches,
    };
  }

  /**
   * Estimate page count based on file size (stub)
   * @private
   */
  private estimatePageCount(fileBuffer: Buffer, format: CVFormat): number {
    // Very rough estimation
    const sizeKB = fileBuffer.length / 1024;

    switch (format) {
      case CVFormat.PDF:
        return Math.max(1, Math.round(sizeKB / 50)); // ~50KB per page
      case CVFormat.DOCX:
        return Math.max(1, Math.round(sizeKB / 25)); // ~25KB per page
      default:
        return 1;
    }
  }

  /**
   * Initialize validation rules
   * @private
   */
  private initializeValidationRules(): CVValidationRule[] {
    return [
      { field: "fullName", required: true, minLength: 2 },
      { field: "contactInfo", required: true },
      { field: "technicalSkills", required: false },
    ];
  }
}
