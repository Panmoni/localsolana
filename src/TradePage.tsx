import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import {
  getTradeById as getTrade,
  getAccountById,
  getOfferById,
  markTradeFiatPaid,
  createEscrow,
  releaseEscrow,
  cancelEscrow,
  disputeEscrow,
  getAccount,
  Trade,
  Offer,
  Account
} from "./api";
import { formatNumber } from "./lib/utils";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import ParticipantCard from "./components/ParticipantCard";
import TradeStatusDisplay from "./components/TradeStatusDisplay";
import { useTradeUpdates } from "./hooks/useTradeUpdates";

// Trade Description Component
interface TradeDescriptionProps {
  trade: Trade;
  offer: Offer | null;
  userRole: 'buyer' | 'seller';
  counterparty: Account | null;
}

function TradeDescription({ trade, offer, userRole, counterparty }: TradeDescriptionProps) {
  // Calculate price from crypto and fiat amounts
  const price = trade.leg1_fiat_amount && trade.leg1_crypto_amount
    ? parseFloat(trade.leg1_fiat_amount) / parseFloat(trade.leg1_crypto_amount)
    : 0;

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(2)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(2)}%`;
    return "0%";
  };
  // The other party is the counterparty
  const otherParty = counterparty;
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
  const [actionLoading, setActionLoading] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<Account | null>(null);

  /**
   * Determines the user's role in a trade by comparing the current user's account ID
   * with the trade's seller and buyer account IDs
   * @param trade - The trade object containing buyer and seller information
   * @param offer - The related offer (optional)
   * @returns {'buyer' | 'seller'} - The user's role in the trade
   */
  const getUserRoleInTrade = async (trade: Trade, offer?: Offer | null): Promise<'buyer' | 'seller'> => {
    try {
      // Get the current user's account
      let userAccountToUse = currentAccount;

      if (!userAccountToUse) {
        const accountResponse = await getAccount();
        const userAccount = accountResponse.data;
        setCurrentAccount(userAccount);
        userAccountToUse = userAccount; // Use the fetched account directly

        console.log("[userRole] Current user account ID:", userAccount.id);
        console.log("[userRole] Trade seller account ID:", trade.leg1_seller_account_id);
        console.log("[userRole] Trade buyer account ID:", trade.leg1_buyer_account_id);
      }

      // Determine user role based on account IDs using the local variable
      const isSeller = userAccountToUse?.id === trade.leg1_seller_account_id;
      const userRole = isSeller ? 'seller' : 'buyer';

      console.log("[userRole] currentAccount:", userAccountToUse);
      console.log(`[userRole] User role determined: ${userRole}`);

      // If offer is provided, determine the other party based on offer type and user role
      if (offer) {
        // For BUY offers: creator is buyer, counterparty is seller
        // For SELL offers: creator is seller, counterparty is buyer
        let otherPartyRole: 'buyer' | 'seller';

        if (userRole === 'buyer') {
          // Current user is buyer, so other party is seller
          otherPartyRole = 'seller';
        } else {
          // Current user is seller, so other party is buyer
          otherPartyRole = 'buyer';
        }

        console.log(`Other party role determined: ${otherPartyRole}`);
      }

      return userRole;
    } catch (error) {
      console.error("Error determining user role:", error);
      // Default to buyer if there's an error
      return 'buyer';
    }
  };


  // Use polling to get trade updates
  const { trade: tradeUpdates } = useTradeUpdates(id ? parseInt(id) : 0);

  // Update trade data when we receive updates via polling
  useEffect(() => {
    if (tradeUpdates) {
      setTrade(tradeUpdates);
      console.log(`Trade updated - Current state: ${tradeUpdates.leg1_state}, User role: ${userRole}`);

      // Update user role when trade updates
      const updateUserRole = async () => {
        const role = await getUserRoleInTrade(tradeUpdates);
        setUserRole(role);
      };

      updateUserRole();
    }
  }, [tradeUpdates]);

  // Action handlers for trade status actions
  const handleCreateEscrow = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Determine buyer and seller addresses
      const sellerAddress = userRole === 'seller' ? primaryWallet.address : counterparty?.wallet_address;
      const buyerAddress = userRole === 'buyer' ? primaryWallet.address : counterparty?.wallet_address;

      if (!sellerAddress || !buyerAddress) {
        throw new Error("Missing wallet addresses");
      }

      // Call API to create escrow
      await createEscrow({
        trade_id: trade.id,
        escrow_id: trade.id, // Using trade ID as escrow ID for simplicity
        seller: sellerAddress,
        buyer: buyerAddress,
        amount: parseFloat(trade.leg1_crypto_amount)
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error creating escrow:", err);
      setError(err instanceof Error ? err.message : "Failed to create escrow");
    } finally {
      setActionLoading(false);
    }
  };

  const handleMarkFiatPaid = async () => {
    if (!trade) return;

    setActionLoading(true);
    try {
      // Call API to mark fiat as paid
      await markTradeFiatPaid(trade.id);

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error marking fiat as paid:", err);
      setError(err instanceof Error ? err.message : "Failed to mark fiat as paid");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReleaseCrypto = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to release escrow
      // Note: This is a simplified version, in a real implementation you would need to provide
      // all the required parameters like buyer_token_account and arbitrator_token_account
      await releaseEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        authority: primaryWallet.address,
        buyer_token_account: "placeholder", // This would come from the wallet
        arbitrator_token_account: "placeholder" // This would be a system account
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error releasing crypto:", err);
      setError(err instanceof Error ? err.message : "Failed to release crypto");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDisputeTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to dispute escrow
      await disputeEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        disputing_party: primaryWallet.address,
        disputing_party_token_account: "placeholder" // This would come from the wallet
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error disputing trade:", err);
      setError(err instanceof Error ? err.message : "Failed to dispute trade");
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancelTrade = async () => {
    if (!trade || !primaryWallet?.address) return;

    setActionLoading(true);
    try {
      // Call API to cancel escrow
      await cancelEscrow({
        escrow_id: trade.id,
        trade_id: trade.id,
        seller: userRole === 'seller' ? primaryWallet.address : counterparty?.wallet_address || "",
        authority: primaryWallet.address
      });

      // Refresh trade data
      const updatedTrade = await getTrade(trade.id);
      setTrade(updatedTrade.data);
    } catch (err) {
      console.error("Error cancelling trade:", err);
      setError(err instanceof Error ? err.message : "Failed to cancel trade");
    } finally {
      setActionLoading(false);
    }
  };

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

          // Get current user account and determine role
          const accountResponse = await getAccount();
          const userAccount = accountResponse.data;
          setCurrentAccount(userAccount);

          // Determine user role using our helper function
          const role = await getUserRoleInTrade(tradeData);
          setUserRole(role);
          console.log(`User role determined: ${role}`);
          console.log(`Trade state: ${tradeData.leg1_state}`);
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
      {/* User Role Display */}
      <div className="bg-purple-100 p-3 rounded-md mb-4 text-center">
        <p className="text-purple-800 font-medium">
          Your role in this trade: <span className="font-bold uppercase">{userRole}</span>
        </p>
      </div>

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
          <TradeStatusDisplay
            trade={trade}
            userRole={userRole}
            onCreateEscrow={handleCreateEscrow}
            onMarkFiatPaid={handleMarkFiatPaid}
            onReleaseCrypto={handleReleaseCrypto}
            onDisputeTrade={handleDisputeTrade}
            onCancelTrade={handleCancelTrade}
            loading={actionLoading}
          />
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
          View All My Trades
        </Button>
      </div>
    </div>
  );
}

export default TradePage;
