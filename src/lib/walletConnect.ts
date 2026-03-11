import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Get project ID from https://cloud.reown.com
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || 'YOUR_PROJECT_ID_HERE';

const networks = [sepolia, mainnet];

// Initialize AppKit with mobile support
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
    swaps: false,
    onramp: false,
  },
  enableWallets: true,
  showWallets: true,
  defaultNetwork: sepolia,
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

/**
 * Sign typed data using AppKit provider (works on mobile!)
 * This is the KEY function for mobile signature support
 */
export async function signTypedData(
  domain: ethers.TypedDataDomain,
  types: Record<string, Array<ethers.TypedDataField>>,
  value: Record<string, any>
): Promise<string> {
  // Get provider from AppKit
  const provider = await getProvider();
  
  if (!provider) {
    throw new Error('No provider available from AppKit');
  }
  
  // Get user address
  const address = await getConnectedAddress();
  
  if (!address) {
    throw new Error('No address connected');
  }
  
  // Use ethers to hash the typed data
  const hashedTypedData = ethers.TypedDataEncoder.hash(domain, types, value);
  
  // Request signature from provider (this triggers MetaMask on mobile!)
  const signature = await provider.request({
    method: 'eth_signTypedData_v4',
    params: [address, JSON.stringify({
      domain,
      types,
      primaryType: Object.keys(types)[0],
      message: value
    })]
  });
  
  return signature as string;
}

export {
  isMobile,
  isMetaMaskInstalled,
  openMetaMask,
  connectMetaMask,
  generateMetaMaskLink,
  getConnectionMethod,
} from './metamaskMobile';