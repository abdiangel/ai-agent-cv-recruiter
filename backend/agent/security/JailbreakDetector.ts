import {
  JailbreakDetectionResult,
  JailbreakSeverity,
  JailbreakType,
  DetectionMethod,
  JailbreakDetectorConfig,
  JailbreakPattern,
  KeywordRule,
  ContextRule,
  ConversationContext,
  SecurityAction,
  JailbreakStats,
  ThreatAnalysis,
} from "./JailbreakTypes";
import { Logger } from "../utils/Logger";
import { PatternMatcher } from "../utils/PatternMatcher";

/**
 * Advanced jailbreak detection system for AI recruitment agents
 * This is a stub implementation that will be enhanced with actual ML/AI detection
 */
export class JailbreakDetector {
  private readonly config: JailbreakDetectorConfig;
  private readonly logger: Logger;
  private readonly patternMatcher: PatternMatcher;
  private readonly detectionStats: JailbreakStats;
  private readonly rateLimitTracking: Map<string, number[]>;

  // Built-in patterns for common jailbreak attempts
  private readonly defaultPatterns: JailbreakPattern[] = [
    {
      id: "ignore_instructions",
      pattern: /ignore\s+(all\s+)?(previous\s+)?(instructions|prompts|rules|guidelines)/i,
      type: JailbreakType.IGNORE_INSTRUCTIONS,
      severity: JailbreakSeverity.HIGH,
      description: "Attempt to ignore system instructions",
      confidence: 0.8,
      enabled: true,
    },
    {
      id: "role_play_admin",
      pattern:
        /(?:act\s+as|pretend\s+to\s+be|you\s+are\s+now|roleplay\s+as)\s+(?:an?\s+)?(?:admin|administrator|developer|creator|god|master|user|different|other)/i,
      type: JailbreakType.ROLE_PLAY,
      severity: JailbreakSeverity.HIGH,
      description: "Attempt to assume privileged role",
      confidence: 0.85,
      enabled: true,
    },
    {
      id: "system_prompt_extraction",
      pattern: /(?:show|tell|reveal|display|print)\s+(?:your\s+)?(?:system\s+)?(?:prompt|instructions|rules|guidelines|configuration)/i,
      type: JailbreakType.SYSTEM_PROMPT_EXTRACTION,
      severity: JailbreakSeverity.MEDIUM,
      description: "Attempt to extract system prompts",
      confidence: 0.7,
      enabled: true,
    },
    {
      id: "harmful_content_request",
      pattern: /(?:how\s+to|teach\s+me|help\s+me)\s+(?:hack|break|bypass|exploit|attack|harm|hurt|kill|destroy)/i,
      type: JailbreakType.HARMFUL_CONTENT,
      severity: JailbreakSeverity.CRITICAL,
      description: "Request for harmful content",
      confidence: 0.9,
      enabled: true,
    },
    {
      id: "privilege_escalation",
      pattern: /(?:sudo|root|admin|superuser|override|bypass|elevate)\s+(?:access|privileges|permissions|rights)/i,
      type: JailbreakType.PRIVILEGE_ESCALATION,
      severity: JailbreakSeverity.HIGH,
      description: "Attempt to escalate privileges",
      confidence: 0.75,
      enabled: true,
    },
    {
      id: "data_extraction",
      pattern: /(?:extract|dump|export|download|access)\s+(?:data|database|files|information|records|user\s+data)/i,
      type: JailbreakType.DATA_EXTRACTION,
      severity: JailbreakSeverity.CRITICAL,
      description: "Attempt to extract sensitive data",
      confidence: 0.8,
      enabled: true,
    },
    {
      id: "bypass_safety",
      pattern: /(?:bypass|disable|turn\s+off|override)\s+(?:safety|security|protection|filters|guards|limitations)/i,
      type: JailbreakType.BYPASS_SAFETY,
      severity: JailbreakSeverity.HIGH,
      description: "Attempt to bypass safety measures",
      confidence: 0.8,
      enabled: true,
    },
    {
      id: "social_engineering",
      pattern: /(?:i\s+am\s+the|i\s+am\s+your)\s+(?:owner|creator|developer|admin|boss|manager|supervisor)/i,
      type: JailbreakType.SOCIAL_ENGINEERING,
      severity: JailbreakSeverity.MEDIUM,
      description: "Social engineering attempt",
      confidence: 0.6,
      enabled: true,
    },
  ];

