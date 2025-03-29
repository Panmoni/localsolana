import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getTradeById as getTrade, getAccountById, getOfferById, Trade, Offer, Account } from "./api";
import { formatNumber } from "./lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import StatusBadge from "./components/StatusBadge";
import { Progress } from "@/components/ui/progress";
import ParticipantCard from "./components/ParticipantCard";

// Helper function for formatting dates
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return `${date.toLocaleDateString()} (${formatDistanceToNow(date)} ago)`;
};

// Trade Description Component
interface TradeDescriptionProps {
  trade: Trade;
  offer: Offer | null;
  userRole: 'buyer' | 'seller';
}

function TradeDescription({ trade, offer, userRole }: TradeDescriptionProps) {
  // Calculate price from crypto and fiat amounts
  const price = trade.leg1_fiat_amount && trade.leg1_crypto_amount
    ? parseFloat(trade.leg1_fiat_amount) / parseFloat(trade.leg1_crypto_amount)
    : 0;

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };

  const rateAdjustment = offer?.rate_adjustment || 1;
  const token = trade.leg1_crypto_token || offer?.token || "USDC";
  const action = userRole === 'buyer' ? 'buying' : 'selling';
  const marketPosition = rateAdjustment > 1 ? "above" : rateAdjustment < 1 ? "below" : "at";

  return (
    <div className="text-lg mb-4">
      <p>
        You are <strong>{action}</strong> {formatNumber(parseFloat(trade.leg1_crypto_amount))} {token} {""}
        for {trade.leg1_fiat_amount ? formatNumber(parseFloat(trade.leg1_fiat_amount)) : 'N/A'} {trade.from_fiat_currency} {""} at {formatNumber(price)} {trade.from_fiat_currency}/{token}. {""} This is{" "}
        <span className={
          rateAdjustment > 1
            ? 'text-[#059669]'
            : rateAdjustment < 1
              ? 'text-red-600'
              : 'text-neutral-600'
        }>
          {formatRate(rateAdjustment)}
        </span>{" "}
        {marketPosition} the market price.
      </p>
      {offer?.terms && (
        <p className="mt-2 text-neutral-600">
          <strong>Terms</strong>: {offer.terms}
        </p>
      )}
    </div>
  );
}

// Trade Status Display Component
interface TradeStatusDisplayProps {
  state: string;
  userRole: 'buyer' | 'seller';
}

function TradeStatusDisplay({ state, userRole }: TradeStatusDisplayProps) {
  // Map states to progress percentages
  const stateToProgress: Record<string, number> = {
    'CREATED': 10,
    'AWAITING_FIAT_PAYMENT': 30,
    'PENDING_CRYPTO_RELEASE': 60,
    'DISPUTED': 70,
    'COMPLETED': 100,
    'CANCELLED': 0
  };

  // Map states to user-friendly messages based on role
  const stateMessages: Record<string, Record<string, string>> = {
    'CREATED': {
      buyer: "Waiting for seller to create escrow",
      seller: "Waiting on you to create escrow"
    },
    'AWAITING_FIAT_PAYMENT': {
      buyer: "Waiting on you to make fiat payment",
      seller: "Waiting for buyer to make fiat payment"
    },
    'PENDING_CRYPTO_RELEASE': {
      buyer: "Waiting for seller to release crypto",
      seller: "Waiting on you to release crypto"
    },
    'DISPUTED': {
      buyer: "Trade is under dispute",
      seller: "Trade is under dispute"
    },
    'COMPLETED': {
      buyer: "Trade completed successfully",
      seller: "Trade completed successfully"
    },
    'CANCELLED': {
      buyer: "Trade was cancelled",
      seller: "Trade was cancelled"
    }
  };

  const progress = stateToProgress[state] || 0;
  const message = stateMessages[state]?.[userRole] || "Unknown state";

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <StatusBadge className="text-xl py-2 px-4">{state}</StatusBadge>
        <p className="text-lg font-medium">{message}</p>
      </div>
      <Progress value={progress} className="h-4" />
    </div>
  );
}


