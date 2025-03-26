import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createOffer } from "./api";
import { Account } from "./api"; // Removed unused Offer import
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateOfferPageProps {
  account: Account | null;
}

function CreateOfferPage({ account }: CreateOfferPageProps) {
  const { primaryWallet } = useDynamicContext();
  const [formData, setFormData] = useState({
    creator_account_id: account?.id || "",
    offer_type: "BUY" as "BUY" | "SELL",
    token: "USDC",
    min_amount: "",
    max_amount: "",
    total_available_amount: "",
    rate_adjustment: "1.05",
    terms: "Cash only",
    escrow_deposit_time_limit: "15 minutes",
    fiat_payment_time_limit: "30 minutes",
  });
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      min_amount: Number(formData.min_amount),
      max_amount: Number(formData.max_amount),
      total_available_amount: Number(formData.total_available_amount),
      rate_adjustment: Number(formData.rate_adjustment),
    };
    if (!primaryWallet) {
      alert("Please log in to create an offer");
      return;
    }
    if (data.min_amount <= 0) {
      alert("Min amount must be greater than 0");
      return;
    }
    const response = await createOffer(data); // Use response instead of destructuring
    setSuccess(`Offer created with ID: ${response.data.id}`); // Access id from response.data
    setFormData({
      creator_account_id: account?.id || "",
      offer_type: "BUY",
      token: "USDC",
      min_amount: "",
      max_amount: "",
      total_available_amount: "",
      rate_adjustment: "1.05",
      terms: "Cash only",
      escrow_deposit_time_limit: "15 minutes",
      fiat_payment_time_limit: "30 minutes",
    });
  };

  if (!primaryWallet) {
    return (
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-purple-700">Create an Offer</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please log in to create an offer.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="text-purple-700">Create an Offer</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {success && (
            <Alert>
              <AlertDescription>{success}</AlertDescription>
            </Alert>
          )}
          <div>
            <label
              htmlFor="creator_account_id"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Your Account ID
            </label>
            <Input
              id="creator_account_id"
              type="text"
              value={formData.creator_account_id}
              onChange={(e) => setFormData({ ...formData, creator_account_id: e.target.value })}
              disabled
            />
          </div>
          <div>
            <label
              htmlFor="offer_type"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Offer Type
            </label>
            <Select
              value={formData.offer_type}
              onValueChange={(value) =>
                setFormData({ ...formData, offer_type: value as "BUY" | "SELL" })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select offer type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="BUY">Buy USDC</SelectItem>
                <SelectItem value="SELL">Sell USDC</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label
              htmlFor="min_amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Minimum Amount (USDC)
            </label>
            <Input
              id="min_amount"
              type="number"
              placeholder="Enter min amount in USDC"
              value={formData.min_amount}
              onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="max_amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Maximum Amount (USDC)
            </label>
            <Input
              id="max_amount"
              type="number"
              placeholder="Enter max amount in USDC"
              value={formData.max_amount}
              onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="total_available_amount"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Total Available Amount (USDC)
            </label>
            <Input
              id="total_available_amount"
              type="number"
              placeholder="Enter total available in USDC"
              value={formData.total_available_amount}
              onChange={(e) =>
                setFormData({ ...formData, total_available_amount: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="rate_adjustment"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Rate Adjustment
            </label>
            <Input
              id="rate_adjustment"
              type="number"
              step="0.01"
              value={formData.rate_adjustment}
              onChange={(e) => setFormData({ ...formData, rate_adjustment: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="terms"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Terms
            </label>
            <Input
              id="terms"
              type="text"
              value={formData.terms}
              onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            />
          </div>
          <div>
            <label
              htmlFor="escrow_deposit_time_limit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Escrow Deposit Time Limit
            </label>
            <Input
              id="escrow_deposit_time_limit"
              type="text"
              value={formData.escrow_deposit_time_limit}
              onChange={(e) =>
                setFormData({ ...formData, escrow_deposit_time_limit: e.target.value })
              }
            />
          </div>
          <div>
            <label
              htmlFor="fiat_payment_time_limit"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Fiat Payment Time Limit
            </label>
            <Input
              id="fiat_payment_time_limit"
              type="text"
              value={formData.fiat_payment_time_limit}
              onChange={(e) =>
                setFormData({ ...formData, fiat_payment_time_limit: e.target.value })
              }
            />
          </div>
          <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800">
            Create Offer
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}

export default CreateOfferPage;
