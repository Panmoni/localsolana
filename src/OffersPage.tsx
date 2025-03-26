import { useState, useEffect } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { Transaction } from "@solana/web3.js";
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
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    const fetchOffers = async () => {
      console.log("[OffersPage] Fetching offers...");
      setLoading(true);
      try {
        const response = await getOffers();

        console.log("[OffersPage] Offers loaded:", response.data);
        setOffers(response.data);

        // Fetch creator usernames/wallet addresses
        const uniqueCreatorIds = [...new Set(response.data.map((o: Offer) => o.creator_account_id))];
        const namePromises = uniqueCreatorIds.map(async (id: string) => {
          const accountResponse = await getAccountById(id);
          const account = accountResponse.data;
          return { id, username: account.username || account.wallet_address };
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

  const startTrade = async (offerId: string) => {
    try {
      const tradeData = {
        leg1_offer_id: offerId,
        leg1_crypto_amount: 1000000,
        from_fiat_currency: "USD",
        destination_fiat_currency: "USD",
      };
      const tradeResponse = await createTrade(tradeData);
      const tradeId = tradeResponse.data.id;
      console.log("[OffersPage] Trade started:", tradeId);
      if (primaryWallet) {
        const seller = primaryWallet.address;
        const buyer = offers.find((o) => o.id === offerId)?.creator_account_id || seller;
        const escrowData = {
          trade_id: tradeId,
          escrow_id: Math.floor(Math.random() * 1000000),
          seller,
          buyer,
          amount: 1000000,
        };
        const escrowResponse = await createEscrow(escrowData);
        const tx = Transaction.from(Buffer.from(escrowResponse.data, "base64")); // TS2769 fixed: data.data is string
        console.log("[OffersPage] Escrow TX placeholder:", tx);
        alert(`Trade ${tradeId} started, check console for TX`);
      } else {
        alert(`Trade ${tradeId} started, no wallet connected`);
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

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="text-purple-700">Offers</CardTitle>
      </CardHeader>
      <CardContent>
        {primaryWallet && (
          <Button className="mb-4 bg-purple-700 hover:bg-purple-800 text-white">
            <Link to="/create-offer">Create New Offer</Link>
          </Button>
        )}
        {loading && <p className="text-gray-600">Loading offers...</p>}
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        {!loading && !error && offers.length === 0 ? (
          <p className="text-gray-600">No offers available.</p>
        ) : (
          !loading && (
            <Table className="w-full">
              <TableHeader>
                <TableRow>
                  <TableHead className="text-purple-700 px-6">Type</TableHead>
                  <TableHead className="text-purple-700 px-6">Creator</TableHead>
                  <TableHead className="text-purple-700 px-6">Min Amount</TableHead>
                  <TableHead className="text-purple-700 px-6">Max Amount</TableHead>
                  <TableHead className="text-purple-700 px-6">Total Available</TableHead>
                  <TableHead className="text-purple-700 px-6">Rate</TableHead>
                  <TableHead className="text-purple-700 px-6">Last Updated</TableHead>
                  <TableHead className="text-purple-700 px-6">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {offers.map((offer) => (
                  <TableRow key={offer.id}>
                    <TableCell className="px-6">{offer.offer_type}</TableCell>
                    <TableCell className="px-6">{creatorNames[offer.creator_account_id] || abbreviateWallet(offer.creator_account_id)}</TableCell>
                    <TableCell className="px-6">{offer.min_amount} {offer.token}</TableCell>
                    <TableCell className="px-6">{offer.max_amount} {offer.token}</TableCell>
                    <TableCell className="px-6">{offer.total_available_amount} {offer.token}</TableCell>
                    <TableCell className="px-6">{formatRate(offer.rate_adjustment)}</TableCell>
                    <TableCell className="px-6">{formatDistanceToNow(new Date(offer.updated_at || Date.now()))} ago</TableCell>
                    <TableCell className="px-6">
                      <Button
                        onClick={() => startTrade(offer.id)}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        Start Trade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )
        )}
      </CardContent>
    </Card>
  );
}

export default OffersPage;
