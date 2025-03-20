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
        environmentId: '20c1c15c-2ea4-4917-bb3c-2abd455c71ee', // Your env ID
        walletConnectors: [SolanaWalletConnectors],
      }}
    >
      <App />
    </DynamicContextProvider>
  </StrictMode>
);