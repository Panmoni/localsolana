import { useState, useEffect } from "react";
import { useDynamicContext, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Header from "./Header";
import Footer from './Footer';
import OffersPage from "./OffersPage";
import CreateOfferPage from "./CreateOfferPage";
import AccountPage from "./AccountPage";
import { getAccount, setAuthToken } from "./api";
import { Account } from "./api";

import MyOffersPage from "./MyOffersPage";
import MyTradesPage from "./MyTradesPage";
import MyEscrowsPage from "./MyEscrowsPage";

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
      <div className="app">
        <Header isLoggedIn={!!primaryWallet} account={account} />
          <main className="main-content">
            <div className="w-full max-w-6xl px-4 py-6">
              <Routes>
                <Route path="/account" element={<AccountPage account={account} setAccount={setAccount} />} />
                <Route path="/" element={<OffersPage />} />
                <Route path="/create-offer" element={<CreateOfferPage account={account} />} />
                <Route path="/offers" element={<MyOffersPage account={account} /> } />
                <Route path="/trades" element={<MyTradesPage account={account} /> } />
                <Route path="/escrows" element={<MyEscrowsPage account={account} />} />
              </Routes>
            </div>
        </main>
      <Footer />
      </div>
    </Router>
  );
}

export default App;
