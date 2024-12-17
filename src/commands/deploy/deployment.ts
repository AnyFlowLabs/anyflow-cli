import fs from 'fs';
import path from 'path';

import { getProjectRoot } from '../../utils/getProjectRoot';
import { aliasesToChainId, getChainAliases, isChainAvailable } from './chains';
import axios from '../../utils/axios';

type Chains = {
  chain_id: number
}

type Deployment = {
  chains: Chains[],
  framework: 'hardhat',
  container_image: string,
  is_cli: boolean,
  deterministic_addresses: boolean
}

async function validateDeployment(network: string[]) {
  const chainIds = await aliasesToChainId(network);
  const invalid = network[chainIds.indexOf(null)];

  if (invalid) {
    console.error(`Unsupported network alias given: "${invalid}" remove and try again`);
    const supportedChains = await getChainAliases();
    console.log(`\nSupported chains:\n${supportedChains}\n`);
    process.exit(1);
  }

  // Check if all selected chains are available
  for (const chainId of chainIds) {
    const isAvailable = await isChainAvailable(chainId);

    if (!isAvailable) {
      console.error(`Chain with ID ${chainId} is not available for deployment. Check our docs: https://docs.anyflow.pro/docs/faq#why-is-the-chain-i-want-to-deploy-to-disabled`);
      process.exit(1);
    }
  }


  // Mount chains array
  const chainsArray: Chains[] = chainIds.map((chain_id) => ({ chain_id }));

  return { chainsArray };
}

export async function createDeployment(network: string[], deterministicAddresses: boolean) {
  const { chainsArray } = await validateDeployment(network);

  const nodeVersion = await getNodeVersion();

  const deployment: Deployment = {
    framework: 'hardhat',
    chains: chainsArray,
    container_image: `anyflow-node-${nodeVersion}`,
    is_cli: true,
    deterministic_addresses: deterministicAddresses
  };

  const response = await axios.post('api/deployments?cli=true', deployment)
    .then(res => {
      return res.data;
    });

  return response;
}

async function getNodeVersion() {
  const projectRoute = await getProjectRoot();

  const packageJsonPath = path.join(projectRoute, 'package.json');
  const packageJson = fs.readFileSync(packageJsonPath, 'utf-8');
  const { engines } = JSON.parse(packageJson);

  const defaultVersion = '20';
  const allowedVersions = ['16', '18', '20'];

  if (!engines || !engines.node) {
    return defaultVersion;
  }

  const versionMatch = engines.node.match(/(\d+)(?:\.\d+)?/);
  const extractedVersion = versionMatch ? versionMatch[1] : defaultVersion;

  return allowedVersions.includes(extractedVersion) ? extractedVersion : defaultVersion;
}

export async function writeChainDeploymentId(id: string | number) {
  const rootDir = await getProjectRoot();
  const envPath = path.join(rootDir, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');

  const chainDeploymentIdLine = `ANYFLOW_CHAIN_DEPLOYMENT_ID=${id}`;

  if (!envContent.includes('ANYFLOW_CHAIN_DEPLOYMENT_ID')) {
    fs.appendFileSync(envPath, `\n${chainDeploymentIdLine}`);
    console.log(`Added ANYFLOW_CHAIN_DEPLOYMENT_ID=${id} to existing .env file in the project root.`);
  } else {
    const updatedEnvContent = envContent.replace(/ANYFLOW_CHAIN_DEPLOYMENT_ID=.*/g, chainDeploymentIdLine);
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log(`Overwritten ANYFLOW_CHAIN_DEPLOYMENT_ID=${id} in the .env file in the project root.`);
  }
}