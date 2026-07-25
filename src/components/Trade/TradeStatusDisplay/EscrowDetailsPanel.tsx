import { useState } from 'react';
import { microToUsdcString } from '@/utils/amounts';
import { useEscrowDetails, EscrowState } from '@/hooks/useEscrowDetails';
import { checkAndFundEscrow } from '@/services/chainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import {
  ChevronDown, ChevronUp, RefreshCw, ExternalLink,
  Shield, X, ArrowLeft, Copy, Check, Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface EscrowDetailsPanelProps {
  escrowAddress: string;
  trade: { id: number; leg1_state?: string };
  userRole: 'buyer' | 'seller';
  onExpand?: () => void;
}

const STATE_COLORS: Record<string, string> = {
  CREATED: 'bg-blue-500', FUNDED: 'bg-green-500', RELEASED: 'bg-green-500',
  CANCELLED: 'bg-red-500', DISPUTED: 'bg-[#f97316]', RESOLVED: 'bg-teal-500',
};
const STATE_LABELS: Record<string, string> = {
  CREATED: 'Pending', FUNDED: 'Funded', RELEASED: 'Released',
  CANCELLED: 'Cancelled', DISPUTED: 'Disputed', RESOLVED: 'Resolved',
};

function formatAmount(amount: unknown): string {
  if (!amount) return '0';
  try { return microToUsdcString(BigInt(amount as string | number | bigint)); } catch { return '0'; }
}

function formatAddr(addr: string): string {
  if (!addr || addr === '11111111111111111111111111111111') return 'None';
  return `${addr.slice(0, 5)}...${addr.slice(-5)}`;
}

function explorerUrl(addr: string): string {
  return `https://explorer.solana.com/address/${addr}?cluster=devnet`;
}

