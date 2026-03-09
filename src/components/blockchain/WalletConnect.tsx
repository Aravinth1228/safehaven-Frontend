import React from 'react';
import { useWallet } from '../../contexts/WalletContext';
import { isMobile as checkIsMobile, isMetaMaskInstalled as checkIsMetaMaskInstalled } from '../../lib/metamaskMobile';

// Add CSS animation for spinner
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
if (typeof document !== 'undefined' && !document.querySelector('style[data-wallet-connect]')) {
  style.setAttribute('data-wallet-connect', 'true');
  document.head.appendChild(style);
}

/**
 * WalletConnect Component
 *
 * Smart wallet connection with automatic device detection:
 * - Mobile: Opens MetaMask app via deep link (free, no API keys)
 * - Desktop with MetaMask: Connects to extension directly
 * - Desktop without MetaMask: Falls back to WalletConnect
 */
export function WalletConnect() {
  const {
    walletAddress,
    isConnected,
    connectWallet,
    disconnectWallet,
    isConnecting
  } = useWallet();

  const isMobileDevice = checkIsMobile();
  const hasMetaMask = checkIsMetaMaskInstalled();

  // Get connection method description
  const getConnectionHint = () => {
    if (isMobileDevice) {
      return 'Opens MetaMask app';
    }
    if (hasMetaMask) {
      return 'Connect with MetaMask';
    }
    return 'Connect with WalletConnect';
  };

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
      // Error is already user-friendly from connectWallet
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
          title={getConnectionHint()}
          style={{
            padding: '10px 20px',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)',
            color: 'white',
            fontWeight: '700',
            fontSize: '14px',
            cursor: isConnecting ? 'not-allowed' : 'pointer',
            opacity: isConnecting ? 0.7 : 1,
            boxShadow: '0 4px 20px rgba(255, 0, 102, 0.5)',
            transition: 'all 0.3s ease',
            position: 'relative',
            overflow: 'hidden',
            height: '40px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 30px rgba(255, 0, 102, 0.7)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF3385 0%, #FF8533 100%)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 0, 102, 0.5)';
            e.currentTarget.style.background = 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)';
          }}
        >
          {isConnecting ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <svg style={{ animation: 'spin 1s linear infinite' }} width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
                <path d="M12 2a10 10 0 0 1 10 10" strokeOpacity="1" />
              </svg>
              Connecting...
            </span>
          ) : (
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isMobileDevice ? (
                <>
                  <span>📱</span>
                  <span>Connect Wallet</span>
                </>
              ) : hasMetaMask ? (
                <>
                  <span>🦊</span>
                  <span>Connect MetaMask</span>
                </>
              ) : (
                <>
                  <span>🔗</span>
                  <span>Connect Wallet</span>
                </>
              )}
            </span>
          )}
        </button>
      ) : (
        <div className="wallet-info" style={{
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          padding: '8px 16px',
          background: 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)',
          borderRadius: '12px',
          fontSize: '14px',
          boxShadow: '0 4px 20px rgba(255, 0, 102, 0.4)',
          color: 'white'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            padding: '6px 12px',
            borderRadius: '8px',
            backdropFilter: 'blur(10px)',
            fontWeight: '600'
          }}>
            <span>🟢</span>
            <span>{formatAddress(walletAddress!)}</span>
          </div>
          <button
            onClick={handleDisconnect}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: '2px solid rgba(255, 255, 255, 0.5)',
              backgroundColor: 'rgba(255, 255, 255, 0.2)',
              color: 'white',
              fontWeight: '600',
              cursor: 'pointer',
              fontSize: '13px',
              backdropFilter: 'blur(10px)',
              transition: 'all 0.3s ease',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.4)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)';
              e.currentTarget.style.transform = 'scale(1)';
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
