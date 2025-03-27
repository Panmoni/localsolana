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
import { Badge } from "@/components/ui/badge";
import Container from "./components/Container";

interface HeaderProps {
  isLoggedIn: boolean;
  account: Account | null;
}

function Header({ isLoggedIn, account }: HeaderProps) {
  const { setShowAuthFlow } = useDynamicContext();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = getAuthToken();
    if (token) setAuthToken(token);
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-10 bg-[#FAF9F6] shadow-md">
      <Container>
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="text-xl sm:text-2xl text-purple-700 flex items-center gap-2">
            <img
              src="/logo.png"
              alt="LocalSolana Logo"
              className="h-4 sm:h-6 md:h-10 lg:h-12 w-auto max-h-12"
              loading="lazy"
            />
            <h1 className="font-black">LocalSolana</h1>
            <Badge
              variant="secondary"
              className="bg-purple-100 text-purple-700 text-[10px] uppercase font-semibold hidden sm:inline-flex"
            >
              Devnet
            </Badge>
          </Link>

          {/* Mobile menu button */}
          <button
            className="md:hidden flex items-center p-2 rounded-md text-gray-700 hover:bg-gray-100 focus:outline-none"
            onClick={toggleMobileMenu}
            aria-label="Toggle mobile menu"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center gap-4">
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
                  <DropdownMenuContent align="end" className="w-48 bg-[#FAF9F6] shadow-md">
                    <DropdownMenuItem asChild>
                      <Link to="/account" className="w-full text-gray-800 hover:text-purple-700">
                        My Account
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/offers" className="w-full text-gray-800 hover:text-purple-700">
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
      </Container>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-200 shadow-md">
          <div className="px-4 py-3 space-y-3">
            {isLoggedIn ? (
              <>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/account"
                    className="block w-full py-2 text-gray-800 hover:text-purple-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Account
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/offers"
                    className="block w-full py-2 text-gray-800 hover:text-purple-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Offers
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/trades"
                    className="block w-full py-2 text-gray-800 hover:text-purple-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Trades
                  </Link>
                </div>
                <div className="flex items-center justify-between py-2">
                  <Link
                    to="/escrows"
                    className="block w-full py-2 text-gray-800 hover:text-purple-700"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    My Escrows
                  </Link>
                </div>
                <div className="pt-2">
                  <DynamicWidget />
                </div>
              </>
            ) : (
              <Button
                onClick={() => {
                  setShowAuthFlow(true);
                  setMobileMenuOpen(false);
                }}
                className="bg-purple-700 hover:bg-purple-800 text-white w-full"
              >
                Connect Wallet
              </Button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

export default Header;
