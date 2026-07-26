import { useState, useCallback, useEffect } from 'react';
import { Offer } from '../api';

interface UseOfferFilteringProps {
  offers: Offer[];
  itemsPerPage: number;
  creatorNames?: Record<number, string>;
}

interface UseOfferFilteringResult {
  filteredOffers: Offer[];
  tradeType: string;
  currentCurrency: string;
  currentAsset: string;
  amount: string;
  paymentMethod: string;
  sortBy: string;
  currentPage: number;
  totalPages: number;
  search: string;
  handleCurrencyChange: (currency: string) => void;
  handleTradeTypeChange: (type: string) => void;
  handleAssetChange: (asset: string) => void;
  handleAmountChange: (amount: string) => void;
  handlePaymentMethodChange: (method: string) => void;
  handleSortChange: (sort: string) => void;
  handlePageChange: (page: number) => void;
  handleSearchChange: (val: string) => void;
}

/**
 * Custom hook to handle filtering and pagination of offers
 */
export const useOfferFiltering = ({
  offers,
  itemsPerPage,
  creatorNames,
}: UseOfferFilteringProps): UseOfferFilteringResult => {
  const [filteredOffers, setFilteredOffers] = useState<Offer[]>([]);
  const [tradeType, setTradeType] = useState<string>('BUY'); // Default to BUY as per Binance
  const [currentCurrency, setCurrentCurrency] = useState<string>('ETB');
  const [currentAsset, setCurrentAsset] = useState<string>('USDT'); // Default to USDT (primary trading token)
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('PRICE');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [search, setSearch] = useState<string>('');

  // Function to apply all active filters - memoized to prevent unnecessary recreations
  const applyFilters = useCallback(() => {
    let filtered = [...offers];

    // Filter by trade type
    if (tradeType === 'BUY') {
      filtered = filtered.filter(offer => offer.offer_type === 'SELL');
    } else if (tradeType === 'SELL') {
      filtered = filtered.filter(offer => offer.offer_type === 'BUY');
    }

    // Filter by Asset
    if (currentAsset !== 'ALL') {
      filtered = filtered.filter(offer => offer.token === currentAsset);
    }

    // Filter by currency
    if (currentCurrency !== 'ALL') {
      filtered = filtered.filter(offer => offer.fiat_currency === currentCurrency);
    }

    // Filter by Amount
    if (amount) {
      const numAmount = parseFloat(amount);
      if (!isNaN(numAmount)) {
        filtered = filtered.filter(offer => {
          const min = parseFloat(offer.min_amount);
          const max = parseFloat(offer.max_amount || offer.total_available_amount);
          return numAmount >= min && numAmount <= max;
        });
      }
    }

    // Filter by Payment Method - checks payment_methods array first, then falls back to terms regex
    if (paymentMethod !== 'ALL') {
      filtered = filtered.filter(offer => {
        if (offer.payment_methods?.length) {
          return offer.payment_methods.some(m => m.toLowerCase() === paymentMethod.toLowerCase() || m.toLowerCase().includes(paymentMethod.toLowerCase()));
        }
        const match = offer.terms?.match(/Payment Methods?:\s*(.+)/);
        if (!match) return false;
        const methodName = match[1].trim().toLowerCase();
        const target = paymentMethod.toLowerCase();
        if (target === 'bank_transfer') {
          return methodName.includes('bank') || methodName === 'bank transfer';
        }
        return methodName === target || methodName.includes(target);
      });
    }

    // Search filter — fuzzy match across multiple fields
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      filtered = filtered.filter(offer => {
        const idStr = String(offer.id);
        if (idStr.includes(q)) return true;
        if (offer.terms?.toLowerCase().includes(q)) return true;
        if (offer.payment_methods?.some(m => m.toLowerCase().includes(q))) return true;
        if (offer.token?.toLowerCase().includes(q)) return true;
        const name = creatorNames?.[offer.creator_account_id];
        if (name?.toLowerCase().includes(q)) return true;
        return false;
      });
    }

    // Sorting
    if (sortBy === 'PRICE') {
      filtered.sort((a, b) => {
        const rateA = parseFloat(a.rate_adjustment);
        const rateB = parseFloat(b.rate_adjustment);
        return tradeType === 'BUY' ? rateA - rateB : rateB - rateA;
      });
    } else if (sortBy === 'TRADES') {
      // Sort by recency as proxy for trade volume
      filtered.sort((a, b) =>
        new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );
    } else if (sortBy === 'RATING') {
      // Sort by creator ID as a stable proxy (ratings not yet implemented)
      filtered.sort((a, b) => a.creator_account_id - b.creator_account_id);
    }

    // Calculate total pages
    const total = Math.ceil(filtered.length / itemsPerPage);
    setTotalPages(total);

    // Get current page's offers
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedOffers = filtered.slice(startIndex, endIndex);

    setFilteredOffers(paginatedOffers);
  }, [offers, tradeType, currentAsset, currentCurrency, amount, paymentMethod, sortBy, currentPage, search, creatorNames, itemsPerPage]);

  // Apply filters whenever dependencies change
  useEffect(() => {
    applyFilters();
  }, [applyFilters]);

  const handleCurrencyChange = (currency: string) => {
    setCurrentCurrency(currency);
    setCurrentPage(1);
  };

  const handleTradeTypeChange = (type: string) => {
    setTradeType(type);
    setCurrentPage(1);
  };

  const handleAssetChange = (asset: string) => {
    setCurrentAsset(asset);
    setCurrentPage(1);
  };

  const handleAmountChange = (val: string) => {
    setAmount(val);
    setCurrentPage(1);
  };

  const handlePaymentMethodChange = (method: string) => {
    setPaymentMethod(method);
    setCurrentPage(1);
  };

  const handleSortChange = (sort: string) => {
    setSortBy(sort);
    setCurrentPage(1);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (val: string) => {
    setSearch(val);
    setCurrentPage(1);
  };

  return {
    filteredOffers,
    tradeType,
    currentCurrency,
    currentAsset,
    amount,
    paymentMethod,
    sortBy,
    currentPage,
    totalPages,
    search,
    handleCurrencyChange,
    handleTradeTypeChange,
    handleAssetChange,
    handleAmountChange,
    handlePaymentMethodChange,
    handleSortChange,
    handlePageChange,
    handleSearchChange,
  };
};
