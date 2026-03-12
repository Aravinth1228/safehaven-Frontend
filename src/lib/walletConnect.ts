import { createAppKit, type AppKit } from '@reown/appkit/react';
import { EthersAdapter } from '@reown/appkit-adapter-ethers';
import { sepolia, mainnet } from '@reown/appkit/networks';
import { ethers } from 'ethers';

// Validate Project ID
if (!import.meta.env.VITE_WALLETCONNECT_PROJECT_ID) {
  throw new Error('WalletConnect Project ID missing - check .env file');
}

const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID;
const networks = [sepolia, mainnet];

// AppKit instance - lazy initialization
let _appKit: AppKit | null = null;
let isAppKitInitialized = false;
let initPromise: Promise<AppKit> | null = null;

// Initialize AppKit after DOM is ready
export async function ensureAppKit(): Promise<AppKit> {
  if (_appKit && isAppKitInitialized) {
    return Promise.resolve(_appKit);
  }
  
  if (initPromise) {
    return initPromise;
  }
  
  initPromise = new Promise((resolve, reject) => {
    const init = () => {
      try {
        _appKit = createAppKit({
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
        
        isAppKitInitialized = true;
        
        // Wait for AppKit to fully initialize
        setTimeout(() => {
          resolve(_appKit!);
        }, 300);
      } catch (err) {
        reject(err);
      }
    };
    
    if (typeof document !== 'undefined' && document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', init, { once: true });
    } else {
      // Small delay to ensure DOM is ready
      setTimeout(init, 100);
    }
  });
  
  return initPromise;
}

// Export appKit as a thenable object that auto-initializes
export const appKit = new Proxy({} as any, {
  get: (target, prop) => {
    if (prop === 'ready') {
      return ensureAppKit();
    }
    if (_appKit && prop in _appKit) {
      return (_appKit as any)[prop];
    }
    // Return async wrapper for methods
    return async (...args: any[]) => {
      const instance = await ensureAppKit();
      return (instance as any)[prop](...args);
    };
  },
  then: (resolve: any) => ensureAppKit().then(resolve)
});

// ✅ CACHED PROVIDER - State object for reactive references
const walletState = {
  cachedProvider: null as any,
  cachedAddress: null as string | null,
  isProviderReady: false,
};

// Getter functions to always get fresh values (avoids stale closure issues)
export function getCachedProvider() { return walletState.cachedProvider; }
export function getCachedAddress() { return walletState.cachedAddress; }
export function getIsProviderReady() { return walletState.isProviderReady; }

// For backward compatibility - alias to state object
export { walletState as cachedProvider };

// Subscribe to AppKit account changes and cache provider
// This will be called after AppKit is initialized
export async function setupAccountSubscription() {
  const appKitInstance = await ensureAppKit();

  appKitInstance.subscribeAccount(async (state: any) => {
    console.log('🔔 AppKit account state changed:', state);

    if (state.isConnected && state.address) {
      walletState.cachedAddress = state.address;

      // Wait a moment for AppKit to fully initialize the provider
      setTimeout(async () => {
        try {
          const provider = await appKitInstance.getProvider();
          if (provider) {
            walletState.cachedProvider = provider;
            walletState.isProviderReady = true;
            console.log('✅ Provider cached successfully:', state.address);
          } else {
            console.warn('⚠️ Provider is null after connection');
            walletState.isProviderReady = false;
          }
        } catch (err) {
          console.error('❌ Failed to cache provider:', err);
          walletState.isProviderReady = false;
        }
      }, 1000);
    } else {
      // Disconnected - clear cache
      walletState.cachedProvider = null;
      walletState.cachedAddress = null;
      walletState.isProviderReady = false;
      console.log('🔴 Provider cache cleared (disconnected)');
    }
  });
}

// Initialize subscription when module loads
setupAccountSubscription();

/**
 * Get Provider - with fallback to injected provider (window.ethereum)
 * WalletConnect RPC can fail with 503 on mobile, so we try injected first
 * Uses eth_requestAccounts to trigger MetaMask approval popup
 */
export async function getProvider() {
  // 1. Injected provider first (avoids WalletConnect RPC entirely)
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      // REQUEST accounts (triggers MetaMask approval popup if needed)
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      
      if (accounts && accounts.length > 0) {
        console.log('✅ Using injected window.ethereum as provider:', accounts[0]);
        return window.ethereum;
      }
    } catch (err) {
      console.warn('⚠️ window.ethereum check failed:', err);
    }
  }

  // 2. Cached WalletConnect provider
  if (walletState.cachedProvider && walletState.isProviderReady) {
    console.log('✅ Returning cached WalletConnect provider');
    return walletState.cachedProvider;
  }

  // 3. Fresh from AppKit
  await ensureAppKit();
  try {
    const appKitInstance = await ensureAppKit();
    const provider = await appKitInstance.getProvider();
    if (provider) {
      walletState.cachedProvider = provider;
      walletState.isProviderReady = true;
      return provider;
    }
  } catch (err) {
    console.warn('⚠️ Could not get provider from AppKit:', err);
  }

  throw new Error('Wallet not connected yet. Please connect wallet first.');
}

