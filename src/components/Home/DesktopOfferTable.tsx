import React from 'react';
import { Offer } from '@/api';
import { formatNumber } from '../../lib/utils';
import { Button } from '../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table';
import OfferActionButtons from '@/components/Offer/OfferActionButtons';
import TradeConfirmationDialog from '@/components/Trade/TradeConfirmationDialog';
import { abbreviateWallet, formatRate } from '../../utils/stringUtils';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface DesktopOfferTableProps {
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

const DesktopOfferTable: React.FC<DesktopOfferTableProps> = ({
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
    <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm overflow-hidden">
      <Table>
        <TableHeader className="bg-[#0b0e11]">
          <TableRow className="border-b border-[#2b3139] hover:bg-transparent">
            <TableHead className="text-[#848e9c] text-xs font-bold uppercase tracking-wider h-12">Advertiser</TableHead>
            <TableHead className="text-[#848e9c] text-xs font-bold uppercase tracking-wider h-12">Price</TableHead>
            <TableHead className="text-[#848e9c] text-xs font-bold uppercase tracking-wider h-12">Limit/Available</TableHead>
            <TableHead className="text-[#848e9c] text-xs font-bold uppercase tracking-wider h-12">Payment</TableHead>
            <TableHead className="text-[#848e9c] text-xs font-bold uppercase tracking-wider h-12 text-right">Trade</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOffers.map(offer => (
            <TableRow key={offer.id} className="border-b border-[#2b3139] hover:bg-[#2b3139]/30 transition-colors">
              <TableCell className="py-4">
                <div className="flex flex-col">
                  <span className="text-[#eaecef] font-bold text-sm">
                    {creatorNames[offer.creator_account_id] || abbreviateWallet(String(offer.creator_account_id))}
                  </span>
                  <span className="text-[10px] text-[#848e9c] font-medium uppercase mt-0.5">ID: {offer.id}</span>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex items-baseline gap-1">
                  <span className="text-lg font-extrabold text-[#eaecef]">{formatNumber(offer.rate_adjustment)}</span>
                  <span className="text-xs font-bold text-[#848e9c]">{offer.fiat_currency}</span>
                </div>
                <div className="text-[10px] text-[#848e9c] font-medium">Rate: {formatRate(offer.rate_adjustment)}</div>
              </TableCell>
              <TableCell className="py-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[#848e9c] text-xs">Available</span>
                    <span className="text-[#eaecef] text-xs font-bold">{formatNumber(offer.total_available_amount)} {offer.token}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#848e9c] text-xs">Limit</span>
                    <span className="text-[#eaecef] text-xs font-bold">{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}</span>
                  </div>
                </div>
              </TableCell>
              <TableCell className="py-4">
                <span className="bg-[#2b3139] text-[#eaecef] text-[10px] font-bold px-2 py-1 border-l-2 border-[#fcd535]">
                  On-chain Escrow
                </span>
              </TableCell>
              <TableCell className="py-4 text-right">
                {primaryWallet ? (
                  currentUserAccountId === offer.creator_account_id ? (
                    <div className="flex justify-end">
                      <OfferActionButtons
                        offerId={offer.id}
                        onDelete={handleDeleteOffer}
                        isDeleting={isDeletingOffer}
                      />
                    </div>
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
                          } text-white font-bold h-9 px-6 rounded-sm text-sm min-w-[100px]`}
                        >
                          {offer.offer_type === 'BUY' ? 'Sell' : 'Buy'} {offer.token}
                        </Button>
                      }
                    />
                  )
                ) : (
                  <Button
                    onClick={() => setShowAuthFlow(true)}
                    className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold h-9 px-4 rounded-sm text-xs"
                  >
                    Connect to Trade
                  </Button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default DesktopOfferTable;
