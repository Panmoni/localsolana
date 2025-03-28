import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offerId: number;
  onConfirm: (offerId: number) => void;
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offerId,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-neutral-100 z-999">
        <DialogHeader>
          <DialogTitle>Confirm Trade</DialogTitle>
          <DialogDescription>
            Are you sure you want to start a trade with this offer?
            This will create a new trade and set up an escrow account.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#10b981] hover:bg-[#059669] text-white"
            onClick={() => onConfirm(offerId)}
          >
            Confirm Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeConfirmationDialog;
