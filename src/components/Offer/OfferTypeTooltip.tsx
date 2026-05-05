import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface OfferTypeTooltipProps {
  offerType: string;
  token?: string;
}

function OfferTypeTooltip({ offerType, token }: OfferTypeTooltipProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <span
            className={`px-2 py-0.5 rounded-sm text-[10px] font-black uppercase tracking-wider ${
              offerType === "BUY"
                ? "bg-[#02c076] text-white"
                : "bg-[#f84960] text-white"
            }`}
          >
            {offerType}
          </span>
        </TooltipTrigger>
        <TooltipContent
          className={`rounded-sm border-none font-bold text-[10px] uppercase tracking-wider ${
            offerType === "BUY"
              ? "bg-[#02c076] text-white"
              : "bg-[#f84960] text-white"
          }`}
        >
          <p>
            {offerType === "BUY"
              ? `Advertiser wants to Buy ${token ?? "crypto"}`
              : `Advertiser wants to Sell ${token ?? "crypto"}`}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export default OfferTypeTooltip;
