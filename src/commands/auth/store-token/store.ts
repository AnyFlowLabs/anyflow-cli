import path from 'path';
import os from 'os';
import fs from 'fs/promises';
import keytar from 'keytar';
import { decrypt, encrypt } from './encrypt';
import { getUser } from '../api/user';

// Constants for the application
export const SERVICE_NAME = "AnyFlowCLI";
export const ACCOUNT_NAME = "apiToken";

// Store the token securely
export async function storeToken(token: string) {
  // Verify the token by getting user info
  await getUser(token);  
  
  try {
    // Attempt to store the token using the system keychain
    await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);

    console.log("Token and user info stored securely using system keychain.");
  } catch (error) {
    console.warn("Error storing token in system keychain.");
    console.warn("Falling back to file-based storage.");

    // If keychain storage fails, encrypt and store the token in a file
    const encryptedToken = encrypt(token);

    await storeTokenInFile(encryptedToken);
  }
}
  
// Store the encrypted token in a file
export async function storeTokenInFile(encryptedToken: string) {
  const configDir = path.join(os.homedir(), '.anyflow');
  const tokenFile = path.join(configDir, 'token');

  try {
    // Create the config directory if it doesn't exist
    await fs.mkdir(configDir, { recursive: true });
    
    // Write the encrypted token to the file with restricted permissions
    await fs.writeFile(tokenFile, encryptedToken, { mode: 0o600 });

    console.log("Encrypted token stored in file ~/.anyflow/token.");
  } catch (error) {
    throw new Error(`Failed to store token in file: ${error}`);
  }
}

// Retrieve the stored token
export async function getToken(): Promise<string | null> {
  // First, try to get the token from the system keychain
  const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME).catch(() => {
    console.log("Token not found in keychain, trying file...");
  })

  if (token) {
    return token;
  }

  // If not found in keychain, try to read from file
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