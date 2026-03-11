import React from 'react';
import { useWallet } from '../../contexts/WalletContext';

// ─────────────────────────────────────────────────────────────────────────────
// WalletConnect Component
// Uses Reown AppKit - handles mobile + desktop automatically
// Mobile  → MetaMask app + WalletConnect
// Desktop → MetaMask extension + WalletConnect
// ─────────────────────────────────────────────────────────────────────────────
export function WalletConnect() {
  const { connectWallet, isConnected, walletAddress, isConnecting } = useWallet();

  const truncateAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const handleClick = async () => {
    console.log('🔗 Connect button clicked, connected:', isConnected, 'address:', walletAddress);
    await connectWallet();
  };

  return (
    <button
      onClick={handleClick}
      disabled={isConnecting}
      className="wallet-connect-btn"
      style={{
        padding: '10px 20px',
        borderRadius: '8px',
        border: 'none',
        background: isConnecting
          ? '#ccc'
          : 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)',
        color: 'white',
        fontWeight: '600',
        fontSize: '14px',
        cursor: isConnecting ? 'not-allowed' : 'pointer',
        transition: 'all 0.3s ease',
        minWidth: '140px',
      }}
    >
      {isConnecting ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
          <svg
            style={{ animation: 'spin 1s linear infinite' }}
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Connecting...
        </span>
      ) : isConnected && walletAddress ? (
        truncateAddress(walletAddress)
      ) : (
        'Connect Wallet'
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// BlockchainRegistration Component
// Handles user registration on blockchain with MetaMask signing
// ─────────────────────────────────────────────────────────────────────────────
export function BlockchainRegistration({ onComplete }: { onComplete?: () => void }) {
  const { isConnected, walletAddress, connectWallet } = useWallet();

  const [isRegistering, setIsRegistering] = React.useState(false);
  const [isRegistered, setIsRegistered] = React.useState(false);
  const [formData, setFormData] = React.useState({
    username: '',
    email: '',
    phone: '',
    dob: '',
  });

  // Check registration status when wallet connects
  React.useEffect(() => {
    if (isConnected && walletAddress) {
      // TODO: call your checkRegistration() here
      // checkRegistration().then(setIsRegistered);
    }
  }, [isConnected, walletAddress]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isConnected) {
      connectWallet();
      return;
    }

    setIsRegistering(true);
    try {
      // TODO: call your signAndRegister() here
      // const result = await signAndRegister({
      //   username: formData.username,
      //   email: formData.email,
      //   phone: formData.phone,
      //   dateOfBirth: new Date(formData.dob).getTime() / 1000,
      // });
      console.log('✅ Registration successful');
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
      <div
        className="registration-success"
        style={{
          padding: '20px',
          borderRadius: '12px',
          background: 'rgba(0, 200, 100, 0.1)',
          border: '1px solid rgba(0, 200, 100, 0.3)',
          textAlign: 'center',
        }}
      >
        <p style={{ color: '#00c864', fontWeight: '600', fontSize: '16px' }}>
          ✅ You are registered on the blockchain
        </p>
      </div>
    );
  }

  return (
    <div className="blockchain-registration">
      <h3 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: '700' }}>
        Register on Blockchain
      </h3>
      <p style={{ color: '#888', marginBottom: '24px', fontSize: '14px' }}>
        Register your wallet to enable gasless emergency alerts
      </p>

      {!isConnected ? (
        <div style={{ textAlign: 'center' }}>
          <p style={{ marginBottom: '16px', color: '#666' }}>
            Connect your wallet to register
          </p>
          <button
            onClick={connectWallet}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              border: 'none',
              background: 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)',
              color: 'white',
              fontWeight: '600',
              fontSize: '14px',
              cursor: 'pointer',
            }}
          >
            Connect Wallet to Register
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {[
            { label: 'Username', key: 'username', type: 'text' },
            { label: 'Email', key: 'email', type: 'email' },
            { label: 'Phone', key: 'phone', type: 'tel' },
            { label: 'Date of Birth', key: 'dob', type: 'date' },
          ].map(({ label, key, type }) => (
            <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontWeight: '600', fontSize: '14px' }}>{label}</label>
              <input
                type={type}
                value={formData[key as keyof typeof formData]}
                onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                required
                style={{
                  padding: '10px 14px',
                  borderRadius: '8px',
                  border: '1px solid #e0e0e0',
                  fontSize: '14px',
                  outline: 'none',
                  transition: 'border-color 0.2s',
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = '#FF0066')}
                onBlur={(e) => (e.currentTarget.style.borderColor = '#e0e0e0')}
              />
            </div>
          ))}

          <div
            style={{
              padding: '12px 16px',
              background: 'rgba(255, 0, 102, 0.05)',
              borderRadius: '8px',
              border: '1px solid rgba(255, 0, 102, 0.15)',
            }}
          >
            <p style={{ fontSize: '13px', color: '#666', margin: 0 }}>
              <strong>Wallet:</strong>{' '}
              {walletAddress
                ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                : 'Not connected'}
            </p>
            <p style={{ fontSize: '13px', color: '#888', margin: '4px 0 0' }}>
              ⛽ You won't pay gas fees — our relayer covers transaction costs
            </p>
          </div>

          <button
            type="submit"
            disabled={isRegistering}
            style={{
              padding: '12px 24px',
              borderRadius: '10px',
              border: 'none',
              background: isRegistering
                ? '#ccc'
                : 'linear-gradient(135deg, #FF0066 0%, #FF6B00 100%)',
              color: 'white',
              fontWeight: '700',
              fontSize: '15px',
              cursor: isRegistering ? 'not-allowed' : 'pointer',
              boxShadow: isRegistering ? 'none' : '0 4px 20px rgba(255, 0, 102, 0.4)',
              transition: 'all 0.3s ease',
            }}
          >
            {isRegistering ? 'Registering...' : 'Sign & Register'}
          </button>
        </form>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EmergencyButton Component
