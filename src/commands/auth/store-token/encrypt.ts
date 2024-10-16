import crypto from 'crypto';
import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY;

// Encrypt the token using AES-256-CBC
export function encrypt(text: string): string {
  // Check if encryption key is set
  if (!ENCRYPTION_KEY) {
    console.error("ENCRYPTION_KEY is not set in the environment variables, run `anyflow init` to set it up.");
    process.exit(1);
  }

  const iv = crypto.randomBytes(16);
  
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!, 'hex'), iv);
  
  let encrypted = cipher.update(text, 'utf8', 'hex');
  
  encrypted += cipher.final('hex');
  
  return iv.toString('hex') + ':' + encrypted;
}
  
// Decrypt the token using AES-256-CBC
export function decrypt(text: string): string {
  // Check if encryption key is set
  if (!ENCRYPTION_KEY) {
    console.error("ENCRYPTION_KEY is not set in the environment variables, run `anyflow init` to set it up.");
    process.exit(1);
  }

  const [ivHex, encryptedHex] = text.split(':');
  
  const iv = Buffer.from(ivHex, 'hex');
  
  const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY!, 'hex'), iv);
  
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8');
  
  decrypted += decipher.final('utf8');
  
  return decrypted;
}