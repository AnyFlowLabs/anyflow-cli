import dotenv from 'dotenv';
dotenv.config();

export const SUPPORTED_CHAINS = [11155111, 80002, 43113, 97, 421614, 4002, 84532, 11155420, 1313161555, 300, 338, 51, 50, 10200]

// Define valid environment types
type Environment = 'development' | 'staging' | 'production';

// Default to production values, can be overridden by environment variables
const DEFAULT_CONFIG = {
  BACKEND_URL: 'https://api.anyflow.pro',
  RPC_BASE_URL: 'https://rpc.anyflow.pro',
} as const;

// Get environment with fallback to 'production'
const ENV = (process.env.NODE_ENV || 'production') as Environment;

// Environment-specific configurations
const ENV_CONFIG = {
  development: {
    BACKEND_URL: 'http://localhost/api',
    RPC_BASE_URL: 'http://nest:3000',
  },
  staging: {
    BACKEND_URL: 'https://api.staging.anyflow.pro',
    RPC_BASE_URL: 'https://rpc.staging.anyflow.pro',
  },
  production: DEFAULT_CONFIG,
} as const;

// Type guard to ensure ENV is a valid environment
function isValidEnvironment(env: string): env is Environment {
  return ['development', 'staging', 'production'].includes(env);
}

// Validate environment
if (!isValidEnvironment(ENV)) {
  throw new Error(`Invalid environment: ${ENV}`);
}

// Export configured values with environment variable overrides
export const RPC_BASE_URL = process.env.ANYFLOW_BASE_RPC_URL || ENV_CONFIG[ENV].RPC_BASE_URL;
export const BACKEND_URL = process.env.ANYFLOW_BACKEND_URL || ENV_CONFIG[ENV].BACKEND_URL;
export let CHAIN_DEPLOYMENT_ID = process.env.ANYFLOW_CHAIN_DEPLOYMENT_ID;

// Proxy addresses
// Note: we use these addresses only as proxies, so there's no risk of it being public
// for more information visit: https://docs.anyflow.pro/docs/how_it_works

// 0x0C86714619Ee1Ba9C4164cAAC7988d02538A6264
export const PK1 = '0x814639896b438bc5ca3037b8a2e9dd8597790181f13c60406aa61fc411c5d162'
// 0x94731e6F4b9a78e86a88c4823a2924Ab169b070C
export const PK2 = '0xb0ee1ed668db36d54e87a93dd2c9f0c0e66cefc2c1a86a9a9263284711cefcd0'
// 0x039C7FdaFA8be0D9374CB3F294e470e704ce6482
export const PK3 = '0x229e1841ac9806c410106e0d239dded5052d865c4fd7f2dd49df53e880c70030'
// 0x93238d8c29FC88D725d26F435c1053a6E5BC9d3E
export const PK4 = '0x134d91a0dc5e9e88ff08fcc19abdc3e854f1889395c42f79e7ff94b9f36c2653'
// 0xDf91C6a7aFa2cC1B4048739c6Da24446BEE75A16
export const PK5 = '0x83d649c3432625bcff684319404677d2cced7f71763f8e21b162cf04711db8bb'
// 0xE9b4C35CA1B1E47E8488d183486b4fe557eE12EB
export const PK6 = '0xb7ab0b9aca8176300673c5c43c635d90622c89eafd845304b35707e79f993a43'
// 0x41D4163e11cEf83949342C9583c3F0ad9A64930A
export const PK7 = '0x22b0dfea100827ed96e0026cbf30871a5488fea56044e89ebeea454660aad861'
// 0xE7796aE4C33669447d12f01bD09cB2a6f0bfdFfC
export const PK8 = '0xf2554f0416dcd829a7cb4512c96fc325e98831ac33c9c12d00f9a0a225fcb01a'
// 0x14d3c9f15ceF0f8ceA30d1A806c6E3D826796668
export const PK9 = '0xbf6f9db044a1c74f6930ef2361a744a713016aa617568e81fb6e104f30a87e2a'
// 0x8B4Af965a6e96C61B80eFCe28c049e394b37Ee3b
export const PK10 = '0x20dc9c239f6e55b1e96e1c6c073c67889867819f772713bd065f0e5575166b86'