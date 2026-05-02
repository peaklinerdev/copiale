import React from 'react';
import { Offer } from '@/api';
import { formatNumber } from '../../lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Button } from '../../components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '../../components/ui/tooltip';
import OfferActionButtons from '@/components/Offer/OfferActionButtons';
import TradeConfirmationDialog from '@/components/Trade/TradeConfirmationDialog';
import { abbreviateWallet, formatRate, rateAdjustmentDirection } from '../../utils/stringUtils';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface MobileOfferListProps {
  filteredOffers: Offer[];
  creatorNames: Record<number, string>;
  currentUserAccountId: number | null;
  primaryWallet: { address?: string } | null;
  isDialogOpen: boolean;
  selectedOfferId: number | null;
  handleDeleteOffer: (offerId: number) => Promise<void>;
  isDeletingOffer?: boolean;
  openTradeDialog: (offerId: number) => void;
  onOpenChange: (open: boolean) => void;
  onConfirmTrade: (offerId: number, amount: string, fiatAmount: number) => void;
}

const MobileOfferList: React.FC<MobileOfferListProps> = ({
  filteredOffers,
  creatorNames,
  currentUserAccountId,
  primaryWallet,
  isDialogOpen,
  selectedOfferId,
  handleDeleteOffer,
  isDeletingOffer,
  openTradeDialog,
  onOpenChange,
  onConfirmTrade,
}) => {
  const { setShowAuthFlow } = useDynamicContext();
  return (
    <div className="md:hidden p-4 space-y-4">
      {filteredOffers.map(offer => (
        <div key={offer.id} className="bg-[#1e2329] border border-[#2b3139] p-4 rounded-sm">
          <div className="flex justify-between items-start mb-4">
            <div className="flex flex-col">
              <span className="text-[#eaecef] font-bold">
                {creatorNames[offer.creator_account_id] || abbreviateWallet(String(offer.creator_account_id))}
              </span>
              <span className="text-[10px] text-[#848e9c] uppercase font-bold">ID: {offer.id}</span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-lg font-extrabold text-[#eaecef] leading-none">{formatNumber(offer.rate_adjustment)}</span>
              <span className="text-[10px] font-bold text-[#848e9c]">{offer.fiat_currency}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4 pt-4 border-t border-[#2b3139]">
            <div>
              <span className="text-[10px] text-[#848e9c] uppercase font-bold block mb-1">Limit</span>
              <span className="text-xs text-[#eaecef] font-medium">
                {formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] text-[#848e9c] uppercase font-bold block mb-1">Available</span>
              <span className="text-xs text-[#eaecef] font-medium">
                {formatNumber(offer.total_available_amount)} {offer.token}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-[#2b3139]">
            <span className="text-[10px] text-[#848e9c] font-medium italic">
              Updated {formatDistanceToNow(new Date(offer.updated_at))} ago
            </span>
            <div className="flex gap-2">
               {primaryWallet ? (
                currentUserAccountId === offer.creator_account_id ? (
                  <OfferActionButtons
                    offerId={offer.id}
                    onDelete={handleDeleteOffer}
                    isDeleting={isDeletingOffer}
                    isMobile={true}
                  />
                ) : (
                  <TradeConfirmationDialog
                    isOpen={isDialogOpen && selectedOfferId === offer.id}
                    onOpenChange={onOpenChange}
                    offer={offer}
                    onConfirm={onConfirmTrade}
                    triggerButton={
                      <Button
                        onClick={() => openTradeDialog(offer.id)}
                        className={`${
                          offer.offer_type === 'BUY' 
                            ? 'bg-[#02c076] hover:opacity-90' 
                            : 'bg-[#f84960] hover:opacity-90'
                        } text-white font-bold h-9 px-6 rounded-sm text-xs`}
                      >
                        {offer.offer_type === 'BUY' ? 'Sell' : 'Buy'} {offer.token}
                      </Button>
                    }
                  />
                )
              ) : (
                <Button
                  onClick={() => setShowAuthFlow(true)}
                  className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold h-9 px-4 rounded-sm text-xs w-full"
                >
                  Trade Now
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MobileOfferList;
