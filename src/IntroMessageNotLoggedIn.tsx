import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

const IntroMessageNotLoggedIn = () => {
  return (
    <Card className="mb-6 border-[#6d28d9] border-2">
      <CardContent className="px-4 py-2">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="bg-[#ede9fe] p-4 rounded-full">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6d28d9"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 12V8H6a2 2 0 0 1-2-2c0-1.1.9-2 2-2h12v4" />
              <path d="M4 6v12c0 1.1.9 2 2 2h14v-4" />
              <path d="M18 12a2 2 0 0 0-2 2c0 1.1.9 2 2 2h4v-4h-4z" />
            </svg>
          </div>
          <div className="flex-1 text-center md:text-left">
            <h2 className="text-2xl font-bold text-[#5b21b6] mb-2">
              Welcome to LocalSolana P2P Trading
            </h2>
            <p className="text-neutral-600 mb-4">
              Connect your wallet to start trading USDC directly with other
              users. Buy and sell using your preferred payment methods with
              our on-chain escrow system.
            </p>
            <Button className="bg-[#6d28d9] hover:bg-[#5b21b6] text-white">
              Connect Wallet to Get Started
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default IntroMessageNotLoggedIn;
