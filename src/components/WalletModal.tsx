import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Loader2, QrCode, X, Shield, ExternalLink, ArrowUpRight, ArrowDownLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { Connection, PublicKey } from '@solana/web3.js';

interface WalletModalProps { isOpen: boolean; onClose: () => void; }

type View = 'main' | 'deposit' | 'withdraw' | 'tokenDetail';
type TokenType = 'USDT' | 'SOL';

const DepositIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="2" x2="12" y2="16" /><polyline points="8 12 12 16 16 12" /><line x1="4" y1="20" x2="20" y2="20" />
  </svg>
);

const WithdrawIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="22" x2="12" y2="8" /><polyline points="8 12 12 8 16 12" /><line x1="4" y1="4" x2="20" y2="4" />
  </svg>
);

const CopyIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" /></svg>
);

const RefreshIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" /></svg>
);

const SolIcon = () => (
  <div className="w-9 h-9 rounded-full bg-[#9945FF]/20 flex items-center justify-center">
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9945FF" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="6" y1="18" x2="18" y2="6" /><polyline points="9 6 18 6 18 15" />
    </svg>
  </div>
);

const UsdtIcon = () => (
  <div className="w-9 h-9 rounded-full bg-[#02c076]/20 flex items-center justify-center">
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#02c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><line x1="12" y1="6" x2="12" y2="18" /><polyline points="8 10 12 6 16 10" /><polyline points="8 14 12 18 16 14" />
    </svg>
  </div>
);

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address || '';
  const [view, setView] = useState<View>('main');
  const [selectedToken, setSelectedToken] = useState<TokenType>('USDT');
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [usdtAta, setUsdtAta] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Deposit/Withdraw
  const [toAddress, setToAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [creatingAta, setCreatingAta] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Token detail
  const [txHistory, setTxHistory] = useState<any[]>([]);
  const [txLoading, setTxLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [usdt, sol, ata] = await Promise.all([
        blockchainService.getWalletBalance(),
        blockchainService.getSolBalance(),
        blockchainService.getUsdtAta(),
      ]);
      setUsdtBalance(usdt);
      setSolBalance(sol);
      setUsdtAta(ata);
    } catch { /* */ }
    setLoading(false);
  };

  useEffect(() => { if (isOpen) { setView('main'); loadData(); } }, [isOpen, address]);

  const usdtDisplay = (usdtBalance / 1_000_000);
  const solDisplay = solBalance;
  const totalUsd = usdtDisplay + solDisplay * 140;
  const solPct = totalUsd > 0 ? (solDisplay * 140 / totalUsd * 100) : 0;
  const usdtPct = 100 - solPct;

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  const startDeposit = (token: TokenType) => {
    setSelectedToken(token); setView('deposit');
    if (token === 'SOL') {
      setCreatingAta(false); generateQr(address);
    } else {
      handleUsdtDeposit();
    }
  };

  const startWithdraw = (token: TokenType) => {
    setSelectedToken(token); setView('withdraw');
    setToAddress(''); setWithdrawAmount('');
  };

  const generateQr = async (addr: string) => {
    const QRCode = (await import('qrcode')).default;
    setQrDataUrl(await QRCode.toDataURL(addr, { width: 200, margin: 1 }));
  };

  const handleUsdtDeposit = async () => {
    setCreatingAta(true);
    try {
      const ata = await blockchainService.createUsdtAta(); setUsdtAta(ata);
      generateQr(ata);
    } catch { toast.error('Failed to create USDT account'); }
    setCreatingAta(false);
  };

  const handleWithdraw = async () => {
    if (!toAddress || !withdrawAmount) return;
    setWithdrawing(true);
    try {
      const result = await blockchainService.withdrawUsdt(toAddress, Number(withdrawAmount));
      if (result.success) { toast.success(`Sent ${withdrawAmount} USDT`); setToAddress(''); setWithdrawAmount(''); setView('main'); loadData(); }
      else toast.error(result.error || 'Withdraw failed');
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Withdraw failed'); }
    setWithdrawing(false);
  };

  const openTokenDetail = async (token: TokenType) => {
    setSelectedToken(token); setView('tokenDetail'); setTxHistory([]);
    setTxLoading(true);
    try {
      const rpcUrl = 'https://api.devnet.solana.com';
      const conn = new Connection(rpcUrl, 'confirmed');
      const targetAddr = token === 'SOL' ? address : usdtAta;
      if (!targetAddr) { setTxLoading(false); return; }
      const sigs = await conn.getSignaturesForAddress(new PublicKey(targetAddr), { limit: 8 });
      const txs: any[] = [];
      for (const s of sigs) {
        try {
          const tx = await conn.getParsedTransaction(s.signature, { maxSupportedTransactionVersion: 0 });
          if (tx) txs.push({ signature: s.signature, timestamp: tx.blockTime, status: tx.meta?.err ? 'failed' : 'success', slot: s.slot });
        } catch { /* skip */ }
      }
      setTxHistory(txs);
    } catch { /* */ }
    setTxLoading(false);
  };

  const explorerUrl = (sig: string) => `https://solscan.io/tx/${sig}?cluster=devnet`;

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
                <button onClick={loadData} className="text-[#848e9c] hover:text-[#eaecef]"><RefreshIcon /></button>
              </div>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-3">
              {/* Wallet address */}
              <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm p-2.5">
                <div className="text-[9px] text-[#5e6673] uppercase font-bold tracking-wider mb-1">Wallet Address</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#848e9c] select-all">{address.substring(0, 16)}...{address.substring(address.length - 6)}</span>
                  <button onClick={handleCopy} className="text-[#848e9c] hover:text-[#eaecef] ml-2">{copied ? <span className="text-[#02c076] text-[10px] font-bold">✓</span> : <CopyIcon />}</button>
                </div>
              </div>

              {/* Deposit / Withdraw */}
              <div className="flex gap-2">
                <button onClick={() => startDeposit('USDT')} className="flex-1 bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                  <DepositIcon /> Deposit
                </button>
                <button onClick={() => startWithdraw('USDT')} disabled={usdtBalance <= 0} className="flex-1 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-9 text-xs flex items-center justify-center gap-1.5">
                  <WithdrawIcon /> Withdraw
                </button>
              </div>

              {/* Allocation bar */}
              <div className="flex h-[2px] rounded-full overflow-hidden">
                <div className="bg-[#02c076]" style={{ width: `${Math.max(usdtPct, 1)}%` }} />
                <div className="bg-[#9945FF]" style={{ width: `${Math.max(solPct, 1)}%` }} />
              </div>

              {/* Token rows */}
              <div className="space-y-1">
                {(['USDT', 'SOL'] as TokenType[]).map(token => (
                  <button
                    key={token}
                    onClick={() => openTokenDetail(token)}
                    className="w-full flex items-center justify-between p-3 rounded-sm hover:bg-white/[0.03] transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      {token === 'USDT' ? <UsdtIcon /> : <SolIcon />}
                      <div>
                        <div className="text-sm font-bold text-[#eaecef]">{token}</div>
                        <div className="text-[10px] text-[#5e6673]">{token === 'USDT' ? 'Tether USD' : 'Solana'}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-[#eaecef]">
                        {token === 'USDT' ? usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : solDisplay.toFixed(4)}
                      </div>
                      <div className="text-[10px] text-[#5e6673]">
                        ${token === 'USDT' ? usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : (solDisplay * 140).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </div>
                    </div>
                  </button>
                ))}
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
              <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm p-4 text-center">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">{selectedToken} Balance</div>
                <div className="text-2xl font-bold text-[#eaecef]">
                  {selectedToken === 'USDT' ? usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : solDisplay.toFixed(4)}
                </div>
                <div className="text-[10px] text-[#848e9c] mt-0.5">
                  ${selectedToken === 'USDT' ? usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                    : (solDisplay * 140).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Activity */}
              <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Recent Activity</div>
              {txLoading ? (
                <div className="text-center py-4"><Loader2 size={16} className="animate-spin mx-auto text-[#848e9c]" /></div>
              ) : txHistory.length === 0 ? (
                <div className="text-center text-[10px] text-[#5e6673] py-4">No recent transactions</div>
              ) : (
                <div className="space-y-1 max-h-[180px] overflow-y-auto">
                  {txHistory.map((tx, i) => (
                    <a key={i} href={explorerUrl(tx.signature)} target="_blank" rel="noreferrer"
                      className="flex items-center justify-between p-2 rounded-sm hover:bg-white/[0.03] transition-colors text-[#848e9c] hover:text-[#eaecef] no-underline"
                    >
                      <div className="flex items-center gap-2">
                        {tx.status === 'success'
                          ? <CheckCircleIcon />
                          : <span className="text-[#f84960] text-[10px]">!</span>
                        }
                        <div>
                          <div className="text-[11px] font-medium">{tx.signature.substring(0, 8)}...</div>
                          <div className="text-[9px] text-[#5e6673]">
                            {tx.timestamp ? new Date(tx.timestamp * 1000).toLocaleDateString() : 'recent'}
                          </div>
                        </div>
                      </div>
                      <ExternalLink size={11} />
                    </a>
                  ))}
                </div>
              )}
              <a href={`https://solscan.io/account/${selectedToken === 'SOL' ? address : usdtAta}?cluster=devnet`} target="_blank" rel="noreferrer"
                className="block text-center text-[10px] text-[#FF6B00] hover:underline font-medium py-1"
              >
                View all on Solscan <ExternalLink size={10} className="inline" />
              </a>
            </div>
          </>
        )}

        {/* ── DEPOSIT ── */}
        {view === 'deposit' && (
          <DepositView
            token={selectedToken}
            creatingAta={selectedToken === 'USDT' && creatingAta}
            qrDataUrl={qrDataUrl}
            address={address}
            usdtAta={usdtAta}
            onBack={() => setView('main')}
          />
        )}

        {/* ── WITHDRAW ── */}
        {view === 'withdraw' && (
          <WithdrawView
            token={selectedToken}
            available={usdtDisplay}
            toAddress={toAddress}
            withdrawAmount={withdrawAmount}
            withdrawing={withdrawing}
            onBack={() => { setView('main'); setToAddress(''); setWithdrawAmount(''); }}
            onAddressChange={setToAddress}
            onAmountChange={setWithdrawAmount}
            onSubmit={handleWithdraw}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function CheckCircleIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#02c076" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="9" /><polyline points="8 12 11 15 16 9" />
    </svg>
  );
}

function DepositView({ token, creatingAta, qrDataUrl, address, usdtAta, onBack }: {
  token: TokenType; creatingAta: boolean; qrDataUrl: string; address: string; usdtAta: string; onBack: () => void;
}) {
  const displayAddr = token === 'SOL' ? address : (usdtAta || address);
  return (
    <>
      <DialogHeader className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
          <DialogTitle className="text-[#eaecef] text-base font-bold">Deposit {token}</DialogTitle>
          <div className="w-5" />
        </div>
      </DialogHeader>
      <div className="px-5 pb-5 space-y-4 text-center">
        {creatingAta ? (
          <div className="py-12">
            <Loader2 size={28} className="animate-spin mx-auto text-[#02c076] mb-3" />
            <p className="text-sm text-[#eaecef]">Creating your USDT account...</p>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-center gap-2 text-[10px] text-[#f84960] bg-[#f84960]/10 border border-[#f84960]/20 rounded-sm py-2 px-3">
              <Shield size={12} /> Send only {token} (Solana) to this address
            </div>
            <div className="bg-white p-3 rounded-sm inline-block">
              {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-48 h-48" /> : <QrCode size={192} className="text-[#0b0e11]" />}
            </div>
            <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm p-3 font-mono text-xs text-[#eaecef] break-all">
              {displayAddr}
            </div>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(displayAddr); toast.success('Address copied'); }}
              className="w-full border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 text-xs">
              <CopyIcon /> <span className="ml-1.5">Copy Address</span>
            </Button>
          </>
        )}
      </div>
    </>
  );
}

function WithdrawView({ token, available, toAddress, withdrawAmount, withdrawing, onBack, onAddressChange, onAmountChange, onSubmit }: {
  token: TokenType; available: number; toAddress: string; withdrawAmount: string; withdrawing: boolean;
  onBack: () => void; onAddressChange: (v: string) => void; onAmountChange: (v: string) => void; onSubmit: () => void;
}) {
  return (
    <>
      <DialogHeader className="px-5 pt-5 pb-2">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
          <DialogTitle className="text-[#eaecef] text-base font-bold">Withdraw {token}</DialogTitle>
          <div className="w-5" />
        </div>
      </DialogHeader>
      <div className="px-5 pb-5 space-y-4">
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm p-3">
          <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Available</div>
          <div className="text-lg font-bold text-[#eaecef]">{available.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-[#848e9c] font-normal">{token}</span></div>
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Destination</label>
          <Input placeholder="Wallet address or token account" value={toAddress} onChange={e => onAddressChange(e.target.value)}
            className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm font-mono" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Amount ({token})</label>
          <div className="flex gap-2">
            <Input type="text" inputMode="decimal" placeholder="0.00" value={withdrawAmount}
              onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) onAmountChange(e.target.value); }}
              className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1" />
            <button onClick={() => onAmountChange(available.toFixed(2))}
              className="border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs font-medium">Max</button>
          </div>
        </div>
        <Button onClick={onSubmit} disabled={!toAddress || !withdrawAmount || withdrawing}
          className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm">
          {withdrawing ? <><Loader2 size={15} className="animate-spin mr-2" /> Sending...</> : `Withdraw ${withdrawAmount || '0'} ${token}`}
        </Button>
      </div>
    </>
  );
}
