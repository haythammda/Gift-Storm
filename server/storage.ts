import { type Score, type InsertScore, type GameStatus, type AdminUpdate, MILESTONES } from "@shared/schema";
import { randomUUID } from "crypto";
import * as fs from "fs";
import * as path from "path";

const DATA_DIR = path.join(process.cwd(), "data");
const STATE_FILE = path.join(DATA_DIR, "state.json");

interface GameState {
  donationTotalJOD: number;
  donationGoalJOD: number;
  donationUrl: string;
  devSimulationEnabled: boolean;
  scores: Score[];
}

const DEFAULT_STATE: GameState = {
  donationTotalJOD: 0,
  donationGoalJOD: 1000,
  donationUrl: "https://example.com/donate",
  devSimulationEnabled: false,
  scores: [],
};

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function loadState(): GameState {
  ensureDataDir();
  try {
    if (fs.existsSync(STATE_FILE)) {
      const data = fs.readFileSync(STATE_FILE, "utf-8");
      return { ...DEFAULT_STATE, ...JSON.parse(data) };
    }
  } catch (error) {
    console.error("Failed to load state:", error);
  }
  return { ...DEFAULT_STATE };
}

function saveState(state: GameState): void {
  ensureDataDir();
  try {
    fs.writeFileSync(STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (error) {
    console.error("Failed to save state:", error);
  }
}

export interface IStorage {
  getStatus(): Promise<GameStatus>;
  updateStatus(update: AdminUpdate): Promise<GameStatus>;
  getScores(limit?: number): Promise<Score[]>;
  addScore(score: InsertScore): Promise<Score>;
  resetScores(): Promise<void>;
  simulateDonation(amount: number): Promise<GameStatus>;
}

export class FileStorage implements IStorage {
  private state: GameState;

  constructor() {
    this.state = loadState();
  }

  private save(): void {
    saveState(this.state);
  }

  private calculateUnlocks(): string[] {
    const unlocks: string[] = [];
    for (const milestone of MILESTONES) {
      if (this.state.donationTotalJOD >= milestone.threshold) {
        unlocks.push(milestone.name);
      }
    }
    return unlocks;
  }

  private getMilestones() {
    return MILESTONES.map(m => ({
      ...m,
      unlocked: this.state.donationTotalJOD >= m.threshold,
    }));
  }

  async getStatus(): Promise<GameStatus> {
    return {
      donationTotalJOD: this.state.donationTotalJOD,
      donationGoalJOD: this.state.donationGoalJOD,
      donationUrl: this.state.donationUrl,
      devSimulationEnabled: this.state.devSimulationEnabled,
      milestones: this.getMilestones(),
      globalUnlocks: this.calculateUnlocks(),
    };
  }

  async updateStatus(update: AdminUpdate): Promise<GameStatus> {
    if (update.donationTotalJOD !== undefined) {
      this.state.donationTotalJOD = Math.max(0, update.donationTotalJOD);
    }
    if (update.donationGoalJOD !== undefined) {
      this.state.donationGoalJOD = Math.max(1, update.donationGoalJOD);
    }
    if (update.donationUrl !== undefined) {
      this.state.donationUrl = update.donationUrl;
    }
    if (update.devSimulationEnabled !== undefined) {
      this.state.devSimulationEnabled = update.devSimulationEnabled;
    }
    this.save();
    return this.getStatus();
  }

  async getScores(limit: number = 100): Promise<Score[]> {
    return [...this.state.scores]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  async addScore(insertScore: InsertScore): Promise<Score> {
    const score: Score = {
      id: randomUUID(),
      ...insertScore,
      createdAt: new Date().toISOString(),
    };
    this.state.scores.push(score);
    this.save();
    return score;
  }

  async resetScores(): Promise<void> {
    this.state.scores = [];
    this.save();
  }

  async simulateDonation(amount: number): Promise<GameStatus> {
    if (!this.state.devSimulationEnabled) {
      throw new Error("Dev simulation is not enabled");
    }
    this.state.donationTotalJOD += Math.max(0, amount);
    this.save();
    return this.getStatus();
  }
}

export const storage = new FileStorage();

export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertUser = Omit<User, "id">;
