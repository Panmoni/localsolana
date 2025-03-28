import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface OfferActionButtonsProps {
  offerId: number;
  onDelete: (offerId: number) => void;
  isMobile?: boolean;
}

function OfferActionButtons({ offerId, onDelete, isMobile = false }: OfferActionButtonsProps) {
  return (
    <div className={`flex gap-2 ${isMobile ? "mt-4" : ""}`}>
      <Link to={`/offer/${offerId}`} className={isMobile ? "flex-1" : ""}>
        <Button
          variant="outline"
          className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full text-sm px-3 py-1 h-8"
        >
          View
        </Button>
      </Link>
      <Link to={`/edit-offer/${offerId}`} className={isMobile ? "flex-1" : ""}>
        <Button
          variant="outline"
          className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full text-sm px-3 py-1 h-8"
        >
          Edit
        </Button>
      </Link>
      <Button
        variant="outline"
        onClick={() => onDelete(offerId)}
        className={`border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 text-sm px-3 py-1 h-8 ${isMobile ? "flex-1" : ""}`}
      >
        Delete
      </Button>
    </div>
  );
}

export default OfferActionButtons;
