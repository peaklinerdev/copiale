import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { getOfferById, updateOffer, Offer, UpdateOfferRequest } from '@/api';
import { toUsdcString } from '@/utils/amounts';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Container from '@/components/Shared/Container';
import { ErrorBanner } from '@/components/Shared/ErrorBanner';
import { ApiError, toApiError } from '@/api/errors';
import OfferDescription from '@/components/Offer/OfferDescription';
import { getMinutesFromTimeLimit } from '@/utils/timeUtils';

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
    escrow_deposit_time_limit: { minutes: 60 },
    fiat_payment_time_limit: { minutes: 60 },
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
    <Container>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-primary-800 font-semibold">Edit Offer #{id}</CardTitle>
              <CardDescription>Update your offer details</CardDescription>
              {!loading && formData && (
                <div className="mt-4">
                  {/* OfferDescription expects an Offer (response shape). The
                      form's rate_adjustment is a number factor; the response
                      shape uses string. Stringify here for display only. */}
                  <OfferDescription
                    offer={
                      {
                        ...formData,
                        rate_adjustment: String(formData.rate_adjustment),
                      } as unknown as Offer
                    }
                  />
                  <p className="text-xs text-neutral-500 mt-2">
                    To change the offer type, token or fiat currency, please create a new offer.
                  </p>
                </div>
              )}
            </div>
            <Link to={`/offer/${id}`}>
              <Button variant="outline">Cancel</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error && <ErrorBanner error={error} className="mb-6" />}

          {success && (
            <Alert className="mb-6 bg-secondary-200 border-secondary-300">
              <AlertDescription className="text-secondary-900">{success}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Offer Type
                  </label>
                  <Input
                    value={
                      formData.offer_type === 'BUY'
                        ? 'BUY (You want to buy crypto)'
                        : 'SELL (You want to sell crypto)'
                    }
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">Offer type cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Token</label>
                  <Input value={formData.token} className="bg-neutral-50" disabled />
                  <p className="text-xs text-neutral-500 mt-1">Token cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Minimum Amount
                  </label>
                  <Input
                    type="number"
                    name="min_amount"
                    value={formData.min_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Maximum Amount
                  </label>
                  <Input
                    type="number"
                    name="max_amount"
                    value={formData.max_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Total Available Amount
                  </label>
                  <Input
                    type="number"
                    name="total_available_amount"
                    value={formData.total_available_amount}
                    onChange={handleChange}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Rate Adjustment (%)
                  </label>
                  <Input
                    type="number"
                    name="rate_adjustment"
                    value={rateAdjustmentInput}
                    onChange={handleChange}
                    required
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Positive values are above market rate, negative values are below
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fiat Currency
                  </label>
                  <Input value={formData.fiat_currency} className="bg-neutral-50" disabled />
                  <p className="text-xs text-neutral-500 mt-1">Fiat currency cannot be changed</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Escrow Deposit Time Limit (minutes)
                  </label>
                  <Input
                    type="number"
                    value={getMinutesFromTimeLimit(formData.escrow_deposit_time_limit)}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Escrow deposit time limit cannot be changed
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">
                    Fiat Payment Time Limit (minutes)
                  </label>
                  <Input
                    type="number"
                    value={getMinutesFromTimeLimit(formData.fiat_payment_time_limit)}
                    className="bg-neutral-50"
                    disabled
                  />
                  <p className="text-xs text-neutral-500 mt-1">
                    Fiat payment time limit cannot be changed
                  </p>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">
                Terms and Conditions
              </label>
              <textarea
                name="terms"
                value={formData.terms}
                onChange={handleChange}
                rows={6}
                className="w-full p-3 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-700 focus:border-transparent"
                placeholder="Specify your terms and conditions for this offer..."
              />
            </div>

            <CardFooter className="flex justify-end px-0 pt-4 pb-0">
              <Button type="submit" className="bg-primary-700 hover:bg-primary-800 text-white">
                Update Offer
              </Button>
            </CardFooter>
          </form>
        </CardContent>
      </Card>
    </Container>
  );
}

export default EditOfferPage;
