import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getTradeById as getTrade, getAccountById, getOfferById, Trade, Offer, Account } from "./api";
import { formatNumber } from "./lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
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
  creator: Account | null;
  counterparty: Account | null;
}

function TradeDescription({ trade, offer, userRole, creator, counterparty }: TradeDescriptionProps) {
  // Calculate price from crypto and fiat amounts
  const price = trade.leg1_fiat_amount && trade.leg1_crypto_amount
    ? parseFloat(trade.leg1_fiat_amount) / parseFloat(trade.leg1_crypto_amount)
    : 0;

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };

  // Simple logic based on user role:
  // If current user is buyer, show seller; if current user is seller, show buyer
  let otherParty;

  // For BUY offers: creator is buyer, counterparty is seller
  // For SELL offers: creator is seller, counterparty is buyer
  if (userRole === 'buyer') {
    // Current user is buyer, so show seller
    otherParty = offer?.offer_type === 'BUY' ? creator : counterparty;
  } else {
    // Current user is seller, so show buyer
    otherParty = offer?.offer_type === 'SELL' ? creator : counterparty;
  }

  const otherPartyRole = "Counterparty";

  // Abbreviate wallet address if available
  const abbreviateWallet = (wallet: string) => {
    if (!wallet || wallet.length < 10) return wallet;
    return `${wallet.substring(0, 6)}...${wallet.substring(wallet.length - 4)}`;
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
        {offer && (
          <span className="ml-2">
            <a
              href={`/offers/${offer.id}`}
              className="text-[#6d28d9] hover:text-[#5b21b6] underline text-sm"
            >
              [view source offer]
            </a>
          </span>
        )}
      </p>
      <div className="mt-2 text-neutral-600">

        {otherParty && (
          <div className="mt-2 flex items-center">
            <strong className="mr-2">{otherPartyRole}:</strong>
            <div className="flex items-center">
              <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2 overflow-hidden">
                {otherParty.profile_photo_url ? (
                  <img src={otherParty.profile_photo_url} alt={otherParty.username || "User"} className="w-full h-full object-cover" />
                ) : (
                  otherParty.username?.[0]?.toUpperCase() || otherParty.wallet_address?.[0]?.toUpperCase() || "?"
                )}
              </div>
              <span className="font-medium mr-1">{otherParty.username || "Anonymous"}</span>
              {otherParty.wallet_address && (
                <span className="text-xs text-gray-500 mr-1">({abbreviateWallet(otherParty.wallet_address)})</span>
              )}
              <span className="text-xs text-gray-500 mr-2">ID: {otherParty.id}</span>
              {otherParty.telegram_username && (
                <a
                  href={`https://t.me/${otherParty.telegram_username}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 flex items-center"
                >
                  <svg width="24" height="24" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-1">
                    <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="#0088cc"/>
                  </svg>
                </a>
              )}
            </div>
          </div>
        )}

        {offer?.terms && (
          <div className="mt-2 mb-3">
            <p className="mb-1"><strong>Terms</strong>:</p>
            <blockquote className="pl-3 border-l-2 border-gray-300 italic text-gray-600 text-base">
              "{offer.terms}"
            </blockquote>
          </div>
        )}

      </div>
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
  const { primaryWallet } = useDynamicContext();
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
            <TradeDescription
              trade={trade}
              offer={offer}
              userRole={userRole}
              creator={creator}
              counterparty={counterparty}
            />
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

      {/* Source Offer box removed */}

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
                <svg className="w-6 h-6 mr-1" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M41.4193 7.30899C41.4193 7.30899 45.3046 5.79399 44.9808 9.47328C44.8729 10.9883 43.9016 16.2908 43.1461 22.0262L40.5559 39.0159C40.5559 39.0159 40.3401 41.5048 38.3974 41.9377C36.4547 42.3705 33.5408 40.4227 33.0011 39.9898C32.5694 39.6652 24.9068 34.7955 22.2086 32.4148C21.4531 31.7655 20.5897 30.4669 22.3165 28.9519L33.6487 18.1305C34.9438 16.8319 36.2389 13.8019 30.8426 17.4812L15.7331 27.7616C15.7331 27.7616 14.0063 28.8437 10.7686 27.8698L3.75342 25.7055C3.75342 25.7055 1.16321 24.0823 5.58815 22.459C16.3807 17.3729 29.6555 12.1786 41.4193 7.30899Z" fill="currentColor"/>
                </svg>
                Message on Telegram
              </Button>
            )}
          </div>
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
            <ParticipantCard
              user={creator}
              role="Offer Creator"
              isCurrentUser={primaryWallet?.address?.toLowerCase() === creator?.wallet_address?.toLowerCase()}
            />
          </div>
          <div className="p-3 border border-gray-100 rounded-md hover:bg-gray-50">
            <ParticipantCard
              user={counterparty}
              role="Counterparty"
              isCurrentUser={primaryWallet?.address?.toLowerCase() === counterparty?.wallet_address?.toLowerCase()}
            />
          </div>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-end p-4">
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
