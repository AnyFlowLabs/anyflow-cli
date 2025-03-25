import fs from 'fs';
import path from 'path';

import { getProjectRoot } from '../utils/getProjectRoot';
import { getToken } from './auth/store-token/store';
import logger from '../utils/logger';

export async function init(options: { baseRpcUrl?: string; backendUrl?: string } = {}) {
  const rootDir = await getProjectRoot();
  const envPath = path.join(rootDir, '.env');

  // TODO: ensure is hardhat project
  await ensureEnvFile(envPath);

  const envContent = fs.readFileSync(envPath, 'utf8');
  // [TEMP] Disabling encryption for now [AF-281]
  // await checkKey(envContent, envPath);
  await checkEnvironmentVars(envContent, envPath, options);

  logger.success('Created .env file with default configuration.');
}

async function ensureEnvFile(envPath: string) {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '');
  }
}

async function checkEnvironmentVars(
  envContent: string,
  envPath: string,
  options: { baseRpcUrl?: string; backendUrl?: string } = {}
) {
  const vars = {
    ANYFLOW_BASE_RPC_URL: options.baseRpcUrl || process.env.ANYFLOW_BASE_RPC_URL,
    ANYFLOW_BACKEND_URL: options.backendUrl || process.env.ANYFLOW_BACKEND_URL,
    ANYFLOW_API_KEY: '',
  };

  const token = await getToken()

  if (token) {
    vars.ANYFLOW_API_KEY = token;
  }

  let updated = false;
  for (const [key, value] of Object.entries(vars)) {
    if (!envContent.includes(`${key}=`)) {
      fs.appendFileSync(envPath, `\n${key}=${value}`);
      updated = true;
    } else {
      envContent = envContent.replace(`${key}=${envContent.split(`${key}=`)[1].split('\n')[0]}`, `${key}=${value}`);
      updated = true;
    }
  }

  if (updated) {
    logger.info('Updated .env file with missing environment variables.', { envContent });
  }
}

// async function checkKey(envContent: string, envPath: string) {
//   if (envContent.includes('ANYFLOW_ENCRYPTION_KEY=')) {
//     logger.warn('ANYFLOW_ENCRYPTION_KEY already exists in .env file.');
//     return
//   }

//   const key = crypto.randomBytes(32).toString('hex');
//   fs.appendFileSync(envPath, `\nANYFLOW_ENCRYPTION_KEY=${key}\n`);

//   logger.info('Added ANYFLOW_ENCRYPTION_KEY to existing .env file in the project root.');
// }