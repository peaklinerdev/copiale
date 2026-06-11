import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Copy, ArrowDownLeft, ArrowUpRight, Check, Loader2, QrCode, X, ExternalLink, RefreshCw, Shield } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { formatNumber } from '@/lib/utils';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefresh?: () => void;
}

type View = 'main' | 'deposit' | 'withdraw';

export function WalletModal({ isOpen, onClose, onRefresh }: WalletModalProps) {
  const { primaryWallet } = useDynamicContext();
  const address = primaryWallet?.address || '';
  const [view, setView] = useState<View>('main');
  const [usdtBalance, setUsdtBalance] = useState(0);
  const [solBalance, setSolBalance] = useState(0);
  const [usdtAta, setUsdtAta] = useState('');
  const [loading, setLoading] = useState(true);

  // Withdraw
  const [toAddress, setToAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  // Deposit
  const [creatingAta, setCreatingAta] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');

  // Copy
  const [copiedField, setCopiedField] = useState('');

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

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(label);
    setTimeout(() => setCopiedField(''), 2000);
    toast.success(`${label} copied`);
  };

  const handleDeposit = async () => {
    setCreatingAta(true);
    setView('deposit');
    try {
      const ata = await blockchainService.createUsdtAta();
      setUsdtAta(ata);
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(ata, { width: 220, margin: 1 });
      setQrDataUrl(url);
    } catch { toast.error('Failed to create USDT account'); }
    setCreatingAta(false);
  };

  const handleWithdraw = async () => {
    if (!toAddress || !withdrawAmount) return;
    setWithdrawing(true);
    try {
      const result = await blockchainService.withdrawUsdt(toAddress, Number(withdrawAmount));
      if (result.success) {
        toast.success(`Sent ${withdrawAmount} USDT`);
        setToAddress(''); setWithdrawAmount(''); setView('main'); loadData(); onRefresh?.();
      } else {
        toast.error(result.error || 'Withdraw failed');
      }
    } catch (e) { toast.error(e instanceof Error ? e.message : 'Withdraw failed'); }
    setWithdrawing(false);
  };

  const usdtDisplay = (usdtBalance / 1_000_000);
  const solDisplay = solBalance;

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e2329] border border-[#2b3139] text-[#eaecef] max-w-md w-full rounded-sm p-0 gap-0">
        {/* ── MAIN VIEW ── */}
        {view === 'main' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center justify-between">
                <DialogTitle className="text-[#eaecef] text-base font-bold">Wallet</DialogTitle>
                <button onClick={loadData} className="text-[#848e9c] hover:text-[#eaecef]" title="Refresh">
                  <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                </button>
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              {/* Total balance */}
              <div className="bg-gradient-to-br from-[#FF6B00]/10 to-[#1e2329] border border-[#2b3139] rounded-sm p-4 text-center">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Total Balance</div>
                <div className="text-2xl font-bold text-[#eaecef]">
                  {loading ? '...' : usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  <span className="text-sm text-[#848e9c] font-normal"> USDT</span>
                </div>
                <div className="text-[10px] text-[#5e6673] mt-0.5">{formatNumber(address.substring(0, 4) + '...' + address.substring(address.length - 4))}</div>
              </div>

              {/* Token list */}
              <div className="space-y-1.5">
                {/* USDT */}
                <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#02c076]/20 flex items-center justify-center text-xs font-bold text-[#02c076]">$</div>
                    <div>
                      <div className="text-sm font-bold text-[#eaecef]">USDT</div>
                      <div className="text-[10px] text-[#5e6673]">Tether USD</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#eaecef]">{loading ? '...' : usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                  </div>
                </div>

                {/* SOL */}
                <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#9945FF]/20 flex items-center justify-center text-xs font-bold text-[#9945FF]">S</div>
                    <div>
                      <div className="text-sm font-bold text-[#eaecef]">SOL</div>
                      <div className="text-[10px] text-[#5e6673]">Solana</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-[#eaecef]">{loading ? '...' : solDisplay.toFixed(4)}</div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleDeposit}
                  className="flex-1 bg-[#02c076] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm flex items-center justify-center gap-2"
                >
                  <ArrowDownLeft size={15} /> Deposit
                </button>
                <button
                  onClick={() => setView('withdraw')}
                  disabled={usdtBalance <= 0}
                  className="flex-1 bg-[#f84960] hover:opacity-90 disabled:opacity-30 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm flex items-center justify-center gap-2"
                >
                  <ArrowUpRight size={15} /> Withdraw
                </button>
              </div>

              {/* Wallet address */}
              <button
                onClick={() => handleCopy(address, 'Address')}
                className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 text-left hover:border-[#3b4149] transition-colors"
              >
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Wallet Address</div>
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-[#848e9c]">{address.substring(0, 12)}...{address.substring(address.length - 8)}</span>
                  <span className="text-[#848e9c]">{copiedField === 'Address' ? <Check size={14} className="text-[#02c076]" /> : <Copy size={14} />}</span>
                </div>
              </button>
            </div>
          </>
        )}

        {/* ── DEPOSIT VIEW ── */}
        {view === 'deposit' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('main')} className="text-[#848e9c] hover:text-[#eaecef]"><X size={18} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Deposit USDT</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4 text-center">
              {creatingAta ? (
                <div className="py-12">
                  <Loader2 size={28} className="animate-spin mx-auto text-[#FF6B00] mb-4" />
                  <p className="text-sm text-[#eaecef]">Creating your USDT account...</p>
                  <p className="text-[10px] text-[#848e9c] mt-1">This only happens once</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-center gap-2 text-xs text-[#f84960] bg-[#f84960]/10 border border-[#f84960]/20 rounded-sm py-2 px-3">
                    <Shield size={13} />
                    Send only USDT (Solana) to this address
                  </div>

                  <div className="bg-white p-4 rounded-sm inline-block shadow-lg">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="Deposit QR" className="w-52 h-52" />
                    ) : (
                      <QrCode size={208} className="text-[#0b0e11]" />
                    )}
                  </div>

                  <div>
                    <p className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-2">Deposit Address</p>
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 font-mono text-xs text-[#eaecef] break-all leading-relaxed">
                      {usdtAta || address}
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        variant="outline" size="sm"
                        onClick={() => handleCopy(usdtAta || address, 'Address')}
                        className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 text-xs"
                      >
                        {copiedField === 'Address' ? <Check size={14} className="mr-1 text-[#02c076]" /> : <Copy size={14} className="mr-1" />}
                        {copiedField === 'Address' ? 'Copied' : 'Copy Address'}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* ── WITHDRAW VIEW ── */}
        {view === 'withdraw' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => { setView('main'); setToAddress(''); setWithdrawAmount(''); }} className="text-[#848e9c] hover:text-[#eaecef]"><X size={18} /></button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Withdraw USDT</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] text-[#848e9c] uppercase font-bold">Available</div>
                  <div className="text-lg font-bold text-[#eaecef]">{usdtDisplay.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-sm text-[#848e9c] font-normal">USDT</span></div>
                </div>
                <div className="w-9 h-9 rounded-full bg-[#02c076]/20 flex items-center justify-center text-xs font-bold text-[#02c076]">$</div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Destination</label>
                <Input
                  placeholder="Wallet address or USDT account"
                  value={toAddress}
                  onChange={(e) => setToAddress(e.target.value)}
                  className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Amount (USDT)</label>
                <div className="flex gap-2">
                  <Input
                    type="text" inputMode="decimal" placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => { if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setWithdrawAmount(e.target.value); }}
                    className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1"
                  />
                  <button
                    onClick={() => setWithdrawAmount(usdtDisplay.toFixed(2))}
                    className="border border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs font-medium"
                  >
                    Max
                  </button>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!toAddress || !withdrawAmount || withdrawing}
                className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-10 text-sm"
              >
                {withdrawing ? (
                  <><Loader2 size={15} className="animate-spin mr-2" /> Sending...</>
                ) : (
                  `Withdraw ${withdrawAmount || '0'} USDT`
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
