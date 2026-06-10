import { useEffect, useState, useCallback } from 'react';
import { getAdminDisputes, adminReleaseEscrow, adminResolveDispute } from '../../api/admin';

type DisputeEscrow = {
  id: number;
  trade_id: number;
  escrow_address: string | null;
  seller_address: string;
  buyer_address: string;
  amount: string;
  state: string;
  token_type: string;
  network_family: string;
  created_at: string;
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<DisputeEscrow[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [actionMsg, setActionMsg] = useState<string | null>(null);
  const limit = 25;

  const fetch = useCallback(async () => {
    const res = await getAdminDisputes(page, limit);
    setDisputes(res.data.data);
    setTotal(res.data.meta.total);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const handleRelease = async (escrow: DisputeEscrow) => {
    if (!confirm(`Release escrow #${escrow.id} (trade #${escrow.trade_id})?`)) return;
    try {
      await adminReleaseEscrow(escrow.id, {
        signature: `admin-release-${escrow.trade_id}-${Date.now()}`,
        from_address: escrow.seller_address,
      });
      setActionMsg(`Escrow #${escrow.id} released`);
      fetch();
    } catch {
      setActionMsg('Failed to release escrow');
    }
  };

  const handleResolve = async (escrow: DisputeEscrow) => {
    if (!confirm(`Resolve dispute for escrow #${escrow.id} (trade #${escrow.trade_id})?`)) return;
    try {
      await adminResolveDispute(escrow.id, {
        signature: `admin-resolve-${escrow.trade_id}-${Date.now()}`,
        from_address: escrow.seller_address,
      });
      setActionMsg(`Dispute resolved for escrow #${escrow.id}`);
      fetch();
    } catch {
      setActionMsg('Failed to resolve dispute');
    }
  };

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Disputes ({total})</h1>

      {actionMsg && (
        <div className="mb-4 px-4 py-2 bg-[#1c2128] border border-[#2d333b] rounded text-sm text-[#e6edf3]">
          {actionMsg}
        </div>
      )}

      {disputes.length === 0 ? (
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg p-8 text-center text-[#848e9c]">
          No open disputes
        </div>
      ) : (
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2d333b] text-[#848e9c]">
                <th className="text-left p-3">ID</th>
                <th className="text-left p-3">Trade</th>
                <th className="text-left p-3">Seller</th>
                <th className="text-left p-3">Buyer</th>
                <th className="text-right p-3">Amount</th>
                <th className="text-left p-3">Network</th>
                <th className="text-center p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {disputes.map((e) => (
                <tr key={e.id} className="border-b border-[#2d333b] hover:bg-[#22272e]">
                  <td className="p-3 text-[#e6edf3]">#{e.id}</td>
                  <td className="p-3">
                    <a href={`/trade/${e.trade_id}`} className="text-[#539bf5] hover:underline">#{e.trade_id}</a>
                  </td>
                  <td className="p-3 text-[#e6edf3] font-mono text-xs">{e.seller_address.slice(0, 12)}...</td>
                  <td className="p-3 text-[#e6edf3] font-mono text-xs">{e.buyer_address.slice(0, 12)}...</td>
                  <td className="p-3 text-right text-[#e6edf3]">{e.amount} {e.token_type}</td>
                  <td className="p-3 text-[#848e9c] text-xs">{e.network_family}</td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleResolve(e)}
                        className="px-2 py-1 bg-[#d29922] text-black rounded text-xs hover:bg-[#c6901f]"
                      >
                        Resolve
                      </button>
                      <button
                        onClick={() => handleRelease(e)}
                        className="px-2 py-1 bg-[#3fb950] text-black rounded text-xs hover:bg-[#36a34a]"
                      >
                        Release
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

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
