import { useState, useEffect, useCallback } from "react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Offer, getPrices, PricesResponse } from "../api";
import { formatNumber } from "../lib/utils";

interface TradeConfirmationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  offer: Offer;
  onConfirm: (offerId: number, amount: string) => void;
  triggerButton?: React.ReactNode;
}

const TradeConfirmationDialog = ({
  isOpen,
  onOpenChange,
  offer,
  onConfirm,
  triggerButton,
}: TradeConfirmationDialogProps) => {
  const [amount, setAmount] = useState<string>("");
  const [priceData, setPriceData] = useState<PricesResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [fiatAmount, setFiatAmount] = useState<number>(0);
  const [platformFee, setPlatformFee] = useState<number>(0);

  // Define calculateAmounts first so it can be used in useEffects
  const calculateAmounts = useCallback(() => {
    if (!priceData || !amount) return;

    try {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        setFiatAmount(0);
        setPlatformFee(0);
        return;
      }

      // Get base price for the token in the offer's currency
      const basePrice = priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]?.price;
      if (!basePrice) {
        setError(`Price data not available for ${offer.fiat_currency}`);
        return;
      }

      // Apply rate adjustment from the offer
      const adjustedPrice = parseFloat(basePrice) * offer.rate_adjustment;

      // Calculate fiat amount
      const calculatedFiatAmount = numAmount * adjustedPrice;

      // Calculate platform fee differently based on offer type
      let calculatedPlatformFee;

      if (offer.offer_type === "SELL") {
        // When buying USDC (offer type is SELL), the seller pays the fee in USDC
        // The buyer (user) just pays the fiat amount
        calculatedPlatformFee = calculatedFiatAmount * 0.01; // 1% of fiat amount (shown for information only)
      } else {
        // When selling USDC (offer type is BUY), the user pays the fee in USDC
        calculatedPlatformFee = numAmount * 0.01; // 1% of USDC amount
      }

      setFiatAmount(calculatedFiatAmount);
      setPlatformFee(calculatedPlatformFee);
    } catch (error) {
      console.error("Error calculating amounts:", error);
      setError("Error calculating trade amounts. Please try again.");
    }
  }, [amount, priceData, offer.fiat_currency, offer.rate_adjustment, offer.offer_type]);

  const fetchPriceData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log("Fetching price data...");
      const response = await getPrices();
      console.log("Price data response:", response);

      // Check if we have valid data
      if (response && response.data && response.data.data && response.data.data.USDC) {
        console.log("Setting price data:", response.data);
        setPriceData(response.data);

        // Immediately calculate amounts with the new price data
        const numAmount = parseFloat(amount);
        if (!isNaN(numAmount) && numAmount > 0) {
          calculateAmounts();
        }
      } else {
        console.error("Invalid price data format:", response);
        setError("Received invalid price data format. Please try again.");
      }
    } catch (err) {
      console.error("Failed to fetch price data:", err);
      setError("Failed to fetch current market prices. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Fetch price data when dialog opens
  useEffect(() => {
    if (isOpen) {
      fetchPriceData();
    }
  }, [isOpen]);

  // Reset form when dialog closes
  useEffect(() => {
    if (!isOpen) {
      // Only reset the form values, not the price data
      setAmount("");
      setFiatAmount(0);
      setPlatformFee(0);
      setError(null);
    }
    // Note: We don't set the amount here anymore
  }, [isOpen]);

  // Calculate fiat amount when amount or price data changes
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      calculateAmounts();
    }
  }, [amount, priceData, calculateAmounts]);

  // Set a default amount when the dialog opens
  useEffect(() => {
    if (isOpen && offer && offer.min_amount) {
      setAmount(offer.min_amount.toString());

      // If we already have price data, calculate amounts
      if (priceData) {
        calculateAmounts();
      }
    }
  }, [isOpen, offer]); // Only run when dialog opens or offer changes

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setAmount(value);
  };

  const handleConfirm = () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError("Please enter a valid amount");
      return;
    }

    const numAmount = parseFloat(amount);

    // Validate against min/max offer amounts
    if (numAmount < offer.min_amount) {
      setError(`Amount must be at least ${formatNumber(offer.min_amount)} ${offer.token}`);
      return;
    }

    if (numAmount > offer.max_amount) {
      setError(`Amount cannot exceed ${formatNumber(offer.max_amount)} ${offer.token}`);
      return;
    }

    if (numAmount > offer.total_available_amount) {
      setError(`Amount exceeds available amount of ${formatNumber(offer.total_available_amount)} ${offer.token}`);
      return;
    }

    // Convert to the format expected by the API (string with proper precision)
    const formattedAmount = (numAmount * 1000000).toString(); // Convert to USDC's 6 decimal places
    onConfirm(offer.id, formattedAmount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {triggerButton && <DialogTrigger asChild>{triggerButton}</DialogTrigger>}
      <DialogContent className="bg-neutral-100 z-50 max-w-md w-full">
        <DialogHeader>
          <DialogTitle>Confirm Trade Details</DialogTitle>
          <DialogDescription>
            Review the details of this trade before confirming.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 my-4">
          {/* Trade Type */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Trade Type</span>
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
              offer.offer_type === 'BUY'
                ? 'bg-[#d1fae5] text-[#065f46]'
                : 'bg-[#ede9fe] text-[#5b21b6]'
            }`}>
              {offer.offer_type === 'BUY'
                ? 'You are selling USDC'
                : 'You are buying USDC'}
            </span>
          </div>

          {/* Token */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Token</span>
            <span>{offer.token}</span>
          </div>

          {/* Market Price */}
          {priceData && (
            <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
              <span className="font-medium text-neutral-700">Current Market Price</span>
              <span>
                {formatNumber(parseFloat(priceData.data.USDC[offer.fiat_currency as keyof typeof priceData.data.USDC]?.price || "0"))} {offer.fiat_currency}
              </span>
            </div>
          )}

          {/* Rate */}
          <div className="flex justify-between items-center p-2 bg-neutral-100 rounded">
            <span className="font-medium text-neutral-700">Rate Adjustment</span>
            <span className={
              offer.rate_adjustment > 1
                ? 'text-[#059669]'
                : offer.rate_adjustment < 1
                  ? 'text-red-600'
                  : 'text-neutral-600'
            }>
              {offer.rate_adjustment > 1
                ? `+${((offer.rate_adjustment - 1) * 100).toFixed(2)}%`
                : offer.rate_adjustment < 1
                  ? `-${((1 - offer.rate_adjustment) * 100).toFixed(2)}%`
                  : "0%"}
            </span>
          </div>

          {/* Amount Input */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({offer.token})</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="amount"
                type="number"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount (${offer.min_amount} - ${offer.max_amount})`}
                className="bg-neutral-100"
                readOnly={false}
                autoFocus
              />
              <span className="text-sm text-neutral-500">{offer.token}</span>
            </div>
            <div className="text-xs text-neutral-500">
              Available: {formatNumber(offer.total_available_amount)} {offer.token} |
              Min: {formatNumber(offer.min_amount)} |
              Max: {formatNumber(offer.max_amount)}
            </div>
          </div>

          {/* Calculated Values */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="space-y-3 p-3 bg-neutral-100 rounded">
              <div className="font-medium text-neutral-700 border-b pb-1 mb-2">
                Details
              </div>

              {offer.offer_type === "BUY" ? (
                // Selling USDC
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">You are selling</span>
                    <span className="font-medium">
                      {amount && formatNumber(parseFloat(amount))} USDC
                    </span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">LocalSolana Fee (1%)</span>
                    <span className="font-medium">{formatNumber(platformFee)} USDC</span>
                  </div>

                  <div className="text-xs text-neutral-500 pl-2">
                    <span>50% of this fee can go to the referral program</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">Total to escrow</span>
                    <span className="font-medium">
                      {amount && formatNumber(parseFloat(amount) + platformFee)} USDC
                    </span>
                  </div>

                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-medium text-neutral-700">You will receive</span>
                    <span className="font-bold text-[#5b21b6]">{formatNumber(fiatAmount)} {offer.fiat_currency}</span>
                  </div>
                </>
              ) : (
                // Buying USDC
                <>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">You will pay</span>
                    <span className="font-medium">{formatNumber(fiatAmount)} {offer.fiat_currency}</span>
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-neutral-700">LocalSolana Fee</span>
                    <span className="font-medium">0 {offer.fiat_currency}</span>
                  </div>

                  <div className="text-xs text-neutral-500 pl-2">
                    <span>Seller pays the 1% LocalSolana fee</span>
                  </div>

                  <div className="border-t pt-2 mt-2 flex justify-between items-center">
                    <span className="font-medium text-neutral-700">You will receive</span>
                    <span className="font-bold text-[#5b21b6]">
                      {amount && formatNumber(parseFloat(amount))} USDC
                    </span>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Time Limits */}
          <div className="text-xs text-neutral-500 p-2 bg-neutral-100 rounded">
            <p>Escrow Deposit Time Limit: {offer.escrow_deposit_time_limit.minutes} minutes</p>
            <p className="mt-1">Fiat Payment Time Limit: {offer.fiat_payment_time_limit.minutes} minutes</p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-2 text-sm text-red-600 bg-red-50 rounded">
              {error}
            </div>
          )}

          {/* Loading Message */}
          {loading && (
            <div className="p-2 text-sm text-neutral-600 bg-neutral-50 rounded">
              Loading price data...
            </div>
          )}

          {/* Next Steps Note */}
          {!loading && !error && fiatAmount > 0 && (
            <div className="p-3 bg-blue-50 text-blue-800 rounded text-sm">
              {offer.offer_type === "BUY" ? (
                <p>
                  <strong>Note:</strong> Since you are selling USDC, you will be prompted to create the escrow account and to pay for it on-chain. You will pay the 1% LocalSolana fee in USDC.
                </p>
              ) : (
                <p>
                  <strong>Note:</strong> Since you are buying USDC, you will be prompted to make a fiat payment in a specific amount and then confirm that via an on-chain action. You pay no LocalSolana fees.
                </p>
              )}
            </div>
          )}
        </div>

        <DialogFooter className="mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            className="bg-[#10b981] hover:bg-[#059669] text-white"
            onClick={handleConfirm}
            disabled={loading || !!error || fiatAmount <= 0}
          >
            Initiate Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeConfirmationDialog;
