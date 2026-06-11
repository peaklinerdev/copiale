import React, { useEffect, useState } from 'react';
import { getHealth, getReadiness, HealthResponse, ReadinessResponse } from '@/api';
import Container from '@/components/Shared/Container';
import { versionInfo } from '@/utils/version';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';


function explorerAddressUrl(
  blockExplorerUrl: string | null | undefined,
  address: string | null | undefined,
): string | null {
  if (!blockExplorerUrl || !address) return null;
  try {
    const base = new URL(blockExplorerUrl);
    if (base.protocol !== 'http:' && base.protocol !== 'https:') return null;
    return new URL(`/address/${encodeURIComponent(address)}`, base.origin).href;
  } catch {
    return null;
  }
}

function formatWalletAddress(address: string | null | undefined): string {
  if (!address) return 'Not Connected';
  if (address.length <= 10) return address;
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatDate(dateString: string | null | undefined): string {
  if (!dateString || dateString === 'unknown' || dateString === 'Invalid Date') {
    return 'Unknown';
  }
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Invalid Date';
    }
    return date.toLocaleString();
  } catch {
    return 'Invalid Date';
  }
}

function StatusBadge({ status }: { status: string }) {
  const isOk = status === 'ok' || status === 'healthy' || status === 'Connected';
  return (
    <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold uppercase tracking-wider ${
      isOk ? 'bg-[#02c076]/10 text-[#02c076]' : 'bg-[#f84960]/10 text-[#f84960]'
    }`}>
      {status}
    </span>
  );
}

export const Status: React.FC = () => {
  const { primaryWallet } = useDynamicContext();
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [readiness, setReadiness] = useState<ReadinessResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [h, r] = await Promise.all([getHealth(), getReadiness().catch(() => null)]);
        setHealth(h.data);
        setReadiness(r ? r.data : null);
      } catch (err) {
        setError('Failed to fetch system status');
        console.error('Health check failed:', err);
      }
    };

    fetchAll();
    const interval = setInterval(fetchAll, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Container>
      <div className="py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-black text-[#eaecef] mb-1">System Status</h1>
          <p className="text-sm text-[#848e9c]">Real-time infrastructure and network monitoring for Copiale-p2p.</p>
        </div>

        {error ? (
          <div className="bg-[#f84960]/10 border border-[#f84960]/20 rounded-sm p-4 text-[#f84960] text-sm">{error}</div>
        ) : health ? (
          <div className="space-y-4">
            {/* System Overview */}
            <div className="border border-[#2b3139] rounded-sm bg-[#111318]">
              <div className="border-b border-[#2b3139] px-5 py-3">
                <h2 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">System Overview</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Status</label>
                      <StatusBadge status={health.status} />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Database</label>
                      <span className="text-sm text-[#eaecef]">{health.dbStatus}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">API Version</label>
                      <span className="text-sm text-[#eaecef]">{health.apiVersion.version}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Frontend Version</label>
                      <span className="text-sm text-[#eaecef]">{versionInfo.version}</span>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Build Timestamp</label>
                      <span className="text-sm text-[#eaecef]">{formatDate(health.apiVersion.buildDate)}</span>
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Connected Wallet</label>
                      {primaryWallet?.address ? (
                        <a
                          href={explorerAddressUrl(
                            health.networks.find(n => n.isActive && n.networkFamily === 'solana') ? 'https://explorer.solana.com' : null,
                            primaryWallet.address
                          ) || '#'}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-[#FF6B00] font-mono hover:underline"
                        >
                          {formatWalletAddress(primaryWallet.address)}
                        </a>
                      ) : (
                        <span className="text-sm text-[#848e9c] font-mono">Not Connected</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* System Readiness */}
            {readiness && (
              <div className="border border-[#2b3139] rounded-sm bg-[#111318]">
                <div className="border-b border-[#2b3139] px-5 py-3">
                  <h2 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">System Readiness</h2>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-3">
                    {Object.entries(readiness.checks).map(([key, value]) => (
                      <div key={key} className="flex items-center gap-2 px-3 py-2 bg-[#0b0e11] border border-[#2b3139] rounded-sm">
                        <div className={`w-2 h-2 rounded-sm ${value ? 'bg-[#02c076]' : 'bg-[#f84960]'}`} />
                        <span className="text-xs font-medium text-[#eaecef] capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Network Infrastructure */}
            <div className="border border-[#2b3139] rounded-sm bg-[#111318]">
              <div className="border-b border-[#2b3139] px-5 py-3">
                <h2 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">Network Status</h2>
              </div>
              <div className="p-5 space-y-4">
                {health.networks
                  .filter(network => !network.name.toLowerCase().includes('celo'))
                  .map(network => (
                    <div key={network.id} className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-4">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold text-[#eaecef]">{network.name}</h3>
                        <StatusBadge status={network.status} />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Network Family</label>
                          <span className="text-[#eaecef] capitalize">{network.networkFamily}</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Active</label>
                          <span className="text-[#eaecef]">{network.isActive ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-[10px] font-bold text-[#848e9c] uppercase block mb-0.5">Program ID</label>
                          {network.programId ? (
                            <a
                              href={explorerAddressUrl(
                                network.networkFamily === 'solana' ? 'https://explorer.solana.com' : null,
                                network.programId
                              ) || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[#FF6B00] font-mono text-xs break-all hover:underline"
                            >
                              {network.programId}
                            </a>
                          ) : (
                            <span className="text-[#848e9c] font-mono text-xs">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </div>

            {/* Database Metrics */}
            <div className="border border-[#2b3139] rounded-sm bg-[#111318]">
              <div className="border-b border-[#2b3139] px-5 py-3">
                <h2 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">Real-time Metrics</h2>
              </div>
              <div className="p-5">
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {[
                    { label: 'Accounts', value: health.database.counts.accounts },
                    { label: 'Escrows', value: health.database.counts.escrows },
                    { label: 'Offers', value: health.database.counts.offers },
                    { label: 'Trades', value: health.database.counts.trades },
                    { label: 'Transactions', value: health.database.counts.transactions },
                  ].map((stat) => (
                    <div key={stat.label} className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-4 text-center">
                      <p className="text-[10px] font-black text-[#848e9c] uppercase tracking-tighter mb-1">{stat.label}</p>
                      <p className="text-2xl font-black text-[#eaecef]">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#FF6B00]" />
            <p className="text-[#848e9c] text-xs font-medium uppercase tracking-widest">Synchronizing Status</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Status;