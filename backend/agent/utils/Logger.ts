/**
 * Log levels for different types of messages
 */
export enum LogLevel {
  DEBUG = "debug",
  INFO = "info",
  WARN = "warn",
  ERROR = "error",
  SECURITY = "security",
}

/**
 * Logger configuration interface
 */
export interface LoggerConfig {
  level?: LogLevel;
  enableConsoleOutput?: boolean;
  enableFileOutput?: boolean;
  logFormat?: "json" | "text";
}

/**
 * Simple logger utility for the recruitment agent
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;

  private constructor(config: LoggerConfig = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsoleOutput: true,
      enableFileOutput: false,
      logFormat: "text",
      ...config,
    };
  }

  /**
   * Gets the singleton logger instance
   * @param config - Optional configuration for the logger
   * @returns Logger instance
   */
  public static getInstance(config?: LoggerConfig): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Logs a debug message
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  public debug(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.DEBUG, message, metadata);
  }

  /**
   * Logs an info message
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  public info(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.INFO, message, metadata);
  }

  /**
   * Logs a warning message
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  public warn(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.WARN, message, metadata);
  }

  /**
   * Logs an error message
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  public error(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.ERROR, message, metadata);
  }

  /**
   * Logs a security-related message
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  public security(message: string, metadata?: Record<string, any>): void {
    this.log(LogLevel.SECURITY, message, metadata);
  }

  /**
   * Core logging method
   * @param level - The log level
   * @param message - The message to log
   * @param metadata - Optional metadata to include
   */
  private log(level: LogLevel, message: string, metadata?: Record<string, any>): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      metadata,
    };

    if (this.config.enableConsoleOutput) {
      this.logToConsole(logEntry);
    }

    // File output would be implemented here in a real application
    if (this.config.enableFileOutput) {
      // this.logToFile(logEntry);
    }
  }

  /**
   * Checks if a message should be logged based on the current log level
   * @param level - The log level to check
   * @returns True if the message should be logged
   */
  private shouldLog(level: LogLevel): boolean {
    const levels = [LogLevel.DEBUG, LogLevel.INFO, LogLevel.WARN, LogLevel.ERROR, LogLevel.SECURITY];
    const currentLevelIndex = levels.indexOf(this.config.level!);
    const messageLevelIndex = levels.indexOf(level);

    return messageLevelIndex >= currentLevelIndex;
  }

  /**
   * Logs to console with appropriate formatting
   * @param logEntry - The log entry to output
   */
  private logToConsole(logEntry: any): void {
    const { timestamp, level, message, metadata } = logEntry;

    if (this.config.logFormat === "json") {
      console.log(JSON.stringify(logEntry));
      return;
    }

    // Text format
    const metadataStr = metadata ? ` ${JSON.stringify(metadata)}` : "";
    const logMessage = `[${timestamp}] ${level.toUpperCase()}: ${message}${metadataStr}`;

    switch (level) {
      case LogLevel.DEBUG:
        console.debug(logMessage);
        break;
      case LogLevel.INFO:
        console.info(logMessage);
        break;
      case LogLevel.WARN:
        console.warn(logMessage);
        break;
      case LogLevel.ERROR:
        console.error(logMessage);
        break;
      case LogLevel.SECURITY:
        console.error(`🚨 SECURITY: ${message}${metadataStr}`);
        break;
      default:
        console.log(logMessage);
    }
  }
}
