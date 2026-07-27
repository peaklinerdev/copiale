import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getTradeById, Trade } from '@/api';
import { Shield, ArrowRight, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Container from '@/components/ui/container';
import { toast } from 'sonner';

export default function OTCViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!id) return;
    getTradeById(id as any).then(res => setTrade(res.data.trade)).catch(() => {}).finally(() => setLoading(false));
  }, [id]);

  const copyLink = () => { navigator.clipboard.writeText(window.location.href); setCopied(true); toast.success('Link copied'); setTimeout(() => setCopied(false), 2000); };

  if (loading) return <Container className="max-w-lg"><div className="text-center py-16 text-muted text-sm font-mono">Loading...</div></Container>;
  if (!trade) return <Container className="max-w-lg"><div className="text-center py-16 text-muted text-sm font-mono">Trade not found</div></Container>;

  return (
    <Container className="max-w-lg">
      <div className="rounded-sm border border-[#2b3139] bg-[#111318] p-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-sm bg-[#f97316]/10 flex items-center justify-center"><Shield className="w-5 h-5 text-[#f97316]" /></div>
          <div><h2 className="text-sm font-mono font-bold text-white">Direct OTC Escrow</h2><p className="text-[10px] font-mono text-muted">On-chain · Private</p></div>
        </div>
        <div className="bg-[#0b0e11] rounded-sm p-4 space-y-2">
          <div className="flex justify-between text-xs font-mono"><span className="text-muted">Amount</span><span className="text-white font-bold">{trade.leg1_crypto_amount} {trade.leg1_crypto_token || 'USDT'}</span></div>
          {trade.leg1_fiat_amount && trade.leg1_fiat_amount !== '0' && <div className="flex justify-between text-xs font-mono"><span className="text-muted">Fiat Reference</span><span className="text-white">{trade.leg1_fiat_amount} {trade.destination_fiat_currency || ''}</span></div>}
          <div className="flex justify-between text-xs font-mono pt-2 border-t border-[#1f1f1f]"><span className="text-muted">Status</span><span className="text-[#f97316] font-bold">{trade.leg1_state?.replace(/_/g, ' ') || 'Created'}</span></div>
        </div>
        <Button onClick={() => navigate(`/trade/${trade.public_id || trade.id}`)} className="w-full bg-[#f97316] hover:opacity-90 text-white font-mono font-bold rounded-sm h-11"><ArrowRight className="w-4 h-4 mr-2" /> Open Trade</Button>
        <Button type="button" onClick={copyLink} variant="outline" className="w-full border-[#2b3139] text-muted font-mono text-xs rounded-sm"><Copy className="w-3.5 h-3.5 mr-2" /> {copied ? 'Copied' : 'Copy Link'}</Button>
        <p className="text-[10px] font-mono text-muted text-center">Share this link only with your counterparty.</p>
      </div>
    </Container>
  );
}
