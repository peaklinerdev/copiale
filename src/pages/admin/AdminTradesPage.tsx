import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { getAdminTrades } from '../../api/admin';

type Trade = {
  id: number;
  leg1_state: string;
  leg1_seller_address?: string;
  leg1_buyer_address?: string;
  leg1_fiat_amount?: string;
  leg1_crypto_amount?: string;
  created_at: string;
};

export default function AdminTradesPage() {
  const [trades, setTrades] = useState<Trade[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetch = useCallback(async () => {
    const res = await getAdminTrades(page, limit);
    setTrades(res.data.data);
    setTotal(res.data.meta.total);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);
  useEffect(() => { setPage(1); }, []);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Trades</h1>

      <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2d333b] text-[#848e9c]">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">State</th>
              <th className="text-left p-3">Seller</th>
              <th className="text-left p-3">Buyer</th>
              <th className="text-right p-3">Amount</th>
              <th className="text-left p-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {trades.map((t) => (
              <tr key={t.id} className="border-b border-[#2d333b] hover:bg-[#22272e]">
                <td className="p-3">
                  <Link to={`/trade/${t.id}`} className="text-[#539bf5] hover:underline">
                    #{t.id}
                  </Link>
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    t.leg1_state === 'CREATED' ? 'bg-[#1c2128] text-[#539bf5] border border-[#539bf5]' :
                    t.leg1_state === 'FIAT_PAID' ? 'bg-[#1c2128] text-[#d29922] border border-[#d29922]' :
                    t.leg1_state === 'RELEASED' ? 'bg-[#1c2128] text-[#3fb950] border border-[#3fb950]' :
                    t.leg1_state === 'DISPUTED' ? 'bg-[#1c2128] text-[#f14c4c] border border-[#f14c4c]' :
                    t.leg1_state === 'CANCELLED' ? 'bg-[#1c2128] text-[#848e9c] border border-[#848e9c]' :
                    'bg-[#1c2128] text-[#e6edf3] border border-[#e6edf3]'
                  }`}>
                    {t.leg1_state}
                  </span>
                </td>
                <td className="p-3 text-[#e6edf3] font-mono text-xs">{t.leg1_seller_address?.slice(0, 12)}...</td>
                <td className="p-3 text-[#e6edf3] font-mono text-xs">{t.leg1_buyer_address?.slice(0, 12)}...</td>
                <td className="p-3 text-right text-[#e6edf3]">{t.leg1_crypto_amount || '-'}</td>
                <td className="p-3 text-[#848e9c] text-xs">{new Date(t.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center mt-4 text-sm text-[#848e9c]">
        <span>Page {page} of {totalPages} ({total} total)</span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 bg-[#2d333b] rounded hover:bg-[#444c56] disabled:opacity-50"
          >
            Prev
          </button>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 bg-[#2d333b] rounded hover:bg-[#444c56] disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
