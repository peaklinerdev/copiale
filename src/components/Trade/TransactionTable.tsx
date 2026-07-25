import { useCallback, useEffect, useState } from 'react';
import { getTradeTransactions, TransactionRecord } from '@/api';
import { formatDistanceToNow } from 'date-fns';
import { ExternalLink, Copy, Check, Info, FileText, CheckCircle2, XCircle, Loader2 } from 'lucide-react';

interface TransactionTableProps {
  tradeId: number;
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
  if (network && network.startsWith('solana'))
    return `https://explorer.solana.com/tx/${txHash}?cluster=devnet`;
  return '#';
}

export function TransactionTable({ tradeId }: TransactionTableProps) {
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState('');

  const fetch = useCallback(async () => {
    if (!tradeId) return;
    try {
      setError(null);
      const res = await getTradeTransactions(tradeId);
      setTransactions(res.data || []);
    } catch {
      setError('Failed to load');
    } finally {
      setLoading(false);
    }
  }, [tradeId]);

  useEffect(() => { fetch(); const iv = setInterval(fetch, 60000); return () => clearInterval(iv); }, [fetch]);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(text);
    setTimeout(() => setCopied(''), 2000);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 text-muted animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[11px] font-mono text-muted">{error}</p>
        <button onClick={fetch} className="text-[10px] font-mono text-[#f97316] hover:underline mt-1">Retry</button>
      </div>
    );
  }

  if (transactions.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[11px] font-mono text-muted">No transactions for this trade</p>
        <p className="text-[10px] font-mono text-muted mt-1 opacity-60">Transactions appear as the trade progresses</p>
      </div>
    );
  }

  return (
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
                    <span className="text-[10px] font-mono text-white whitespace-nowrap">{txLabel(tx.transaction_type)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">
                  <code className="text-[10px] font-mono text-muted">{tx.from_address ? formatAddr(tx.from_address) : '—'}</code>
                </td>
                <td className="px-3 py-2.5">
                  <code className="text-[10px] font-mono text-muted">{tx.to_address ? formatAddr(tx.to_address) : '—'}</code>
                </td>
                <td className="px-3 py-2.5">
                  <span className={`text-[8px] font-mono px-1.5 py-0.5 rounded-sm border ${statusColor(tx.status)}`}>{tx.status}</span>
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
                  ) : <span className="text-[10px] font-mono text-muted italic">—</span>}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
