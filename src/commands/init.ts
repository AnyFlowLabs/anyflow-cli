import fs from 'fs';
import path from 'path';
import { getProjectRoot } from '../utils/getProjectRoot';
import { getToken } from './auth/store-token/store';

export async function init() {
  // TODO: ensure is hardhat project
  await ensureEnvFile();
}

async function ensureEnvFile() {
  const rootDir = await getProjectRoot();
  const envPath = path.join(rootDir, '.env');

  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, '');
  }

  let envContent = fs.readFileSync(envPath, 'utf8');
  // [TEMP] Disabling encryption for now [AF-281]
  // await checkKey(envContent, envPath);
  await checkEnvironmentVars(envContent, envPath);

  console.log('Created .env file with default configuration.');
}

async function checkEnvironmentVars(envContent: string, envPath: string) {
  const vars = {
    ANYFLOW_BASE_RPC_URL: process.env.ANYFLOW_BASE_RPC_URL,
    ANYFLOW_BACKEND_URL: process.env.ANYFLOW_BACKEND_URL,
    ANYFLOW_API_KEY: await getToken(),
  };

  let updated = false;
  for (const [key, value] of Object.entries(vars)) {
    if (!envContent.includes(`${key}=`)) {
      fs.appendFileSync(envPath, `\n${key}=${value}`);
      updated = true;
    }
  }

  if (updated) {
    console.log('Updated .env file with missing environment variables.');
  }
}

// async function checkKey(envContent: string, envPath: string) {
//   if (envContent.includes('ANYFLOW_ENCRYPTION_KEY=')) {
//     console.warn('ANYFLOW_ENCRYPTION_KEY already exists in .env file.');
//     return
//   }

//   const key = crypto.randomBytes(32).toString('hex');
//   fs.appendFileSync(envPath, `\nANYFLOW_ENCRYPTION_KEY=${key}\n`);

//   console.log('Added ANYFLOW_ENCRYPTION_KEY to existing .env file in the project root.');
// }