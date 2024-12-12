import path from 'path';
import os from 'os';
import fs from 'fs';
// import keytar from 'keytar';
import { decrypt, encrypt } from './encrypt';
import { getUser } from '../api/user';
import { memoize } from 'lodash';

// Constants for the application
export const SERVICE_NAME = "AnyFlowCLI";
export const ACCOUNT_NAME = "apiToken";

// Store the token securely
export async function storeToken(token: string) {
  // Verify the token by getting user info
  await getUser(token);

  // try {
  //   // Attempt to store the token using the system keychain
  //   await keytar.setPassword(SERVICE_NAME, ACCOUNT_NAME, token);

  //   console.log("Token and user info stored securely using system keychain.");
  // } catch (error) {
  console.warn("Error storing token in system keychain.");
  console.warn("Falling back to file-based storage.");

  // If keychain storage fails, encrypt and store the token in a file
  const encryptedToken = encrypt(token);

  storeTokenInFile(encryptedToken);
  // }
}

// Store the encrypted token in a file
export function storeTokenInFile(encryptedToken: string) {
  const configDir = path.join(os.homedir(), '.anyflow');
  const tokenFile = path.join(configDir, 'token');

  try {
    // Create the config directory if it doesn't exist
    fs.mkdirSync(configDir, { recursive: true });

    // Write the encrypted token to the file with restricted permissions
    fs.writeFileSync(tokenFile, encryptedToken, { mode: 0o600 });

    console.log("Encrypted token stored in ~/.anyflow/token");
  } catch (error) {
    throw new Error(`Failed to store token in file: ${error}`);
  }
}

// Retrieve the stored token
export const getToken = memoize(async function (): Promise<string | null> {
  // First, try to get the token from the system keychain
  // const token = await keytar.getPassword(SERVICE_NAME, ACCOUNT_NAME).catch(() => {
  //   console.log("Token not found in keychain, trying file...");
  // })

  // if (token) {
  //   return token;
  // }

  // If not found in keychain, try to read from file
  const configDir = path.join(os.homedir(), '.anyflow');
  const tokenFile = path.join(configDir, 'token');

  if (!fs.existsSync(tokenFile)) {
    return null;
  }

  try {
    const encryptedToken = fs.readFileSync(tokenFile, 'utf8');
    return decrypt(encryptedToken);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      console.error("No token found. Please authenticate first.");
      process.exit(1);
    }

    console.error(`Failed to read token from file: ${error}`);
    process.exit(1);
  }
})

export async function isAuthenticated(): Promise<boolean> {
  return (await getToken()) !== null;
}

export const getUserId = memoize(async function (): Promise<number> {
  const user = await getUser();
  return user.id;
})

export async function requireAuthentication(): Promise<void> {
  if (!(await isAuthenticated())) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    process.exit(1);
  }
}