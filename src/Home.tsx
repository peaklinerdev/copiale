import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link, useNavigate } from 'react-router-dom';
import { getOffers, Offer } from './api';

// UI Components
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { TooltipProvider } from '@/components/ui/tooltip';
import FilterBar from '@/components/Home/FilterBar';
import IntroMessageNotLoggedIn from '@/components/Home/IntroMessageNotLoggedIn';
import NoOffers from '@/components/Home/NoOffers';

// Custom Components
import MobileOfferList from './components/Home/MobileOfferList';
import DesktopOfferTable from './components/Home/DesktopOfferTable';
import OfferPagination from './components/Home/OfferPagination';

// Custom Hooks
import { useOfferFiltering } from './hooks/useOfferFiltering';
import { useUserAccount, fetchCreatorNames } from './hooks/useUserAccount';
import { useOfferDeletion } from './hooks/useOfferDeletion';

// Services
import { startTrade } from './services/tradeService';

function HomePage() {
  const { primaryWallet } = useDynamicContext();
  const navigate = useNavigate();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteSuccess, setDeleteSuccess] = useState<string | null>(null);
  const [selectedOfferId, setSelectedOfferId] = useState<number | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const { hasUsername, currentUserAccountId, creatorNames, setCreatorNames } =
    useUserAccount(primaryWallet);
  const {
    filteredOffers,
    currentPage,
    totalPages,
    handleCurrencyChange,
    handleTradeTypeChange,
    handlePageChange,
  } = useOfferFiltering({
    offers,
    itemsPerPage: 25,
  });

  const { handleDeleteOffer: performDelete, isDeleting: isDeletingOffer } = useOfferDeletion({
    setOffersState: setOffers,
    onSuccess: message => {
      setDeleteSuccess(message);
      setTimeout(() => {
        setDeleteSuccess(null);
      }, 3000);
    },
    onError: message => {
      setError(message);
    },
  });

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getOffers();
        const offersData = response.data.offers || [];

        if (!Array.isArray(offersData)) {
          console.error('[HomePage] Invalid offers data structure:', offersData);
          setError('Invalid response format from server');
          setOffers([]);
          return;
        }

        const sortedOffers = offersData.sort(
          (a: Offer, b: Offer) =>
            new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        setOffers(sortedOffers);

        await fetchCreatorNames(sortedOffers, primaryWallet, setCreatorNames);
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[HomePage] Fetch failed:', err);
        setError(`Failed to load offers: ${errorMessage}`);
        setOffers([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, [primaryWallet, setCreatorNames]);

  const openTradeDialog = (offerId: number) => {
    setSelectedOfferId(offerId);
    setIsDialogOpen(true);
  };

  const handleConfirmTrade = (offerId: number, amount: string, fiatAmount: number) => {
    const offer = offers.find(o => o.id === offerId);
    if (!offer) return;

    startTrade({
      offerId,
      amount,
      fiatAmount,
      offer,
      primaryWallet,
      onSuccess: tradeId => {
        setIsDialogOpen(false);
        navigate(`/trade/${tradeId}`);
      },
      onError: error => {
        alert('Trade failed: ' + error.message);
      },
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-6">
        {!primaryWallet && <IntroMessageNotLoggedIn />}
        
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm">
          {hasUsername === false && primaryWallet && (
            <div className="bg-[#fcd535]/10 border-b border-[#fcd535]/20 p-4">
              <p className="text-[#fcd535] text-sm font-medium">
                You haven't set a username yet. <Link to="/account" className="underline font-bold">Complete your profile</Link> to start trading.
              </p>
            </div>
          )}

          <div className="p-6 border-b border-[#2b3139]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="space-y-1">
                <h1 className="text-2xl font-bold text-[#eaecef]">P2P Market</h1>
                <p className="text-sm text-[#848e9c]">Trade directly with peer-to-peer advertisements on Solana/EVM.</p>
              </div>
              
              <div className="flex items-center gap-4 w-full sm:w-auto">
                <FilterBar
                  onCurrencyChange={handleCurrencyChange}
                  onTradeTypeChange={handleTradeTypeChange}
                />
                {primaryWallet && (
                  <Button asChild className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm h-10 px-6">
                    <Link to="/create-offer">Post Ad</Link>
                  </Button>
                )}
              </div>
            </div>
          </div>

          <div className="p-0">
            {loading && (
              <div className="flex flex-col justify-center items-center py-32 gap-4">
                <div className="w-10 h-10 border-2 border-[#fcd535]/20 border-t-[#fcd535] animate-spin rounded-full"></div>
                <p className="text-[#848e9c] text-sm font-medium">Synchronizing USDT/USDC Market Data...</p>
              </div>
            )}

            {error && (
              <div className="p-6">
                <Alert variant="destructive" className="bg-[#f84960]/10 border-[#f84960]/20 text-[#f84960] rounded-sm">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              </div>
            )}

            {deleteSuccess && (
              <div className="p-6">
                <Alert className="bg-[#02c076]/10 border-[#02c076]/20 text-[#02c076] rounded-sm">
                  <AlertDescription>{deleteSuccess}</AlertDescription>
                </Alert>
              </div>
            )}

            {!loading && !error && offers.length === 0 ? (
              <NoOffers />
            ) : (
              !loading && !error && (
                <>
                  <div className="md:hidden">
                    <MobileOfferList
                      filteredOffers={filteredOffers}
                      creatorNames={creatorNames}
                      currentUserAccountId={currentUserAccountId}
                      primaryWallet={primaryWallet}
                      isDialogOpen={isDialogOpen}
                      selectedOfferId={selectedOfferId}
                      handleDeleteOffer={performDelete}
                      isDeletingOffer={isDeletingOffer}
                      openTradeDialog={openTradeDialog}
                      onOpenChange={open => !open && setIsDialogOpen(false)}
                      onConfirmTrade={handleConfirmTrade}
                    />
                  </div>

                  <DesktopOfferTable
                    filteredOffers={filteredOffers}
                    creatorNames={creatorNames}
                    currentUserAccountId={currentUserAccountId}
                    primaryWallet={primaryWallet}
                    isDialogOpen={isDialogOpen}
                    selectedOfferId={selectedOfferId}
                    handleDeleteOffer={performDelete}
                    isDeletingOffer={isDeletingOffer}
                    openTradeDialog={openTradeDialog}
                    onOpenChange={open => !open && setIsDialogOpen(false)}
                    onConfirmTrade={handleConfirmTrade}
                  />
                </>
              )
            )}

            {!loading && !error && filteredOffers.length > 0 && (
              <div className="p-6 border-t border-[#2b3139]">
                <OfferPagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  handlePageChange={handlePageChange}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}

export default HomePage;
