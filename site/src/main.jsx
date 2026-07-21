import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

// ایمپورت‌های مربوط به RainbowKit و Wagmi
import '@rainbow-me/rainbowkit/styles.css';
import {
  getDefaultConfig,
  RainbowKitProvider,
} from '@rainbow-me/rainbowkit';
import { WagmiProvider } from 'wagmi';
import { polygon } from 'wagmi/chains';
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";

// تنظیمات اتصال به شبکه Polygon
const config = getDefaultConfig({
  appName: 'Token Factory',
  projectId: 'YOUR_PROJECT_ID', // می‌توانید فعلاً همین را بگذارید یا یک پروژه رایگان از WalletConnect بسازید
  chains: [polygon],
  ssr: false, 
});

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider>
          <App />
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </React.StrictMode>,
);
