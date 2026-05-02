import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface OfferActionButtonsProps {
  offerId: number;
  onDelete: (offerId: number) => void;
  isMobile?: boolean;
  isDeleting?: boolean;
}

function OfferActionButtons({
  offerId,
  onDelete,
  isMobile = false,
  isDeleting = false,
}: OfferActionButtonsProps) {
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const openDeleteDialog = () => {
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = () => {
    onDelete(offerId);
    setIsDeleteDialogOpen(false);
  };

  return (
    <>
      <div className={`flex gap-2 justify-center ${isMobile ? 'mt-4 w-full' : ''}`}>
        <Link to={`/offer/${offerId}`} className={isMobile ? 'flex-1' : ''}>
          <Button
            variant="outline"
            className="border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] w-full h-9 rounded-sm"
            aria-label="View Ad"
            title="View Ad"
          >
            <Eye size={16} />
          </Button>
        </Link>
        <Link to={`/edit-offer/${offerId}`} className={isMobile ? 'flex-1' : ''}>
          <Button
            variant="outline"
            className="border-[#2b3139] text-[#848e9c] hover:text-[#eaecef] hover:bg-[#2b3139] w-full h-9 rounded-sm"
            aria-label="Edit Ad"
            title="Edit Ad"
          >
            <Pencil size={16} />
          </Button>
        </Link>
        <Button
          variant="outline"
          onClick={openDeleteDialog}
          className={`border-[#2b3139] text-[#f84960] hover:bg-[#f84960]/10 h-9 rounded-sm ${
            isMobile ? 'flex-1' : ''
          } ${isDeleting ? 'opacity-50' : ''}`}
          aria-label="Delete Ad"
          title="Delete Ad"
          disabled={isDeleting}
        >
          {isDeleting ? '...' : <Trash2 size={16} />}
        </Button>
      </div>

      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="bg-[#1e2329] border-[#2b3139] text-[#eaecef] z-[999] rounded-sm max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Remove Advertisement?</DialogTitle>
            <DialogDescription className="text-[#848e9c]">
              This will permanently remove your liquidity offer from the P2P market.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-6 flex gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="flex-1 border-[#2b3139] text-[#eaecef] hover:bg-[#2b3139] rounded-sm">
              Cancel
            </Button>
            <Button
              onClick={handleDelete}
              className={`flex-1 bg-[#f84960] hover:opacity-90 text-white font-bold rounded-sm ${
                isDeleting ? 'opacity-50' : ''
              }`}
              disabled={isDeleting}
            >
              {isDeleting ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default OfferActionButtons;
