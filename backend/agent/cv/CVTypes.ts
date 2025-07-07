/**
 * CV parsing and candidate profile types
 */

/**
 * Supported CV file formats
 */
export enum CVFormat {
  PDF = "pdf",
  DOC = "doc",
  DOCX = "docx",
  TXT = "txt",
  HTML = "html",
  JSON = "json",
}

/**
 * CV parsing status
 */
export enum CVParsingStatus {
  PENDING = "pending",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  INVALID_FORMAT = "invalid_format",
}

/**
 * Candidate experience level
 */
export enum ExperienceLevel {
  ENTRY = "entry",
  JUNIOR = "junior",
  MID = "mid",
  SENIOR = "senior",
  LEAD = "lead",
  PRINCIPAL = "principal",
}

/**
 * Education degree types
 */
export enum DegreeType {
  HIGH_SCHOOL = "high_school",
  ASSOCIATE = "associate",
  BACHELOR = "bachelor",
  MASTER = "master",
  PHD = "phd",
  CERTIFICATE = "certificate",
  BOOTCAMP = "bootcamp",
}

/**
 * Work experience entry
 */
export interface WorkExperience {
  company: string;
  position: string;
  startDate: Date;
  endDate?: Date; // undefined if current job
  description: string;
  technologies?: string[];
  achievements?: string[];
  location?: string;
}

/**
 * Education entry
 */
export interface Education {
  institution: string;
  degree: DegreeType;
  field: string;
  startDate: Date;
  endDate?: Date;
  gpa?: number;
  achievements?: string[];
  location?: string;
}

/**
 * Skill with proficiency level
 */
export interface Skill {
  name: string;
  proficiency: "beginner" | "intermediate" | "advanced" | "expert";
  yearsOfExperience?: number;
  lastUsed?: Date;
  certified?: boolean;
}

/**
 * Contact information
 */
export interface ContactInfo {
  email: string;
  phone?: string;
  linkedin?: string;
  github?: string;
  portfolio?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    country?: string;
    zipCode?: string;
  };
}

/**
 * Parsed candidate profile from CV
 */
export interface CandidateProfile {
  // Basic Information
  fullName: string;
  contactInfo: ContactInfo;
  summary?: string;

  // Experience
  workExperience: WorkExperience[];
  totalYearsExperience: number;
  experienceLevel: ExperienceLevel;

  // Education
  education: Education[];

  // Skills
  technicalSkills: Skill[];
  softSkills: string[];
  languages: Array<{
    language: string;
    proficiency: "basic" | "intermediate" | "fluent" | "native";
  }>;

  // Additional Information
  certifications?: Array<{
    name: string;
    issuer: string;
    date: Date;
    expiryDate?: Date;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies: string[];
    url?: string;
    startDate?: Date;
    endDate?: Date;
  }>;

  // Metadata
  lastUpdated: Date;
  cvFormat: CVFormat;
  parsingConfidence: number; // 0-1 score
}

/**
 * CV parsing result
 */
export interface CVParsingResult {
  success: boolean;
  status: CVParsingStatus;
  profile?: CandidateProfile;
  errors?: string[];
  warnings?: string[];
  metadata: {
    processingTime: number; // milliseconds
    fileSize: number; // bytes
    pageCount?: number;
    extractedText?: string;
    parsingMethod: "ai" | "template" | "ocr" | "manual";
  };
}

/**
 * CV parser configuration
 */
export interface CVParserConfig {
  maxFileSize?: number; // bytes
  supportedFormats?: CVFormat[];
  enableAIParsing?: boolean;
  enableOCR?: boolean;
  confidenceThreshold?: number;
  extractImages?: boolean;
  parseStructuredData?: boolean;
  timeoutMs?: number;
}

/**
 * CV validation rules
 */
export interface CVValidationRule {
  field: keyof CandidateProfile;
  required: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  customValidator?: (value: any) => boolean;
}

/**
 * CV analysis insights
 */
export interface CVAnalysis {
  score: number; // 0-100 overall CV score
  strengths: string[];
  weaknesses: string[];
  suggestions: string[];
  keywordMatches: Array<{
    keyword: string;
    matches: number;
    relevance: number;
  }>;
  fitScore: number; // 0-100 job fit score
  experienceGaps: string[];
  skillGaps: string[];
}
