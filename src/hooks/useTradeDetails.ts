import { useState, useEffect } from 'react';
import { getTradeById, getOfferById, getAccountById, Trade, Offer, Account } from '../api';
import { toast } from 'sonner';
import { handleApiError } from '../utils/errorHandling';

interface UseTradeDetailsResult {
  trade: Trade | null;
  offer: Offer | null;
  creator: Account | null;
  buyerAccount: Account | null;
  sellerAccount: Account | null;
  loading: boolean;
  setTrade: React.Dispatch<React.SetStateAction<Trade | null>>;
}

/**
 * Custom hook to fetch and manage trade details
 * @param tradeId The ID of the trade to fetch
 * @returns Trade details and related data
 */
export function useTradeDetails(tradeId: number | null): UseTradeDetailsResult {
  const [trade, setTrade] = useState<Trade | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [buyerAccount, setBuyerAccount] = useState<Account | null>(null);
  const [sellerAccount, setSellerAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tradeId) return;

    // Guard against late-resolving fetches clobbering newer state when
    // tradeId changes or the component unmounts mid-flight.
    let cancelled = false;

    const fetchTradeDetails = async () => {
      setLoading(true);
      try {
        // M5: response shape is `{ network, trade }`.
        const tradeResponse = await getTradeById(tradeId);
        if (cancelled) return;
        const tradeData = tradeResponse.data.trade;
        setTrade(tradeData);

        if (tradeData.leg1_offer_id) {
          const offerResponse = await getOfferById(tradeData.leg1_offer_id);
          if (cancelled) return;
          // Handle potential new API response structure with network wrapper
          const offerData = offerResponse.data.offer || offerResponse.data;
          setOffer(offerData);

          // Creator + buyer + seller accounts are independent — fetch in parallel.
          const [creatorResponse, buyerResponse, sellerResponse] = await Promise.all([
            getAccountById(offerData.creator_account_id),
            tradeData.leg1_buyer_account_id
              ? getAccountById(tradeData.leg1_buyer_account_id)
              : Promise.resolve(null),
            tradeData.leg1_seller_account_id
              ? getAccountById(tradeData.leg1_seller_account_id)
              : Promise.resolve(null),
          ]);
          if (cancelled) return;

          setCreator(creatorResponse.data);
          if (buyerResponse) setBuyerAccount(buyerResponse.data);
          if (sellerResponse) setSellerAccount(sellerResponse.data);
        }
      } catch (err) {
        if (cancelled) return;
        const errorMessage = handleApiError(err, 'Unknown error');
        toast.error(`Failed to load trade details: ${errorMessage}`);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTradeDetails();

    return () => {
      cancelled = true;
    };
  }, [tradeId]);

  return {
    trade,
    offer,
    creator,
    buyerAccount,
    sellerAccount,
    loading,
    setTrade,
  };
}
