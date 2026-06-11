import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { Loader2, QrCode, ExternalLink, ChevronRight, AlertTriangle } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Connection, PublicKey } from '@solana/web3.js';
import solLogo from '@/assets/sol.svg';
import usdtLogo from '@/assets/usdt.svg';

interface Props { isOpen: boolean; onClose: () => void; }
type Token = 'USDT' | 'SOL';
type View = 'overview' | 'detail' | 'deposit' | 'withdraw';

/* ── Inline SVGs ── */
const BackSvg = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>);
const CloseSvg = () => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);
const RefreshSvg = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>);
const DepositSvg = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="2" x2="12" y2="16" /><polyline points="8 12 12 16 16 12" /><line x1="4" y1="20" x2="20" y2="20" /></svg>);
const WithdrawSvg = () => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="22" x2="12" y2="8" /><polyline points="8 12 12 8 16 12" /><line x1="4" y1="4" x2="20" y2="4" /></svg>);
const CopySvg = () => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>);
const CheckSvg = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02c076" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>);
const FailSvg = () => (<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#f84960" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>);

export function WalletModal({ isOpen, onClose }: Props) {
  const { primaryWallet } = useDynamicContext();
  const addr = primaryWallet?.address || '';
  const [view, setView] = useState<View>('overview');
  const [token, setToken] = useState<Token>('USDT');
  const [usdtBal, setUsdtBal] = useState(0);
  const [solBal, setSolBal] = useState(0);
  const [usdtAta, setUsdtAta] = useState('');
  const [loading, setLoading] = useState(true);
  const [to, setTo] = useState('');
  const [amt, setAmt] = useState('');
  const [wd, setWd] = useState(false);
  const [creating, setCreating] = useState(false);
  const [qr, setQr] = useState('');
  const [txs, setTxs] = useState<any[]>([]);
  const [txLoad, setTxLoad] = useState(false);

  const usdt = usdtBal / 1_000_000;
  const sol = solBal;
  const usdtUsd = usdt;
  const solUsd = sol * 140;
  const total = usdtUsd + solUsd;
  const usdtPct = total > 0 ? usdtUsd / total * 100 : 0;
  const solPct = 100 - usdtPct;

  const load = async () => {
    setLoading(true);
    try { const [u, s, a] = await Promise.all([blockchainService.getWalletBalance(), blockchainService.getSolBalance(), blockchainService.getUsdtAta()]); setUsdtBal(u); setSolBal(s); setUsdtAta(a); } catch { /* */ }
    setLoading(false);
  };
  useEffect(() => { if (isOpen) { setView('overview'); load(); } }, [isOpen, addr]);

  const fmt = (n: number) => n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const fmtSol = (n: number) => n.toFixed(4);
  const copy = (t: string) => { navigator.clipboard.writeText(t); toast.success('Copied'); };

  const genQr = async (a: string) => { const Q = (await import('qrcode')).default; setQr(await Q.toDataURL(a, { width: 160, margin: 1 })); };

  const goDeposit = async (t: Token) => { setToken(t); setView('deposit'); setQr(''); if (t === 'SOL') { genQr(addr); return; } setCreating(true); try { const a = await blockchainService.createUsdtAta(); setUsdtAta(a); genQr(a); } catch { toast.error('Failed'); } setCreating(false); };

  const goWithdraw = (t: Token) => { setToken(t); setView('withdraw'); setTo(''); setAmt(''); };
  const doWithdraw = async () => { if (!to || !amt) return; setWd(true); try { const r = await blockchainService.withdrawUsdt(to, Number(amt)); if (r.success) { toast.success(`Sent ${amt} USDT`); setTo(''); setAmt(''); setView('overview'); load(); } else toast.error(r.error || 'Failed'); } catch (e: any) { toast.error(e?.message || 'Failed'); } setWd(false); };

  const goDetail = async (t: Token) => { setToken(t); setView('detail'); setTxs([]); setTxLoad(true);
    try { const c = new Connection('https://api.devnet.solana.com', 'confirmed'); const target = t === 'SOL' ? addr : usdtAta; if (!target) { setTxLoad(false); return; }
      const sigs = await c.getSignaturesForAddress(new PublicKey(target), { limit: 10 }); const p: any[] = [];
      for (const s of sigs) { try { const tx = await c.getTransaction(s.signature, { maxSupportedTransactionVersion: 0 }); if (!tx) continue; const meta = tx.meta; const pre = meta?.preTokenBalances?.find(b => b.mint === (t === 'SOL' ? undefined : '8yonSxM...')); const post = meta?.postTokenBalances?.find(b => b.mint === (t === 'SOL' ? undefined : '8yonSxM...')); const diff = pre && post ? (post.uiTokenAmount?.uiAmount || 0) - (pre.uiTokenAmount?.uiAmount || 0) : t === 'SOL' ? (meta?.preBalances?.[0] && meta?.postBalances?.[0] ? (meta.postBalances[0] - meta.preBalances[0]) / 1e9 : 0) : 0; p.push({ sig: s.signature, time: tx.blockTime || 0, err: !!meta?.err, amount: diff }); } catch { /* */ } }
      setTxs(p); } catch { /* */ } setTxLoad(false);
  };
  const explorer = (s: string) => `https://solscan.io/tx/${s}?cluster=devnet`;
  const explorerAcct = (t: Token) => `https://solscan.io/account/${t === 'SOL' ? addr : usdtAta}?cluster=devnet`;

  /* ── Modal shell ── */
  return (
    <div style={isOpen ? {} : { display: 'none' }}>
      {isOpen && <div className="fixed inset-0 z-50 flex items-center justify-center" onClick={onClose}>
        <div className="relative bg-[#0b0e11] border border-[#2b3139] rounded-sm w-[380px] max-h-[90vh] overflow-y-auto shadow-[0_8px_32px_rgba(0,0,0,0.6)]" onClick={e => e.stopPropagation()}>
          {/* ── OVERVIEW ── */}
          {view === 'overview' && (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-3">
                <div>
                  <h2 className="text-base font-bold text-[#eaecef]">Copiale wallet</h2>
                  <p className="text-[10px] text-[#848e9c] mt-0.5">Deposit &amp; withdraw across Solana</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={load} className="text-[#848e9c] hover:text-[#eaecef]"><RefreshSvg /></button>
                  <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef]"><CloseSvg /></button>
                </div>
              </div>
              <div className="px-5 pb-5">
                {/* Total */}
                <div className="text-center pt-2 pb-3">
                  <p className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Total balance</p>
                  <p className="text-[28px] font-bold text-[#eaecef] leading-tight mt-0.5">${loading ? '...' : fmt(total)}</p>
                </div>
                {/* Allocation */}
                <div className="flex h-[3px] rounded-full overflow-hidden">
                  <div style={{ width: `${Math.max(usdtPct, 2)}%`, background: '#FF6B00' }} />
                  <div style={{ width: `${Math.max(solPct, 2)}%`, background: '#9945FF' }} />
                </div>
                <div className="flex justify-between text-[9px] mt-1 text-[#5e6673]">
                  <span className="text-[#FF6B00]">{usdtPct.toFixed(0)}% USDT</span>
                  <span className="text-[#9945FF]">{solPct.toFixed(0)}% SOL</span>
                </div>

                {/* Token rows */}
                <div className="mt-3 space-y-0.5">
                  {[
                    { t: 'USDT' as Token, bal: fmt(usdt), usd: fmt(usdtUsd), color: '#FF6B00' },
                    { t: 'SOL' as Token, bal: fmtSol(sol), usd: fmt(solUsd), color: '#9945FF' },
                  ].map(({ t, bal, usd, color }) => (
                    <button key={t} onClick={() => goDetail(t)} className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-white/[0.03] text-left">
                      <div className="flex items-center gap-3">
                        <img src={t === 'USDT' ? usdtLogo : solLogo} alt={t} className="w-9 h-9 rounded-full" />
                        <div>
                          <p className="text-sm font-bold text-[#eaecef]">{t === 'USDT' ? 'Tether USD' : 'Solana'}</p>
                          <p className="text-[10px] text-[#5e6673]">{t}{t === 'SOL' ? '' : ' · SPL'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="text-right"><p className="text-xs font-bold text-[#eaecef]">{bal}</p><p className="text-[10px] text-[#5e6673]">${usd}</p></div>
                        <ChevronRight size={14} className="text-[#5e6673]" />
                      </div>
                    </button>
                  ))}
                </div>

                {/* Quick actions */}
                <p className="text-[9px] text-[#5e6673] uppercase font-bold tracking-wider mt-3 mb-2">Quick actions</p>
                <div className="flex gap-2">
                  <button onClick={() => goDeposit('USDT')} className="flex-1 bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><DepositSvg /> Deposit USDT</button>
                  <button onClick={() => goDeposit('SOL')} className="flex-1 bg-[#9945FF]/20 hover:bg-[#9945FF]/30 border border-[#9945FF]/30 text-[#9945FF] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><DepositSvg /> Deposit SOL</button>
                </div>
                <button onClick={() => goWithdraw('USDT')} disabled={usdtBal <= 0} className="w-full mt-2 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><WithdrawSvg /> Withdraw</button>
              </div>
            </>
          )}

          {/* ── TOKEN DETAIL ── */}
          {view === 'detail' && (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <button onClick={() => setView('overview')} className="text-[#848e9c] hover:text-[#eaecef]"><BackSvg /></button>
                <h2 className="text-base font-bold text-[#eaecef]">{token}</h2>
                <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef]"><CloseSvg /></button>
              </div>
              <div className="px-5 pb-5">
                <div className="text-center py-3">
                  <p className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">{token} balance</p>
                  <p className="text-[22px] font-bold text-[#eaecef] mt-0.5">{token === 'USDT' ? fmt(usdt) : fmtSol(sol)}</p>
                  <p className="text-[10px] text-[#848e9c]">${token === 'USDT' ? fmt(usdtUsd) : fmt(solUsd)}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => goDeposit(token)} className="flex-1 bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><DepositSvg /> Deposit</button>
                  <button onClick={() => goWithdraw(token)} disabled={(token === 'USDT' ? usdtBal : solBal) <= 0} className="flex-1 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5"><WithdrawSvg /> Withdraw</button>
                </div>
                <div className="border-t border-[#2b3139] my-3" />
                <p className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-2">Recent activity</p>
                {txLoad ? <div className="text-center py-6"><Loader2 size={16} className="animate-spin mx-auto text-[#848e9c]" /></div> : txs.length === 0 ? <p className="text-center text-[10px] text-[#5e6673] py-4">No recent transactions</p> : (
                  <div className="max-h-[180px] overflow-y-auto">
                    {txs.map((tx, i) => (
                      <a key={i} href={explorer(tx.sig)} target="_blank" rel="noreferrer"
                        className="flex items-center gap-2 px-1 py-1.5 border-b border-white/[0.05] hover:bg-white/[0.02] no-underline text-left last:border-b-0">
                        <span className="shrink-0">{tx.err ? <FailSvg /> : <CheckSvg />}</span>
                        <span className={`text-[11px] font-medium w-16 shrink-0 ${tx.amount > 0 ? 'text-[#02c076]' : 'text-[#f84960]'}`}>{tx.amount > 0 ? '+' : ''}{Math.abs(tx.amount).toFixed(tx.amount % 1 === 0 ? 0 : 4)}</span>
                        <span className="text-[10px] text-[#5e6673] flex-1 truncate font-mono">{tx.sig.substring(0, 6)}...{tx.sig.substring(tx.sig.length - 4)}</span>
                        <span className="text-[9px] text-[#5e6673] shrink-0">{tx.time ? new Date(tx.time * 1000).toLocaleDateString() : ''}</span>
                      </a>
                    ))}
                  </div>
                )}
                <a href={explorerAcct(token)} target="_blank" rel="noreferrer" className="block text-center text-[10px] text-[#FF6B00] hover:underline font-medium mt-2">
                  View all on Solscan <ExternalLink size={10} className="inline" />
                </a>
              </div>
            </>
          )}

          {/* ── DEPOSIT ── */}
          {view === 'deposit' && (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <button onClick={() => setView('overview')} className="text-[#848e9c] hover:text-[#eaecef]"><BackSvg /></button>
                <h2 className="text-base font-bold text-[#eaecef]">Deposit {token}</h2>
                <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef]"><CloseSvg /></button>
              </div>
              <div className="px-5 pb-5 space-y-4 text-center">
                {token === 'USDT' && creating ? (
                  <div className="py-12"><Loader2 size={28} className="animate-spin mx-auto text-[#FF6B00] mb-3" /><p className="text-sm text-[#eaecef]">Creating your USDT account...</p></div>
                ) : (
                  <>
                    <div className="flex items-center justify-center gap-2 text-[10px] text-[#fbbf24] bg-[#fbbf24]/10 border border-[#fbbf24]/20 rounded-sm py-2 px-3">
                      <AlertTriangle size={12} /> Send only {token} (Solana) to this address
                    </div>
                    <div className="bg-white p-3 rounded-sm inline-block">
                      {qr ? <img src={qr} alt="QR" className="w-[140px] h-[140px]" /> : <QrCode size={140} className="text-[#0b0e11]" />}
                    </div>
                    <div className="border border-[#2b3139] rounded-sm p-3 font-mono text-[11px] text-[#eaecef] break-all bg-white/[0.02]">
                      {token === 'SOL' ? addr : (usdtAta || addr)}
                    </div>
                    <button onClick={() => copy(token === 'SOL' ? addr : (usdtAta || addr))}
                      className="w-full bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                      <CopySvg /> Copy address
                    </button>
                  </>
                )}
              </div>
            </>
          )}

          {/* ── WITHDRAW ── */}
          {view === 'withdraw' && (
            <>
              <div className="flex items-center justify-between px-5 pt-5 pb-2">
                <button onClick={() => { setView('overview'); setTo(''); setAmt(''); }} className="text-[#848e9c] hover:text-[#eaecef]"><BackSvg /></button>
                <h2 className="text-base font-bold text-[#eaecef]">Withdraw {token}</h2>
                <button onClick={onClose} className="text-[#848e9c] hover:text-[#eaecef]"><CloseSvg /></button>
              </div>
              <div className="px-5 pb-5 space-y-4">
                <div className="border border-[#2b3139] rounded-sm p-3 bg-white/[0.02]">
                  <p className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Available</p>
                  <p className="text-lg font-bold text-[#eaecef] mt-0.5">{token === 'USDT' ? fmt(usdt) : fmtSol(sol)} <span className="text-sm text-[#848e9c] font-normal">{token}</span></p>
                </div>
                <div>
                  <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider block mb-1">Destination</label>
                  <input type="text" placeholder="Wallet address or token account" value={to} onChange={e => setTo(e.target.value)}
                    className="w-full bg-white/[0.05] border border-white/[0.1] rounded-sm px-3 py-2.5 text-xs text-[#eaecef] font-mono outline-none focus:border-[#FF6B00]/50 placeholder:text-[#5e6673]" />
                </div>
                <div>
                  <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider block mb-1">Amount ({token})</label>
                  <div className="flex gap-2">
                    <input type="text" inputMode="decimal" placeholder="0.00" value={amt}
                      onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setAmt(e.target.value); }}
                      className="flex-1 bg-white/[0.05] border border-white/[0.1] rounded-sm px-3 py-2.5 text-xs text-[#eaecef] outline-none focus:border-[#FF6B00]/50 placeholder:text-[#5e6673]" />
                    <button onClick={() => setAmt((token === 'USDT' ? usdt : sol).toFixed(token === 'SOL' ? 4 : 2))}
                      className="bg-[#FF6B00]/15 border border-[#FF6B00]/30 text-[#FF6B00] rounded-sm px-3 text-xs font-bold h-[42px]">Max</button>
                  </div>
                </div>
                <button onClick={doWithdraw} disabled={!to || !amt || wd}
                  className="w-full bg-[#dc2626]/15 border border-[#dc2626]/35 text-[#f87171] disabled:opacity-30 rounded-sm font-bold h-10 text-sm flex items-center justify-center gap-2">
                  {wd ? <><Loader2 size={15} className="animate-spin" /> Sending...</> : `Withdraw ${amt || '0'} USDT`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>}
    </div>
  );
}
