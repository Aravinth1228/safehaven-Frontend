# SafeHaven Frontend

React + Vite + TypeScript frontend for SafeHaven.

## Setup

```bash
npm install
```

## Configuration

Copy `.env.example` to `.env` and configure:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_CONTRACT_ADDRESS=your_contract_address
VITE_FORWARDER_ADDRESS=your_forwarder_address
VITE_CHAIN_ID=11155111
VITE_WALLETCONNECT_PROJECT_ID=your_project_id
```

## Scripts

```bash
# Development
npm run dev

# Build
npm run build

# Build (development mode)
npm run build:dev

# Preview production build
npm run preview

# Lint
npm run lint
```

## Tech Stack

- React 18
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Ethers.js
- React Router
- Socket.IO Client
