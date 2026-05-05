import { SelectItem } from "@/components/ui/select";
import { TRADING_CURRENCIES } from "./currencies";

const FLAGS: Record<string, string> = {
  COP: "🇨🇴", NGN: "🇳🇬", VES: "🇻🇪", KES: "🇰🇪", ZAR: "🇿🇦", ETB: "🇪🇹",
};
const NAMES: Record<string, string> = {
  COP: "Colombian Peso", NGN: "Nigerian Naira", VES: "Venezuelan Bolívar",
  KES: "Kenyan Shilling", ZAR: "South African Rand", ETB: "Ethiopian Birr",
};

export const CurrencyOptions = () => (
  <>
    {TRADING_CURRENCIES.map((code) => (
      <SelectItem key={code} value={code}>
        {FLAGS[code]} {NAMES[code]} ({code})
      </SelectItem>
    ))}
  </>
);
