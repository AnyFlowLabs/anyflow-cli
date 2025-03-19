#!/usr/bin/env node

import { Command, CommanderError } from 'commander';

import { init } from './commands/init';
import { authenticate } from './commands/auth/auth';
import { install } from './commands/install';
import { deploy } from './commands/deploy/deploy';
import { checkAuth } from './commands/auth/check-auth';
import { logout } from './commands/logout';
import { fix } from './commands/deploy/fix';
import packageJson from '../package.json';
import { EventDispatcher } from './events/EventDispatcher';
import { ProgramStartedEvent } from './events/ProgramStartedEvent';
import { ProgramEndedEvent } from './events/ProgramEndedEvent';
import { initBugsnag } from './utils/bugsnag';
import { performFullVersionCheck } from './utils/version-checker';
import { CliError, ErrorCode } from './errors/CliError';
import logger from './utils/logger';
import { validateEnv } from './utils/env-validator';
// import { printHeader } from "./utils/header";

// Initialize error tracking
initBugsnag();

// Validate required environment variables
try {
  validateEnv([
    {
      name: 'NODE_ENV',
      required: false,
      defaultValue: 'development',
      validator: (val) => ['development', 'staging', 'production'].includes(val),
      errorMessage: 'Must be one of development, staging, or production'
    }
  ]);
} catch (error) {
  // Log and continue - this isn't critical for the CLI to run
  logger.warn('Environment validation failed. Some features may not work correctly.');
}

const start = performance.now();
function executionTime() {
  return Math.floor(performance.now() - start);
}

async function main() {
  try {
    const version = packageJson.version;
    logger.heading(`AnyFlow CLI v${version}`);

    const program = new Command();

    program
      .name('anyflow')
      .option('--skip-events', 'Skip sending telemetry events')
      .option('--skip-version-check', 'Skip version check')
      .description('The CLI for AnyFlow operations. Check https://docs.anyflow.pro/docs/anyflow_cli/ to learn more.')
      .version(version);

    const options = program.opts();

    // Set the skip-events flag in EventDispatcher
    EventDispatcher.getInstance().setSkipEvents(!!options.skipEvents);

    EventDispatcher.getInstance().dispatchEvent(new ProgramStartedEvent(process.argv.slice(2).join(' ')));

    if (!options.skipVersionCheck) {
      await performFullVersionCheck();
    }

    program
      .command('init')
      .description('Initialize the AnyFlow CLI')
      .action(init)
      .hook('postAction', exitHandler);

    program
      .command('auth')
      .description('Authenticate to the AnyFlow service')
      .action(authenticate)
      .hook('postAction', exitHandler);

    program
      .command('install')
      .description('Perform local file manipulation for setup')
      .action(install)
      .hook('postAction', exitHandler);

    program
      .command('deploy')
      .description('Deploy the project by calling authenticated backend routes')
      .option('--networks <network...>', 'Specify the network(s) to deploy to')
      .option('-da, --deterministic-addresses', 'Use deterministic addresses for deployment')
      .option('--deployment-id <deployment-id>', 'Specify the deployment ID (when it already exists)')
      .option('--chain-deployment-id <chain-deployment-id>', 'Specify the chain deployment ID (when it already exists)')
      .action((options) => {
        const da = options.deterministicAddresses || options.da || false;
        logger.info('Deterministic addresses option: ' + da);
        return deploy(
          options.networks,
          da,
          options.deploymentId,
          options.chainDeploymentId
        );
      })
      .hook('postAction', exitHandler);

    program
      .command('check-auth')
      .description('Check authentication status')
      .action(checkAuth)
      .hook('postAction', exitHandler);

    program
      .command('logout')
      .description('Clear user credentials')
      .action(logout)
      .hook('postAction', exitHandler);

    program
      .command('fix')
      .description('Fix failed deployments')
      .action(fix)
      .hook('postAction', exitHandler);

    program
      .command('*', { isDefault: true })
      .action(() => {
        program.help();
      })
      .hook('postAction', exitHandler);

    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    EventDispatcher.getInstance().dispatchEvent(new ProgramEndedEvent(
      1, executionTime()
    ));

    if (error instanceof CliError) {
      logger.error(error.getFormattedMessage());
    } else if (error instanceof CommanderError) {
      // Handle commander errors gracefully
      logger.error(`Commander error: ${error.message}`);
    } else {
      logger.error('Unhandled error:', error instanceof Error ? error : undefined);
      // Report unhandled errors to Bugsnag
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      const cliError = new CliError(
        errorMessage,
        ErrorCode.UNEXPECTED_ERROR,
        { originalError: error }
      );
    }

    process.exit(1);
  }
}

async function exitHandler(_: Command, actionCommand: Command) {
  // Perform any cleanup or final logging here
  const elapsedTime = executionTime();
  EventDispatcher.getInstance().dispatchEvent(new ProgramEndedEvent(
    0, elapsedTime
  ));
  await EventDispatcher.getInstance().waitForAllEvents();

  logger.info('Exiting...');
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    logger.error('Exited with error:', error instanceof Error ? error : undefined);
    process.exit(1);
  });