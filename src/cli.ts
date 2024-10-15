#!/usr/bin/env node

import fs from 'fs/promises';
import path from 'path';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Command } from "commander";
import { authenticate, checkAuth } from "./commands/auth.js";
import { install } from "./commands/install.js";
import { deploy } from "./commands/deploy.js";
import figlet from 'figlet';

async function ensureEnvFile() {
  const envPath = path.resolve(process.cwd(), '.env');
  try {
    await fs.access(envPath);
  } catch {
    const key = crypto.randomBytes(32).toString('hex');
    await fs.writeFile(envPath, `ENCRYPTION_KEY=${key}`);
    console.log('Created new .env file with encryption key.');
  }
}

async function init() {
  await ensureEnvFile();
  console.log("Initialized .env file with encryption key.");
}

async function main() {
  console.log("Starting AnyFlow CLI...");
  
  await ensureEnvFile();

  dotenv.config({ path: path.resolve(process.cwd(), '.env') });

  if (!process.env.ENCRYPTION_KEY) {
    console.error("ENCRYPTION_KEY is not set in the environment variables.");
    process.exit(1);
  }

  const program = new Command();

  console.log(figlet.textSync("Anyflow CLI"));

  program
    .name("anyflow")
    .description("CLI for AnyFlow operations")
    .version("1.0.0");

  program
    .name("anyflow")
    .description("Initialize the AnyFlow CLI")
    .action(init);

  program
    .command("auth")
    .description("Authenticate to the AnyFlow service")
    .action(authenticate);

  program
    .command("install")
    .description("Perform local file manipulation for setup")
    .action(install);

  program
    .command("deploy")
    .description("Deploy the project by calling authenticated backend routes")
    .action(deploy);

  program
    .command("check-auth")
    .description("Check authentication status")
    .action(checkAuth);

  program.parse(process.argv);
}

main().catch(console.error);
