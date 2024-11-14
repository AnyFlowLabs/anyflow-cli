import { getToken } from "../auth/store-token/store";
import { updateChainDeploymentStatus } from './deploy';

export async function fix() {
  const fs = require('fs');
  console.log("Fixing failed deployments...");
  const path = `anyflow_failed_deployments.txt`;

  // let token = await getToken();
  let token = "8|yX1PHaxWFf17kSS3sl0JADOcCp7hxEuevbWwpMYw0b671c60"

  const failedDeployments: {chainId: number, status: string}[] = [];

  // Read the failed deployments file
  fs.readFileSync(path, 'utf8', async (err: any, data: string) => {
    console.log("............................................");

    if (err) {
      console.error(`Failed to read file ${path}:`, err);
      return;
    }

    const lines = data.split('\n').filter(line => line.trim() !== '');

    console.log(`Found ${lines} failed deployments`);

    for (const line of lines) {
      const match = line.match(/Chain ID: (\d+), Status: (.+)/);
      if (match) {
        const chainId = parseInt(match[1], 10);
        const status = match[2];

        failedDeployments.push({chainId, status});
      }
    }

    console.log(`Found ${failedDeployments.length} failed deployments`);
  });

  for (const deployment of failedDeployments) {
    await updateChainDeploymentStatus(deployment.chainId, deployment.status, token);
  }
}
