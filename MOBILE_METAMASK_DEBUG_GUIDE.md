# Mobile MetaMask Debugging Guide

## Problem: "Connect to MetaMask - undefined" on Mobile

This happens when the wallet address is not properly retrieved after connecting from MetaMask mobile.

## ✅ Solution Applied

### Changes Made:
1. **Removed manual deep linking** - Was causing issues with address retrieval
2. **Using AppKit's built-in mobile support** - Handles MetaMask mobile automatically
3. **Added proper state management** - Address is now tracked by AppKit's subscription
4. **Added loading states** - Shows "Connecting..." while processing
5. **Added null checks** - Prevents "undefined" from showing

### How It Works Now:

```
Mobile User Flow:
1. User clicks "Connect Wallet"
   ↓
2. AppKit modal opens
   ↓
3. User selects "MetaMask" from wallet list
   ↓
4. MetaMask app opens automatically
   ↓
5. User approves connection
   ↓
6. Returns to DApp
   ↓
7. AppKit detects connection + gets address
   ↓
8. Button shows: "0x12...34ab"
```

## 🧪 Testing Instructions

### Step 1: Enable Console Logging
Open your app on mobile and open browser console to see logs:
- **Chrome DevTools** (Android): `chrome://inspect`
- **Safari Web Inspector** (iOS): Settings → Safari → Advanced → Web Inspector

### Step 2: Look for These Logs

```
🔗 Connecting wallet... Mobile: true MetaMask: false
🔔 AppKit state changed: true 0x1234...5678
✅ Got signer: [object Object]
✅ Got provider
📍 Connection attempt - Address: 0x1234...5678
```

### Step 3: Check Wallet Address

After connecting, the button should show your address like:
```
0x12...34ab
```

NOT "undefined" or "Connect to MetaMask - undefined"

## 🔧 If Still Having Issues

### Check 1: Project ID
Make sure you have a valid WalletConnect Project ID:
```env
VITE_WALLETCONNECT_PROJECT_ID=your_actual_project_id
```

Get one free at: https://cloud.reown.com

### Check 2: HTTPS
MetaMask mobile requires HTTPS. Make sure your site is on HTTPS:
- ✅ `https://your-domain.com`
- ✅ `https://your-app.vercel.app`
- ❌ `http://localhost:5173` (use ngrok for local testing)

### Check 3: AppKit Version
Verify you have the latest AppKit:
```bash
npm list @reown/appkit
```

Should be v1.8.19 or higher.

### Check 4: Console Errors
Look for these errors:
- ❌ "Provider not available" → AppKit not initialized
- ❌ "Failed to get signer" → Connection failed
- ❌ "Project ID is required" → Add VITE_WALLETCONNECT_PROJECT_ID

## 📱 Manual Testing Steps

1. **Deploy to Vercel/Netlify** (must be HTTPS)
2. **Open on mobile browser** (Chrome/Safari)
3. **Click "Connect Wallet"**
4. **Select MetaMask** from the modal
5. **Approve in MetaMask app**
6. **Check if address appears** on the button

## 🐛 Common Issues & Fixes

### Issue 1: Shows "undefined"
**Cause:** Address is null when button renders
**Fix:** Already fixed - added null check in truncateAddress function

```tsx
const truncateAddress = (address: string) => {
  if (!address) return '';  // ✅ Returns empty string if null
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};
```

### Issue 2: Modal doesn't open
**Cause:** AppKit not initialized properly
**Fix:** Check Project ID and HTTPS

### Issue 3: Returns from MetaMask but not connected
**Cause:** AppKit subscription not working
**Fix:** Already fixed - using AppKit's subscribeAccount

### Issue 4: Works on desktop but not mobile
**Cause:** Using window.ethereum on mobile (doesn't exist)
**Fix:** Already fixed - using AppKit for all connections

## 🎯 Expected Behavior

| State | Button Shows |
|-------|-------------|
| Not Connected | "Connect Wallet" |
| Connecting... | "Connecting..." + spinner |
| Connected | "0x12...34ab" |
| Error | "Connect Wallet" (resets) |

## 📝 Debug Checklist

- [ ] Project ID added to .env
- [ ] Site uses HTTPS
- [ ] Console shows "🔔 AppKit state changed: true 0x..."
- [ ] Button shows address after connection
- [ ] Can click button and see AppKit modal
- [ ] MetaMask app opens when selected
- [ ] Returns to DApp after approval

## 🚀 Next Steps After Fix

1. **Test on real mobile device** (not simulator)
2. **Test signup flow** after wallet connects
3. **Test on both Android and iOS**
4. **Test with different wallets** (Trust, Rainbow, etc.)

## 📞 Support

If still having issues, share these logs:
1. Console logs from mobile browser
2. Network tab errors
3. AppKit modal screenshot
4. MetaMask app version

---

**Last Updated:** March 11, 2026
**Status:** ✅ Fixed - Ready for testing
