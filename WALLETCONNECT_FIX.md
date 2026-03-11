# WalletConnect Mobile App Fix

## Problem
When connecting via MetaMask mobile **app** (WalletConnect deep linking), the provider is not available from `appKit.getProvider()` even after the wallet is connected.

## Root Cause
AppKit v1.8.19 with WalletConnect has a timing issue where:
1. Wallet connects successfully (address is available)
2. But the provider object takes additional time to initialize
3. `getProvider()` returns null during this initialization period

## Solution Applied

### 1. Increased Wait Times
- Connection timeout: 40 → 60 attempts (30 seconds)
- Provider initialization wait: 1s → 3s after connection
- WalletConnect provider subscription added

### 2. Added Wallet Provider Subscription
```typescript
appKit.subscribeWallet((state) => {
  // Automatically tries to get provider when wallet state updates
})
```

### 3. Enhanced getProvider() Function
- Increased max attempts to 40 (20 seconds)
- Added fallback to check `walletInfo.provider` from AppKit state
- Better logging for debugging WalletConnect flow

### 4. Updated Connection Flow
```typescript
// After wallet connects:
1. Wait 3 seconds for WalletConnect provider to initialize
2. Try to get signer and provider
3. If fails, the wallet subscription will retry automatically
```

## Testing Steps

1. Deploy changes to Vercel
2. Open app on mobile device
3. Click "Connect Wallet"
4. Select MetaMask from the wallet list
5. MetaMask app should open via deep link
6. Approve connection in MetaMask app
7. You should be redirected back to the app
8. Wait 3-5 seconds for provider to initialize
9. Check console logs for:
   - ✅ Wallet connected successfully
   - ⏳ Waiting for WalletConnect provider to initialize...
   - ✅ Got provider from AppKit
   - ✅ Got signer after connection

## Console Logs to Watch

```
🔗 Connecting wallet... Mobile: true, MetaMask: false
📍 Opening AppKit modal...
🔍 Waiting for WalletConnect... (1/60) Address: undefined, Connected: false
...
✅ Wallet connected successfully: 0x23006cfcfec2159273d5e5017a83c3d3ee1607ec
⏳ Waiting for WalletConnect provider to initialize...
🔍 WalletConnect connected: 0x23006cfcfec2159273d5e5017a83c3d3ee1607ec - waiting for provider...
✅ Got provider from AppKit (attempt 5)
✅ Got signer after connection
```

## If Still Failing

Check these in the browser console:

1. **AppKit State**: Run `window.appKit.getState()` to see full state
2. **Wallet Info**: Check if `walletInfo.provider` exists
3. **Network**: Ensure you're on Sepolia testnet
4. **Project ID**: Verify `VITE_WALLETCONNECT_PROJECT_ID` is valid

## Alternative Solution (if above doesn't work)

If WalletConnect provider still fails, we can switch to using the WalletConnect provider directly:

```typescript
import { WalletConnectProvider } from '@walletconnect/ethereum-provider'
```

But this requires additional setup and dependencies.
