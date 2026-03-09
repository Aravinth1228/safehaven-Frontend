import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ethers } from 'ethers';
import { 
  getSigner, 
  getProvider, 
  getConnectedAddress, 
  isConnected as isWalletConnectConnected,
  onConnectionChange,
  disconnect as walletConnectDisconnect,
  openModal
} from '../lib/walletConnect';

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
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};

interface WalletProviderProps {
  children: ReactNode;
}

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

/**
 * WalletProvider Component
 * 
 * Hybrid approach:
 * - WalletConnect (Reown AppKit) for mobile & desktop
 * - Direct MetaMask as fallback
 */
export const WalletProvider: React.FC<WalletProviderProps> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    const checkMetaMask = () => {
      const installed = typeof window.ethereum !== 'undefined';
      setIsMetaMaskInstalled(installed);

      if (installed) {
        console.log('✅ MetaMask detected');
      } else {
        console.warn('⚠️ MetaMask not installed - WalletConnect will be used');
      }
    };

    checkMetaMask();

    // Subscribe to WalletConnect connection changes
    const unsubscribe = onConnectionChange((connected, address) => {
      console.log('🔔 WalletConnect connection changed:', connected, address);
      if (connected && address) {
        setWalletAddress(address);
        localStorage.setItem('walletAddress', address);
        
        // Get signer and provider
        getSigner().then(setSigner).catch(console.error);
        getProvider().then(async (prov) => {
          if (prov) {
            const browserProvider = new ethers.BrowserProvider(prov);
            setProvider(browserProvider);
          }
        }).catch(console.error);
      } else {
        setWalletAddress(null);
        setSigner(null);
        setProvider(null);
        localStorage.removeItem('walletAddress');
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      console.log('🔗 Opening WalletConnect modal...');
      
      // Open WalletConnect modal (works on both mobile and desktop)
      openModal();
      
      console.log('📱 WalletConnect modal opened - select MetaMask or any wallet');
      
      // Wait for connection (handled by subscription above)
      // Give it time to connect
      await new Promise((resolve, reject) => {
        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout. Please try again.'));
        }, 120000); // 2 minutes timeout

        const checkConnection = setInterval(() => {
          if (isWalletConnectConnected()) {
            clearInterval(checkConnection);
            clearTimeout(timeout);
            resolve(true);
          }
        }, 500);
      });

      console.log('✅ Wallet connected via WalletConnect');
    } catch (error: any) {
      console.error('❌ WalletConnect connection failed:', error);
      
      // If on mobile and WalletConnect fails, try direct MetaMask
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      
      if (isMobile && window.ethereum?.isMetaMask) {
        console.log('📱 MetaMask detected on mobile, trying direct connection...');
        
        try {
          const accounts = await window.ethereum.request({
            method: 'eth_requestAccounts',
          }) as string[];

          if (accounts.length > 0) {
            const address = accounts[0];
            console.log('✅ Wallet connected via MetaMask:', address);

            setWalletAddress(address);
            localStorage.setItem('walletAddress', address);

            const prov = new ethers.BrowserProvider(window.ethereum);
            const sgnr = await prov.getSigner();
            setSigner(sgnr);
            setProvider(prov);
            
            return; // Success!
          }
        } catch (metaMaskError) {
          console.error('MetaMask direct connection failed:', metaMaskError);
        }
      }
      
      // Show user-friendly error
      throw new Error(
        isMobile 
          ? 'Could not connect to MetaMask. Please make sure MetaMask app is installed and try again.'
          : error.message || 'Failed to connect wallet'
      );
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    console.log('🔴 Disconnecting wallet...');
    
    // Try WalletConnect disconnect first
    try {
      await walletConnectDisconnect();
    } catch (err) {
      console.log('WalletConnect disconnect not available, using local disconnect');
    }
    
    setWalletAddress(null);
    setSigner(null);
    setProvider(null);
    localStorage.removeItem('walletAddress');
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