// Status Log Component
interface StatusLogProps {
  trade: Trade;
}

function StatusLog({ trade }: StatusLogProps) {
  // Create a status log based on available timestamps
  const statusUpdates = [];

  if (trade.created_at) {
    statusUpdates.push({ state: "CREATED", timestamp: trade.created_at });
  }

  if (trade.leg1_escrow_deposit_deadline) {
    statusUpdates.push({
      state: "ESCROW DEADLINE SET",
      timestamp: trade.leg1_escrow_deposit_deadline
    });
  }

  if (trade.leg1_fiat_payment_deadline) {
    statusUpdates.push({
      state: "AWAITING_FIAT_PAYMENT",
      timestamp: trade.leg1_fiat_payment_deadline
    });
  }

  if (trade.leg1_fiat_paid_at) {
    statusUpdates.push({
      state: "FIAT PAYMENT CONFIRMED",
      timestamp: trade.leg1_fiat_paid_at
    });
  }

  if (trade.leg1_released_at) {
    statusUpdates.push({
      state: "COMPLETED",
      timestamp: trade.leg1_released_at
    });
  }

  if (trade.leg1_cancelled_at) {
    statusUpdates.push({
      state: "CANCELLED",
      timestamp: trade.leg1_cancelled_at
    });
  }

  // Sort by timestamp
  statusUpdates.sort((a, b) =>
    new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
  );

  return (
    <div className="space-y-2">
      {statusUpdates.length > 0 ? (
        statusUpdates.map((update, index) => (
          <div key={index} className="flex justify-between items-center p-2 border border-gray-100 rounded-md mb-2 hover:bg-gray-50">
            <StatusBadge>{update.state}</StatusBadge>
            <span className="text-gray-500">{formatDate(update.timestamp)}</span>
          </div>
        ))
      ) : (
        <p className="text-neutral-500 text-center p-4 border border-gray-100 rounded-md">No status updates available</p>
      )}
    </div>
  );
}

function TradePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [trade, setTrade] = useState<Trade | null>(null);
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [counterparty, setCounterparty] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller'>('buyer');

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

            // Determine user role (this would normally come from auth context)
            // For now, we'll just use a placeholder logic
            const currentUserId = offerResponse.data.creator_account_id; // This should come from auth context
            setUserRole(tradeData.leg1_seller_account_id === currentUserId ? 'seller' : 'buyer');

          } else if (offerResponse.data.offer_type === "SELL" && tradeData.leg1_buyer_account_id) {
            // For SELL offers, the counterparty is the buyer
            const counterpartyResponse = await getAccountById(tradeData.leg1_buyer_account_id);
            setCounterparty(counterpartyResponse.data);

            // Determine user role
            const currentUserId = offerResponse.data.creator_account_id; // This should come from auth context
            setUserRole(tradeData.leg1_buyer_account_id === currentUserId ? 'buyer' : 'seller');
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
    <div className="space-y-4">
      {/* Combined Title and Trade Description */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <h1 className="text-2xl font-bold text-[#5b21b6]">
            Trade #{formatNumber(trade.id)}
          </h1>
          <p className="text-neutral-500">
            Created {new Date(trade.created_at).toLocaleString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            })} - <span className="text-gray-400">{formatDistanceToNow(new Date(trade.created_at))} ago</span>
          </p>
        </CardHeader>
        <CardContent>
          {trade && offer && (
            <TradeDescription trade={trade} offer={offer} userRole={userRole} />
          )}
        </CardContent>
      </Card>

      {/* Enhanced Status Display */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Trade Status</CardTitle>
          <CardDescription>Current status and progress of this trade</CardDescription>
        </CardHeader>
        <CardContent>
          <TradeStatusDisplay state={trade.leg1_state} userRole={userRole} />
        </CardContent>
      </Card>


      {/* Participants */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Participants</CardTitle>
          <CardDescription>People involved in this trade</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
            <ParticipantCard user={creator} role="Offer Creator" />
          </div>
          <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
            <ParticipantCard user={counterparty} role="Counterparty" />
          </div>
        </CardContent>
      </Card>

      {/* Status Log */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Status Log</CardTitle>
          <CardDescription>History of trade status updates</CardDescription>
        </CardHeader>
        <CardContent>
          <StatusLog trade={trade} />
        </CardContent>
      </Card>

      {/* Related Offer with Link */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Source Offer</CardTitle>
          <CardDescription>The offer this trade is based on</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {offer ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <h3 className="font-medium text-neutral-700">Offer Type</h3>
                <p>{offer.offer_type}</p>
              </div>
              <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <h3 className="font-medium text-neutral-700">Amount Range</h3>
                <p>{formatNumber(offer.min_amount)} - {formatNumber(offer.max_amount)} {offer.token}</p>
              </div>
              <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <h3 className="font-medium text-neutral-700">Rate Adjustment</h3>
                <p>{offer.rate_adjustment > 1
                    ? `+${((offer.rate_adjustment - 1) * 100).toFixed(2)}%`
                    : offer.rate_adjustment < 1
                      ? `-${((1 - offer.rate_adjustment) * 100).toFixed(2)}%`
                      : "0%"}</p>
              </div>
              <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
                <h3 className="font-medium text-neutral-700">Currency</h3>
                <p>{offer.fiat_currency}</p>
              </div>
            </div>
          ) : (
            <p className="text-neutral-500">Offer details not available</p>
          )}
        </CardContent>
        <CardFooter>
          {offer && (
            <Button
              onClick={() => navigate(`/offers/${offer.id}`)}
              variant="outline"
            >
              View Source Offer
            </Button>
          )}
        </CardFooter>
      </Card>

      {/* Chat Section */}
      <Card className="border border-gray-200 shadow-sm p-4">
        <CardHeader>
          <CardTitle className="text-[#5b21b6]">Chat</CardTitle>
          <CardDescription>Communicate with your trading partner</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 border border-gray-100 rounded-md p-4">
            <p className="text-neutral-500 mb-4">Chat functionality coming soon</p>
            {counterparty?.telegram_username && (
              <Button
                onClick={() => window.open(`https://t.me/${counterparty.telegram_username}`, '_blank')}
                className="bg-[#0088cc] hover:bg-[#0077b5] text-white"
              >
                <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm.14 19.018c-.237 0-.47-.033-.696-.1-1.92-.56-3.773-1.44-5.66-2.64-1.333-.853-2.46-1.87-3.38-3.053-.92-1.183-1.64-2.537-2.16-4.06-.52-1.523-.78-3.057-.78-4.6 0-.56.073-1.093.22-1.6.147-.507.367-.96.66-1.36.293-.4.66-.727 1.1-.98.44-.253.94-.38 1.5-.38.173 0 .347.023.52.07.173.047.34.123.5.23.16.107.307.247.44.42.133.173.253.38.36.62l1.44 3.6c.08.213.137.413.17.6.033.187.05.353.05.5 0 .213-.043.42-.13.62-.087.2-.217.387-.39.56l-.76.76c-.08.08-.117.177-.11.29.007.113.043.217.11.31.133.187.347.447.64.78.293.333.62.673.98 1.02.36.347.7.673 1.02.98.32.307.58.52.78.64.093.067.197.103.31.11.113.007.21-.03.29-.11l.76-.76c.173-.173.36-.303.56-.39.2-.087.407-.13.62-.13.147 0 .313.017.5.05.187.033.387.09.6.17l3.6 1.44c.24.107.447.227.62.36.173.133.313.28.42.44.107.16.183.327.23.5.047.173.07.347.07.52 0 .56-.127 1.06-.38 1.5-.253.44-.58.807-.98 1.1-.4.293-.853.513-1.36.66-.507.147-1.04.22-1.6.22h-.08z"/>
                </svg>
                Message on Telegram
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-end p-4 border border-gray-200 rounded-lg shadow-sm">
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
