import { useCallback, useEffect, useState } from 'react';
import { getTradeTransactions, TransactionRecord } from '../../../api';
import { formatDistanceToNow } from 'date-fns';
import { ArrowLeft, ExternalLink, Copy, Check, Info, FileText, Clock, XCircle, CheckCircle2, Loader2 } from 'lucide-react';
import { config } from '../../../config';
import { networkRegistry } from '../../../blockchain/networks';

interface TransactionHistoryProps {
  tradeId: number;
  className?: string;
  alwaysExpanded?: boolean;
  onViewAll?: () => void;
  bare?: boolean;
}

const TYPE_LABELS: Record<string, string> = {
  CREATE_ESCROW: 'Escrow Created', FUND_ESCROW: 'Escrow Funded',
  MARK_FIAT_PAID: 'Fiat Paid', RELEASE_ESCROW: 'Released',
  CANCEL_ESCROW: 'Cancelled', DISPUTE_ESCROW: 'Dispute Opened',
  OPEN_DISPUTE: 'Dispute Opened', RESPOND_DISPUTE: 'Response',
  RESOLVE_DISPUTE: 'Resolved', FIAT_PAID: 'Fiat Paid',
};

const TYPE_ICONS: Record<string, typeof Info> = {
  CREATE_ESCROW: FileText, FUND_ESCROW: FileText, MARK_FIAT_PAID: CheckCircle2,
  RELEASE_ESCROW: CheckCircle2, CANCEL_ESCROW: XCircle, DISPUTE_ESCROW: XCircle,
  RESOLVE_DISPUTE: CheckCircle2,
};

