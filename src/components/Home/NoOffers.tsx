import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { SearchX, PackageOpen } from 'lucide-react';

interface NoOffersProps {
  isFiltered?: boolean;
}

const NoOffers: React.FC<NoOffersProps> = ({ isFiltered = false }) => {
  if (isFiltered) {
    return (
      <div className="py-20 text-center">
        <div className="max-w-md mx-auto space-y-5">
          <SearchX className="mx-auto h-10 w-10 text-[#5e6673]" />
          <h2 className="text-lg font-bold text-[#eaecef]">No listings match your filters</h2>
          <p className="text-[#848e9c] text-sm">
            Try adjusting your search — change the currency, asset, or clear the amount
            to see more offers.
          </p>
          <div className="flex justify-center gap-3 pt-2">
            <Button asChild variant="ghost" className="bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] font-bold rounded-sm h-10 px-6 text-sm">
              <Link to="/create-offer">Post an Ad</Link>
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-20 text-center">
      <div className="max-w-md mx-auto space-y-5">
        <PackageOpen className="mx-auto h-10 w-10 text-[#5e6673]" />
        <h2 className="text-lg font-bold text-[#eaecef]">No listings yet</h2>
        <p className="text-[#848e9c] text-sm">
          The market is empty. Be the first to post a USDT/USDC offer on Solana
          and get the liquidity flowing.
        </p>
        <div className="flex justify-center gap-3 pt-2">
          <Button asChild variant="ghost" className="bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] font-bold rounded-sm h-10 px-6 text-sm">
            <Link to="/create-offer">Post Your First Ad</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NoOffers;
