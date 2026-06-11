import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, QrCode, X, Shield, ExternalLink } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletModalProps { isOpen: boolean; onClose: () => void; }
type View = 'main' | 'deposit' | 'withdraw' | 'tokenDetail';
type TokenType = 'USDT' | 'SOL';

const DepositSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="16" /><polyline points="8 12 12 16 16 12" /><line x1="4" y1="20" x2="20" y2="20" />
  </svg>
);
const WithdrawSvg = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="22" x2="12" y2="8" /><polyline points="8 12 12 8 16 12" /><line x1="4" y1="4" x2="20" y2="4" />
  </svg>
);
const CopySvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);
const RefreshSvg = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);
const TokenIcon = ({ token }: { token: TokenType }) => (
  <div className={`w-9 h-9 rounded-full flex items-center justify-center ${token === 'USDT' ? 'bg-[#02c076]/20' : 'bg-[#9945FF]/20'}`}>
    {token === 'USDT' ? (
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9" /><line x1="12" y1="6" x2="12" y2="18" /><polyline points="8 10 12 6 16 10" /><polyline points="8 14 12 18 16 14" />
      </svg>
    ) : (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="18" x2="18" y2="6" /><polyline points="9 6 18 6 18 15" />
      </svg>
    )}
  </div>
);

const CheckCircleSvg = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" />
  </svg>
);

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address || '';
  const [view, setView] = useState<View>('main');
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDT');
  const [usdtBal, setUsdtBal] = useState(0);
  const [solBal, setSolBal] = useState(0);
  const [usdtAta, setUsdtAta] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Deposit/withdraw state
  const [toAddr, setToAddr] = useState('');
  const [wdAmount, setWdAmount] = useState('');
  const [wdLoading, setWdLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [qrUrl, setQrUrl] = useState('');

  // Token detail
  const [txs, setTxs] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const usdt = usdtBal / 1_000_000;
  const sol = solBal;
  const usdtUsd = usdt;
  const solUsd = sol * 140;
  const totalUsd = usdtUsd + solUsd;
  const usdtPct = totalUsd > 0 ? (usdtUsd / totalUsd * 100) : 0;
  const solPct = 100 - usdtPct;

  const loadData = async () => {
    setLoading(true);
    try {
      const [u, s, ata] = await Promise.all([
        blockchainService.getWalletBalance(),
        blockchainService.getSolBalance(),
        blockchainService.getUsdtAta(),
      ]);
      setUsdtBal(u); setSolBal(s); setUsdtAta(ata);
    } catch { /* */ }
    setLoading(false);
  };
  useEffect(() => { if (isOpen) { setView('main'); loadData(); } }, [isOpen, address]);

  const genQr = async (addr: string) => {
    const QRCode = (await import('qrcode')).default;
    setQrUrl(await QRCode.toDataURL(addr, { width: 200, margin: 1 }));
  };

  const copy = (text: string) => { navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2000); toast.success('Copied'); };

  const depositToken = async (token: TokenType) => {
    setSelectedToken(token); setView('deposit'); setQrUrl('');
    if (token === 'SOL') { genQr(address); return; }
    setCreating(true);
    try { const ata = await blockchainService.createUsdtAta(); setUsdtAta(ata); genQr(ata); }
    catch { toast.error('Failed to create USDT account'); }
    setCreating(false);
  };

  const withdrawToken = (token: TokenType) => { setSelectedToken(token); setView('withdraw'); setToAddr(''); setWdAmount(''); };

  const doWithdraw = async () => {
    if (!toAddr || !wdAmount) return;
    setWdLoading(true);
    try {
      const r = await blockchainService.withdrawUsdt(toAddr, Number(wdAmount));
      if (r.success) { toast.success(`Sent ${wdAmount} USDT`); setToAddr(''); setWdAmount(''); setView('main'); loadData(); }
      else toast.error(r.error || 'Failed');
    } catch (e: any) { toast.error(e?.message || 'Failed'); }
    setWdLoading(false);
  };

  const openDetail = async (token: TokenType) => {
    setSelectedToken(token); setView('tokenDetail'); setTxs([]); setTxLoading(true);
    try {
      const conn = new Connection('https://api.devnet.solana.com', 'confirmed');
      const target = token === 'SOL' ? address : usdtAta;
      if (!target) { setTxLoading(false); return; }
      const sigs = await conn.getSignaturesForAddress(new PublicKey(target), { limit: 10 });
      const parsed: any[] = [];
      for (const s of sigs) {
        try {
          const tx = await conn.getTransaction(s.signature, { maxSupportedTransactionVersion: 0 });
          if (!tx) continue;
          const meta = tx.meta;
          const pre = meta?.preTokenBalances?.find(b => b.mint === (token === 'SOL' ? undefined : '8yonSxM...'));
          const post = meta?.postTokenBalances?.find(b => b.mint === (token === 'SOL' ? undefined : '8yonSxM...'));
          const diff = pre && post ? (post.uiTokenAmount?.uiAmount || 0) - (pre.uiTokenAmount?.uiAmount || 0) : 0;
          parsed.push({
            sig: s.signature,
            time: tx.blockTime || 0,
            err: !!meta?.err,
            amount: token === 'SOL' ? (meta?.preBalances?.[0] && meta?.postBalances?.[0] ? (meta.postBalances[0] - meta.preBalances[0]) / 1e9 : 0) : diff,
          });
        } catch { /* skip */ }
      }
      setTxs(parsed);
    } catch { /* */ }
    setTxLoading(false);
  };

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtSol = (n: number) => n.toFixed(4);
  const explorer = (sig: string) => `https://solscan.io/tx/${sig}?cluster=devnet`;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#0b0e11] border border-[#2b3139] text-[#eaecef] max-w-[340px] w-full rounded-sm p-0 gap-0">
        {/* ── MAIN ── */}
        {view === 'main' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <div>
                  <DialogTitle className="text-[#eaecef] text-base font-bold">Copiale Wallet</DialogTitle>
                  <p className="text-[10px] text-[#848e9c] mt-0.5">Deposit & withdraw across Solana</p>
                </div>
                <button onClick={loadData} className="text-[#848e9c] hover:text-[#eaecef]"><RefreshSvg /></button>
              </div>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-3">
              {/* Total balance */}
              <div className="text-center pt-2">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-0.5">Total Balance</div>
                <div className="text-[24px] font-bold text-[#eaecef] leading-tight">
                  ${loading ? '...' : fmt(totalUsd)}
                </div>
              </div>

              {/* Allocation bar */}
              <div className="flex h-[2px] rounded-full overflow-hidden">
                <div className="bg-[#02c076]" style={{ width: `${Math.max(usdtPct, 1)}%` }} />
                <div className="bg-[#9945FF]" style={{ width: `${Math.max(solPct, 1)}%` }} />
              </div>

              {/* Token list */}
              <div className="space-y-1">
                {([['USDT', fmt(usdt), fmt(usdtUsd), '#02c076'] as const, ['SOL', fmtSol(sol), fmt(solUsd), '#9945FF'] as const]).map(([tkn, bal, usd, color]) => (
                  <button key={tkn} onClick={() => openDetail(tkn as TokenType)}
                    className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-white/[0.03] transition-colors text-left">
                    <div className="flex items-center gap-3">
                      <TokenIcon token={tkn as TokenType} />
                      <div>
                        <div className="text-sm font-bold text-[#eaecef]">{tkn}</div>
                        <div className="text-[10px] text-[#5e6673]">{tkn === 'USDT' ? 'Tether USD' : 'Solana'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#eaecef]">{bal}</div>
                      <div className="text-[10px] text-[#5e6673]">${usd}</div>
                    </div>
                  </button>
                ))}
              </div>

              {/* Deposit / Withdraw — token picker */}
              <p className="text-[9px] text-[#5e6673] uppercase font-bold tracking-wider pt-1">Quick Actions</p>
              <div className="flex gap-2">
                <button onClick={() => depositToken('USDT')} className="flex-1 bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                  <DepositSvg /> Deposit USDT
                </button>
                <button onClick={() => depositToken('SOL')} className="flex-1 bg-[#9945FF]/20 hover:bg-[#9945FF]/30 border border-[#9945FF]/20 text-[#9945FF] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                  <DepositSvg /> Deposit SOL
                </button>
              </div>
              <div className="flex gap-2">
                <button onClick={() => withdrawToken('USDT')} disabled={usdtBal <= 0}
                  className="flex-1 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                  <WithdrawSvg /> Withdraw
                </button>
              </div>
            </div>
          </>
        )}

        {/* ── TOKEN DETAIL ── */}
        {view === 'tokenDetail' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('main')} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">{selectedToken}</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-3">
              {/* Balance */}
              <div className="text-center">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-0.5">{selectedToken} Balance</div>
                <div className="text-xl font-bold text-[#eaecef]">
                  {selectedToken === 'USDT' ? fmt(usdt) : fmtSol(sol)}
                </div>
                <div className="text-[10px] text-[#848e9c]">${selectedToken === 'USDT' ? fmt(usdtUsd) : fmt(solUsd)}</div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <button onClick={() => depositToken(selectedToken)} className="flex-1 bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><DepositSvg /> Deposit</button>
                <button onClick={() => withdrawToken(selectedToken)} disabled={selectedToken === 'USDT' ? usdtBal <= 0 : solBal <= 0}
                  className="flex-1 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><WithdrawSvg /> Withdraw</button>
              </div>

              {/* Transactions */}
              <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider pt-1">Recent Activity</div>
              {txLoading ? (
                <div className="text-center py-6"><Loader2 size={16} className="animate-spin mx-auto text-[#848e9c]" /></div>
              ) : txs.length === 0 ? (
                <div className="text-center text-[10px] text-[#5e6673] py-4">No recent transactions</div>
              ) : (
                <div className="space-y-0.5 max-h-[200px] overflow-y-auto">
                  {txs.map((tx, i) => (
                    <a key={i} href={explorer(tx.sig)} target="_blank" rel="noreferrer"
                      className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-white/[0.03] transition-colors no-underline text-left">
                      <span>{tx.err ? <X size={11} className="text-[#f84960]" /> : <CheckCircleSvg />}</span>
                      <span className={`text-[11px] font-medium min-w-[50px] ${tx.amount > 0 ? 'text-[#02c076]' : 'text-[#f84960]'}`}>
                        {tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toFixed(tx.amount % 1 === 0 ? 0 : 4)}
                      </span>
                      <span className="text-[10px] text-[#5e6673] flex-1 truncate font-mono">{tx.sig.substring(0, 6)}...{tx.sig.substring(tx.sig.length - 4)}</span>
                      <span className="text-[9px] text-[#5e6673] shrink-0">
                        {tx.time ? new Date(tx.time * 1000).toLocaleDateString() : ''}
                      </span>
                    </a>
                  ))}
                </div>
              )}
              <a href={`https://solscan.io/account/${selectedToken === 'SOL' ? address : usdtAta}?cluster=devnet`} target="_blank" rel="noreferrer"
                className="block text-center text-[10px] text-[#FF6B00] hover:underline font-medium py-1">
                View all on Solscan <ExternalLink size={10} className="inline" />
              </a>
            </div>
          </>
        )}

        {/* ── DEPOSIT ── */}
        {view === 'deposit' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('main')} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Deposit {selectedToken}</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-4 text-center">
              {selectedToken === 'USDT' && creating ? (
                <div className="py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#FF6B00] mb-3" /><p className="text-sm text-[#eaecef]">Creating your USDT account...</p></div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-[10px] text-[#f84960] bg-[#f84960]/10 border border-[#f84960]/20 rounded-sm py-2 px-3">
                    <Shield size={12} /> Send only {selectedToken} (Solana) to this address
                  </div>
                  <div className="bg-white p-3 rounded-sm inline-block">
                    {qrUrl ? <img src={qrUrl} alt="QR" className="w-48 h-48" /> : <QrCode size={192} className="text-[#0b0e11]" />}
                  </div>
                  <div className="border border-[#2b3139] rounded-sm p-3 font-mono text-xs text-[#eaecef] break-all bg-white/[0.02]">
                    {selectedToken === 'SOL' ? address : (usdtAta || address)}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => copy(selectedToken === 'SOL' ? address : (usdtAta || address))}
                    className="w-full border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 text-xs">
                    <CopySvg /> <span className="ml-1.5">Copy Address</span>
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {/* ── WITHDRAW ── */}
        {view === 'withdraw' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView('main'); setToAddr(''); setWdAmount(''); }} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Withdraw {selectedToken}</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-4">
              <div className="border border-[#2b3139] rounded-sm p-3 bg-white/[0.02]">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-0.5">Available</div>
                <div className="text-lg font-bold text-[#eaecef]">
                  {selectedToken === 'USDT' ? fmt(usdt) : fmtSol(sol)} <span className="text-sm text-[#848e9c] font-normal">{selectedToken}</span>
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Destination</label>
                <Input placeholder="Wallet address or token account" value={toAddr} onChange={e => setToAddr(e.target.value)}
                  className="bg-transparent border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Amount ({selectedToken})</label>
                <div className="flex gap-2">
                  <Input type="text" inputMode="decimal" placeholder="0.00" value={wdAmount}
                    onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setWdAmount(e.target.value); }}
                    className="bg-transparent border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1" />
                  <button onClick={() => setWdAmount((selectedToken === 'USDT' ? usdt : sol).toFixed(selectedToken === 'SOL' ? 4 : 2))}
                    className="border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs font-medium">Max</button>
                </div>
              </div>
              <Button onClick={doWithdraw} disabled={!toAddr || !wdAmount || wdLoading}
                className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm">
                {wdLoading ? <><Loader2 size={15} className="animate-spin mr-2" /> Sending...</> : `Withdraw ${wdAmount || '0'} ${selectedToken}`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
