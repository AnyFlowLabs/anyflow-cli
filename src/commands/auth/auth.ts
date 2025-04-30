import readline from 'readline/promises';
import logger from '../../utils/logger';

import { isAuthenticated, storeToken } from './store-token/store';
import { handleAuthError } from '../error/auth-error';
import { getEnvVar } from '../../utils/env-manager';
import { EXIT_CODE_GENERIC_ERROR, EXIT_CODE_SUCCESS } from '../../utils/exitCodes';

// Main authentication function
export async function authenticate() {
  if (await isAuthenticated()) {
    logger.info('You are already authenticated. If you want to re-authenticate, please run \'anyflow logout\' first.');
    process.exit(EXIT_CODE_SUCCESS);
  }

  const frontendUrl = getEnvVar('ANYFLOW_FRONTEND_URL');
  if (!frontendUrl) {
    logger.error('ANYFLOW_FRONTEND_URL is not set. Please run "anyflow init" first.');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  const tokenUrl = `${frontendUrl}/settings/api`;

  logger.info('Opening your browser to authenticate...');
  logger.info(`URL: ${tokenUrl}`);

  // Using dynamic imports because of conflicts
  const open = (await import('open')).default;

  // Attempt to open the authentication URL in the default browser
  try {
    await open(tokenUrl);
    logger.success('Browser opened successfully.');
  } catch (err) {
    logger.error(`Error opening URL, please open ${tokenUrl} and get the token from the browser.`, err instanceof Error ? err : undefined);
  }

  // Set up readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const token = await rl.question('Please paste your API token here: ');

    if (token && token.trim()) {
      await storeToken(token.trim());
    } else {
      logger.error('Invalid token. Please provide a non-empty token.');
      process.exit(EXIT_CODE_GENERIC_ERROR);
    }
  } catch (error: any) {
    handleAuthError(error);

    process.exit(EXIT_CODE_GENERIC_ERROR);
  } finally {
    rl.close();
  }
}