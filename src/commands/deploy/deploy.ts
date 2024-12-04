import { getToken } from "../auth/store-token/store";
import { writeDeploymentId } from "./deployment";
import { sendFile, zipFile } from "./artifacts";
import { createDeployment } from "./deployment";
import { runCommand } from "./command";
import axios from "axios";
import { BACKEND_URL, RPC_BASE_URL } from "../../config/internal-config";

export async function deploy(network: string[], deterministicAddresses: boolean = false) {
  if (!network || network.length < 1) {
    console.error("Please specify a network using --networks");
    process.exit(1);
  }

  let token = await getToken();

  if (!token) {
    console.log('You need to authenticate first. Run "anyflow auth".');
    return;
  }

  console.log("Creating deployment...");

  const deployment = await createDeployment(network, token, deterministicAddresses);

  console.log("Deployment created");

  const chain_data: {id: number, chain_id: number}[] = extractIds(deployment);
  const failedChains: number[] = [];

  await Promise.all(
    chain_data.map(async (chain) => {
      await writeDeploymentId(chain.id);
      
      await updateChainDeploymentStatus(chain.id, 'deploying', token);

      try {
        await runCommand(network);
        
        await updateChainDeploymentStatus(chain.id, 'finished', token);
      } catch (error) {
        await updateChainDeploymentStatus(chain.id, 'failed', token);
        console.error(`Deployment failed for chain ID ${chain.id}:`);

        failedChains.push(chain.chain_id);
      }
    })
  ).catch((error) => {
    console.error("Error deploying:", error);
  }).finally(() => {
    console.log("Deployment dispatched");
  });

  console.log("Preparing artifact for deployment...");

  const zipFilePath = await zipFile();

  await sendFile(zipFilePath, deployment.data.id, token);

  if(failedChains.length > 0) {
    console.error("Failed chains, try again later:", failedChains);
  }
}

function extractIds(deployment: any) {
  return deployment.data.chain_deployments.map((chains: any) => ({id: chains.id, chain_id: chains.chain_id}));
}

export async function updateChainDeploymentStatus(chainId: number, status: string, token: string) {
  const response = await axios.put(`${BACKEND_URL}/chain-deployments/${chainId}/status`, 
    {
      status: status
    },
    {
      headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`
    },
  }).catch((error) => {
    throw error;
  });

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