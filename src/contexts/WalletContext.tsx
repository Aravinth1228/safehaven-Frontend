import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { toast } from 'sonner';
import {
  getSigner,
  getProvider,
  getConnectedAddress,
  isConnected as isWalletConnectConnected,
  onConnectionChange,
  disconnect as walletConnectDisconnect,
  openModal,
  ensureAppKit,
  getCachedProvider,
  getIsProviderReady,
} from '../lib/walletConnect';
import {
  isMobile as checkIsMobile,
  isMetaMaskInstalled as checkIsMetaMaskInstalled,
  connectMetaMask,
} from '../lib/metamaskMobile';

interface WalletContextType {
  walletAddress: string | null;
  isConnected: boolean;
  isMetaMaskInstalled: boolean;
  connectWallet: () => Promise<void>;
  disconnectWallet: () => void;
  isConnecting: boolean;
  signer: ethers.Signer | null;
  provider: ethers.BrowserProvider | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) throw new Error('useWallet must be used within a WalletProvider');
  return context;
};

declare global {
  interface Window {
    ethereum?: {
      isMetaMask?: boolean;
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
    };
  }
}

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    // Check MetaMask installed
    setIsMetaMaskInstalled(checkIsMetaMaskInstalled());

    // Check if already connected via AppKit (using cached values)
    // Use async approach to ensure AppKit is initialized
    const checkAppKitConnection = async () => {
      try {
        await ensureAppKit();
        const existingAddress = await getConnectedAddress();
        console.log('🔍 Checking existing connection:', existingAddress, 'Provider ready:', getIsProviderReady());

        if (existingAddress && getIsProviderReady() && getCachedProvider()) {
          console.log('✅ Restoring AppKit session with cached provider:', existingAddress);
          setWalletAddress(existingAddress);
          try {
            const browserProvider = new ethers.BrowserProvider(getCachedProvider());
            browserProvider.getSigner().then(setSigner).catch(console.error);
            setProvider(browserProvider);
          } catch (err) {
            console.error('Could not restore signer:', err);
          }
        }
      } catch (err) {
        console.warn('⚠️ AppKit not initialized yet:', err);
      }
    };

    checkAppKitConnection();

    // Restore MetaMask extension session (desktop only)
    if (!checkIsMobile() && checkIsMetaMaskInstalled()) {
      window.ethereum
        ?.request({ method: 'eth_accounts' })
        .then((accounts) => {
          const accs = accounts as string[];
          if (accs.length > 0) {
            console.log('✅ Restored MetaMask extension session:', accs[0]);
            setWalletAddress(accs[0]);
            const prov = new ethers.BrowserProvider(window.ethereum!);
            prov.getSigner().then(setSigner).catch(console.error);
            setProvider(prov);
          }
        })
        .catch(console.error);
    }

    // Subscribe to AppKit connection changes
    const unsubscribe = onConnectionChange(async (connected, address) => {
      console.log('🔔 AppKit state changed:', connected, address);
      if (connected && address) {
        setWalletAddress(address);

        // Wait for provider to be cached by the global subscription
        setTimeout(async () => {
          if (getIsProviderReady() && getCachedProvider()) {
            try {
              const browserProvider = new ethers.BrowserProvider(getCachedProvider());
              const signer = await browserProvider.getSigner();
              setSigner(signer);
              setProvider(browserProvider);
              console.log('✅ Got signer and provider from cache');
            } catch (err) {
              console.error('Could not get signer from cached provider:', err);
            }
          } else {
            console.warn('⚠️ Provider not ready after connection, waiting...');
            // Wait a bit more and try again
            setTimeout(async () => {
              if (getIsProviderReady() && getCachedProvider()) {
                try {
                  const browserProvider = new ethers.BrowserProvider(getCachedProvider());
                  const signer = await browserProvider.getSigner();
                  setSigner(signer);
                  setProvider(browserProvider);
                } catch (err) {
                  console.error('Could not get signer:', err);
                }
              }
            }, 2000);
          }
        }, 1500); // Wait 1.5s for provider caching
      } else {
        console.log('🔴 Wallet disconnected');
        setWalletAddress(null);
        setSigner(null);
        setProvider(null);
      }
    });

    // Listen for MetaMask extension account changes (desktop)
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        console.log('🔄 MetaMask account changed:', accs[0]);
        setWalletAddress(accs[0]);
      } else {
        console.log('🔴 MetaMask disconnected');
        setWalletAddress(null);
        setSigner(null);
        setProvider(null);
      }
    };
    window.ethereum?.on('accountsChanged', handleAccountsChanged);

    return () => {
      unsubscribe();
      window.ethereum?.removeListener('accountsChanged', handleAccountsChanged);
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      console.log('🔗 Connecting wallet...');

      // ✅ If window.ethereum is available (MetaMask in-app browser / desktop extension)
      // Skip AppKit modal entirely — connect directly
      if (typeof window !== 'undefined' && window.ethereum) {
        console.log('📍 Using injected window.ethereum directly');
        try {
          const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
          }) as string[];
          
          if (accounts && accounts.length > 0) {
            const prov = new ethers.BrowserProvider(window.ethereum as any);
            const signerInstance = await prov.getSigner();
            setWalletAddress(accounts[0]);
            setSigner(signerInstance);
            setProvider(prov);
            console.log('✅ Connected via window.ethereum:', accounts[0]);
            return; // Done — no need for AppKit
          }
        } catch (err: any) {
          if (err.code === 4001) {
            throw new Error('You rejected the wallet connection. Please approve to continue.');
          }
          console.warn('⚠️ window.ethereum failed, falling back to AppKit:', err);
        }
      }

      // Fallback: Open AppKit modal for WalletConnect
      console.log('📍 Opening AppKit modal...');
      await openModal();

      // Wait for connection (address appears)
      let attempts = 0;
      const maxAttempts = 60; // 30 seconds

      while (attempts < maxAttempts) {
        await new Promise(resolve => setTimeout(resolve, 500));
        const address = await getConnectedAddress();

        if (attempts < 10 || attempts % 10 === 0) {
          console.log(`🔍 Waiting for connection... (${attempts + 1}/${maxAttempts}) Address: ${address}`);
        }

        if (address) {
          console.log('✅ Wallet connected:', address);
          // Wait for provider to be cached
          await new Promise(resolve => setTimeout(resolve, 2000));
          break;
        }
        attempts++;
      }

      // Final check
      const finalAddress = await getConnectedAddress();
      if (!finalAddress) {
        console.warn('⚠️ Connection timed out');
        toast.error('Connection Timeout', {
          description: 'Please try connecting your wallet again',
        });
      } else {
        // Check if provider was cached
        if (getIsProviderReady() && getCachedProvider()) {
          console.log('✅ Provider ready from cache');
          try {
            const browserProvider = new ethers.BrowserProvider(getCachedProvider());
            const signer = await browserProvider.getSigner();
            setSigner(signer);
            setProvider(browserProvider);
            console.log('✅ Got signer and provider');
          } catch (err) {
            console.error('Could not get signer:', err);
          }
        } else {
          console.warn('⚠️ Provider not ready yet, waiting...');
          // Wait a bit more for provider caching
          setTimeout(async () => {
            if (getIsProviderReady() && getCachedProvider()) {
              try {
                const browserProvider = new ethers.BrowserProvider(getCachedProvider());
                const signer = await browserProvider.getSigner();
                setSigner(signer);
                setProvider(browserProvider);
              } catch (err) {
                console.error('Could not get signer:', err);
              }
            }
          }, 2000);
        }
      }
    } catch (error) {
      console.error('Failed to connect wallet:', error);
      toast.error('Connection Failed', {
        description: error instanceof Error ? error.message : 'Failed to connect wallet',
      });
      throw error;
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    console.log('🔴 Disconnecting wallet...');
    try {
      await walletConnectDisconnect();
    } catch {
      console.log('WalletConnect disconnect skipped');
    }
    setWalletAddress(null);
    setSigner(null);
    setProvider(null);
  };

  return (
    <WalletContext.Provider
      value={{
        walletAddress,
        isConnected: !!walletAddress,
        isMetaMaskInstalled,
        connectWallet,
        disconnectWallet,
        isConnecting,
        signer,
        provider,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
};