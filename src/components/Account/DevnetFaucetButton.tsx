import { useState } from 'react';
import { requestFaucetFunding, ApiError } from '@/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Coins, Loader2, XCircle } from 'lucide-react';

interface FaucetStatus {
  state: 'idle' | 'loading' | 'success' | 'error';
  message: string;
  details?: string;
}

function DevnetFaucetButton() {
  const [status, setStatus] = useState<FaucetStatus>({
    state: 'idle',
    message: '',
  });

  const handleRequest = async () => {
    setStatus({ state: 'loading', message: 'Requesting devnet funds...' });

    try {
      const response = await requestFaucetFunding();
      const { sol, usdt, signature } = response.data;
      setStatus({
        state: 'success',
        message: `Received ${sol} SOL and ${usdt} USDT`,
        details: `Tx: ${signature.slice(0, 8)}...${signature.slice(-8)}`,
      });
    } catch (err) {
      const apiErr = err as ApiError;
      const message =
        apiErr.response?.data?.error ||
        apiErr.message ||
        'Unknown error';

      let details = '';
      if (apiErr.response?.status === 429 && apiErr.response?.data?.retryAfterMinutes) {
        details = apiErr.response.data.detail || `Cooldown: ${apiErr.response.data.retryAfterMinutes} minutes remaining`;
      } else if (apiErr.response?.data?.detail) {
        details = apiErr.response.data.detail;
      } else if (apiErr.response?.status === 501) {
        details = 'Devnet funding is not enabled on this server.';
      }

      setStatus({ state: 'error', message, details });
    }
  };

  return (
    <Card className="bg-[#1e2329] border-[#2b3139] rounded-sm">
      <CardHeader>
        <CardTitle className="text-[#eaecef] font-semibold flex items-center gap-2">
          <Coins className="h-4 w-4 text-[#FF6B00]" />
          Devnet Faucet
        </CardTitle>
        <CardDescription>
          Request 2 SOL and 2500 USDT on Solana devnet for testing
        </CardDescription>
      </CardHeader>
      <CardContent>
        {status.state === 'success' && (
          <Alert className="mb-4 bg-[#02c076]/10 border border-[#02c076]/30 rounded-sm">
            <CheckCircle className="h-4 w-4 text-secondary-500 mr-2" />
            <AlertDescription className="text-[#02c076]">
              <div>{status.message}</div>
              {status.details && (
                <div className="text-xs text-[#848e9c] mt-1">{status.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        {status.state === 'error' && (
          <Alert className="mb-4 bg-[#d32f2f]/10 border border-[#d32f2f]/30 rounded-sm">
            <XCircle className="h-4 w-4 text-red-500 mr-2" />
            <AlertDescription className="text-red-400">
              <div>{status.message}</div>
              {status.details && (
                <div className="text-xs text-[#848e9c] mt-1">{status.details}</div>
              )}
            </AlertDescription>
          </Alert>
        )}

        <Button
          onClick={handleRequest}
          disabled={status.state === 'loading'}
          className="w-full bg-primary-700 hover:bg-primary-800 text-white rounded-sm"
        >
          {status.state === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Requesting...
            </>
          ) : (
            <>
              <Coins className="h-4 w-4 mr-2" />
              Request Devnet Funds
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

export default DevnetFaucetButton;
