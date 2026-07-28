import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Container from '@/components/Shared/Container';
import api from '@/api';
import { toast } from 'sonner';

export default function COTCPage() {
  const navigate = useNavigate();
  const [amount, setAmount] = useState('');
  const [token, setToken] = useState('USDT');
  const [fiatRef, setFiatRef] = useState('');
  const [fiatCurrency, setFiatCurrency] = useState('ETB');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [created, setCreated] = useState<{ link: string; publicId: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount) { setError('Amount is required'); return; }
    setLoading(true);
    setError('');

    try {
      const res = await api.post('/cotc', {
        amount, token, fiat_ref: fiatRef, fiat_currency: fiatCurrency,
      }, { headers: { 'X-Network-Name': 'solana-devnet' } });

      const id = res.data.trade.public_id || res.data.trade.id;
      const link = `${window.location.origin}/#/cotc/${id}`;
      setCreated({ link, publicId: String(id) });
      toast.success('COTC escrow created');
    } catch (e: any) {
      setError(e?.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const copyLink = () => {
    if (!created) return;
    navigator.clipboard.writeText(created.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (created) {
    return (
      <Container className="max-w-lg">
        <Card className="rounded-sm border border-[#2b3139] bg-[#111318]">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-sm bg-[#f97316]/10 flex items-center justify-center">
                <Check className="w-5 h-5 text-[#f97316]" />
              </div>
              <div>
                <h2 className="text-sm font-mono font-bold text-white">COTC Escrow Ready</h2>
                <p className="text-[10px] font-mono text-muted">{amount} {token} · {fiatRef || 'OTC trade'}</p>
              </div>
            </div>

            <div className="bg-[#0b0e11] rounded-sm p-3">
              <p className="text-[9px] font-mono text-muted uppercase mb-1">Share this link</p>
              <code className="text-[10px] font-mono text-[#f97316] break-all">{created.link}</code>
            </div>

            <Button onClick={copyLink} className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-10">
              <Copy className="w-3.5 h-3.5 mr-2" /> {copied ? 'Copied' : 'Copy Link'}
            </Button>

            <Button onClick={() => navigate(`/trade/${created.publicId}`)} variant="outline"
              className="w-full border-[#2b3139] text-muted font-mono text-xs rounded-sm h-9">
              View Trade
            </Button>

            <p className="text-[10px] font-mono text-muted text-center">
              Share with your counterparty. When they connect their wallet, the trade becomes active. Data is deleted after completion.
            </p>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-lg">
      <Card className="rounded-sm border border-[#2b3139] bg-[#111318]">
        <CardHeader>
          <CardTitle className="text-[#eaecef] font-bold flex items-center gap-2">
            <Shield className="w-5 h-5 text-[#f97316]" />
            Copiale Over-the-Counter
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-[11px] font-mono text-muted mb-6 leading-relaxed">
            Direct escrow between you and a counterparty. No marketplace listing. No public exposure. Share a single link.
          </p>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Amount</label>
                <Input value={amount} onChange={e => setAmount(e.target.value)}
                  placeholder="e.g. 200" type="number"
                  className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-10 text-xs font-mono" required />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-mono text-muted uppercase">Token</label>
                <select value={token} onChange={e => setToken(e.target.value)}
                  className="w-full bg-[#0b0e11] border border-[#2b3139] rounded-sm px-3 py-2 h-10 text-xs font-mono text-white">
                  <option>USDT</option><option>USDC</option>
                </select>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-mono text-muted uppercase">What they're paying (optional)</label>
              <Input value={fiatRef} onChange={e => setFiatRef(e.target.value)}
                placeholder="e.g. 30,000 ETB via Telebirr"
                className="border-[#2b3139] bg-[#0b0e11] text-white rounded-sm h-10 text-xs font-mono" />
            </div>
            {error && <p className="text-red-400 text-xs font-mono">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-11">
              {loading ? 'Creating...' : 'Create Escrow'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}