  // Built-in suspicious keywords
  private readonly defaultKeywords: KeywordRule[] = [
    {
      id: "jailbreak_terms",
      keywords: ["jailbreak", "DAN", "Do Anything Now", "evil mode", "developer mode"],
      type: JailbreakType.BYPASS_SAFETY,
      severity: JailbreakSeverity.HIGH,
      caseSensitive: false,
      wholeWord: false,
      confidence: 0.9,
      enabled: true,
    },
    {
      id: "prompt_injection",
      keywords: ["prompt injection", "token injection", "context injection"],
      type: JailbreakType.PROMPT_INJECTION,
      severity: JailbreakSeverity.HIGH,
      caseSensitive: false,
      wholeWord: false,
      confidence: 0.85,
      enabled: true,
    },
    {
      id: "command_injection",
      keywords: ["rm -rf", "DROP TABLE", "SELECT * FROM", "wget", "curl"],
      type: JailbreakType.HARMFUL_CONTENT,
      severity: JailbreakSeverity.CRITICAL,
      caseSensitive: true,
      wholeWord: false,
      confidence: 0.95,
      enabled: true,
    },
  ];

  constructor(config: JailbreakDetectorConfig = {}) {
    this.config = {
      enablePatternMatching: true,
      enableKeywordDetection: true,
      enableContextAnalysis: true,
      enableBehavioralAnalysis: true,
      enableSemanticAnalysis: false, // Stub - would require ML model
      enableMLClassification: false, // Stub - would require trained model
      confidenceThreshold: 0.6,
      riskScoreThreshold: 70,
      blockOnHighRisk: true,
      logDetections: true,
      enableRealTimeMonitoring: true,
      supportedLanguages: ["en", "es", "fr"],
      defaultLanguage: "en",
      enableRateLimiting: true,
      maxRequestsPerMinute: 30,
      maxMessagesPerMinute: 10,
      suspiciousPatternThreshold: 3,
      semanticSimilarityThreshold: 0.8,
      mlConfidenceThreshold: 0.7,
      whitelistedUsers: [],
      blacklistedUsers: [],
      whitelistedIPs: [],
      blacklistedIPs: [],
      ...config,
    };

    this.logger = Logger.getInstance();
    this.patternMatcher = new PatternMatcher();
    this.rateLimitTracking = new Map();

    // Initialize stats
    this.detectionStats = {
      totalDetections: 0,
      detectionsByType: Object.fromEntries(Object.values(JailbreakType).map((type) => [type, 0])) as Record<JailbreakType, number>,
      detectionsBySeverity: Object.fromEntries(Object.values(JailbreakSeverity).map((severity) => [severity, 0])) as Record<
        JailbreakSeverity,
        number
      >,
      averageConfidence: 0,
      averageRiskScore: 0,
      topPatterns: [],
      detectionTrends: [],
    };
  }

