import fs from 'fs';
import path from 'path';
import os from 'os';

import dotenv from 'dotenv';
import logger from '../utils/logger';

// import keytar from 'keytar';
// import { SERVICE_NAME, ACCOUNT_NAME } from './auth/store-token/store';
import { getProjectRoot } from '../utils/getProjectRoot';

export async function logout() {
  const rootDir = await getProjectRoot();

  if (!rootDir) {
    logger.error('Could not determine project root directory.');
    return;
  }

  const envPath = path.join(rootDir, '.env');
  const keyFilePath = path.join(os.homedir(), '.anyflow');

  try {
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      delete envConfig.ANYFLOW_ENCRYPTION_KEY;
      const newEnvContent = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      fs.writeFileSync(envPath, newEnvContent);
      logger.info('ANYFLOW_ENCRYPTION_KEY removed from .env file.');
    }

    if (fs.existsSync(keyFilePath)) {
      fs.rmSync(keyFilePath, { recursive: true });
      logger.info('Encryption key file deleted.');
    } else {
      logger.warn('Encryption key file not found.');
    }

    // try {
    //   await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
    //   logger.info('Token deleted from system keychain.');
    // } catch (error) {
    //   logger.warn('Token not found in system keychain.');
    // }

    logger.success('Logged out successfully.');
  } catch (error) {
    logger.error('Error during logout:', error instanceof Error ? error : undefined);
  }
}