const REQUIRED_CHAIN_ID = 11155111; // Sepolia

/**
 * Ensure wallet is on Sepolia — switches automatically if not
 */
async function ensureCorrectNetwork(provider: any): Promise<void> {
  try {
    const chainId = await provider.request({ method: 'eth_chainId' }) as string;
    const currentChain = parseInt(chainId, 16);
    console.log('🔗 Current chainId:', currentChain);

    if (currentChain !== REQUIRED_CHAIN_ID) {
      console.log(`⚠️ Wrong network (${currentChain}), switching to Sepolia...`);
      try {
        await provider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0xaa36a7' }], // Sepolia hex
        });
        console.log('✅ Switched to Sepolia');
        // Wait for switch to complete
        await new Promise(r => setTimeout(r, 1000));
      } catch (switchErr: any) {
        // Chain not added yet — add it
        if (switchErr.code === 4902) {
          await provider.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7',
              chainName: 'Sepolia Testnet',
              nativeCurrency: { name: 'ETH', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://rpc.sepolia.org', 'https://sepolia.infura.io/v3/'],
              blockExplorerUrls: ['https://sepolia.etherscan.io'],
            }],
          });
          await new Promise(r => setTimeout(r, 1000));
        } else {
          throw switchErr;
        }
      }
    } else {
      console.log('✅ Already on Sepolia');
    }
  } catch (err: any) {
    // If we can't check network, log but don't block
    console.warn('⚠️ Could not verify network:', err.message);
  }
}

/**
 * Get Signer - with fallback to injected provider (window.ethereum)
 * WalletConnect RPC can fail with 503 on mobile, so we try injected first
 * Uses eth_requestAccounts to trigger MetaMask approval popup
 * Ensures correct network (Sepolia) before creating signer
 */
