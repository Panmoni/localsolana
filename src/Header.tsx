import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useDynamicContext, DynamicWidget, getAuthToken } from "@dynamic-labs/sdk-react-core";
import { Account } from "./api";
import { setAuthToken } from "./api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  isLoggedIn: boolean;
  account: Account | null;
}

function Header({ isLoggedIn, account }: HeaderProps) {
  const { setShowAuthFlow } = useDynamicContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) setAuthToken(token);
  }, []);

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center py-4">
        <Link to="/" className="text-2xl text-purple-700 flex items-center gap-2">
          <img src="/logo.png" alt="LocalSolana Logo" className="h-8 w-auto" />
          <h1 className="font-black">LocalSolana</h1>
        </Link>
        {/* <nav className="flex gap-6">
          <Link to="/" className="text-purple-700 hover:text-purple-800 font-medium transition">
            Home
          </Link>
          <Link to="/offers" className="text-purple-700 hover:text-purple-800 font-medium transition">
            Offers
          </Link>
        </nav> */}
        <div className="flex items-center gap-4">
          {isLoggedIn ? (
            <>
              <DynamicWidget />
              <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
                <DropdownMenuTrigger className="focus:outline-none">
                  <Avatar className="cursor-pointer hover:ring-2 hover:ring-purple-700 transition">
                    <AvatarImage src={account?.profile_photo_url || "/icon96.png"} />
                    <AvatarFallback>{account?.username?.charAt(0) || "U"}</AvatarFallback>
                  </Avatar>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-white shadow-md">
                  <DropdownMenuItem asChild>
                    <Link to="/account" className="w-full text-gray-800 hover:text-purple-700">
                      My Account
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/my-offers" className="w-full text-gray-800 hover:text-purple-700">
                      My Offers
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/trades" className="w-full text-gray-800 hover:text-purple-700">
                      My Trades
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/escrows" className="w-full text-gray-800 hover:text-purple-700">
                      My Escrows
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <Button
              onClick={() => setShowAuthFlow(true)}
              className="bg-purple-700 hover:bg-purple-800 text-white"
            >
              Connect Wallet
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}

export default Header;
