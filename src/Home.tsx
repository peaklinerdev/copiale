import { useState, useEffect } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { getOffers, Offer } from './api';

// UI Components
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
    tradeType,
    currentCurrency,
    currentAsset,
    amount,
    paymentMethod,
    sortBy,
    currentPage,
    totalPages,
    handleCurrencyChange,
    handleTradeTypeChange,
    handleAssetChange,
    handleAmountChange,
    handlePaymentMethodChange,
    handleSortChange,
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
        toast.error('Trade failed', { description: error.message });
      },
    });
  };

  return (
    <TooltipProvider>
      <div className="w-full space-y-4">
        {!primaryWallet && <IntroMessageNotLoggedIn />}

        {/* Stats bar */}
        {!loading && !error && (
          <div className="flex items-center justify-between text-xs text-[#848e9c] px-1 backdrop-blur-sm">
            <div className="flex items-center gap-6">
              <span><span className="text-[#eaecef] font-bold">{offers.length}</span> active offers</span>
              <span>Updated <span className="text-[#eaecef]">{new Date().toLocaleTimeString()}</span></span>
            </div>
            {primaryWallet && (
              <Link to="/create-offer" className="text-sm font-medium text-[#FF6B00] hover:text-[#ff8033] transition-colors flex items-center gap-1">
                <span className="text-base leading-none">+</span> Post Ad
              </Link>
            )}
          </div>
        )}

        <div className="bg-[#111318]/60 backdrop-blur-xl border border-white/[0.04] rounded-sm shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          {hasUsername === false && primaryWallet && (
            <div className="bg-[#FF6B00]/10 border-b border-[#FF6B00]/20 p-4">
              <p className="text-[#FF6B00] text-sm font-medium">
                Set your username to start trading.{' '} <Link to="/account" className="underline font-bold">Complete your profile →</Link>
              </p>
            </div>
          )}

          {/* Header bar with filters */}
          <div className="px-6 py-4 border-b border-[#2b3139]/30">
            <div className="flex items-center gap-4">
              {/* FilterBar takes remaining space */}
              <div className="flex-1 min-w-0">
                <FilterBar
                  tradeType={tradeType}
                  onTradeTypeChange={handleTradeTypeChange}
                  asset={currentAsset}
                  onAssetChange={handleAssetChange}
                  currency={currentCurrency}
                  onCurrencyChange={handleCurrencyChange}
                  amount={amount}
                  onAmountChange={handleAmountChange}
                  paymentMethod={paymentMethod}
                  onPaymentMethodChange={handlePaymentMethodChange}
                  sortBy={sortBy}
                  onSortChange={handleSortChange}
                />
              </div>
            </div>
          </div>

          <div className="p-0">
            {loading && (
              <div className="flex flex-col justify-center items-center py-32 gap-4">
                <img src="/copiale-p2p.svg" alt="Copiale" className="w-12 h-12 mx-auto animate-pulse" />
                <p className="text-[#848e9c] text-sm font-medium mt-3">Synchronizing market data...</p>
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
            ) : !loading && !error && filteredOffers.length === 0 ? (
              <NoOffers isFiltered />
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
              <div className="p-6 border-t border-[#2b3139]/30">
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
