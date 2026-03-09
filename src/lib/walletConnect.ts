import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Get project ID from environment or use default (for testing)
// IMPORTANT: Get your own from https://cloud.reown.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8e28c9e8e8e8e8e8e8e8e8e8e8e8e8e8';

// Define networks with proper chain configuration
const networks = [
  {
    ...sepolia,
    rpcUrls: {
      default: {
        http: ['https://sepolia.infura.io/v3/']
      }
    }
  },
  mainnet
];

// Create AppKit instance with mobile-optimized settings
export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  metadata: {
    name: 'SafeHaven',
    description: 'Emergency Response System with Blockchain',
    url: 'https://safehaven-eta.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/3778488']
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#3b82f6',
    '--w3m-color-mix': '#3b82f6',
  },
  // Enable all connection methods for mobile
  features: {
    email: false,
    socials: false,
    analytics: true,
    allWallets: true,
  },
  // Mobile-specific configuration
  enableWallets: true,
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ],
});

// Helper to get provider and signer
export async function getProvider() {
  const provider = await appKit.getProvider();
  return provider;
}

export async function getSigner() {
  const provider = await getProvider();
  if (!provider) {
    throw new Error('Provider not available');
  }
  const browserProvider = new ethers.BrowserProvider(provider);
  return await browserProvider.getSigner();
}

// Get connected address
export async function getConnectedAddress() {
  const address = appKit.getAddress();
  return address;
}

// Check if connected
export function isConnected() {
  return appKit.getState().isConnected;
}

// Subscribe to connection changes
export function onConnectionChange(callback: (connected: boolean, address?: string) => void) {
  return appKit.subscribeAccount((state) => {
    callback(state.isConnected, state.address);
  });
}

// Disconnect
export async function disconnect() {
  await appKit.disconnect();
}

// Open modal
export function openModal() {
  appKit.open();
}

// Close modal
export function closeModal() {
  appKit.close();
}

// Re-export mobile MetaMask utilities for convenience
export {
  isMobile,
  isMetaMaskInstalled,
  openMetaMask,
  connectMetaMask,
  smartConnect,
  generateMetaMaskLink,
  getConnectionMethod
} from './metamaskMobile';
