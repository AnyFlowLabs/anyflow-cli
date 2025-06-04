import { isAuthenticationRequired, requireAuthentication } from '../auth/store-token/store';
import { createDeployment } from './deployment';
import { sendFile, zipFile } from './artifacts';
import { runCommand } from './command';
import axios from '../../utils/axios';
import { eventDispatcher } from '../../events/EventDispatcher';
import { DeploymentScriptStartedEvent } from '../../events/DeploymentScriptStartedEvent';
import { DeploymentScriptEndedEvent } from '../../events/DeploymentScriptEndedEvent';
import logger from '../../utils/logger';
import { getEnvVar } from '../../utils/env-manager';
import { EXIT_CODE_GENERIC_ERROR } from '../../utils/exitCodes';
import { isAnyflowSdkSetupCorrectly } from '../install';

export async function deploy(
  network: string[],
  deterministicAddresses: boolean = false,
  deploymentId?: string,
  chainDeploymentId?: string
) {
  if (!network || network.length < 1) {
    logger.error('Please specify a network using --networks');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  // Check for required environment variables
  const baseRpcUrl = getEnvVar('ANYFLOW_BASE_RPC_URL');
  const frontendUrl = getEnvVar('ANYFLOW_FRONTEND_URL');

  if (!baseRpcUrl || !frontendUrl) {
    logger.error('Required environment variables are missing. Please run "anyflow init" first.');
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  // Check if Anyflow SDK is properly installed and configured
  const sdkSetupCorrectly = await isAnyflowSdkSetupCorrectly();
  if (!sdkSetupCorrectly) {
    logger.error("Anyflow SDK is not properly installed or configured. Please run 'anyflow install' to set it up, or ensure your hardhat.config file is correctly modified and anyflow-sdk is in your project's dependencies.");
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  // When the CLI is used inside the Anyflow runner, authentication is handled by the runner
  if (isAuthenticationRequired()) {
    await requireAuthentication();
  }

  // TODO: check if the user is inside a valid project
  // await requireProject();

  let deployment;
  if (deploymentId) {
    logger.info('Using existing deployment...');
    try {
      const response = await axios.get(`api/deployments/${deploymentId}`);
      deployment = response.data;

      const acceptedStatuses = ['pending', 'processing', 'deploying'];
      if (!acceptedStatuses.includes(deployment.status)) {
        logger.error(`Deployment with ID ${deploymentId} is not pending, processing or deploying. Please create a new deployment instead by omitting the --deployment-id flag.`);
        process.exit(EXIT_CODE_GENERIC_ERROR);
      }

    } catch (error) {
      logger.error(`Failed to fetch deployment with ID ${deploymentId}`);
      process.exit(EXIT_CODE_GENERIC_ERROR);
    }
  } else {
    logger.info('Creating deployment...');
    const response = await createDeployment(network, deterministicAddresses);
    deployment = response.data;
    logger.success('Deployment created');
  }

  logger.info(`Access your deployment information at: ${frontendUrl}/deployments/${deployment.id}`);

  // Artifacts are only sent if the deployment is new
  // When inside the runner, the CLI has already access to the artifacts
  if (!deploymentId) {
    logger.info('Preparing artifacts for deployment...');

    const zipFilePath = await zipFile();
    await sendFile(zipFilePath, deployment.id);
  }

  const chainDeployments: { id: number, chain_id: number }[] = extractIds(deployment);
  const successfulChains: number[] = [];
  const failedChains: number[] = [];

  logger.heading('Deploying to chains...');

  for (const chainDeployment of chainDeployments) {
    // Skip if chainDeploymentId is provided and doesn't match current chain deployment
    if (chainDeploymentId && chainDeployment.id.toString() !== chainDeploymentId) {
      continue;
    }

    logger.info(`Starting deployment to chain ID ${chainDeployment.chain_id}...`);

    const command = 'npm';
    const args = ['run', 'deploy', '--', '--network', chainDeployment.chain_id.toString()];
    const fullCommand = `${command} ${args.join(' ')}`;
    logger.info(`Running command: ${fullCommand}`);

    eventDispatcher.dispatchEvent(new DeploymentScriptStartedEvent(chainDeployment.id, fullCommand));

    const start = performance.now();
    const { exitCode, stdout, stderr } = await runCommand(command, args, {
      env: {
        ANYFLOW_CHAIN_DEPLOYMENT_ID: chainDeployment.id.toString(),
        ANYFLOW_BASE_RPC_URL: baseRpcUrl,
      }
    });
    const end = performance.now();
    const executionTime = Math.floor(end - start);

    eventDispatcher.dispatchEvent(new DeploymentScriptEndedEvent(chainDeployment.id, exitCode, stdout, stderr, executionTime));

    if (exitCode != 0) {
      logger.error(`Deployment failed for chain ID ${chainDeployment.id} ❌`);
      failedChains.push(chainDeployment.chain_id);
    } else {
      logger.success(`Deployment completed for chain ID ${chainDeployment.chain_id} 🚀`);
      successfulChains.push(chainDeployment.chain_id);
    }
  }

  // TODO:
  // 1. wait for consolidation step to finish on the backend
  // 2. get deployment details
  //   -> chain info
  //   -> txs
  //   -> contracts deployed and their addresses
  //   -> deployment cost per chain
  //   -> total deployment cost

  // Show failed deployments
  if (successfulChains.length == chainDeployments.length) {
    logger.success('Deployment completed! 🚀');
  } else if (successfulChains.length > 0 && failedChains.length > 0) {
    logger.warn('Deployment completed with errors:');
    logger.info(`Successful chains: ${successfulChains}`);
    logger.error(`Failed chains: ${failedChains.join(', ')}`);
    process.exit(EXIT_CODE_GENERIC_ERROR);
  } else {
    logger.error('Deployment failed!');
    logger.error(`Failed chains: ${failedChains.join(', ')}`);
    process.exit(EXIT_CODE_GENERIC_ERROR);
  }

  logger.info(`Access your deployment information at: ${frontendUrl}/deployments/${deployment.id}`);
}

function extractIds(deployment: any) {
  return deployment.chain_deployments.map((chains: any) => ({ id: chains.id, chain_id: chains.chain_id }));
}

export async function updateChainDeploymentStatus(chainId: number, status: string) {
  const response = await axios.put(`api/chain-deployments/${chainId}/status`, { status });

  if (response.status < 200 || response.status >= 300) {
    logger.error(`Failed to update status for chain ID ${chainId}`);
    await logFailedDeploymentId(chainId, status);
  }
}

async function logFailedDeploymentId(chainId: number, status: string) {
  const fs = require('fs');
  const path = 'anyflow_failed_deployments.txt';

  fs.readFile(path, 'utf8', (err: any, data: string) => {
    if (err) {
      fs.writeFile(path, fileString, (err: any) => {
        if (err) {
          logger.error(`Failed to create file ${path}:`, err instanceof Error ? err : undefined);
        }
      });
      logger.error(`Failed to read file ${path}:`, err instanceof Error ? err : undefined);
      return;
    }

    const lines = data.split('\n');
    let found = false;

    for (let i = 0; i < lines.length; i++) {
      if (lines[i].startsWith(`Chain ID: ${chainId}`)) {
        // Update the status for the existing chainId
        lines[i] = `Chain ID: ${chainId}, Status: ${status}`;
        found = true;
        break;
      }
    }

    if (!found) {
      lines.push(`Chain ID: ${chainId}, Status: ${status}`);
    }

    fs.writeFile(path, lines.join('\n'), (err: any) => {
      if (err) {
        logger.error(`Failed to write to file ${path}:`, err instanceof Error ? err : undefined);
      } else {
        logger.info(`Logged/Updated chain ID: ${chainId} with status: ${status}`);
      }
    });
  });
}

const fileString = `-------------------------------------------
This file is used to register deployments that didn't have their status updated successfully. 
You can run the command "anyflow fix" to fix it 
Or just delete it, but this will create inconsistencies in your account.
-------------------------------------------\n`;