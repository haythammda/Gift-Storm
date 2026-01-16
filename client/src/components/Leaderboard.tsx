import { Trophy, Clock, Users, Coins } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Score } from "@shared/schema";

interface LeaderboardProps {
  scores: Score[] | undefined;
  isLoading: boolean;
  limit?: number;
  showTitle?: boolean;
}

export function Leaderboard({ scores, isLoading, limit = 10, showTitle = true }: LeaderboardProps) {
  if (isLoading) {
    return (
      <Card>
        {showTitle && (
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-chart-5" />
              Top Players
            </CardTitle>
          </CardHeader>
        )}
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="animate-pulse flex items-center gap-4">
                <div className="w-8 h-8 bg-muted rounded-full"></div>
                <div className="flex-1 h-4 bg-muted rounded"></div>
                <div className="w-16 h-4 bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const displayScores = scores?.slice(0, limit) || [];

  return (
    <Card>
      {showTitle && (
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-chart-5" />
            Top Players
          </CardTitle>
        </CardHeader>
      )}
      <CardContent>
        {displayScores.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p className="font-medium">No scores yet!</p>
            <p className="text-sm">Be the first to play and make a difference.</p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] gap-2 text-xs font-medium text-muted-foreground pb-2 border-b">
              <span>#</span>
              <span>Player</span>
              <span className="text-right">Score</span>
              <span className="text-right">Time</span>
              <span className="text-right">Helped</span>
            </div>
            {displayScores.map((score, index) => (
              <LeaderboardRow key={score.id} score={score} rank={index + 1} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface LeaderboardRowProps {
  score: Score;
  rank: number;
}

function LeaderboardRow({ score, rank }: LeaderboardRowProps) {
  const getRankBadge = (rank: number) => {
    switch (rank) {
      case 1:
        return "bg-chart-5 text-white";
      case 2:
        return "bg-muted-foreground/70 text-white";
      case 3:
        return "bg-chart-1/70 text-white";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div
      className="grid grid-cols-[2.5rem_1fr_4rem_4rem_4rem] gap-2 items-center py-2 hover-elevate rounded px-1"
      data-testid={`leaderboard-row-${rank}`}
    >
      <div className="flex justify-center">
        <span
          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold ${getRankBadge(rank)}`}
        >
          {rank}
        </span>
      </div>
      <span className="font-medium truncate">{score.playerName}</span>
      <span className="text-right font-mono text-sm font-semibold text-primary">
        {score.score.toLocaleString()}
      </span>
      <span className="text-right font-mono text-sm text-muted-foreground flex items-center justify-end gap-1">
        <Clock className="w-3 h-3" />
        {formatTime(score.timeSurvived)}
      </span>
      <span className="text-right font-mono text-sm text-muted-foreground flex items-center justify-end gap-1">
        <Users className="w-3 h-3" />
        {score.childrenHelped}
      </span>
    </div>
  );
}
