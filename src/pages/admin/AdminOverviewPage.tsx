import { useEffect, useState } from 'react';
import { getAdminTrades, getAdminAccounts, getAdminConfig, getAdminDisputes } from '../../api/admin';

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ trades: 0, accounts: 0, disputes: 0 });
  const [config, setConfig] = useState<{ gas_relay_enabled: boolean; gas_relay_threshold_sol: number } | null>(null);

  useEffect(() => {
    Promise.all([
      getAdminTrades(1, 1).then((r) => r.data.meta.total),
      getAdminAccounts(1, 1).then((r) => r.data.meta.total),
      getAdminDisputes(1, 1).then((r) => r.data.meta.total),
      getAdminConfig().then((r) => r.data),
    ])
      .then(([trades, accounts, disputes, cfg]) => {
        setStats({ trades, accounts, disputes });
        setConfig(cfg);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#e6edf3] mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg p-5">
          <p className="text-sm text-[#848e9c]">Total Trades</p>
          <p className="text-3xl font-bold text-[#e6edf3] mt-1">{stats.trades}</p>
        </div>
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg p-5">
          <p className="text-sm text-[#848e9c]">Total Users</p>
          <p className="text-3xl font-bold text-[#e6edf3] mt-1">{stats.accounts}</p>
        </div>
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg p-5">
          <p className="text-sm text-[#848e9c]">Open Disputes</p>
          <p className="text-3xl font-bold text-[#f14c4c] mt-1">{stats.disputes}</p>
        </div>
      </div>

      {config && (
        <div className="bg-[#1c2128] border border-[#2d333b] rounded-lg p-5">
          <h2 className="text-lg font-semibold text-[#e6edf3] mb-3">Platform Config</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-[#848e9c]">Gas Relay</span>
              <span className={config.gas_relay_enabled ? 'text-[#3fb950]' : 'text-[#f14c4c]'}>
                {config.gas_relay_enabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#848e9c]">Relay Threshold</span>
              <span className="text-[#e6edf3]">{config.gas_relay_threshold_sol} SOL</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
