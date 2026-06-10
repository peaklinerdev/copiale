import { useState, useEffect, useMemo } from 'react';
import { useDynamicContext } from '@dynamic-labs/sdk-react-core';
import { getAccount, Account, CreateOfferRequest } from '@/api';
import { toUsdcString } from '@/utils/amounts';
import { compareUsdcStrings } from '@/utils/money-display';
import { useSolanaDevnetOffers } from '@/hooks/useNetworkAwareAPI';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { CurrencyOptions } from '@/lib/currencyOptions';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Container from '@/components/Shared/Container';
import { ErrorBanner } from '@/components/Shared/ErrorBanner';
import { ApiError, toApiError } from '@/api/errors';
import { PAYMENT_METHODS, getPaymentMethodById } from '@/lib/paymentMethods';
import { ArrowLeft, ArrowRight, Check } from 'lucide-react';
import { loadFallbackPrices } from '@/lib/priceFallback';
import type { PricesResponse } from '@/api';

// ===== Step definitions =====
const STEPS = [
  { num: 1, label: 'Trade Type',     desc: 'What and how' },
  { num: 2, label: 'Amount & Price', desc: 'Limits and rate' },
  { num: 3, label: 'Payment',        desc: 'How you get paid' },
  { num: 4, label: 'Review & Post',  desc: 'Preview your ad' },
];

const TOTAL_STEPS = STEPS.length;

// ===== Currency flags & names for the preview =====
const FLAGS: Record<string, string> = {
  COP: '🇨🇴', NGN: '🇳🇬', VES: '🇻🇪', KES: '🇰🇪', ZAR: '🇿🇦', ETB: '🇪🇹',
};

