import fs from 'fs';
import path from 'path';
import os from 'os';
import logger from './logger';

// Constants
const ANYFLOW_DIR = '.anyflow';
const ANYFLOW_ENV_FILE = 'env.json';
const ANYFLOW_CONFIG_DIR = path.join(os.homedir(), ANYFLOW_DIR);

/**
 * Makes sure the .anyflow directory exists in user's home directory
 */
function ensureAnyflowDir(): void {
  if (!fs.existsSync(ANYFLOW_CONFIG_DIR)) {
    fs.mkdirSync(ANYFLOW_CONFIG_DIR, { recursive: true });
  }
}

/**
 * Gets the environment variables stored in the .anyflow/env.json file
 */
export function getStoredEnvVars(): Record<string, string> {
  ensureAnyflowDir();
  const envFilePath = path.join(ANYFLOW_CONFIG_DIR, ANYFLOW_ENV_FILE);
  
  if (!fs.existsSync(envFilePath)) {
    return {};
  }
  
  try {
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    return JSON.parse(envContent);
  } catch (error) {
    console.warn(`Failed to read environment variables from ${envFilePath}:`, error);
    return {};
  }
}

/**
 * Stores environment variables in the .anyflow/env.json file
 */
export function storeEnvVars(envVars: Record<string, string>): void {
  ensureAnyflowDir();
  const envFilePath = path.join(ANYFLOW_CONFIG_DIR, ANYFLOW_ENV_FILE);
  
  // Merge with existing vars (if any)
  const existingVars = getStoredEnvVars();
  const mergedVars = { ...existingVars, ...envVars };
  
  try {
    fs.writeFileSync(
      envFilePath,
      JSON.stringify(mergedVars, null, 2),
      { mode: 0o600 } // Restrictive permissions
    );
  } catch (error) {
    console.error(`Failed to store environment variables in ${envFilePath}:`, error);
  }
}

/**
 * Updates a single environment variable in the .anyflow/env.json file
 */
export function updateEnvVar(key: string, value: string): void {
  storeEnvVars({ [key]: value });
}

/**
 * Deletes an environment variable from the .anyflow/env.json file
 */
export function deleteEnvVar(key: string): boolean {
  try {
    ensureAnyflowDir();
    const envFilePath = path.join(ANYFLOW_CONFIG_DIR, ANYFLOW_ENV_FILE);
    
    if (!fs.existsSync(envFilePath)) {
      logger.warn(`Environment variable ${key} not found (file doesn't exist).`);
      return false;
    }
    
    // Read the current content
    const envContent = fs.readFileSync(envFilePath, 'utf8');
    let envVars: Record<string, string> = {};
    
    try {
      envVars = JSON.parse(envContent);
    } catch (parseError) {
      logger.error('Error parsing env.json file:', parseError instanceof Error ? parseError : undefined);
      return false;
    }
    
    // Check if the key exists
    if (!(key in envVars)) {
      logger.warn(`Environment variable ${key} not found in .anyflow/env.json file.`);
      return false;
    }
    
    // Delete the key
    delete envVars[key];
    
    // Write the updated content back to the file
    fs.writeFileSync(
      envFilePath,
      JSON.stringify(envVars, null, 2),
      { mode: 0o600 } // Restrictive permissions
    );
    
    logger.info(`Deleted environment variable ${key} from .anyflow/env.json file.`);
    return true;
  } catch (error) {
    logger.error(`Failed to delete environment variable ${key}:`, error instanceof Error ? error : undefined);
    return false;
  }
}

/**
 * Gets the value of an environment variable, first checking the .anyflow/env.json file,
 * then falling back to process.env
 */
export function getEnvVar(key: string): string | undefined {
  const storedVars = getStoredEnvVars();
  
  // First check if it's in the .anyflow/env.json file
  if (key in storedVars) {
    return storedVars[key];
  }
  
  // Then fall back to process.env
  return process.env[key];
}

/**
 * Loads environment variables from the .anyflow/env.json file into process.env
 */
export function loadEnvVars(): void {
  const storedVars = getStoredEnvVars();
  
  // Set each stored variable in process.env if not already set
  for (const [key, value] of Object.entries(storedVars)) {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
} 