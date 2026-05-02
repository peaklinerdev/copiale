import { Offer } from '@/api';
import { formatNumber } from '@/lib/utils';
import { formatRate, rateAdjustmentDirection } from '@/utils/stringUtils';

interface OfferDescriptionProps {
  offer: Offer;
  className?: string;
}

function OfferDescription({ offer, className = '' }: OfferDescriptionProps) {
  const action = offer.offer_type === 'BUY' ? 'buying' : 'selling';

  return (
    <div className={`space-y-1 ${className}`}>
      <div className="text-sm font-bold text-[#eaecef]">
        You are {action} <span className="text-[#fcd535]">{offer.token}</span> for {offer.fiat_currency}
      </div>
      <div className="text-xs text-[#848e9c]">
        Rate: {' '}
        <span
          className={
            rateAdjustmentDirection(offer.rate_adjustment) === 'up'
              ? 'text-[#02c076]'
              : rateAdjustmentDirection(offer.rate_adjustment) === 'down'
              ? 'text-[#f84960]'
              : 'text-[#eaecef]'
          }
        >
          {formatRate(offer.rate_adjustment)}
        </span>{' '}
        of market price
      </div>
      <div className="text-[10px] text-[#5e6673] flex gap-3 uppercase font-bold tracking-tighter">
        <span>Min: {formatNumber(offer.min_amount)}</span>
        <span>Max: {formatNumber(offer.max_amount)}</span>
        <span>Total: {formatNumber(offer.total_available_amount)}</span>
      </div>
    </div>
  );
}

export default OfferDescription;
