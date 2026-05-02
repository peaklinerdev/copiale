import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

const NoOffers: React.FC = () => {
  return (
    <div className="py-24 text-center bg-[#0b0e11]">
      <div className="max-w-md mx-auto space-y-6">
        <h2 className="text-2xl font-bold text-[#eaecef]">No Advertisements Yet</h2>
        <p className="text-[#848e9c] text-sm">
          The P2P market is currently empty. Be the first to provide liquidity 
          by posting a USDT/USDC advertisement on Solana or EVM.
        </p>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-4 mt-8">
          <Button asChild className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm h-11 px-8">
            <Link to="/create-offer">Post My First Ad</Link>
          </Button>

          <Button variant="outline" className="border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-11 px-8">
             Learn How it Works
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoOffers;
