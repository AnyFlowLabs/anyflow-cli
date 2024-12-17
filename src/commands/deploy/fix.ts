import { getToken } from '../auth/store-token/store';
import { updateChainDeploymentStatus } from './deploy';

export async function fix() {
  const fs = require('fs');
  console.log('Fixing failed deployments...');
  const path = 'anyflow_failed_deployments.txt';

  const token = await getToken();

  const failedDeployments: { chainId: number, status: string }[] = [];

  // Read the failed deployments file synchronously
  try {
    const data = fs.readFileSync(path, 'utf8');
    const lines = data.split('\n')
      .filter((line: string) => line.trim() !== '' && line.match(/Chain ID: (\d+), Status: (.+)/))
      .map((line: string) => {
        const match = line.match(/Chain ID: (\d+), Status: (.+)/)!;
        return {
          chainId: parseInt(match[1], 10),
          status: match[2]
        };
      });

    console.log(`Found ${lines.length} failed status update${lines.length === 1 ? '' : 's'}`);

    failedDeployments.push(...lines);
  } catch (err) {
    console.error(`Failed to read file ${path}:`, err);
    return;
  }

  for (const deployment of failedDeployments) {
    try {
      await updateChainDeploymentStatus(deployment.chainId, deployment.status);
      const data = fs.readFileSync(path, 'utf8');
      const updatedData = data.split('\n')
        .filter((line: string) => !line.includes(`Chain ID: ${deployment.chainId}, Status: ${deployment.status}`))
        .join('\n');
      fs.writeFileSync(path, updatedData, 'utf8');
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || err;
      if (errorMessage.includes('Transition') && errorMessage.includes('cannot be applied on state')) {
        const data = fs.readFileSync(path, 'utf8');
        const updatedData = data.split('\n')
          .filter((line: string) => !line.includes(`Chain ID: ${deployment.chainId}, Status: ${deployment.status}`))
          .join('\n');
        fs.writeFileSync(path, updatedData, 'utf8');
        console.error(`Status already applied for chain ID ${deployment.chainId}`);
      } else {
        console.error('Failed to update chain deployment status:', {
          error: err.response?.data || err.message || err
        });
        console.error(`Failed to update deployment for chain ID ${deployment.chainId}`);
      }
    }
  }
}
