import { useState, useEffect } from 'react';
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

interface CreateOfferPageProps {
  account: Account | null;
}

function CreateOfferPage({ account: propAccount }: CreateOfferPageProps) {
  const [internalAccount, setInternalAccount] = useState<Account | null>(null);
  const { primaryWallet } = useDynamicContext();
  const { createOffer } = useSolanaDevnetOffers();

  useEffect(() => {
    const fetchAccount = async () => {
      if (!propAccount && primaryWallet) {
        try {
          const response = await getAccount();
          setInternalAccount(response.data);
          setFormData(prev => ({
            ...prev,
            creator_account_id: response.data.id.toString(),
          }));
        } catch (err) {
          console.error('Failed to fetch account:', err);
        }
      }
    };
    fetchAccount();
  }, [propAccount, primaryWallet]);

  const account = propAccount || internalAccount;
  const [formData, setFormData] = useState({
    creator_account_id: account?.id || '',
    offer_type: 'BUY' as 'BUY' | 'SELL',
    token: 'USDC',
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
  });
  const [success, setSuccess] = useState('');

  const [error, setError] = useState<string | ApiError | ''>('');

  const selectedPaymentMethod = getPaymentMethodById(formData.payment_method_id);

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

    if (!accountId) {
      setError('Account ID is required');
      return;
    }

    if (!formData.payment_account) {
      setError(`Please provide your ${selectedPaymentMethod?.accountLabel}`);
      return;
    }

    let minAmount: string;
    let maxAmount: string;
    let totalAmount: string;
    try {
      minAmount = toUsdcString(formData.min_amount as string | number);
      maxAmount = toUsdcString(formData.max_amount as string | number);
      totalAmount = toUsdcString(formData.total_available_amount as string | number);
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

    // Construct terms with payment info
    const fullTerms = `Payment Method: ${selectedPaymentMethod?.name}\nAccount: ${formData.payment_account}\nNotes: ${formData.payment_notes}\n\nAdditional Terms: ${formData.terms || 'None'}`;

    try {
      const data: CreateOfferRequest = {
        creator_account_id: accountId,
        offer_type: formData.offer_type as 'BUY' | 'SELL',
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

      const offerData = response.data?.offer;
      const offerId = offerData?.id;

      if (!offerId) {
        setError('Failed to create offer - no ID returned');
        return;
      }

      setSuccess(`Offer created successfully with ID: ${offerId}.`);

      setFormData({
        ...formData,
        min_amount: '',
        max_amount: '',
        total_available_amount: '',
        terms: '',
      });
    } catch (err) {
      setError(toApiError(err));
      console.error('Create offer error:', err);
    }
  };

  if (!primaryWallet) {
    return (
      <Container className="max-w-2xl">
        <Card className="rounded-sm border-[#2b3139] bg-[#1e2329]">
          <CardHeader>
            <CardTitle className="text-[#eaecef] font-bold">Create Ad</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Alert className="bg-[#fcd535]/10 border-[#fcd535]/20 rounded-sm">
              <AlertDescription className="text-[#fcd535]">Please connect your wallet to post an advertisement.</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl">
      <Card className="rounded-sm border-[#2b3139] bg-[#1e2329]">
        <CardHeader className="border-b border-[#2b3139]">
          <CardTitle className="text-[#eaecef] font-bold">Post P2P Advertisement</CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          {success && (
            <Alert className="mb-6 bg-[#02c076]/10 border-[#02c076]/20 rounded-sm">
              <AlertDescription className="text-[#02c076]">
                <span>
                  {success}{' '}
                  <Link
                    to="/offers"
                    className="inline underline font-bold"
                  >
                    View Ads
                  </Link>
                </span>
              </AlertDescription>
            </Alert>
          )}

          {error && <ErrorBanner error={error} className="mb-6" />}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Asset</label>
                <Select
                  value={formData.token}
                  onValueChange={value => setFormData({ ...formData, token: value })}
                >
                  <SelectTrigger className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                    
                    <SelectItem value="USDC">USDC</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Fiat Currency</label>
                <Select
                  value={formData.fiat_currency}
                  onValueChange={value => setFormData({ ...formData, fiat_currency: value })}
                >
                  <SelectTrigger className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                    <CurrencyOptions />
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#848e9c] uppercase">Ad Type</label>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, offer_type: 'BUY' })}
                  className={`rounded-sm font-bold border ${
                    formData.offer_type === 'BUY'
                      ? 'bg-[#02c076] border-[#02c076] text-white'
                      : 'bg-transparent border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139]'
                  }`}
                >
                  Buy
                </Button>
                <Button
                  type="button"
                  onClick={() => setFormData({ ...formData, offer_type: 'SELL' })}
                  className={`rounded-sm font-bold border ${
                    formData.offer_type === 'SELL'
                      ? 'bg-[#f84960] border-[#f84960] text-white'
                      : 'bg-transparent border-[#2b3139] text-[#848e9c] hover:bg-[#2b3139]'
                  }`}
                >
                  Sell
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Price (Rate)</label>
                <div className="relative">
                   <Input
                    type="number"
                    step="0.01"
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0 h-10 pr-12"
                    value={formData.rate_adjustment}
                    onChange={e => setFormData({ ...formData, rate_adjustment: e.target.value })}
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#848e9c]">MULT</div>
                </div>
                <p className="text-[10px] text-[#848e9c]">1.00 = Market Price. 1.05 = +5% Price.</p>
              </div>
              
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Total Amount</label>
                <div className="relative">
                  <Input
                    type="number"
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0 h-10 pr-12"
                    value={formData.total_available_amount}
                    onChange={e => setFormData({ ...formData, total_available_amount: e.target.value })}
                  />
                  <div className="absolute right-3 top-2.5 text-[10px] font-bold text-[#848e9c]">{formData.token}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Min Limit</label>
                <Input
                  type="number"
                  className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0 h-10"
                  value={formData.min_amount}
                  onChange={e => setFormData({ ...formData, min_amount: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-[#848e9c] uppercase">Max Limit</label>
                <Input
                  type="number"
                  className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0 h-10"
                  value={formData.max_amount}
                  onChange={e => setFormData({ ...formData, max_amount: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 bg-[#0b0e11] border border-[#2b3139] rounded-sm space-y-4">
              <h3 className="text-xs font-black text-[#fcd535] uppercase tracking-widest">Payment Information</h3>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#848e9c] uppercase">Method</label>
                <Select
                  value={formData.payment_method_id}
                  onValueChange={value => setFormData({ ...formData, payment_method_id: value })}
                >
                  <SelectTrigger className="border-[#2b3139] bg-[#1e2329] text-[#eaecef] rounded-sm focus:ring-0 h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef]">
                    {PAYMENT_METHODS.map(method => (
                      <SelectItem key={method.id} value={method.id}>{method.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-[#848e9c] uppercase">{selectedPaymentMethod?.accountLabel}</label>
                <Input
                  className="border-[#2b3139] bg-[#1e2329] text-[#eaecef] rounded-sm focus:ring-0 h-9"
                  value={formData.payment_account}
                  onChange={e => setFormData({ ...formData, payment_account: e.target.value })}
                />
              </div>

              {selectedPaymentMethod?.hasNotes && (
                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-[#848e9c] uppercase">{selectedPaymentMethod?.notesLabel}</label>
                  <Input
                    className="border-[#2b3139] bg-[#1e2329] text-[#eaecef] rounded-sm focus:ring-0 h-9"
                    value={formData.payment_notes}
                    onChange={e => setFormData({ ...formData, payment_notes: e.target.value })}
                  />
                </div>
              )}
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#848e9c] uppercase">Additional Terms</label>
              <textarea
                className="w-full border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus:ring-0 p-3 text-sm h-24 resize-none"
                placeholder="Describe your trade terms..."
                value={formData.terms}
                onChange={e => setFormData({ ...formData, terms: e.target.value })}
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-[#fcd535] hover:opacity-90 text-[#0b0e11] font-bold h-12 rounded-sm"
            >
              Post Advertisement
            </Button>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default CreateOfferPage;
