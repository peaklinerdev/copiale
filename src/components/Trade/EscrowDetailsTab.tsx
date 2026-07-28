import { RefreshCw, ExternalLink, Copy, Check, ChevronDown, Shield } from 'lucide-react';
import { microToUsdcString } from '@/utils/amounts';
import { formatDistanceToNow } from 'date-fns';
import { TransactionTable } from './TransactionTable';

interface EscrowDetailsTabProps {
  escrowAddress: string | undefined;
  escrowDetails: any;
  balance: string;
  escrowLoading: boolean;
  escrowError: Error | null;
  tradeId: number;
  tradeState?: string;
  cryptoAmount?: string;
  onSwitchToChat: () => void;
  onRefresh: () => void;
}

function formatAmount(amount: unknown): string {
  if (!amount) return '0';
  try { return microToUsdcString(BigInt(amount as string | number | bigint)); } catch { return '0'; }
}

function formatAddr(addr: string): string {
  if (!addr || addr === '11111111111111111111111111111111') return 'None';
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
}

export function EscrowDetailsTab({
  escrowAddress, escrowDetails, balance, escrowLoading, escrowError,
  tradeId, tradeState, cryptoAmount, onRefresh,
}: EscrowDetailsTabProps) {
  const stateStr = escrowDetails
    ? (typeof escrowDetails.state === 'string' ? escrowDetails.state : ['Created', 'Funded', 'FiatPaid', 'Released', 'Cancelled', 'Disputed'][Number(escrowDetails.state)] || 'Unknown')
    : null;

  const stateColors: Record<string, string> = {
    Created: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    Funded: 'text-green-400 bg-green-500/10 border-green-500/20',
    FiatPaid: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
    Released: 'text-green-400 bg-green-500/10 border-green-500/20',
    Cancelled: 'text-red-400 bg-red-500/10 border-red-500/20',
    Disputed: 'text-[#f97316] bg-[#f97316]/10 border-[#f97316]/20',
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const explorerUrl = (addr: string) =>
    `https://explorer.solana.com/address/${addr}?cluster=devnet`;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {escrowError ? (
          <div className="text-center py-8 space-y-3">
            <Shield className="w-10 h-10 text-muted mx-auto" />
            <p className="text-sm font-mono text-muted">
              {tradeState === 'RELEASED' || tradeState === 'CANCELLED'
                ? 'Escrow closed'
                : escrowAddress ? 'Unable to sync escrow data' : 'No escrow created yet'}
            </p>
            {!['RELEASED', 'CANCELLED'].includes(tradeState || '') && !escrowAddress && (
              <p className="text-[10px] font-mono text-muted opacity-60">
                Create escrow on-chain to see details here.
              </p>
            )}
            {(tradeState === 'RELEASED' || tradeState === 'CANCELLED') && (
              <p className="text-[10px] font-mono text-muted opacity-60">
                This trade is complete. Escrow account has been closed on-chain.
              </p>
            )}
            {!['RELEASED', 'CANCELLED'].includes(tradeState || '') && (
              <button onClick={onRefresh}
                className="text-xs font-mono font-bold text-[#f97316] hover:underline">
                Retry
              </button>
            )}
          </div>
        ) : escrowLoading && !escrowDetails ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 text-muted animate-spin" />
          </div>
        ) : escrowDetails ? (
          <>
            {/* Summary header */}
            <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-[9px] font-mono font-bold text-muted tracking-[0.15em] uppercase mb-1">
                    Escrow Balance
                  </p>
                  <p className="text-2xl font-mono font-bold text-white">{balance} USDC</p>
                  <p className="text-xs font-mono text-muted mt-1">
                    of {formatAmount(escrowDetails.amount)} USDC total
                  </p>
                </div>
                {stateStr && (
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-sm border ${stateColors[stateStr] || 'text-muted bg-gray-500/10 border-gray-500/20'}`}>
                    {stateStr}
                  </span>
                )}
              </div>
            </div>

            {/* Trade Details (collapsible) */}
            <details className="group">
              <summary className="text-[9px] font-mono font-bold text-muted tracking-[0.15em] uppercase cursor-pointer hover:text-white flex items-center gap-1 mb-3">
                <ChevronDown className="w-3 h-3 group-open:rotate-180 transition-transform" />
                Trade Details
              </summary>

              {/* Key info grid */}
              <div>
                <p className="text-[8px] font-mono text-muted tracking-[0.10em] uppercase mb-2 mt-2">
                  Escrow Data
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    ['Escrow ID', escrowDetails.escrowId.toString()],
                    ['Trade ID', escrowDetails.tradeId.toString()],
                    ['Fiat Paid', escrowDetails.fiatPaid ? 'Yes' : 'No'],
                    ['Sequential', escrowDetails.sequential ? 'Yes' : 'No'],
                    ['Network', 'Solana Devnet'],
                    ['Token', 'USDC'],
                  ].map(([label, value]) => (
                    <div key={label} className="bg-[#111111] border border-[#1f1f1f] rounded-sm px-3 py-2.5">
                      <p className="text-[9px] font-mono text-muted">{label}</p>
                      <p className="text-[11px] font-mono font-bold text-white mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Addresses */}
              <div className="mt-4">
                <p className="text-[8px] font-mono text-muted tracking-[0.10em] uppercase mb-2">
                  Addresses
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {[
                    ...(escrowAddress ? [['Escrow PDA', escrowAddress]] : []),
                    ['Seller', escrowDetails.seller],
                    ['Buyer', escrowDetails.buyer],
                    ['Arbitrator', escrowDetails.arbitrator],
                  ].map(([label, addr]) => (
                    <div key={label} className="flex items-center gap-2 bg-[#111111] border border-[#1f1f1f] rounded-sm px-3 py-2 group">
                      <span className="text-[9px] font-mono text-muted w-20 shrink-0">{label}</span>
                      <code className="text-[10px] font-mono text-white truncate flex-1">{formatAddr(addr)}</code>
                      <button onClick={() => handleCopy(addr)} title="Copy" className="text-muted hover:text-white opacity-0 group-hover:opacity-100 shrink-0">
                        <Copy className="w-3 h-3" />
                      </button>
                      <a href={explorerUrl(addr)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300 opacity-0 group-hover:opacity-100 shrink-0">
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </details>
          </>
        ) : (
          <div className="text-center py-6">
            <p className="text-[11px] font-mono text-muted">
              {escrowAddress ? 'Loading escrow data...' : 'No escrow created yet'}
            </p>
            <p className="text-[10px] font-mono text-muted mt-1 opacity-60">
              {escrowAddress ? '' : 'Create escrow on-chain to see details here.'}
            </p>
          </div>
        )}

        {/* Transaction history — always visible */}
        <div>
          <p className="text-[9px] font-mono font-bold text-muted tracking-[0.15em] uppercase mb-3">
            Transaction History
          </p>
          <TransactionTable tradeId={tradeId} />
        </div>
      </div>

      {/* Footer */}
      <div className="border-t border-[#1f1f1f] px-4 py-2 flex items-center justify-between shrink-0">
        <span className="text-[9px] font-mono text-muted">Auto-refreshes every 10s</span>
        <button onClick={onRefresh} className="text-muted hover:text-white p-1 rounded-sm">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
