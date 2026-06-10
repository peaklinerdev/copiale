function FeesPage() {
  return (
    <div className="max-w-3xl mx-auto py-12">
      <h1 className="text-3xl font-bold text-[#eaecef] mb-8">Fees & Limits</h1>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-4">Platform Fee</h2>
        <p className="text-[#848e9c] mb-4">
          A <strong className="text-[#eaecef]">1%</strong> platform fee is charged on the crypto amount
          of each completed trade. This fee is deducted from the seller's proceeds at settlement.
        </p>
      </section>

      <section className="mb-8">
        <h2 className="text-xl font-semibold text-[#eaecef] mb-4">Trade Limits</h2>
        <div className="bg-[#1e2329] border border-[#2b3139] rounded-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#2b3139]">
                <th className="text-left p-3 text-[#848e9c] font-medium">Limit</th>
                <th className="text-left p-3 text-[#848e9c] font-medium">Value</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-[#2b3139]/50">
                <td className="p-3 text-[#eaecef]">Maximum trade size</td>
                <td className="p-3 text-[#eaecef]">100 USDT</td>
              </tr>
              <tr className="border-b border-[#2b3139]/50">
                <td className="p-3 text-[#eaecef]">Dispute bond</td>
                <td className="p-3 text-[#eaecef]">5% of trade amount</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-xl font-semibold text-[#eaecef] mb-4">Blockchain Costs</h2>
        <p className="text-[#848e9c] mb-4">
          All trades settle on Solana. You'll need a small amount of SOL in your wallet
          to cover transaction fees (typically less than $0.01 per transaction).
        </p>
      </section>
    </div>
  );
}

export default FeesPage;
