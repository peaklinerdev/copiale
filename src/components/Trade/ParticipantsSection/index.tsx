import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  creator,
}: ParticipantsSectionProps) {
  return (
    <Card className="border border-neutral-200 shadow-sm p-4">
      <CardHeader>
        <CardTitle className="text-[#eaecef]">Participants</CardTitle>
        <CardDescription>People involved in this trade</CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {currentAccount?.id === sellerAccount?.id ? (
          <>
            <div className="p-3 border border-[#2b3139] rounded-sm hover:bg-[#2b3139]">
              <ParticipantCard
                user={sellerAccount}
                role="Seller"
                isCurrentUser={currentAccount?.id === sellerAccount?.id}
                isOfferCreator={creator?.id === sellerAccount?.id}
                isSeller={true}
              />
            </div>
            <div className="p-3 border border-[#2b3139] rounded-sm hover:bg-[#2b3139]">
              <ParticipantCard
                user={buyerAccount}
                role="Buyer"
                isCurrentUser={currentAccount?.id === buyerAccount?.id}
                isOfferCreator={creator?.id === buyerAccount?.id}
                isBuyer={true}
              />
            </div>
          </>
        ) : (
          <>
            <div className="p-3 border border-[#2b3139] rounded-sm hover:bg-[#2b3139]">
              <ParticipantCard
                user={buyerAccount}
                role="Buyer"
                isCurrentUser={currentAccount?.id === buyerAccount?.id}
                isOfferCreator={creator?.id === buyerAccount?.id}
                isBuyer={true}
              />
            </div>
            <div className="p-3 border border-[#2b3139] rounded-sm hover:bg-[#2b3139]">
              <ParticipantCard
                user={sellerAccount}
                role="Seller"
                isCurrentUser={currentAccount?.id === sellerAccount?.id}
                isOfferCreator={creator?.id === sellerAccount?.id}
                isSeller={true}
              />
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}

export default ParticipantsSection;
