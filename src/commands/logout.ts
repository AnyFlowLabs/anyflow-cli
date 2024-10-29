import fs from 'fs';
import path from 'path';
import os from 'os';
import dotenv from 'dotenv';
import keytar from 'keytar';
import { SERVICE_NAME, ACCOUNT_NAME } from './auth/store-token/store';
import { getProjectRoot } from '../utils/getProjectRoot';

export async function logout() {
  const rootDir = await getProjectRoot();

  if (!rootDir) {
    console.error('Could not determine project root directory.');
    return;
  }

  const envPath = path.join(rootDir, '.env');
  const keyFilePath = path.join(os.homedir(), '.anyflow');

  try {
    if (fs.existsSync(envPath)) {
      const envConfig = dotenv.parse(fs.readFileSync(envPath));
      delete envConfig.ENCRYPTION_KEY;
      const newEnvContent = Object.entries(envConfig)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');
      fs.writeFileSync(envPath, newEnvContent);
      console.log('ENCRYPTION_KEY removed from .env file.');
    }

    if (fs.existsSync(keyFilePath)) {
      fs.rmSync(keyFilePath, { recursive:true })
      console.log('Encryption key file deleted.');
    }else {
      console.warn('Encryption key file not found.');
    }

    try {
      await keytar.deletePassword(SERVICE_NAME, ACCOUNT_NAME);
      console.log('Token deleted from system keychain.');
    } catch (error) {
      console.warn('Token not found in system keychain.');
    }

    console.log('Logged out successfully.');
  } catch (error) {
    console.error('Error during logout:', error);
  }
}
