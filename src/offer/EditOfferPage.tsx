import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOfferById, updateOffer, Offer, UpdateOfferRequest } from '@/api';
import { toUsdcString } from '@/utils/amounts';
import { formatDisplayId } from '@/utils/displayId';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Container from '@/components/Shared/Container';
import { ErrorBanner } from '@/components/Shared/ErrorBanner';
import { ApiError, toApiError } from '@/api/errors';
import OfferDescription from '@/components/Offer/OfferDescription';

// Form-state shape: amounts are strings (raw input values from <Input> elements);
// rate_adjustment is a number factor (1.05 = 5% above market). Convert to the
// canonical wire shape (UpdateOfferRequest) at submit time.
type OfferFormState = {
  offer_type: 'BUY' | 'SELL';
  token: string;
  min_amount: string;
  max_amount: string;
  total_available_amount: string;
  rate_adjustment: number;
  terms: string;
  escrow_deposit_time_limit: { minutes: number } | string;
  fiat_payment_time_limit: { minutes: number } | string;
  fiat_currency: string;
};

function EditOfferPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  // Either a raw string (form-side) or a structured ApiError from the
  // axios interceptor — ErrorBanner handles both.
  const [error, setError] = useState<string | ApiError | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [formData, setFormData] = useState<OfferFormState>({
    offer_type: 'BUY',
    token: 'USDC',
    min_amount: '0',
    max_amount: '0',
    total_available_amount: '0',
    rate_adjustment: 1,
    terms: '',
    escrow_deposit_time_limit: '60 minutes',
    fiat_payment_time_limit: '60 minutes',
    fiat_currency: 'USD',
  });

  // Store the raw percentage input value separately to preserve user input exactly
  const [rateAdjustmentInput, setRateAdjustmentInput] = useState('0.00');

  useEffect(() => {
    const fetchOffer = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const response = await getOfferById(parseInt(id));
        const offerData = response.data.offer;

        // Hydrate from response: amounts are decimal strings (M3); coerce
        // rate_adjustment to a number factor for in-form arithmetic only.
        // Don't silently fall back to 1 — saving with a default would
        // overwrite the server's actual rate.
        const rateNum = Number(offerData.rate_adjustment);
        if (!Number.isFinite(rateNum)) {
          setError(
            `Could not load rate adjustment from server (got ${JSON.stringify(
              offerData.rate_adjustment,
            )}). Refresh and try again.`,
          );
          return;
        }
        setFormData({
          offer_type: offerData.offer_type as 'BUY' | 'SELL',
          token: offerData.token,
          min_amount: offerData.min_amount,
          max_amount: offerData.max_amount,
          total_available_amount: offerData.total_available_amount,
          rate_adjustment: rateNum,
          terms: offerData.terms,
          escrow_deposit_time_limit: offerData.escrow_deposit_time_limit,
          fiat_payment_time_limit: offerData.fiat_payment_time_limit,
          fiat_currency: offerData.fiat_currency,
        });

        // Set the rate adjustment input value (display percentage)
        setRateAdjustmentInput(((rateNum - 1) * 100).toFixed(2));

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        console.error('[EditOfferPage] Fetch failed:', err);
        setError(`Failed to load offer: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOffer();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    if (name === 'min_amount' || name === 'max_amount' || name === 'total_available_amount') {
      // Keep raw string; validation happens at submit (toUsdcString).
      setFormData({ ...formData, [name]: value });
    } else if (name === 'rate_adjustment') {
      // Store the exact input value
      setRateAdjustmentInput(value);

      // Convert percentage input to rate factor (e.g., 5% -> 1.05, -3% -> 0.97)
      const percentValue = parseFloat(value) || 0;
      const rateFactor = 1 + percentValue / 100;
      setFormData({ ...formData, [name]: rateFactor });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  // These functions have been removed as the fields are now non-editable

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!id) return;

    try {
      // Build the wire payload. Strict-reject of unknown fields means we
      // must explicitly pick allowed fields (no creator_account_id, id,
      // network_id, timestamps).
      let payload: UpdateOfferRequest;
      try {
        payload = {
          offer_type: formData.offer_type,
          token: formData.token,
          fiat_currency: formData.fiat_currency,
          min_amount: toUsdcString(formData.min_amount),
          max_amount: toUsdcString(formData.max_amount),
          total_available_amount: toUsdcString(formData.total_available_amount),
          rate_adjustment: formData.rate_adjustment,
          terms: formData.terms,
          escrow_deposit_time_limit: formData.escrow_deposit_time_limit,
          fiat_payment_time_limit: formData.fiat_payment_time_limit,
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Invalid form data';
        setError(msg);
        return;
      }
      await updateOffer(parseInt(id), payload);
      setSuccess('Offer updated successfully');

      // Clear success message after 3 seconds and navigate back to offer detail
      setTimeout(() => {
        navigate(`/offer/${id}`, { state: { message: 'Offer updated successfully' } });
      }, 3000);
    } catch (err) {
      // Preserve the structured ApiError so per-field issues + ref render.
      setError(toApiError(err));
      window.scrollTo(0, 0); // Scroll to top to show error
    }
  };

  // No longer needed as we're using direct input value

  if (loading) {
    return (
      <Container>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading offer details...</p>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="max-w-2xl">
      <Card className="rounded-sm border-[#2b3139] bg-[#1e2329]">
        <CardHeader className="border-b border-[#2b3139]">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#eaecef] font-bold">Edit Advertisement {formatDisplayId(Number(id))}</CardTitle>
              {!loading && formData && (
                <div className="mt-4">
                  <OfferDescription
                    offer={
                      {
                        ...formData,
                        rate_adjustment: String(formData.rate_adjustment),
                      } as unknown as Offer
                    }
                  />
                  <p className="text-[10px] text-[#848e9c] mt-2 uppercase font-bold">
                    Asset, Type, and Currency are fixed for security.
                  </p>
                </div>
              )}
            </div>
            <Link to={`/offer/${id}`}>
              <Button variant="outline" className="border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm">Cancel</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {error && <ErrorBanner error={error} className="mb-6" />}

          {success && (
            <Alert className="mb-6 bg-[#02c076]/10 border-[#02c076]/20 rounded-sm">
              <AlertDescription className="text-[#02c076]">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Min Limit</label>
                  <Input
                    type="number"
                    name="min_amount"
                    value={formData.min_amount}
                    onChange={handleChange}
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Max Limit</label>
                  <Input
                    type="number"
                    name="max_amount"
                    value={formData.max_amount}
                    onChange={handleChange}
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px]"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Total Available</label>
                  <Input
                    type="number"
                    name="total_available_amount"
                    value={formData.total_available_amount}
                    onChange={handleChange}
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px]"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase">Price Multiplier (%)</label>
                  <Input
                    type="number"
                    name="rate_adjustment"
                    value={rateAdjustmentInput}
                    onChange={handleChange}
                    className="border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px]"
                    required
                  />
                  <p className="text-[10px] text-[#848e9c]">
                    Positive values are above market rate, negative are below.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-[#848e9c] uppercase opacity-50">Fiat Currency (Fixed)</label>
                  <Input value={formData.fiat_currency} className="border-[#2b3139] bg-[#0b0e11] text-[#848e9c] rounded-sm" disabled />
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-[#848e9c] uppercase">Terms and Conditions</label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows={6}
                className="w-full border-[#2b3139] bg-[#0b0e11] text-[#eaecef] rounded-sm focus-visible:ring-[#FF6B00]/30 focus-visible:ring-[3px] p-3 text-sm resize-none"
                placeholder="Specify your terms and conditions for this offer..."
              />
            </div>

            <CardFooter className="flex justify-end px-0 pt-4 pb-0">
              <Button type="submit" className="bg-[#FF6B00] hover:opacity-90 text-[#0b0e11] font-bold rounded-sm h-12 px-12 w-full sm:w-auto">
                Update Advertisement
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default EditOfferPage;
