interface TradeHeaderProps {
  userRole: string;
}

export function TradeHeader({ userRole }: TradeHeaderProps) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="text-xs font-mono font-bold tracking-[0.15em] text-[#6b7280] uppercase">
        Your role
      </span>
      <span className="text-lg font-mono font-black text-[#f97316] tracking-wider uppercase">
        {userRole}
      </span>
    </div>
  );
}
