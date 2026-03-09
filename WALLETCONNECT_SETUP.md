# 🔗 WalletConnect Integration Guide

## Overview

SafeHaven now supports **WalletConnect v2** for seamless mobile wallet connections!

### Supported Wallets
- ✅ MetaMask (Mobile & Desktop)
- ✅ Trust Wallet
- ✅ Rainbow
- ✅ Coinbase Wallet
- ✅ All WalletConnect v2 compatible wallets

---

## 🚀 Setup Steps

### 1. Get WalletConnect Project ID

1. Visit [Reown Cloud](https://cloud.reown.com)
2. Sign up / Log in
3. Create a new project
4. Copy your **Project ID**

### 2. Update Environment Variables

Create/update `.env` file in the frontend folder:

```bash
cd frontend
cp .env.example .env
```

Edit `.env` and add your Project ID:

```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id_here
```

### 3. Install Dependencies

Already installed! These packages were added:
```json
{
  "@reown/appkit": "latest",
  "@reown/appkit-adapter-ethers": "latest"
}
```

### 4. Run the Application

```bash
cd frontend
npm run dev
```

---

## 📱 How It Works

### Desktop Flow
1. Click "Connect Wallet"
2. WalletConnect modal opens
3. Select your wallet (MetaMask, Trust Wallet, etc.)
4. QR code appears
5. Scan with mobile wallet app
6. Approve connection
7. ✅ Connected!

### Mobile Flow
1. Click "Connect Wallet"
2. Select wallet from list
3. App automatically opens your wallet app
4. Approve connection
5. Redirects back to SafeHaven
6. ✅ Connected!

---

## 🎨 Features

### What's New

| Feature | Description |
|---------|-------------|
| **QR Code Modal** | Desktop users can scan QR to connect |
| **Mobile Deep Linking** | Automatically opens wallet apps on mobile |
| **Multi-Wallet Support** | Users can switch between wallets |
| **Session Persistence** | Stays connected across page reloads |
| **Network Switching** | Auto-switches to Sepolia testnet |

### Supported Networks
- ✅ Ethereum Sepolia (Testnet) - Default
- ✅ Ethereum Mainnet

---

## 🔧 Code Structure

### New Files Created

```
frontend/src/
├── lib/
│   └── walletConnect.ts       # WalletConnect configuration
├── contexts/
│   └── WalletContext.tsx      # Updated with WalletConnect support
└── components/blockchain/
    └── WalletConnect.tsx      # Updated UI component
```

### Key Functions

```typescript
// Connect wallet
await connectWallet()

// Disconnect wallet
await disconnectWallet()

// Get connected address
const address = await getConnectedAddress()

// Get signer for transactions
const signer = await getSigner()

// Check connection status
const connected = isConnected()
```

---

## 🐛 Troubleshooting

### "Project ID not found"
- Make sure `.env` file exists with `VITE_WALLETCONNECT_PROJECT_ID`
- Restart dev server after adding the variable

### "QR Code not showing"
- Check browser console for errors
- Ensure WalletConnect Project ID is valid
- Try clearing browser cache

### "Mobile app not opening"
- Ensure wallet app is installed
- Check that deep linking is enabled
- Try scanning QR code instead

### "Connection timeout"
- Network issues - try again
- Check if wallet app is updated
- Verify Project ID is correct

---

## 📊 Comparison: Before vs After

| Feature | Before (MetaMask Only) | After (WalletConnect) |
|---------|----------------------|---------------------|
| Mobile Support | ❌ Limited | ✅ Full support |
| Wallet Options | 1 (MetaMask) | 100+ wallets |
| UX on Mobile | ⭐⭐ | ⭐⭐⭐⭐⭐ |
| QR Code | ❌ | ✅ |
| Deep Linking | ⚠️ Manual | ✅ Automatic |
| Industry Standard | ❌ | ✅ (Used by Uniswap, OpenSea) |

---

## 🎯 Mobile User Flow

```
User clicks "Connect Wallet"
        ↓
WalletConnect modal opens
        ↓
Shows list of wallets
        ↓
User selects: MetaMask / Trust Wallet / etc.
        ↓
App automatically opens wallet app
        ↓
User approves connection
        ↓
Redirects back to SafeHaven
        ↓
✅ Wallet connected & ready to use!
```

---

## 🔐 Security Notes

- ✅ Private keys never leave the wallet
- ✅ All signing happens in user's wallet
- ✅ WalletConnect uses end-to-end encryption
- ✅ Session keys are temporary
- ✅ Users can disconnect anytime

---

## 📚 Resources

- [Reown AppKit Docs](https://docs.reown.com/appkit)
- [WalletConnect Docs](https://docs.walletconnect.com)
- [Supported Wallets](https://walletconnect.com/wallets)
- [Get Project ID](https://cloud.reown.com)

---

## 🎉 Success!

Your SafeHaven app now supports **industry-standard wallet connections** just like:
- Uniswap
- OpenSea
- PancakeSwap
- And 1000+ other dApps!

**Happy Building! 🚀**