export function EscrowDetailsPanel({ escrowAddress, trade, userRole, onExpand }: EscrowDetailsPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [funding, setFunding] = useState(false);
  const [copied, setCopied] = useState(false);
  const { primaryWallet } = useDynamicContext();
  const { escrowDetails, loading, error, balance, refresh } = useEscrowDetails(escrowAddress);

  if (trade.leg1_state === 'RELEASED') return null;

  const stateStr = escrowDetails
    ? (typeof escrowDetails.state === 'string' ? escrowDetails.state : EscrowState[escrowDetails.state])
    : null;

  const needsFunding = escrowDetails && stateStr === 'CREATED' && parseFloat(balance) === 0;

  const handleFund = async () => {
    if (!primaryWallet || !escrowAddress || !escrowDetails) return;
    setFunding(true);
    try {
      toast.info('Funding escrow...', { description: 'Approve the transaction in your wallet.' });
      await checkAndFundEscrow(primaryWallet, escrowAddress);
      toast.success('Escrow funded');
      await refresh();
    } catch (err) {
      toast.error('Funding failed', { description: err instanceof Error ? err.message : 'Unknown error' });
    } finally { setFunding(false); }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Compact sidebar view ──
  if (!expanded) {
    return (
      <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${stateStr ? STATE_COLORS[stateStr] || 'bg-gray-500' : loading ? 'bg-gray-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-[11px] font-mono font-bold text-white uppercase tracking-wider">
              {error ? 'Sync issue' : loading ? 'Loading...' : STATE_LABELS[stateStr || ''] || stateStr || 'Unknown'}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {error && (
              <button onClick={refresh} className="text-[10px] font-mono text-[#f97316] hover:underline">
                Retry
              </button>
            )}
            <button
              onClick={() => onExpand ? onExpand() : setExpanded(true)}
              className="text-muted hover:text-white p-1 rounded-sm hover:bg-[#1f1f1f] transition"
            >
              <ChevronUp className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Escrow amount + balance */}
        {escrowDetails && (
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-muted">Escrow</span>
            <span className="text-white font-bold">{formatAmount(escrowDetails.amount)} USDC</span>
            <span className="text-muted">·</span>
            <span className="text-muted">{balance} USDC held</span>
          </div>
        )}

        {/* Fund button */}
        {userRole === 'seller' && needsFunding && (
          <Button onClick={handleFund} disabled={funding}
            className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-8 text-[11px] tracking-wider">
            {funding ? 'Funding...' : 'Fund Escrow'}
          </Button>
        )}

        {/* Short expand hint */}
        <p className="text-[9px] font-mono text-muted text-right">
          Tap to view full details
        </p>
      </div>
    );
  }

  // ── Expanded full view (replaces content panel) ──
  return (
    <div className="bg-[#111111] border border-[#1f1f1f] rounded-sm overflow-hidden">
      {/* Header */}
      <div className="border-b border-[#1f1f1f] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button onClick={() => setExpanded(false)} className="text-muted hover:text-white p-1 -ml-1">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <span className="text-[11px] font-mono font-bold text-white tracking-wider uppercase">
            Escrow Details
          </span>
          <Badge className={`text-[9px] font-mono px-2 py-0 ${stateStr ? STATE_COLORS[stateStr] : 'bg-gray-500'} text-white border-0`}>
            {stateStr || '...'}
          </Badge>
        </div>
        <button onClick={refresh} className="text-muted hover:text-white p-1 rounded-sm" title="Refresh">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4 overflow-y-auto max-h-[calc(100vh-200px)]">
        {error ? (
          <div className="text-center py-6 space-y-2">
            <Shield className="w-8 h-8 text-muted mx-auto" />
            <p className="text-[11px] font-mono text-muted">Unable to fetch escrow data</p>
            <Button onClick={refresh} variant="outline" size="sm"
              className="border-[#2b3139] text-muted hover:text-white font-mono text-[10px] rounded-sm">
              Retry
            </Button>
          </div>
        ) : loading && !escrowDetails ? (
          <div className="flex items-center justify-center py-6">
            <RefreshCw className="w-5 h-5 text-muted animate-spin" />
          </div>
        ) : escrowDetails ? (
          <>
            {/* Balance highlight */}
            <div className="bg-[#f97316]/5 border border-[#f97316]/10 rounded-sm p-3">
              <p className="text-[9px] font-mono text-muted uppercase tracking-wider mb-1">Balance</p>
              <p className="text-xl font-mono font-bold text-white">{balance} USDC</p>
              <p className="text-[10px] font-mono text-muted mt-1">of {formatAmount(escrowDetails.amount)} USDC total</p>
            </div>

            {/* Key details grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                ['Escrow ID', escrowDetails.escrowId.toString()],
                ['Trade ID', escrowDetails.tradeId.toString()],
                ['Fiat Paid', escrowDetails.fiatPaid ? 'Yes' : 'No'],
                ['Sequential', escrowDetails.sequential ? 'Yes' : 'No'],
              ].map(([label, value]) => (
                <div key={label} className="bg-[#1a1a1a] rounded-sm px-3 py-2">
                  <p className="text-[9px] font-mono text-muted">{label}</p>
                  <p className="text-[11px] font-mono font-bold text-white">{value}</p>
                </div>
              ))}
            </div>

            {/* Addresses */}
            <div className="space-y-1.5">
              <p className="text-[9px] font-mono font-bold text-muted tracking-[0.15em] uppercase">Addresses</p>
              {[
                ['Escrow (PDA)', escrowAddress],
                ['Seller', escrowDetails.seller],
                ['Buyer', escrowDetails.buyer],
                ['Arbitrator', escrowDetails.arbitrator],
              ].map(([label, addr]) => (
                <div key={label} className="flex items-center gap-2 bg-[#1a1a1a] rounded-sm px-3 py-1.5">
                  <span className="text-[9px] font-mono text-muted w-20 shrink-0">{label}</span>
                  <code className="text-[10px] font-mono text-white truncate flex-1">{formatAddr(addr)}</code>
                  <button onClick={() => handleCopy(addr)} className="text-muted hover:text-white shrink-0">
                    {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                  <a href={explorerUrl(addr)} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:text-blue-400 shrink-0">
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              ))}
            </div>

            {/* Fund action */}
            {userRole === 'seller' && needsFunding && (
              <div className="p-3 bg-[#f97316]/5 border border-[#f97316]/10 rounded-sm space-y-2">
                <p className="text-[11px] font-mono font-bold text-[#f97316]">Action Required</p>
                <p className="text-[10px] font-mono text-muted">
                  This escrow is created but unfunded. You must fund it with {formatAmount(escrowDetails.amount)} USDC on Solana devnet to proceed.
                </p>
                <Button onClick={handleFund} disabled={funding}
                  className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-9 text-[11px] tracking-wider">
                  {funding ? 'Funding...' : 'Fund Escrow'}
                </Button>
              </div>
            )}

            {/* Debug (collapsible) */}
            <details className="group">
              <summary className="text-[9px] font-mono text-muted cursor-pointer hover:text-white flex items-center gap-1">
                <Info className="w-3 h-3" /> Debug info
              </summary>
              <pre className="mt-2 text-[9px] font-mono text-muted bg-[#0a0a0a] p-2 rounded-sm overflow-x-auto max-h-[200px]">
                {JSON.stringify({ ...escrowDetails, state: stateStr }, (_, v) => typeof v === 'bigint' ? v.toString() : v, 2)}
              </pre>
            </details>
          </>
        ) : null}
      </div>

      {/* Footer */}
      <div className="border-t border-[#1f1f1f] px-4 py-2 flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted">
          Auto-refreshes every 60s
        </span>
        <button onClick={() => setExpanded(false)}
          className="text-[10px] font-mono font-bold text-[#f97316] hover:underline">
          Collapse
        </button>
      </div>
    </div>
  );
}
