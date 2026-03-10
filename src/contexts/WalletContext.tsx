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
import {
  isMobile as checkIsMobile,
  isMetaMaskInstalled as checkIsMetaMaskInstalled,
  openMetaMask,
  connectMetaMask,
  smartConnect
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
      console.log('🔗 Connecting wallet...');

      // Check if running on localhost (MetaMask deep link not supported)
      const isLocalhost = window.location.hostname === 'localhost' || 
                          window.location.hostname === '127.0.0.1';

      // Check if mobile device
      if (checkIsMobile()) {
        console.log('📱 Mobile device detected');
        
        if (isLocalhost) {
          // On localhost, use WalletConnect instead of MetaMask deep link
          console.log('🔗 Localhost detected - using WalletConnect (MetaMask deep link requires HTTPS)');
          openModal();
          
          console.log('📱 WalletConnect modal opened - scan QR code with MetaMask mobile');
          
          // Wait for connection (handled by subscription)
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              reject(new Error('Connection timeout. Please try again.'));
            }, 120000);

            const checkConnection = setInterval(() => {
              if (isWalletConnectConnected()) {
                clearInterval(checkConnection);
                clearTimeout(timeout);
                resolve(true);
              }
            }, 500);
          });
          
          console.log('✅ Wallet connected via WalletConnect');
          return;
        }
        
        // Production HTTPS domain - use MetaMask deep link
        console.log('📱 Using MetaMask deep link');
        openMetaMask();

        // On mobile, we redirect to MetaMask app
        // The user will be redirected back after approval
        // We'll wait for the connection to be established via the subscription
        console.log('📱 Redirecting to MetaMask app...');

        // Wait for connection (handled by subscription when user returns)
        await new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            reject(new Error('Connection timeout. Please try again.'));
          }, 120000); // 2 minutes timeout

          const checkConnection = setInterval(() => {
            if (walletAddress) {
              clearInterval(checkConnection);
              clearTimeout(timeout);
              resolve(true);
            }
          }, 500);
        });

        console.log('✅ Wallet connected via MetaMask mobile');
        return;
      }

      // Desktop: Check for MetaMask extension
      if (checkIsMetaMaskInstalled()) {
        console.log('🖥️ Desktop with MetaMask - using extension');

        try {
          const address = await connectMetaMask();
          setWalletAddress(address);
          localStorage.setItem('walletAddress', address);

          const prov = new ethers.BrowserProvider(window.ethereum);
          const sgnr = await prov.getSigner();
          setSigner(sgnr);
          setProvider(prov);

          console.log('✅ Wallet connected via MetaMask extension:', address);
          return;
        } catch (error: any) {
          console.error('MetaMask extension connection failed:', error);
          throw error;
        }
      }

      // Desktop without MetaMask: Fall back to WalletConnect
      console.log('💼 Desktop without MetaMask - using WalletConnect');
      openModal();

      console.log('📱 WalletConnect modal opened - select MetaMask or any wallet');

      // Wait for connection (handled by subscription above)
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
      console.error('❌ Wallet connection failed:', error);

      // Show user-friendly error
      if (checkIsMobile()) {
        throw new Error(
          'Could not connect to MetaMask. Please make sure MetaMask app is installed and try again.'
        );
      } else if (!checkIsMetaMaskInstalled()) {
        throw new Error(
          'MetaMask not detected. Please install MetaMask extension or use WalletConnect.'
        );
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
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
