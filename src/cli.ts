#!/usr/bin/env node

import { Command, CommanderError } from 'commander';

import { init } from './commands/init';
import { authenticate } from './commands/auth/auth';
import { install } from './commands/install';
import { deploy } from './commands/deploy/deploy';
import { checkAuth } from './commands/auth/check-auth';
import { logout } from './commands/logout';
import { fix } from './commands/deploy/fix';
import { listNetworks } from './commands/networks';
import packageJson from '../package.json';
import { eventDispatcher } from './events/EventDispatcher';
import { ProgramStartedEvent } from './events/ProgramStartedEvent';
import { ProgramEndedEvent } from './events/ProgramEndedEvent';
import { initBugsnag } from './utils/bugsnag';
import { performFullVersionCheck } from './utils/version-checker';
import { CliError, ErrorCode } from './errors/CliError';
import logger from './utils/logger';
import { validateEnv } from './utils/env-validator';
import { loadEnvVars, getStoredEnvVars } from './utils/env-manager';
import { globalOptions } from './utils/globalOptions';
import { EXIT_CODE_GENERIC_ERROR, EXIT_CODE_SUCCESS } from './utils/exitCodes';
// import { printHeader } from "./utils/header";

// Load environment variables from .anyflow/env.json first
loadEnvVars();

// Initialize environment variables if not already set
const storedVars = getStoredEnvVars();
const missingEnvs = !storedVars.ANYFLOW_FRONTEND_URL || !storedVars.ANYFLOW_BACKEND_URL || !storedVars.ANYFLOW_BASE_RPC_URL;

if (missingEnvs && process.argv.length > 2 && process.argv[2] !== 'init') {
  logger.info('Environment variables missing. Running initialization...');
  // Initialize environment variables without waiting
  init().catch(error => {
    logger.error('Error initializing environment variables:', error instanceof Error ? error : undefined);
  });
}

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
      .option('--debug', 'Enable debug mode')
      .option('--base-rpc-url <url>', 'Specify a custom base RPC URL')
      .option('--backend-url <url>', 'Specify a custom backend URL')
      .option('--api-key <api-key>', 'Specify a custom API key')
      .description('The CLI for AnyFlow operations. Check https://docs.anyflow.pro/docs/anyflow_cli/ to learn more.')
      .hook('preAction', async (thisCommand, actionCommand) => {
        // Note: global options are only available after the preAction hook

        // Set global options from program options
        globalOptions.setOptions(thisCommand.opts());

        eventDispatcher.dispatchEvent(new ProgramStartedEvent(process.argv.slice(2).join(' ')));

        if (thisCommand.opts().debug) {
          logger.debug('Debug mode enabled');
          logger.debug('Starting CLI with options:', thisCommand.opts());
          logger.debug(`About to call action handler for subcommand: ${actionCommand.name()}`);
          logger.debug('arguments: %O', actionCommand.args);
          logger.debug('options: %o', actionCommand.opts());
        }

        if (!globalOptions.getOption('skipVersionCheck')) {
          await performFullVersionCheck();
        }
      })
      .version(version);

    program
      .command('init')
      .description('Initialize the AnyFlow CLI')
      .action(() => init())
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
      .command('networks')
      .description('List all available networks')
      .action(listNetworks)
      .hook('postAction', exitHandler);

    program
      .command('*', { isDefault: true })
      .action(() => {
        program.help();
      })
      .hook('postAction', exitHandler);

    await program.parseAsync(process.argv);
  } catch (error: unknown) {
    eventDispatcher.dispatchEvent(new ProgramEndedEvent(
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

    process.exit(EXIT_CODE_GENERIC_ERROR);
  }
}

async function exitHandler(_: Command, actionCommand: Command) {
  // Perform any cleanup or final logging here
  const elapsedTime = executionTime();
  eventDispatcher.dispatchEvent(new ProgramEndedEvent(
    0, elapsedTime
  ));
  await eventDispatcher.waitForAllEvents();

  logger.info('Exiting...');
}

main()
  .then(() => {
    process.exit(EXIT_CODE_SUCCESS);
  })
  .catch((error) => {
    logger.error('Exited with error:', error instanceof Error ? error : undefined);
    process.exit(EXIT_CODE_GENERIC_ERROR);
  });