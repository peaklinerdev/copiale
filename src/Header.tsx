import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from './lib/utils';
import {
  useDynamicContext,
  getAuthToken,
  useWalletConnectorEvent,
} from '@dynamic-labs/sdk-react-core';
import { Account, setAuthToken, getPrices } from './api';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Menu, X, Plus, LayoutDashboard, ScrollText, ClipboardList, LogOut, ArrowUpRight, Wallet } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import Container from '@/components/Shared/Container';
import { useBlockchainService } from './hooks/useBlockchainService';
import { loadFallbackPrices } from './lib/priceFallback';
import { REFERENCE_CURRENCIES, TRADING_CURRENCIES } from './lib/currencies';
import { WalletModal } from '@/components/WalletModal';

interface HeaderProps {
  isLoggedIn: boolean;
  account: Account | null;
}

function Header({ isLoggedIn, account }: HeaderProps) {
  const { setShowAuthFlow, handleLogOut, primaryWallet } = useDynamicContext();
  const { service: blockchainService, isConnected } = useBlockchainService();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLogoutDialogOpen, setIsLogoutDialogOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: string; timestamp: number }> | null>(
    null
  );
  const [_priceError, setPriceError] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [solBalance, setSolBalance] = useState<string>('0.00');
  const [currentNetwork, setCurrentNetwork] = useState<number | string | null>(null);
  const [walletModalOpen, setWalletModalOpen] = useState(false);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await getPrices();
      setPrices(response.data.data.USDT || response.data.data.USDC);
      setPriceError(null);
    } catch (err) {
      try {
        const fallback = await loadFallbackPrices();
        setPrices(fallback.data.USDT || fallback.data.USDC);
        setPriceError(null);
      } catch (fbErr) {
        setPriceError('Price data unavailable');
      }
    }
  }, []);

  useEffect(() => {
    const fetchBalances = async () => {
      if (isConnected && primaryWallet?.address) {
        try {
          const usdt = await blockchainService.getWalletBalance();
          setUsdtBalance((usdt / 1_000_000).toFixed(2));
          const sol = await blockchainService.getSolBalance();
          setSolBalance(sol.toFixed(4));
        } catch (error) {
          console.error('Error fetching balances:', error);
        }
      }
    };
    fetchBalances();
    const interval = setInterval(fetchBalances, 30000);
    return () => clearInterval(interval);
  }, [isConnected, primaryWallet, currentNetwork, blockchainService]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  useWalletConnectorEvent(primaryWallet?.connector, 'chainChange', chainInfo => {
    const networkId =
      typeof chainInfo.chain === 'string'
        ? parseInt(chainInfo.chain, 16)
        : parseInt(chainInfo.chain);
    
    if (typeof networkId === 'number' && !isNaN(networkId)) {
      setCurrentNetwork(networkId);
    }
  });

  useEffect(() => {
    if (primaryWallet?.connector && isConnected) {
      const isSolanaWallet =
        primaryWallet.connector.name.toLowerCase().includes('solana') ||
        primaryWallet.connector.name.toLowerCase().includes('phantom') ||
        primaryWallet.connector.name.toLowerCase().includes('solflare');

      if (isSolanaWallet) {
        setCurrentNetwork('solana-devnet');
      }
    }
  }, [primaryWallet?.connector, isConnected]);

  useEffect(() => {
    const token = getAuthToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <>
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#111318]/80 backdrop-blur-xl border-b border-white/[0.04] shadow-[0_1px_4px_rgba(0,0,0,0.5)] h-14 flex items-center">
      <Container>
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <Link to="/">
                <img src="/copiale-p2p.svg" alt="Copiale" className="w-8 h-8" />
              </Link>
              <Link to="/manifesto" className="text-base font-extrabold tracking-tighter uppercase text-[#eaecef] hover:text-[#FF6B00] transition-colors">COPIALE-P2P</Link>
            </div>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-[#FF6B00] hover:text-[#FF6B00]">Market</Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Prices — reference (USD/EUR) | trading */}
            <div className="hidden lg:flex items-center gap-3 mr-4">
              {prices && (() => {
                const all = [...REFERENCE_CURRENCIES, ...TRADING_CURRENCIES];
                return all.map((currency, i) => {
                  const pd = prices[currency];
                  if (!pd) return null;
                  return (
                    <span key={currency} className="flex items-center gap-3">
                      {i === REFERENCE_CURRENCIES.length && (
                        <span className="text-[#2b3139] font-light select-none">|</span>
                      )}
                      <span className="flex gap-1.5 items-center">
                        <span className={`text-[11px] font-bold ${i < REFERENCE_CURRENCIES.length ? 'text-[#848e9c]/60' : 'text-[#848e9c]'}`}>
                          {currency}
                        </span>
                        <span className={`text-xs font-medium ${i < REFERENCE_CURRENCIES.length ? 'text-[#02c076]/50' : 'text-[#02c076]'}`}>
                          {formatNumber(pd.price)}
                        </span>
                      </span>
                    </span>
                  );
                });
              })()}
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-2.5">
                {/* Wallet button with hover balance tooltip */}
                <div className="relative group">
                <button
                  onClick={() => setWalletModalOpen(true)}
                  className="text-sm font-medium text-[#FF6B00] hover:text-[#FF6B00]/80 transition-colors"
                >
                  Wallet
                </button>
                  {/* Hover tooltip */}
                  <div className="absolute top-full right-0 mt-2 hidden group-hover:block z-50">
                    {/* Arrow */}
                    <div className="absolute -top-1 right-4 w-2 h-2 bg-[#0b0e11] border-t border-l border-[#2b3139] rotate-45" />
                    <div className="bg-[#0b0e11] border border-[#2b3139] rounded-sm p-3 min-w-[150px] shadow-[0_4px_16px_rgba(0,0,0,0.5)]">
                      <div className="flex items-center justify-between gap-4 text-[11px] mb-1">
                        <span className="text-[#848e9c]">USDT</span>
                        <span className="text-[#eaecef] font-medium text-xs">{usdtBalance}</span>
                      </div>
                      <div className="flex items-center justify-between gap-4 text-[11px] mb-1">
                        <span className="text-[#848e9c]">SOL</span>
                        <span className="text-[#eaecef] font-medium text-xs">{solBalance}</span>
                      </div>
                      <div className="border-t border-[#2b3139] my-1.5" />
                      <div className="flex items-center justify-between gap-4 text-[11px]">
                        <span className="text-[#848e9c]">Total</span>
                        <span className="text-[#02c076] font-bold text-xs">
                          ≈ ${(parseFloat(usdtBalance) + parseFloat(solBalance) * 140).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="w-8 h-8 rounded-sm ring-1 ring-[#2b3139] hover:ring-[#FF6B00] transition-all">
                      <AvatarImage src={account?.profile_photo_url} />
                      <AvatarFallback className="bg-[#2b3139] text-[#848e9c] rounded-sm">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-52 mt-2 bg-[#1e2329] border border-[#2b3139] text-[#eaecef] rounded-sm p-1.5">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer hover:bg-[#2b3139] rounded-sm flex items-center gap-3 px-3 py-2 text-sm">
                        <LayoutDashboard size={15} className="text-[#848e9c] shrink-0" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => { setIsDropdownOpen(false); setWalletModalOpen(true); }} className="cursor-pointer hover:bg-[#2b3139] rounded-sm flex items-center gap-3 px-3 py-2 text-sm">
                      <ArrowUpRight size={15} className="text-[#848e9c] shrink-0" />
                      Wallet
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/offers" className="cursor-pointer hover:bg-[#2b3139] rounded-sm flex items-center gap-3 px-3 py-2 text-sm">
                        <ScrollText size={15} className="text-[#848e9c] shrink-0" />
                        My Ads
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/create-offer" className="cursor-pointer hover:bg-[#2b3139] rounded-sm flex items-center gap-3 px-3 py-2 text-sm">
                        <Plus size={15} className="text-[#848e9c] shrink-0" />
                        Post Ad
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/trades" className="cursor-pointer hover:bg-[#2b3139] rounded-sm flex items-center gap-3 px-3 py-2 text-sm">
                        <ClipboardList size={15} className="text-[#848e9c] shrink-0" />
                        Orders
                      </Link>
                    </DropdownMenuItem>
                    <div className="h-px bg-[#2b3139] my-1.5 mx-1" />
                    <DropdownMenuItem onClick={() => { setIsDropdownOpen(false); setIsLogoutDialogOpen(true); }} className="cursor-pointer hover:bg-[#f84960]/10 rounded-sm flex items-center gap-3 px-3 py-2 text-sm text-[#f84960]">
                      <LogOut size={15} className="text-[#f84960] shrink-0" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold px-4 h-8 text-sm rounded-sm"
              >
                Login / Register
              </Button>
            )}

            <button
              className="md:hidden p-1 text-[#848e9c] hover:text-[#eaecef]"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </div>
      </Container>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 top-14 z-40 bg-[#0b0e11] p-4 flex flex-col gap-4">
          <nav className="flex flex-col gap-2">
            <Link to="/" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm">Market</Link>
            {isLoggedIn && (
              <>
                <Link to="/account" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm">Dashboard</Link>
                <Link to="/offers" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm">My Ads</Link>
                <Link to="/create-offer" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm flex items-center gap-3">
                  <Plus size={15} className="text-[#848e9c]" />
                  Post Ad
                </Link>
                <Link to="/trades" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm">Orders</Link>
              </>
            )}
          </nav>
          {!isLoggedIn && (
            <Button
              onClick={() => { setShowAuthFlow(true); setMobileMenuOpen(false); }}
              className="bg-[#FF6B00] text-[#0b0e11] font-bold w-full h-12 rounded-sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      )}
    </header>

    {/* Logout Confirmation Dialog */}
    <Dialog open={isLogoutDialogOpen} onOpenChange={setIsLogoutDialogOpen}>
      <DialogContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] rounded-sm max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Sign Out?</DialogTitle>
          <DialogDescription className="text-[#848e9c]">
            Are you sure you want to disconnect your wallet? You will need to reconnect to access your account and continue trading.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => setIsLogoutDialogOpen(false)}
            className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              setIsLogoutDialogOpen(false);
              handleLogOut();
            }}
            className="flex-1 bg-[#f84960] hover:opacity-90 text-white font-bold rounded-sm"
            aria-label="Confirm sign out"
          >
            Sign Out
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <WalletModal isOpen={walletModalOpen} onClose={() => setWalletModalOpen(false)} />
    </>
  );
}

export default Header;
