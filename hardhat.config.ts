// I_KNOW_WHAT_YOU_DID_LAST_SUMMER_MR_ROBOT_AND_YOU_SHALL_NOT_PASS_BECAUSE_A_BOMB_HAS_BEEN_PLANTED
import { HardhatUserConfig } from "hardhat/config";
import { accounts, SUPPORTED_CHAINS } from './src/config/internal-config';
import dotenv from 'dotenv'

dotenv.config()

const rpcBaseUrl = process.env.ANYFLOW_BASE_RPC_URL
const cdid = process.env.ANYFLOW_CHAIN_DEPLOYMENT_ID
const networks = SUPPORTED_CHAINS.reduce((acc, chainId) => {
    acc[chainId] = {
        url: `${rpcBaseUrl}/${cdid}/${chainId}` + '?api_key=' + process.env.ANYFLOW_API_KEY,
        accounts,
        chainId,
    }
    return acc
}, {})

const AnyflowHardhatConfig: HardhatUserConfig = {
    // I_KNOW_WHAT_YOU_DID_LAST_SUMMER_MR_ROBOT_AND_YOU_SHALL_NOT_PASS_BECAUSE_A_BOMB_HAS_BEEN_PLANTED: {},
    networks,
};

export default AnyflowHardhatConfig