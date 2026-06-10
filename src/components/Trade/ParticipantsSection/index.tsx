import ParticipantCard from './ParticipantCard';
import { Account, Trade } from '@/api';

interface ParticipantsSectionProps {
  buyerAccount: Account | null;
  sellerAccount: Account | null;
  currentAccount: Account | null;
  creator: Account | null;
  trade: Trade;
  userRole: 'buyer' | 'seller';
}

function ParticipantsSection({
  buyerAccount,
  sellerAccount,
  currentAccount,
}: ParticipantsSectionProps) {
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-4">
      <div className="flex items-center gap-3">
        <div className="flex-1">
          <ParticipantCard
            user={buyerAccount}
            isCurrentUser={currentAccount?.id === buyerAccount?.id}
          />
        </div>
        <div className="flex flex-col items-center gap-1 shrink-0">
          <span className="text-[10px] font-mono font-bold text-[#6b7280] tracking-wider">VS</span>
          <div className="w-px h-8 bg-[#1f1f1f]" />
        </div>
        <div className="flex-1">
          <ParticipantCard
            user={sellerAccount}
            isCurrentUser={currentAccount?.id === sellerAccount?.id}
          />
        </div>
      </div>
      <div className="flex justify-center gap-6 mt-2">
        <span className="text-[9px] font-mono font-bold text-[#f97316] tracking-[0.2em] uppercase">
          Buyer
        </span>
        <span className="text-[9px] font-mono font-bold text-[#6b7280] tracking-[0.2em] uppercase">
          Seller
        </span>
      </div>
    </div>
  );
}

export default ParticipantsSection;
