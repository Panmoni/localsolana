import { useEffect } from 'react';
import { useDynamicContext, DynamicWidget, getAuthToken } from '@dynamic-labs/sdk-react-core';

function Header() {
  const { primaryWallet, setShowAuthFlow } = useDynamicContext();

  useEffect(() => {
    const token = getAuthToken();
    console.log('JWT from getAuthToken:', token); // Keep dumping JWT to console
  }, [primaryWallet]); // Update on wallet change

  const handleConnectWallet = () => {
    setShowAuthFlow(true); // Trigger auth flow when button clicked
  };

  return (
    <header className="app-header">
      <div className="header-left">
        <h1>LocalSolana</h1>
      </div>
      <div className="header-right">
        {primaryWallet?.isConnected ? (
          <DynamicWidget />
        ) : (
          <button onClick={handleConnectWallet}>Connect Wallet</button>
        )}
      </div>
    </header>
  );
}

export default Header;