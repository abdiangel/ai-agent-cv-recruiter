/**
 * Utility class for pattern matching in text analysis
 */
export class PatternMatcher {
  /**
   * Cleans and normalizes text for pattern matching
   * @param text - The text to clean
   * @returns Cleaned and normalized text
   */
  public static cleanText(text: string): string {
    return text.trim().toLowerCase();
  }

  /**
   * Checks if text matches any of the provided patterns
   * @param text - The text to check
   * @param patterns - Array of RegExp patterns to match against
   * @returns True if any pattern matches, false otherwise
   */
  public static matchesAnyPattern(text: string, patterns: RegExp[]): boolean {
    return patterns.some((pattern) => pattern.test(text));
  }

  /**
   * Finds all pattern matches in text with their indices
   * @param text - The text to search
   * @param patterns - Array of RegExp patterns to match against
   * @returns Array of matches with their patterns and indices
   */
  public static findAllMatches(text: string, patterns: RegExp[]): Array<{ pattern: RegExp; match: RegExpMatchArray; index: number }> {
    const matches: Array<{ pattern: RegExp; match: RegExpMatchArray; index: number }> = [];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match.index !== undefined) {
        matches.push({ pattern, match, index: match.index });
      }
    }

    return matches.sort((a, b) => a.index - b.index);
  }

  /**
   * Calculates confidence score based on pattern matching
   * @param text - The text that was matched
   * @param pattern - The pattern that matched
   * @param baseConfidence - Base confidence score (0-1)
   * @returns Adjusted confidence score
   */
  public static calculateConfidence(text: string, pattern: RegExp, baseConfidence: number = 0.8): number {
    const match = text.match(pattern);
    if (!match) return 0;

    // Adjust confidence based on match quality
    const matchLength = match[0].length;
    const textLength = text.length;
    const matchRatio = matchLength / textLength;

    // Boost confidence for higher match ratios
    const adjustedConfidence = Math.min(1, baseConfidence + matchRatio * 0.2);

    return Math.round(adjustedConfidence * 10) / 10; // Round to 1 decimal place
  }

  /**
   * Validates if a text contains only safe characters (anti-injection)
   * @param text - The text to validate
   * @returns True if text is safe, false otherwise
   */
  public static isSafeText(text: string): boolean {
    // Check for potentially dangerous patterns
    const dangerousPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /javascript:/gi,
      /data:text\/html/gi,
      /vbscript:/gi,
      /onload|onclick|onerror|onmouseover/gi,
    ];

    return !this.matchesAnyPattern(text, dangerousPatterns);
  }

  /**
   * Escapes special regex characters in a string
   * @param text - The text to escape
   * @returns Escaped text safe for regex
   */
  public static escapeRegExp(text: string): string {
    return text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
}
