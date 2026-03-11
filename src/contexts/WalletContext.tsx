import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
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
  openMetaMask,
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

// ✅ Wait for WalletConnect to establish connection (uses function, not stale state)
function waitForWalletConnect(timeoutMs = 120000): Promise<void> {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      clearInterval(interval);
      reject(new Error('Connection timeout. Please try again.'));
    }, timeoutMs);

    const interval = setInterval(() => {
      if (isWalletConnectConnected()) {
        clearInterval(interval);
        clearTimeout(timeout);
        resolve();
      }
    }, 500);
  });
}

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMetaMaskInstalled, setIsMetaMaskInstalled] = useState(false);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);

  useEffect(() => {
    // Check MetaMask on desktop
    setIsMetaMaskInstalled(checkIsMetaMaskInstalled());

    // ✅ Check if already connected (page refresh case)
    const existingAddress = appKit.getAddress();
    if (existingAddress && isWalletConnectConnected()) {
      setWalletAddress(existingAddress);
      getSigner().then(setSigner).catch(console.error);
    }

    // ✅ Also check MetaMask extension on desktop (persisted connection)
    if (!checkIsMobile() && checkIsMetaMaskInstalled() && !existingAddress) {
      window.ethereum?.request({ method: 'eth_accounts' }).then((accounts) => {
        const accs = accounts as string[];
        if (accs.length > 0) {
          setWalletAddress(accs[0]);
          const prov = new ethers.BrowserProvider(window.ethereum!);
          prov.getSigner().then(setSigner).catch(console.error);
          setProvider(prov);
        }
      }).catch(console.error);
    }

    // ✅ Subscribe to WalletConnect connection changes
    const unsubscribe = onConnectionChange(async (connected, address) => {
      console.log('🔔 WalletConnect state changed:', connected, address);
      if (connected && address) {
        setWalletAddress(address);

        try {
          const s = await getSigner();
          setSigner(s);
        } catch (err) {
          console.error('Could not get signer:', err);
        }

        try {
          const prov = await getProvider();
          if (prov) {
            setProvider(new ethers.BrowserProvider(prov as any));
          }
        } catch (err) {
          console.error('Could not get provider:', err);
        }
      } else {
        setWalletAddress(null);
        setSigner(null);
        setProvider(null);
      }
    });

    // ✅ Listen for MetaMask extension account changes (desktop)
    const handleAccountsChanged = (accounts: unknown) => {
      const accs = accounts as string[];
      if (accs.length > 0) {
        setWalletAddress(accs[0]);
      } else {
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
      const isLocalhost =
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1';

      // ─── MOBILE ───────────────────────────────────────────────
      if (checkIsMobile()) {
        console.log('📱 Mobile detected');

        if (isLocalhost) {
          // Localhost: WalletConnect QR modal (MetaMask deep link won't work)
          console.log('🔗 Localhost — using WalletConnect modal');
          openModal();
          await waitForWalletConnect();
          console.log('✅ Connected via WalletConnect (mobile localhost)');
          return;
        }

        // Production HTTPS: MetaMask deep link
        console.log('📱 Opening MetaMask app via deep link...');
        openMetaMask();
        // ✅ Don't await — user leaves the page to MetaMask app.
        // onConnectionChange subscription will handle address when user returns.
        return;
      }

      // ─── DESKTOP with MetaMask extension ─────────────────────
      if (checkIsMetaMaskInstalled()) {
        console.log('🖥️ Desktop MetaMask extension — connecting');
        const address = await connectMetaMask();
        setWalletAddress(address);

        const prov = new ethers.BrowserProvider(window.ethereum!);
        const sgnr = await prov.getSigner();
        setSigner(sgnr);
        setProvider(prov);

        console.log('✅ Connected via MetaMask extension:', address);
        return;
      }

      // ─── DESKTOP without MetaMask ─────────────────────────────
      console.log('💼 Desktop — no MetaMask, using WalletConnect modal');
      openModal();
      await waitForWalletConnect();
      console.log('✅ Connected via WalletConnect (desktop)');

    } catch (error: any) {
      console.error('❌ Wallet connection failed:', error);

      if (checkIsMobile()) {
        throw new Error('Could not connect to MetaMask. Please make sure MetaMask app is installed and try again.');
      } else if (!checkIsMetaMaskInstalled()) {
        throw new Error('MetaMask not detected. Please install MetaMask extension or use WalletConnect.');
      } else {
        throw new Error(error.message || 'Failed to connect wallet');
      }
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectWallet = async () => {
    console.log('🔴 Disconnecting wallet...');
    try {
      await walletConnectDisconnect();
    } catch {
      console.log('WalletConnect disconnect not needed');
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