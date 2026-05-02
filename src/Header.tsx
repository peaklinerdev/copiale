import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { formatNumber } from './lib/utils';
import {
  useDynamicContext,
  DynamicWidget,
  getAuthToken,
  getNetwork,
  useWalletConnectorEvent,
} from '@dynamic-labs/sdk-react-core';
import { Account, setAuthToken, getPrices } from './api';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Menu, X, BarChart3 } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import StatusBadge from '@/components/Shared/StatusBadge';
import Container from '@/components/Shared/Container';
import { useBlockchainService } from './hooks/useBlockchainService';

interface HeaderProps {
  isLoggedIn: boolean;
  account: Account | null;
}

function Header({ isLoggedIn, account }: HeaderProps) {
  const { setShowAuthFlow, handleLogOut, primaryWallet } = useDynamicContext();
  const { service: blockchainService, isConnected } = useBlockchainService();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [prices, setPrices] = useState<Record<string, { price: string; timestamp: number }> | null>(
    null
  );
  const [priceError, setPriceError] = useState<string | null>(null);
  const [usdtBalance, setUsdtBalance] = useState<string>('0.00');
  const [currentNetwork, setCurrentNetwork] = useState<number | string | null>(null);

  const fetchPrices = useCallback(async () => {
    try {
      const response = await getPrices();
      setPrices(response.data.data.USDC); // Keep USDC price source for now if USDT not available
      setPriceError(null);
    } catch (err) {
      setPriceError(err instanceof Error ? err.message : 'Unknown error');
    }
  }, []);

  useEffect(() => {
    const fetchUsdtBalance = async () => {
      if (isConnected && primaryWallet?.address) {
        try {
          const balance = await blockchainService.getWalletBalance();
          const formattedBalance = (balance / 1_000_000).toFixed(2);
          setUsdtBalance(formattedBalance);
        } catch (error) {
          console.error('Error fetching USDT balance:', error);
        }
      }
    };

    fetchUsdtBalance();
    const interval = setInterval(fetchUsdtBalance, 30000);
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
    <header className="fixed top-0 left-0 right-0 z-50 bg-[#1e2329] border-b border-[#2b3139] h-14 flex items-center">
      <Container>
        <div className="flex justify-between items-center h-full">
          <div className="flex items-center gap-8">
            <Link to="/" className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#fcd535] rounded-sm flex items-center justify-center">
                <BarChart3 size={20} className="text-[#0b0e11]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-[#eaecef]">Copiale-p2p</span>
            </Link>
            
            <nav className="hidden md:flex items-center gap-6">
              <Link to="/" className="text-sm font-medium text-[#fcd535] hover:text-[#fcd535]">Market</Link>
              <span className="text-xs text-[#848e9c] border border-[#2b3139] px-2 py-0.5 rounded-sm uppercase font-bold">USDT/USDC on Solana/EVM</span>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Desktop Prices */}
            <div className="hidden lg:flex items-center gap-4 mr-4">
              {prices && Object.entries(prices).slice(0, 3).map(([currency, priceData]) => (
                <div key={currency} className="flex gap-2 items-center">
                  <span className="text-[11px] font-bold text-[#848e9c]">{currency}</span>
                  <span className="text-xs font-medium text-[#02c076]">
                    {formatNumber(priceData.price)}
                  </span>
                </div>
              ))}
            </div>

            {isLoggedIn ? (
              <div className="flex items-center gap-4">
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-[10px] text-[#848e9c] uppercase font-bold tracking-wider">Balance</span>
                  <span className="text-sm font-bold text-[#eaecef]">{usdtBalance} USDT</span>
                </div>
                <DynamicWidget />
                <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                  <DropdownMenuTrigger className="focus:outline-none">
                    <Avatar className="w-8 h-8 rounded-sm ring-1 ring-[#2b3139] hover:ring-[#fcd535] transition-all">
                      <AvatarImage src={account?.profile_photo_url} />
                      <AvatarFallback className="bg-[#2b3139] text-[#848e9c] rounded-sm">
                        <User className="h-4 w-4" />
                      </AvatarFallback>
                    </Avatar>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56 mt-2 bg-[#1e2329] border-[#2b3139] text-[#eaecef] rounded-sm p-1">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="cursor-pointer hover:bg-[#2b3139] rounded-sm">Dashboard</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/offers" className="cursor-pointer hover:bg-[#2b3139] rounded-sm">My Ads</Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/trades" className="cursor-pointer hover:bg-[#2b3139] rounded-sm">Orders</Link>
                    </DropdownMenuItem>
                    <div className="h-px bg-[#2b3139] my-1" />
                    <DropdownMenuItem onClick={handleLogOut} className="text-[#f84960] cursor-pointer hover:bg-[#f84960]/10 rounded-sm">
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <Button
                onClick={() => setShowAuthFlow(true)}
                className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold px-4 h-8 text-sm rounded-sm"
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
                <Link to="/trades" onClick={() => setMobileMenuOpen(false)} className="p-3 text-[#eaecef] bg-[#1e2329] rounded-sm">Orders</Link>
              </>
            )}
          </nav>
          {!isLoggedIn && (
            <Button
              onClick={() => { setShowAuthFlow(true); setMobileMenuOpen(false); }}
              className="bg-[#fcd535] text-[#0b0e11] font-bold w-full h-12 rounded-sm"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      )}
    </header>
  );
}

export default Header;
