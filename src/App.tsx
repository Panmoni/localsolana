import { useState, useEffect } from "react";
import { useDynamicContext, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import OffersPage from "./OffersPage";
import CreateOfferPage from "./CreateOfferPage";
import AccountPage from "./AccountPage";
import { getAccount, setAuthToken } from "./api";
import { Account } from "./api";

function App() {
  const { primaryWallet } = useDynamicContext();
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    if (primaryWallet) {
      const token = getAuthToken();
      if (token) {
        console.log("JWT Token:", token); // Log the token here
        setAuthToken(token);
      } else {
        console.error("No JWT token found after wallet connect!");
      }
      const getUserData = async () => {
        try {
          const response = await getAccount();
          setAccount(response.data);
        } catch (err) {
          console.error("Failed to fetch account:", err);
        }
      };
      getUserData();
    }
  }, [primaryWallet]);

  return (
    <Router>
      <Header isLoggedIn={!!primaryWallet} />
      <main className="min-h-screen bg-gray-50 text-gray-800 flex flex-col items-center pt-20">
        <div className="w-full max-w-6xl px-4 py-6">
          <Routes>
            <Route
              path="/"
              element={
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <h1 className="text-3xl font-bold text-purple-700 mb-6 text-center">LocalSolana</h1>
                  {account && (
                    <p className="text-gray-800">
                      Welcome, <span className="font-medium text-green-600">{account.username}</span>! View your{" "}
                      <a href="/account" className="text-purple-700 hover:text-purple-800">account details</a>.
                    </p>
                  )}
                </div>
              }
            />
            <Route path="/account" element={<AccountPage account={account} setAccount={setAccount} />} />
            <Route path="/offers" element={<OffersPage />} />
            <Route path="/create-offer" element={<CreateOfferPage account={account} />} />
            <Route path="/my-offers" element={<div>My Offers Page (TBD)</div>} />
            <Route path="/trades" element={<div>Trades Page (TBD)</div>} />
            <Route path="/escrows" element={<div>Escrows Page (TBD)</div>} />
          </Routes>
        </div>
      </main>
    </Router>
  );
}

export default App;
