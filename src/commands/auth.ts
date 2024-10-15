import dotenv from 'dotenv';
import open from "open";
import readline from 'readline/promises';
import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import keytar from 'keytar';

dotenv.config();

const SERVICE_NAME = "AnyFlowCLI";
const ACCOUNT_NAME = "apiToken";
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

if (!ENCRYPTION_KEY) {
  console.error("ENCRYPTION_KEY is not set in the environment variables, run `anyflow init` to set it up.");
  process.exit(1);
}

export async function authenticate() {
  console.log("Opening your browser to authenticate...");

  const url = "https://app-staging.anyflow.pro/dev";

  try {
    await open(url);
    console.log("Browser opened successfully.");
  } catch (err) {
    console.error(`Error opening URL: ${err}`);
    process.exit(1);
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    const token = await rl.question("Please paste your API token here: ");
    if (token && token.trim()) {
      await storeToken(token.trim());
      console.log("Token stored securely.");
    } else {
      console.log("Invalid token. Please provide a non-empty token.");
      process.exit(1);
    }
  } catch (error) {
    console.error("Error storing token:", error);
    process.exit(1);
  } finally {
    rl.close();
  }
}

function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!, 'hex'), iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

function decrypt(text: string): string {
  const [ivHex, encryptedHex] = text.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!, 'hex'), iv);
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

async function storeToken(token: string) {
  try {
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);
    console.log("Token stored securely using system keychain.");
  } catch (error) {
    console.warn("Failed to store token in system keychain. Falling back to file-based storage.");
    const encryptedToken = encrypt(token);
    await storeTokenInFile(encryptedToken);
  }
}

async function storeTokenInFile(encryptedToken: string) {
  const configDir = path.join(os.homedir(), '.anyflow');
  const tokenFile = path.join(configDir, 'token');

  try {
    await fs.mkdir(configDir, { recursive: true });
    await fs.writeFile(tokenFile, encryptedToken, { mode: 0o600 });
  } catch (error) {
    throw new Error(`Failed to store token in file: ${error}`);
  }
}

export async function getToken(): Promise<string | null> {
  const configDir = path.join(os.homedir(), '.anyflow');
  const tokenFile = path.join(configDir, 'token');

  try {
    const encryptedToken = await fs.readFile(tokenFile, 'utf8');
    return decrypt(encryptedToken);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error("No token found. Please authenticate first.");
      process.exit(1);
    }
    console.error(`Failed to read token from file: ${error}`);
    process.exit(1);
  }
}

export async function checkAuth() {
  const token = await getToken();
  if (!token) {
    console.log("You are not authenticated. Please run 'anyflow auth' to authenticate.");
    process.exit(1);
  }
  console.log("You are authenticated.");
}