export async function getSigner() {
  console.log('🔑 getSigner called');
  console.log('  window.ethereum:', !!window?.ethereum);
  console.log('  window.ethereum.isMetaMask:', window?.ethereum?.isMetaMask);
  console.log('  walletState.cachedProvider:', !!walletState.cachedProvider);
  console.log('  walletState.isProviderReady:', walletState.isProviderReady);
  console.log('  walletState.cachedAddress:', walletState.cachedAddress);

  // 1. window.ethereum (MetaMask in-app browser / desktop extension)
  if (typeof window !== 'undefined' && window.ethereum) {
    try {
      console.log('  📍 Trying eth_requestAccounts...');
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      }) as string[];
      console.log('  📋 accounts returned:', accounts);
      
      if (accounts && accounts.length > 0) {
        // ✅ Check and switch network BEFORE creating signer
        console.log('  🔗 Ensuring correct network (Sepolia)...');
        await ensureCorrectNetwork(window.ethereum);
        
        const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
        // Verify network after provider creation
        const network = await browserProvider.getNetwork();
        console.log('  ✅ Network:', network.chainId.toString());
        
        const signer = await browserProvider.getSigner();
        console.log('✅ Signer from window.ethereum:', accounts[0]);
        return signer;
      } else {
        console.warn('  ⚠️ eth_requestAccounts returned empty array');
      }
    } catch (err: any) {
      console.warn('  ❌ window.ethereum failed, code:', err.code, 'message:', err.message);
      
      if (err.code === 4001) {
        throw new Error('You rejected the wallet connection. Please approve to continue.');
      }
      
      // If it's a network error, try switching and retry once
      if (err.code === 'NETWORK_ERROR' || err.message?.includes('network changed') || err.message?.includes('changed')) {
        console.warn('  ⚠️ Network changed during signer creation, retrying...');
        try {
          await ensureCorrectNetwork(window.ethereum);
          await new Promise(r => setTimeout(r, 500));
          const browserProvider = new ethers.BrowserProvider(window.ethereum as any);
          const signer = await browserProvider.getSigner();
          console.log('  ✅ Retry succeeded');
          return signer;
        } catch (retryErr: any) {
          console.warn('  ❌ Retry also failed:', retryErr.message);
        }
      }
      // Don't throw here, fall through to other methods
    }
  } else {
    console.log('  ℹ️ window.ethereum not available');
  }

  // 2. Cached WalletConnect provider
  if (walletState.cachedProvider && walletState.isProviderReady) {
    try {
      console.log('  📍 Trying cached WalletConnect provider...');
      // Ensure correct network for cached provider too
      await ensureCorrectNetwork(walletState.cachedProvider);
      
      const browserProvider = new ethers.BrowserProvider(walletState.cachedProvider);
      const signer = await browserProvider.getSigner();
      console.log('✅ Signer from cached provider');
      return signer;
    } catch (err: any) {
      console.warn('  ❌ Cached provider failed:', err.message);
    }
  } else {
    console.log('  ℹ️ No cached provider available');
  }

  // 3. Try fresh AppKit provider
  try {
    console.log('  📍 Trying fresh AppKit provider...');
    const appKitInstance = await ensureAppKit();
    const provider = await appKitInstance.getProvider();
    console.log('  📋 AppKit provider:', !!provider);
    
    if (provider) {
      walletState.cachedProvider = provider;
      walletState.isProviderReady = true;
      
      // Ensure correct network for AppKit provider
      await ensureCorrectNetwork(provider);
      
      const browserProvider = new ethers.BrowserProvider(provider);
      const signer = await browserProvider.getSigner();
      console.log('✅ Signer from AppKit provider');
      return signer;
    }
  } catch (err: any) {
    console.warn('  ❌ AppKit provider failed:', err.message);
  }

  console.error('❌ All signer methods failed');
  throw new Error('Failed to access wallet. Please reconnect and try again.');
}

/**
 * Get Connected Address
 */
export async function getConnectedAddress() {
  if (walletState.cachedAddress) return walletState.cachedAddress;

  try {
    await ensureAppKit();
    return _appKit?.getAddress() || null;
  } catch {
    return null;
  }
}

/**
 * Check if connected
 */
export function isConnected(): boolean {
  return walletState.isProviderReady && walletState.cachedAddress !== null;
}

/**
 * Subscribe to connection changes
 */
export function onConnectionChange(
  callback: (connected: boolean, address?: string) => void
) {
  // If AppKit not ready, set up subscription after init
  if (!_appKit) {
    let unsub: (() => void) | null = null;
    ensureAppKit().then(instance => {
      unsub = instance.subscribeAccount((state: any) => {
        callback(state.isConnected, state.address);
      });
    });
    return () => { unsub?.(); };
  }

  return _appKit.subscribeAccount((state: any) => {
    callback(state.isConnected, state.address);
  });
}

/**
 * Disconnect
 */
export async function disconnect() {
  await ensureAppKit();
  await _appKit?.disconnect();
}

/**
 * Open modal
 */
export async function openModal() {
  await ensureAppKit();
  _appKit?.open();
}

/**
 * Close modal
 */
export async function closeModal() {
  await ensureAppKit();
  _appKit?.close();
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
  const address = walletState.cachedAddress || await getConnectedAddress();

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
