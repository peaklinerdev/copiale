import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DeleteOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  isDeleting?: boolean;
  /** Optional offer title/number shown in the description */
  offerLabel?: string;
}

function DeleteOfferDialog({
  open,
  onOpenChange,
  onConfirm,
  isDeleting = false,
  offerLabel,
}: DeleteOfferDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] rounded-sm max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold">Remove Advertisement?</DialogTitle>
          <DialogDescription className="text-[#848e9c]">
            {offerLabel
              ? `This will permanently remove your liquidity offer "${offerLabel}" from the P2P market.`
              : 'This will permanently remove your liquidity offer from the P2P market.'}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-6 flex gap-3">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={onConfirm}
            className="flex-1 bg-[#f84960] hover:opacity-90 text-white font-bold rounded-sm"
            disabled={isDeleting}
            aria-label="Confirm delete offer"
          >
            {isDeleting ? 'Removing...' : 'Confirm Remove'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default DeleteOfferDialog;
