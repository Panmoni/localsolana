import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { getOfferById, getAccountById, createTrade, deleteOffer, Offer, Account, getAccount } from "./api";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";
import Container from "./components/Container";

function OfferDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { primaryWallet } = useDynamicContext();
  const [offer, setOffer] = useState<Offer | null>(null);
  const [creator, setCreator] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userAccount, setUserAccount] = useState<Account | null>(null);

  useEffect(() => {
    const fetchOfferAndCreator = async () => {
      if (!id) return;

      setLoading(true);
      try {
        // Fetch offer details
        const offerResponse = await getOfferById(parseInt(id));
        const offerData = offerResponse.data;
        setOffer(offerData);

        // Fetch creator details
        const creatorResponse = await getAccountById(offerData.creator_account_id);
        setCreator(creatorResponse.data);

        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[OfferDetailPage] Fetch failed:", err);
        setError(`Failed to load offer details: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };

    fetchOfferAndCreator();
  }, [id]);

  // Fetch current user account
  useEffect(() => {
    const fetchUserAccount = async () => {
      if (!primaryWallet) return;

      try {
        const response = await getAccount();
        setUserAccount(response.data);
      } catch (err) {
        console.error("[OfferDetailPage] Failed to fetch user account:", err);
      }
    };

    fetchUserAccount();
  }, [primaryWallet]);

  // Check if the current user is the owner of the offer
  const isOwner = userAccount && offer && userAccount.id === offer.creator_account_id;

  const handleDelete = async () => {
    if (!offer) return;

    if (!window.confirm("Are you sure you want to delete this offer?")) {
      return;
    }

    try {
      await deleteOffer(offer.id);
      navigate('/my-offers', { state: { message: 'Offer deleted successfully' } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to delete offer: ${errorMessage}`);
    }
  };

  const handleStartTrade = async () => {
    if (!offer || !primaryWallet) return;

    try {
      const tradeData = {
        leg1_offer_id: offer.id,
        leg1_crypto_amount: "1000000", // Using string as API expects
        from_fiat_currency: offer.fiat_currency,
        destination_fiat_currency: offer.fiat_currency,
      };

      await createTrade(tradeData);
      navigate('/my-trades', { state: { message: 'Trade started successfully' } });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Failed to start trade: ${errorMessage}`);
    }
  };

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(1)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(1)}%`;
    return "0%";
  };

  if (loading) {
    return (
      <Container>
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading offer details...</p>
            </div>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (error) {
    return (
      <Container>
        <Card>
          <CardContent className="p-6">
            <Alert variant="destructive" className="mb-0 border-none bg-red-50">
              <AlertDescription className="text-red-700">{error}</AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  if (!offer || !creator) {
    return (
      <Container>
        <Card>
          <CardContent className="p-6">
            <Alert className="mb-0 bg-amber-50 border-amber-200">
              <AlertDescription className="text-amber-700">
                Offer not found or has been deleted.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      </Container>
    );
  }

  return (
    <Container>
      <Card className="mb-4">
        <CardHeader>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">
                Offer #{offer.id}
              </CardTitle>
              <CardDescription>
                Created {formatDistanceToNow(new Date(offer.created_at))} ago by {creator.username || creator.wallet_address}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Link to="/offers">
                <Button variant="outline">Back to Offers</Button>
              </Link>
              {isOwner && (
                <Link to={`/edit-offer/${offer.id}`}>
                  <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6]">
                    Edit
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Type</span>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  offer.offer_type === 'BUY'
                    ? 'bg-[#d1fae5] text-[#065f46]'
                    : 'bg-[#ede9fe] text-[#5b21b6]'
                }`}>
                  {offer.offer_type}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Token</span>
                <span>{offer.token}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Amount Range</span>
                <span>{offer.min_amount} - {offer.max_amount} {offer.token}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Available Amount</span>
                <span>{offer.total_available_amount} {offer.token}</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Rate Adjustment</span>
                <span className={
                  offer.rate_adjustment > 1
                    ? 'text-[#059669]'
                    : offer.rate_adjustment < 1
                      ? 'text-red-600'
                      : 'text-neutral-600'
                }>
                  {formatRate(offer.rate_adjustment)}
                </span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Fiat Currency</span>
                <span>{offer.fiat_currency}</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Escrow Deposit Time Limit</span>
                <span>{offer.escrow_deposit_time_limit.minutes} minutes</span>
              </div>

              <div className="flex justify-between items-center p-4 bg-neutral-50 rounded-lg">
                <span className="font-medium text-neutral-700">Fiat Payment Time Limit</span>
                <span>{offer.fiat_payment_time_limit.minutes} minutes</span>
              </div>
            </div>
          </div>

          <div className="mt-6">
            <h3 className="font-medium text-neutral-700 mb-2">Terms and Conditions</h3>
            <div className="p-4 bg-neutral-50 rounded-lg whitespace-pre-wrap">
              {offer.terms || "No terms specified"}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row gap-3 justify-end border-t border-neutral-100 p-6">
          {isOwner ? (
            <>
              <Link to={`/edit-offer/${offer.id}`}>
                <Button variant="outline" className="border-[#6d28d9] text-[#6d28d9] hover:text-[#5b21b6] hover:border-[#5b21b6] w-full sm:w-auto">
                  Edit Offer
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleDelete}
                className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600 w-full sm:w-auto"
              >
                Delete Offer
              </Button>
            </>
          ) : (
            primaryWallet ? (
              <Button
                onClick={handleStartTrade}
                className="bg-[#10b981] hover:bg-[#059669] text-white w-full sm:w-auto"
              >
                Start Trade
              </Button>
            ) : (
              <Button
                className="bg-gray-400 hover:bg-gray-500 text-white w-full sm:w-auto cursor-not-allowed"
                disabled
              >
                Connect Wallet to Trade
              </Button>
            )
          )}
        </CardFooter>
      </Card>
    </Container>
  );
}

export default OfferDetailPage;
