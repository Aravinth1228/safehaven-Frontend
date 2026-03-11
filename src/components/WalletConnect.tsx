// ─────────────────────────────────────────────────────────────
// File 1: src/components/WalletConnect.tsx
// ─────────────────────────────────────────────────────────────
import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

/**
 * WalletConnect Component
 *
 * Uses Reown AppKit's built-in <appkit-button> web component.
 * Handles mobile + desktop automatically:
 *  - Mobile  → shows MetaMask app deep link + WalletConnect QR
 *  - Desktop → shows MetaMask extension + WalletConnect QR
 */
export function WalletConnect() {
  const { connectWallet, disconnectWallet, isConnected, walletAddress, isConnecting } =
    useWallet();

  return (
    <div className="wallet-connect-container">
      {/* ✅ AppKit built-in button — no custom UI needed */}
      <appkit-button />
    </div>
  );
}

export default WalletConnect;


// ─────────────────────────────────────────────────────────────
// File 2: src/global.d.ts  (or add to vite-env.d.ts)
// ─────────────────────────────────────────────────────────────
// Paste this block into your global.d.ts or vite-env.d.ts file:

/*
declare namespace JSX {
  interface IntrinsicElements {
    'appkit-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      label?: string;
      loadingLabel?: string;
      disabled?: boolean;
      balance?: 'show' | 'hide';
      size?: 'sm' | 'md';
      namespace?: string;
    };
    'appkit-network-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    >;
    'appkit-account-button': React.DetailedHTMLProps<
      React.HTMLAttributes<HTMLElement>,
      HTMLElement
    > & {
      balance?: 'show' | 'hide';
    };
  }
}
*/