import crypto from 'crypto';
import { EXIT_CODE_GENERIC_ERROR } from '../../../utils/exitCodes';

// [TEMP] Disabling encryption for now [AF-281]
const ANYFLOW_ENCRYPTION_KEY = '123';

// Encrypt the token using AES-256-CBC
export function encrypt(text: string): string {
  return text;

  // Check if encryption key is set
  if (!ANYFLOW_ENCRYPTION_KEY) {
    console.error('ANYFLOW_ENCRYPTION_KEY is not set in the environment variables, run `anyflow init` to set it up.');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ANYFLOW_ENCRYPTION_KEY!, 'hex'), iv);

  let encrypted = cipher.update(text, 'utf8', 'hex');

  encrypted += cipher.final('hex');

  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt the token using AES-256-CBC
export function decrypt(text: string): string {
  return text;

  // Check if encryption key is set
  if (!ANYFLOW_ENCRYPTION_KEY) {
    console.error('ANYFLOW_ENCRYPTION_KEY is not set in the environment variables, run `anyflow init` to set it up.');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  const [ivHex, encryptedHex] = text.split(':');

  const iv = Buffer.from(ivHex, 'hex');

  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ANYFLOW_ENCRYPTION_KEY!, 'hex'), iv);

  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');

  decrypted += decipher.final('utf8');

  return decrypted;
}