import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Check, Loader2, QrCode, X, Shield } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatNumber } from '@/lib/utils';

interface WalletModalProps { isOpen: boolean; onClose: () => void; }

type View = 'main' | 'deposit' | 'withdraw';

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

const CheckIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
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
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [usdtAta, setUsdtAta] = useState('');
  const [loading, setLoading] = useState(true);
  const [toAddress, setToAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);
  const [creatingAta, setCreatingAta] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [copied, setCopied] = useState(false);

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
  const totalUsd = usdtDisplay + solDisplay * 140; // rough SOL price

  const handleCopy = () => {
    navigator.clipboard.writeText(address);
    setCopied(true); setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  const handleDeposit = async () => {
    setCreatingAta(true); setView('deposit');
    try {
      const ata = await blockchainService.createUsdtAta(); setUsdtAta(ata);
      const QRCode = (await import('qrcode')).default;
      setQrDataUrl(await QRCode.toDataURL(ata, { width: 200, margin: 1 }));
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

  const solPct = totalUsd > 0 ? (solDisplay * 140 / totalUsd * 100) : 0;
  const usdtPct = 100 - solPct;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e2329] border border-[#2b3139] text-[#eaecef] max-w-[320px] w-full rounded-sm p-0 gap-0">
        {view === 'main' && (
          <>
            {/* Header */}
            <DialogHeader className="px-5 pt-5 pb-0">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#eaecef] text-base font-bold">Wallet</DialogTitle>
                <button onClick={loadData} className="text-[#848e9c] hover:text-[#eaecef]"><RefreshIcon /></button>
              </div>
            </DialogHeader>

            <div className="px-5 pb-5 space-y-4">
              {/* Total balance */}
              <div className="text-center pt-2">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Total Balance</div>
                <div className="text-[28px] font-bold text-[#eaecef] leading-tight">
                  ${loading ? '...' : totalUsd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
              </div>

              {/* Allocation bar */}
              <div className="flex h-[3px] rounded-full overflow-hidden">
                <div className="bg-[#02c076]" style={{ width: `${Math.max(usdtPct, 0.5)}%` }} />
                <div className="bg-[#9945FF]" style={{ width: `${Math.max(solPct, 0.5)}%` }} />
              </div>

              {/* Asset rows */}
              <div className="space-y-1">
                <div className="flex items-center justify-between p-3 rounded-sm hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <UsdtIcon />
                    <div>
                      <div className="text-sm font-bold text-[#eaecef]">USDT</div>
                      <div className="text-[10px] text-[#5e6673]">Tether USD</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#eaecef]">${loading ? '...' : usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-[#5e6673]">{loading ? '...' : usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USDT</div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 rounded-sm hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center gap-3">
                    <SolIcon />
                    <div>
                      <div className="text-sm font-bold text-[#eaecef]">SOL</div>
                      <div className="text-[10px] text-[#5e6673]">Solana · {totalUsd > 0 ? `~$${(solDisplay > 0 ? (usdtDisplay / solDisplay).toFixed(2) : '0')} ea.` : '...'}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#eaecef]">${loading ? '...' : (solDisplay * 140).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                    <div className="text-[10px] text-[#5e6673]">{loading ? '...' : solDisplay.toFixed(4)} SOL</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button onClick={handleDeposit} className="flex-1 bg-[#02c076] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm flex items-center justify-center gap-2">
                  <DepositIcon /> Deposit
                </button>
                <button onClick={() => setView('withdraw')} disabled={usdtBalance <= 0} className="flex-1 border border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] disabled:opacity-30 rounded-sm font-bold h-10 text-sm flex items-center justify-center gap-2">
                  <WithdrawIcon /> Withdraw
                </button>
              </div>

              {/* Wallet address */}
              <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3">
                <div className="text-[9px] text-[#5e6673] uppercase font-bold tracking-wider mb-1.5">Wallet Address</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-[11px] text-[#848e9c] select-all">
                    {address.substring(0, 14)}...{address.substring(address.length - 8)}
                  </span>
                  <button onClick={handleCopy} className="text-[#848e9c] hover:text-[#eaecef]">
                    {copied ? <span className="text-[#02c076]"><CheckIcon /></span> : <CopyIcon />}
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'deposit' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView('main'); setQrDataUrl(''); }} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Deposit USDT</DialogTitle>
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
                    <Shield size={12} /> Send only USDT (Solana) to this address
                  </div>
                  <div className="bg-white p-3 rounded-sm inline-block">
                    {qrDataUrl ? <img src={qrDataUrl} alt="QR" className="w-48 h-48" /> : <QrCode size={192} className="text-[#0b0e11]" />}
                  </div>
                  <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 font-mono text-xs text-[#eaecef] break-all">
                    {usdtAta || address}
                  </div>
                  <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(usdtAta || address); toast.success('Address copied'); }} className="w-full border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 text-xs">
                    <CopyIcon /> <span className="ml-1.5">Copy Address</span>
                  </Button>
                </>
              )}
            </div>
          </>
        )}

        {view === 'withdraw' && (
          <>
            <DialogHeader className="px-5 pt-5 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView('main'); setToAddress(''); setWithdrawAmount(''); }} className="text-[#848e9c] hover:text-[#eaecef]"><X size={16} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Withdraw USDT</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>
            <div className="px-5 pb-5 space-y-4">
              <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Available</div>
                <div className="text-lg font-bold text-[#eaecef]">{usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-[#848e9c] font-normal">USDT</span></div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Destination</label>
                <Input placeholder="Wallet address or USDT account" value={toAddress} onChange={e => setToAddress(e.target.value)} className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Amount (USDT)</label>
                <div className="flex gap-2">
                  <Input type="text" inputMode="decimal" placeholder="0.00" value={withdrawAmount} onChange={e => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setWithdrawAmount(e.target.value); }} className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1" />
                  <button onClick={() => setWithdrawAmount(usdtDisplay.toFixed(2))} className="border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs font-medium">Max</button>
                </div>
              </div>
              <Button onClick={handleWithdraw} disabled={!toAddress || !withdrawAmount || withdrawing} className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm">
                {withdrawing ? <><Loader2 size={15} className="animate-spin mr-2" /> Sending...</> : `Withdraw ${withdrawAmount || '0'} USDT`}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
