import { createAppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Validate Project ID
if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  throw new Error('WalletConnect Project ID missing - check .env file');
}

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;

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
    swaps: false,
    onramp: false,
  },
  enableWallets: true,
  showWallets: true,
  defaultNetwork: sepolia,
});

// ✅ CACHED PROVIDER - State-driven architecture
let cachedProvider: any = null;
let cachedAddress: string | null = null;
let isProviderReady = false;

// Export for use in WalletContext
export { cachedProvider, cachedAddress, isProviderReady };

// Subscribe to AppKit account changes and cache provider
appKit.subscribeAccount(async (state) => {
  console.log('🔔 AppKit account state changed:', state);
  
  if (state.isConnected && state.address) {
    cachedAddress = state.address;
    
    // Wait a moment for AppKit to fully initialize the provider
    setTimeout(async () => {
      try {
        const provider = await appKit.getProvider();
        if (provider) {
          cachedProvider = provider;
          isProviderReady = true;
          console.log('✅ Provider cached successfully:', state.address);
        } else {
          console.warn('⚠️ Provider is null after connection');
          isProviderReady = false;
        }
      } catch (err) {
        console.error('❌ Failed to cache provider:', err);
        isProviderReady = false;
      }
    }, 1000); // Wait 1 second for provider initialization
  } else {
    // Disconnected - clear cache
    cachedProvider = null;
    cachedAddress = null;
    isProviderReady = false;
    console.log('🔴 Provider cache cleared (disconnected)');
  }
});

/**
 * Get Provider - NO POLLING, state-driven
 */
export async function getProvider() {
  if (!cachedProvider || !isProviderReady) {
    console.warn('⚠️ Provider not ready. Cached:', !!cachedProvider, 'Ready:', isProviderReady);
    throw new Error('Wallet not connected yet. Please connect wallet first.');
  }
  
  console.log('✅ Returning cached provider');
  return cachedProvider;
}

/**
 * Get Signer
 */
export async function getSigner() {
  const provider = await getProvider();
  const browserProvider = new ethers.BrowserProvider(provider);
  return await browserProvider.getSigner();
}

/**
 * Get Connected Address
 */
export async function getConnectedAddress() {
  return cachedAddress || appKit.getAddress();
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return isProviderReady && cachedAddress !== null;
}

/**
 * Subscribe to connection changes
 */
export function onConnectionChange(
  callback: (connected: boolean, address?: string) => void
) {
  return appKit.subscribeAccount((state) => {
    callback(state.isConnected, state.address);
  });
}

/**
 * Disconnect
 */
export async function disconnect() {
  await appKit.disconnect();
}

/**
 * Open modal
 */
export function openModal() {
  appKit.open();
}

/**
 * Close modal
 */
export function closeModal() {
  appKit.close();
}

/**
 * Sign typed data
 */
export async function signTypedData(
  domain: ethers.TypedDataDomain,
  types: Record<string, Array<ethers.TypedDataField>>,
  value: Record<string, any>
): Promise<string> {
  const provider = await getProvider();
  const address = cachedAddress || await getConnectedAddress();

  if (!address) {
    throw new Error('No address connected');
  }

  const hashedTypedData = ethers.TypedDataEncoder.hash(domain, types, value);

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
