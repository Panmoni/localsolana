import React, { useState } from 'react';
import { useDynamicContext, getAuthToken } from '@dynamic-labs/sdk-react-core';

function CreateAccountForm() {
  const { primaryWallet } = useDynamicContext();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryWallet?.address) {
      setError('Please connect your wallet first.');
      return;
    }
    const token = getAuthToken();
    if (!token) {
      setError('Authentication token not found. Please authenticate.');
      return;
    }
    try {
      const response = await fetch('http://localhost:3000/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          wallet_address: primaryWallet.address,
          username,
          email,
        }),
      });
      if (response.ok) {
        const data = await response.json();
        console.log('Account created:', data);
        setSuccess(`Account created with ID: ${data.id}`);
        setUsername('');
        setEmail('');
        setError('');
      } else {
        const errorText = await response.text();
        setError(`Failed to create account: ${errorText}`);
      }
    } catch (err) {
      setError(`Network error: ${(err as Error).message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="create-account-form">
      <h2>Create Account</h2>
      {error && <p className="error">{error}</p>}
      {success && <p className="success">{success}</p>}
      <div className="form-group">
        <label>Username:</label>
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
      </div>
      <div className="form-group">
        <label>Email:</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <button type="submit">Create Account</button>
    </form>
  );
}

export default CreateAccountForm;