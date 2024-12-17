import { requireAuthentication } from '../auth/store-token/store';
import { writeChainDeploymentId , createDeployment } from './deployment';
import { sendFile, zipFile } from './artifacts';
import { runCommand } from './command';
import axios from '../../utils/axios';
import { EventDispatcher } from '../../events/EventDispatcher';
import { DeploymentScriptStartedEvent } from '../../events/DeploymentScriptStartedEvent';
import { DeploymentScriptEndedEvent } from '../../events/DeploymentScriptEndedEvent';

export async function deploy(network: string[], deterministicAddresses: boolean = false) {
  if (!network || network.length < 1) {
    console.error('Please specify a network using --networks');
    process.exit(1);
  }

  await requireAuthentication();

  // TODO: check if the user is inside a valid project
  // await requireProject();

  console.log();
  console.log('Creating deployment...');

  const deployment = await createDeployment(network, deterministicAddresses);

  console.log('Deployment created');
  console.log('Access your deployment information at: ' + `${process.env.ANYFLOW_FRONTEND_URL}/deployments/${deployment.data.id}`);
  console.log('');
  console.log('Preparing artifacts for deployment...');

  const zipFilePath = await zipFile();
  await sendFile(zipFilePath, deployment.data.id);

  const chainDeployments: { id: number, chain_id: number }[] = extractIds(deployment);
  const successfulChains: number[] = [];
  const failedChains: number[] = [];

  console.log('Deploying to chains...');
  console.log('');

  for (const chainDeployment of chainDeployments) {
    console.log(`Starting deployment to chain ID ${chainDeployment.chain_id}...`);
    await writeChainDeploymentId(chainDeployment.id);

    // await updateChainDeploymentStatus(chain.id, 'deploying');
    const command = 'npm';
    const args = ['run', 'deploy', '--', '--network', chainDeployment.chain_id.toString()];
    const fullCommand = `${command} ${args.join(' ')}`;
    console.log(`Running command: ${fullCommand}`);

    EventDispatcher.getInstance().dispatchEvent(new DeploymentScriptStartedEvent(chainDeployment.id, fullCommand));

    const start = performance.now();
    const { exitCode, stdout, stderr } = await runCommand(command, args);
    const end = performance.now();
    const executionTime = Math.floor(end - start);

    // await updateChainDeploymentStatus(chain.id, 'finished');
    EventDispatcher.getInstance().dispatchEvent(new DeploymentScriptEndedEvent(chainDeployment.id, exitCode, stdout, stderr, executionTime));

    if (exitCode != 0) {
      console.error(`Deployment failed for chain ID ${chainDeployment.id} ❌`);
      failedChains.push(chainDeployment.chain_id);
    } else {
      console.log(`Deployment completed for chain ID ${chainDeployment.chain_id} 🚀`);
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
    console.log('Deployment completed! 🚀');
  } else if (successfulChains.length > 0 && failedChains.length > 0) {
    console.error('Deployment completed with errors:');
    console.error(`Successful chains: ${successfulChains}`);
    console.error(`Failed chains: ${failedChains.join(', ')}`);
  } else {
    console.error('Deployment failed!');
    console.error(`Failed chains: ${failedChains.join(', ')}`);
  }
  console.log('');
  console.log('Access your deployment information at: ' + `${process.env.ANYFLOW_FRONTEND_URL}/deployments/${deployment.data.id}`);
  console.log('');
}

function extractIds(deployment: any) {
  return deployment.data.chain_deployments.map((chains: any) => ({ id: chains.id, chain_id: chains.chain_id }));
}

export async function updateChainDeploymentStatus(chainId: number, status: string) {
  const response = await axios.put(`api/chain-deployments/${chainId}/status`, { status });

  if (response.status < 200 || response.status >= 300) {
    console.error(`Failed to update status for chain ID ${chainId}:`,);
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
          console.error(`Failed to create file ${path}:`, err);
        }
      });
      console.error(`Failed to read file ${path}:`, err);
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
        console.error(`Failed to write to file ${path}:`, err);
      } else {
        console.log(`Logged/Updated chain ID: ${chainId} with status: ${status}`);
      }
    });
  });
}

const fileString = `-------------------------------------------
This file is used to register deployments that didn't have their status updated successfully. 
You can run the command "anyflow fix" to fix it 
Or just delete it, but this will create inconsistencies in your account.
-------------------------------------------\n`;