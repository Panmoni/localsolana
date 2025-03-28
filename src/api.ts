import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

const api = axios.create({
  baseURL: API_URL,
  headers: { "Content-Type": "application/json" },
});

// Log requests
api.interceptors.request.use(
  (config) => {
    console.log("API Request:", config.method, config.url);
    return config;
  },
  (error) => {
    console.error("Request Error:", error);
    return Promise.reject(error);
  }
);

// Log responses
api.interceptors.response.use(
  (response) => {
    console.log("API Response:", response.status, response.data);
    return response;
  },
  (error) => {
    console.error("API Error:", error.response?.status, error.message);
    return Promise.reject(error);
  }
);

export const setAuthToken = (token: string) => {
  api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
};

// Define types based on API schema
export interface Account {
  id: number;
  wallet_address: string;
  username: string;
  email: string;
  telegram_username: string | null;
  telegram_id: number | null;
  profile_photo_url: string | null;
  phone_country_code: string | null;
  phone_number: string | null;
  available_from: string | null;
  available_to: string | null;
  timezone: string | null;
  created_at: string;
  updated_at: string;
}

export interface Offer {
  id: number;
  creator_account_id: number;
  offer_type: "BUY" | "SELL";
  token: string;
  min_amount: number;
  max_amount: number;
  total_available_amount: number;
  rate_adjustment: number;
  terms: string;
  escrow_deposit_time_limit: { minutes: number };
  fiat_payment_time_limit: { minutes: number };
  fiat_currency: string;
  created_at: string;
  updated_at: string;
}

export interface Trade {
  id: number;
  leg1_offer_id: number;
  leg2_offer_id: number | null;
  overall_status: "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "DISPUTED";
  from_fiat_currency: string;
  destination_fiat_currency: string;
  from_bank: string | null;
  destination_bank: string | null;
  created_at: string;
  updated_at: string;

  leg1_state: "CREATED" | "AWAITING_FIAT_PAYMENT" | "PENDING_CRYPTO_RELEASE" | "DISPUTED" | "COMPLETED" | "CANCELLED";
  leg1_seller_account_id: number;
  leg1_buyer_account_id: number | null;
  leg1_crypto_token: string;
  leg1_crypto_amount: string;
  leg1_fiat_amount: string | null;
  leg1_fiat_currency: string;
  leg1_escrow_address: string | null;
  leg1_created_at: string;
  leg1_escrow_deposit_deadline: string | null;
  leg1_fiat_payment_deadline: string | null;
  leg1_fiat_paid_at: string | null;
  leg1_released_at: string | null;
  leg1_cancelled_at: string | null;
  leg1_cancelled_by: string | null;
  leg1_dispute_id: number | null;

  leg2_state: string | null;
  leg2_seller_account_id: number | null;
  leg2_buyer_account_id: number | null;
  leg2_crypto_token: string | null;
  leg2_crypto_amount: string | null;
  leg2_fiat_amount: string | null;
  leg2_fiat_currency: string | null;
  leg2_escrow_address: string | null;
  leg2_created_at: string | null;
  leg2_escrow_deposit_deadline: string | null;
  leg2_fiat_payment_deadline: string | null;
  leg2_fiat_paid_at: string | null;
  leg2_released_at: string | null;
  leg2_cancelled_at: string | null;
  leg2_cancelled_by: string | null;
  leg2_dispute_id: number | null;
}

export interface EscrowResponse {
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  programId: string;
  data: string; // Base64-encoded instruction
}

export interface Escrow {
  trade_id: number;
  escrow_address: string;
  seller_address: string;
  buyer_address: string;
  token_type: string;
  amount: string; // API returns this as string
  deposit_timestamp: string | null;
  status: "CREATED" | "FUNDED" | "RELEASED" | "CANCELLED" | "DISPUTED";
  dispute_id: number | null;
  sequential: boolean;
  sequential_escrow_address: string | null;
  created_at: string;
  updated_at: string;
}

export interface PriceData {
  price: string;
  timestamp: number;
}