function txLabel(type: string): string {
  return TYPE_LABELS[type] || type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function statusColor(status: string): string {
  switch (status?.toUpperCase()) {
    case 'SUCCESS': return 'bg-green-500/20 text-green-400 border-green-500/30';
    case 'PENDING': return 'bg-[#f97316]/20 text-[#f97316] border-[#f97316]/30';
    case 'FAILED': return 'bg-red-500/20 text-red-400 border-red-500/30';
    default: return 'bg-gray-500/20 text-muted border-gray-500/30';
  }
}

function formatAddr(addr: string): string {
  if (!addr) return '';
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function getTxId(tx: TransactionRecord): string {
  return tx.signature || tx.transaction_hash || '';
}

function explorerUrl(txHash: string, network?: string): string {
  if (!txHash) return '#';
  if (network && network.startsWith('solana')) {
    return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  }
  return `${config.networks.testnet.blockExplorerUrl || 'https://alfajores.celoscan.io'}/tx/${txHash}`;
}

export const TransactionHistory = ({ tradeId, className = '', alwaysExpanded = false, onViewAll, bare = false }: TransactionHistoryProps) => {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState(alwaysExpanded);
  const [copied, setCopied] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetch = useCallback(async () => {
    if (!tradeId || tradeId === 0 || isNaN(tradeId)) return;
    try {
      setRefreshing(true);
      setError(null);
      const res = await getTradeTransactions(tradeId);
      setTransactions(res.data || []);
      setLastUpdated(new Date());
    } catch {
      setError('Failed to load');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => {
    setLoading(true);
    fetch();
    const iv = setInterval(fetch, 60000);
    return () => clearInterval(iv);
  }, [fetch]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  // Hide if empty after load
  // Hide compact view if empty (sidebar). Always show full view in Trade Logs tab.
  if (!loading && !error && transactions.length === 0 && !alwaysExpanded) return null;

  const displayed = expanded ? transactions : transactions.slice(0, 2);

  // ── Compact view ──
  if (!expanded) {
    return (
      <div className={`bg-[#111111] border border-[#1f1f1f] rounded-sm p-3 space-y-2 ${className}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-3.5 h-3.5 text-muted" />
            <span className="text-[10px] font-mono font-bold text-muted tracking-wider uppercase">
              Transactions
            </span>
          </div>
          <button
            onClick={() => onViewAll ? onViewAll() : setExpanded(true)}
            className="text-[10px] font-mono text-[#f97316] hover:underline"
          >
            View all
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-2">
            <Loader2 className="w-4 h-4 text-muted animate-spin" />
          </div>
        ) : error ? (
          <button onClick={fetch} className="text-[10px] font-mono text-[#f97316] hover:underline w-full text-left">
            Sync issue — tap to retry
          </button>
        ) : (
          <div className="space-y-1">
            {displayed.map(tx => {
              const Icon = TYPE_ICONS[tx.transaction_type] || Info;
              return (
                <div key={tx.id} className="flex items-center gap-2 py-1">
                  <Icon className="w-3 h-3 text-muted shrink-0" />
                  <span className="text-[10px] font-mono text-white flex-1 truncate">
                    {txLabel(tx.transaction_type)}
                  </span>
                  <span className={`text-[8px] font-mono px-1.5 py-0 rounded-sm border ${statusColor(tx.status)}`}>
                    {tx.status}
                  </span>
                  <span className="text-[9px] font-mono text-muted tabular-nums">
                    {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : '?'}
                  </span>
                </div>
              );
            })}
            {!loading && transactions.length > 2 && (
              <p className="text-[9px] font-mono text-muted pt-1">
                +{transactions.length - 2} more
              </p>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Expanded full view ──
  return (
    <div className={`${bare ? '' : 'bg-[#111111] border border-[#1f1f1f] rounded-sm overflow-hidden'} ${className}`}>
      {/* Header */}
      {!bare && (
      <div className="border-b border-[#1f1f1f] px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          {!alwaysExpanded && (
            <button onClick={() => setExpanded(false)} className="text-muted hover:text-white p-1 -ml-1">
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}
          <span className="text-[11px] font-mono font-bold text-white tracking-wider uppercase">
            Transaction History
          </span>
          <span className="text-[9px] font-mono text-muted">· {transactions.length} tx</span>
        </div>
        <button onClick={fetch} className="text-muted hover:text-white p-1 rounded-sm">
          <Loader2 className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>
      )}

      {/* Content */}
      <div className="overflow-y-auto max-h-[calc(100vh-200px)]">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-5 h-5 text-muted animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-8 space-y-2">
            <XCircle className="w-8 h-8 text-muted mx-auto" />
            <p className="text-[11px] font-mono text-muted">Unable to load transactions</p>
            <button onClick={fetch} className="text-[10px] font-mono text-[#f97316] hover:underline">
              Retry
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[11px] font-mono text-muted">No transactions for this trade</p>
            <p className="text-[10px] font-mono text-muted mt-1 opacity-60">Transactions appear as the trade progresses</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[#1f1f1f]">
                  {['Type', 'From', 'To', 'Status', 'Time', 'Signature'].map(h => (
                    <th key={h} className="px-3 py-2 text-[9px] font-mono font-bold text-muted tracking-wider uppercase whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {transactions.map(tx => {
                  const Icon = TYPE_ICONS[tx.transaction_type] || Info;
                  const hash = getTxId(tx);
                  return (
                    <tr key={tx.id} className="border-b border-[#1f1f1f]/50 hover:bg-[#1a1a1a] transition">
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <Icon className="w-3 h-3 text-muted shrink-0" />
                          <span className="text-[10px] font-mono text-white whitespace-nowrap">
                            {txLabel(tx.transaction_type)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <code className="text-[10px] font-mono text-muted">
                          {tx.from_address ? formatAddr(tx.from_address) : '—'}
                        </code>
                      </td>
                      <td className="px-3 py-2.5">
                        <code className="text-[10px] font-mono text-muted">
                          {tx.to_address ? formatAddr(tx.to_address) : '—'}
                        </code>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm border ${statusColor(tx.status)}`}>
                          {tx.status}
                        </span>
                      </td>
                      <td className="px-3 py-2.5 text-[10px] font-mono text-muted whitespace-nowrap">
                        {tx.created_at ? formatDistanceToNow(new Date(tx.created_at), { addSuffix: true }) : '—'}
                      </td>
                      <td className="px-3 py-2.5">
                        {hash ? (
                          <div className="flex items-center gap-1">
                            <code className="text-[10px] font-mono text-blue-400">{formatAddr(hash)}</code>
                            <button onClick={() => handleCopy(hash)} className="text-muted hover:text-white">
                              {copied === hash ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
                            </button>
                            <a href={explorerUrl(hash, tx.network)} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:text-blue-300">
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          </div>
                        ) : (
                          <span className="text-[10px] font-mono text-muted italic">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Footer */}
      {!bare && (
      <div className="border-t border-[#1f1f1f] px-4 py-2 flex items-center justify-between">
        <span className="text-[9px] font-mono text-muted">
          {lastUpdated ? `Updated ${formatDistanceToNow(lastUpdated)} ago` : 'Auto-refreshes every minute'}
        </span>
        {!alwaysExpanded && (
          <button onClick={() => setExpanded(false)}
            className="text-[10px] font-mono font-bold text-[#f97316] hover:underline">
            Collapse
          </button>
        )}
      </div>
      )}
    </div>
  );
};

export default TransactionHistory;
