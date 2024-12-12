#!/usr/bin/env node

import { Command, CommanderError } from "commander";
import { init } from "./commands/init";
import { authenticate } from "./commands/auth/auth";
import { install } from "./commands/install";
import { deploy } from "./commands/deploy/deploy";
import { checkAuth } from "./commands/auth/check-auth";
import { logout } from './commands/logout';
import { fix } from './commands/deploy/fix';
import packageJson from '../package.json';
import { EventDispatcher } from "./events/EventDispatcher";
import { ProgramStartedEvent } from "./events/ProgramStartedEvent";
import { ProgramEndedEvent } from "./events/ProgramEndedEvent";
// import { printHeader } from "./utils/header";

const start = performance.now();
function executionTime() {
  return Math.floor(performance.now() - start)
}

async function main() {
  try {
    const version = packageJson.version;
    console.log(`Starting AnyFlow CLI v${version}...`);
    EventDispatcher.getInstance().dispatchEvent(new ProgramStartedEvent(process.argv.slice(2).join(" ")));

    // Check connection with the backend
    // await checkConnection();

    const program = new Command();

    // printHeader();

    program
      .name("anyflow")
      .description("The CLI for AnyFlow operations. Check https://docs.anyflow.pro/docs/anyflow_cli/ to learn more.")
      .version(version);

    program
      .command("init")
      .description("Initialize the AnyFlow CLI")
      .action(init)
      .hook('postAction', exitHandler)

    program
      .command("auth")
      .description("Authenticate to the AnyFlow service")
      .action(authenticate)
      .hook('postAction', exitHandler)

    program
      .command("install")
      .description("Perform local file manipulation for setup")
      .action(install)
      .hook('postAction', exitHandler)

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
      })
      .hook('postAction', exitHandler)

    program
      .command("check-auth")
      .description("Check authentication status")
      .action(checkAuth)
      .hook('postAction', exitHandler)

    program
      .command("logout")
      .description("Clear user credencials")
      .action(logout)
      .hook('postAction', exitHandler)

    program
      .command("fix")
      .description("Fix failed deployments")
      .action(fix)
      .hook('postAction', exitHandler)

    program
      .command("*", { isDefault: true })
      .action(() => {
        program.help();
      })
      .hook('postAction', exitHandler)

    await program.parseAsync(process.argv);
  } catch (error) {
    EventDispatcher.getInstance().dispatchEvent(new ProgramEndedEvent(
      0, executionTime()
    ));

    console.error("Unhandled error:", error);
  }
}

async function exitHandler(_: Command, actionCommand: Command) {
  // Perform any cleanup or final logging here
  EventDispatcher.getInstance().dispatchEvent(new ProgramEndedEvent(
    0, executionTime()
  ));
  await EventDispatcher.getInstance().waitForAllEvents();

  console.log("Exiting...");
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Exited with error:", error);
  });