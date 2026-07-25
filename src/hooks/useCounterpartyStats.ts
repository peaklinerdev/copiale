import { useState, useEffect } from 'react';
import api from '@/api';

interface CounterpartyStats {
  id: number;
  username: string;
  profile_photo_url: string | null;
  telegram_username: string | null;
  created_at: string;
  stats: {
    total: number;
    completed: number;
    disputes: number;
    cancelled: number;
    open: number;
    completionRate: number;
  };
}

export function useCounterpartyStats(tradeId: number | undefined) {
  const [counterparty, setCounterparty] = useState<CounterpartyStats | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tradeId) return;
    setLoading(true);
    api.get(`/trades/${tradeId}/counterparty`)
      .then(res => setCounterparty(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tradeId]);

  return { counterparty, loading };
}
