# Mobile Wallet Connection Guide

## 🔧 Fix for 403 Error on Localhost

### Problem
MetaMask deep link (`https://metamask.app.link/dapp/...`) **does not support localhost** URLs. It requires **HTTPS domains** only.

**Error:**
```
403 ERROR - The request could not be satisfied
GET https://metamask.app.link/dapp/http://localhost:8080/ 403 (Forbidden)
```

---

## ✅ Solution: Use WalletConnect for Local Development

### On Localhost (Development):

When running on `http://localhost:5173` or `http://localhost:8080`:

1. **Click "Connect Wallet" button**
2. **WalletConnect modal opens** (not MetaMask deep link)
3. **Scan QR code** with MetaMask mobile app:
   - Open MetaMask app on mobile
   - Tap menu (☰) → Scan QR code
   - Point camera at QR code on screen
4. **Approve connection** in MetaMask app
5. **Connected!** ✅

### On Production (HTTPS Domain):

When deployed to `https://yourdomain.com`:

1. **Click "Connect Wallet" button**
2. **MetaMask app opens automatically** (deep link)
3. **Approve connection** in MetaMask app
4. **Redirected back** to your DApp
5. **Connected!** ✅

---

## 📱 How to Test on Mobile (Local Development)

### Option 1: WalletConnect QR Code (Recommended)

1. Start dev server:
   ```bash
   npm run dev
   ```

2. On mobile, open browser and go to:
   ```
   http://192.168.1.X:5173  (your computer's local IP)
   ```
   Or use ngrok:
   ```bash
   ngrok http 5173
   # Then open: https://your-ngrok-url.ngrok.io
   ```

3. Click "Connect Wallet"
4. **WalletConnect modal opens**
5. **Scan QR code** with MetaMask mobile app
6. **Connected!** ✅

### Option 2: Deploy to Vercel (Best for Testing)

1. Deploy your app:
   ```bash
   npm install -g vercel
   vercel
   ```

2. Get HTTPS URL:
   ```
   https://safehaven-eta.vercel.app
   ```

3. On mobile, open the HTTPS URL
4. Click "Connect Wallet"
5. **MetaMask app opens automatically** (deep link works!)
6. **Connected!** ✅

---

## 🔍 Connection Flow Diagram

```
┌─────────────────────────────────────────────────────────┐
│           Local Development (localhost)                 │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User clicks "Connect Wallet"                           │
│           ↓                                             │
│  Check: Is localhost? → YES                             │
│           ↓                                             │
│  Open WalletConnect Modal (QR Code)                     │
│           ↓                                             │
│  User scans QR with MetaMask mobile                     │
│           ↓                                             │
│  Connected! ✅                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│           Production (HTTPS Domain)                     │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  User clicks "Connect Wallet"                           │
│           ↓                                             │
│  Check: Is localhost? → NO (HTTPS domain)               │
│           ↓                                             │
│  Open MetaMask App (Deep Link)                          │
│           ↓                                             │
│  User approves in MetaMask                              │
│           ↓                                             │
│  Redirected back to DApp                                │
│           ↓                                             │
│  Connected! ✅                                          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🛠️ Code Changes Made

### 1. `src/lib/metamaskMobile.ts`
Added localhost detection:
```typescript
if (isMobile()) {
  const isLocalhost = window.location.hostname === 'localhost' || 
                      window.location.hostname === '127.0.0.1';
  
  if (isLocalhost) {
    throw new Error('MetaMask deep link requires HTTPS domain. Use WalletConnect for local testing.');
  }
  
  openMetaMask();
}
```

### 2. `src/contexts/WalletContext.tsx`
Fallback to WalletConnect on localhost:
```typescript
if (checkIsMobile() && isLocalhost) {
  openModal(); // WalletConnect modal
  // Wait for connection via QR code
} else if (checkIsMobile()) {
  openMetaMask(); // Deep link (production only)
}
```

---

## 📋 Testing Checklist

### Local Development:
- [ ] Dev server running on `http://localhost:5173`
- [ ] Click "Connect Wallet"
- [ ] WalletConnect modal opens
- [ ] QR code displayed
- [ ] Scan with MetaMask mobile app
- [ ] Connection successful ✅

### Production (HTTPS):
- [ ] App deployed to HTTPS domain (Vercel, Netlify, etc.)
- [ ] Open app on mobile device
- [ ] Click "Connect Wallet"
- [ ] MetaMask app opens automatically
- [ ] Approve connection
- [ ] Redirected back to app
- [ ] Connection successful ✅

---

## 🚀 Quick Deploy to Vercel

```bash
# Install Vercel CLI
npm install -g vercel

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? (select your account)
# - Link to existing project? N
# - Project name? safehaven
# - Directory? ./
# - Override settings? N

# Get your HTTPS URL!
```

---

## 💡 Key Points

1. **MetaMask deep link ONLY works with HTTPS domains** ❌ localhost
2. **WalletConnect works everywhere** (localhost + HTTPS) ✅
3. **Code auto-detects** and uses the right method ✅
4. **No code changes needed** for production deployment ✅

---

## 🔗 Helpful Links

- [MetaMask Deep Linking Docs](https://docs.metamask.io/guide/mobile-app.html#deep-linking)
- [WalletConnect Docs](https://docs.walletconnect.com/)
- [Reown (WalletConnect) Cloud](https://cloud.reown.com)
- [Vercel Deployment](https://vercel.com/docs)

---

**Summary:** 
- **Localhost** → WalletConnect QR Code ✅
- **HTTPS Domain** → MetaMask Deep Link ✅

Happy coding! 🚀
