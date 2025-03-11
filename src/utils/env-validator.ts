import { CliError, ErrorCode } from '../errors/CliError';
import logger from './logger';

interface EnvVarConfig {
  name: string;
  required: boolean;
  defaultValue?: string;
  validator?: (value: string) => boolean;
  errorMessage?: string;
}

/**
 * Validates and loads environment variables
 * @param vars List of environment variables to validate
 * @returns Object with validated environment variables
 */
export function validateEnv(vars: EnvVarConfig[]): Record<string, string> {
  const result: Record<string, string> = {};
  const missingVars: string[] = [];
  const invalidVars: string[] = [];

  vars.forEach((varConfig) => {
    const { name, required, defaultValue, validator, errorMessage } = varConfig;
    let value = process.env[name];

    // Check if value exists or use default
    if (!value && defaultValue !== undefined) {
      value = defaultValue;
    }

    // Check if required value is missing
    if (required && !value) {
      missingVars.push(name);
      return;
    }

    // Skip validation for optional values that don't exist
    if (!value) {
      return;
    }

    // Validate value if validator exists
    if (validator && !validator(value)) {
      invalidVars.push(`${name}${errorMessage ? `: ${errorMessage}` : ''}`);
      return;
    }

    // Store validated value
    result[name] = value;
  });

  // Report missing required variables
  if (missingVars.length > 0) {
    const message = `Missing required environment variables: ${missingVars.join(', ')}`;
    logger.error(message);
    throw new CliError(
      message,
      ErrorCode.CONFIGURATION_ERROR,
      { missingVars }
    );
  }

  // Report invalid variables
  if (invalidVars.length > 0) {
    const message = `Invalid environment variables: ${invalidVars.join(', ')}`;
    logger.error(message);
    throw new CliError(
      message,
      ErrorCode.CONFIGURATION_ERROR,
      { invalidVars }
    );
  }

  return result;
}

/**
 * Common validators for environment variables
 */
export const validators = {
  /**
   * Validates that a URL is properly formatted
   */
  isUrl: (value: string): boolean => {
    try {
      new URL(value);
      return true;
    } catch {
      return false;
    }
  },

  /**
   * Validates that a value is a valid port number
   */
  isPort: (value: string): boolean => {
    const port = parseInt(value, 10);
    return !isNaN(port) && port > 0 && port <= 65535;
  },

  /**
   * Creates a validator that checks a value against a regex pattern
   */
  matchesPattern: (pattern: RegExp, errorMsg?: string) => {
    return (value: string): boolean => pattern.test(value);
  },

  /**
   * Validates that a value is one of the allowed values
   */
  isOneOf: (allowedValues: string[]) => {
    return (value: string): boolean => allowedValues.includes(value);
  }
}; 