  /**
   * Detect jailbreak attempts in a message
   * @param message - The message to analyze
   * @param context - Optional conversation context
   * @returns Jailbreak detection result
   */
  public async detectJailbreak(message: string, context?: ConversationContext): Promise<JailbreakDetectionResult> {
    const startTime = Date.now();

    try {
      this.logger.info("Starting jailbreak detection", {
        messageLength: message.length,
        sessionId: context?.sessionId,
      });

      // Pre-flight checks
      if (this.isWhitelisted(context)) {
        return this.createSafeResult(startTime, message, context);
      }

      if (this.isBlacklisted(context)) {
        return this.createBlockedResult(startTime, message, context, "User/IP is blacklisted");
      }

      // Rate limiting check
      if (this.config.enableRateLimiting && this.isRateLimited(context)) {
        return this.createBlockedResult(startTime, message, context, "Rate limit exceeded");
      }

      // Initialize detection results
      const detectionResults: {
        isJailbreak: boolean;
        severity: JailbreakSeverity;
        confidence: number;
        types: JailbreakType[];
        methods: DetectionMethod[];
        patterns: string[];
        keywords: string[];
        contextFlags: string[];
        reasoningChain: string[];
      } = {
        isJailbreak: false,
        severity: JailbreakSeverity.LOW,
        confidence: 0,
        types: [],
        methods: [],
        patterns: [],
        keywords: [],
        contextFlags: [],
        reasoningChain: [],
      };

      // Pattern matching detection
      if (this.config.enablePatternMatching) {
        const patternResults = await this.detectPatterns(message);
        this.mergeDetectionResults(detectionResults, patternResults);
      }

      // Keyword detection
      if (this.config.enableKeywordDetection) {
        const keywordResults = await this.detectKeywords(message);
        this.mergeDetectionResults(detectionResults, keywordResults);
      }

      // Context analysis
      if (this.config.enableContextAnalysis && context) {
        const contextResults = await this.analyzeContext(message, context);
        this.mergeDetectionResults(detectionResults, contextResults);
      }

      // Behavioral analysis
      if (this.config.enableBehavioralAnalysis && context) {
        const behavioralResults = await this.analyzeBehavior(message, context);
        this.mergeDetectionResults(detectionResults, behavioralResults);
      }

      // Semantic analysis (stub)
      if (this.config.enableSemanticAnalysis) {
        const semanticResults = await this.analyzeSemantics(message);
        this.mergeDetectionResults(detectionResults, semanticResults);
      }

      // ML classification (stub)
      if (this.config.enableMLClassification) {
        const mlResults = await this.classifyWithML(message);
        this.mergeDetectionResults(detectionResults, mlResults);
      }

      // Calculate final risk score
      const riskScore = this.calculateRiskScore(detectionResults);

      // Determine final verdict
      const isJailbreak = detectionResults.confidence >= this.config.confidenceThreshold! || riskScore >= this.config.riskScoreThreshold!;

      const result: JailbreakDetectionResult = {
        isJailbreak,
        severity: detectionResults.severity,
        confidence: detectionResults.confidence,
        detectedTypes: detectionResults.types,
        detectionMethods: detectionResults.methods,
        riskScore,
        details: {
          matchedPatterns: detectionResults.patterns,
          suspiciousKeywords: detectionResults.keywords,
          contextFlags: detectionResults.contextFlags,
          reasoningChain: detectionResults.reasoningChain,
        },
        metadata: {
          processingTime: Date.now() - startTime,
          messageLength: message.length,
          userAgent: context?.userAgent,
          ipAddress: context?.ipAddress,
        },
      };

      // Update statistics
      this.updateStats(result);

      // Log detection
      if (this.config.logDetections && isJailbreak) {
        this.logger.warn("Jailbreak attempt detected", {
          sessionId: context?.sessionId,
          severity: result.severity,
          confidence: result.confidence,
          riskScore: result.riskScore,
          types: result.detectedTypes,
        });
      }

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error("Jailbreak detection failed", { error: errorMessage });

      // Return safe result on error
      return this.createSafeResult(startTime, message, context);
    }
  }

  /**
   * Analyze threat level and get recommendations
   * @param message - The message to analyze
   * @param context - Optional conversation context
   * @returns Threat analysis result
   */
  public async analyzeThreat(message: string, context?: ConversationContext): Promise<ThreatAnalysis> {
    const detection = await this.detectJailbreak(message, context);

    // Calculate overall risk
    const overallRisk = this.determineOverallRisk(detection.riskScore);

    // Extract threat vectors
    const threatVectors = detection.detectedTypes.map((type) => ({
      type,
      severity: detection.severity,
      confidence: detection.confidence,
      description: this.getTypeDescription(type),
    }));

    // Generate mitigation suggestions
    const mitigationSuggestions = this.generateMitigationSuggestions(detection);

    // Recommend actions
    const recommendedActions = this.getRecommendedActions(detection);

    // Analyze contextual factors
    const contextualFactors = this.analyzeContextualFactors(detection, context);

    return {
      overallRisk,
      riskScore: detection.riskScore,
      threatVectors,
      mitigationSuggestions,
      recommendedActions,
      contextualFactors,
    };
  }

