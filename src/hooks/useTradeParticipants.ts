import { useState, useEffect } from 'react';
import { Trade, Account, getAccountById } from '@/api';
import { useUserRole } from './useUserRole';

/**
 * Custom hook to determine and manage trade participants (current user and counterparty)
 *
 * @param trade The trade object containing buyer and seller information
 * @returns Object containing the user's role, current account, counterparty, and loading states
 */
export function useTradeParticipants(trade: Trade | null) {
  const [counterparty, setCounterparty] = useState<Account | null>(null);
  const [isCounterpartyLoading, setIsCounterpartyLoading] = useState(false);

  // Use the existing useUserRole hook to determine the user's role
  const { userRole, currentAccount, isLoading: isUserRoleLoading } = useUserRole(trade);

  // Determine and fetch the counterparty whenever trade, offer, or userRole changes
  useEffect(() => {
    const fetchCounterparty = async () => {
      if (!trade || !currentAccount) return;

      setIsCounterpartyLoading(true);
      try {
        // Determine which account ID to fetch based on the user's role
        let counterpartyAccountId: number | null = null;


        if (userRole === 'buyer') {
          // If current user is buyer, counterparty is seller
          counterpartyAccountId = trade.leg1_seller_account_id ?? null;
        } else {
          // If current user is seller, counterparty is buyer
          counterpartyAccountId = trade.leg1_buyer_account_id ?? null;
        }

        // Ensure we're not fetching the current user's account as counterparty
        if (counterpartyAccountId && counterpartyAccountId !== currentAccount.id) {
          const counterpartyResponse = await getAccountById(counterpartyAccountId);
          setCounterparty(counterpartyResponse.data);
        } else {
          setCounterparty(null);
        }
      } catch (error) {
        console.error('Error fetching counterparty:', error);
        setCounterparty(null);
      } finally {
        setIsCounterpartyLoading(false);
      }
    };

    fetchCounterparty();
  }, [trade, userRole, currentAccount]);

  return {
    userRole,
    currentAccount,
    counterparty,
    isLoading: isUserRoleLoading || isCounterpartyLoading,
  };
}
