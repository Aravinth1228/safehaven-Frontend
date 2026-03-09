import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Get project ID from environment or use default (for testing)
// IMPORTANT: Get your own from https://cloud.reown.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '8e28c9e8e8e8e8e8e8e8e8e8e8e8e8e8';

// Define networks
const networks = [sepolia, mainnet];

// Create AppKit instance
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
  features: {
    email: false,
    socials: false,
  }
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
