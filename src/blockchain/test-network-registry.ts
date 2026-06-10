/**
 * Test script for Network Registry functionality
 * Run with: npm run dev (in browser console) or create a test component
 */

import { networkRegistry, NetworkType } from './index.js';


// Test 1: Check if networks are registered

// Test 2: Get enabled networks
const enabledNetworks = networkRegistry.getEnabled();
enabledNetworks.forEach(network => {
});

// Test 3: Get networks by type
const solanaNetworks = networkRegistry.getByType(NetworkType.SOLANA);
solanaNetworks.forEach(network => {
});

const evmNetworks = networkRegistry.getByType(NetworkType.EVM);
evmNetworks.forEach(network => {
});

// Test 4: Get default network
try {
  const defaultNetwork = networkRegistry.getDefault();
} catch (error) {
  console.error(`\n❌ Error getting default network: ${error}`);
}

// Test 5: Test network lookup
const testNetworkId = 'solana-devnet';
if (networkRegistry.has(testNetworkId)) {
  const network = networkRegistry.get(testNetworkId);
} else {
}


// Export for use in browser console
export { networkRegistry, NetworkType };