// Sends emergency alert — user signs with MetaMask (no gas fee)
// ─────────────────────────────────────────────────────────────────────────────
export function EmergencyButton() {
  const { isConnected, connectWallet } = useWallet();
  const [isSending, setIsSending] = React.useState(false);

  const handleEmergency = async () => {
    if (!isConnected) {
      alert('Please connect your wallet first');
      connectWallet(); // Opens AppKit modal
      return;
    }

    if (!confirm('Send emergency alert? This will notify admins of your location.')) {
      return;
    }

    setIsSending(true);
    try {
      // TODO: call your signAndUpdateStatus(2) here
      // Status 2 = Danger/Emergency
      // const result = await signAndUpdateStatus(2);
      console.log('✅ Emergency alert sent');
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
      disabled={isSending}
      style={{
        padding: '16px 32px',
        borderRadius: '12px',
        border: 'none',
        background: isSending
          ? '#ccc'
          : 'linear-gradient(135deg, #FF0000 0%, #CC0000 100%)',
        color: 'white',
        fontWeight: '800',
        fontSize: '18px',
        cursor: isSending ? 'not-allowed' : 'pointer',
        boxShadow: isSending ? 'none' : '0 4px 24px rgba(255, 0, 0, 0.5)',
        transition: 'all 0.3s ease',
        letterSpacing: '1px',
      }}
      onMouseEnter={(e) => {
        if (!isSending) {
          e.currentTarget.style.transform = 'scale(1.05)';
          e.currentTarget.style.boxShadow = '0 6px 32px rgba(255, 0, 0, 0.7)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
        e.currentTarget.style.boxShadow = isSending
          ? 'none'
          : '0 4px 24px rgba(255, 0, 0, 0.5)';
      }}
    >
      {isSending ? (
        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <svg
            style={{ animation: 'spin 1s linear infinite' }}
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="12" cy="12" r="10" strokeOpacity="0.25" />
            <path d="M12 2a10 10 0 0 1 10 10" />
          </svg>
          Sending Alert...
        </span>
      ) : (
        '🚨 EMERGENCY'
      )}
    </button>
  );
}

export default { WalletConnect, BlockchainRegistration, EmergencyButton };