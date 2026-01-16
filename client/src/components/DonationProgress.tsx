import { Progress } from "@/components/ui/progress";
import { Gift, Target, Heart } from "lucide-react";
import type { GameStatus, Milestone } from "@shared/schema";

interface DonationProgressProps {
  status: GameStatus | undefined;
  isLoading: boolean;
  compact?: boolean;
}

export function DonationProgress({ status, isLoading, compact = false }: DonationProgressProps) {
  if (isLoading || !status) {
    return (
      <div className={compact ? "p-3" : "p-6"}>
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-8 bg-muted rounded-full"></div>
          <div className="h-4 bg-muted rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  const percentage = Math.min((status.donationTotalJOD / status.donationGoalJOD) * 100, 100);

  if (compact) {
    return (
      <div className="p-3 bg-card/80 backdrop-blur-sm rounded-lg border border-card-border">
        <div className="flex items-center gap-2 mb-2">
          <Heart className="w-4 h-4 text-primary" />
          <span className="text-xs font-medium text-muted-foreground">Community Warmth</span>
        </div>
        <Progress value={percentage} className="h-2" />
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>{status.donationTotalJOD} JOD</span>
          <span>{status.donationGoalJOD} JOD</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center gap-2">
          <Gift className="w-6 h-6 text-primary" />
          <h2 className="text-2xl font-bold">Community Warmth Goal</h2>
          <Gift className="w-6 h-6 text-primary" />
        </div>
        <p className="text-muted-foreground">
          Together, we're spreading warmth to children in need this winter!
        </p>
      </div>

      <div className="relative">
        <div className="flex justify-between mb-2">
          <span className="text-lg font-semibold text-primary">
            {status.donationTotalJOD.toLocaleString()} JOD
          </span>
          <span className="text-lg font-medium text-muted-foreground">
            Goal: {status.donationGoalJOD.toLocaleString()} JOD
          </span>
        </div>
        <div className="relative h-8 bg-muted rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-gradient-to-r from-primary via-chart-5 to-accent rounded-full transition-all duration-700 ease-out"
            style={{ width: `${percentage}%` }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-sm font-bold text-foreground drop-shadow-sm">
              {percentage.toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {status.milestones.map((milestone: Milestone, index: number) => (
          <MilestoneCard 
            key={index} 
            milestone={milestone} 
            currentAmount={status.donationTotalJOD} 
          />
        ))}
      </div>
    </div>
  );
}

interface MilestoneCardProps {
  milestone: Milestone;
  currentAmount: number;
}

function MilestoneCard({ milestone, currentAmount }: MilestoneCardProps) {
  const isUnlocked = currentAmount >= milestone.threshold;
  const progress = Math.min((currentAmount / milestone.threshold) * 100, 100);

  return (
    <div
      className={`p-4 rounded-lg border-2 transition-all ${
        isUnlocked
          ? "bg-accent/20 border-accent"
          : "bg-card border-card-border"
      }`}
      data-testid={`milestone-${milestone.threshold}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Target className={`w-5 h-5 ${isUnlocked ? "text-accent" : "text-muted-foreground"}`} />
        <span className="text-sm font-semibold">
          {milestone.threshold} JOD
        </span>
        {isUnlocked && (
          <span className="ml-auto text-xs bg-accent text-accent-foreground px-2 py-0.5 rounded-full font-medium">
            Unlocked!
          </span>
        )}
      </div>
      <h3 className="font-bold text-foreground">{milestone.name}</h3>
      <p className="text-sm text-muted-foreground mt-1">{milestone.description}</p>
      {!isUnlocked && (
        <Progress value={progress} className="h-1 mt-3" />
      )}
    </div>
  );
}
