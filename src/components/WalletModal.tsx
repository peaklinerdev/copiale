import { useState, useEffect, useRef } from 'react';
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
import { Copy, ArrowDownLeft, ArrowUpRight, Check, Loader2, Wallet, ChevronDown, ChevronRight, QrCode, X } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface WalletInfo {
  address: string;
  label: string;
  balance: number;
  usdtAta: string;
}

type View = 'list' | 'deposit' | 'withdraw';

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { primaryWallet, user } = useDynamicContext();
  const [view, setView] = useState<View>('list');
  const [wallets, setWallets] = useState<WalletInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Deposit state
  const [depositWallet, setDepositWallet] = useState<WalletInfo | null>(null);
  const [creatingAta, setCreatingAta] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');

  // Withdraw state
  const [withdrawWallet, setWithdrawWallet] = useState<WalletInfo | null>(null);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      setView('list');
      return;
    }
    loadWallets();
  }, [isOpen, primaryWallet?.address]);

  const loadWallets = async () => {
    setLoading(true);
    try {
      const wl: WalletInfo[] = [];
      // Primary embedded wallet
      if (primaryWallet?.address) {
        const b = await blockchainService.getWalletBalance();
        const ata = await blockchainService.getUsdtAta();
        wl.push({
          address: primaryWallet.address,
          label: user?.email || user?.alias || 'Primary Wallet',
          balance: b,
          usdtAta: ata,
        });
      }
      // Linked wallets from Dynamic
      const linkedWallets = (user as any)?.verifiedCredentials
        ?.filter((c: any) => c.walletPublicKey && c.walletPublicKey !== primaryWallet?.address)
        || [];
      for (const c of linkedWallets) {
        wl.push({
          address: c.walletPublicKey,
          label: c.walletName || c.format || 'Linked Wallet',
          balance: 0,
          usdtAta: '',
        });
      }
      setWallets(wl);
    } catch { setWallets([]); }
    finally { setLoading(false); }
  };

  const generateQr = async (address: string) => {
    try {
      const QRCode = (await import('qrcode')).default;
      const url = await QRCode.toDataURL(address, { width: 200, margin: 1 });
      setQrDataUrl(url);
    } catch { setQrDataUrl(''); }
  };

  const handleDeposit = async (w: WalletInfo) => {
    setDepositWallet(w);
    setView('deposit');
    setQrDataUrl('');

    try {
      setCreatingAta(true);
      const ata = await blockchainService.createUsdtAta();
      setCreatingAta(false);
      generateQr(ata);
      setDepositWallet({ ...w, usdtAta: ata });
    } catch {
      setCreatingAta(false);
      toast.error('Failed to create USDT account');
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Address copied');
  };

  const handleWithdrawNav = (w: WalletInfo) => {
    setWithdrawWallet(w);
    setView('withdraw');
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) return;
    // Validate Solana address format
    try {
      const { PublicKey } = await import('@solana/web3.js');
      new PublicKey(withdrawAddress);
    } catch {
      toast.error('Invalid Solana address');
      return;
    }
    setWithdrawing(true);
    try {
      const result = await blockchainService.withdrawUsdt(withdrawAddress, Number(withdrawAmount));
      if (result.success) {
        toast.success('Withdrawal sent', { description: `${withdrawAmount} USDT` });
        setWithdrawAddress('');
        setWithdrawAmount('');
        loadWallets();
        setView('list');
      } else {
        toast.error('Withdraw failed', { description: result.error || 'Unknown error' });
      }
    } catch (e) {
      toast.error('Withdraw failed', { description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setWithdrawing(false);
    }
  };

  const totalBalance = wallets.reduce((sum, w) => sum + w.balance, 0);
  const formatBal = (b: number) => (b / 1_000_000).toFixed(2);

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e2329] border border-[#2b3139] text-[#eaecef] max-w-md w-full rounded-sm p-0 gap-0">
        {view === 'list' && (
          <>
            <DialogHeader className="px-6 pt-6 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-sm bg-[#FF6B00]/10 flex items-center justify-center">
                  <Wallet size={16} className="text-[#FF6B00]" />
                </div>
                <div>
                  <DialogTitle className="text-[#eaecef] text-base font-bold">Wallet</DialogTitle>
                  <DialogDescription className="text-[#848e9c] text-xs">Manage your USDT</DialogDescription>
                </div>
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              {/* Total balance card */}
              <div className="bg-gradient-to-br from-[#FF6B00]/10 to-[#1e2329] border border-[#2b3139] rounded-sm p-4">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">Total Balance</div>
                <div className="text-2xl font-bold text-[#eaecef]">
                  {loading ? '...' : formatBal(totalBalance)} <span className="text-sm text-[#848e9c] font-normal">USDT</span>
                </div>
              </div>

              {/* SOL balance */}
              <SolBalanceCard onClose={onClose} />

              {/* SOL balance */}
              <SolCard />

              {/* Wallet list*/}
              {loading ? (
                <div className="text-center text-[#848e9c] text-sm py-4">
                  <Loader2 size={16} className="animate-spin inline mr-2" />
                  Loading wallets...
                </div>
              ) : wallets.length === 0 ? (
                <div className="text-center text-[#848e9c] text-sm py-4">No wallets found</div>
              ) : (
                <div className="space-y-2">
                  {wallets.map((w, i) => (
                    <div key={i} className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="text-sm font-bold text-[#eaecef]">{w.label}</div>
                          <div className="text-[10px] text-[#5e6673] font-mono mt-0.5">
                            {w.address.substring(0, 6)}...{w.address.substring(w.address.length - 4)}
                          </div>
                        </div>
                        <div className="text-sm font-bold text-[#eaecef]">{formatBal(w.balance)} USDT</div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleDeposit(w)}
                          className="flex-1 bg-[#02c076] hover:opacity-90 !text-[#0b0e11] rounded-sm font-bold h-8 text-xs"
                        >
                          <ArrowDownLeft size={12} className="mr-1" /> Deposit
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => handleWithdrawNav(w)}
                          disabled={w.balance <= 0}
                          className="flex-1 bg-[#f84960] hover:opacity-90 disabled:opacity-30 !text-[#0b0e11] rounded-sm font-bold h-8 text-xs"
                        >
                          <ArrowUpRight size={12} className="mr-1" /> Withdraw
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {view === 'deposit' && depositWallet && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('list')} className="text-[#848e9c] hover:text-[#eaecef]">
                  <X size={18} />
                </button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Deposit USDT</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4 text-center">
              {creatingAta ? (
                <div className="py-8">
                  <Loader2 size={24} className="animate-spin mx-auto text-[#FF6B00]" />
                  <p className="text-sm text-[#848e9c] mt-3">Creating your USDT account...</p>
                </div>
              ) : (
                <>
                  {/* QR Code */}
                  <div className="bg-white p-4 rounded-sm inline-block">
                    {qrDataUrl ? (
                      <img src={qrDataUrl} alt="QR Code" className="w-48 h-48" />
                    ) : (
                      <QrCode size={192} className="text-[#0b0e11]" />
                    )}
                  </div>

                  <div>
                    <p className="text-[11px] text-[#848e9c] mb-2">
                      Send only USDT (Solana) to this address:
                    </p>
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 break-all font-mono text-xs text-[#eaecef]">
                      {depositWallet.usdtAta || 'Not available'}
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleCopy(depositWallet.usdtAta)}
                      className="mt-2 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-8"
                    >
                      {copied ? <Check size={14} className="mr-1 text-[#02c076]" /> : <Copy size={14} className="mr-1" />}
                      {copied ? 'Copied' : 'Copy Address'}
                    </Button>
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {view === 'withdraw' && withdrawWallet && (
          <>
            <DialogHeader className="px-6 pt-6 pb-2">
              <div className="flex items-center justify-between">
                <button onClick={() => setView('list')} className="text-[#848e9c] hover:text-[#eaecef]">
                  <X size={18} />
                </button>
                <DialogTitle className="text-[#eaecef] text-base font-bold">Withdraw USDT</DialogTitle>
                <div className="w-5" />
              </div>
            </DialogHeader>

            <div className="px-6 pb-6 space-y-4">
              <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3">
                <div className="text-[10px] text-[#848e9c] uppercase font-bold">Available</div>
                <div className="text-lg font-bold text-[#eaecef]">{formatBal(withdrawWallet.balance)} USDT</div>
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-[#848e9c] font-medium">Destination USDT Address</label>
                <Input
                  placeholder="Enter USDT address"
                  value={withdrawAddress}
                  onChange={(e) => setWithdrawAddress(e.target.value)}
                  className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[11px] text-[#848e9c] font-medium">Amount (USDT)</label>
                <div className="flex gap-2">
                  <Input
                    type="text"
                    inputMode="decimal"
                    placeholder="0.00"
                    value={withdrawAmount}
                    onChange={(e) => {
                      if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setWithdrawAmount(e.target.value);
                    }}
                    className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setWithdrawAmount(formatBal(withdrawWallet.balance))}
                    className="border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs"
                  >
                    Max
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAddress || !withdrawAmount || withdrawing}
                className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-10"
              >
                {withdrawing ? <Loader2 size={16} className="animate-spin mr-2" /> : null}
                Withdraw USDT
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function SolCard() {
  const [solBal, setSolBal] = useState('0.00');
  const [copied, setCopied] = useState(false);
  const { primaryWallet } = useDynamicContext();

  useEffect(() => {
    blockchainService.getSolBalance().then(b => setSolBal(b.toFixed(4))).catch(() => {});
  }, [primaryWallet?.address]);

  return (
    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3">
      <div className="flex items-center justify-between mb-1">
        <span className="text-sm font-bold text-[#eaecef]">SOL</span>
        <span className="text-sm font-bold text-[#eaecef]">{solBal}</span>
      </div>
      <div className="flex gap-2">
        <button
          onClick={() => {
            navigator.clipboard.writeText(primaryWallet?.address || '');
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          }}
          className="flex-1 bg-[#2b3139] hover:bg-[#3b4149] text-[#eaecef] rounded-sm font-bold h-8 text-xs"
        >
          {copied ? <Check size={12} className="inline mr-1" /> : <Copy size={12} className="inline mr-1" />}
          {copied ? 'Copied' : 'Copy Address'}
        </button>
      </div>
    </div>
  );
}
