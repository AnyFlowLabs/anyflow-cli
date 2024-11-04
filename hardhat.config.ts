// I_KNOW_WHAT_YOU_DID_LAST_SUMMER_MR_ROBOT_AND_YOU_SHALL_NOT_PASS_BECAUSE_A_BOMB_HAS_BEEN_PLANTED
import { HardhatUserConfig } from "hardhat/config";
import { PK1, PK2, PK3, PK4, PK5, PK6, PK7, PK8, PK9, PK10, RPC_BASE_URL, CHAIN_DEPLOYMENT_ID } from './src/config/internal-config';

const accounts = [PK1, PK2, PK3, PK4, PK5, PK6, PK7, PK8, PK9, PK10]

const AnyflowHardhatConfig: HardhatUserConfig = {
    // I_KNOW_WHAT_YOU_DID_LAST_SUMMER_MR_ROBOT_AND_YOU_SHALL_NOT_PASS_BECAUSE_A_BOMB_HAS_BEEN_PLANTED: {},
    networks: {
        // Sepolia
        11155111: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/11155111`,
            accounts,
            chainId: 11155111,
        },
        // Polygon Amoy
        80002: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/80002`,
            accounts,
            chainId: 80002,
        },
        // Avalanche Fuji
        43113: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/43113`,
            accounts,
            chainId: 43113,
        },
        // Bsc Testnet
        97: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/97`,
            accounts,
            chainId: 97,
        },
        // Arbitrum sepolia
        421614: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/421614`,
            accounts,
            chainId: 421614,
        },
        // Fantom Testnet
        4002: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/4002`,
            accounts,
            chainId: 4002,
        },
        // Base Sepolia
        84532: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/84532`,
            accounts,
            chainId: 84532,
        },
        // OPT Sepolia
        11155420: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/11155420`,
            accounts,
            chainId: 11155420,
        },
        // Gnosis Chiado
        10200: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/10200`,
            accounts,
            chainId: 10200,
        },
        // Aurora Testnet
        1313161555: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/1313161555`,
            accounts,
            chainId: 1313161555,
        },
        // ZkSync Sepolia
        300: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/300`,
            accounts,
            chainId: 300,
        },
        // Cronos Testnet
        338: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/338`,
            accounts,
            chainId: 338,
        },
        // XDC Testnet
        51: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/51`,
            accounts,
            chainId: 51,
        },
        // XDC Mainnet
        50: {
            url: `http://${RPC_BASE_URL}/rpc-proxy/${CHAIN_DEPLOYMENT_ID}/50`,
            accounts,
            chainId: 50,
        },
    },
};

export default AnyflowHardhatConfig