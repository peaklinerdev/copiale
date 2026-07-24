import { Alert, AlertDescription } from '@/components/ui/alert';

/**
 * Alert component displayed when a trade is not found
 */
export function TradeNotFoundAlert() {
  return (
    <Alert className="mb-4 border-[#f97316]/30 bg-[#f97316]/10">
      <AlertDescription className="text-[#f97316]">
        Trade not found or you don't have permission to view it.
      </AlertDescription>
    </Alert>
  );
}
