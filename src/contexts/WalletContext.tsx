import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import {
  getSigner,
  getProvider,
  isConnected as isWalletConnectConnected,
  onConnectionChange,
  disconnect as walletConnectDisconnect,
  openModal,
  appKit,
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

    // Restore session — check if already connected via AppKit
    const existingAddress = appKit.getAddress();
    console.log('🔍 Checking existing connection:', existingAddress);
    
    if (existingAddress && isWalletConnectConnected()) {
      console.log('✅ Restoring AppKit session:', existingAddress);
      setWalletAddress(existingAddress);
      getSigner().then(setSigner).catch(console.error);
      getProvider().then((prov) => {
        if (prov) setProvider(new ethers.BrowserProvider(prov as any));
      }).catch(console.error);
    }

    // Restore MetaMask extension session (desktop only)
    if (!checkIsMobile() && checkIsMetaMaskInstalled() && !existingAddress) {
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

    // Subscribe to AppKit connection changes (handles mobile + WalletConnect)
    const unsubscribe = onConnectionChange(async (connected, address) => {
      console.log('🔔 AppKit state changed:', connected, address);
      if (connected && address) {
        setWalletAddress(address);
        try {
          const s = await getSigner();
          setSigner(s);
          console.log('✅ Got signer:', s);
        } catch (err) {
          console.error('Could not get signer:', err);
        }
        try {
          const prov = await getProvider();
          if (prov) {
            setProvider(new ethers.BrowserProvider(prov as any));
            console.log('✅ Got provider');
          }
        } catch (err) {
          console.error('Could not get provider:', err);
        }
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
      console.log('🔗 Connecting wallet... Mobile:', checkIsMobile(), 'MetaMask:', checkIsMetaMaskInstalled());
      
      // Use AppKit for ALL connections (mobile + desktop)
      // AppKit automatically handles:
      // - Mobile: MetaMask app + WalletConnect
      // - Desktop: MetaMask extension + WalletConnect
      openModal();
      
      // Wait for connection and log the result
      setTimeout(() => {
        const address = appKit.getAddress();
        console.log('📍 Connection attempt - Address:', address);
        if (address) {
          console.log('✅ Wallet connected successfully:', address);
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
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