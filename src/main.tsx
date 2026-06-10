import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

import { SolanaWalletConnectors } from '@dynamic-labs/solana';

const dynamicEnvId = 
  import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID || 
  import.meta.env.VITE_DYNAMIC_ENV_ID || 
  '';

if (!dynamicEnvId) {
  console.error('Dynamic Environment ID is missing! Please set VITE_DYNAMIC_ENVIRONMENT_ID in your .env file.');
}

import { blockchainService } from './services/blockchainService';

// Expose for dev debugging
(window as any).blockchainService = blockchainService;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {dynamicEnvId ? (
      <DynamicContextProvider
        settings={{
          environmentId: dynamicEnvId,
          walletConnectors: [SolanaWalletConnectors],
        }}
      >
        <App />
      </DynamicContextProvider>
    ) : (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center', 
        fontFamily: 'sans-serif',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100vh'
      }}>
        <h1 style={{ color: '#e11d48' }}>Configuration Error</h1>
        <p>Missing <strong>VITE_DYNAMIC_ENVIRONMENT_ID</strong>.</p>
        <p>Please check your <code>.env</code> file and restart the server.</p>
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f1f5f9', 
          borderRadius: '8px',
          textAlign: 'left',
          fontSize: '14px'
        }}>
          <p><strong>Required Environment Variables:</strong></p>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li><code>VITE_DYNAMIC_ENVIRONMENT_ID=your-id-here</code></li>
            <li><code>VITE_SOLANA_RPC_URL_DEVNET=...</code> (optional)</li>
          </ul>
        </div>
      </div>
    )}
  </StrictMode>
);
