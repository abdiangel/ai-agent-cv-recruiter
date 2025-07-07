/**
 * AI Recruitment Agent - Main Entry Point
 *
 * A comprehensive AI-powered recruitment system with conversational capabilities,
 * CV processing, candidate screening, intention detection, jailbreak protection,
 * and automated HR workflows.
 */

// Export all modular components
export * from "./intention";
export * from "./state";
export * from "./utils";
export * from "./cv";
export * from "./core";

// Re-export main classes for convenience
export { IntentionDetector } from "./intention/IntentionDetector";
export { AgentStateMachine } from "./state/AgentStateMachine";
export { CVParser } from "./cv/CVParser";
export { JailbreakDetector } from "./security/JailbreakDetector";
export { RecruitingAgent } from "./core/RecruitingAgent";

// Re-export key types
export type { CandidateIntention, IntentionDetectionResult, IntentionDetectorConfig } from "./intention/IntentionTypes";

export type { AgentState, AgentAction, StateTransitionResult, StateMachineConfig } from "./state/AgentStates";

export type { CandidateProfile, CVParsingResult, CVAnalysis, CVParserConfig } from "./cv/CVTypes";

export type {
  JailbreakDetectionResult,
  JailbreakSeverity,
  JailbreakType,
  JailbreakDetectorConfig,
  ThreatAnalysis,
  ConversationContext as SecurityConversationContext,
  SecurityAction,
  JailbreakStats,
  DetectionMethod,
} from "./security/JailbreakTypes";

export type { MessageProcessingResult, UserSession, RecruitingAgentConfig, AgentAnalytics } from "./core/RecruitingAgentTypes";

// Utility exports
export { Logger } from "./utils/Logger";
export { PatternMatcher } from "./utils/PatternMatcher";

/**
 * Unified RecruitmentAgent class that provides the complete recruitment system
 * This is the main entry point for most applications
 */
import { RecruitingAgent } from "./core/RecruitingAgent";
import { RecruitingAgentConfig } from "./core/RecruitingAgentTypes";

export class RecruitmentAgent extends RecruitingAgent {
  constructor(config: RecruitingAgentConfig = {}) {
    super({
      enableJailbreakDetection: true,
      enableCVParsing: true,
      enableAnalytics: true,
      personalizedResponses: true,
      enableInterviewFlow: true,
      supportedLanguages: ["en", "es", "fr"],
      defaultLanguage: "en",
      ...config,
    });
  }

  /**
   * Get system information and capabilities
   */
  public getSystemInfo() {
    return {
      name: "AI Recruitment Agent",
      version: "2.0.0",
      components: {
        intentionDetection: "v2.0.0 - Enhanced multilingual support",
        stateMachine: "v2.0.0 - Configurable workflow management",
        cvParsing: "v1.0.0 - Intelligent document processing",
        jailbreakDetection: "v1.0.0 - Advanced security protection",
        sessionManagement: "v1.0.0 - Multi-user conversation tracking",
        analytics: "v1.0.0 - Real-time performance monitoring",
      },
      features: [
        "Conversational AI recruitment workflows",
        "Intelligent CV parsing and analysis",
        "Multi-language support (EN, ES, FR)",
        "Advanced jailbreak and security detection",
        "Real-time analytics and monitoring",
        "Configurable interview workflows",
        "Session persistence and management",
        "Personalized candidate experiences",
        "Automated candidate evaluation",
        "HR report generation",
      ],
      supportedFormats: ["PDF", "DOC", "DOCX", "TXT", "JSON"],
      securityFeatures: [
        "Pattern-based jailbreak detection",
        "Keyword analysis",
        "Context validation",
        "Behavioral analysis",
        "Rate limiting",
        "IP whitelisting/blacklisting",
        "Real-time threat analysis",
      ],
    };
  }
}

/**
 * Quick start factory function for common use cases
 */
export function createRecruitmentAgent(options?: {
  language?: "en" | "es" | "fr";
  enableSecurity?: boolean;
  enableCVProcessing?: boolean;
  enableAnalytics?: boolean;
}): RecruitmentAgent {
  const config: RecruitingAgentConfig = {
    defaultLanguage: options?.language || "en",
    supportedLanguages: options?.language ? [options.language] : ["en", "es", "fr"],
    enableJailbreakDetection: options?.enableSecurity ?? true,
    blockOnSecurity: options?.enableSecurity ?? true,
    enableCVParsing: options?.enableCVProcessing ?? true,
    autoExtractProfile: options?.enableCVProcessing ?? true,
    enableAnalytics: options?.enableAnalytics ?? true,
    trackUserEngagement: options?.enableAnalytics ?? true,
    personalizedResponses: true,
    enableInterviewFlow: true,
    enableSmartResponses: true,
  };

  return new RecruitmentAgent(config);
}

/**
 * Version and metadata
 */
export const AI_RECRUITMENT_AGENT_VERSION = "2.0.0";
export const AI_RECRUITMENT_AGENT_BUILD = Date.now();

/**
 * Module metadata for debugging and monitoring
 */
export const MODULE_INFO = {
  version: AI_RECRUITMENT_AGENT_VERSION,
  build: AI_RECRUITMENT_AGENT_BUILD,
  modules: {
    intention: "Multilingual intention detection with context validation",
    state: "Configurable state machine for recruitment workflows",
    cv: "Intelligent CV parsing with skill extraction and analysis",
    security: "Advanced jailbreak detection and threat analysis",
    agent: "Main orchestration layer with session management",
    utils: "Shared utilities for logging and pattern matching",
  },
  capabilities: [
    "Real-time conversation processing",
    "Document upload and parsing",
    "Security threat detection",
    "Multi-session management",
    "Analytics and reporting",
    "Configurable workflows",
    "Multi-language support",
  ],
};
