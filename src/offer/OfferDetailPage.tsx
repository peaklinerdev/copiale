import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import {
  getOfferById,
  getAccountById,
  Offer,
  Account,
  getAccount,
} from '@/api';
import { formatNumber } from '@/lib/utils';
import { formatDisplayId } from '@/utils/displayId';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import { formatDistanceToNow } from 'date-fns';
import Container from '@/components/Shared/Container';
import OfferTypeTooltip from '@/components/Offer/OfferTypeTooltip';
import OfferDescription from '@/components/Offer/OfferDescription';
import { formatRate, rateAdjustmentDirection } from '@/utils/stringUtils';
import { getMinutesFromTimeLimit } from '@/utils/timeUtils';
import { toast } from 'sonner';
import { useOfferDeletion } from '@/hooks/useOfferDeletion';
import DeleteOfferDialog from '@/components/Shared/DeleteOfferDialog';
import TradeConfirmationDialog from '@/components/Trade/TradeConfirmationDialog';
import { startTrade } from '@/services/tradeService';

function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<Account | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);

  const { handleDeleteOffer: performDelete, isDeleting: isDeletingOffer } = useOfferDeletion({
    onSuccess: message => {
      setIsDeleteDialogOpen(false);
      toast.success(message);
      navigate('/offers');
    },
    onError: message => {
      setError(message);
      setIsDeleteDialogOpen(false);
    },
  });

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const offerResponse = await getOfferById(parseInt(id));
        const offerData = offerResponse.data.offer;
        setOffer(offerData);
        setError(null);

        // Fetch creator details — public endpoint, non-blocking
        try {
          const creatorResponse = await getAccountById(offerData.creator_account_id);
          setCreator(creatorResponse.data);
        } catch (err) {
          console.warn('[OfferDetailPage] Creator fetch failed:', err);
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[OfferDetailPage] Fetch failed:', err);
        setError(`Failed to load offer details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  // Fetch current user account
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!primaryWallet) return;

      try {
        const response = await getAccount();
        setUserAccount(response.data);
      } catch (err) {
        console.error('[OfferDetailPage] Failed to fetch user account:', err);
      }
    };

    fetchUserAccount();
  }, [primaryWallet]);

  // Check if the current user is the owner of the offer
  const isOwner = userAccount && offer && userAccount.id === offer.creator_account_id;

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  // Updated handleDelete to use the hook
  const handleDelete = () => {
    if (!offer) return;
    performDelete(offer.id); // Call the hook's delete function
  };

  const handleConfirmTrade = (offerId: number, amount: string, fiatAmount: number) => {
    if (!offer || !primaryWallet) return;

    startTrade({
      offerId,
      amount,
      fiatAmount,
      offer,
      primaryWallet,
      onSuccess: tradeId => {
        setIsTradeDialogOpen(false);
        navigate(`/trade/${tradeId}`);
      },
      onError: error => {
        setError(error.message);
      },
    });
  };

  if (loading) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardContent className="p-6">
              <div className="flex justify-center items-center py-16">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00] mx-auto mb-4"></div>
                  <p className="text-[#848e9c]">Loading offer details...</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </Container>
      </TooltipProvider>
    );
  }

  if (error) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardContent className="p-6">
              <Alert variant="destructive" className="mb-0 border-none bg-[#f84960]/10 rounded-sm">
                <AlertDescription className="text-[#f84960]">{error}</AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Container>
      </TooltipProvider>
    );
  }

  if (!offer) {
    return (
      <TooltipProvider>
        <Container>
          <Card>
            <CardContent className="p-6">
              <Alert className="mb-0 bg-[#FF6B00]/10 border-[#FF6B00]/30 rounded-sm">
                <AlertDescription className="text-[#FF6B00]">
                  Offer not found or has been deleted.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </Container>
      </TooltipProvider>
    );
  }

  return (
    <TooltipProvider>
      <Container>
        <Card className="mb-4">
          <CardHeader>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <CardTitle className="text-[#eaecef] font-semibold">
                  Offer {formatDisplayId(offer.id)}
                </CardTitle>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(offer.created_at))} ago by{' '}
                  {creator?.username || creator?.wallet_address || 'Unknown'} | Last updated{' '}
                  {formatDistanceToNow(new Date(offer.updated_at))} ago
                </CardDescription>
                <div className="mt-4">
                  <OfferDescription offer={offer} />
                </div>
              </div>
              <div className="flex gap-2">
                <Link to="/offers">
                  <Button variant="outline">Back to Offers</Button>
                </Link>
                {isOwner && (
                  <Link to={`/edit-offer/${offer.id}`}>
                    <Button
                      variant="outline"
                      className="border-[#FF6B00]/50 text-[#FF6B00] hover:text-[#FF6B00] hover:border-[#FF6B00]"
                    >
                      Edit
                    </Button>
                  </Link>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Type</span>
                  <OfferTypeTooltip offerType={offer.offer_type} />
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Token</span>
                  <span>{offer.token}</span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Amount Range</span>
                  <span>
                    {formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)}{' '}
                    {offer.token}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Available Amount</span>
                  <span>
                    {formatNumber(offer.total_available_amount)} {offer.token}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Rate Adjustment</span>
                  <span
                    className={
                      rateAdjustmentDirection(offer.rate_adjustment) === 'up'
                        ? 'text-[#02c076]'
                        : rateAdjustmentDirection(offer.rate_adjustment) === 'down'
                        ? 'text-[#f84960]'
                        : 'text-[#848e9c]'
                    }
                  >
                    {formatRate(offer.rate_adjustment)}
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Fiat Currency</span>
                  <span>{offer.fiat_currency}</span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Escrow Deposit Time Limit</span>
                  <span>
                    {formatNumber(getMinutesFromTimeLimit(offer.escrow_deposit_time_limit))} minutes
                  </span>
                </div>

                <div className="flex justify-between items-center p-4">
                  <span className="font-medium text-[#eaecef]">Fiat Payment Time Limit</span>
                  <span>
                    {formatNumber(getMinutesFromTimeLimit(offer.fiat_payment_time_limit))} minutes
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <h3 className="font-medium text-[#eaecef] mb-2">Terms and Conditions</h3>
              <div className="p-4 whitespace-pre-wrap">{offer.terms || 'No terms specified'}</div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end border-t border-[#2b3139] p-6">
            {isOwner ? (
              <>
                <Link to={`/edit-offer/${offer.id}`}>
                  <Button
                    variant="outline"
                    className="border-[#FF6B00]/50 text-[#FF6B00] hover:text-[#FF6B00] hover:border-[#FF6B00] w-full sm:w-auto"
                  >
                    Edit Offer
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={openDeleteDialog}
                  className="border-[#f84960] text-[#f84960] hover:bg-[#f84960]/10 hover:text-[#f84960] w-full sm:w-auto"
                >
                  Delete Offer
                </Button>
              </>
            ) : primaryWallet ? (
              <TradeConfirmationDialog
                isOpen={isTradeDialogOpen}
                onOpenChange={setIsTradeDialogOpen}
                offer={offer}
                onConfirm={handleConfirmTrade}
                triggerButton={
                  <Button className="bg-[#02c076] hover:bg-[#02c076]/90 text-white rounded-sm w-full sm:w-auto">
                    Start Trade
                  </Button>
                }
              />
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm w-full sm:w-auto"
              >
                Connect Wallet to Trade
              </Button>
            )}
          </CardFooter>
        </Card>
      </Container>

      {/* Delete Confirmation Dialog */}
      <DeleteOfferDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeletingOffer}
      />
    </TooltipProvider>
  );
}

export default OfferDetailPage;
