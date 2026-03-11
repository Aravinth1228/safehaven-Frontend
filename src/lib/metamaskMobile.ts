/**
 * MetaMask Mobile Deep Link Utility
 */

export function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

export function isMetaMaskInstalled(): boolean {
  return typeof window.ethereum !== 'undefined' && window.ethereum?.isMetaMask === true;
}

export function generateMetaMaskLink(dappUrl?: string): string {
  const url = dappUrl || window.location.href;
  // Remove protocol prefix for metamask deep link
  const cleanUrl = url.replace(/^https?:\/\//, '');
  return `https://metamask.app.link/dapp/${cleanUrl}`;
}

export function openMetaMask(dappUrl?: string): void {
  const metamaskLink = generateMetaMaskLink(dappUrl);
  window.location.href = metamaskLink;
}

export async function connectMetaMask(): Promise<string> {
  if (!isMetaMaskInstalled()) {
    throw new Error('MetaMask is not installed. Please install MetaMask extension.');
  }

  try {
    const accounts = await window.ethereum!.request({
      method: 'eth_requestAccounts',
    }) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    return accounts[0];
  } catch (error: any) {
    if (error.code === 4001) {
      throw new Error('You rejected the connection request');
    }
    throw new Error(`Failed to connect MetaMask: ${error.message}`);
  }
}

export function getConnectionMethod(): 'mobile' | 'desktop-metamask' | 'desktop-no-metamask' {
  if (isMobile()) return 'mobile';
  if (isMetaMaskInstalled()) return 'desktop-metamask';
  return 'desktop-no-metamask';
}