function PrivacyPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-[#eaecef] mb-8">Privacy Policy</h1>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">1. Information We Collect</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          We collect your wallet address, username, and email address when you create an account.
          We do not collect any personal information beyond what you voluntarily provide.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">2. How We Use Your Information</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          Your information is used solely to operate the platform: facilitate trades, display your
          profile to counterparties, and send important notifications. We do not sell or share your
          data with third parties.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">3. Blockchain Data</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          All trade and escrow transactions occur on the Solana blockchain. Blockchain data is
          public by design and cannot be deleted. Your wallet address and transaction history
          are visible to anyone inspecting the chain.
        </p>
      </section>

      <section className="mb-6">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-3">4. Data Retention</h2>
        <p className="text-[#848e9c] text-sm leading-relaxed">
          We retain your account data for as long as your account is active. You may request
          deletion of your account and associated data by contacting us, subject to blockchain
          records which are immutable.
        </p>
      </section>

      <p className="text-xs text-[#5e6673] mt-8">
        Last updated: June 2025
      </p>
    </div>
  );
}

export default PrivacyPage;
