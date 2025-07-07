// Session management utilities
export class SessionManager {
  private static readonly SESSION_KEY = "ai-recruiter-session";
  private static readonly USER_KEY = "ai-recruiter-user";

  /**
   * Generate a new session ID
   */
  static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get current session ID from localStorage or generate new one
   */
  static getSessionId(): string {
    let sessionId = localStorage.getItem(this.SESSION_KEY);

    if (!sessionId) {
      sessionId = this.generateSessionId();
      this.setSessionId(sessionId);
    }

    return sessionId;
  }

  /**
   * Set session ID in localStorage
   */
  static setSessionId(sessionId: string): void {
    localStorage.setItem(this.SESSION_KEY, sessionId);
  }

  /**
   * Clear session from localStorage
   */
  static clearSession(): void {
    localStorage.removeItem(this.SESSION_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  /**
   * Get user ID from localStorage
   */
  static getUserId(): string | null {
    return localStorage.getItem(this.USER_KEY);
  }

  /**
   * Set user ID in localStorage
   */
  static setUserId(userId: string): void {
    localStorage.setItem(this.USER_KEY, userId);
  }

  /**
   * Generate a unique message ID
   */
  static generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get user metadata for API requests
   */
  static getUserMetadata() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      timestamp: new Date().toISOString(),
    };
  }
}
