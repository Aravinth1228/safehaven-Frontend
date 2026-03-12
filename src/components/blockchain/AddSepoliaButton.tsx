import React, { useState } from 'react';
import { Network } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { ensureAppKit } from '@/lib/walletConnect';

/**
 * AddSepoliaButton Component
 *
 * Adds Sepolia testnet to MetaMask with one click
 * Works on both mobile (AppKit) and desktop (MetaMask)
 */
const AddSepoliaButton: React.FC = () => {
  const [isAdding, setIsAdding] = useState(false);
  const { toast } = useToast();

  const addSepoliaNetwork = async () => {
    try {
      const chainId = 11155111;

      // Use AppKit to switch/add network (works on mobile too!)
      const appKit = await ensureAppKit();
      await appKit.switchNetwork(11155111);

      toast({
        title: 'Sepolia Added!',
        description: 'Sepolia testnet has been added to wallet',
      });
    } catch (error: any) {
      console.error('Failed to add Sepolia:', error);

      if (error.message?.includes('User rejected')) {
        toast({
          title: 'Request Rejected',
          description: 'You rejected the network addition request',
          variant: 'destructive',
        });
      } else if (error.message?.includes('already added')) {
        toast({
          title: 'Already Added',
          description: 'Sepolia network is already in your wallet',
        });
      } else {
        toast({
          title: 'Error Adding Sepolia',
          description: error.message || 'Failed to add Sepolia network',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  const switchToSepolia = async () => {
    try {
      const chainId = 11155111;

      // Use AppKit to switch network
      const appKit = await ensureAppKit();
      await appKit.switchNetwork(11155111);

      toast({
        title: 'Switched to Sepolia!',
        description: 'You are now on Sepolia testnet',
      });
    } catch (error: any) {
      console.error('Failed to switch to Sepolia:', error);

      // If network doesn't exist, offer to add it
      if (error.code === 4902 || error.message?.includes('Unrecognized chain ID')) {
        toast({
          title: 'Sepolia Not Found',
          description: 'Adding Sepolia network...',
        });
        await addSepoliaNetwork();
      } else if (error.message?.includes('User rejected')) {
        toast({
          title: 'Request Rejected',
          description: 'You rejected the network switch',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error Switching Network',
          description: error.message || 'Failed to switch to Sepolia',
          variant: 'destructive',
        });
      }
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="flex gap-2">
      <Button
        onClick={addSepoliaNetwork}
        disabled={isAdding}
        variant="outline"
        size="sm"
        className="gap-2 h-10"
      >
        <Network className="w-4 h-4" />
        {isAdding ? 'Adding...' : 'Add Sepolia'}
      </Button>

      <Button
        onClick={switchToSepolia}
        disabled={isAdding}
        variant="outline"
        size="sm"
        className="gap-2 border-primary/50 text-primary hover:bg-primary/10 h-10"
      >
        <Network className="w-4 h-4" />
        {isAdding ? 'Switching...' : 'Switch to Sepolia'}
      </Button>
    </div>
  );
};

export default AddSepoliaButton;
