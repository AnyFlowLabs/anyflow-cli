import fs from 'fs';
import path from "path"
import axios from "axios"
import { getProjectRoot } from '../../utils/getProjectRoot';
import { BACKEND_URL } from "../../config/internal-config"
import { aliasesToChainId, aliasToChainId, getChainAliases, getChains, isChainAvailable } from './chains';

type Chains = {
  chain_id: number
}

type Deployment = {
  chains: Chains[],
  framework: "hardhat",
  container_image: string,
  is_cli: boolean,
  deterministic_addresses: boolean
}

async function validateDeployment(network: string[]) {
  const chainIds = await aliasesToChainId(network)
  const invalid = network[chainIds.indexOf(null)]

  if (invalid) {
    console.error(`Unsupported network alias given: "${invalid}" remove and try again`)
    const supportedChains = await getChainAliases()
    console.log(`\nSupported chains:\n${supportedChains}\n`)
    process.exit(1)
  }

  // Check if all selected chains are available
  for (const chainId of chainIds) {
    const isAvailable = await isChainAvailable(chainId)

    if (!isAvailable) {
      console.error(`Chain with ID ${chainId} is not available for deployment. Check our docs: https://docs.anyflow.pro/docs/faq#why-is-the-chain-i-want-to-deploy-to-disabled`)
      process.exit(1)
    }
  }


  // Mount chains array
  const chainsArray: Chains[] = chainIds.map((chain_id) => ({ chain_id }))

  return { chainsArray }
}

export async function createDeployment(network: string[], token: string, deterministicAddresses: boolean) {
  const { chainsArray } = await validateDeployment(network)

  const nodeVersion = await getNodeVersion()

  const deployment: Deployment = {
    framework: "hardhat",
    chains: chainsArray,
    container_image: `anyflow-node-${nodeVersion}`,
    is_cli: true,
    deterministic_addresses: deterministicAddresses
  }

  const response = await axios.post(`${BACKEND_URL}/deployments?cli=true`, deployment, {
    headers: {
      'Content-Type': 'application/json',
      "Authorization": `Bearer ${token}`
    }
  }).then(res => {
    return res.data
  }).catch(err => {
    console.log(err)
    console.log("status", err.status)
    console.log("message:", err.message)

    process.exit(1)
  })

  return response
}

async function getNodeVersion() {
  const projectRoute = await getProjectRoot()

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

export async function writeDeploymentId(id: string | number) {
  const rootDir = await getProjectRoot();
  const envPath = path.join(rootDir, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');

  const chainDeploymentIdLine = `ANYFLOW_CHAIN_DEPLOYMENT_ID=${id}`;

  if (!envContent.includes("CHAIN_DEPLOYMENT_ID")) {
    fs.appendFileSync(envPath, `\n${chainDeploymentIdLine}`);
    console.log('Added ANYFLOW_CHAIN_DEPLOYMENT_ID to existing .env file in the project root.');
  } else {
    const updatedEnvContent = envContent.replace(/ANYFLOW_CHAIN_DEPLOYMENT_ID=.*/g, chainDeploymentIdLine);
    fs.writeFileSync(envPath, updatedEnvContent);
    console.log('Overwritten ANYFLOW_CHAIN_DEPLOYMENT_ID in the .env file in the project root.');
  }
}