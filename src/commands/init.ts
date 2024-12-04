import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { getProjectRoot } from '../utils/getProjectRoot';

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
    
    fs.writeFileSync(envPath, `ANYFLOW_ENCRYPTION_KEY=${key}`);
    fs.writeFileSync(envPath, `\nANYFLOW_RCP_BASE_URL=http://nest:3000`);
    
    console.log('Updated .env file with encryption key in the project root.');
  } else {
    let envContent = fs.readFileSync(envPath, 'utf8');
    
    await checkKey(envContent, envPath)

    await checkURL(envContent, envPath)
  }
}

async function checkURL(envContent: string, envPath: string) {
  if(!envContent.includes("ANYFLOW_BASE_RPC_URL")) {
    fs.appendFileSync(envPath, `\nANYFLOW_BASE_RPC_URL=http://nest:3000`);
    
    console.log('Added ANYFLOW_BASE_RPC_URL to existing .env file in the project root.');
  }else {
    console.warn('ANYFLOW_BASE_RPC_URL already exists in .env file.');
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