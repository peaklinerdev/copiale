// src/config/index.ts
export const config = {
  apiUrl: import.meta.env.VITE_API_URL,
  dynamicSdkId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || import.meta.env.VITE_DYNAMIC_ENV_ID,
  arbitratorAddress: import.meta.env.VITE_ARBITRATOR_ADDRESS,
  gasPayerPubkey: import.meta.env.VITE_SOLANA_GAS_PAYER_PUBKEY || '',
  relayThresholdSol: Number(import.meta.env.VITE_SOLANA_RELAY_THRESHOLD_SOL || 0.01),

  // Network configurations
  networks: {
    testnet: {
      chainId: 44787,
      rpcUrl: import.meta.env.VITE_CELO_RPC_URL_TESTNET,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS_TESTNET,
      usdcAddress: import.meta.env.VITE_USDC_ADDRESS_TESTNET,
      blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL_TESTNET,
    },
    mainnet: {
      chainId: 42220,
      rpcUrl: import.meta.env.VITE_CELO_RPC_URL,
      contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
      usdcAddress: import.meta.env.VITE_USDC_ADDRESS,
      blockExplorerUrl: import.meta.env.VITE_BLOCK_EXPLORER_URL,
    },
    solanaDevnet: {
      networkName: 'solana-devnet',
      rpcUrl: import.meta.env.VITE_SOLANA_RPC_URL_DEVNET || 'https://api.devnet.solana.com',
      programId: import.meta.env.VITE_SOLANA_PROGRAM_ID_DEVNET,
      usdcMint: import.meta.env.VITE_SOLANA_USDC_MINT_DEVNET,
      usdtMint: import.meta.env.VITE_SOLANA_USDT_MINT_DEVNET || 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
      blockExplorerUrl: 'https://explorer.solana.com/?cluster=devnet',
    },
  },

  // Legacy properties for backward compatibility
  celoRpcUrl: import.meta.env.VITE_CELO_RPC_URL,
  contractAddress: import.meta.env.VITE_CONTRACT_ADDRESS,
  usdcAddressAlfajores: import.meta.env.VITE_USDC_ADDRESS_TESTNET,
  blockExplorerUrl:
    import.meta.env.VITE_BLOCK_EXPLORER_URL || 'https://celo-alfajores.blockscout.com',
};

// Helper function to get network config based on chain ID or network name
export const getNetworkConfig = (chainId: number) => {
  if (chainId === 3) {
    return config.networks.solanaDevnet;
  } else if (chainId === 42220) {
    return config.networks.mainnet;
  } else if (chainId === 44787) {
    return config.networks.testnet;
  } else {
    // Default to Solana devnet for unknown networks
    return config.networks.solanaDevnet;
  }
};

// Helper function to get network config by network name
export const getNetworkConfigByName = (networkName: string) => {
  switch (networkName) {
    case 'solana-devnet':
      return config.networks.solanaDevnet;
    case 'celo-mainnet':
      return config.networks.mainnet;
    case 'celo-alfajores':
      return config.networks.testnet;
    default:
      return config.networks.solanaDevnet; // Default to Solana devnet
  }
};

// Helper function to get Solana devnet config
export const getSolanaDevnetConfig = () => {
  return config.networks.solanaDevnet;
};
