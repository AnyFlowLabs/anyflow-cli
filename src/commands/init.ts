import { getToken } from './auth/store-token/store';
import logger from '../utils/logger';
import { storeEnvVars } from '../utils/env-manager';

export async function init(options: { baseRpcUrl?: string; backendUrl?: string } = {}) {
  // TODO: ensure is hardhat project
  await setupEnvironmentVars(options);
}

async function setupEnvironmentVars(options: { baseRpcUrl?: string; backendUrl?: string } = {}) {
  const token = await getToken();

  // Create vars object from existing environment variables
  const vars: Record<string, string> = {};

  if (process.env.ANYFLOW_BASE_RPC_URL) {
    vars.ANYFLOW_BASE_RPC_URL = options.baseRpcUrl || process.env.ANYFLOW_BASE_RPC_URL;
  }

  if (process.env.ANYFLOW_BACKEND_URL) {
    vars.ANYFLOW_BACKEND_URL = options.backendUrl || process.env.ANYFLOW_BACKEND_URL;
  }

  if (process.env.ANYFLOW_FRONTEND_URL) {
    vars.ANYFLOW_FRONTEND_URL = process.env.ANYFLOW_FRONTEND_URL;
  }

  // Only add token if it exists
  if (token) {
    vars.ANYFLOW_API_KEY = token;
  }

  // Add debug flag if set
  if (process.env.ANYFLOW_DEBUG) {
    vars.ANYFLOW_DEBUG = process.env.ANYFLOW_DEBUG;
  }

  vars.HARDHAT_IGNITION_CONFIRM_DEPLOYMENT = process.env.HARDHAT_IGNITION_CONFIRM_DEPLOYMENT || 'false';
  vars.HARDHAT_IGNITION_CONFIRM_RESET = process.env.HARDHAT_IGNITION_CONFIRM_RESET || 'false';

  // Store variables in .anyflow/env.json
  storeEnvVars(vars);

  logger.success('Environment variables configured successfully.');
  if (process.env.NODE_ENV) {
    logger.info(`Environment: ${process.env.NODE_ENV}`);
  }
}