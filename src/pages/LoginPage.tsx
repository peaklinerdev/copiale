import { useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ArrowRight, ShieldCheck, Zap, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Account } from '@/api';

interface LoginPageProps {
  account: Account | null;
}

function LoginPage({ account }: LoginPageProps) {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();
  const navigate = useNavigate();

  useEffect(() => {
    if (primaryWallet && account) {
      navigate('/', { replace: true });
    } else if (primaryWallet && account === null) {
      navigate('/register', { replace: true });
    }
  }, [primaryWallet, account, navigate]);

  if (primaryWallet) {
    return null;
  }

  return (
    <div className="relative overflow-hidden mb-6 rounded-sm border border-white/[0.04] bg-[#111318]/50 backdrop-blur-xl">
      <div className="max-w-4xl relative z-10 p-8 md:p-12">
        <h1 className="text-3xl md:text-5xl font-extrabold text-[#eaecef] mb-4 tracking-tight leading-tight">
          Welcome back
        </h1>
        <p className="text-base text-[#848e9c] mb-8 max-w-xl leading-relaxed">
          Connect your wallet to access your account and continue trading.
        </p>

        <div className="flex flex-wrap gap-3 mb-12">
          <Button
            size="lg"
            onClick={() => setShowAuthFlow(true)}
            className="bg-[#FF6B00] hover:opacity-90 !text-[#0b0e11] font-bold px-8 h-12 text-base rounded-sm"
          >
            Connect Wallet <ArrowRight className="ml-2" size={18} />
          </Button>
          <Button
            variant="ghost"
            size="lg"
            onClick={() => navigate('/')}
            className="border border-[#2b3139]/50 text-[#eaecef] hover:bg-[#2b3139]/50 h-12 px-8 text-base rounded-sm backdrop-blur-sm"
          >
            Browse Market
          </Button>
        </div>

        <p className="text-sm text-[#848e9c]">
          Don't have an account?{' '}
          <Link to="/register" className="text-[#FF6B00] hover:underline font-medium">
            Create one
          </Link>
        </p>

        <div className="flex flex-wrap gap-3 pt-8 mt-8 border-t border-[#2b3139]/30">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0b0e11]/40 rounded-sm border border-[#2b3139]/20 backdrop-blur-sm">
            <ShieldCheck size={18} className="text-[#02c076] shrink-0" />
            <span className="text-xs font-medium text-[#848e9c]">On-chain escrow</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0b0e11]/40 rounded-sm border border-[#2b3139]/20 backdrop-blur-sm">
            <Zap size={18} className="text-[#FF6B00] shrink-0" />
            <span className="text-xs font-medium text-[#848e9c]">Solana settlement</span>
          </div>
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0b0e11]/40 rounded-sm border border-[#2b3139]/20 backdrop-blur-sm">
            <Globe size={18} className="text-[#848e9c] shrink-0" />
            <span className="text-xs font-medium text-[#848e9c]">Global P2P</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;
