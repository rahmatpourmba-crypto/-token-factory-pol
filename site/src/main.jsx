import './index.css';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { createConfig, http, WagmiProvider } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { LanguageProvider } from './i18n.jsx';
import App from './App.jsx';

const config = createConfig({
  chains: [polygon],
  connectors: [injected({ shimDisconnect: false })],
  transports: { [polygon.id]: http() },
});
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <LanguageProvider>
          <App />
        </LanguageProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
