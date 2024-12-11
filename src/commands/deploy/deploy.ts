import { requireAuthentication } from "../auth/store-token/store";
import { writeChainDeploymentId } from "./deployment";
import { sendFile, zipFile } from "./artifacts";
import { createDeployment } from "./deployment";
import { runCommand } from "./command";
import axios from "../../utils/axios";

export async function deploy(network: string[], deterministicAddresses: boolean = false) {
  if (!network || network.length < 1) {
    console.error("Please specify a network using --networks");
    process.exit(1);
  }

  await requireAuthentication();

  // TODO: check if the user is inside a valid project
  // await requireProject();

  console.log();
  console.log("Creating deployment...");

  const deployment = await createDeployment(network, deterministicAddresses);

  console.log("Deployment created");

  console.log("Preparing artifacts for deployment...");

  const zipFilePath = await zipFile();
  await sendFile(zipFilePath, deployment.data.id);

  console.log("Artifacts sent");

  const chain_data: { id: number, chain_id: number }[] = extractIds(deployment);
  const failedChains: number[] = [];

  console.log("Deploying chains...");

  for (const chain of chain_data) {
    console.log(`Deploying chain ID ${chain.chain_id}...`);
    await writeChainDeploymentId(chain.id);

    await updateChainDeploymentStatus(chain.id, 'deploying');

    try {
      await runCommand(network);

      await updateChainDeploymentStatus(chain.id, 'finished');
    } catch (error) {
      await updateChainDeploymentStatus(chain.id, 'failed');
      console.error(`Deployment failed for chain ID ${chain.id}:`);

      failedChains.push(chain.chain_id);
    }
  }

  if (failedChains.length > 0) {
    console.error("Failed chains, try again later:", failedChains);
  } else {
    console.log("Deployment dispatched");
  }
}

function extractIds(deployment: any) {
  return deployment.data.chain_deployments.map((chains: any) => ({ id: chains.id, chain_id: chains.chain_id }));
}

export async function updateChainDeploymentStatus(chainId: number, status: string) {
  const response = await axios.put(`api/chain-deployments/${chainId}/status`, { status })

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
-------------------------------------------\n`