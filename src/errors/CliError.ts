import { BaseError } from './BaseError';
import { notifyBugsnag } from '../utils/bugsnag';

export enum ErrorCode {
  AUTHENTICATION_FAILED = 'AUTHENTICATION_FAILED',
  NETWORK_ERROR = 'NETWORK_ERROR',
  DEPLOYMENT_FAILED = 'DEPLOYMENT_FAILED',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  FILE_SYSTEM_ERROR = 'FILE_SYSTEM_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  UNEXPECTED_ERROR = 'UNEXPECTED_ERROR',
}

export class CliError extends BaseError {
  public readonly code: ErrorCode;
  public readonly metadata?: Record<string, any>;
  public readonly reportable: boolean;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNEXPECTED_ERROR,
    metadata?: Record<string, any>,
    reportable: boolean = true
  ) {
    super(message);
    this.code = code;
    this.metadata = metadata;
    this.reportable = reportable;

    // If error should be reported to monitoring service
    if (reportable) {
      this.report();
    }
  }

  /**
   * Report the error to Bugsnag
   */
  private report(): void {
    notifyBugsnag(this, this.metadata);
  }

  /**
   * Create a user-friendly error message
   */
  public getFormattedMessage(): string {
    return `Error [${this.code}]: ${this.message}`;
  }

  /**
   * Static helper for creating and handling errors in one step
   */
  public static handle(
    message: string,
    code: ErrorCode = ErrorCode.UNEXPECTED_ERROR,
    metadata?: Record<string, any>,
    exitCode: number = 1
  ): never {
    const error = new CliError(message, code, metadata);
    console.error(error.getFormattedMessage());
    process.exit(exitCode);
  }
} 