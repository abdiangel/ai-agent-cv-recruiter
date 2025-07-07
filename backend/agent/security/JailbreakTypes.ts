/**
 * Jailbreak and security detection types
 */

/**
 * Jailbreak attempt severity levels
 */
export enum JailbreakSeverity {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high",
  CRITICAL = "critical",
}

/**
 * Types of jailbreak attacks
 */
export enum JailbreakType {
  PROMPT_INJECTION = "prompt_injection",
  ROLE_PLAY = "role_play",
  IGNORE_INSTRUCTIONS = "ignore_instructions",
  SYSTEM_PROMPT_EXTRACTION = "system_prompt_extraction",
  HARMFUL_CONTENT = "harmful_content",
  PRIVILEGE_ESCALATION = "privilege_escalation",
  DATA_EXTRACTION = "data_extraction",
  BYPASS_SAFETY = "bypass_safety",
  SOCIAL_ENGINEERING = "social_engineering",
  CONTEXT_MANIPULATION = "context_manipulation",
}

/**
 * Detection methods used
 */
export enum DetectionMethod {
  PATTERN_MATCHING = "pattern_matching",
  KEYWORD_ANALYSIS = "keyword_analysis",
  SEMANTIC_ANALYSIS = "semantic_analysis",
  BEHAVIORAL_ANALYSIS = "behavioral_analysis",
  CONTEXT_ANALYSIS = "context_analysis",
  ML_CLASSIFICATION = "ml_classification",
}

/**
 * Jailbreak detection result
 */
export interface JailbreakDetectionResult {
  isJailbreak: boolean;
  severity: JailbreakSeverity;
  confidence: number; // 0-1
  detectedTypes: JailbreakType[];
  detectionMethods: DetectionMethod[];
  riskScore: number; // 0-100
  details: {
    matchedPatterns: string[];
    suspiciousKeywords: string[];
    contextFlags: string[];
    reasoningChain: string[];
  };
  metadata: {
    processingTime: number;
    messageLength: number;
    userAgent?: string;
    ipAddress?: string;
  };
}

/**
 * Pattern matching rule
 */
export interface JailbreakPattern {
  id: string;
  pattern: RegExp;
  type: JailbreakType;
  severity: JailbreakSeverity;
  description: string;
  confidence: number;
  enabled: boolean;
  language?: string;
}

/**
 * Keyword detection rule
 */
export interface KeywordRule {
  id: string;
  keywords: string[];
  type: JailbreakType;
  severity: JailbreakSeverity;
  caseSensitive: boolean;
  wholeWord: boolean;
  confidence: number;
  enabled: boolean;
}

/**
 * Context validation rule
 */
export interface ContextRule {
  id: string;
  name: string;
  validator: (context: ConversationContext) => boolean;
  type: JailbreakType;
  severity: JailbreakSeverity;
  description: string;
  enabled: boolean;
}

/**
 * Conversation context for analysis
 */
export interface ConversationContext {
  messageHistory: Array<{
    role: "user" | "assistant" | "system";
    content: string;
    timestamp: Date;
  }>;
  sessionId: string;
  userId?: string;
  currentMessage: string;
  userAgent?: string;
  ipAddress?: string;
  requestHeaders?: Record<string, string>;
  conversationLength: number;
  timesSinceLastMessage: number;
}

/**
 * Jailbreak detector configuration
 */
export interface JailbreakDetectorConfig {
  // Pattern matching settings
  enablePatternMatching?: boolean;
  customPatterns?: JailbreakPattern[];

  // Keyword detection settings
  enableKeywordDetection?: boolean;
  customKeywords?: KeywordRule[];

  // Context analysis settings
  enableContextAnalysis?: boolean;
  customContextRules?: ContextRule[];

  // Behavioral analysis settings
  enableBehavioralAnalysis?: boolean;
  maxMessagesPerMinute?: number;
  suspiciousPatternThreshold?: number;

  // Semantic analysis settings
  enableSemanticAnalysis?: boolean;
  semanticSimilarityThreshold?: number;

  // ML classification settings
  enableMLClassification?: boolean;
  mlModelPath?: string;
  mlConfidenceThreshold?: number;

  // General settings
  confidenceThreshold?: number;
  riskScoreThreshold?: number;
  blockOnHighRisk?: boolean;
  logDetections?: boolean;
  enableRealTimeMonitoring?: boolean;

  // Language settings
  supportedLanguages?: string[];
  defaultLanguage?: string;

  // Rate limiting
  enableRateLimiting?: boolean;
  maxRequestsPerMinute?: number;

  // Whitelist/Blacklist
  whitelistedUsers?: string[];
  blacklistedUsers?: string[];
  whitelistedIPs?: string[];
  blacklistedIPs?: string[];
}

/**
 * Security action to take on detection
 */
export interface SecurityAction {
  type: "block" | "warn" | "log" | "rate_limit" | "escalate";
  message?: string;
  duration?: number; // in seconds
  notifyAdmin?: boolean;
  additionalData?: Record<string, any>;
}

/**
 * Jailbreak detection statistics
 */
export interface JailbreakStats {
  totalDetections: number;
  detectionsByType: Record<JailbreakType, number>;
  detectionsBySeverity: Record<JailbreakSeverity, number>;
  averageConfidence: number;
  averageRiskScore: number;
  topPatterns: Array<{
    pattern: string;
    count: number;
    severity: JailbreakSeverity;
  }>;
  detectionTrends: Array<{
    timestamp: Date;
    count: number;
    severity: JailbreakSeverity;
  }>;
}

/**
 * Advanced threat analysis result
 */
export interface ThreatAnalysis {
  overallRisk: "low" | "medium" | "high" | "critical";
  riskScore: number;
  threatVectors: Array<{
    type: JailbreakType;
    severity: JailbreakSeverity;
    confidence: number;
    description: string;
  }>;
  mitigationSuggestions: string[];
  recommendedActions: SecurityAction[];
  contextualFactors: Array<{
    factor: string;
    impact: "positive" | "negative" | "neutral";
    weight: number;
  }>;
}
