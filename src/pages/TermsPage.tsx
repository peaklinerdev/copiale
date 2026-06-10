function TermsPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-[#eaecef] mb-8">Terms of Use</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">1. Acceptance of Terms</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          By using Copiale-p2p, you agree to these terms. If you do not agree, do not use the platform.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">2. Platform Description</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          Copiale-p2p is a non-custodial peer-to-peer escrow trading platform. We facilitate on-chain
          settlements between buyers and sellers using Solana smart contracts. We do not hold user funds.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">3. User Responsibilities</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          You are responsible for maintaining the security of your wallet and private keys.
          All trades are final once confirmed on-chain. You must comply with all applicable
          laws and regulations in your jurisdiction.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">4. Disclaimers</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          This platform is provided "as is" without warranties of any kind. We are not responsible
          for any losses resulting from trades, smart contract bugs, or blockchain network issues.
        </p>
      </section>

      <p className="text-xs text-[#5e6673] mt-8">
        Last updated: June 2025
      </p>
    </div>
  );
}

export default TermsPage;
