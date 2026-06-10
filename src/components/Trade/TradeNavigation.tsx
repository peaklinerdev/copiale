import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';

export function TradeNavigation() {
  const navigate = useNavigate();

  return (
    <button
      onClick={() => navigate('/trades')}
      className="flex items-center gap-1.5 text-[11px] font-mono text-[#6b7280] hover:text-[#ffffff] transition-colors uppercase tracking-wider"
    >
      <ArrowLeft className="w-3.5 h-3.5" />
      All trades
    </button>
  );
}
