import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Share2, Check } from 'lucide-react';
import Container from '@/components/Shared/Container';

const DOT = '<.>';

const ManifestoPage = () => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    window.print();
  };

  const handleShareQuote = async () => {
    const selection = window.getSelection()?.toString().trim();
    const defaultQuote = `"Fiat currency is the modern plantation." \u2014 ${DOT}`;
    const quote = selection || defaultQuote;
    try {
      if (navigator.share) {
        await navigator.share({ title: `${DOT} Manifesto`, text: quote });
      } else {
        await navigator.clipboard.writeText(quote);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(quote);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  };

  return (
    <>
      <style>{`
        @media print {
          body * { visibility: hidden; }
          #manifesto-content, #manifesto-content * { visibility: visible; }
          #manifesto-content { position: absolute; left: 0; top: 0; width: 100%; padding: 2rem; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Container className="max-w-3xl py-12">
        <div id="manifesto-content" ref={contentRef}>
          <div className="text-center mb-12">
            <img src="/copiale-p2p.svg" alt={DOT} className="w-20 h-20 mx-auto mb-6" />
            <h1 className="text-3xl md:text-4xl font-black text-[#FF6B00] tracking-tight mb-2">
              Copiale-p2p
            </h1>
            <p className="text-sm font-bold text-[#5e6673] uppercase tracking-[0.3em]">{DOT}</p>
            <p className="text-xs text-[#5e6673] mt-2">the eye that watches back</p>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-[#eaecef] mb-8 tracking-tight">MANIFESTO</h2>

          <blockquote className="border-l-2 border-[#FF6B00]/30 pl-6 my-8 italic text-[#848e9c] text-base leading-relaxed">
            &ldquo;The slave worked the fields, and the master gave him shelter and bread. The worker today clocks in from dawn to dusk, and the state prints him a piece of paper so he can afford shelter and bread &mdash; barely. The master could not print more land. The state can print infinite paper. That is not progress. That is a more efficient leash.&rdquo;
          </blockquote>

          <p className="text-[#848e9c] leading-relaxed mb-5">
            <span className="text-[#eaecef] font-semibold">Fiat currency is the modern plantation.</span> You work. You produce value. In return, you receive tokens whose supply is controlled entirely by the very institutions that benefit from your labor. They print more whenever they need to &mdash; diluting your purchasing power, eroding your savings, and keeping you exactly where they want you: running fast enough to survive, never fast enough to escape.
          </p>

          <p className="text-[#848e9c] leading-relaxed mb-5">
            Cryptocurrency was supposed to break this cycle. A form of money that no central authority could debase, no government could freeze, no bank could deny. But we watched as the same forces co-opted it &mdash; centralized exchanges demanding your identity, stablecoins with freeze functions, chains with validators under state pressure, &ldquo;regulated&rdquo; DeFi that asks permission before letting you transact.
          </p>

          <p className="text-[#848e9c] leading-relaxed mb-8">
            <span className="text-[#eaecef] font-semibold">We reject every form of this.</span> We reject AML as a pretext for mass surveillance. We reject KYC as a tool of financial exclusion dressed up as consumer protection. We reject CBDCs as the final lock on the cage &mdash; programmable money with an off switch controlled by the same people who printed you into poverty.
          </p>

          <h3 className="text-sm font-black text-[#FF6B00] uppercase tracking-[0.2em] mb-6">What {DOT} Is</h3>

          <p className="text-[#848e9c] leading-relaxed mb-5">
            <span className="text-[#eaecef] font-semibold">{DOT} is a peer-to-peer escrow marketplace.</span> Users post offers to buy or sell crypto for fiat currency. The escrow is enforced by a smart contract &mdash; funds are locked on-chain until both parties confirm the trade or a dispute is resolved. The contract is immutable.
          </p>

          <p className="text-[#848e9c] leading-relaxed mb-5">
            We support stablecoin trading on Solana. Settlement is on-chain. Custody is self-sovereign &mdash; your keys, your coins, always. Fiat payments happen off-chain through local payment methods: mobile money, bank transfer, cash in person. The platform connects buyers and sellers. The code enforces the rules. No company holds your funds. No company can freeze your account. No company can decide you are not allowed to trade.
          </p>

          <p className="text-[#848e9c] leading-relaxed mb-8">
            {DOT} is a fork of <span className="text-[#eaecef] font-semibold">YapBay</span>, an open-source P2P remittance protocol built by the Panmoni studio. YapBay&apos;s vision &mdash; unstoppable fiat-to-fiat crypto remittances as a spark for crypto-first economies &mdash; is the foundation we build upon. We are grateful to the developers who shipped working code into the world under an MIT license. The code belongs to everyone.
          </p>

          <h3 className="text-sm font-black text-[#FF6B00] uppercase tracking-[0.2em] mb-6">The Eye</h3>

          <p className="text-[#848e9c] leading-relaxed mb-5">
            The Copiale logo is the code-equivalent of an eye &mdash; not the eye that watches you, but <span className="text-[#eaecef] font-semibold">the eye that watches the watchers back.</span> Surveillance is not a one-way street. For every institution that monitors your transactions, there must be code that monitors theirs. For every database that logs your activity, there must be a network that logs theirs. The Copiale eye is a symbol of reciprocal transparency: the observed become the observers.
          </p>

          <p className="text-[#848e9c] leading-relaxed mb-8">
            In conversation, we refer to the platform as <span className="text-[#eaecef] font-semibold">{DOT}</span>. A closed bracket, a dot, an open bracket. Minimal. Anonymous. Unbrandable. The name does not matter. The code matters. The trades matter. The freedom matters.
          </p>

          <h3 className="text-sm font-black text-[#FF6B00] uppercase tracking-[0.2em] mb-6">Principles</h3>

          <div className="space-y-4 mb-8">
            {[
              ['I', 'Self-custody is non-negotiable.', 'The escrow is code. The code runs on a permissionless blockchain. No human intermediary can touch your funds.'],
              ['II', 'Privacy is not a crime.', 'We do not collect identity documents. We do not run analytics. We do not share data with anyone \u2014 because we do not have any to share. The trade is between you and your counterparty.'],
              ['III', 'The protocol has no jurisdiction.', 'The contracts live on-chain. The frontend is served from decentralized infrastructure. There is no office to raid, no company to subpoena, no CEO to arrest.'],
              ['IV', 'Disputes are resolved by peers, not courts.', 'The arbitrator model means trusted community members resolve conflicts using evidence and bonds. No lawyers. No filing fees. No years-long proceedings. Just facts and a decision.'],
              ['V', 'Code over credentials.', 'We do not care who you are. We care whether the transaction is valid. Identity is a liability in a surveillance economy. Pseudonymity is a feature, not a bug.'],
            ].map(([num, title, body]) => (
              <div key={num} className="flex gap-4">
                <span className="text-[10px] font-black text-[#FF6B00] bg-[#FF6B00]/10 px-2 py-0.5 rounded-sm h-fit mt-1 shrink-0">{num}</span>
                <p className="text-[#848e9c] leading-relaxed"><span className="text-[#eaecef] font-semibold">{title}</span> {body}</p>
              </div>
            ))}
          </div>

          <div className="border-t border-white/[0.04] pt-8 mt-12">
            <p className="text-xs text-[#5e6673]">{DOT} &mdash; burn after reading.</p>
            <p className="text-xs text-[#5e6673]">No copyright. No trademark. No headquarters.</p>
          </div>
        </div>

        <div className="no-print flex flex-wrap gap-3 mt-10 pt-8 border-t border-white/[0.04]">
          <Button
            onClick={handleDownload}
            variant="outline"
            className="border-white/[0.06] text-[#eaecef] hover:bg-[#1e2329] rounded-sm h-10 px-5 text-sm gap-2"
          >
            <Download size={14} />
            Download Manifesto
          </Button>
          <Button
            onClick={handleShareQuote}
            variant="outline"
            className="border-white/[0.06] text-[#eaecef] hover:bg-[#1e2329] rounded-sm h-10 px-5 text-sm gap-2"
          >
            {copied ? <Check size={14} className="text-[#02c076]" /> : <Share2 size={14} />}
            {copied ? 'Copied' : 'Share Quote'}
          </Button>
        </div>
      </Container>
    </>
  );
};

export default ManifestoPage;
