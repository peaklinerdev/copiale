import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import {
  getOfferById,
  getAccountById,
  createTrade,
  // deleteOffer import is already removed, no change needed here.
  Offer,
  Account,
  getAccount,
} from '@/api';
import { formatNumber } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDistanceToNow } from 'date-fns';
import Container from '@/components/Shared/Container';
import OfferTypeTooltip from '@/components/Offer/OfferTypeTooltip';
import OfferDescription from '@/components/Offer/OfferDescription';
import { formatRate, rateAdjustmentDirection } from '@/utils/stringUtils';
import { getMinutesFromTimeLimit } from '@/utils/timeUtils';
import { toast } from 'sonner'; // Keep for success toast
import { useOfferDeletion } from '@/hooks/useOfferDeletion'; // Import the hook

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

  // Setup offer deletion hook
  const { handleDeleteOffer: performDelete, isDeleting: isDeletingOffer } = useOfferDeletion({
    // No setOffersState needed here
    onSuccess: message => {
      setIsDeleteDialogOpen(false);
      toast.success(message); // Show success toast
      navigate('/offers'); // Navigate after success
    },
    onError: message => {
      // Hook handles the specific "active trades" toast.
      // For other errors, set the local error state.
      setError(message);
      setIsDeleteDialogOpen(false); // Close dialog on error
    },
  });

  useEffect(() => {
    const fetchOfferAndCreator = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch offer details
        const offerResponse = await getOfferById(parseInt(id));
        const offerData = offerResponse.data.offer;
        setOffer(offerData);

        // Fetch creator details
        const creatorResponse = await getAccountById(offerData.creator_account_id);
        setCreator(creatorResponse.data);

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[OfferDetailPage] Fetch failed:', err);
        setError(`Failed to load offer details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferAndCreator();
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

  const handleStartTrade = async () => {
    if (!offer || !primaryWallet) return;

    try {
      const tradeData = {
        leg1_offer_id: offer.id,
        leg1_crypto_amount: '1000000', // String as expected by API
        from_fiat_currency: offer.fiat_currency,
        destination_fiat_currency: offer.fiat_currency,
      };

      await createTrade(tradeData);
      navigate('/my-trades', { state: { message: 'Trade started successfully' } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(`Failed to start trade: ${errorMessage}`);
    }
  };

  // Removed local formatRate function

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

  if (!offer || !creator) {
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
                  Offer #{formatNumber(offer.id)}
                </CardTitle>
                <CardDescription>
                  Created {formatDistanceToNow(new Date(offer.created_at))} ago by{' '}
                  {creator.username || creator.wallet_address} | Last updated{' '}
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
              <Button
                onClick={handleStartTrade}
                className="bg-[#02c076] hover:bg-[#02c076]/90 text-white rounded-sm w-full sm:w-auto"
              >
                Start Trade
              </Button>
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
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1e2329] border border-[#2b3139] rounded-sm z-999">
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this offer? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="bg-[#f84960] hover:bg-[#f84960]/90 text-white"
              disabled={isDeletingOffer} // Ensure this uses the hook's state
            >
              {isDeletingOffer ? 'Deleting...' : 'Delete Offer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TooltipProvider>
  );
}

export default OfferDetailPage;
