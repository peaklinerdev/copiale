import React, { useEffect, useState } from 'react';
import { getHealth, getReadiness, HealthResponse, ReadinessResponse } from '@/api';
import Container from '@/components/Shared/Container';
import { versionInfo } from '@/utils/version';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

// GitHub repository configuration - Replaced with generic placeholder
const GITHUB_REPO_URL = 'https://github.com/Copiale/copiale-p2p';

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

function getGitHubCommitUrl(commitHash: string | null | undefined): string | null {
  if (!commitHash || commitHash === 'unknown') return null;
  return `${GITHUB_REPO_URL}/commit/${commitHash}`;
}

function CommitHashLink({ 
  commitHash, 
}: { 
  commitHash: string | null | undefined; 
}) {
  if (!commitHash || commitHash === 'unknown') {
    return <span className="text-slate-500">Unknown</span>;
  }

  const shortHash = commitHash.length > 7 ? commitHash.substring(0, 7) : commitHash;
  const url = getGitHubCommitUrl(commitHash);
  
  if (url) {
    return <a href={url} target="_blank" rel="noopener noreferrer" className="font-mono text-sm text-gold-500 hover:text-gold-400 transition-colors">{shortHash}</a>;
  }
  return <span className="font-mono text-sm text-slate-300">{shortHash}</span>;
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
      <div className="py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-black text-slate-50 mb-2">System Status</h1>
          <p className="text-slate-400">Real-time infrastructure and network monitoring for Copiale-p2p.</p>
        </div>

        {error ? (
          <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6 text-red-400">{error}</div>
        ) : health ? (
          <div className="grid grid-cols-1 gap-8">
            {/* Basic Overview */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6 text-gold-500 uppercase tracking-widest text-sm">System Overview</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Status</label>
                    <span className="text-lg font-semibold text-emerald-500">{health.status}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Database</label>
                    <span className="text-slate-200">{health.dbStatus}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">API Version</label>
                    <span className="text-slate-200">{health.apiVersion.version} <CommitHashLink commitHash={health.apiVersion.gitCommitHash} /></span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Frontend Version</label>
                    <span className="text-slate-200">{versionInfo.version}</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Build Timestamp</label>
                    <span className="text-slate-200 text-sm">{formatDate(health.apiVersion.buildDate)}</span>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-500 uppercase block mb-1">Connected Wallet</label>
                    {primaryWallet?.address ? (
                      <a 
                        href={explorerAddressUrl(
                          health.networks.find(n => n.isActive && n.networkFamily === 'solana') ? 'https://explorer.solana.com' : null,
                          primaryWallet.address
                        ) || '#'} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="text-slate-300 font-mono text-sm hover:text-gold-400 transition-colors underline decoration-slate-500/30"
                      >
                        {formatWalletAddress(primaryWallet.address)}
                      </a>
                    ) : (
                      <span className="text-slate-500 font-mono text-sm">Not Connected</span>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* System Readiness */}
            {readiness && (
              <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
                <h2 className="text-xl font-bold mb-6 text-gold-500 uppercase tracking-widest text-sm">System Readiness</h2>
                <div className="flex flex-wrap gap-4">
                  {Object.entries(readiness.checks).map(([key, value]) => (
                    <div key={key} className="bg-slate-950 border border-slate-800 rounded-lg px-4 py-2 flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${value ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                      <span className="text-sm font-medium text-slate-300 capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Network Infrastructure */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6 text-gold-500 uppercase tracking-widest text-sm">Network Status</h2>
              <div className="space-y-6">
                {health.networks
                  .filter(network => !network.name.toLowerCase().includes('celo'))
                  .map(network => (
                    <div key={network.id} className="bg-slate-950 border border-slate-800 rounded-xl p-6">
                      <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-slate-50">{network.name}</h3>
                        <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            network.status === 'Connected' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-red-500/10 text-red-500'
                          }`}>
                          {network.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Network Family</label>
                          <span className="text-slate-300 capitalize">{network.networkFamily}</span>
                        </div>
                        <div>
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Active</label>
                          <span className="text-slate-300">{network.isActive ? 'Yes' : 'No'}</span>
                        </div>
                        <div className="lg:col-span-2">
                          <label className="text-[10px] font-bold text-slate-600 uppercase block mb-1">Program ID</label>
                          {network.programId ? (
                            <a 
                              href={explorerAddressUrl(
                                network.networkFamily === 'solana' ? 'https://explorer.solana.com' : null, 
                                network.programId
                              ) || '#'} 
                              target="_blank" 
                              rel="noopener noreferrer" 
                              className="text-gold-500 hover:text-gold-400 font-mono text-xs break-all underline decoration-gold-500/30"
                            >
                              {network.programId}
                            </a>
                          ) : (
                            <span className="text-slate-400 font-mono text-xs">N/A</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </section>

            {/* Database Metrics */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-8">
              <h2 className="text-xl font-bold mb-6 text-gold-500 uppercase tracking-widest text-sm">Real-time Metrics</h2>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {[
                  { label: 'Accounts', value: health.database.counts.accounts },
                  { label: 'Escrows', value: health.database.counts.escrows },
                  { label: 'Offers', value: health.database.counts.offers },
                  { label: 'Trades', value: health.database.counts.trades },
                  { label: 'Transactions', value: health.database.counts.transactions },
                ].map((stat) => (
                  <div key={stat.label} className="bg-slate-950 p-6 rounded-xl border border-slate-800 text-center">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-2">{stat.label}</p>
                    <p className="text-3xl font-black text-slate-100">{stat.value}</p>
                  </div>
                ))}
              </div>
            </section>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 gap-4">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-gold-500"></div>
            <p className="text-slate-500 font-medium animate-pulse uppercase tracking-widest text-xs">Synchronizing Status</p>
          </div>
        )}
      </div>
    </Container>
  );
};

export default Status;