export interface PricesResponse {
  status: string;
  data: {
    USDC: {
      USD: PriceData;
      COP: PriceData;
      EUR: PriceData;
      NGN: PriceData;
      VES: PriceData;
    };
  };
}

export interface Dispute {
  id: number;
  trade_id: number;
  escrow_address: string;
  initiator_address: string;
  initiator_evidence_hash: string | null;
  responder_address: string | null;
  responder_evidence_hash: string | null;
  resolution_hash: string | null;
  bond_amount: string;
  status: "OPENED" | "RESPONDED" | "RESOLVED" | "DEFAULTED";
  initiated_at: string;
  responded_at: string | null;
  resolved_at: string | null;
  winner_address: string | null;
}

// Accounts API
export const createAccount = (data: Partial<Account>) =>
  api.post<{ id: number }>("/accounts", data);

export const getAccountById = (id: number) =>
  api.get<Account>(`/accounts/${id}`);

export const getAccount = () =>
  api.get<Account>("/accounts/me");

export const updateAccount = (id: number, data: Partial<Account>) =>
  api.put<{ id: number }>(`/accounts/${id}`, data);

// Offers API
export const createOffer = (data: Partial<Offer>) =>
  api.post<{ id: number }>("/offers", data);

export const getOffers = (params?: { type?: string; token?: string }) =>
  api.get<Offer[]>("/offers", { params });

export const getOfferById = (id: number) =>
  api.get<Offer>(`/offers/${id}`);

export const updateOffer = (id: number, data: Partial<Offer>) =>
  api.put<{ id: number }>(`/offers/${id}`, data);

export const deleteOffer = (id: number) =>
  api.delete<{ message: string }>(`/offers/${id}`);

// Trades API
export const createTrade = (data: Partial<Trade>) =>
  api.post<{ id: number }>("/trades", data);

export const getTrades = (params?: { status?: string; user?: string }) =>
  api.get<Trade[]>("/trades", { params });

export const getMyTrades = () =>
  api.get<Trade[]>("/my/trades");

export const getTradeById = (id: number) =>
  api.get<Trade>(`/trades/${id}`);

export const updateTrade = (id: number, data: Partial<Trade>) =>
  api.put<{ id: number }>(`/trades/${id}`, data);

export const markFiatPaid = (id: number) =>
  api.put<{ id: number }>(`/trades/${id}`, { fiat_paid: true });

// Escrows API
export const createEscrow = (data: {
  trade_id: number;
  escrow_id: number;
  seller: string;
  buyer: string;
  amount: number;
  sequential?: boolean;
  sequential_escrow_address?: string;
}) => api.post<EscrowResponse>("/escrows/create", data);

export const fundEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  seller: string;
  seller_token_account: string;
  token_mint: string;
  amount: number;
}) => api.post<EscrowResponse>("/escrows/fund", data);

export const getEscrow = (tradeId: number) =>
  api.get<Escrow>(`/escrows/${tradeId}`);

export const getMyEscrows = () =>
  api.get<Escrow[]>("/my/escrows");

export const releaseEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  authority: string;
  buyer_token_account: string;
  arbitrator_token_account: string;
  sequential_escrow_token_account?: string;
}) => api.post<EscrowResponse>("/escrows/release", data);

export const cancelEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  seller: string;
  authority: string;
  seller_token_account?: string;
}) => api.post<EscrowResponse>("/escrows/cancel", data);

export const disputeEscrow = (data: {
  escrow_id: number;
  trade_id: number;
  disputing_party: string;
  disputing_party_token_account: string;
  evidence_hash?: string;
}) => api.post<EscrowResponse>("/escrows/dispute", data);

// Add this function to handle marking trades as paid
export const markTradeFiatPaid = (tradeId: number) => {
  return api.post<{ message: string }>(`/escrows/mark-fiat-paid`, {
    trade_id: tradeId
  });
};

export const getPrices = () =>
  api.get<PricesResponse>("/prices");

export default api;
