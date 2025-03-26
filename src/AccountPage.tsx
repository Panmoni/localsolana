import { useDynamicContext } from "@dynamic-labs/sdk-react-core"; // Add this import
import { Account } from "./api";
import CreateAccountForm from "./CreateAccountForm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountPageProps {
  account: Account | null;
  setAccount: (account: Account | null) => void;
}

function AccountPage({ account, setAccount }: AccountPageProps) {
  const { primaryWallet } = useDynamicContext(); // Now defined

  if (!primaryWallet) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-purple-700">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>Please log in to view or create your account.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-purple-700">Account</CardTitle>
      </CardHeader>
      <CardContent>
        {account ? (
          <div className="space-y-2 text-gray-800">
            <p><span className="font-medium text-green-600">Wallet:</span> {account.wallet_address}</p>
            <p><span className="font-medium text-green-600">Username:</span> {account.username}</p>
            <p><span className="font-medium text-green-600">Email:</span> {account.email}</p>
          </div>
        ) : (
          <CreateAccountForm setAccount={setAccount} />
        )}
      </CardContent>
    </Card>
  );
}

export default AccountPage;
