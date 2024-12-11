#!/usr/bin/env node

import { Command } from "commander";
import { init } from "./commands/init";
import { authenticate } from "./commands/auth/auth";
import { install } from "./commands/install";
import { deploy } from "./commands/deploy/deploy";
import { checkAuth } from "./commands/auth/check-auth";
import { logout } from './commands/logout';
import { fix } from './commands/deploy/fix';
import packageJson from '../package.json';
// import { printHeader } from "./utils/header";

async function main() {
  const version = packageJson.version;
  console.log(`Starting AnyFlow CLI v${version}...`);

  const program = new Command();

  // printHeader();

  try {
    program
      .name("anyflow")
      .description("The CLI for AnyFlow operations. Check https://docs.anyflow.pro/docs/anyflow_cli/ to learn more.")
      .version(version);

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
      .option("--networks <network...>", "Specify the network(s) to deploy to")
      .option("--deterministic-addresses", "Use deterministic addresses for deployment")
      .option("-da", "Use deterministic addresses for deployment")
      .action((options) => {
        console.log("Parsed networks:", options.networks);
        const da = options.deterministicAddresses || options.da || false;
        console.log("Deterministic addresses option:", da);
        return deploy(options.networks, da);
      });

    program
      .command("check-auth")
      .description("Check authentication status")
      .action(checkAuth);

    program
      .command("logout")
      .description("Clear user credencials")
      .action(logout)

    program
      .command("fix")
      .description("Fix failed deployments")
      .action(fix)

    await program.parseAsync(process.argv);
  } catch (error) {
    console.error(error);
  }

  process.exit(0);
}

main().catch(console.error);
