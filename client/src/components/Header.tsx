import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "./ThemeProvider";
import { Gift, Moon, Sun, Menu, X, Heart } from "lucide-react";
import { useState } from "react";

interface HeaderProps {
  donationUrl?: string;
}

export function Header({ donationUrl }: HeaderProps) {
  const { theme, toggleTheme } = useTheme();
  const [location] = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleDonate = () => {
    if (donationUrl) {
      window.open(donationUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link href="/" className="flex items-center gap-2 hover-elevate rounded-lg px-2 py-1">
          <Gift className="w-8 h-8 text-primary" />
          <span className="text-xl font-bold bg-gradient-to-r from-primary to-chart-5 bg-clip-text text-transparent">
            GiftStorm
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          <Link href="/">
            <Button
              variant={location === "/" ? "secondary" : "ghost"}
              data-testid="nav-home"
            >
              Home
            </Button>
          </Link>
          <Link href="/play">
            <Button
              variant={location === "/play" ? "secondary" : "ghost"}
              data-testid="nav-play"
            >
              Play Game
            </Button>
          </Link>
        </nav>

        <div className="flex items-center gap-2">
          <Button
            size="icon"
            variant="ghost"
            onClick={toggleTheme}
            data-testid="button-theme-toggle"
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {donationUrl && (
            <Button
              onClick={handleDonate}
              className="hidden sm:flex gap-2"
              data-testid="button-donate-header"
            >
              <Heart className="w-4 h-4" />
              Donate
            </Button>
          )}

          <Button
            size="icon"
            variant="ghost"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="md:hidden border-t border-border bg-background/95 backdrop-blur-md">
          <nav className="flex flex-col p-4 gap-2">
            <Link href="/" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={location === "/" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                Home
              </Button>
            </Link>
            <Link href="/play" onClick={() => setMobileMenuOpen(false)}>
              <Button
                variant={location === "/play" ? "secondary" : "ghost"}
                className="w-full justify-start"
              >
                Play Game
              </Button>
            </Link>
            {donationUrl && (
              <Button onClick={handleDonate} className="gap-2">
                <Heart className="w-4 h-4" />
                Donate Now
              </Button>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
