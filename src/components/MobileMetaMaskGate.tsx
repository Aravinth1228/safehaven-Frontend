import { useEffect, useState } from 'react';

interface MobileMetaMaskGateProps {
  children: React.ReactNode;
}

/**
 * MobileMetaMaskGate - Automatically redirects mobile users to MetaMask in-app browser
 * 
 * How it works:
 * 1. Detects if user is on mobile (iPhone/Android)
 * 2. Checks if NOT already in MetaMask browser (no window.ethereum)
 * 3. Redirects to metamask.app.link which opens MetaMask app
 * 4. MetaMask loads your site in its built-in browser with window.ethereum injected
 */
export default function MobileMetaMaskGate({ children }: MobileMetaMaskGateProps) {
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    // Check if already in MetaMask browser
    const isInMetaMaskBrowser = typeof window !== 'undefined' && 
      window.ethereum?.isMetaMask === true;

    // Check if on mobile device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // If on mobile AND not in MetaMask browser → redirect
    if (isMobile && !isInMetaMaskBrowser && !isRedirecting) {
      console.log('📱 Mobile detected, redirecting to MetaMask app...');
      setIsRedirecting(true);

      // Build the deep link URL
      const currentUrl = encodeURIComponent(
        `${window.location.origin}${window.location.pathname}${window.location.search}`
      );
      const metaMaskDeepLink = `https://metamask.app.link/dapp/${currentUrl}`;

      // Show a brief message then redirect
      const timer = setTimeout(() => {
        console.log('🔗 Redirecting to:', metaMaskDeepLink);
        window.location.href = metaMaskDeepLink;
      }, 100); // Small delay to ensure state is set

      return () => clearTimeout(timer);
    }

    // If in MetaMask browser or desktop → render normally
    console.log('✅ Rendering normally (MetaMask browser or desktop)');
  }, [isRedirecting]);

  // Show redirecting screen
  if (isRedirecting) {
    return (
      <div className="fixed inset-0 bg-gradient-to-br from-primary/10 via-background to-primary/5 flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6 animate-pulse">
            <svg className="w-10 h-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          
          <h2 className="text-2xl font-bold mb-3">
            Opening in MetaMask...
          </h2>
          
          <p className="text-muted-foreground mb-6">
            Redirecting you to the MetaMask app for the best mobile experience.
          </p>

          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '0ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '150ms' }} />
            <div className="w-2 h-2 rounded-full bg-primary animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>

          <p className="text-xs text-muted-foreground mt-6">
            If MetaMask doesn't open automatically, make sure you have the MetaMask app installed.
          </p>
        </div>
      </div>
    );
  }

  // Render children normally (either in MetaMask browser or desktop)
  return <>{children}</>;
}
