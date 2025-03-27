import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Link } from "react-router-dom";
import {
  getOffers,
  createTrade,
  createEscrow,
  Offer,
  getAccountById,
  getAccount
} from "./api";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

function OffersPage() {
  const { primaryWallet } = useDynamicContext();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorNames, setCreatorNames] = useState<Record<number, string>>({});
  const [hasUsername, setHasUsername] = useState<boolean | null>(null);

  // Check if the current user has a username set
  useEffect(() => {
    const checkUsername = async () => {
      if (primaryWallet) {
        try {
          console.log("[OffersPage] Checking if user has username...");
          const accountResponse = await getAccount();
          const hasUsername = !!accountResponse.data.username;
          console.log("[OffersPage] User has username:", hasUsername, "Username:", accountResponse.data.username);
          setHasUsername(hasUsername);
        } catch (err) {
          console.error("[OffersPage] Failed to fetch user account:", err);

          // Check if it's an Axios error with a 404 status
          const axiosError = err as { response?: { status: number } };
          const isNotFound = axiosError.response && axiosError.response.status === 404;
          console.log("[OffersPage] Is 404 error:", isNotFound);

          // Set hasUsername to false if it's a 404 error (no account exists)
          setHasUsername(isNotFound ? false : null);

          // Debug current state
          console.log("[OffersPage] Current state - primaryWallet:", !!primaryWallet, "hasUsername:", isNotFound ? false : null);
        }
      } else {
        console.log("[OffersPage] No wallet connected");
      }
    };
    checkUsername();
  }, [primaryWallet]);

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getOffers();
        setOffers(
          response.data.sort(
            (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
          )
        );

        // Fetch creator usernames/wallet addresses
        const uniqueCreatorIds = [...new Set(response.data.map((o: Offer) => o.creator_account_id))];
        const namePromises = uniqueCreatorIds.map(async (id: number) => {
          try {
            const accountResponse = await getAccountById(id);
            const account = accountResponse.data;
            return { id, username: account.username || account.wallet_address };
          } catch (err) {
            console.error(`Failed to fetch account ${id}:`, err);
            return { id, username: `User #${id}` };
          }
        });

        const names = await Promise.all(namePromises);
        setCreatorNames(Object.fromEntries(names.map(({ id, username }) => [id, username])));
        setError(null);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error";
        console.error("[OffersPage] Fetch failed:", err);
        setError(`Failed to load offers: ${errorMessage}`);
      } finally {
        setLoading(false);
      }
    };
    fetchOffers();
  }, []);

  const startTrade = async (offerId: number) => {
    try {
      const tradeData = {
        leg1_offer_id: offerId,
        leg1_crypto_amount: "1000000", // Using string as API expects
        from_fiat_currency: "USD",
        destination_fiat_currency: "USD",
      };
      const tradeResponse = await createTrade(tradeData);
      const tradeId = tradeResponse.data.id;

      if (primaryWallet) {
        const seller = primaryWallet.address;
        const offer = offers.find((o) => o.id === offerId);
        const buyer = offer ? String(offer.creator_account_id) : seller; // Convert to string

        const escrowData = {
          trade_id: tradeId,
          escrow_id: Math.floor(Math.random() * 1000000),
          seller,
          buyer,
          amount: 1000000,
        };

        const escrowResponse = await createEscrow(escrowData);
        console.log("[OffersPage] Escrow instruction generated:", escrowResponse.data);

        alert(`Trade ${tradeId} started successfully`);
      } else {
        alert(`Trade ${tradeId} started, but no wallet connected`);
      }
    } catch (err) {
      console.error("[OffersPage] Trade failed:", err);
      alert("Trade failed: " + (err instanceof Error ? err.message : "Unknown error"));
    }
  };

  const abbreviateWallet = (address: string) => {
    return address.length > 8 ? `${address.slice(0, 4)}...${address.slice(-4)}` : address;
  };

  const formatRate = (rate: number) => {
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(1)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(1)}%`;
    return "0%";
  };

  // Debug render values
  console.log("[OffersPage] Rendering with:", {
    hasUsername,
    hasPrimaryWallet: !!primaryWallet,
    showAlert: hasUsername === false && !!primaryWallet
  });

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card>
        {hasUsername === false && primaryWallet && (
          <div>
            <Alert className="mb-0 border-yellow-300 bg-yellow-50">
              <AlertDescription className="text-primary-700">
                <span>You haven't set a username yet. <Link to="/account" className="underline font-medium">Click here</Link> to create your profile.</span>
              </AlertDescription>
            </Alert>
          </div>
        )}
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-[#5b21b6] font-semibold">Available Offers</CardTitle>
              <CardDescription>Start a simple P2P trade from one of the available offers</CardDescription>
            </div>
            {primaryWallet && (
              <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white">
                <Link to="/create-offer" className="text-white hover:text-white">
                  Create New Offer
                </Link>
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-0">

          {loading && (
            <div className="flex justify-center items-center py-16">
              <p className="text-neutral-500">Loading available offers...</p>
            </div>
          )}

          {error && (
            <div className="p-5">
              <Alert variant="destructive" className="mb-0 border-none bg-red-50">
                <AlertDescription className="text-red-700">{error}</AlertDescription>
              </Alert>
            </div>
          )}

          {!loading && !error && offers.length === 0 ? (
            <div className="p-10 text-center">
              <p className="text-neutral-500">No offers available at this time.</p>
              <p className="text-neutral-400 text-sm mt-2">Check back later or create your own offer.</p>
            </div>
          ) : (
            !loading && (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-neutral-50 hover:bg-neutral-50">
                      <TableHead className="text-[#6d28d9] font-medium">ID</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Type</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Creator</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Min Amount</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Max Amount</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Available</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Rate</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Currency</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Updated</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id} className="hover:bg-neutral-50">
                        <TableCell>#{offer.id}</TableCell>
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.offer_type === 'BUY'
                              ? 'bg-[#d1fae5] text-[#065f46]'
                              : 'bg-[#ede9fe] text-[#5b21b6]'
                          }`}>
                            {offer.offer_type}
                          </span>
                        </TableCell>
                        <TableCell>
                          {creatorNames[offer.creator_account_id] ||
                           abbreviateWallet(String(offer.creator_account_id))}
                        </TableCell>
                        <TableCell>{offer.min_amount} {offer.token}</TableCell>
                        <TableCell>{offer.max_amount} {offer.token}</TableCell>
                        <TableCell>{offer.total_available_amount} {offer.token}</TableCell>
                        <TableCell>
                          <span className={
                            offer.rate_adjustment > 1
                              ? 'text-[#059669]'
                              : offer.rate_adjustment < 1
                                ? 'text-red-600'
                                : 'text-neutral-600'
                          }>
                            {formatRate(offer.rate_adjustment)}
                          </span>
                          </TableCell>
                          <TableCell>{offer.fiat_currency}</TableCell>
                          <TableCell className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(offer.updated_at))} ago
                        </TableCell>
                        <TableCell>
                          {primaryWallet ? (
                            <Button
                              onClick={() => startTrade(offer.id)}
                              className="bg-[#10b981] hover:bg-[#059669] text-white border-none text-sm px-3 py-1 h-8"
                            >
                              Start Trade
                            </Button>
                          ) : (
                            <Button
                              className="bg-gray-400 hover:bg-gray-500 text-white border-none text-sm px-3 py-1 h-8 cursor-not-allowed"
                            >
                              Connect Wallet to Trade
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default OffersPage;
