import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

/**
 * WalletConnect Component
 *
 * Provides wallet connection UI using Reown AppKit (WalletConnect)
 * Supports:
 * - MetaMask (browser extension)
 * - WalletConnect (mobile wallets: Trust Wallet, Rainbow, etc.)
 * - All WalletConnect-compatible wallets
 */
export function WalletConnect() {
  const { 
    walletAddress, 
    isConnected, 
    connectWallet, 
    disconnectWallet, 
    isConnecting 
  } = useWallet();

  // Format address for display (0x1234...5678)
  const formatAddress = (addr: string) => {
    if (!addr) return '';
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const handleConnect = async () => {
    try {
      await connectWallet();
    } catch (error: any) {
      console.error('Failed to connect:', error);
    }
  };

  const handleDisconnect = async () => {
    try {
      await disconnectWallet();
    } catch (error: any) {
      console.error('Failed to disconnect:', error);
    }
  };

  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button
          onClick={handleConnect}
          disabled={isConnecting}
          className="connect-wallet-btn"
          style={{
            padding: '10px 20px',
            borderRadius: '8px',
            border: 'none',
            backgroundColor: '#3b82f6',
            color: 'white',
            fontWeight: '600',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            opacity: isConnecting ? 0.7 : 1,
          }}
        >
          {isConnecting ? 'Connecting...' : '🔗 Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-info" style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px',
          padding: '8px 16px',
          backgroundColor: '#f3f4f6',
          borderRadius: '8px',
          fontSize: '14px'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '8px',
            backgroundColor: '#10b981',
            padding: '4px 12px',
            borderRadius: '6px',
            color: 'white'
          }}>
            <span>🟢</span>
            <span>{formatAddress(walletAddress!)}</span>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '6px 12px',
              borderRadius: '6px',
              border: '1px solid #ef4444',
              backgroundColor: 'white',
              color: '#ef4444',
              fontWeight: '500',
              cursor: 'pointer',
              fontSize: '13px'
            }}
          >
            Disconnect
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * BlockchainRegistration Component
 * 
 * Handles user registration on blockchain with MetaMask signing
 */
export function BlockchainRegistration({ onComplete }: { onComplete?: () => void }) {
  const {
    isConnected,
    address,
    connectWallet,
    signAndRegister,
    checkRegistration
  } = useBlockchain();

  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    phone: '',
    dob: ''
  });

  React.useEffect(() => {
    if (isConnected && address) {
      checkRegistration().then(setIsRegistered);
    }
  }, [isConnected, address]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isConnected) {
      await connectWallet();
      return;
    }

    setIsRegistering(true);

    try {
      const result = await signAndRegister({
        username: formData.username,
        email: formData.email,
        phone: formData.phone,
        dateOfBirth: new Date(formData.dob).getTime() / 1000
      });

      console.log('✅ Registration successful:', result);
      setIsRegistered(true);
      onComplete?.();
    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      alert(`Registration failed: ${error.message}`);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isRegistered) {
    return (
      <div className="registration-success">
        <p>✅ You are registered on the blockchain</p>
      </div>
    );
  }

  return (
    <div className="blockchain-registration">
      <h3>Register on Blockchain</h3>
      <p className="description">
        Register your wallet to enable gasless emergency alerts
      </p>

      {!isConnected ? (
        <button onClick={connectWallet} className="connect-btn">
          Connect Wallet to Register
        </button>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Phone</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label>Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
              required
            />
          </div>

          <div className="wallet-info">
            <p>Wallet: {address}</p>
            <p className="gas-info">⛽ You won't pay gas fees - our relayer covers transaction costs</p>
          </div>

          <button 
            type="submit" 
            disabled={isRegistering}
            className="submit-btn"
          >
            {isRegistering ? 'Registering...' : 'Sign & Register'}
          </button>
        </form>
      )}
    </div>
  );
}

/**
 * EmergencyButton Component
 * 
 * Allows users to send emergency alerts with a single click
 * User signs message with MetaMask (no gas fee)
 */
export function EmergencyButton() {
  const { signAndUpdateStatus, isConnected } = useBlockchain();
  const [isSending, setIsSending] = React.useState(false);

  const handleEmergency = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      return;
    }

    if (!confirm('Send emergency alert? This will notify admins of your location.')) {
      return;
    }

    setIsSending(true);

    try {
      // Status 2 = Danger/Emergency
      const result = await signAndUpdateStatus(2);
      console.log('✅ Emergency alert sent:', result);
      alert('🚨 Emergency alert sent! Help is on the way.');
    } catch (error: any) {
      console.error('❌ Failed to send emergency:', error);
      alert(`Failed to send emergency: ${error.message}`);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <button
      onClick={handleEmergency}
      disabled={isSending || !isConnected}
      className="emergency-button"
    >
      {isSending ? 'Sending Alert...' : '🚨 EMERGENCY'}
    </button>
  );
}

export default { WalletConnect, BlockchainRegistration, EmergencyButton };
