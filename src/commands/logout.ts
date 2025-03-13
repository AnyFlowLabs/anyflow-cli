import logger from '../utils/logger';
import { deleteEnvVar } from '../utils/env-manager';

export async function logout() {
  try {
    // Delete API key from .anyflow/env.json
    deleteEnvVar('ANYFLOW_API_KEY');

    logger.success('Logged out successfully.');
  } catch (error) {
    logger.error('Error during logout:', error instanceof Error ? error : undefined);
  }
}
