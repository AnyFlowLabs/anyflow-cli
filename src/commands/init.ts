import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getProjectRoot } from '../utils/getProjectRoot';
import { BACKEND_URL, RPC_BASE_URL } from '../config/internal-config';

export async function init() {
    await ensureEnvFile();
    const rootDir = await getProjectRoot();
    dotenv.config({ path: path.join(rootDir, '.env') });
    
    if (!process.env.ANYFLOW_ENCRYPTION_KEY) {
      console.error('ANYFLOW_ENCRYPTION_KEY is not set in the environment variables.');
      process.exit(1);
    }    
}

async function ensureEnvFile() {
  const rootDir = await getProjectRoot();
  const envPath = path.join(rootDir, '.env');
  
  if (!fs.existsSync(envPath)) {
    const key = crypto.randomBytes(32).toString('hex');
    const envContent = [
      `ANYFLOW_ENCRYPTION_KEY=${key}`,
      'NODE_ENV=development',
      'ANYFLOW_BASE_RPC_URL=http://nest:3000',
      'ANYFLOW_BACKEND_URL=http://localhost/api',
    ].join('\n');
    
    fs.writeFileSync(envPath, envContent);
    console.log('Created .env file with default development configuration.');
  } else {
    let envContent = fs.readFileSync(envPath, 'utf8');
    await checkKey(envContent, envPath);
    await checkEnvironmentVars(envContent, envPath);
  }
}

async function checkEnvironmentVars(envContent: string, envPath: string) {
  const vars = {
    NODE_ENV: 'development',
    ANYFLOW_BASE_RPC_URL: RPC_BASE_URL,
    ANYFLOW_BACKEND_URL: BACKEND_URL,
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

async function checkKey(envContent: string, envPath: string) {
  if (!envContent.includes('ANYFLOW_ENCRYPTION_KEY=')) {
    const key = crypto.randomBytes(32).toString('hex');
    
    fs.appendFileSync(envPath, `\nANYFLOW_ENCRYPTION_KEY=${key}\n`);
    
    console.log('Added ANYFLOW_ENCRYPTION_KEY to existing .env file in the project root.');
  } else {
    console.warn('ANYFLOW_ENCRYPTION_KEY already exists in .env file.');
  }
}