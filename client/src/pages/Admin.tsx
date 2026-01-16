import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link, useSearch } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { getAdminKey, setAdminKey } from "@/lib/storage";
import { 
  Shield, Home, Settings, Trophy, Trash2, Plus, 
  RefreshCw, AlertTriangle, Check, Lock 
} from "lucide-react";
import type { GameStatus, Score, AdminUpdate } from "@shared/schema";

export default function Admin() {
  const search = useSearch();
  const params = new URLSearchParams(search);
  const urlKey = params.get("key");
  
  const [adminKey, setAdminKeyState] = useState<string>(() => urlKey || getAdminKey() || "");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [donationTotal, setDonationTotal] = useState("");
  const [donationGoal, setDonationGoal] = useState("");
  const [donationUrl, setDonationUrl] = useState("");
  const [devSimulation, setDevSimulation] = useState(false);
  const [simulateAmount, setSimulateAmount] = useState("10");
  const { toast } = useToast();

  const { data: status, isLoading: statusLoading, refetch: refetchStatus } = useQuery<GameStatus>({
    queryKey: ["/api/status"],
    enabled: isAuthenticated,
  });

  const { data: scores, isLoading: scoresLoading, refetch: refetchScores } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (status) {
      setDonationTotal(status.donationTotalJOD.toString());
      setDonationGoal(status.donationGoalJOD.toString());
      setDonationUrl(status.donationUrl);
      setDevSimulation(status.devSimulationEnabled || false);
    }
  }, [status]);

  useEffect(() => {
    if (urlKey) {
      setAdminKey(urlKey);
      setIsAuthenticated(true);
    }
  }, [urlKey]);

  const updateMutation = useMutation({
    mutationFn: async (data: AdminUpdate) => {
      return apiRequest("POST", `/api/admin/update?key=${adminKey}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      toast({
        title: "Settings updated",
        description: "The campaign settings have been saved.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const simulateMutation = useMutation({
    mutationFn: async (amount: number) => {
      return apiRequest("POST", `/api/admin/simulate?key=${adminKey}`, { amount });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/status"] });
      refetchStatus();
      toast({
        title: "Simulation successful",
        description: `Added ${simulateAmount} JOD to donation total.`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Simulation failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetLeaderboardMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", `/api/admin/reset-leaderboard?key=${adminKey}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
      refetchScores();
      toast({
        title: "Leaderboard reset",
        description: "All scores have been cleared.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Reset failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleLogin = () => {
    if (adminKey.trim()) {
      setAdminKey(adminKey);
      setIsAuthenticated(true);
    }
  };

  const handleSaveSettings = () => {
    const updates: AdminUpdate = {};
    
    if (donationTotal !== status?.donationTotalJOD.toString()) {
      updates.donationTotalJOD = parseFloat(donationTotal) || 0;
    }
    if (donationGoal !== status?.donationGoalJOD.toString()) {
      updates.donationGoalJOD = parseFloat(donationGoal) || 1000;
    }
    if (donationUrl !== status?.donationUrl) {
      updates.donationUrl = donationUrl;
    }
    if (devSimulation !== status?.devSimulationEnabled) {
      updates.devSimulationEnabled = devSimulation;
    }

    if (Object.keys(updates).length > 0) {
      updateMutation.mutate(updates);
    }
  };

  const handleSimulate = () => {
    const amount = parseFloat(simulateAmount);
    if (amount > 0) {
      simulateMutation.mutate(amount);
    }
  };

  const handleResetLeaderboard = () => {
    if (window.confirm("Are you sure you want to reset the leaderboard? This cannot be undone.")) {
      resetLeaderboardMutation.mutate();
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <Lock className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <CardTitle>Admin Access</CardTitle>
            <CardDescription>Enter the admin key to continue</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="adminKey">Admin Key</Label>
              <Input
                id="adminKey"
                type="password"
                value={adminKey}
                onChange={(e) => setAdminKeyState(e.target.value)}
                placeholder="Enter admin key"
                className="mt-1"
                data-testid="input-admin-key"
              />
            </div>
            <Button className="w-full" onClick={handleLogin} data-testid="button-admin-login">
              <Shield className="w-4 h-4 mr-2" />
              Access Admin Panel
            </Button>
            <Link href="/">
              <Button variant="ghost" className="w-full">
                <Home className="w-4 h-4 mr-2" />
                Back to Home
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-6 h-6 text-primary" />
            <h1 className="text-xl font-bold">GiftStorm Admin</h1>
          </div>
          <Link href="/">
            <Button variant="ghost">
              <Home className="w-4 h-4 mr-2" />
              Back to Site
            </Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="w-5 h-5" />
                  Campaign Settings
                </CardTitle>
                <CardDescription>Manage donation goals and URLs</CardDescription>
              </div>
              <Button onClick={() => refetchStatus()} variant="outline" size="icon">
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {statusLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
                <div className="h-10 bg-muted rounded" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="donationTotal">Current Donation Total (JOD)</Label>
                    <Input
                      id="donationTotal"
                      type="number"
                      value={donationTotal}
                      onChange={(e) => setDonationTotal(e.target.value)}
                      className="mt-1"
                      data-testid="input-donation-total"
                    />
                  </div>
                  <div>
                    <Label htmlFor="donationGoal">Donation Goal (JOD)</Label>
                    <Input
                      id="donationGoal"
                      type="number"
                      value={donationGoal}
                      onChange={(e) => setDonationGoal(e.target.value)}
                      className="mt-1"
                      data-testid="input-donation-goal"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="donationUrl">Donation URL</Label>
                  <Input
                    id="donationUrl"
                    type="url"
                    value={donationUrl}
                    onChange={(e) => setDonationUrl(e.target.value)}
                    placeholder="https://..."
                    className="mt-1"
                    data-testid="input-donation-url"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <div>
                    <Label>Dev Simulation Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable to allow simulating donations without real payments
                    </p>
                  </div>
                  <Switch
                    checked={devSimulation}
                    onCheckedChange={setDevSimulation}
                    data-testid="switch-dev-simulation"
                  />
                </div>

                <Button 
                  onClick={handleSaveSettings}
                  disabled={updateMutation.isPending}
                  data-testid="button-save-settings"
                >
                  <Check className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Saving..." : "Save Settings"}
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {devSimulation && (
          <Card className="border-chart-5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-chart-5">
                <AlertTriangle className="w-5 h-5" />
                Dev Simulation
              </CardTitle>
              <CardDescription>
                Simulate donations for testing (only visible when dev mode is enabled)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="simulateAmount">Amount (JOD)</Label>
                  <Input
                    id="simulateAmount"
                    type="number"
                    value={simulateAmount}
                    onChange={(e) => setSimulateAmount(e.target.value)}
                    className="mt-1"
                    data-testid="input-simulate-amount"
                  />
                </div>
                <Button 
                  onClick={handleSimulate}
                  disabled={simulateMutation.isPending}
                  className="self-end"
                  data-testid="button-simulate"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  {simulateMutation.isPending ? "Adding..." : "Add Donation"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="w-5 h-5" />
                  Leaderboard
                </CardTitle>
                <CardDescription>Top 50 player scores</CardDescription>
              </div>
              <div className="flex gap-2">
                <Button onClick={() => refetchScores()} variant="outline" size="icon">
                  <RefreshCw className="w-4 h-4" />
                </Button>
                <Button 
                  onClick={handleResetLeaderboard}
                  variant="destructive"
                  disabled={resetLeaderboardMutation.isPending}
                  data-testid="button-reset-leaderboard"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {scoresLoading ? (
              <div className="animate-pulse space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="h-12 bg-muted rounded" />
                ))}
              </div>
            ) : scores && scores.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">#</th>
                      <th className="text-left p-2">Player</th>
                      <th className="text-right p-2">Score</th>
                      <th className="text-right p-2">Time</th>
                      <th className="text-right p-2">Helped</th>
                      <th className="text-right p-2">Coins</th>
                      <th className="text-right p-2">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scores.slice(0, 50).map((score, index) => (
                      <tr key={score.id} className="border-b hover:bg-muted/50">
                        <td className="p-2 font-medium">{index + 1}</td>
                        <td className="p-2">{score.playerName}</td>
                        <td className="p-2 text-right font-mono">{score.score}</td>
                        <td className="p-2 text-right font-mono">
                          {Math.floor(score.timeSurvived / 60)}:{(score.timeSurvived % 60).toString().padStart(2, "0")}
                        </td>
                        <td className="p-2 text-right">{score.childrenHelped}</td>
                        <td className="p-2 text-right">{score.coinsEarned}</td>
                        <td className="p-2 text-right text-muted-foreground">
                          {new Date(score.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No scores recorded yet</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
