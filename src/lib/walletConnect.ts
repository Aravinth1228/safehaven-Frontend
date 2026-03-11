import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Get project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';

const networks = [sepolia, mainnet];

// Initialize AppKit
export const appKit = createAppKit({
  adapters: [new EthersAdapter()],
  networks,
  projectId,
  metadata: {
    name: 'SafeHaven',
    description: 'Emergency Response System with Blockchain',
    url: 'https://safehaven-eta.vercel.app',
    icons: ['https://avatars.githubusercontent.com/u/3778488'],
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-accent': '#FF0066',
    '--w3m-border-radius-master': '12px',
    '--w3m-font-size-master': '14px',
  },
  features: {
    email: false,
    socials: false,
    analytics: true,
    allWallets: true,
  },
  enableWallets: true,
  includeWalletIds: [
    'c57ca95b47569778a828d19178114f4db188b89b763c899ba0be274e97267d96', // MetaMask
    '4622a2b2d6af1c9844944291e5e7351a6aa24cd7b23099efac1b2fd875da31a0', // Trust Wallet
    '1ae92b26df02f0abca6304df07debccd18262fdf5fe82daa81593582dac9a369', // Rainbow
  ],
});

export async function getProvider() {
  return await appKit.getProvider();
}

export async function getSigner() {
  const provider = await getProvider();
  if (!provider) throw new Error('Provider not available');
  const browserProvider = new ethers.BrowserProvider(provider as any);
  return await browserProvider.getSigner();
}

export async function getConnectedAddress() {
  return appKit.getAddress();
}

export function isConnected(): boolean {
  return appKit.getState().isConnected;
}

export function onConnectionChange(
  callback: (connected: boolean, address?: string) => void
) {
  return appKit.subscribeAccount((state) => {
    callback(state.isConnected, state.address);
  });
}

export async function disconnect() {
  await appKit.disconnect();
}

export function openModal() {
  appKit.open();
}

export function closeModal() {
  appKit.close();
}

export {
  isMobile,
  isMetaMaskInstalled,
  openMetaMask,
  connectMetaMask,
  generateMetaMaskLink,
  getConnectionMethod,
} from './metamaskMobile';