import { useEffect, useState } from 'react';

interface MobileMetaMaskGateProps {
  children: React.ReactNode;
}

/**
 * Check if user is on mobile device
 */
function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

/**
 * Check if already inside MetaMask's in-app browser
 * This is ONLY true when MetaMask injects window.ethereum with isMetaMask flag
 * AND the user agent contains MetaMaskMobile
 */
function isAlreadyInMetaMaskBrowser(): boolean {
  const hasMetaMaskUA = /MetaMaskMobile/i.test(navigator.userAgent);
  const hasEthereum = !!(window as any)?.ethereum?.isMetaMask;
  
  // Must have BOTH - ethereum injected AND MetaMask in UA
  return hasMetaMaskUA && hasEthereum;
}

/**
 * Get MetaMask deep link URL
 */
function getMetaMaskDeepLink(): string {
  const url = window.location.href.replace(/^https?:\/\//, '');
  return `https://metamask.app.link/dapp/${url}`;
}

/**
 * MobileMetaMaskGate - Automatically redirects mobile users to MetaMask in-app browser
 * 
 * Flow:
 * 1. Desktop → render normally
 * 2. Mobile + Already in MetaMask browser → render normally
 * 3. Mobile + NOT in MetaMask browser → redirect to metamask.app.link
 */
export default function MobileMetaMaskGate({ children }: MobileMetaMaskGateProps) {
  const [status, setStatus] = useState<'checking' | 'redirect' | 'ok'>('checking');
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    // Not mobile → skip entirely
    if (!isMobile()) {
      console.log('✅ Desktop detected, rendering normally');
      setStatus('ok');
      return;
    }

    // Already inside MetaMask browser → skip
    if (isAlreadyInMetaMaskBrowser()) {
      console.log('✅ Already in MetaMask browser, rendering normally');
      setStatus('ok');
      return;
    }

    // Mobile but NOT in MetaMask browser → redirect
    console.log('📱 Mobile detected, NOT in MetaMask browser → redirecting');
    setStatus('redirect');

    // Countdown then redirect
    let count = 3;
    const timer = setInterval(() => {
      count -= 1;
      setCountdown(count);
      if (count <= 0) {
        clearInterval(timer);
        const deepLink = getMetaMaskDeepLink();
        console.log('🔗 Redirecting to MetaMask:', deepLink);
        window.location.href = deepLink;
      }
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Still checking → show nothing (avoid flash)
  if (status === 'checking') return null;

  // Already in MetaMask or desktop → render children
  if (status === 'ok') return <>{children}</>;

  // Redirect screen
  return (
    <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        {/* MetaMask Fox Icon */}
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6 shadow-lg shadow-primary/50 text-5xl">
          🦊
        </div>

        <h1 className="text-2xl font-bold mb-3 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Opening in MetaMask
        </h1>

        <p className="text-gray-400 text-sm mb-8 max-w-xs mx-auto leading-relaxed">
          Redirecting you to the MetaMask app for the best mobile experience.
        </p>

        {/* Countdown Spinner */}
        <div className="w-16 h-16 rounded-full border-4 border-gray-700 border-t-primary flex items-center justify-center mx-auto mb-6 animate-spin text-primary font-bold text-xl">
          {countdown}
        </div>

        {/* Manual Open Button */}
        <button
          onClick={() => {
            window.location.href = getMetaMaskDeepLink();
          }}
          className="w-full max-w-xs bg-gradient-to-r from-primary to-secondary text-white py-3 px-6 rounded-xl font-semibold shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-all active:scale-95 mb-4"
        >
          🦊 Open in MetaMask Now
        </button>

        {/* Install Link */}
        <a
          href="https://metamask.io/download/"
          target="_blank"
          rel="noreferrer"
          className="text-gray-500 text-xs underline hover:text-gray-400"
        >
          Don't have MetaMask? Install it →
        </a>

        {/* Spinner Animation */}
        <style>{`
          @keyframes spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          .animate-spin {
            animation: spin 1s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}
