import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Link } from "react-router-dom";
import {
  getOffers,
  createTrade,
  createEscrow,
  Offer,
  getAccountById
} from "./api";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDistanceToNow } from "date-fns";

function OffersPage() {
  const { primaryWallet } = useDynamicContext();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [creatorNames, setCreatorNames] = useState<Record<number, string>>({});

  useEffect(() => {
    const fetchOffers = async () => {
      setLoading(true);
      try {
        const response = await getOffers();
        setOffers(response.data);

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

  const formatRate = (rateStr: string) => {
    const rate = parseFloat(rateStr);
    if (rate > 1) return `+${((rate - 1) * 100).toFixed(1)}%`;
    if (rate < 1) return `-${((1 - rate) * 100).toFixed(1)}%`;
    return "0%";
  };

  return (
    <div className="w-full max-w-6xl mx-auto">
      <Card className="border border-neutral-100 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1),_0_2px_4px_-1px_rgba(0,0,0,0.06)]">
        <CardHeader className="border-b border-neutral-100 bg-white">
          <CardTitle className="text-[#5b21b6] font-semibold">Available Offers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="p-4 md:p-5 bg-white border-b border-neutral-100">
            {primaryWallet && (
              <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white border-none">
                <Link to="/create-offer" className="text-white hover:text-white">
                  Create New Offer
                </Link>
              </Button>
            )}
          </div>

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
                      <TableHead className="text-[#6d28d9] font-medium">Type</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Creator</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Min Amount</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Max Amount</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Available</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Rate</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Updated</TableHead>
                      <TableHead className="text-[#6d28d9] font-medium">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {offers.map((offer) => (
                      <TableRow key={offer.id} className="hover:bg-neutral-50">
                        <TableCell>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            offer.offer_type === 'BUY'
                              ? 'bg-[#d1fae5] text-[#065f46]'
                              : 'bg-[#ede9fe] text-[#5b21b6]'
                          }`}>
                            {offer.offer_type}
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">
                          {creatorNames[offer.creator_account_id] ||
                           abbreviateWallet(String(offer.creator_account_id))}
                        </TableCell>
                        <TableCell>{offer.min_amount} {offer.token}</TableCell>
                        <TableCell>{offer.max_amount} {offer.token}</TableCell>
                        <TableCell>{offer.total_available_amount} {offer.token}</TableCell>
                        <TableCell>
                          <span className={
                            parseFloat(offer.rate_adjustment) > 1
                              ? 'text-[#059669]'
                              : parseFloat(offer.rate_adjustment) < 1
                                ? 'text-red-600'
                                : 'text-neutral-600'
                          }>
                            {formatRate(offer.rate_adjustment)}
                          </span>
                        </TableCell>
                        <TableCell className="text-neutral-500 text-sm">
                          {formatDistanceToNow(new Date(offer.updated_at))} ago
                        </TableCell>
                        <TableCell>
                          <Button
                            onClick={() => startTrade(offer.id)}
                            className="bg-[#10b981] hover:bg-[#059669] text-white border-none text-sm px-3 py-1 h-8"
                          >
                            Start Trade
                          </Button>
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
