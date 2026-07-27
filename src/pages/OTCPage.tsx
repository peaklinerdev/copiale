import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { ArrowRight, Shield, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/ui/container';
import api from '@/api';
import { toast } from 'sonner';

export default function OTCPage() {
  const { primaryWallet } = useDynamicContext();
  const navigate = useNavigate();
  const [buyerAddress, setBuyerAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('USDT');
  const [fiatRef, setFiatRef] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerAddress || !amount) { setError('Buyer address and amount required'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/trades', {
        leg1_offer_id: -1, // sentinel — no offer for OTC
        leg1_crypto_amount: amount,
        leg1_fiat_amount: fiatRef || '0',
        from_fiat_currency: 'OTC',
        destination_fiat_currency: 'OTC',
        otc: true,
      }, { headers: { 'X-Network-Name': 'solana-devnet' } });

      const tradeId = res.data.trade.public_id || res.data.trade.id;
      toast.success('OTC escrow created');
      navigate(`/otc/${tradeId}`);
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <Container className="max-w-lg">
      <Card className="rounded-sm border border-[#2b3139] bg-[#111318]">
        <CardHeader>
          <CardTitle className="text-[#eaecef] font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#f97316]" />
            Direct OTC Escrow
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] font-mono text-muted mb-6 leading-relaxed">
            Send crypto directly to a counterparty with on-chain escrow. No public listing. No marketplace. Just you and them.
          </p>

          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-muted uppercase">Buyer's Solana Wallet</label>
              <Input
                value={buyerAddress}
                onChange={e => setBuyerAddress(e.target.value)}
                placeholder="Paste their wallet address..."
                className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-10 text-xs font-mono"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Amount</label>
                <Input
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 200"
                  type="number"
                  className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-10 text-xs font-mono"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Token</label>
                <select value={token} onChange={e => setToken(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-sm px-3 py-2 h-10 text-xs font-mono text-white">
                  <option>USDT</option>
                  <option>USDC</option>
                </select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] font-mono text-muted uppercase">Fiat Reference (optional)</label>
              <Input
                value={fiatRef}
                onChange={e => setFiatRef(e.target.value)}
                placeholder="e.g. 30,000 ETB via Telebirr"
                className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-10 text-xs font-mono"
              />
            </div>

            {error && <p className="text-red-400 text-xs font-mono">{error}</p>}

            <Button type="submit" disabled={loading || !primaryWallet}
              className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-11">
              {loading ? 'Creating...' : <><Wallet className="w-4 h-4 mr-2" /> Create Escrow</>}
            </Button>

            <p className="text-[10px] font-mono text-muted text-center">
              Creates an on-chain escrow. Share the link with your counterparty.
            </p>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
