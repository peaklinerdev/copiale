import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface FilterBarProps {
  tradeType: string;
  onTradeTypeChange: (type: string) => void;
  asset: string;
  onAssetChange: (asset: string) => void;
  currency: string;
  onCurrencyChange: (currency: string) => void;
  amount: string;
  onAmountChange: (amount: string) => void;
  paymentMethod: string;
  onPaymentMethodChange: (method: string) => void;
  sortBy: string;
  onSortChange: (sort: string) => void;
}

const ASSETS = [
  { value: "USDT", label: "USDT", network: "Solana" },
  { value: "USDC", label: "USDC", network: "Solana" },
  { value: "XMR", label: "XMR", network: "Monero" },
];

const CURRENCIES: Record<string, { code: string; flag: string; label: string }> = {
  ETB: { code: "ETB", flag: "🇪🇹", label: "Ethiopian Birr" },
  NGN: { code: "NGN", flag: "🇳🇬", label: "Nigerian Naira" },
  VES: { code: "VES", flag: "🇻🇪", label: "Venezuelan Bolívar" },
  COP: { code: "COP", flag: "🇨🇴", label: "Colombian Peso" },
  KES: { code: "KES", flag: "🇰🇪", label: "Kenyan Shilling" },
  ZAR: { code: "ZAR", flag: "🇿🇦", label: "South African Rand" },
};

const PAYMENT_METHODS_BY_CURRENCY: Record<string, { value: string; label: string }[]> = {
  ALL: [
    { value: "ALL", label: "All payment methods" },
  ],
  ETB: [
    { value: "ALL", label: "All ETB methods" },
    { value: "telebirr", label: "Telebirr" },
    { value: "cbe_birr", label: "CBE Birr" },
    { value: "awash_bank", label: "Awash Bank" },
    { value: "dashen_bank", label: "Dashen Bank" },
    { value: "bank_of_abyssinia", label: "Bank of Abyssinia" },
    { value: "cash", label: "Cash in Person" },
  ],
  NGN: [
    { value: "ALL", label: "All NGN methods" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash in Person" },
  ],
  KES: [
    { value: "ALL", label: "All KES methods" },
    { value: "mpesa", label: "M-Pesa" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash in Person" },
  ],
  ZAR: [
    { value: "ALL", label: "All ZAR methods" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash in Person" },
  ],
  VES: [
    { value: "ALL", label: "All VES methods" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash in Person" },
  ],
  COP: [
    { value: "ALL", label: "All COP methods" },
    { value: "bank_transfer", label: "Bank Transfer" },
    { value: "cash", label: "Cash in Person" },
  ],
};

const FilterBar = ({
  tradeType,
  onTradeTypeChange,
  asset,
  onAssetChange,
  currency,
  onCurrencyChange,
  amount,
  onAmountChange,
  paymentMethod,
  onPaymentMethodChange,
  sortBy,
  onSortChange
}: FilterBarProps) => {
  const methods = PAYMENT_METHODS_BY_CURRENCY[currency] || PAYMENT_METHODS_BY_CURRENCY.ALL;
  const currentCurrency = CURRENCIES[currency];

  return (
    <div className="w-full space-y-3">
      {/* Row 1: Buy/Sell + Assets */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Buy/Sell toggle */}
        <div className="flex bg-[#2b3139] p-0.5 rounded-sm">
          <button
            onClick={() => onTradeTypeChange("BUY")}
            className={cn(
              "px-5 py-1.5 text-sm font-bold rounded-sm transition-all",
              tradeType === "BUY"
                ? "bg-[#02c076] text-white"
                : "text-[#848e9c] hover:text-[#eaecef]"
            )}
          >
            Buy
          </button>
          <button
            onClick={() => onTradeTypeChange("SELL")}
            className={cn(
              "px-5 py-1.5 text-sm font-bold rounded-sm transition-all",
              tradeType === "SELL"
                ? "bg-[#f84960] text-white"
                : "text-[#848e9c] hover:text-[#eaecef]"
            )}
          >
            Sell
          </button>
        </div>

        {/* Asset selector */}
        <div className="flex items-center gap-1">
          {ASSETS.map((a) => (
            <button
              key={a.value}
              onClick={() => onAssetChange(a.value)}
              className={cn(
                "px-3 py-1.5 text-sm font-bold rounded-sm transition-all text-center leading-tight",
                asset === a.value
                  ? "bg-[#2b3139] text-[#eaecef]"
                  : "text-[#848e9c] hover:text-[#eaecef]"
              )}
            >
              <span className="block">{a.label}</span>
              <span className="block text-[9px] font-normal text-[#5e6673]">{a.network}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: Filters */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Amount + Currency */}
        <div className="flex items-center bg-[#1e2329] border border-[#2b3139] rounded-sm h-10 w-full max-w-[300px]">
          <div className="flex-1 flex items-center px-3 border-r border-[#2b3139]">
            <Input
              type="text"
              placeholder="Amount"
              value={amount}
              onChange={(e) => onAmountChange(e.target.value)}
              className="bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0 p-0 h-full text-sm placeholder:text-[#5e6673]"
            />
          </div>
          <div className="w-[110px]">
            <Select value={currency} onValueChange={onCurrencyChange}>
              <SelectTrigger className="bg-transparent border-none focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px] focus:ring-offset-0 h-full text-sm font-bold">
                <SelectValue>
                  {currentCurrency ? (
                    <span className="flex items-center gap-1.5">
                      <span>{currentCurrency.flag}</span>
                      <span>{currentCurrency.code}</span>
                    </span>
                  ) : (
                    "ETB"
                  )}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                {Object.values(CURRENCIES).map((c) => (
                  <SelectItem key={c.code} value={c.code}>
                    <span className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.label} ({c.code})</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Payment Methods */}
        <div className="w-full max-w-[200px]">
          <Select value={paymentMethod} onValueChange={onPaymentMethodChange}>
            <SelectTrigger className="bg-[#1e2329] border-[#2b3139] rounded-sm h-10 text-sm">
              <SelectValue placeholder="Payment method" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
              {methods.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Reset */}
        <Button
          variant="ghost"
          size="sm"
          className="text-xs text-[#848e9c] hover:text-[#eaecef] p-0 h-auto"
          onClick={() => {
            onAmountChange("");
            onPaymentMethodChange("ALL");
            onSortChange("PRICE");
          }}
        >
          Reset
        </Button>

        {/* Sort */}
        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-[#848e9c] whitespace-nowrap">Sort</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="bg-transparent border-none focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px] focus:ring-offset-0 h-10 text-sm font-bold min-w-[80px]">
              <SelectValue placeholder="Price" />
            </SelectTrigger>
            <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
              <SelectItem value="PRICE">Price</SelectItem>
              <SelectItem value="TRADES">Trades</SelectItem>
              <SelectItem value="RATING">Rating</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
};

export default FilterBar;
