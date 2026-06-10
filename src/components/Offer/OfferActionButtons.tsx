import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Eye, Pencil, Trash2 } from 'lucide-react';
import DeleteOfferDialog from '@/components/Shared/DeleteOfferDialog';

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

      <DeleteOfferDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDelete}
        isDeleting={isDeleting}
      />
    </>
  );
}

export default OfferActionButtons;
