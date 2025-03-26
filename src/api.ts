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
  telegram_id: string | null;
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
  id: string;
  creator_account_id: string;
  offer_type: "BUY" | "SELL";
  token: string;
  min_amount: number;
  max_amount: number;
  total_available_amount: number;
  rate_adjustment: number;
  terms?: string;
  escrow_deposit_time_limit?: string;
  fiat_payment_time_limit?: string;
  updated_at: string;
}

export interface Trade {
  id: string;
  leg1_offer_id: string;
  leg2_offer_id?: string | null;
  overall_status: string;
  from_fiat_currency: string;
  destination_fiat_currency: string;
  from_bank?: string | null;
  destination_bank?: string | null;
  leg1_state?: string;
  leg1_seller_account_id?: string;
  leg1_buyer_account_id?: string;
  leg1_crypto_token?: string;
  leg1_crypto_amount: number;
  leg1_fiat_currency?: string;
  leg1_escrow_address?: string | null;
}

export interface EscrowResponse {
  keys: { pubkey: string; isSigner: boolean; isWritable: boolean }[];
  programId: string;
  data: string; // Base64-encoded instruction
}

export interface Escrow {
  trade_id: string;
  escrow_address: string;
  seller_address: string;
  buyer_address: string;
  token_type: string;
  amount: number;
  status: string;
  sequential: boolean;
}

export interface ApiResponse<T> {
  data: {
    data: T;
  };
}

// Accounts
export const createAccount = (data: Partial<Account>) => api.post<{ data: { id: string } }>("/accounts", data);

export const getAccountById = (id: string) => api.get<Account>(`/accounts/${id}`);

export const updateAccount = (id: string, data: Partial<Account>) => api.put<{ data: { id: string } }>(`/accounts/${id}`, data);
export const getAccount = () => api.get<{ data: Account }>("/accounts/me");

// Offers
export const createOffer = (data: Partial<Offer>) => api.post<{ data: { id: string } }>("/offers", data);

export const getOffers = (params?: { type?: string; token?: string }) => api.get<Offer[]>("/offers", { params });

export const getOfferById = (id: string) => api.get<{ data: Offer }>(`/offers/${id}`);
export const updateOffer = (id: string, data: Partial<Offer>) => api.put<{ data: { id: string } }>(`/offers/${id}`, data);
export const deleteOffer = (id: string) => api.delete<{ data: { message: string } }>(`/offers/${id}`);

// Trades
export const createTrade = (data: Partial<Trade>) => api.post<Trade>("/trades", data);

export const getTrades = (params?: { status?: string; user?: string }) => api.get<{ data: Trade[] }>("/trades", { params });
export const getMyTrades = () => api.get<{ data: Trade[] }>("/my/trades");
export const getTradeById = (id: string) => api.get<{ data: Trade }>(`/trades/${id}`);
export const updateTrade = (id: string, data: Partial<Trade>) => api.put<{ data: { id: string } }>(`/trades/${id}`, data);

// Escrows
export const createEscrow = (data: {
  trade_id: string;
  escrow_id: number;
  seller: string;
  buyer: string;
  amount: number;
  sequential?: boolean;
  sequential_escrow_address?: string;
}) => api.post<{ data: EscrowResponse }>("/escrows/create", data);
export const fundEscrow = (data: {
  escrow_id: number;
  trade_id: string;
  seller: string;
  seller_token_account: string;
  token_mint: string;
  amount: number;
}) => api.post<{ data: EscrowResponse }>("/escrows/fund", data);
export const getEscrow = (tradeId: string) => api.get<{ data: Escrow }>(`/escrows/${tradeId}`);
export const getMyEscrows = () => api.get<{ data: Escrow[] }>("/my/escrows");
export const releaseEscrow = (data: {
  escrow_id: number;
  trade_id: string;
  authority: string;
  buyer_token_account: string;
  arbitrator_token_account: string;
  sequential_escrow_token_account?: string;
}) => api.post<{ data: EscrowResponse }>("/escrows/release", data);
export const cancelEscrow = (data: {
  escrow_id: number;
  trade_id: string;
  seller: string;
  authority: string;
  seller_token_account?: string;
}) => api.post<{ data: EscrowResponse }>("/escrows/cancel", data);
export const disputeEscrow = (data: {
  escrow_id: number;
  trade_id: string;
  disputing_party: string;
  disputing_party_token_account: string;
  evidence_hash?: string;
}) => api.post<{ data: EscrowResponse }>("/escrows/dispute", data);

export default api;
