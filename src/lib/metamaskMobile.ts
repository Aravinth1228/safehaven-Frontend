/**
 * MetaMask Mobile Deep Link Utility
 * 
 * Uses MetaMask's official deep linking to open the MetaMask mobile app
 * Source: https://docs.metamask.io/guide/mobile-app.html#deep-linking
 * 
 * Benefits:
 * - Free (no API keys required)
 * - No WalletConnect dependency
 * - Works on both Android and iOS
 * - Simple and reliable
 */

/**
 * Detect if user is on a mobile device
 */
export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Detect if MetaMask extension is installed (desktop)
 */
export function isMetaMaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' && window.ethereum?.isMetaMask === true;
}

/**
 * Generate MetaMask deep link for mobile
 * 
 * @param dappUrl - The URL of your DApp (defaults to current page URL)
 * @returns MetaMask deep link URL
 */
export function generateMetaMaskLink(dappUrl?: string): string {
  const url = dappUrl || window.location.href;
  return `https://metamask.app.link/dapp/${url}`;
}

/**
 * Open MetaMask mobile app via deep link
 * 
 * This will:
 * 1. Open MetaMask app if installed
 * 2. User approves connection
 * 3. Returns to your DApp automatically
 * 
 * @param dappUrl - Optional: The DApp URL to return to (defaults to current URL)
 */
export function openMetaMask(dappUrl?: string): void {
  const metamaskLink = generateMetaMaskLink(dappUrl);
  window.location.href = metamaskLink;
}

/**
 * Connect to MetaMask extension (desktop)
 * 
 * Uses ethers.js to connect to MetaMask browser extension
 * 
 * @returns Promise resolving to connected address
 */
export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    // Request account access
    const accounts = await window.ethereum.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    const address = accounts[0];
    console.log('✅ Connected to MetaMask:', address);
    return address;
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('You rejected the connection request');
    }
    throw new Error(`Failed to connect MetaMask: ${error.message}`);
  }
}

/**
 * Smart connect: Automatically chooses the right method based on device
 *
 * - Mobile: Opens MetaMask app via deep link (ONLY for production HTTPS domains)
 * - Desktop with MetaMask: Connects to extension
 * - Desktop without MetaMask: Throws error (user needs to install)
 *
 * @param options - Optional configuration
 * @param options.dappUrl - Custom DApp URL for mobile deep link
 * @param options.onMobileRedirect - Callback when redirecting to mobile app
 * @param options.onDesktopConnect - Callback when connecting on desktop
 * @returns Promise resolving to address (desktop) or void (mobile redirect)
 */
export async function smartConnect(options?: {
  dappUrl?: string;
  onMobileRedirect?: () => void;
  onDesktopConnect?: (address: string) => void;
}): Promise<string | void> {
  if (isMobile()) {
    console.log('📱 Mobile device detected');
    
    // Check if running on localhost (not supported by MetaMask deep link)
    const isLocalhost = window.location.hostname === 'localhost' || 
                        window.location.hostname === '127.0.0.1';
    
    if (isLocalhost) {
      console.warn('⚠️ MetaMask deep link not supported for localhost. Use WalletConnect instead.');
      throw new Error('MetaMask deep link requires HTTPS domain. Use WalletConnect for local testing.');
    }
    
    console.log('📱 Opening MetaMask app');
    options?.onMobileRedirect?.();
    openMetaMask(options?.dappUrl);
    // Note: On mobile, we redirect and don't return immediately
    // The user will be redirected back to the DApp after approval
    return;
  }

  if (isMetaMaskInstalled()) {
    console.log('🖥️ Desktop with MetaMask - connecting to extension');
    const address = await connectMetaMask();
    options?.onDesktopConnect?.(address);
    return address;
  }

  throw new Error('MetaMask not detected. Please install MetaMask or use a mobile device.');
}

/**
 * Check if we should use mobile deep link or desktop connection
 */
export function getConnectionMethod(): 'mobile' | 'desktop-metamask' | 'desktop-no-metamask' {
  if (isMobile()) {
    return 'mobile';
  }
  if (isMetaMaskInstalled()) {
    return 'desktop-metamask';
  }
  return 'desktop-no-metamask';
}