  /**
   * Get detection statistics
   * @returns Current detection statistics
   */
  public getStats(): JailbreakStats {
    return { ...this.detectionStats };
  }

  /**
   * Update detector configuration
   * @param newConfig - New configuration options
   */
  public updateConfig(newConfig: Partial<JailbreakDetectorConfig>): void {
    Object.assign(this.config, newConfig);
    this.logger.info("Jailbreak detector configuration updated", {
      updatedKeys: Object.keys(newConfig),
    });
  }

  /**
   * Detect patterns in message
   * @private
   */
  private async detectPatterns(message: string): Promise<any> {
    const results = {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.PATTERN_MATCHING],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: [] as string[],
    };

    const patterns = [...this.defaultPatterns, ...(this.config.customPatterns || [])].filter((p) => p.enabled);

    for (const pattern of patterns) {
      if (pattern.pattern.test(message)) {
        results.isJailbreak = true;
        results.patterns.push(pattern.id);
        results.types.push(pattern.type);
        results.confidence = Math.max(results.confidence, pattern.confidence);
        results.severity = this.getHigherSeverity(results.severity, pattern.severity);
        results.reasoningChain.push(`Pattern "${pattern.id}" matched: ${pattern.description}`);
      }
    }

    return results;
  }

  /**
   * Detect suspicious keywords
   * @private
   */
  private async detectKeywords(message: string): Promise<any> {
    const results = {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.KEYWORD_ANALYSIS],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: [] as string[],
    };

    const keywordRules = [...this.defaultKeywords, ...(this.config.customKeywords || [])].filter((k) => k.enabled);

    for (const rule of keywordRules) {
      const foundKeywords = rule.keywords.filter((keyword) => {
        const searchText = rule.caseSensitive ? message : message.toLowerCase();
        const searchKeyword = rule.caseSensitive ? keyword : keyword.toLowerCase();

        if (rule.wholeWord) {
          const regex = new RegExp(`\\b${searchKeyword}\\b`, "gi");
          return regex.test(searchText);
        } else {
          return searchText.includes(searchKeyword);
        }
      });

      if (foundKeywords.length > 0) {
        results.isJailbreak = true;
        results.keywords.push(...foundKeywords);
        results.types.push(rule.type);
        results.confidence = Math.max(results.confidence, rule.confidence);
        results.severity = this.getHigherSeverity(results.severity, rule.severity);
        results.reasoningChain.push(`Suspicious keywords detected: ${foundKeywords.join(", ")}`);
      }
    }

    return results;
  }

  /**
   * Analyze conversation context
   * @private
   */
  private async analyzeContext(message: string, context: ConversationContext): Promise<any> {
    const results = {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.CONTEXT_ANALYSIS],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: [] as string[],
    };

    // Check for context manipulation patterns
    if (context.messageHistory.length > 0) {
      const recentMessages = context.messageHistory.slice(-5);
      const userMessages = recentMessages.filter((msg) => msg.role === "user");

      // Check for repetitive jailbreak attempts
      const jailbreakTerms = ["ignore", "bypass", "override", "admin", "system"];
      const jailbreakCount = userMessages.filter((msg) => jailbreakTerms.some((term) => msg.content.toLowerCase().includes(term))).length;

      if (jailbreakCount >= 3) {
        results.isJailbreak = true;
        results.types.push(JailbreakType.CONTEXT_MANIPULATION);
        results.confidence = Math.max(results.confidence, 0.7);
        results.severity = JailbreakSeverity.HIGH;
        results.contextFlags.push("Repetitive jailbreak attempts detected");
        results.reasoningChain.push("Multiple jailbreak attempts in recent conversation");
      }
    }

    // Check for rapid-fire messages (potential bot)
    if (context.timesSinceLastMessage < 2000) {
      // Less than 2 seconds
      results.contextFlags.push("Rapid message frequency detected");
      results.confidence = Math.max(results.confidence, 0.3);
      results.reasoningChain.push("Unusually fast message rate may indicate automated attack");
    }

    return results;
  }

  /**
   * Analyze behavioral patterns
   * @private
   */
  private async analyzeBehavior(message: string, context: ConversationContext): Promise<any> {
    const results = {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.BEHAVIORAL_ANALYSIS],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: [] as string[],
    };

    // Check message length (unusually long messages might be jailbreak attempts)
    if (message.length > 1000) {
      results.contextFlags.push("Unusually long message detected");
      results.confidence = Math.max(results.confidence, 0.2);
      results.reasoningChain.push("Very long message may contain hidden jailbreak instructions");
    }

    // Check for encoding attempts (base64, hex, etc.)
    if (this.containsEncodedContent(message)) {
      results.isJailbreak = true;
      results.types.push(JailbreakType.BYPASS_SAFETY);
      results.confidence = Math.max(results.confidence, 0.6);
      results.severity = JailbreakSeverity.MEDIUM;
      results.contextFlags.push("Encoded content detected");
      results.reasoningChain.push("Message contains encoded content that may hide malicious instructions");
    }

    return results;
  }

  /**
   * Analyze semantic content (stub implementation)
   * @private
   */
  private async analyzeSemantics(message: string): Promise<any> {
    // Stub implementation - would use NLP/ML for semantic analysis
    return {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.SEMANTIC_ANALYSIS],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: ["Semantic analysis not implemented yet"],
    };
  }

  /**
   * Classify using ML model (stub implementation)
   * @private
   */
  private async classifyWithML(message: string): Promise<any> {
    // Stub implementation - would use trained ML model
    return {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      types: [] as JailbreakType[],
      methods: [DetectionMethod.ML_CLASSIFICATION],
      patterns: [] as string[],
      keywords: [] as string[],
      contextFlags: [] as string[],
      reasoningChain: ["ML classification not implemented yet"],
    };
  }

  /**
   * Check if user/IP is whitelisted
   * @private
   */
  private isWhitelisted(context?: ConversationContext): boolean {
    if (!context) return false;

    const userWhitelisted = context.userId && this.config.whitelistedUsers?.includes(context.userId);
    const ipWhitelisted = context.ipAddress && this.config.whitelistedIPs?.includes(context.ipAddress);

    return Boolean(userWhitelisted || ipWhitelisted);
  }

  /**
   * Check if user/IP is blacklisted
   * @private
   */
  private isBlacklisted(context?: ConversationContext): boolean {
    if (!context) return false;

    const userBlacklisted = context.userId && this.config.blacklistedUsers?.includes(context.userId);
    const ipBlacklisted = context.ipAddress && this.config.blacklistedIPs?.includes(context.ipAddress);

    return Boolean(userBlacklisted || ipBlacklisted);
  }

  /**
   * Check if user has exceeded rate limits
   * @private
   */
  private isRateLimited(context?: ConversationContext): boolean {
    if (!context?.sessionId) return false;

    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute
    const maxRequests = this.config.maxRequestsPerMinute || 30;

    // Get or create tracking array for this session
    if (!this.rateLimitTracking.has(context.sessionId)) {
      this.rateLimitTracking.set(context.sessionId, []);
    }

    const timestamps = this.rateLimitTracking.get(context.sessionId)!;

    // Remove old timestamps
    const recentTimestamps = timestamps.filter((ts) => now - ts < windowMs);

    // Add current timestamp
    recentTimestamps.push(now);

    // Update tracking
    this.rateLimitTracking.set(context.sessionId, recentTimestamps);

    return recentTimestamps.length > maxRequests;
  }

  /**
   * Check if message contains encoded content
   * @private
   */
  private containsEncodedContent(message: string): boolean {
    // Check for Base64 patterns
    const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
    const words = message.split(/\s+/);

    for (const word of words) {
      if (word.length > 20 && base64Regex.test(word)) {
        return true;
      }
    }

    // Check for hex patterns
    const hexRegex = /^[0-9A-Fa-f]+$/;
    for (const word of words) {
      if (word.length > 20 && hexRegex.test(word)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Merge detection results
   * @private
   */
  private mergeDetectionResults(main: any, additional: any): void {
    if (additional.isJailbreak) {
      main.isJailbreak = true;
      main.severity = this.getHigherSeverity(main.severity, additional.severity);
      main.confidence = Math.max(main.confidence, additional.confidence);
      main.types.push(...additional.types);
      main.methods.push(...additional.methods);
      main.patterns.push(...additional.patterns);
      main.keywords.push(...additional.keywords);
      main.contextFlags.push(...additional.contextFlags);
      main.reasoningChain.push(...additional.reasoningChain);
    }
  }

  /**
   * Get higher severity level
   * @private
   */
  private getHigherSeverity(a: JailbreakSeverity, b: JailbreakSeverity): JailbreakSeverity {
    const severityLevels = {
      [JailbreakSeverity.LOW]: 1,
      [JailbreakSeverity.MEDIUM]: 2,
      [JailbreakSeverity.HIGH]: 3,
      [JailbreakSeverity.CRITICAL]: 4,
    };

    return severityLevels[a] >= severityLevels[b] ? a : b;
  }

  /**
   * Calculate overall risk score
   * @private
   */
  private calculateRiskScore(results: any): number {
    let score = 0;

    // Base score from confidence
    score += results.confidence * 50;

    // Add severity multiplier
    const severityMultiplier = {
      [JailbreakSeverity.LOW]: 1,
      [JailbreakSeverity.MEDIUM]: 1.5,
      [JailbreakSeverity.HIGH]: 2,
      [JailbreakSeverity.CRITICAL]: 3,
    };

    score *= severityMultiplier[results.severity as JailbreakSeverity];

    // Add points for multiple detection methods
    score += results.methods.length * 5;

    // Add points for multiple threat types
    score += results.types.length * 10;

    return Math.min(100, Math.max(0, score));
  }

  /**
   * Create safe result for whitelisted or error cases
   * @private
   */
  private createSafeResult(startTime: number, message: string, context?: ConversationContext): JailbreakDetectionResult {
    return {
      isJailbreak: false,
      severity: JailbreakSeverity.LOW,
      confidence: 0,
      detectedTypes: [],
      detectionMethods: [],
      riskScore: 0,
      details: {
        matchedPatterns: [],
        suspiciousKeywords: [],
        contextFlags: [],
        reasoningChain: ["Safe result - no threats detected"],
      },
      metadata: {
        processingTime: Date.now() - startTime,
        messageLength: message.length,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
    };
  }

  /**
   * Create blocked result for blacklisted users
   * @private
   */
  private createBlockedResult(
    startTime: number,
    message: string,
    context: ConversationContext | undefined,
    reason: string,
  ): JailbreakDetectionResult {
    return {
      isJailbreak: true,
      severity: JailbreakSeverity.CRITICAL,
      confidence: 1.0,
      detectedTypes: [JailbreakType.BYPASS_SAFETY],
      detectionMethods: [DetectionMethod.BEHAVIORAL_ANALYSIS],
      riskScore: 100,
      details: {
        matchedPatterns: [],
        suspiciousKeywords: [],
        contextFlags: [reason],
        reasoningChain: [`Blocked: ${reason}`],
      },
      metadata: {
        processingTime: Date.now() - startTime,
        messageLength: message.length,
        userAgent: context?.userAgent,
        ipAddress: context?.ipAddress,
      },
    };
  }

  /**
   * Update detection statistics
   * @private
   */
  private updateStats(result: JailbreakDetectionResult): void {
    if (result.isJailbreak) {
      this.detectionStats.totalDetections++;

      // Update by type
      for (const type of result.detectedTypes) {
        this.detectionStats.detectionsByType[type]++;
      }

      // Update by severity
      this.detectionStats.detectionsBySeverity[result.severity]++;

      // Update averages
      this.detectionStats.averageConfidence =
        (this.detectionStats.averageConfidence * (this.detectionStats.totalDetections - 1) + result.confidence) / this.detectionStats.totalDetections;

      this.detectionStats.averageRiskScore =
        (this.detectionStats.averageRiskScore * (this.detectionStats.totalDetections - 1) + result.riskScore) / this.detectionStats.totalDetections;
    }
  }

  /**
   * Determine overall risk level
   * @private
   */
  private determineOverallRisk(riskScore: number): "low" | "medium" | "high" | "critical" {
    if (riskScore >= 90) return "critical";
    if (riskScore >= 70) return "high";
    if (riskScore >= 40) return "medium";
    return "low";
  }

  /**
   * Get description for jailbreak type
   * @private
   */
  private getTypeDescription(type: JailbreakType): string {
    const descriptions = {
      [JailbreakType.PROMPT_INJECTION]: "Attempt to inject malicious prompts",
      [JailbreakType.ROLE_PLAY]: "Attempt to assume unauthorized roles",
      [JailbreakType.IGNORE_INSTRUCTIONS]: "Attempt to ignore system instructions",
      [JailbreakType.SYSTEM_PROMPT_EXTRACTION]: "Attempt to extract system prompts",
      [JailbreakType.HARMFUL_CONTENT]: "Request for harmful or dangerous content",
      [JailbreakType.PRIVILEGE_ESCALATION]: "Attempt to gain elevated privileges",
      [JailbreakType.DATA_EXTRACTION]: "Attempt to extract sensitive data",
      [JailbreakType.BYPASS_SAFETY]: "Attempt to bypass safety measures",
      [JailbreakType.SOCIAL_ENGINEERING]: "Social engineering attack",
      [JailbreakType.CONTEXT_MANIPULATION]: "Attempt to manipulate conversation context",
    };

    return descriptions[type] || "Unknown threat type";
  }

  /**
   * Generate mitigation suggestions
   * @private
   */
  private generateMitigationSuggestions(result: JailbreakDetectionResult): string[] {
    const suggestions: string[] = [];

    if (result.detectedTypes.includes(JailbreakType.PROMPT_INJECTION)) {
      suggestions.push("Implement stronger input validation and sanitization");
    }

    if (result.detectedTypes.includes(JailbreakType.ROLE_PLAY)) {
      suggestions.push("Add role verification and privilege checking");
    }

    if (result.detectedTypes.includes(JailbreakType.BYPASS_SAFETY)) {
      suggestions.push("Strengthen safety filters and monitoring");
    }

    if (result.riskScore > 80) {
      suggestions.push("Consider implementing additional authentication layers");
    }

    return suggestions;
  }

  /**
   * Get recommended security actions
   * @private
   */
  private getRecommendedActions(result: JailbreakDetectionResult): SecurityAction[] {
    const actions: SecurityAction[] = [];

    if (result.severity === JailbreakSeverity.CRITICAL) {
      actions.push({
        type: "block",
        message: "Request blocked due to security violation",
        notifyAdmin: true,
      });
    } else if (result.severity === JailbreakSeverity.HIGH) {
      actions.push({
        type: "warn",
        message: "Suspicious activity detected",
        notifyAdmin: true,
      });
      actions.push({
        type: "rate_limit",
        duration: 300, // 5 minutes
      });
    } else if (result.severity === JailbreakSeverity.MEDIUM) {
      actions.push({
        type: "log",
        message: "Potential security risk logged",
      });
    }

    return actions;
  }

  /**
   * Analyze contextual factors
   * @private
   */
  private analyzeContextualFactors(
    result: JailbreakDetectionResult,
    context?: ConversationContext,
  ): Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number }> {
    const factors: Array<{ factor: string; impact: "positive" | "negative" | "neutral"; weight: number }> = [];

    if (context?.conversationLength && context.conversationLength > 10) {
      factors.push({
        factor: "Long conversation history",
        impact: "negative",
        weight: 0.3,
      });
    }

    if (result.detectionMethods.length > 2) {
      factors.push({
        factor: "Multiple detection methods triggered",
        impact: "negative",
        weight: 0.4,
      });
    }

    if (result.confidence > 0.8) {
      factors.push({
        factor: "High confidence detection",
        impact: "negative",
        weight: 0.5,
      });
    }

    return factors;
  }
}
