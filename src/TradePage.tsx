import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTradeById as getTrade, getAccountById, getOfferById, Trade, Offer, Account } from "./api";
import { formatNumber } from "./lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "./components/StatusBadge";

function TradePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [counterparty, setCounterparty] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTradeDetails = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch trade details
        const tradeResponse = await getTrade(parseInt(id));
        const tradeData = tradeResponse.data;
        setTrade(tradeData);

        // Fetch related offer
        if (tradeData.leg1_offer_id) {
          const offerResponse = await getOfferById(tradeData.leg1_offer_id);
          setOffer(offerResponse.data);

          // Fetch creator account
          const creatorResponse = await getAccountById(offerResponse.data.creator_account_id);
          setCreator(creatorResponse.data);

          // Fetch counterparty account (the other party in the trade)
          // Determine counterparty based on offer type
          if (offerResponse.data.offer_type === "BUY") {
            // For BUY offers, the counterparty is the seller
            const counterpartyResponse = await getAccountById(tradeData.leg1_seller_account_id);
            setCounterparty(counterpartyResponse.data);
          } else if (offerResponse.data.offer_type === "SELL" && tradeData.leg1_buyer_account_id) {
            // For SELL offers, the counterparty is the buyer
            const counterpartyResponse = await getAccountById(tradeData.leg1_buyer_account_id);
            setCounterparty(counterpartyResponse.data);
          }
        }

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        setError(`Failed to load trade details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchTradeDetails();
  }, [id]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} (${formatDistanceToNow(date)} ago)`;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <p className="text-neutral-500">Loading trade details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="mb-4 border-none bg-red-50">
        <AlertDescription className="text-red-700">{error}</AlertDescription>
      </Alert>
    );
  }

  if (!trade) {
    return (
      <Alert className="mb-4 border-yellow-300 bg-yellow-50">
        <AlertDescription className="text-primary-700">
          Trade not found or you don't have permission to view it.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#5b21b6]">
            Trade #{formatNumber(trade.id)}
          </h1>
          <p className="text-neutral-500">
            Created {formatDate(trade.created_at)}
          </p>
        </div>
        <StatusBadge>{trade.leg1_state}</StatusBadge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Trade Details</CardTitle>
          <CardDescription>Information about this trade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-neutral-700">Amount</h3>
              <p>{formatNumber(trade.leg1_crypto_amount)} {offer?.token || "USDC"}</p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700">Status</h3>
              <StatusBadge>{trade.leg1_state}</StatusBadge>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700">From Currency</h3>
              <p>{trade.from_fiat_currency}</p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700">To Currency</h3>
              <p>{trade.destination_fiat_currency}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Participants</CardTitle>
          <CardDescription>People involved in this trade</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-neutral-700">Offer Creator</h3>
              <p>{creator?.username || creator?.wallet_address || "Unknown"}</p>
            </div>
            <div>
              <h3 className="font-medium text-neutral-700">Counterparty</h3>
              <p>{counterparty?.username || counterparty?.wallet_address || "Unknown"}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Related Offer</CardTitle>
          <CardDescription>The offer this trade is based on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-neutral-700">Offer Type</h3>
                <p>{offer.offer_type}</p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-700">Amount Range</h3>
                <p>{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}</p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-700">Rate Adjustment</h3>
                <p>{offer.rate_adjustment > 1
                    ? `+${((offer.rate_adjustment - 1) * 100).toFixed(2)}%`
                    : offer.rate_adjustment < 1
                      ? `-${((1 - offer.rate_adjustment) * 100).toFixed(2)}%`
                      : "0%"}</p>
              </div>
              <div>
                <h3 className="font-medium text-neutral-700">Currency</h3>
                <p>{offer.fiat_currency}</p>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">Offer details not available</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Chat</CardTitle>
          <CardDescription>Communicate with your trading partner</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-neutral-500 text-center py-4">Chat functionality coming soon</p>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button
          onClick={() => navigate("/")}
          variant="outline"
          className="mr-2"
        >
          Back to Offers
        </Button>
        <Button
          onClick={() => navigate("/trades")}
          className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white"
        >
          View All Trades
        </Button>
      </div>
    </div>
  );
}

export default TradePage;
