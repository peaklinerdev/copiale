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
import { Copy, ArrowDownLeft, ArrowUpRight, Check, Loader2 } from 'lucide-react';
import { blockchainService } from '@/services/blockchainService';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function WalletModal({ isOpen, onClose }: WalletModalProps) {
  const { primaryWallet } = useDynamicContext();
  const walletAddress = primaryWallet?.address || '';
  const [usdtAta, setUsdtAta] = useState<string>('');
  const [balance, setBalance] = useState<string>('0.00');
  const [copied, setCopied] = useState(false);
  const [withdrawAddress, setWithdrawAddress] = useState('');
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawing, setWithdrawing] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const init = async () => {
      try {
        const b = await blockchainService.getWalletBalance();
        setBalance((b / 1_000_000).toFixed(2));
        const ata = await blockchainService.getUsdtAta();
        setUsdtAta(ata);
      } catch { setBalance('0.00'); }
    };
    init();
    const interval = setInterval(init, 15000);
    return () => clearInterval(interval);
  }, [isOpen]);

  const handleCopy = () => {
    navigator.clipboard.writeText(usdtAta);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('USDT deposit address copied');
  };

  const handleWithdraw = async () => {
    if (!withdrawAddress || !withdrawAmount) return;
    setWithdrawing(true);
    try {
      if (!blockchainService.withdrawUsdt) {
        throw new Error('Withdraw not available');
      }
      const result = await blockchainService.withdrawUsdt(withdrawAddress, Number(withdrawAmount));
      toast.success('Withdrawal sent', { description: `Sent ${withdrawAmount} USDT to ${withdrawAddress.substring(0, 8)}...` });
      setWithdrawAddress('');
      setWithdrawAmount('');
      const b = await blockchainService.getWalletBalance();
      setBalance((b / 1_000_000).toFixed(2));
    } catch (e) {
      toast.error('Withdraw failed', { description: e instanceof Error ? e.message : 'Unknown error' });
    } finally {
      setWithdrawing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(o) => { if (!o) onClose(); }}>
      <DialogContent className="bg-[#1e2329] border border-[#2b3139] text-[#eaecef] max-w-md w-full rounded-sm p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4">
          <DialogTitle className="text-[#eaecef] text-base font-bold">
            Wallet
          </DialogTitle>
          <DialogDescription className="text-[#848e9c] text-xs">
            Manage your USDT balance
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-5">
          {/* Balance */}
          <div className="bg-[#0b0e11] rounded-sm p-4 text-center">
            <div className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider mb-1">
              Balance
            </div>
            <div className="text-2xl font-bold text-[#eaecef]">
              {balance} <span className="text-sm text-[#848e9c]">USDT</span>
            </div>
          </div>

          {/* Deposit */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-[#eaecef]">
              <ArrowDownLeft size={14} className="text-[#02c076]" /> Deposit
            </div>
            <p className="text-[11px] text-[#848e9c] mb-2">
              Send USDT (Solana) to this address:
            </p>
            <div className="flex gap-2">
              <Input
                value={usdtAta}
                readOnly
                className="bg-[#0b0e11] border-[#2b3139] text-[#848e9c] text-xs font-mono h-9 rounded-sm"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={handleCopy}
                className="border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm h-9 px-3"
              >
                {copied ? <Check size={14} className="text-[#02c076]" /> : <Copy size={14} />}
              </Button>
            </div>
            <p className="text-[10px] text-[#5e6673] mt-1.5">
              This is your wallet address: <span className="font-mono text-[#848e9c]">{walletAddress.substring(0, 8)}...{walletAddress.substring(walletAddress.length - 8)}</span>
            </p>
          </div>

          {/* Withdraw */}
          <div>
            <div className="flex items-center gap-2 mb-2 text-sm font-bold text-[#eaecef]">
              <ArrowUpRight size={14} className="text-[#f84960]" /> Withdraw
            </div>
            <div className="space-y-2">
              <Input
                placeholder="Destination USDT address"
                value={withdrawAddress}
                onChange={(e) => setWithdrawAddress(e.target.value)}
                className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm"
              />
              <div className="flex gap-2">
                <Input
                  type="text"
                  inputMode="decimal"
                  placeholder="Amount"
                  value={withdrawAmount}
                  onChange={(e) => {
                    if (/^\d*\.?\d{0,2}$/.test(e.target.value)) setWithdrawAmount(e.target.value);
                  }}
                  className="bg-[#0b0e11] border-[#2b3139] text-[#eaecef] text-xs h-9 rounded-sm flex-1"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setWithdrawAmount(balance)}
                  className="border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139] rounded-sm h-9 px-3 text-xs"
                >
                  Max
                </Button>
              </div>
              <Button
                onClick={handleWithdraw}
                disabled={!withdrawAddress || !withdrawAmount || withdrawing}
                className="w-full bg-[#f84960] hover:opacity-90 disabled:opacity-40 !text-[#0b0e11] rounded-sm font-bold h-9 text-sm"
              >
                {withdrawing ? <Loader2 size={14} className="animate-spin" /> : 'Withdraw USDT'}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