// ===== Step progress bar =====
function StepIndicator({ currentStep }: { currentStep: number }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-3">
        {STEPS.map((s, i) => {
          const isDone = i + 1 < currentStep;
          const isCurrent = i + 1 === currentStep;
          return (
            <div key={s.num} className="flex items-center flex-1 last:flex-[0]">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-sm flex items-center justify-center text-xs font-bold border-2 transition-all ${
                    isDone
                      ? 'bg-[#02c076] border-[#02c076] text-white'
                      : isCurrent
                      ? 'bg-[#FF6B00] border-[#FF6B00] text-[#0b0e11]'
                      : 'bg-transparent border-[#2b3139] text-[#848e9c]'
                  }`}
                >
                  {isDone ? <Check size={14} /> : s.num}
                </div>
                <span
                  className={`text-[10px] mt-1.5 font-bold uppercase whitespace-nowrap ${
                    isCurrent ? 'text-[#FF6B00]' : isDone ? 'text-[#02c076]' : 'text-[#848e9c]'
                  }`}
                >
                  {s.label}
                </span>
              </div>
              {i < TOTAL_STEPS - 1 && (
                <div
                  className={`flex-1 h-0.5 mx-2 mt-[-8px] rounded transition-all ${
                    i + 1 < currentStep ? 'bg-[#02c076]' : 'bg-[#2b3139]'
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
      <p className="text-xs text-center text-[#848e9c]">
        Step {currentStep} of {TOTAL_STEPS} — {STEPS[currentStep - 1].desc}
      </p>
    </div>
  );
}

// ===== Help tip callout =====
function FieldTip({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[11px] text-[#848e9c]/70 leading-relaxed mt-1">
      {children}
    </p>
  );
}

// ===== Form state type =====
interface FormState {
  creator_account_id: string;
  offer_type: 'BUY' | 'SELL';
  token: string;
  min_amount: string;
  max_amount: string;
  total_available_amount: string;
  rate_adjustment: string;
  terms: string;
  escrow_deposit_time_limit: string;
  fiat_payment_time_limit: string;
  fiat_currency: string;
  payment_method_id: string;
  payment_account: string;
  payment_notes: string;
}

// ===== Preview card =====
function OfferPreviewCard({
  formData,
  account,
}: {
  formData: FormState;
  account: Account | null;
}) {
  const method = getPaymentMethodById(formData.payment_method_id);
  const typeColor = formData.offer_type === 'BUY' ? 'text-[#02c076]' : 'text-[#f84960]';
  const typeBg = formData.offer_type === 'BUY' ? 'bg-[#02c076]/10' : 'bg-[#f84960]/10';
  const flag = FLAGS[formData.fiat_currency] || '';

  const rateNum = parseFloat(formData.rate_adjustment || '1');
  const pct = rateNum === 1 ? 'Market price' : rateNum > 1 ? `+${((rateNum - 1) * 100).toFixed(1)}%` : `${((rateNum - 1) * 100).toFixed(1)}%`;

  return (
    <div className="border border-[#FF6B00]/20 rounded-sm bg-[#0b0e11] p-4">
      <p className="text-[10px] font-bold text-[#848e9c] uppercase tracking-wider mb-3">Ad Preview</p>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-sm bg-[#2b3139] flex items-center justify-center text-xs text-[#848e9c]">
            {(account?.username || '?')[0].toUpperCase()}
          </div>
          <span className="text-sm font-medium text-[#eaecef]">
            {account?.username || 'You'}
          </span>
        </div>
        <span className={`text-xs font-bold px-2 py-0.5 rounded-sm ${typeBg} ${typeColor}`}>
          {formData.offer_type} {formData.token}
        </span>
      </div>
      <div className="grid grid-cols-2 gap-3 text-xs">
        <div>
          <span className="text-[#848e9c]">Currency</span>
          <p className="text-[#eaecef] font-medium">{flag} {formData.fiat_currency}</p>
        </div>
        <div>
          <span className="text-[#848e9c]">Rate</span>
          <p className={`font-medium ${rateNum > 1 ? 'text-[#02c076]' : rateNum < 1 ? 'text-[#f84960]' : 'text-[#eaecef]'}`}>
            {pct}
          </p>
        </div>
        <div>
          <span className="text-[#848e9c]">Range</span>
          <p className="text-[#eaecef] font-medium">
            {formData.min_amount || '—'} – {formData.max_amount || '—'} {formData.token}
          </p>
        </div>
        <div>
          <span className="text-[#848e9c]">Available</span>
          <p className="text-[#eaecef] font-medium">{formData.total_available_amount || '—'} {formData.token}</p>
        </div>
        <div className="col-span-2">
          <span className="text-[#848e9c]">Payment</span>
          <p className="text-[#eaecef] font-medium">{method?.name || '—'}</p>
        </div>
      </div>
    </div>
  );
}

const INITIAL_FORM: FormState = {
  creator_account_id: '',
  offer_type: 'BUY',
  token: 'USDT',
  min_amount: '',
  max_amount: '',
  total_available_amount: '',
  rate_adjustment: '1.05',
  terms: '',
  escrow_deposit_time_limit: '15 minutes',
  fiat_payment_time_limit: '30 minutes',
  fiat_currency: 'ETB',
  payment_method_id: 'telebirr',
  payment_account: '',
  payment_notes: '',
};

interface CreateOfferPageProps {
  account: Account | null;
}

function CreateOfferPage({ account: propAccount }: CreateOfferPageProps) {
  const [internalAccount, setInternalAccount] = useState<Account | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { createOffer } = useSolanaDevnetOffers();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormState>(INITIAL_FORM);
  const [fieldError, setFieldError] = useState('');
  const [success, setSuccess] = useState('');
  const [error, setError] = useState<string | ApiError | ''>('');
  const [fallbackPrices, setFallbackPrices] = useState<PricesResponse | null>(null);
  const [fiatPriceInput, setFiatPriceInput] = useState('');

  useEffect(() => {
    loadFallbackPrices().then(setFallbackPrices).catch(() => {});
  }, []);

  const tokenPrices = useMemo(() => {
    if (!fallbackPrices) return null;
    const tokenKey = formData.token === 'USDT' || formData.token === 'USDC' ? formData.token : 'USDT';
    return fallbackPrices.data[tokenKey as keyof typeof fallbackPrices.data] as Record<string, { price: string }> | undefined;
  }, [fallbackPrices, formData.token]);

  const marketPrice = useMemo(() => {
    if (!tokenPrices) return null;
    const entry = tokenPrices[formData.fiat_currency as keyof typeof tokenPrices];
    return entry ? parseFloat(entry.price) : null;
  }, [tokenPrices, formData.fiat_currency]);

  // Sync rate_adjustment from fiat price or vice versa
  const updateFiatPrice = (fiatValue: string) => {
    setFiatPriceInput(fiatValue);
    const price = parseFloat(fiatValue);
    if (marketPrice && !isNaN(price) && price > 0) {
      const adjustment = price / marketPrice;
      setFormData(prev => ({ ...prev, rate_adjustment: adjustment.toFixed(4) }));
    }
    setFieldError('');
  };

  const updateRateAdjustment = (pct: string) => {
    const pctNum = parseFloat(pct || '0');
    if (isNaN(pctNum)) return;
    const adjustment = ((1 + pctNum / 100)).toString();
    setFormData(prev => ({ ...prev, rate_adjustment: adjustment }));
    if (marketPrice) {
      const fiat = marketPrice * (1 + pctNum / 100);
      setFiatPriceInput(fiat.toFixed(2));
    }
    setFieldError('');
  };

  useEffect(() => {
    const fetchAccount = async () => {
      if (!propAccount && primaryWallet) {
        try {
          const response = await getAccount();
          setInternalAccount(response.data);
          setFormData(prev => ({ ...prev, creator_account_id: response.data.id.toString() }));
        } catch (err) {
          console.error('Failed to fetch account:', err);
        }
      }
    };
    fetchAccount();
  }, [propAccount, primaryWallet]);

  const account = propAccount || internalAccount;
  // Sync initial fiat price from rate_adjustment + market price
  useEffect(() => {
    if (marketPrice && !fiatPriceInput) {
      const rate = parseFloat(formData.rate_adjustment || '1');
      const fiat = marketPrice * rate;
      setFiatPriceInput(fiat.toFixed(2));
    }
  }, [marketPrice]);

  const selectedPaymentMethod = getPaymentMethodById(formData.payment_method_id);

  const update = (patch: Partial<FormState>) => {
    setFormData(prev => ({ ...prev, ...patch }));
    setFieldError('');
  };

  // ---- Step validation ----
  const canAdvanceFrom = (s: number): boolean => {
    switch (s) {
      case 1:
        return true; // defaults are always valid
      case 2: {
        if (!formData.min_amount || !formData.max_amount || !formData.total_available_amount) {
          setFieldError('All amount fields are required');
          return false;
        }
        const rate = parseFloat(formData.rate_adjustment);
        if (isNaN(rate) || rate <= 0) {
          setFieldError('Rate must be a positive number');
          return false;
        }
        return true;
      }
      case 3: {
        if (!formData.payment_account) {
          setFieldError(`Please provide your ${selectedPaymentMethod?.accountLabel}`);
          return false;
        }
        const pmId = formData.payment_method_id;
        if (pmId === 'telebirr' || pmId === 'cbe_birr') {
          const digitsOnly = formData.payment_account.replace(/\D/g, '');
          if (digitsOnly.length < 8) {
            setFieldError(`${selectedPaymentMethod?.name} number must be at least 8 digits`);
            return false;
          }
        }
        return true;
      }
      default:
        return true;
    }
  };

  const nextStep = () => {
    if (!canAdvanceFrom(step)) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  // ---- Submit ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    let accountId: number;
    if (typeof account?.id === 'string') {
      accountId = parseInt(account.id, 10);
    } else {
      accountId = account?.id as number;
    }

    if (!accountId) { setError('Account ID is required'); return; }
    if (!formData.payment_account) {
      setError(`Please provide your ${selectedPaymentMethod?.accountLabel}`);
      return;
    }

    let minAmount: string, maxAmount: string, totalAmount: string;
    try {
      minAmount = toUsdcString(formData.min_amount);
      maxAmount = toUsdcString(formData.max_amount);
      totalAmount = toUsdcString(formData.total_available_amount);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Invalid amount');
      return;
    }

    if (compareUsdcStrings(maxAmount, minAmount) < 0) {
      setError('Maximum amount must be greater than or equal to minimum amount');
      return;
    }
    if (compareUsdcStrings(totalAmount, maxAmount) < 0) {
      setError('Total available amount must be at least as large as maximum amount');
      return;
    }

    const fullTerms = [
      `Payment Method: ${selectedPaymentMethod?.name}`,
      `Account: ${formData.payment_account}`,
      formData.payment_notes ? `Notes: ${formData.payment_notes}` : null,
      formData.terms ? `\nAdditional Terms: ${formData.terms}` : null,
    ].filter(Boolean).join('\n');

    try {
      const data: CreateOfferRequest = {
        creator_account_id: accountId,
        offer_type: formData.offer_type,
        token: formData.token,
        min_amount: minAmount,
        max_amount: maxAmount,
        total_available_amount: totalAmount,
        rate_adjustment: Number(formData.rate_adjustment),
        terms: fullTerms,
        escrow_deposit_time_limit: '15 minutes',
        fiat_payment_time_limit: '30 minutes',
        fiat_currency: formData.fiat_currency,
      };

      const response = await createOffer(data);
      const offerId = response.data?.offer?.id;
      if (!offerId) { setError('Failed to create offer - no ID returned'); return; }

      setSuccess(`Offer created successfully with ID: ${offerId}.`);
      setFormData({ ...INITIAL_FORM, creator_account_id: accountId.toString() });
      setStep(1);
    } catch (err) {
      setError(toApiError(err));
      console.error('Create offer error:', err);
    }
  };

  // ---- Not connected state ----
  if (!primaryWallet) {
    return (
      <Container className="max-w-2xl">
        <Card className="rounded-sm border border-[#2b3139] bg-[#111318] shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <CardHeader className="px-6 pt-6 pb-4">
            <CardTitle className="text-[#eaecef] font-bold">Post Ad</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Alert className="bg-[#FF6B00]/10 border-[#FF6B00]/20 rounded-sm">
              <AlertDescription className="text-[#FF6B00]">Please connect your wallet to post an advertisement.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ---- Success state ----
  if (success) {
    return (
      <Container className="max-w-2xl">
        <Card className="rounded-sm border border-[#2b3139] bg-[#111318] shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
          <CardHeader className="px-6 pt-6 pb-4 border-b border-[#2b3139]">
            <CardTitle className="text-[#eaecef] font-bold">Ad Posted!</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <Alert className="mb-6 bg-[#02c076]/10 border-[#02c076]/20 rounded-sm">
              <AlertDescription className="text-[#02c076]">
                <span>
                  {success}{' '}
                  <Link to="/offers" className="inline underline font-bold">View My Ads</Link>
                </span>
              </AlertDescription>
            </Alert>
            <Button
              onClick={() => { setSuccess(''); setFormData(INITIAL_FORM); setStep(1); }}
              className="w-full bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold h-12 rounded-sm"
            >
              Post Another Ad
            </Button>
          </CardContent>
        </Card>
      </Container>
    );
  }

  // ---- Main form ----
  return (
    <Container className="max-w-2xl">
      <Card className="rounded-sm border border-[#2b3139] bg-[#111318] shadow-[0_1px_3px_rgba(0,0,0,0.4)]">
        <CardHeader className="px-6 pt-6 pb-4 border-b border-[#2b3139]">
          <CardTitle className="text-[#eaecef] font-bold">Post P2P Advertisement</CardTitle>
        </CardHeader>
        <CardContent className="px-6 pb-6">
          <StepIndicator currentStep={step} />

          {error && <ErrorBanner error={error} className="mb-6" />}
          {fieldError && (
            <Alert className="mb-6 bg-[#f84960]/10 border-[#f84960]/20 rounded-sm" variant="destructive">
              <AlertDescription className="text-[#f84960] text-sm">{fieldError}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* ======== STEP 1: Trade Configuration ======== */}
            {step === 1 && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">Asset</label>
                    <Select value={formData.token} onValueChange={v => update({ token: v })}>
                      <SelectTrigger className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 focus-visible:ring-[#FF6B00]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                        <SelectItem value="USDT">USDT (Primary)</SelectItem>
                        <SelectItem value="USDC">USDC</SelectItem>
                        <SelectItem value="XMR">XMR (Monero)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FieldTip>The cryptocurrency you want to trade</FieldTip>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">Fiat Currency</label>
                    <Select value={formData.fiat_currency} onValueChange={v => update({ fiat_currency: v })}>
                      <SelectTrigger className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 focus-visible:ring-[#FF6B00]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                        <CurrencyOptions />
                      </SelectContent>
                    </Select>
                    <FieldTip>The local currency you want to receive or pay with</FieldTip>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Ad Type</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => update({ offer_type: 'BUY' })}
                      className={`rounded-sm font-bold py-3 border-2 transition-all ${
                        formData.offer_type === 'BUY'
                          ? 'bg-[#02c076]/10 border-[#02c076] text-[#02c076]'
                          : 'bg-transparent border-[#2b3139] text-[#848e9c] hover:border-[#3b4149]'
                      }`}
                    >
                      <span className="block text-lg">Buy</span>
                      <span className="block text-[10px] font-normal opacity-70 mt-0.5">You receive crypto</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => update({ offer_type: 'SELL' })}
                      className={`rounded-sm font-bold py-3 border-2 transition-all ${
                        formData.offer_type === 'SELL'
                          ? 'bg-[#f84960]/10 border-[#f84960] text-[#f84960]'
                          : 'bg-transparent border-[#2b3139] text-[#848e9c] hover:border-[#3b4149]'
                      }`}
                    >
                      <span className="block text-lg">Sell</span>
                      <span className="block text-[10px] font-normal opacity-70 mt-0.5">You send crypto</span>
                    </button>
                  </div>
                  <FieldTip>
                    {formData.offer_type === 'BUY'
                      ? 'You are buying crypto — other users will sell to you. Your ad appears in the "Buy" section.'
                      : 'You are selling crypto — other users will buy from you. Your ad appears in the "Sell" section.'}
                  </FieldTip>
                </div>
              </div>
            )}

            {/* ======== STEP 2: Amount & Price ======== */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="p-5 bg-[#0b0e11] border border-[#2b3139] rounded-sm space-y-5">
                  <h3 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">Pricing</h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">
                      Price per 1 {formData.token} <span className="text-[#5e6673]">({formData.fiat_currency})</span>
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder={marketPrice ? marketPrice.toFixed(2) : '100.00'}
                        className="border-[#2b3139] bg-[#111318] text-[#eaecef] rounded-sm h-10 pr-12 focus-visible:ring-[#FF6B00]/30"
                        value={fiatPriceInput}
                        onChange={e => updateFiatPrice(e.target.value)}
                      />
                      <div className="absolute right-3 top-2.5 text-xs font-bold text-[#848e9c]">{formData.fiat_currency}</div>
                    </div>
                    <FieldTip>
                      Enter the actual price in {formData.fiat_currency} for 1 {formData.token}.
                      {marketPrice ? ` Market reference: ${marketPrice.toFixed(2)} ${formData.fiat_currency}.` : ''}
                    </FieldTip>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">
                      Rate Adjustment
                    </label>
                    <div className="relative">
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="0"
                        className="border-[#2b3139] bg-[#111318] text-[#eaecef] rounded-sm h-10 pr-12 focus-visible:ring-[#FF6B00]/30"
                        value={
                          formData.rate_adjustment === '1' || formData.rate_adjustment === '1.0'
                            ? '0'
                            : ((parseFloat(formData.rate_adjustment || '1') - 1) * 100).toString()
                        }
                        onChange={e => updateRateAdjustment(e.target.value)}
                      />
                      <div className="absolute right-3 top-2.5 text-xs font-bold text-[#848e9c]">%</div>
                    </div>
                    <FieldTip>
                      Automatically calculated from the price above. 0% = at market price. Negative = below market.
                    </FieldTip>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">
                    Trade Amount Range
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#848e9c]">Minimum</span>
                      <div className="relative">
                        <Input
                          type="number"
                          className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 pr-10 focus-visible:ring-[#FF6B00]/30"
                          value={formData.min_amount}
                          onChange={e => update({ min_amount: e.target.value })}
                          placeholder="100"
                        />
                        <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#848e9c]">{formData.token}</div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] text-[#848e9c]">Maximum</span>
                      <div className="relative">
                        <Input
                          type="number"
                          className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 pr-10 focus-visible:ring-[#FF6B00]/30"
                          value={formData.max_amount}
                          onChange={e => update({ max_amount: e.target.value })}
                          placeholder="5000"
                        />
                        <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#848e9c]">{formData.token}</div>
                      </div>
                    </div>
                  </div>
                  <FieldTip>The smallest and largest single trade someone can make with you</FieldTip>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">
                    Total Available Amount
                  </label>
                  <div className="relative">
                    <Input
                      type="number"
                      className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 pr-10 focus-visible:ring-[#FF6B00]/30"
                      value={formData.total_available_amount}
                      onChange={e => update({ total_available_amount: e.target.value })}
                      placeholder="10000"
                    />
                    <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#848e9c]">{formData.token}</div>
                  </div>
                  <FieldTip>How much you have in total to trade across all orders. Must be ≥ your maximum.</FieldTip>
                </div>
              </div>
            )}

            {/* ======== STEP 3: Payment Details ======== */}
            {step === 3 && (
              <div className="space-y-6">
                <div className="p-5 bg-[#0b0e11] border border-[#2b3139] rounded-sm space-y-5">
                  <h3 className="text-xs font-black text-[#FF6B00] uppercase tracking-widest">Payment Information</h3>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">Payment Method</label>
                    <Select value={formData.payment_method_id} onValueChange={v => update({ payment_method_id: v })}>
                      <SelectTrigger className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 focus-visible:ring-[#FF6B00]/30">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                        {PAYMENT_METHODS.map(method => (
                          <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FieldTip>How will buyers send payment to you? Choose the method you accept.</FieldTip>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-[#848e9c] uppercase">
                      {selectedPaymentMethod?.accountLabel}
                    </label>
                    <Input
                      className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 focus-visible:ring-[#FF6B00]/30"
                      value={formData.payment_account}
                      onChange={e => update({ payment_account: e.target.value })}
                      placeholder={
                        selectedPaymentMethod?.id === 'telebirr'
                          ? 'e.g. 2519XXXXXXXX'
                          : selectedPaymentMethod?.id === 'cash'
                          ? 'e.g. Piazza, Bole area'
                          : 'Enter your account details'
                      }
                    />
                    <FieldTip>
                      {selectedPaymentMethod?.id === 'telebirr'
                        ? 'Your Telebirr phone number that buyers will send payment to'
                        : selectedPaymentMethod?.id === 'cash'
                        ? 'Where will you meet for the cash exchange?'
                        : `Your ${selectedPaymentMethod?.name} account details for receiving payment`}
                    </FieldTip>
                  </div>

                  {selectedPaymentMethod?.hasNotes && (
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-[#848e9c] uppercase">
                        {selectedPaymentMethod?.notesLabel}
                      </label>
                      <Input
                        className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm h-10 focus-visible:ring-[#FF6B00]/30"
                        value={formData.payment_notes}
                        onChange={e => update({ payment_notes: e.target.value })}
                        placeholder="Optional transfer details"
                      />
                      <FieldTip>Extra information the buyer needs to complete the payment (optional)</FieldTip>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Additional Trade Terms</label>
                  <textarea
                    className="w-full border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm p-3 text-sm h-24 resize-none focus-visible:ring-[#FF6B00]/30 focus-visible:outline-none"
                    placeholder="Any special conditions? E.g. 'Only trade during business hours', 'ID verification required'..."
                    value={formData.terms}
                    onChange={e => update({ terms: e.target.value })}
                  />
                  <FieldTip>Optional terms displayed on your ad. Be clear and specific to avoid disputes.</FieldTip>
                </div>
              </div>
            )}

            {/* ======== STEP 4: Review & Confirm ======== */}
            {step === 4 && (
              <div className="space-y-6">
                <OfferPreviewCard formData={formData} account={account} />

                <div className="p-4 bg-[#0b0e11] border border-[#2b3139] rounded-sm text-xs text-[#848e9c] space-y-2">
                  <p className="text-[#eaecef] font-bold">Before you post:</p>
                  <ul className="space-y-1 list-disc ml-4">
                    <li>Your ad will be <span className="text-[#eaecef]">publicly visible</span> to all traders on the platform.</li>
                    <li>Escrow deposit window: <span className="text-[#eaecef]">15 minutes</span> after a trade starts.</li>
                    <li>Fiat payment window: <span className="text-[#eaecef]">30 minutes</span> after escrow is funded.</li>
                    <li>You can edit or remove this ad at any time from <span className="text-[#eaecef]">My Ads</span>.</li>
                  </ul>
                </div>
              </div>
            )}

            {/* ======== Navigation buttons ======== */}
            <div className="flex gap-3 pt-2">
              {step > 1 && (
                <Button
                  type="button"
                  onClick={prevStep}
                  variant="outline"
                  className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] h-11 rounded-sm"
                >
                  <ArrowLeft size={16} className="mr-1.5" /> Back
                </Button>
              )}

              {step < TOTAL_STEPS ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  className="flex-1 bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold h-11 rounded-sm"
                >
                  Continue <ArrowRight size={16} className="ml-1.5" />
                </Button>
              ) : (
                <Button
                  type="submit"
                  className="flex-1 bg-[#02c076] hover:opacity-90 text-white font-bold h-11 rounded-sm"
                >
                  Post Advertisement
                </Button>
              )}
            </div>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default CreateOfferPage;
