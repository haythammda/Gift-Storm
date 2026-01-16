import { Link } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Header } from "@/components/Header";
import { DonationProgress } from "@/components/DonationProgress";
import { Leaderboard } from "@/components/Leaderboard";
import { Play, Gift, Heart, Users, Sparkles, Shield, Info } from "lucide-react";
import heroImage from "@assets/generated_images/winter_cityscape_hero_background.png";
import type { GameStatus, Score } from "@shared/schema";

export default function Landing() {
  const { data: status, isLoading: statusLoading } = useQuery<GameStatus>({
    queryKey: ["/api/status"],
  });

  const { data: scores, isLoading: scoresLoading } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
  });

  return (
    <div className="min-h-screen bg-background">
      <Header donationUrl={status?.donationUrl} />

      <section className="relative min-h-[70vh] md:min-h-[85vh] flex items-center justify-center overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${heroImage})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
        
        <div className="relative z-10 max-w-4xl mx-auto px-4 text-center text-white py-12">
          <div className="flex items-center justify-center gap-3 mb-6">
            <Gift className="w-12 h-12 md:w-16 md:h-16 text-chart-5" />
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold">
              GiftStorm
            </h1>
          </div>
          
          <p className="text-lg md:text-xl lg:text-2xl mb-2 text-white/90">
            Winter Campaign Edition
          </p>
          
          <p className="text-base md:text-lg max-w-2xl mx-auto mb-8 text-white/80">
            Help spread warmth and joy to children in need this winter. 
            Play, compete with others, and contribute to our community donation goal!
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/play">
              <Button
                size="lg"
                className="text-lg px-8 py-6 gap-3 bg-primary hover:bg-primary/90 shadow-lg"
                data-testid="button-play-hero"
              >
                <Play className="w-6 h-6" />
                Play Now
              </Button>
            </Link>
            {status?.donationUrl && (
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 py-6 gap-3 bg-white/10 backdrop-blur-md border-white/30 text-white hover:bg-white/20"
                onClick={() => window.open(status.donationUrl, "_blank", "noopener,noreferrer")}
                data-testid="button-donate-hero"
              >
                <Heart className="w-6 h-6" />
                Donate
              </Button>
            )}
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <DonationProgress status={status} isLoading={statusLoading} />
        </div>
      </section>

      <section className="py-12 md:py-16">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold mb-3">How It Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              A fun game with a meaningful purpose. Every play helps raise awareness for our winter campaign.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                  <Gift className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold">Throw Gifts</h3>
                <p className="text-muted-foreground">
                  Your character automatically throws gifts to help children running towards you. 
                  Each gift delivered earns points!
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mx-auto">
                  <Sparkles className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-bold">Level Up</h3>
                <p className="text-muted-foreground">
                  Earn XP from helping children. Level up to unlock powerful upgrades 
                  that help you reach more children!
                </p>
              </CardContent>
            </Card>

            <Card className="text-center p-6">
              <CardContent className="pt-6 space-y-4">
                <div className="w-16 h-16 rounded-full bg-accent/10 flex items-center justify-center mx-auto">
                  <Users className="w-8 h-8 text-accent" />
                </div>
                <h3 className="text-xl font-bold">Community Impact</h3>
                <p className="text-muted-foreground">
                  Real donations from our community unlock global cosmetic rewards for all players. 
                  Together we make a difference!
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 bg-card">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Leaderboard scores={scores} isLoading={scoresLoading} limit={5} />

            <Card>
              <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-3">
                  <Shield className="w-6 h-6 text-accent" />
                  <h3 className="text-xl font-bold">About This Campaign</h3>
                </div>
                
                <div className="space-y-4 text-muted-foreground">
                  <p>
                    GiftStorm is a charity awareness game created to support winter relief efforts 
                    for children in need. The game is free to play and entirely family-friendly.
                  </p>
                  <p>
                    <strong className="text-foreground">No violence, no harm</strong> - children in the game 
                    are seeking help, and you're the hero delivering warmth kits, scarves, food, and toys!
                  </p>
                  <p>
                    When you donate through our campaign, 100% of contributions go directly to 
                    purchasing real supplies for children. Donation milestones unlock special 
                    cosmetic rewards for all players as a thank you.
                  </p>
                </div>

                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-lg border border-primary/20">
                  <Info className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                  <p className="text-sm text-muted-foreground">
                    <strong className="text-foreground">Transparency Note:</strong> Donations are 
                    processed externally through our partner organization. The game itself does not 
                    handle any payment processing. All donation records are publicly auditable.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <footer className="py-8 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 text-center text-muted-foreground">
          <p className="mb-2">
            <Gift className="inline w-4 h-4 mr-1" />
            GiftStorm - Winter Campaign Edition
          </p>
          <p className="text-sm">
            Made with love to spread warmth this winter. 
            <Link href="/admin" className="ml-2 text-muted-foreground/60 hover:text-muted-foreground">
              Admin
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
