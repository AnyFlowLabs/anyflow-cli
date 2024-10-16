#!/usr/bin/env node

import figlet from 'figlet';
import { Command } from "commander";
import { init } from "./commands/init.js";
import { authenticate } from "./commands/auth/auth.js";
import { install } from "./commands/install.js";
import { deploy } from "./commands/deploy.js";
import { checkAuth } from "./commands/auth/check-auth.js";

async function main() {
  console.log("Starting AnyFlow CLI...");

  const program = new Command();

  console.log(figlet.textSync("Anyflow CLI"));
try {
  program
    .name("anyflow")
    .description("CLI for AnyFlow operations, command init to initialize the project")
    .version("1.0.0");

  program
    .command("init")
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

  await program.parseAsync(process.argv);
} catch (error) {
  console.error(error);
}
  process.exit(0);
}

main().catch(console.error);
