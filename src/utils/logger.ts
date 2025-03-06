import chalk from 'chalk';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  SUCCESS = 2,
  WARN = 3,
  ERROR = 4,
}

// Set default log level based on environment
let currentLogLevel: LogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.INFO 
  : LogLevel.DEBUG;

export function setLogLevel(level: LogLevel): void {
  currentLogLevel = level;
}

export function getLogLevel(): LogLevel {
  return currentLogLevel;
}

/**
 * Format a message with a prefix
 */
function formatMessage(prefix: string, message: string): string {
  return `${prefix} ${message}`;
}

/**
 * Debug level logging - only shown in development
 */
export function debug(message: string): void {
  if (currentLogLevel <= LogLevel.DEBUG) {
    console.debug(formatMessage(chalk.gray('DEBUG:'), message));
  }
}

/**
 * Info level logging
 */
export function info(message: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.info(formatMessage(chalk.blue('INFO:'), message));
  }
}

/**
 * Success level logging
 */
export function success(message: string): void {
  if (currentLogLevel <= LogLevel.SUCCESS) {
    console.log(formatMessage(chalk.green('SUCCESS:'), message));
  }
}

/**
 * Warning level logging
 */
export function warn(message: string): void {
  if (currentLogLevel <= LogLevel.WARN) {
    console.warn(formatMessage(chalk.yellow('WARNING:'), message));
  }
}

/**
 * Error level logging
 */
export function error(message: string, err?: Error): void {
  if (currentLogLevel <= LogLevel.ERROR) {
    console.error(formatMessage(chalk.red('ERROR:'), message));
    if (err && currentLogLevel === LogLevel.DEBUG) {
      console.error(err);
    }
  }
}

/**
 * Outputs a formatted heading
 */
export function heading(title: string): void {
  if (currentLogLevel <= LogLevel.INFO) {
    console.log('\n' + chalk.bold.cyan(title));
    console.log(chalk.cyan('═'.repeat(title.length)) + '\n');
  }
}

/**
 * Creates a spinner/progress indicator
 * Simple implementation - can be replaced with a more robust library like ora
 */
export function spinner(message: string): { succeed: Function; fail: Function; update: Function } {
  if (currentLogLevel > LogLevel.INFO) {
    // Return a no-op if log level is higher than INFO
    return {
      succeed: () => {},
      fail: () => {},
      update: () => {},
    };
  }

  process.stdout.write(`${chalk.cyan('⟳')} ${message}`);
  
  return {
    succeed: (successMessage?: string) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(`${chalk.green('✓')} ${successMessage || message}`);
    },
    fail: (failMessage?: string) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      console.log(`${chalk.red('✗')} ${failMessage || message}`);
    },
    update: (updateMessage: string) => {
      process.stdout.clearLine(0);
      process.stdout.cursorTo(0);
      process.stdout.write(`${chalk.cyan('⟳')} ${updateMessage}`);
    }
  };
}

// Export a default logger object
export default {
  debug,
  info,
  success,
  warn,
  error,
  heading,
  spinner,
  setLogLevel,
  getLogLevel,
  LogLevel,
}; 