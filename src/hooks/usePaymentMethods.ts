import { useState, useEffect, useCallback } from 'react';
import api from '@/api';

export interface UserPaymentMethod {
  id: number;
  method_type: string;
  account_name: string | null;
  account_number: string;
  notes: string | null;
}

export function usePaymentMethods() {
  const [methods, setMethods] = useState<UserPaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get('/accounts/me/payment-methods');
      setMethods(res.data);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const add = async (data: { method_type: string; account_name?: string; account_number: string; notes?: string }) => {
    const res = await api.post('/accounts/me/payment-methods', data);
    setMethods(prev => [...prev, res.data]);
    return res.data;
  };

  const remove = async (id: number) => {
    await api.delete(`/accounts/me/payment-methods/${id}`);
    setMethods(prev => prev.filter(m => m.id !== id));
  };

  return { methods, loading, fetch, add, remove };
}
