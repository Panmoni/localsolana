import { useState } from "react";
import { useDynamicContext } from "@dynamic-labs/sdk-react-core";
import { createAccount, Account } from "./api";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateAccountFormProps {
  setAccount?: (account: Account | null) => void;
}

function CreateAccountForm({ setAccount }: CreateAccountFormProps) {
  const { primaryWallet } = useDynamicContext();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!primaryWallet?.address) {
      setError("Wallet not connected.");
      return;
    }
    try {
      const response = await createAccount({
        wallet_address: primaryWallet.address,
        username,
        email,
      });
      const accountId = response.data.id; // Extract id from response
      setSuccess(`Account created with ID: ${accountId}`);
      setUsername("");
      setEmail("");
      setError("");
      if (setAccount) {
        setAccount({
          id: accountId,
          wallet_address: primaryWallet.address,
          username,
          email,
        });
      }
    } catch (err) {
      setError(`Failed to create account: ${(err as Error).message}`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && <Alert variant="destructive"><AlertDescription>{error}</AlertDescription></Alert>}
      {success && <Alert><AlertDescription>{success}</AlertDescription></Alert>}
      <div>
        <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">Username</label>
        <Input id="username" type="text" value={username} onChange={(e) => setUsername(e.target.value)} required />
      </div>
      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email</label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>
      <Button type="submit" className="w-full bg-purple-700 hover:bg-purple-800">Create Account</Button>
    </form>
  );
}

export default CreateAccountForm;
