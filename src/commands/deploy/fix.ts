import { getToken } from '../auth/store-token/store';
import { updateChainDeploymentStatus } from './deploy';
import logger from '../../utils/logger';

export async function fix() {
  const fs = require('fs');
  logger.info('Fixing failed deployments...');
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

    logger.info(`Found ${lines.length} failed status update${lines.length === 1 ? '' : 's'}`);

    failedDeployments.push(...lines);
  } catch (err) {
    logger.error(`Failed to read file ${path}:`, err instanceof Error ? err : undefined);
    return;
  }

  for (const deployment of failedDeployments) {
    try {
      // Skip if chainDeploymentId is provided and doesn't match current chain deployment
      // if (chainDeploymentId && chainDeployment.id.toString() !== chainDeploymentId) {
      //   continue;
      // }

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
        logger.error(`Status already applied for chain ID ${deployment.chainId}`);
      } else {
        logger.error(`Failed to update chain deployment status: ${err.response?.data || err.message || String(err)}`);
        logger.error(`Failed to update deployment for chain ID ${deployment.chainId}`);
      }
    }
  }
}
