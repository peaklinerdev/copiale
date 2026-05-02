import React from 'react';
import { Button } from '@/components/ui/button';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ArrowRight, ShieldCheck, Zap, Globe2 } from 'lucide-react';

export const IntroMessageNotLoggedIn: React.FC = () => {
  const { setShowAuthFlow } = useDynamicContext();

  return (
    <div className="bg-[#1e2329] border border-[#2b3139] p-8 md:p-12 mb-8 relative overflow-hidden">
      <div className="max-w-4xl relative z-10">
        <h2 className="text-4xl md:text-6xl font-extrabold text-[#eaecef] mb-6 tracking-tight">
          Trade <span className="text-[#fcd535]">USDT/USDC</span> <br />
          on Solana & EVM
        </h2>
        
        <p className="text-lg text-[#848e9c] mb-10 max-w-2xl leading-relaxed">
          The premier institutional-grade P2P marketplace. Direct on-chain settlement, 
          escrow protection, and borderless liquidity for the modern trader.
        </p>
        
        <div className="flex flex-wrap gap-4 mb-16">
          <Button 
            size="lg" 
            onClick={() => setShowAuthFlow(true)}
            className="bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold px-10 h-14 text-lg rounded-sm"
          >
            Start Trading <ArrowRight className="ml-2" size={20} />
          </Button>
          <Button 
            variant="outline" 
            size="lg"
            className="border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] h-14 px-10 text-lg rounded-sm"
          >
            View Market
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-12 pt-10 border-t border-[#2b3139]">
          <div className="flex items-center gap-4">
            <ShieldCheck size={32} className="text-[#02c076] shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#eaecef]">Escrow Protection</h4>
              <p className="text-xs text-[#848e9c]">100% on-chain security.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Zap size={32} className="text-[#fcd535] shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#eaecef]">Instant Settlement</h4>
              <p className="text-xs text-[#848e9c]">Solana/EVM powered speed.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <Globe2 size={32} className="text-[#848e9c] shrink-0" />
            <div>
              <h4 className="text-sm font-bold text-[#eaecef]">Zero Boundaries</h4>
              <p className="text-xs text-[#848e9c]">Global liquidity access.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Decorative Binance-style grid background element */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-[#fcd535]/5 hidden lg:block" style={{ clipPath: 'polygon(100% 0, 0% 100%, 100% 100%)' }}></div>
    </div>
  );
};

export default IntroMessageNotLoggedIn;
