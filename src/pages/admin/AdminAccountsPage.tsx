import { useEffect, useState, useCallback } from 'react';
import { getAdminAccounts, type AdminAccount } from '../../api/admin';

export default function AdminAccountsPage() {
  const [accounts, setAccounts] = useState<AdminAccount[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 25;

  const fetch = useCallback(async () => {
    const res = await getAdminAccounts(page, limit);
    setAccounts(res.data.data);
    setTotal(res.data.meta.total);
  }, [page]);

  useEffect(() => { fetch(); }, [fetch]);

  const totalPages = Math.ceil(total / limit);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Users ({total})</h1>

      <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#2d333b] text-[#848e9c]">
              <th className="text-left p-3">ID</th>
              <th className="text-left p-3">Username</th>
              <th className="text-left p-3">Email</th>
              <th className="text-left p-3">Wallet</th>
              <th className="text-left p-3">Role</th>
              <th className="text-left p-3">Telegram</th>
              <th className="text-left p-3">Joined</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((a) => (
              <tr key={a.id} className="border-b border-[#2d333b] hover:bg-[#22272e]">
                <td className="p-3 text-[#848e9c]">{a.id}</td>
                <td className="p-3 text-[#e6edf3] font-medium">{a.username}</td>
                <td className="p-3 text-[#e6edf3]">{a.email}</td>
                <td className="p-3 text-[#e6edf3] font-mono text-xs">{a.wallet_address.slice(0, 16)}...</td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                    a.role === 'admin' ? 'bg-[#1c2128] text-[#d29922] border border-[#d29922]' : 'text-[#848e9c]'
                  }`}>
                    {a.role}
                  </span>
                </td>
                <td className="p-3 text-[#848e9c]">{a.telegram_username || '-'}</td>
                <td className="p-3 text-[#848e9c] text-xs">{new Date(a.created_at).toLocaleDateString()}</td>
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
