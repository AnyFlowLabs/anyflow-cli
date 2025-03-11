import readline from 'readline/promises';
import logger from '../../utils/logger';

import { isAuthenticated, storeToken } from './store-token/store';
import { handleAuthError } from '../error/auth-error';

// Main authentication function
export async function authenticate() {
  if (await isAuthenticated()) {
    logger.info('You are already authenticated. If you want to re-authenticate, please run \'anyflow logout\' first.');
    process.exit(0);
  }

  const tokenUrl = `${process.env.ANYFLOW_FRONTEND_URL}/settings/api`;

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
      process.exit(1);
    }
  } catch (error: any) {
    handleAuthError(error);

    process.exit(1);
  } finally {
    rl.close();
  }
}