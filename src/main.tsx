import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

import { DynamicContextProvider } from '@dynamic-labs/sdk-react-core';

import { SolanaWalletConnectors } from '@dynamic-labs/solana';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <DynamicContextProvider
      settings={{
        environmentId: import.meta.env.VITE_DYNAMIC_ENVIRONMENT_ID,
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);
