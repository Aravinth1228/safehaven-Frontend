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
  // Wait for AppKit to be ready
  let attempts = 0;
  const maxAttempts = 40;

  while (attempts < maxAttempts) {
    try {
      // Try getting provider from AppKit
      const provider = await appKit.getProvider();
      if (provider) {
        console.log('✅ Got provider from AppKit (attempt ' + attempts + ')');
        return provider;
      }
    } catch (err) {
      console.warn('⚠️ getProvider() attempt ' + attempts + ' failed:', err);
    }

    // Check connection state - use ADDRESS instead of isConnected (mobile bug)
    const address = appKit.getAddress();
    
    if (address) {
      console.log('🔍 WalletConnect connected:', address, '- waiting for provider...');
    }

    attempts++;
    if (attempts <= 15 || attempts % 10 === 0) {
      console.log(`⏳ Waiting for WalletConnect provider... (${attempts}/${maxAttempts}) Address: ${address || 'none'}`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  // Final check - get full AppKit state
  const address = appKit.getAddress();
  const state = appKit.getState();
  console.log('🔍 Final AppKit state:', state, 'Address:', address);

  // If we have an address but no provider from AppKit, try fallbacks
  if (address) {
    // Try 1: Get provider one more time
    try {
      const provider = await appKit.getProvider();
      if (provider) {
        console.log('✅ Got provider on final attempt');
        return provider;
      }
    } catch (err) {
      console.warn('⚠️ Final getProvider() attempt failed:', err);
    }

    // Try 2: Check walletInfo from AppKit's internal state
    const walletInfo = (state as any).walletInfo;
    if (walletInfo?.provider) {
      console.log('✅ Got provider from walletInfo');
      return walletInfo.provider;
    }

    // Try 3: Use window.ethereum if available (MetaMask mobile browser)
    if (typeof window !== 'undefined' && (window as any).ethereum) {
      console.log('✅ Using window.ethereum as fallback provider');
      return (window as any).ethereum;
    }
  }

  throw new Error('Provider not available from AppKit after multiple attempts. Please try reconnecting.');
}

export async function getSigner() {
  try {
    const provider = await getProvider();
    if (!provider) throw new Error('Provider not available');
    const browserProvider = new ethers.BrowserProvider(provider as any);
    const signer = await browserProvider.getSigner();
    console.log('✅ Got signer from provider');
    return signer;
  } catch (err) {
    console.error('❌ Could not get signer:', err);
    throw err;
  }
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
  // Try to get provider from AppKit first
  let provider: any = null;
  
  try {
    provider = await appKit.getProvider();
  } catch (err) {
    console.warn('⚠️ Could not get provider from AppKit, using window.ethereum fallback');
  }

  // If AppKit provider not available, use window.ethereum (MetaMask mobile browser)
  if (!provider && window.ethereum) {
    provider = window.ethereum;
  }

  if (!provider) {
    throw new Error('No provider available. Please connect wallet first.');
  }

  // Get user address
  const address = appKit.getAddress() || await getConnectedAddress();

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