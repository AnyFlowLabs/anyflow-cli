import dotenv from 'dotenv';
import readline from 'readline/promises';
import { storeToken } from './store-token/store';

// Load environment variables from .env file
dotenv.config();

// Constants for the application
const FRONTEND_URL = "https://app-staging.anyflow.pro";

// Main authentication function
export async function authenticate() {
  const tokenUrl = `${FRONTEND_URL}/dev`;

  console.log("Opening your browser to authenticate...");
  console.log("URL:", tokenUrl);

  // Using dynamic imports because of conflicts
  const open = (await import('open')).default;

  // Attempt to open the authentication URL in the default browser
  try {
    await open(tokenUrl);
    console.log("Browser opened successfully.");
  } catch (err) {
    console.error(`Error opening URL, please open ${tokenUrl} and get the token from the browser.`);
  }

  // Set up readline interface for user input
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    // Prompt user for API token
    const token = await rl.question("Please paste your API token here: ");

    if (token && token.trim()) {
      await storeToken(token.trim());
    } else {
      console.log("Invalid token. Please provide a non-empty token.");
      process.exit(1);
    }
  } catch (error: any) {
    console.error("Error storing token");
    process.exit(1);
  } finally {
    rl.close();
  }
}