import { memoize } from 'lodash';
import { getUser } from '../api/user';
import { updateEnvVar, getEnvVar } from '../../../utils/env-manager';

// Store the token securely
export async function storeToken(token: string) {
  // Verify the token by getting user info
  await getUser(token);

  // Store the API key in .anyflow/env.json
  updateEnvVar('ANYFLOW_API_KEY', token);
  console.log('Token stored in .anyflow/env.json');  
}

// Retrieve the stored token
export const getToken = memoize(async function (): Promise<string | null> {
  // First check if it's in the .anyflow/env.json file
  const envToken = getEnvVar('ANYFLOW_API_KEY');

  if (envToken) {
    return envToken;
  }

  return null;
});

export async function isAuthenticated(): Promise<boolean> {
  return (await getToken()) !== null;
}

export const getUserId = memoize(async function (): Promise<number> {
  const user = await getUser();
  return user.id;
});

export async function requireAuthentication(): Promise<void> {
  if (!(await isAuthenticated())) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    process.exit(1);
  }
}