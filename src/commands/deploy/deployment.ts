import fs from 'fs';
import path from "path"
import axios from "axios"
import { getProjectRoot } from '../../utils/getProjectRoot';
import { BACKEND_URL, SUPPORTED_CHAINS } from "../../config/internal-config"

type Chains = {
    chain_id: number
}
  
type Deployment ={
  chains: Chains[],
  framework: "hardhat",
  container_image: "anyflow-node-20"
}

export async function createDeployment(network: string[], token: string) {
    const chainsArray: Chains[] = []
  
    network.forEach((net) => {
      if(!SUPPORTED_CHAINS.includes(Number(net))){
        console.error(`Unsupported chain given: ${net} remove and try again`)
        console.log(`Supported chains: ${SUPPORTED_CHAINS}`)
        process.exit(1)
      }
  
      chainsArray.push({
        chain_id: Number(net)
      })
    })
    
    const deployment: Deployment = {
      framework: "hardhat",
      chains: chainsArray,
      container_image: "anyflow-node-20"
    }
  
    const response = await axios.post(`BACKEND_URL/deployments`, deployment, {
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