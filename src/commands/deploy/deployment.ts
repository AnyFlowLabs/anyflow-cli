import fs from 'fs';
import path from "path"
import axios from "axios"
import { getProjectRoot } from '../../utils/getProjectRoot';
import { BACKEND_URL } from "../../config/internal-config"
import { getChains } from './chains';

type Chains = {
    chain_id: number
}
  
type Deployment ={
  chains: Chains[],
  framework: "hardhat",
  container_image: string,
  is_cli: boolean
}

export async function createDeployment(network: string[], token: string) {
    const chainsArray: Chains[] = []
  
    const chains = await getChains();

    network.forEach((net) => {
      if(!chains.includes(Number(net))){
        console.error(`Unsupported chain given: ${net} remove and try again`)
        console.log(`Supported chains: ${chains}`)
        process.exit(1)
      }
  
      chainsArray.push({
        chain_id: Number(net)
      })
    })

    const nodeVersion = await getNodeVersion()
    
    const deployment: Deployment = {
      framework: "hardhat",
      chains: chainsArray,
      container_image: `anyflow-node-${nodeVersion}`,
      is_cli: true
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