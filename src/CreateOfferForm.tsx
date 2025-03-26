import { useState } from "react";
import { createOffer, Offer, Account } from "./api";

interface CreateOfferFormProps {
  account: Account | null;
  setOffers: (offers: Offer[]) => void;
  offers: Offer[];
}

function CreateOfferForm({ account, setOffers, offers }: CreateOfferFormProps) {
  const [formData, setFormData] = useState({
    creator_account_id: account?.id || "",
    offer_type: "BUY" as "BUY" | "SELL", // Explicit union type
    token: "USDC", // Added to match Offer interface
    min_amount: "",
    max_amount: "",
    total_available_amount: "",
    rate_adjustment: "1.05",
    terms: "Cash only",
    escrow_deposit_time_limit: "15 minutes",
    fiat_payment_time_limit: "30 minutes",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = {
      ...formData,
      min_amount: Number(formData.min_amount),
      max_amount: Number(formData.max_amount),
      total_available_amount: Number(formData.total_available_amount),
      rate_adjustment: Number(formData.rate_adjustment),
    };
    if (!data.creator_account_id) {
      alert("Please connect wallet and create an account first");
      return;
    }
    if (data.min_amount <= 0) {
      alert("Min amount must be greater than 0");
      return;
    }
    const response = await createOffer(data);
    const newOffer: Offer = { // Construct full Offer object
      id: response.data.id,
      creator_account_id: data.creator_account_id,
      offer_type: data.offer_type,
      token: data.token,
      min_amount: data.min_amount,
      max_amount: data.max_amount,
      total_available_amount: data.total_available_amount,
      rate_adjustment: data.rate_adjustment,
      terms: data.terms,
      escrow_deposit_time_limit: data.escrow_deposit_time_limit,
      fiat_payment_time_limit: data.fiat_payment_time_limit,
    };
    setOffers([...offers, newOffer]);
    setFormData({
      creator_account_id: account?.id || "",
      offer_type: "BUY" as "BUY" | "SELL", // Explicit union type
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

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold text-purple-700 mb-6">Create an Offer</h2>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="creator_account_id" className="block text-sm font-medium text-gray-700 mb-1">
            Your Account ID
          </label>
          <input
            id="creator_account_id"
            type="text"
            value={formData.creator_account_id}
            onChange={(e) => setFormData({ ...formData, creator_account_id: e.target.value })}
            className="border border-gray-300 bg-gray-100 text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600 disabled:opacity-50"
            disabled
          />
          {!formData.creator_account_id && (
            <p className="text-sm text-purple-600 mt-1">Connect your wallet to auto-fill this field</p>
          )}
        </div>
        <div>
          <label htmlFor="offer_type" className="block text-sm font-medium text-gray-700 mb-1">
            Offer Type
          </label>
          <select
            id="offer_type"
            value={formData.offer_type}
            onChange={(e) => setFormData({ ...formData, offer_type: e.target.value as "BUY" | "SELL" })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          >
            <option value="BUY">Buy USDC</option>
            <option value="SELL">Sell USDC</option>
          </select>
        </div>
        <div>
          <label htmlFor="min_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Minimum Amount (USDC)
          </label>
          <input
            id="min_amount"
            type="number"
            placeholder="Enter min amount in USDC"
            value={formData.min_amount}
            onChange={(e) => setFormData({ ...formData, min_amount: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="max_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Maximum Amount (USDC)
          </label>
          <input
            id="max_amount"
            type="number"
            placeholder="Enter max amount in USDC"
            value={formData.max_amount}
            onChange={(e) => setFormData({ ...formData, max_amount: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="total_available_amount" className="block text-sm font-medium text-gray-700 mb-1">
            Total Available Amount (USDC)
          </label>
          <input
            id="total_available_amount"
            type="number"
            placeholder="Enter total available in USDC"
            value={formData.total_available_amount}
            onChange={(e) => setFormData({ ...formData, total_available_amount: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="rate_adjustment" className="block text-sm font-medium text-gray-700 mb-1">
            Rate Adjustment
          </label>
          <input
            id="rate_adjustment"
            type="number"
            step="0.01"
            value={formData.rate_adjustment}
            onChange={(e) => setFormData({ ...formData, rate_adjustment: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="terms" className="block text-sm font-medium text-gray-700 mb-1">
            Terms
          </label>
          <input
            id="terms"
            type="text"
            value={formData.terms}
            onChange={(e) => setFormData({ ...formData, terms: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="escrow_deposit_time_limit" className="block text-sm font-medium text-gray-700 mb-1">
            Escrow Deposit Time Limit
          </label>
          <input
            id="escrow_deposit_time_limit"
            type="text"
            value={formData.escrow_deposit_time_limit}
            onChange={(e) => setFormData({ ...formData, escrow_deposit_time_limit: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <div>
          <label htmlFor="fiat_payment_time_limit" className="block text-sm font-medium text-gray-700 mb-1">
            Fiat Payment Time Limit
          </label>
          <input
            id="fiat_payment_time_limit"
            type="text"
            value={formData.fiat_payment_time_limit}
            onChange={(e) => setFormData({ ...formData, fiat_payment_time_limit: e.target.value })}
            className="border border-gray-300 bg-white text-gray-800 p-3 rounded w-full focus:outline-none focus:ring-2 focus:ring-green-600"
          />
        </div>
        <button
          type="submit"
          className="bg-purple-700 hover:bg-purple-800 text-white font-medium py-3 px-4 rounded-lg w-full transition"
        >
          Create Offer
        </button>
      </form>
    </div>
  );
}

export default CreateOfferForm;
