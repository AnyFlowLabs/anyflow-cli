#!/usr/bin/env node

import { Command } from "commander";
import { authenticate } from "./commands/auth";
import { install } from "./commands/install";
import { deploy } from "./commands/deploy";
import figlet from "figlet";

console.log(figlet.textSync("Anyflow CLI"));

const program = new Command();

program
  .name("anyflow")
  .description("CLI for AnyFlow operations")
  .version("1.0.0");

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

program.parse(process.argv);
