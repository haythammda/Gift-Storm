import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { Link, useLocation, useSearch } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { DonationProgress } from "@/components/DonationProgress";
import { useTheme } from "@/components/ThemeProvider";
import { useToast } from "@/hooks/use-toast";
import { 
  Pause, Play, Settings, Home, Heart, Gift, Trophy, 
  Coins, Clock, Zap, Shield, Sparkles, Sun, Moon, X, Target,
  Shirt, Footprints, Hand, Lock, Check, TreeDeciduous, Sword, Star,
  ExternalLink, Loader2, Palette
} from "lucide-react";
import { 
  getSettings, saveSettings, getPlayerData, savePlayerData, addCoins, updateBestTime, 
  addChildrenHelped, purchaseUpgrade, purchaseEquipment, equipItem, unequipItem,
  purchaseSkillNode, toggleActiveWeapon, getEquippedStats, getSkillStats,
  unlockGamePass, unlockSkin, equipSkin, getUpgradeCost,
  completeLevel, isLevelUnlocked, getLevelProgress,
  getEquipmentLevel, getEquipmentCardCount, getEquipmentCardsNeeded, 
  upgradeEquipment, getEquipmentStatsWithLevel, awardChest, openChest,
  type GameSettings, type ExtendedPlayerData, type EquipmentLoadout, type LevelProgress,
  type ChestReward, type PendingChest
} from "@/lib/storage";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  META_UPGRADES, EQUIPMENT, SKILL_TREE, WEAPONS, ENEMY_TYPES, BOSS_TYPES,
  GAME_LEVELS, MAP_THEMES, MINI_BOSSES, CHESTS, getLevelConfig, getMapTheme, getMiniBoss,
  type GameStatus, type InsertScore, type Score, type PlayerMetaData, type MetaUpgrade, 
  type Equipment, type SkillNode, type Weapon, type EnemyType, type BossType,
  type GameLevel, type MapTheme, type MiniBoss, type Chest
} from "@shared/schema";
import Phaser from "phaser";
import { soundManager } from "@/lib/sounds";

type GameMode = "limitless" | "levels";

interface GameState {
  isPlaying: boolean;
  isPaused: boolean;
  isGameOver: boolean;
  showSettings: boolean;
  showWorkshop: boolean;
  showLevelUp: boolean;
  showModeSelect: boolean;
  showLevelComplete: boolean;
  showEquipmentShop: boolean;
  showSkillTree: boolean;
  showDonationShop: boolean;
  showSkinShop: boolean;
  showLevelSelect: boolean;
  showChestReward: boolean;
  gameMode: GameMode;
  currentLevel: number;
  score: number;
  timeSurvived: number;
  childrenHelped: number;
  coinsEarned: number;
  level: number;
  xp: number;
  xpToLevel: number;
  hp: number;
  maxHp: number;
  currentUpgrades: string[];
  levelUpChoices: UpgradeChoice[];
  waveNumber: number;
  bossActive: boolean;
  bossHp: number;
  bossMaxHp: number;
  pendingLevelUps: number;
  dangerLevel: number;
  levelTimeRemaining: number;
  levelPhase: "regular" | "miniboss1" | "harder" | "miniboss2" | "intense" | "finalboss" | "complete";
  miniBoss1Defeated: boolean;
  miniBoss2Defeated: boolean;
  finalBossDefeated: boolean;
  bossAlert: string | null;
  earnedChest: Chest | null;
  chestReward: ChestReward | null;
}

interface UpgradeChoice {
  id: string;
  name: string;
  description: string;
  rarity: "common" | "rare" | "epic";
  icon: string;
}

const IN_RUN_UPGRADES: UpgradeChoice[] = [
  { id: "fasterThrow", name: "Rapid Fire", description: "+25% throw rate", rarity: "common", icon: "zap" },
  { id: "biggerBag", name: "Gift Storm", description: "+1 projectile", rarity: "rare", icon: "gift" },
  { id: "cocoaBoost", name: "Hot Cocoa Rush", description: "Speed burst on pickup", rarity: "common", icon: "sparkles" },
  { id: "warmthAura", name: "Warmth Shield", description: "-50% damage taken", rarity: "rare", icon: "shield" },
  { id: "giftBoomerang", name: "Boomerang Gift", description: "Gifts return for double hits", rarity: "epic", icon: "refresh" },
  { id: "giftSplash", name: "Gift Explosion", description: "AOE burst on hit", rarity: "rare", icon: "sparkles" },
  { id: "coinMagnet", name: "Mega Magnet", description: "+75% pickup radius", rarity: "common", icon: "coins" },
  { id: "piercing", name: "Piercing Gifts", description: "Gifts pass through 2 targets", rarity: "epic", icon: "zap" },
  { id: "freezeBlast", name: "Freeze Blast", description: "Slow enemies on hit", rarity: "rare", icon: "sparkles" },
  { id: "healingTouch", name: "Healing Warmth", description: "+5 HP per 10 helped", rarity: "rare", icon: "heart" },
  { id: "giftChain", name: "Gift Chain", description: "Gifts bounce to nearby target", rarity: "epic", icon: "refresh" },
  { id: "criticalGift", name: "Critical Gift", description: "20% chance for double score", rarity: "common", icon: "sparkles" },
  { id: "doubleJump", name: "Double Jump", description: "Dash ability on double-tap movement", rarity: "epic", icon: "zap" },
  { id: "luckyStar", name: "Lucky Star", description: "+15% coin drop rate", rarity: "common", icon: "star" },
  { id: "giftBarrage", name: "Gift Barrage", description: "Fire 3 gifts in spread pattern", rarity: "rare", icon: "gift" },
  { id: "frostbite", name: "Frostbite", description: "Frozen enemies take 2x damage", rarity: "rare", icon: "sparkles" },
  { id: "thorns", name: "Thorns", description: "Enemies that touch you take 1 damage", rarity: "common", icon: "shield" },
  { id: "regeneration", name: "Regeneration", description: "+1 HP every 15 seconds", rarity: "common", icon: "heart" },
  { id: "treasureHunter", name: "Treasure Hunter", description: "Coins worth 50% more", rarity: "rare", icon: "coins" },
  { id: "haste", name: "Haste", description: "+15% movement speed", rarity: "common", icon: "zap" },
  { id: "vampiric", name: "Vampiric Gifts", description: "Heal 1 HP per 20 kills", rarity: "epic", icon: "heart" },
  { id: "shieldBreaker", name: "Shield Breaker", description: "Ignore enemy shields", rarity: "rare", icon: "sword" },
  { id: "multiShot", name: "Multi-Shot", description: "Fire in 4 directions", rarity: "epic", icon: "target" },
  { id: "timeWarp", name: "Time Warp", description: "Slow all enemies by 20%", rarity: "rare", icon: "clock" },
];

// Upgrades that don't stack - once purchased, they won't appear again
const NON_STACKING_UPGRADES = [
  "cocoaBoost", "warmthAura", "giftBoomerang", "giftSplash", "piercing",
  "freezeBlast", "giftChain", "criticalGift", "doubleJump", "luckyStar",
  "giftBarrage", "frostbite", "thorns", "regeneration", "treasureHunter",
  "haste", "vampiric", "shieldBreaker", "multiShot", "timeWarp"
];

interface Synergy {
  id: string;
  name: string;
  description: string;
  upgrade1: string;
  upgrade2: string;
  bonusEffect: string;
}

const SYNERGIES: Synergy[] = [
  { 
    id: "giftStorm", 
    name: "Gift Storm", 
    description: "+10% projectile speed", 
    upgrade1: "fasterThrow", 
    upgrade2: "biggerBag",
    bonusEffect: "projectileSpeed"
  },
  { 
    id: "deepFreeze", 
    name: "Deep Freeze", 
    description: "Freeze lasts 3s instead of 2s", 
    upgrade1: "freezeBlast", 
    upgrade2: "frostbite",
    bonusEffect: "extendedFreeze"
  },
  { 
    id: "treasureMaster", 
    name: "Treasure Master", 
    description: "Coins attracted from further away", 
    upgrade1: "coinMagnet", 
    upgrade2: "treasureHunter",
    bonusEffect: "extendedPickup"
  },
  { 
    id: "giftWave", 
    name: "Gift Wave", 
    description: "Chain to 3 targets instead of 2", 
    upgrade1: "piercing", 
    upgrade2: "giftChain",
    bonusEffect: "extendedChain"
  },
  { 
    id: "lifeForce", 
    name: "Life Force", 
    description: "Healing triggers at 15 kills instead of 20", 
    upgrade1: "healingTouch", 
    upgrade2: "vampiric",
    bonusEffect: "improvedHealing"
  },
];

const getSynergyPartner = (upgradeId: string): string | null => {
  for (const synergy of SYNERGIES) {
    if (synergy.upgrade1 === upgradeId) return synergy.upgrade2;
    if (synergy.upgrade2 === upgradeId) return synergy.upgrade1;
  }
  return null;
};

const getUpgradeName = (upgradeId: string): string => {
  const upgrade = IN_RUN_UPGRADES.find(u => u.id === upgradeId);
  return upgrade?.name || upgradeId;
};

const getActiveSynergies = (currentUpgrades: string[]): Synergy[] => {
  return SYNERGIES.filter(synergy => 
    currentUpgrades.includes(synergy.upgrade1) && currentUpgrades.includes(synergy.upgrade2)
  );
};

const INITIAL_GAME_STATE: GameState = {
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  showSettings: false,
  showWorkshop: false,
  showLevelUp: false,
  showModeSelect: false,
  showLevelComplete: false,
  showEquipmentShop: false,
  showSkillTree: false,
  showDonationShop: false,
  showSkinShop: false,
  showLevelSelect: false,
  showChestReward: false,
  gameMode: "limitless",
  currentLevel: 1,
  score: 0,
  timeSurvived: 0,
  childrenHelped: 0,
  coinsEarned: 0,
  level: 1,
  xp: 0,
  xpToLevel: 100,
  hp: 100,
  maxHp: 100,
  currentUpgrades: [],
  levelUpChoices: [],
  waveNumber: 1,
  bossActive: false,
  bossHp: 0,
  bossMaxHp: 0,
  pendingLevelUps: 0,
  dangerLevel: 1.0,
  levelTimeRemaining: 300,
  levelPhase: "regular",
  miniBoss1Defeated: false,
  miniBoss2Defeated: false,
  finalBossDefeated: false,
  bossAlert: null,
  earnedChest: null,
  chestReward: null,
};

const LEVEL_DURATION = 300;

const SKIN_DATA: Record<string, { name: string; color: number; description: string }> = {
  snowflake: { name: "Snowflake Thrower", color: 0x87CEEB, description: "A frosty blue player with snowflake trail effects" },
  candycane: { name: "Candy Cane Hero", color: 0xFF0000, description: "Red and white striped festive look" },
  golden: { name: "Golden Gift Giver", color: 0xFFD700, description: "Luxurious gold player with sparkle effects" },
  aurora: { name: "Aurora Champion", color: 0x9400D3, description: "Magical aurora borealis effects with color-shifting player" },
};

const formatLevelTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

export default function Game() {
  const gameContainerRef = useRef<HTMLDivElement>(null);
  const gameRef = useRef<Phaser.Game | null>(null);
  const upgradesRef = useRef<string[]>([]);
  const gameStateRef = useRef<{ 
  isPaused: boolean; 
  showLevelUp: boolean; 
  showLevelComplete: boolean; 
  pendingLevelUps: number;
  levelPhase: GameState["levelPhase"];
  miniBoss1Defeated: boolean;
  miniBoss2Defeated: boolean;
  finalBossDefeated: boolean;
}>({ 
  isPaused: false, 
  showLevelUp: false, 
  showLevelComplete: false, 
  pendingLevelUps: 0,
  levelPhase: "regular",
  miniBoss1Defeated: false,
  miniBoss2Defeated: false,
  finalBossDefeated: false,
});
  const endGameRef = useRef<() => void>(() => {});
  const [gameState, setGameState] = useState<GameState>(INITIAL_GAME_STATE);
  const [settings, setSettings] = useState<GameSettings>(getSettings());
  const [playerData, setPlayerData] = useState<ExtendedPlayerData>(getPlayerData() as ExtendedPlayerData);
  const [playerName, setPlayerName] = useState("");
  const [, setLocation] = useLocation();
  const searchString = useSearch();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();

  const { data: status } = useQuery<GameStatus>({
    queryKey: ["/api/status"],
  });

  const { data: scores } = useQuery<Score[]>({
    queryKey: ["/api/scores"],
  });

  useEffect(() => {
    const params = new URLSearchParams(searchString);
    if (params.get("donation") === "success") {
      const purchaseType = params.get("type");
      const skinId = params.get("skinId");
      
      if (purchaseType === "gamepass") {
        unlockGamePass();
        toast({
          title: "Game Pass Activated!",
          description: "You now have 2x XP, bonus starting coins, and access to all premium skins!",
        });
      } else if (purchaseType === "skin" && skinId) {
        unlockSkin(skinId);
        toast({
          title: "Skin Unlocked!",
          description: `You've unlocked the ${SKIN_DATA[skinId]?.name || skinId} skin!`,
        });
      } else {
        toast({
          title: "Thank You!",
          description: "Your donation has been processed. Coins will be added to your account shortly.",
        });
      }
      setPlayerData(getPlayerData());
      window.history.replaceState({}, "", "/play");
    }
  }, [searchString, toast]);

  const submitScoreMutation = useMutation({
    mutationFn: async (scoreData: InsertScore) => {
      return apiRequest("POST", "/api/score", scoreData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/scores"] });
    },
  });

  const showModeSelection = useCallback(() => {
    setGameState(prev => ({ ...prev, showModeSelect: true }));
  }, []);

  const startGame = useCallback((mode: GameMode, levelId: number = 1) => {
    const metaData = getPlayerData();
    const maxHpBonus = (metaData.upgrades["maxHp"] || 0) * 10;
    const startingCoins = metaData.hasGamePass ? 100 : 0;
    
    const newState: GameState = {
      ...INITIAL_GAME_STATE,
      isPlaying: true,
      gameMode: mode,
      currentLevel: levelId,
      maxHp: 100 + maxHpBonus,
      hp: 100 + maxHpBonus,
      coinsEarned: startingCoins,
      levelTimeRemaining: LEVEL_DURATION,
      levelPhase: "regular",
      miniBoss1Defeated: false,
      miniBoss2Defeated: false,
      finalBossDefeated: false,
      bossAlert: null,
    };
    
    gameStateRef.current = {
      isPaused: false,
      showLevelUp: false,
      showLevelComplete: false,
      pendingLevelUps: 0,
      levelPhase: "regular",
      miniBoss1Defeated: false,
      miniBoss2Defeated: false,
      finalBossDefeated: false,
    };
    
    setGameState(newState);
    upgradesRef.current = [];
    setPlayerData(metaData);
  }, []);

  const pauseGame = useCallback(() => {
    setGameState(prev => ({ ...prev, isPaused: !prev.isPaused }));
  }, []);

  const advanceToNextLevel = useCallback(() => {
    setGameState(prev => {
      const nextLevel = prev.currentLevel + 1;
      const levelConfig = getLevelConfig(nextLevel);
      
      if (gameRef.current && levelConfig) {
        const scene = gameRef.current.scene.scenes[0];
        if (scene && (scene as any).gameData) {
          const gameData = (scene as any).gameData;
          gameData.childrenHelped = 0;
          gameData.waveNumber = 1;
          gameData.waveTimer = 0;
          gameData.gameTime = 0;
          gameData.levelTime = 0;
          gameData.children.clear(true, true);
          gameData.levelDifficulty = levelConfig.difficulty;
          gameData.enemyHealthMultiplier = levelConfig.enemyHealthMultiplier;
          gameData.enemySpeedMultiplier = levelConfig.enemySpeedMultiplier;
          gameData.spawnRateMultiplier = levelConfig.spawnRateMultiplier;
          gameData.currentLevelConfig = levelConfig;
          gameData.miniBoss1Spawned = false;
          gameData.miniBoss2Spawned = false;
          gameData.finalBossSpawned = false;
        }
        
      }
      
      gameStateRef.current = { 
        isPaused: false, 
        showLevelUp: false, 
        showLevelComplete: false, 
        pendingLevelUps: 0,
        levelPhase: "regular",
        miniBoss1Defeated: false,
        miniBoss2Defeated: false,
        finalBossDefeated: false,
      };
      
      if (gameRef.current) {
        const scene = gameRef.current.scene.scenes[0];
        if (scene) {
          scene.physics.resume();
        }
      }
      
      return {
        ...prev,
        currentLevel: nextLevel,
        childrenHelped: 0,
        showLevelComplete: false,
        isPaused: false,
        waveNumber: 1,
        timeSurvived: 0,
        pendingLevelUps: 0,
        levelTimeRemaining: LEVEL_DURATION,
        levelPhase: "regular",
        miniBoss1Defeated: false,
        miniBoss2Defeated: false,
        finalBossDefeated: false,
        bossAlert: null,
      };
    });
  }, []);

  const endGame = useCallback(() => {
    setGameState(prev => {
      const finalCoins = prev.coinsEarned;
      const playerDataNow = getPlayerData();
      const coinMultiplier = 1 + (playerDataNow.upgrades["coinMultiplier"] || 0) * 0.1;
      const totalCoins = Math.floor(finalCoins * coinMultiplier);
      
      addCoins(totalCoins);
      updateBestTime(prev.timeSurvived);
      addChildrenHelped(prev.childrenHelped);
      
      return { ...prev, isPlaying: false, isGameOver: true };
    });
    setPlayerData(getPlayerData());
  }, []);

  useEffect(() => {
    endGameRef.current = endGame;
  }, [endGame]);

  const submitScore = async () => {
    if (!playerName.trim()) return;
    
    try {
      await submitScoreMutation.mutateAsync({
        playerName: playerName.trim().slice(0, 20),
        score: gameState.score,
        timeSurvived: gameState.timeSurvived,
        childrenHelped: gameState.childrenHelped,
        coinsEarned: gameState.coinsEarned,
      });
      setLocation("/");
    } catch (error) {
      console.error("Failed to submit score:", error);
    }
  };

  const handleLevelUp = (upgradeId: string) => {
    const newUpgrades = [...gameState.currentUpgrades, upgradeId];
    upgradesRef.current = newUpgrades;
    
    const remainingLevelUps = gameState.pendingLevelUps - 1;
    
    if (remainingLevelUps > 0) {
      // Filter out non-stacking upgrades that are already owned
      const availableUpgrades = IN_RUN_UPGRADES.filter(upgrade => {
        if (NON_STACKING_UPGRADES.includes(upgrade.id)) {
          return !newUpgrades.includes(upgrade.id);
        }
        return true;
      });
      
      const choices = [...availableUpgrades]
        .sort(() => Math.random() - 0.5)
        .slice(0, 3);
      
      gameStateRef.current = { ...gameStateRef.current, pendingLevelUps: remainingLevelUps };
      setGameState(prev => ({
        ...prev,
        currentUpgrades: newUpgrades,
        pendingLevelUps: remainingLevelUps,
        levelUpChoices: choices,
      }));
    } else {
      gameStateRef.current = { isPaused: false, showLevelUp: false, showLevelComplete: false, pendingLevelUps: 0 };
      
      if (gameRef.current) {
        const scene = gameRef.current.scene.scenes[0];
        if (scene) {
          scene.physics.resume();
        }
      }
      
      setGameState(prev => ({
        ...prev,
        showLevelUp: false,
        showLevelComplete: false,
        currentUpgrades: newUpgrades,
        pendingLevelUps: 0,
      }));
    }
  };

  useEffect(() => {
    upgradesRef.current = gameState.currentUpgrades;
    gameStateRef.current = { 
      isPaused: gameState.isPaused, 
      showLevelUp: gameState.showLevelUp, 
      showLevelComplete: gameState.showLevelComplete,
      pendingLevelUps: gameState.pendingLevelUps,
      levelPhase: gameState.levelPhase,
      miniBoss1Defeated: gameState.miniBoss1Defeated,
      miniBoss2Defeated: gameState.miniBoss2Defeated,
      finalBossDefeated: gameState.finalBossDefeated,
    };
    
    if (gameRef.current) {
      const scene = gameRef.current.scene.scenes[0];
      if (scene) {
        if (gameState.isPaused || gameState.showLevelUp || gameState.showLevelComplete) {
          scene.physics.pause();
        } else {
          scene.physics.resume();
        }
      }
    }
  }, [gameState.currentUpgrades, gameState.isPaused, gameState.showLevelUp, gameState.showLevelComplete, gameState.pendingLevelUps, gameState.levelPhase, gameState.miniBoss1Defeated, gameState.miniBoss2Defeated, gameState.finalBossDefeated]);

  const handlePurchaseUpgrade = (upgradeId: string) => {
    if (purchaseUpgrade(upgradeId)) {
      setPlayerData(getPlayerData());
    }
  };

  const updateSettings = (newSettings: Partial<GameSettings>) => {
    const updated = saveSettings(newSettings);
    setSettings(updated);
  };

  useEffect(() => {
    if (!gameContainerRef.current || !gameState.isPlaying) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: gameContainerRef.current,
      width: 800,
      height: 600,
      backgroundColor: theme === "dark" ? "#1a1a2e" : "#e8f4fc",
      physics: {
        default: "arcade",
        arcade: {
          gravity: { x: 0, y: 0 },
          debug: false,
        },
      },
      scene: {
        preload: function(this: Phaser.Scene)
        {
          
          const graphics = this.make.graphics({ x: 0, y: 0 });
          const fw = 384;
          const fh = 256;

          // Load your real spritesheets (4x4 grid)
          this.load.spritesheet("player", "/assets/characters/mainCharacter.png", { frameWidth: fw, frameHeight: fh });

          this.load.spritesheet("firstMob", "/assets/characters/firstMob.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("secondMob", "/assets/characters/secondMob.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("thirdMob", "/assets/characters/thirdMob.png", { frameWidth: fw, frameHeight: fh });

          this.load.spritesheet("firstBoss", "/assets/characters/firstBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("secondBoss", "/assets/characters/secondBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("thirdBoss", "/assets/characters/thirdBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("fourthBoss", "/assets/characters/fourthBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("fifthBoss", "/assets/characters/fifthBoss.png", { frameWidth: fw, frameHeight: fh });

          // Optional: keep your generated textures for gift/coin/xp if you want
          // (you can leave your existing "gift", "coin", "xp" generateTexture blocks below)
          
          // Brown boots
          graphics.fillStyle(0x8b4513);
          graphics.fillRect(12, 36, 6, 4);
          graphics.fillRect(22, 36, 6, 4);
          // Blue jeans
          graphics.fillStyle(0x4169e1);
          graphics.fillRect(13, 30, 5, 7);
          graphics.fillRect(22, 30, 5, 7);
          graphics.fillRect(16, 28, 8, 4);
          // Red coat body
          graphics.fillStyle(0xcc3333);
          graphics.fillRoundedRect(10, 16, 20, 14, 3);
          graphics.fillStyle(0xaa2222);
          graphics.fillRoundedRect(12, 18, 16, 10, 2);
          // Green scarf
          graphics.fillStyle(0x2e8b57);
          graphics.fillRect(8, 14, 24, 4);
          graphics.fillRect(6, 16, 4, 8);
          graphics.fillRect(30, 16, 4, 8);
          graphics.fillStyle(0x228b22);
          graphics.fillRect(7, 17, 2, 6);
          graphics.fillRect(31, 17, 2, 6);
          // Arms (red coat sleeves)
          graphics.fillStyle(0xcc3333);
          graphics.fillRect(4, 18, 7, 10);
          graphics.fillRect(29, 18, 7, 10);
          // Face
          graphics.fillStyle(0xf5deb3);
          graphics.fillCircle(20, 12, 6);
          // Rosy cheeks
          graphics.fillStyle(0xff9999);
          graphics.fillCircle(15, 13, 2);
          graphics.fillCircle(25, 13, 2);
          // Eyes
          graphics.fillStyle(0x333333);
          graphics.fillCircle(17, 11, 2);
          graphics.fillCircle(23, 11, 2);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(17, 10, 1);
          graphics.fillCircle(23, 10, 1);
          // Smile
          graphics.fillStyle(0x333333);
          graphics.fillRect(18, 14, 4, 1);
          // Red beanie
          graphics.fillStyle(0xcc2222);
          graphics.fillCircle(20, 8, 8);
          graphics.fillRoundedRect(12, 4, 16, 8, 2);
          graphics.fillStyle(0xaa1111);
          graphics.fillRect(13, 5, 14, 2);
          // Pompom on beanie
          graphics.fillStyle(0xffd700);
          graphics.fillCircle(20, 0, 4);
          graphics.fillStyle(0xffcc00);
          graphics.fillCircle(19, -1, 2);
          // Gift sack on back (brown)
          graphics.fillStyle(0x8b6914);
          graphics.fillCircle(6, 20, 8);
          graphics.fillStyle(0xa67c20);
          graphics.fillCircle(6, 20, 5);
          // Colorful gifts peeking out
          graphics.fillStyle(0xff6b6b);
          graphics.fillRect(2, 14, 4, 3);
          graphics.fillStyle(0x4ecdc4);
          graphics.fillRect(6, 13, 4, 3);
          graphics.fillStyle(0xffd93d);
          graphics.fillRect(4, 16, 3, 3);
          //graphics.generateTexture("player", 40, 40);
          
          // Gift projectile - wrapped present with ribbon
          graphics.clear();
          graphics.fillStyle(0xcc2222);
          graphics.fillRoundedRect(4, 6, 16, 12, 2);
          graphics.fillStyle(0xaa1111);
          graphics.fillRoundedRect(5, 7, 14, 10, 2);
          graphics.fillStyle(0xffd700);
          graphics.fillRect(11, 4, 3, 16);
          graphics.fillRect(2, 10, 20, 3);
          graphics.fillStyle(0xffcc00);
          graphics.fillCircle(12, 4, 4);
          graphics.fillCircle(9, 3, 2);
          graphics.fillCircle(15, 3, 2);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(7, 9, 1.5);
          graphics.generateTexture("gift", 24, 24);
          
          // Normal child - blue winter coat (like the diverse children)
          graphics.clear();
          graphics.fillStyle(0x5b9bd5);
          graphics.fillRoundedRect(5, 12, 18, 14, 4);
          graphics.fillStyle(0x4a89c7);
          graphics.fillRoundedRect(7, 14, 14, 10, 3);
          graphics.fillStyle(0xf5deb3);
          graphics.fillCircle(14, 10, 6);
          graphics.fillStyle(0xff69b4);
          graphics.fillCircle(14, 6, 6);
          graphics.fillCircle(14, 4, 5);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(10, 9, 2.5);
          graphics.fillCircle(18, 9, 2.5);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(10, 9, 1.5);
          graphics.fillCircle(18, 9, 1.5);
          graphics.fillStyle(0xff9999);
          graphics.fillCircle(7, 12, 2);
          graphics.fillCircle(21, 12, 2);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(14, 13, 1.5);
          //graphics.generateTexture("child", 28, 28);
          
          // Fast child - with glasses (like glasses boy in image)
          graphics.clear();
          graphics.fillStyle(0x4ecdc4);
          graphics.fillRoundedRect(4, 12, 20, 14, 4);
          graphics.fillStyle(0x44b8b0);
          graphics.fillRoundedRect(6, 14, 16, 10, 3);
          graphics.fillStyle(0xd2691e);
          graphics.fillCircle(14, 10, 6);
          graphics.fillStyle(0x8b4513);
          graphics.fillCircle(14, 6, 5);
          graphics.fillCircle(10, 5, 3);
          graphics.fillCircle(18, 5, 3);
          // Glasses frames
          graphics.lineStyle(2, 0x333333, 1);
          graphics.strokeCircle(10, 9, 3);
          graphics.strokeCircle(18, 9, 3);
          graphics.lineBetween(13, 9, 15, 9);
          graphics.fillStyle(0x87ceeb);
          graphics.fillCircle(10, 9, 2);
          graphics.fillCircle(18, 9, 2);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(10, 9, 1);
          graphics.fillCircle(18, 9, 1);
          //graphics.generateTexture("childFast", 28, 28);
          
          // Armored child - hijabi style (like purple hijabi in image)
          graphics.clear();
          graphics.fillStyle(0x9b59b6);
          graphics.fillRoundedRect(3, 4, 26, 26, 8);
          graphics.fillStyle(0x8e44ad);
          graphics.fillRoundedRect(5, 6, 22, 22, 6);
          graphics.fillStyle(0xf5deb3);
          graphics.fillCircle(16, 14, 6);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(13, 12, 2.5);
          graphics.fillCircle(19, 12, 2.5);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(13, 12, 1.5);
          graphics.fillCircle(19, 12, 1.5);
          graphics.fillStyle(0xff9999);
          graphics.fillCircle(10, 15, 2);
          graphics.fillCircle(22, 15, 2);
          graphics.fillStyle(0x333333);
          graphics.fillRect(14, 18, 4, 1);
          //graphics.generateTexture("childArmored", 32, 32);
          
          // Boss child - bearded man style (like bearded man in image)
          graphics.clear();
          graphics.fillStyle(0xe67e22);
          graphics.fillRoundedRect(4, 14, 28, 22, 6);
          graphics.fillStyle(0xd35400);
          graphics.fillRoundedRect(6, 16, 24, 18, 4);
          graphics.fillStyle(0xf5deb3);
          graphics.fillCircle(18, 14, 8);
          // Brown beard
          graphics.fillStyle(0x8b4513);
          graphics.fillRoundedRect(10, 16, 16, 10, 4);
          graphics.fillCircle(18, 22, 6);
          // Brown hair
          graphics.fillStyle(0x654321);
          graphics.fillCircle(18, 8, 7);
          graphics.fillRect(11, 6, 14, 5);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(14, 12, 3);
          graphics.fillCircle(22, 12, 3);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(14, 12, 2);
          graphics.fillCircle(22, 12, 2);
         // graphics.generateTexture("childBoss", 36, 36);
          
          // Elite child - golden accented special child
          graphics.clear();
          graphics.fillStyle(0xffd700);
          graphics.fillCircle(16, 18, 14);
          graphics.fillStyle(0xdaa520);
          graphics.fillCircle(16, 18, 11);
          graphics.fillStyle(0x5b9bd5);
          graphics.fillRoundedRect(6, 14, 20, 14, 4);
          graphics.fillStyle(0xf5deb3);
          graphics.fillCircle(16, 12, 6);
          graphics.fillStyle(0xffd700);
          graphics.fillCircle(16, 6, 5);
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(13, 11, 2.5);
          graphics.fillCircle(19, 11, 2.5);
          graphics.fillStyle(0x333333);
          graphics.fillCircle(13, 11, 1.5);
          graphics.fillCircle(19, 11, 1.5);
          // Golden sparkles
          graphics.fillStyle(0xffd700);
          graphics.lineStyle(2, 0xffd700, 1);
          graphics.lineBetween(4, 6, 8, 10);
          graphics.lineBetween(28, 6, 24, 10);
          graphics.lineBetween(2, 16, 6, 16);
          graphics.lineBetween(30, 16, 26, 16);
          //graphics.generateTexture("childElite", 32, 32);
          
          // Winter Coin - golden with snow cap
          graphics.clear();
          // Main coin body
          graphics.fillStyle(0xffa500);
          graphics.fillCircle(12, 14, 10);
          graphics.fillStyle(0xffd700);
          graphics.fillCircle(12, 14, 8);
          graphics.fillStyle(0xffec8b);
          graphics.fillCircle(12, 14, 5);
          // "C" marking
          graphics.lineStyle(2, 0xdaa520, 1);
          graphics.beginPath();
          graphics.arc(12, 14, 4, -0.5, 3.5, false);
          graphics.strokePath();
          // Snow cap on top
          graphics.fillStyle(0xffffff);
          graphics.fillRoundedRect(4, 4, 16, 6, 3);
          graphics.fillCircle(6, 6, 4);
          graphics.fillCircle(18, 6, 4);
          graphics.fillCircle(12, 5, 5);
          // Icicles hanging
          graphics.fillStyle(0xe0f0ff);
          graphics.beginPath();
          graphics.moveTo(6, 8);
          graphics.lineTo(5, 12);
          graphics.lineTo(7, 8);
          graphics.closePath();
          graphics.fillPath();
          graphics.beginPath();
          graphics.moveTo(18, 8);
          graphics.lineTo(19, 11);
          graphics.lineTo(17, 8);
          graphics.closePath();
          graphics.fillPath();
          // Sparkles
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(20, 10, 2);
          graphics.fillCircle(22, 16, 1.5);
          graphics.fillCircle(4, 18, 1);
          graphics.generateTexture("coin", 24, 24);
          
          // XP Snowflake - glowing blue snowflake
          graphics.clear();
          // Outer glow
          graphics.fillStyle(0x1a4a6e);
          graphics.fillCircle(12, 12, 11);
          graphics.fillStyle(0x2a6a9e);
          graphics.fillCircle(12, 12, 9);
          // Snowflake shape - 6 arms
          graphics.lineStyle(3, 0x87ceeb, 1);
          for (let i = 0; i < 6; i++) {
            const angle = (i * Math.PI) / 3;
            graphics.lineBetween(
              12, 12,
              12 + Math.cos(angle) * 8,
              12 + Math.sin(angle) * 8
            );
            // Side branches
            const midX = 12 + Math.cos(angle) * 5;
            const midY = 12 + Math.sin(angle) * 5;
            graphics.lineBetween(
              midX, midY,
              midX + Math.cos(angle + 0.7) * 3,
              midY + Math.sin(angle + 0.7) * 3
            );
            graphics.lineBetween(
              midX, midY,
              midX + Math.cos(angle - 0.7) * 3,
              midY + Math.sin(angle - 0.7) * 3
            );
          }
          // Center crystal
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(12, 12, 3);
          graphics.fillStyle(0x87ceeb);
          graphics.fillCircle(12, 12, 2);
          // XP text indication (bright center)
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(12, 12, 1);
          // Sparkle particles
          graphics.fillStyle(0xffffff);
          graphics.fillCircle(4, 6, 1);
          graphics.fillCircle(20, 8, 1);
          graphics.fillCircle(6, 18, 1);
          graphics.fillCircle(18, 17, 1);
          graphics.generateTexture("xp", 24, 24);
          
          graphics.destroy();
          
          
        },
        create: function(this: Phaser.Scene) {
          const scene = this;
          const DIR = { FRONT: 0, BACK: 4, LEFT: 8, RIGHT: 12 };
          function faceByVelocity(sprite, vx, vy) {
            if (Math.abs(vx) > Math.abs(vy)) sprite.setFrame(vx < 0 ? DIR.LEFT : DIR.RIGHT);
            else sprite.setFrame(vy < 0 ? DIR.BACK : DIR.FRONT);
          }


          for (let i = 0; i < 20; i++) {
            const bgGraphics = this.add.graphics();
            const x = Phaser.Math.Between(0, 800);
            const buildingHeight = Phaser.Math.Between(100, 300);
            const buildingWidth = Phaser.Math.Between(40, 80);
            bgGraphics.fillStyle(theme === "dark" ? 0x2a2a4e : 0xb8d4e8, 0.6);
            bgGraphics.fillRect(x, 600 - buildingHeight, buildingWidth, buildingHeight);
            for (let row = 0; row < buildingHeight / 20; row++) {
              for (let col = 0; col < buildingWidth / 15; col++) {
                if (Math.random() > 0.3) {
                  bgGraphics.fillStyle(theme === "dark" ? 0xffff88 : 0xffffff, 0.8);
                  bgGraphics.fillRect(x + 5 + col * 15, 600 - buildingHeight + 5 + row * 20, 8, 12);
                }
              }
            }
            bgGraphics.setDepth(-10);
          }
          
          for (let i = 0; i < 50; i++) {
            const snow = this.add.circle(Phaser.Math.Between(0, 800), Phaser.Math.Between(0, 600), Phaser.Math.Between(1, 3), 0xffffff, 0.7);
            snow.setDepth(-5);
            this.tweens.add({
              targets: snow,
              y: 620,
              x: snow.x + Phaser.Math.Between(-50, 50),
              duration: Phaser.Math.Between(3000, 8000),
              repeat: -1,
              onRepeat: () => {
                snow.x = Phaser.Math.Between(0, 800);
                snow.y = -10;
              }
            });
          }
          const metaThrowBonus = 1 - (playerData.upgrades["throwRate"] || 0) * 0.08;
          const metaSpeedBonus = 1 + (playerData.upgrades["moveSpeed"] || 0) * 0.08;
          const metaCoinDropBonus = (playerData.upgrades["coinDropRate"] || 0) * 0.03; // +3% per level, max 45%
          
          // Get equipment and skill bonuses
          const extendedData = playerData as ExtendedPlayerData;
          const equipStats = getEquippedStats(extendedData);
          const skillStats = getSkillStats(extendedData);
          
          // Apply equipment bonuses (all values are treated as percentages, e.g., 0.1 = 10%)
          const equipSpeedBonus = 1 + Math.min(equipStats.speedBonus || 0, 0.5);
          const equipThrowBonus = Math.max(0.5, 1 - Math.min(equipStats.throwRateBonus || 0, 0.4));
          const equipHpBonus = Math.floor((equipStats.hpBonus || 0) * 10);
          const equipDamageBonus = 1 + Math.min(equipStats.damageBonus || 0, 0.5);
          const equipPickupBonus = Math.floor((equipStats.pickupRadiusBonus || 0) * 50);
          
          // Apply skill bonuses (all values are treated as percentages)
          const skillDamageBonus = 1 + Math.min(skillStats.damageBonus || 0, 0.5);
          const skillDefenseBonus = Math.max(0.5, 1 - Math.min(skillStats.defenseBonus || 0, 0.3));
          const skillSpeedBonus = 1 + Math.min(skillStats.speedBonus || 0, 0.3);
          const skillPickupBonus = Math.floor(skillStats.pickupBonus || 0);
          
          const isLevelMode = gameState.gameMode === "levels";
          const levelConfig = isLevelMode ? getLevelConfig(gameState.currentLevel) : null;
          const LEVEL_DURATION = 300000; // 5 minutes in milliseconds
          
          const totalDamageMultiplier = equipDamageBonus * skillDamageBonus;
          const baseHp = gameState.maxHp + equipHpBonus;
          
          // Calculate spawn rate for level mode using the spawn rate multiplier
          const baseLevelSpawnRate = levelConfig ? Math.max(200, 600 / levelConfig.spawnRateMultiplier) : 600;
          
          const gameData = {
            player: null as Phaser.Physics.Arcade.Sprite | null,
            children: null as Phaser.Physics.Arcade.Group | null,
            gifts: null as Phaser.Physics.Arcade.Group | null,
            pickups: null as Phaser.Physics.Arcade.Group | null,
            cursors: null as Phaser.Types.Input.Keyboard.CursorKeys | null,
            wasd: null as { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null,
            lastThrow: 0,
            baseThrowRate: 280 * metaThrowBonus * equipThrowBonus,
            baseSpawnRate: isLevelMode ? baseLevelSpawnRate : 600,
            lastSpawn: 0,
            baseMoveSpeed: 280 * metaSpeedBonus * equipSpeedBonus * skillSpeedBonus,
            gameTime: 0,
            score: 0,
            childrenHelped: 0,
            coinsEarned: (playerData as ExtendedPlayerData).hasGamePass ? 100 : 0,
            xp: 0,
            level: 1,
            hp: baseHp,
            maxHp: baseHp,
            projectileCount: 1,
            pickupRadius: 60 + equipPickupBonus + skillPickupBonus,
            hasSpeedBoost: false,
            speedBoostTimer: 0,
            hasWarmthAura: false,
            hasBoomerang: false,
            hasSplash: false,
            hasCocoa: false,
            lastTimeSurvived: 0,
            waveTimer: 0,
            waveNumber: 1,
            helpedForHealing: 0,
            levelDifficulty: levelConfig ? levelConfig.difficulty : 1,
            levelConfig: levelConfig,
            levelDuration: LEVEL_DURATION,
            miniBoss1Spawned: false,
            miniBoss2Spawned: false,
            finalBossSpawned: false,
            currentBoss: null as Phaser.Physics.Arcade.Sprite | null,
            gameMode: gameState.gameMode,
            damageMultiplier: totalDamageMultiplier,
            defenseMultiplier: skillDefenseBonus,
            lastBossSpawn: 0,
            bossSpawnInterval: 90000, // 1:30 for bosses
            playerSlowed: false,
            playerSlowTimer: 0,
            pendingLevelUps: 0,
            vampiricKillCount: 0,
            regenerationTimer: 0,
            lastMovementDirection: { x: 0, y: 0 },
            playerDashCooldown: 0,
            doubleTapTimer: 0,
            metaCoinDropBonus: Math.min(metaCoinDropBonus, 0.45), // capped at 45%
          };

          gameData.player = scene.physics.add.sprite(400, 300, "player", DIR.FRONT);
          gameData.player.setScale(0.35);
          gameData.player.setCollideWorldBounds(true);

          gameData.player.setCollideWorldBounds(true);
          gameData.player.setDepth(10);
          
          const extData = playerData as ExtendedPlayerData;
          if (extData.equippedSkin && SKIN_DATA[extData.equippedSkin]) {
            gameData.player.setTint(SKIN_DATA[extData.equippedSkin].color);
          }

          gameData.children = scene.physics.add.group();
          gameData.gifts = scene.physics.add.group();
          gameData.pickups = scene.physics.add.group();

          if (scene.input.keyboard) {
            gameData.cursors = scene.input.keyboard.createCursorKeys();
            gameData.wasd = {
              W: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
              A: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
              S: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
              D: scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
            };
          }

          const helpChild = (childSprite: Phaser.Physics.Arcade.Sprite, skipSplit?: boolean) => {
            const specialAbility = (childSprite as any).specialAbility;
            const isBoss = (childSprite as any).isBoss;
            soundManager.playHit();
            const bossReward = (childSprite as any).coinReward || 0;
            
            // Handle split ability - spawn 2 smaller enemies
            if (specialAbility === "split" && !skipSplit) {
              for (let i = 0; i < 2; i++) {
                const offset = i === 0 ? -20 : 20;
                const splitChild = scene.physics.add.sprite(childSprite.x + offset, childSprite.y, "firstMob", DIR.FRONT);
                splitChild.setScale(0.7);

                gameData.children?.add(splitChild);
                (splitChild as any).hitsNeeded = 1;
                (splitChild as any).childType = "firstMob";
                (splitChild as any).baseSpeed = 100 + Math.floor(gameData.gameTime / 1000 / 30) * 10;
                (splitChild as any).frozen = false;
                (splitChild as any).freezeTimer = 0;
                (splitChild as any).specialAbility = null;
              }
            }
            
            for (let i = 0; i < (isBoss ? 10 : 5); i++) {
              const particle = scene.add.circle(
                childSprite.x + Phaser.Math.Between(-15, 15),
                childSprite.y + Phaser.Math.Between(-15, 15),
                isBoss ? 5 : 3,
                isBoss ? 0xff88ff : 0xffd700
              );
              scene.tweens.add({
                targets: particle,
                alpha: 0,
                y: particle.y - 30,
                duration: 500,
                onComplete: () => particle.destroy(),
              });
            }

            const coinX = childSprite.x;
            const coinY = childSprite.y;
            childSprite.destroy();

            // Percentage-based coin drops: base 5%, Lucky Star adds +15%, workshop adds up to 45% (max 50%)
            const currentHasLuckyStar = upgradesRef.current.includes("luckyStar");
            let baseCoinDropChance = 0.05; // 5% base chance
            baseCoinDropChance += gameData.metaCoinDropBonus || 0; // Workshop bonus
            if (currentHasLuckyStar) {
              baseCoinDropChance += 0.15; // +15% with Lucky Star in-run upgrade
            }
            // Cap at 50%
            baseCoinDropChance = Math.min(baseCoinDropChance, 0.5);
            
            // Boss always drops coins, regular enemies use percentage
            const shouldDropCoin = isBoss || Math.random() < baseCoinDropChance;
            
            if (shouldDropCoin) {
              const coinCount = isBoss ? 5 : 1;
              for (let c = 0; c < coinCount; c++) {
                const coin = scene.physics.add.sprite(coinX + (c - 2) * 15, coinY, "coin");
                gameData.pickups?.add(coin);
                if (isBoss) {
                  (coin as any).coinValue = Math.floor(bossReward / 5);
                }
              }
            }
            
            const xpOrb = scene.physics.add.sprite(coinX + 10, coinY, "xp");
            gameData.pickups?.add(xpOrb);
            (xpOrb as any).isXP = true;

            gameData.score += isBoss ? 100 : 10;
            gameData.childrenHelped++;
            
            // Handle levels mode boss defeats
            const isMiniBoss = (childSprite as any).isMiniBoss;
            const isFinalBoss = (childSprite as any).isFinalBoss;
            const miniBossIndex = (childSprite as any).miniBossIndex;
            
            if (gameData.gameMode === "levels") {
              if (isMiniBoss && miniBossIndex === 1) {
                soundManager.playBossDefeated();
                setGameState(prev => ({
                  ...prev,
                  score: gameData.score,
                  childrenHelped: gameData.childrenHelped,
                  miniBoss1Defeated: true,
                  levelPhase: "harder",
                  bossActive: false,
                }));
                return;
              } else if (isMiniBoss && miniBossIndex === 2) {
                soundManager.playBossDefeated();
                setGameState(prev => ({
                  ...prev,
                  score: gameData.score,
                  childrenHelped: gameData.childrenHelped,
                  miniBoss2Defeated: true,
                  levelPhase: "intense",
                  bossActive: false,
                }));
                return;
              } else if (isFinalBoss) {
                soundManager.playBossDefeated();
                // Level complete!
                const levelConfig = gameData.levelConfig;
                if (levelConfig) {
                  // Award coins and XP
                  gameData.coinsEarned += levelConfig.rewards.coins;
                  addCoins(levelConfig.rewards.coins);
                  
                  // Calculate stars based on performance
                  const stars = gameData.hp >= gameData.maxHp * 0.8 ? 3 : 
                               gameData.hp >= gameData.maxHp * 0.5 ? 2 : 1;
                  
                  // Save level progress
                  completeLevel(levelConfig.id, stars, Math.floor(gameData.gameTime / 1000));
                  setPlayerData(getPlayerData());
                }
                
                // Award a chest for completing the level
                const earnedChest = awardChest(levelConfig.id);
                
                setGameState(prev => ({
                  ...prev,
                  score: gameData.score,
                  childrenHelped: gameData.childrenHelped,
                  finalBossDefeated: true,
                  levelPhase: "complete",
                  bossActive: false,
                  showLevelComplete: true,
                  isPaused: true,
                  coinsEarned: gameData.coinsEarned,
                  earnedChest: earnedChest,
                  chestReward: null,
                }));
                return;
              }
            }

            setGameState(prev => ({
              ...prev,
              score: gameData.score,
              childrenHelped: gameData.childrenHelped,
            }));
          };

          scene.physics.add.overlap(gameData.gifts, gameData.children, (gift, child) => {
            const giftSprite = gift as Phaser.Physics.Arcade.Sprite;
            const childSprite = child as Phaser.Physics.Arcade.Sprite;
            const hasSplash = (giftSprite as any).hasSplash;
            const hasBoomerang = (giftSprite as any).hasBoomerang;
            const hasPiercing = (giftSprite as any).hasPiercing;
            const hasFreeze = (giftSprite as any).hasFreeze;
            const hasChain = (giftSprite as any).hasChain;
            const hasCrit = (giftSprite as any).hasCrit;
            const giftHasFrostbite = (giftSprite as any).hasFrostbite;
            const giftHasShieldBreaker = (giftSprite as any).hasShieldBreaker;
            const giftHasGiftWaveSynergy = (giftSprite as any).hasGiftWaveSynergy;
            
            // Shield mechanic - check if hit from front (50% chance to block)
            const specialAbility = (childSprite as any).specialAbility;
            if (specialAbility === "shield" && !giftHasShieldBreaker) {
              const giftAngle = Math.atan2(giftSprite.y - childSprite.y, giftSprite.x - childSprite.x);
              const facingAngle = (childSprite as any).facingAngle || 0;
              const angleDiff = Math.abs(giftAngle - facingAngle);
              // If hit from front (within 90 degrees), 60% chance to block
              if (angleDiff > Math.PI / 2 && angleDiff < 3 * Math.PI / 2 && Math.random() < 0.6) {
                // Shield blocks the hit - create shield effect
                const shieldEffect = scene.add.circle(childSprite.x, childSprite.y, 20, 0xffcc00, 0.5);
                scene.tweens.add({
                  targets: shieldEffect,
                  alpha: 0,
                  scale: 1.5,
                  duration: 200,
                  onComplete: () => shieldEffect.destroy(),
                });
                giftSprite.destroy();
                return;
              }
            }
            
            const hitsNeeded = (childSprite as any).hitsNeeded || 1;
            const isFrozen = (childSprite as any).frozen;
            const frostbiteDamageMultiplier = (giftHasFrostbite && isFrozen) ? 2 : 1;
            (childSprite as any).hitsNeeded = hitsNeeded - frostbiteDamageMultiplier;
            
            const currentActiveSynergies = getActiveSynergies(upgradesRef.current);
            const currentHasDeepFreezeSynergy = currentActiveSynergies.some(s => s.id === "deepFreeze");
            const freezeDuration = currentHasDeepFreezeSynergy ? 3000 : 2000;
            
            if (hasFreeze && !((childSprite as any).frozen)) {
              (childSprite as any).frozen = true;
              (childSprite as any).freezeTimer = freezeDuration;
              childSprite.setTint(0x88ccff);
            }
            
            for (let i = 0; i < 8; i++) {
              const particle = scene.add.circle(
                childSprite.x + Phaser.Math.Between(-15, 15),
                childSprite.y + Phaser.Math.Between(-15, 15),
                Phaser.Math.Between(2, 5),
                hasCrit && Math.random() < 0.2 ? 0xff00ff : 0xffd700
              );
              scene.tweens.add({
                targets: particle,
                alpha: 0,
                y: particle.y - 30,
                scale: 0,
                duration: 400,
                onComplete: () => particle.destroy(),
              });
            }
            
            if ((childSprite as any).hitsNeeded <= 0) {
              if (hasSplash && gameData.children) {
                const splashRadius = 100;
                const splashCircle = scene.add.circle(childSprite.x, childSprite.y, splashRadius, 0xffa500, 0.3);
                scene.tweens.add({
                  targets: splashCircle,
                  alpha: 0,
                  scale: 1.5,
                  duration: 300,
                  onComplete: () => splashCircle.destroy(),
                });
                const nearbyChildren = gameData.children.getChildren().filter((c: any) => {
                  if (c === childSprite) return false;
                  const dist = Phaser.Math.Distance.Between(childSprite.x, childSprite.y, c.x, c.y);
                  return dist < splashRadius;
                });
                nearbyChildren.forEach((nearby: any) => {
                  (nearby as any).hitsNeeded = ((nearby as any).hitsNeeded || 1) - 1;
                  if ((nearby as any).hitsNeeded <= 0 && nearby.active) {
                    helpChild(nearby as Phaser.Physics.Arcade.Sprite);
                  }
                });
              }
              
              if (hasChain && gameData.children && gameData.gifts) {
                const chainTargetCount = giftHasGiftWaveSynergy ? 3 : 2;
                const chainTargets = gameData.children.getChildren().filter((c: any) => {
                  if (c === childSprite || !c.active) return false;
                  const dist = Phaser.Math.Distance.Between(childSprite.x, childSprite.y, c.x, c.y);
                  return dist < 150;
                }).slice(0, chainTargetCount);
                
                chainTargets.forEach((target: any) => {
                  const chainGift = scene.physics.add.sprite(childSprite.x, childSprite.y, "gift");
                  chainGift.setTint(0x00ff00);
                  gameData.gifts!.add(chainGift);
                  const angle = Phaser.Math.Angle.Between(childSprite.x, childSprite.y, target.x, target.y);
                  chainGift.setVelocity(Math.cos(angle) * 500, Math.sin(angle) * 500);
                  scene.time.delayedCall(800, () => { if (chainGift.active) chainGift.destroy(); });
                });
              }
              
              const scoreMultiplier = hasCrit && Math.random() < 0.2 ? 2 : 1;
              gameData.score += 10 * scoreMultiplier;
              gameData.childrenHelped++;
              gameData.helpedForHealing++;
              
              const currentHasLifeForceSynergy = currentActiveSynergies.some(s => s.id === "lifeForce");
              const healingTouchThreshold = 10;
              const vampiricThreshold = currentHasLifeForceSynergy ? 15 : 20;
              
              if (gameData.helpedForHealing >= healingTouchThreshold) {
                const hasHealing = upgradesRef.current.includes("healingTouch");
                if (hasHealing) {
                  gameData.hp = Math.min(gameData.maxHp, gameData.hp + 5);
                  setGameState(prev => ({ ...prev, hp: gameData.hp }));
                }
                gameData.helpedForHealing = 0;
              }
              
              if (!gameData.vampiricKillCount) gameData.vampiricKillCount = 0;
              gameData.vampiricKillCount++;
              if (gameData.vampiricKillCount >= vampiricThreshold) {
                const hasVampiric = upgradesRef.current.includes("vampiric");
                if (hasVampiric) {
                  gameData.hp = Math.min(gameData.maxHp, gameData.hp + 1);
                  setGameState(prev => ({ ...prev, hp: gameData.hp }));
                }
                gameData.vampiricKillCount = 0;
              }
              
              helpChild(childSprite);
              setGameState(prev => ({
                ...prev,
                score: gameData.score,
                childrenHelped: gameData.childrenHelped,
              }));
              
            }
            
            const piercingCount = (giftSprite as any).piercingCount || 0;
            if (hasBoomerang && !(giftSprite as any).returning) {
              (giftSprite as any).returning = true;
            } else if (hasPiercing && piercingCount < 2) {
              (giftSprite as any).piercingCount = piercingCount + 1;
            } else if (!hasBoomerang && !hasPiercing) {
              giftSprite.destroy();
            } else if (!hasPiercing) {
              giftSprite.destroy();
            }
          });

          scene.physics.add.overlap(gameData.player, gameData.pickups, (player, pickup) => {
            const pickupSprite = pickup as Phaser.Physics.Arcade.Sprite;
            
            // Prevent duplicate collection - check if already collected
            if ((pickupSprite as any).collected) return;
            (pickupSprite as any).collected = true;
            
            const isXP = (pickupSprite as any).isXP;
            
            if (gameData.hasCocoa) {
              gameData.hasSpeedBoost = true;
              gameData.speedBoostTimer = 2000;
            }
            
            if (isXP) {
              soundManager.playXPCollect();
              const extendedPlayerData = playerData as ExtendedPlayerData;
              // XP per orb (Game Pass doubles it)
              const xpAmount = extendedPlayerData.hasGamePass ? 8 : 4;
              gameData.xp += xpAmount;
              
              // 25 kills for level 1, then +10% more each level
              // Formula: floor(25 * 1.1^(level-1)) * 4 XP per kill
              let xpToLevel = Math.floor(25 * Math.pow(1.1, gameData.level - 1)) * 4;
              
              // Check if we leveled up (only 1 level at a time to prevent bugs)
              if (gameData.xp >= xpToLevel) {
                gameData.xp -= xpToLevel;
                gameData.level++;
                
                // Sync pending level-ups from React state, then add 1
                const currentPending = gameStateRef.current.pendingLevelUps || 0;
                const newPendingLevelUps = currentPending + 1;
                
                const isAlreadyShowingLevelUp = gameStateRef.current.showLevelUp;
                
                if (!isAlreadyShowingLevelUp) {
                  // Filter out non-stacking upgrades that are already owned
                  const ownedUpgrades = upgradesRef.current;
                  const availableUpgrades = IN_RUN_UPGRADES.filter(upgrade => {
                    if (NON_STACKING_UPGRADES.includes(upgrade.id)) {
                      return !ownedUpgrades.includes(upgrade.id);
                    }
                    return true;
                  });
                  
                  const choices = [...availableUpgrades]
                    .sort(() => Math.random() - 0.5)
                    .slice(0, 3);
                  
                  scene.physics.pause();
                  soundManager.playLevelUp();
                  
                  setGameState(prev => ({
                    ...prev,
                    level: gameData.level,
                    xp: gameData.xp,
                    xpToLevel: Math.floor(25 * Math.pow(1.1, gameData.level - 1)) * 4,
                    showLevelUp: true,
                    pendingLevelUps: newPendingLevelUps,
                    levelUpChoices: choices,
                  }));
                } else {
                  setGameState(prev => ({
                    ...prev,
                    level: gameData.level,
                    xp: gameData.xp,
                    xpToLevel: Math.floor(25 * Math.pow(1.1, gameData.level - 1)) * 4,
                    pendingLevelUps: newPendingLevelUps,
                  }));
                }
              } else {
                setGameState(prev => ({
                  ...prev,
                  xp: gameData.xp,
                }));
              }
            } else {
              soundManager.playCoinCollect();
              let coinValue = (pickupSprite as any).coinValue || 5;
              
              const currentHasTreasureHunter = upgradesRef.current.includes("treasureHunter");
              if (currentHasTreasureHunter) {
                coinValue = Math.floor(coinValue * 1.5);
              }
              
              gameData.coinsEarned += coinValue;
              setGameState(prev => ({
                ...prev,
                coinsEarned: gameData.coinsEarned,
              }));
            }
            
            pickupSprite.destroy();
          });

          scene.physics.add.overlap(gameData.player, gameData.children, (player, child) => {
            const childSprite = child as Phaser.Physics.Arcade.Sprite;
            const specialAbility = (childSprite as any).specialAbility;
            
            const damageReduction = (gameData.hasWarmthAura ? 0.5 : 1) * gameData.defenseMultiplier;
            gameData.hp -= 1 * damageReduction;
            soundManager.playPlayerHurt();
            setGameState(prev => ({
              ...prev,
              hp: Math.floor(gameData.hp),
            }));
            
            // Thorns - enemies that touch player take 1 damage
            const currentHasThorns = upgradesRef.current.includes("thorns");
            if (currentHasThorns) {
              const currentHits = (childSprite as any).hitsNeeded || 1;
              (childSprite as any).hitsNeeded = currentHits - 1;
              
              const thornEffect = scene.add.circle(childSprite.x, childSprite.y, 15, 0xff4444, 0.6);
              scene.tweens.add({
                targets: thornEffect,
                alpha: 0,
                scale: 1.5,
                duration: 200,
                onComplete: () => thornEffect.destroy(),
              });
              
              if ((childSprite as any).hitsNeeded <= 0) {
                const coinX = childSprite.x;
                const coinY = childSprite.y;
                childSprite.destroy();
                
                // Same percentage-based coin drops for thorns kills
                const currentHasLuckyStar = upgradesRef.current.includes("luckyStar");
                let baseCoinDropChance = 0.05;
                baseCoinDropChance += gameData.metaCoinDropBonus || 0;
                if (currentHasLuckyStar) baseCoinDropChance += 0.15;
                baseCoinDropChance = Math.min(baseCoinDropChance, 0.5);
                
                if (Math.random() < baseCoinDropChance) {
                  const coin = scene.physics.add.sprite(coinX, coinY, "coin");
                  gameData.pickups?.add(coin);
                }
                
                const xpOrb = scene.physics.add.sprite(coinX + 10, coinY, "xp");
                gameData.pickups?.add(xpOrb);
                (xpOrb as any).isXP = true;
                
                gameData.score += 10;
                gameData.childrenHelped++;
                setGameState(prev => ({ ...prev, score: gameData.score, childrenHelped: gameData.childrenHelped }));
              }
            }
            
            // SlowPlayer ability - freeze player temporarily
            if (specialAbility === "slowPlayer") {
              gameData.playerSlowed = true;
              gameData.playerSlowTimer = 1500;
              gameData.player?.setTint(0x88ccff);
            }
            
            if (gameData.hp <= 0) {
              soundManager.playGameOver();
              endGameRef.current();
            }
          });

          const BOSS_CONFIG = {
            frostGiant: {
              sprite: "firstBoss",
              scale: 1.3,
              baseHp: 8,
              speed: 40,
            },
            blizzardKing: {
              sprite: "secondBoss",
              scale: 1.4,
              baseHp: 10,
              speed: 35,
            },
            iceDragon: {
              sprite: "thirdBoss",
              scale: 1.5,
              baseHp: 12,
              speed: 45,
            },
          };

          (scene as any).gameData = gameData;
        },
        



        update: function(this: Phaser.Scene, time: number, delta: number)
        {
          const gameData = (this as any).gameData;
          if (!gameData || !gameData.player || gameStateRef.current.isPaused || gameStateRef.current.showLevelUp || gameStateRef.current.showLevelComplete) return;

          const currentUpgrades = upgradesRef.current;
          const fasterThrowCount = currentUpgrades.filter(u => u === "fasterThrow").length;
          const biggerBagCount = currentUpgrades.filter(u => u === "biggerBag").length;
          const hasCocoa = currentUpgrades.includes("cocoaBoost");
          const hasWarmth = currentUpgrades.includes("warmthAura");
          const hasBoomerang = currentUpgrades.includes("giftBoomerang");
          const hasSplash = currentUpgrades.includes("giftSplash");
          const magnetCount = currentUpgrades.filter(u => u === "coinMagnet").length;
          
          const hasHaste = currentUpgrades.includes("haste");
          const hasRegeneration = currentUpgrades.includes("regeneration");
          const hasDoubleJump = currentUpgrades.includes("doubleJump");
          const hasGiftBarrage = currentUpgrades.includes("giftBarrage");
          const hasMultiShot = currentUpgrades.includes("multiShot");
          const hasTimeWarp = currentUpgrades.includes("timeWarp");
          const hasThorns = currentUpgrades.includes("thorns");
          const hasFrostbite = currentUpgrades.includes("frostbite");
          const hasTreasureHunter = currentUpgrades.includes("treasureHunter");
          const hasVampiric = currentUpgrades.includes("vampiric");
          const hasShieldBreaker = currentUpgrades.includes("shieldBreaker");
          const hasLuckyStar = currentUpgrades.includes("luckyStar");
          
          const activeSynergies = getActiveSynergies(currentUpgrades);
          const hasGiftStormSynergy = activeSynergies.some(s => s.id === "giftStorm");
          const hasDeepFreezeSynergy = activeSynergies.some(s => s.id === "deepFreeze");
          const hasTreasureMasterSynergy = activeSynergies.some(s => s.id === "treasureMaster");
          const hasGiftWaveSynergy = activeSynergies.some(s => s.id === "giftWave");
          const hasLifeForceSynergy = activeSynergies.some(s => s.id === "lifeForce");
          
          const throwRate = gameData.baseThrowRate * Math.pow(0.8, fasterThrowCount);
          const projectileCount = 1 + biggerBagCount;
          const slowMultiplier = gameData.playerSlowed ? 0.4 : 1;
          const hasteMultiplier = hasHaste ? 1.15 : 1;
          const moveSpeed = gameData.baseMoveSpeed * (gameData.hasSpeedBoost ? 1.5 : 1) * slowMultiplier * hasteMultiplier;
          const baseMagnetRadius = 50 + magnetCount * 25;
          const pickupRadius = hasTreasureMasterSynergy ? baseMagnetRadius * 1.5 : baseMagnetRadius;

          gameData.gameTime += delta;
          const timeSurvived = Math.floor(gameData.gameTime / 1000);
          
          // Calculate danger level for display - combines time scaling, difficulty, and speed multipliers
          const baseDifficulty = gameData.levelDifficulty * (1 + timeSurvived / 30);
          const baseTimeScaling = Math.max(0.3, 1 - timeSurvived / 180);
          const baseSpeedMultiplier = Math.min(1.5, 1 + Math.floor(timeSurvived / 30) * 0.05);
          const calculatedDangerLevel = (1 / baseTimeScaling) * baseDifficulty * baseSpeedMultiplier;
          
          if (timeSurvived !== gameData.lastTimeSurvived) {
            gameData.lastTimeSurvived = timeSurvived;
            setGameState(prev => ({ ...prev, timeSurvived, dangerLevel: calculatedDangerLevel }));
          }

          if (gameData.hasSpeedBoost) {
            gameData.speedBoostTimer -= delta;
            if (gameData.speedBoostTimer <= 0) {
              gameData.hasSpeedBoost = false;
            }
          }
          
          // Handle player slow effect
          if (gameData.playerSlowed) {
            gameData.playerSlowTimer -= delta;
            if (gameData.playerSlowTimer <= 0) {
              gameData.playerSlowed = false;
              gameData.player?.setTint(0xffffff);
            }
          }
          
          // Handle regeneration - heal 1 HP every 15 seconds
          if (hasRegeneration) {
            if (!gameData.regenerationTimer) gameData.regenerationTimer = 0;
            gameData.regenerationTimer += delta;
            if (gameData.regenerationTimer >= 15000) {
              gameData.regenerationTimer = 0;
              if (gameData.hp < gameData.maxHp) {
                gameData.hp = Math.min(gameData.maxHp, gameData.hp + 1);
                setGameState(prev => ({ ...prev, hp: gameData.hp }));
              }
            }
          }
          
          let vx = 0, vy = 0;
          if (gameData.cursors?.left.isDown || gameData.wasd?.A.isDown) vx = -1;
          if (gameData.cursors?.right.isDown || gameData.wasd?.D.isDown) vx = 1;
          if (gameData.cursors?.up.isDown || gameData.wasd?.W.isDown) vy = -1;
          if (gameData.cursors?.down.isDown || gameData.wasd?.S.isDown) vy = 1;
          
          const len = Math.sqrt(vx * vx + vy * vy);
          if (len > 0) {
            vx = (vx / len) * moveSpeed;
            vy = (vy / len) * moveSpeed;
          }
          gameData.player.setVelocity(vx, vy);
          
          // Handle double jump/dash ability
          if (hasDoubleJump) {
            if (!gameData.lastMovementDirection) gameData.lastMovementDirection = { x: 0, y: 0 };
            if (!gameData.playerDashCooldown) gameData.playerDashCooldown = 0;
            if (!gameData.doubleTapTimer) gameData.doubleTapTimer = 0;
            
            gameData.playerDashCooldown = Math.max(0, gameData.playerDashCooldown - delta);
            gameData.doubleTapTimer = Math.max(0, gameData.doubleTapTimer - delta);
            
            const currentDir = { x: vx !== 0 ? Math.sign(vx) : 0, y: vy !== 0 ? Math.sign(vy) : 0 };
            const sameDirection = currentDir.x === gameData.lastMovementDirection.x && 
                                  currentDir.y === gameData.lastMovementDirection.y;
            
            if ((currentDir.x !== 0 || currentDir.y !== 0) && gameData.doubleTapTimer > 0 && sameDirection && gameData.playerDashCooldown <= 0) {
              gameData.playerDashCooldown = 1000;
              const dashMultiplier = 3;
              gameData.player.setVelocity(currentDir.x * moveSpeed * dashMultiplier, currentDir.y * moveSpeed * dashMultiplier);
            }
            
            if (currentDir.x !== 0 || currentDir.y !== 0) {
              if (!sameDirection || gameData.doubleTapTimer <= 0) {
                gameData.doubleTapTimer = 200;
              }
              gameData.lastMovementDirection = currentDir;
            }
          }

          if (time - gameData.lastThrow > throwRate) {
            gameData.lastThrow = time;
            
            const children = gameData.children.getChildren() as Phaser.Physics.Arcade.Sprite[];
            const baseSpeed = 550;
            const speed = hasGiftStormSynergy ? baseSpeed * 1.1 : baseSpeed;
            
            const createGift = (angle: number) => {
              const gift = this.physics.add.sprite(gameData.player.x, gameData.player.y, "gift");
              gameData.gifts.add(gift);
              soundManager.playThrow();
              (gift as any).hasSplash = hasSplash;
              (gift as any).hasBoomerang = hasBoomerang;
              (gift as any).hasPiercing = currentUpgrades.includes("piercing");
              (gift as any).hasFreeze = currentUpgrades.includes("freezeBlast");
              (gift as any).hasChain = currentUpgrades.includes("giftChain");
              (gift as any).hasCrit = currentUpgrades.includes("criticalGift");
              (gift as any).hasFrostbite = hasFrostbite;
              (gift as any).hasShieldBreaker = hasShieldBreaker;
              (gift as any).hasGiftWaveSynergy = hasGiftWaveSynergy;
              (gift as any).startX = gameData.player.x;
              (gift as any).startY = gameData.player.y;
              (gift as any).returning = false;
              (gift as any).piercingCount = 0;
              gift.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
              this.time.delayedCall(2500, () => { if (gift.active) gift.destroy(); });
              return gift;
            };
            
            if (hasMultiShot) {
              const directions = [0, Math.PI / 2, Math.PI, 3 * Math.PI / 2];
              directions.forEach(angle => createGift(angle));
            } else if (children.length > 0) {
              const sortedChildren = [...children].sort((a, b) => {
                const distA = Phaser.Math.Distance.Between(gameData.player.x, gameData.player.y, a.x, a.y);
                const distB = Phaser.Math.Distance.Between(gameData.player.x, gameData.player.y, b.x, b.y);
                return distA - distB;
              });
              
              for (let i = 0; i < Math.min(projectileCount, sortedChildren.length); i++) {
                const target = sortedChildren[i];
                const angle = Phaser.Math.Angle.Between(
                  gameData.player.x, gameData.player.y,
                  target.x, target.y
                );
                
                if (hasGiftBarrage && i === 0) {
                  createGift(angle - 0.2);
                  createGift(angle);
                  createGift(angle + 0.2);
                } else {
                  createGift(angle);
                }
              }
            }
          }

          gameData.pickups.getChildren().forEach((pickup: any) => {
            const pickupSprite = pickup as Phaser.Physics.Arcade.Sprite;
            const dist = Phaser.Math.Distance.Between(
              gameData.player.x, gameData.player.y,
              pickupSprite.x, pickupSprite.y
            );
            if (dist < pickupRadius && dist > 20) {
              const angle = Phaser.Math.Angle.Between(
                pickupSprite.x, pickupSprite.y,
                gameData.player.x, gameData.player.y
              );
              const magnetSpeed = 150;
              pickupSprite.setVelocity(Math.cos(angle) * magnetSpeed, Math.sin(angle) * magnetSpeed);
            }
          });

          if (hasCocoa) {
            gameData.hasCocoa = true;
          }

          const difficulty = gameData.levelDifficulty * (1 + timeSurvived / 30);
          // Aggressive spawn rate scaling: baseSpawnRate * Math.max(0.3, 1 - timeSurvived/180)
          const timeScaling = Math.max(0.3, 1 - timeSurvived / 180);
          const currentSpawnRate = Math.max(150, gameData.baseSpawnRate * timeScaling / difficulty);
          
          // Calculate speed scaling: 5% increase every 30 seconds, capped at 50%
          const speedMultiplier = Math.min(1.5, 1 + Math.floor(timeSurvived / 30) * 0.05);
          
          // Calculate danger level for HUD
          const dangerLevel = (1 / timeScaling) * difficulty * speedMultiplier;
          
          gameData.waveTimer += delta;
          if (gameData.waveTimer > 15000) {
            gameData.waveTimer = 0;
            gameData.waveNumber++;
            setGameState(prev => ({ ...prev, waveNumber: gameData.waveNumber, dangerLevel: dangerLevel }));
          }
          
          if (time - gameData.lastSpawn > currentSpawnRate) {
            gameData.lastSpawn = time;
            
            // More enemies per spawn: up to 6 enemies after 90s
            const spawnCount = Math.min(6, 1 + Math.floor(timeSurvived / 20));
            
            for (let s = 0; s < spawnCount; s++) {
              const side = Phaser.Math.Between(0, 3);
              let x = 0, y = 0;
              switch (side) {
                case 0: x = Phaser.Math.Between(0, 800); y = -20; break;
                case 1: x = 820; y = Phaser.Math.Between(0, 600); break;
                case 2: x = Phaser.Math.Between(0, 800); y = 620; break;
                case 3: x = -20; y = Phaser.Math.Between(0, 600); break;
              }
              
              const roll = Math.random();
              let childType = "child";
              let childSpeed = (80 + difficulty * 15) * speedMultiplier;
              let hitsNeeded = 1;
              let specialAbility: string | null = null;
              
              // Dynamic spawn chances based on time survived
              const eliteChance = timeSurvived > 120 ? 0.08 : 0;
              const armoredChance = timeSurvived > 60 ? 0.30 : 0.15;
              const fastChance = timeSurvived > 45 ? 0.40 : 0.25;
              
              // Enemy variations with special abilities
              if (roll < eliteChance && timeSurvived > 120) {
                // Elite - tough, fast, gold-colored
                childType = "childElite";
                childSpeed = (100 + difficulty * 15) * speedMultiplier * 1.2;
                hitsNeeded = 5;
                specialAbility = "elite";
              } else if (roll < eliteChance + 0.06 && timeSurvived > 45) {
                // Dasher - charges quickly at player
                childType = "secondMob";
                childSpeed = (60 + difficulty * 10) * speedMultiplier;
                hitsNeeded = 1;
                specialAbility = "dash";
              } else if (roll < eliteChance + 0.12 && timeSurvived > 40) {
                // Shielded - extra tough from front
                childType = "thirdMob";
                childSpeed = (45 + difficulty * 6) * speedMultiplier;
                hitsNeeded = 4;
                specialAbility = "shield";
              } else if (roll < eliteChance + 0.18 && timeSurvived > 35) {
                // Freezer - slows player on hit
                childType = "childArmored";
                childSpeed = (50 + difficulty * 8) * speedMultiplier;
                hitsNeeded = 2;
                specialAbility = "slowPlayer";
              } else if (roll < eliteChance + 0.25 && timeSurvived > 25) {
                // Splitter - splits into 2 smaller enemies on death
                childType = "child";
                childSpeed = (70 + difficulty * 12) * speedMultiplier;
                hitsNeeded = 2;
                specialAbility = "split";
              } else if (roll < eliteChance + armoredChance && timeSurvived > 30) {
                // Armored - harder to defeat
                childType = "childArmored";
                childSpeed = (50 + difficulty * 8) * speedMultiplier;
                hitsNeeded = 3;
              } else if (roll < eliteChance + armoredChance + fastChance && timeSurvived > 15) {
                // Fast enemy
                childType = "childFast";
                childSpeed = (140 + difficulty * 20) * speedMultiplier;
                hitsNeeded = 1;
              }
              
              const child = this.physics.add.sprite(x, y, childType);
              gameData.children.add(child);
              
              // Apply level mode multipliers to HP and speed
              let finalHitsNeeded = hitsNeeded;
              let finalSpeed = childSpeed;
              if (gameData.gameMode === "levels" && gameData.levelConfig) {
                finalHitsNeeded = Math.ceil(hitsNeeded * gameData.levelConfig.enemyHealthMultiplier);
                finalSpeed = childSpeed * gameData.levelConfig.enemySpeedMultiplier;
              }
              
              (child as any).hitsNeeded = finalHitsNeeded;
              (child as any).childType = childType;
              (child as any).baseSpeed = finalSpeed;
              (child as any).frozen = false;
              (child as any).freezeTimer = 0;
              (child as any).specialAbility = specialAbility;
              (child as any).dashCooldown = 0;
              (child as any).lastDashTime = 0;
              (child as any).isDashing = false;
              (child as any).dashTimer = 0;
              
              // Tint based on special ability
              if (specialAbility === "elite") child.setTint(0xffd700);
              else if (specialAbility === "dash") child.setTint(0xff6600);
              else if (specialAbility === "slowPlayer") child.setTint(0x00ccff);
              else if (specialAbility === "split") child.setTint(0x00ff00);
              else if (specialAbility === "shield") child.setTint(0xffcc00);
            }
          }
          
          // Boss spawn: first at 60s, then every 45s in limitless mode
          const firstBossTime = 60000; // 60 seconds
          const bossInterval = 45000; // 45 seconds after first boss
          const shouldSpawnBoss = gameData.gameMode === "limitless" && 
            ((gameData.lastBossSpawn === 0 && gameData.gameTime > firstBossTime) ||
             (gameData.lastBossSpawn > 0 && gameData.gameTime - gameData.lastBossSpawn > bossInterval));
          
          if (shouldSpawnBoss) {
            gameData.lastBossSpawn = gameData.gameTime;
            
            // Pick boss type
            const bossTypes = ["frostGiant", "blizzardKing", "iceDragon"] as const;
            const bossType = bossTypes[Math.floor(Math.random() * bossTypes.length)];
            const BOSS_CONFIG = (gameData as any).BOSS_CONFIG;
            const bossData = BOSS_CONFIG[bossType];


            // Spawn from a random side
            const side = Phaser.Math.Between(0, 3);
            let bossX = 0, bossY = 0;
            switch (side) {
              case 0: bossX = 400; bossY = -30; break;
              case 1: bossX = 830; bossY = 300; break;
              case 2: bossX = 400; bossY = 630; break;
              case 3: bossX = -30; bossY = 300; break;
            }

            // Create boss with correct sprite
            const boss = this.physics.add.sprite(bossX, bossY, bossData.sprite, DIR.FRONT);
            boss.setScale(bossData.scale);
            gameData.children.add(boss);

            // Scaled boss HP: base + 2 per minute survived
            const bossHp = bossData.baseHp + Math.floor(timeSurvived / 60) * 2;

            // Keep your existing fields
            (boss as any).hitsNeeded = bossHp;
            (boss as any).childType = "childBoss";
            (boss as any).baseSpeed = bossData.speed * speedMultiplier; // <-- uses config speed now
            (boss as any).frozen = false;
            (boss as any).freezeTimer = 0;
            (boss as any).isBoss = true;
            (boss as any).bossType = bossType;
            (boss as any).specialCooldown = 0;

            // Scaled boss rewards: 5 + 1 per minute survived
            (boss as any).coinReward = 5 + Math.floor(timeSurvived / 60);

            // Optional: tint based on boss type
            if (bossType === "frostGiant") boss.setTint(0x88ccff);
            else if (bossType === "blizzardKing") boss.setTint(0xcc88ff);
            else if (bossType === "iceDragon") boss.setTint(0xff8888);
          }
          
          // LEVELS MODE: Timed boss spawning system
          if (gameData.gameMode === "levels" && gameData.levelConfig) {
            const levelTime = gameData.gameTime;
            const MINI_BOSS_1_TIME = 120000; // 2 minutes
            const MINI_BOSS_2_TIME = 240000; // 4 minutes
            const FINAL_BOSS_TIME = 300000; // 5 minutes
            
            // Update level phase based on time
            let newPhase: string = "regular";
            if (levelTime >= FINAL_BOSS_TIME) {
              newPhase = "finalboss";
            } else if (levelTime >= MINI_BOSS_2_TIME) {
              newPhase = gameStateRef.current.miniBoss2Defeated ? "intense" : "miniboss2";
            } else if (levelTime >= MINI_BOSS_1_TIME) {
              newPhase = gameStateRef.current.miniBoss1Defeated ? "harder" : "miniboss1";
            }
            
            // Spawn Mini-Boss 1 at 2:00
            if (levelTime >= MINI_BOSS_1_TIME && !gameData.miniBoss1Spawned) {
              gameData.miniBoss1Spawned = true;
              
              const miniBossConfig = getMiniBoss(gameData.levelConfig.miniBoss1);
              const side = Phaser.Math.Between(0, 3);
              let bossX = 0, bossY = 0;
              switch (side) {
                case 0: bossX = 400; bossY = -30; break;
                case 1: bossX = 830; bossY = 300; break;
                case 2: bossX = 400; bossY = 630; break;
                case 3: bossX = -30; bossY = 300; break;
              }
              
              const miniBoss = this.physics.add.sprite(bossX, bossY, "fourthBoss", DIR.FRONT);
              miniBoss.setScale(1.2);
              gameData.children.add(miniBoss);
              
              const bossHp = Math.ceil((miniBossConfig?.hitsNeeded || 10) * gameData.levelConfig.enemyHealthMultiplier);
              (miniBoss as any).hitsNeeded = bossHp;
              (miniBoss as any).childType = "miniBoss1";
              (miniBoss as any).baseSpeed = (miniBossConfig?.speed || 60) * gameData.levelConfig.enemySpeedMultiplier;
              (miniBoss as any).frozen = false;
              (miniBoss as any).freezeTimer = 0;
              (miniBoss as any).isBoss = true;
              (miniBoss as any).isMiniBoss = true;
              (miniBoss as any).miniBossIndex = 1;
              (miniBoss as any).bossType = gameData.levelConfig.miniBoss1;
              (miniBoss as any).coinReward = 5;
              miniBoss.setTint(miniBossConfig?.color || 0x88ccff);
              
              gameData.currentBoss = miniBoss;
              setGameState(prev => ({ ...prev, levelPhase: "miniboss1", bossActive: true, bossHp: bossHp, bossMaxHp: bossHp }));
            }
            
            // Spawn Mini-Boss 2 at 4:00
            if (levelTime >= MINI_BOSS_2_TIME && !gameData.miniBoss2Spawned && gameStateRef.current.miniBoss1Defeated) {
              gameData.miniBoss2Spawned = true;
              
              const miniBossConfig = getMiniBoss(gameData.levelConfig.miniBoss2);
              const side = Phaser.Math.Between(0, 3);
              let bossX = 0, bossY = 0;
              switch (side) {
                case 0: bossX = 400; bossY = -30; break;
                case 1: bossX = 830; bossY = 300; break;
                case 2: bossX = 400; bossY = 630; break;
                case 3: bossX = -30; bossY = 300; break;
              }
              
              const miniBoss = this.physics.add.sprite(bossX, bossY, "fifthBoss", DIR.FRONT);
              miniBoss.setScale(1.3);
              gameData.children.add(miniBoss);
              
              const bossHp = Math.ceil((miniBossConfig?.hitsNeeded || 15) * gameData.levelConfig.enemyHealthMultiplier);
              (miniBoss as any).hitsNeeded = bossHp;
              (miniBoss as any).childType = "miniBoss2";
              (miniBoss as any).baseSpeed = (miniBossConfig?.speed || 55) * gameData.levelConfig.enemySpeedMultiplier;
              (miniBoss as any).frozen = false;
              (miniBoss as any).freezeTimer = 0;
              (miniBoss as any).isBoss = true;
              (miniBoss as any).isMiniBoss = true;
              (miniBoss as any).miniBossIndex = 2;
              (miniBoss as any).bossType = gameData.levelConfig.miniBoss2;
              (miniBoss as any).coinReward = 8;
              miniBoss.setTint(miniBossConfig?.color || 0xcc88ff);
              
              gameData.currentBoss = miniBoss;
              setGameState(prev => ({ ...prev, levelPhase: "miniboss2", bossActive: true, bossHp: bossHp, bossMaxHp: bossHp }));
            }
            
            // Spawn Final Boss at 5:00
            if (levelTime >= FINAL_BOSS_TIME && !gameData.finalBossSpawned && gameStateRef.current.miniBoss2Defeated) {
              gameData.finalBossSpawned = true;
              
              const side = Phaser.Math.Between(0, 3);
              let bossX = 0, bossY = 0;
              switch (side) {
                case 0: bossX = 400; bossY = -30; break;
                case 1: bossX = 830; bossY = 300; break;
                case 2: bossX = 400; bossY = 630; break;
                case 3: bossX = -30; bossY = 300; break;
              }
              
              const finalBoss = this.physics.add.sprite(bossX, bossY, "thirdBoss", DIR.FRONT);
              finalBoss.setScale(1.8);
              gameData.children.add(finalBoss);
              
              // Final boss has significantly more HP
              const bossHp = Math.ceil(25 * gameData.levelConfig.enemyHealthMultiplier * (1 + gameData.levelConfig.id * 0.05));
              (finalBoss as any).hitsNeeded = bossHp;
              (finalBoss as any).childType = "finalBoss";
              (finalBoss as any).baseSpeed = 40 * gameData.levelConfig.enemySpeedMultiplier;
              (finalBoss as any).frozen = false;
              (finalBoss as any).freezeTimer = 0;
              (finalBoss as any).isBoss = true;
              (finalBoss as any).isFinalBoss = true;
              (finalBoss as any).bossType = gameData.levelConfig.finalBoss;
              (finalBoss as any).coinReward = gameData.levelConfig.rewards.coins;
              (finalBoss as any).xpReward = gameData.levelConfig.rewards.xp;
              finalBoss.setTint(0xff4444);
              
              gameData.currentBoss = finalBoss;
              setGameState(prev => ({ ...prev, levelPhase: "finalboss", bossActive: true, bossHp: bossHp, bossMaxHp: bossHp }));
            }
          }

          gameData.children.getChildren().forEach((child: any) => {
            const childSprite = child as Phaser.Physics.Arcade.Sprite;
            
            if ((childSprite as any).frozen) {
              (childSprite as any).freezeTimer -= delta;
              if ((childSprite as any).freezeTimer <= 0) {
                (childSprite as any).frozen = false;
                childSprite.setTint(0xffffff);
              }
              childSprite.setVelocity(0, 0);
              return;
            }
            
            const angle = Phaser.Math.Angle.Between(
              childSprite.x, childSprite.y,
              gameData.player.x, gameData.player.y
            );
            let speed = (childSprite as any).baseSpeed || (80 + difficulty * 15);
            const specialAbility = (childSprite as any).specialAbility;
            
            // Apply time warp slow effect
            if (hasTimeWarp) {
              speed *= 0.8;
            }
            
            // Handle special abilities
            if (specialAbility === "dash") {
              const distToPlayer = Phaser.Math.Distance.Between(
                childSprite.x, childSprite.y,
                gameData.player.x, gameData.player.y
              );
              
              if ((childSprite as any).isDashing) {
                (childSprite as any).dashTimer -= delta;
                speed = speed * 4;
                if ((childSprite as any).dashTimer <= 0) {
                  (childSprite as any).isDashing = false;
                  (childSprite as any).dashCooldown = 3000;
                }
              } else if ((childSprite as any).dashCooldown > 0) {
                (childSprite as any).dashCooldown -= delta;
              } else if (distToPlayer < 200 && distToPlayer > 50) {
                (childSprite as any).isDashing = true;
                (childSprite as any).dashTimer = 400;
              }
            }
            
            // Shielded enemies have invulnerability from front
            if (specialAbility === "shield") {
              (childSprite as any).facingAngle = angle;
            }
            
            childSprite.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
          });

          gameData.gifts.getChildren().forEach((gift: any) => {
            const giftSprite = gift as Phaser.Physics.Arcade.Sprite;
            if ((giftSprite as any).hasBoomerang && !(giftSprite as any).returning) {
              const startX = (giftSprite as any).startX;
              const startY = (giftSprite as any).startY;
              const dist = Phaser.Math.Distance.Between(startX, startY, giftSprite.x, giftSprite.y);
              if (dist > 150) {
                (giftSprite as any).returning = true;
                const returnAngle = Phaser.Math.Angle.Between(
                  giftSprite.x, giftSprite.y,
                  gameData.player.x, gameData.player.y
                );
                giftSprite.setVelocity(Math.cos(returnAngle) * 350, Math.sin(returnAngle) * 350);
              }
            }
            if ((giftSprite as any).returning) {
              const returnAngle = Phaser.Math.Angle.Between(
                giftSprite.x, giftSprite.y,
                gameData.player.x, gameData.player.y
              );
              giftSprite.setVelocity(Math.cos(returnAngle) * 350, Math.sin(returnAngle) * 350);
              const distToPlayer = Phaser.Math.Distance.Between(
                giftSprite.x, giftSprite.y,
                gameData.player.x, gameData.player.y
              );
              if (distToPlayer < 20) {
                giftSprite.destroy();
              }
            }
          });
          
          gameData.hasWarmthAura = hasWarmth;
          gameData.hasCocoa = hasCocoa;
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);

    return () => {
      if (gameRef.current) {
        gameRef.current.destroy(true);
        gameRef.current = null;
      }
    };
  }, [gameState.isPlaying, theme]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case "common": return "border-muted-foreground bg-muted/50";
      case "rare": return "border-secondary bg-secondary/20";
      case "epic": return "border-chart-4 bg-chart-4/20";
      default: return "border-muted";
    }
  };

  if (!gameState.isPlaying && !gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <Gift className="w-16 h-16 mx-auto text-primary mb-4" />
              <CardTitle className="text-3xl">GiftStorm</CardTitle>
              <p className="text-muted-foreground">Spread warmth and joy!</p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div className="p-4 bg-muted rounded-lg">
                  <Trophy className="w-6 h-6 mx-auto mb-2 text-chart-5" />
                  <p className="text-sm text-muted-foreground">Best Time</p>
                  <p className="text-xl font-bold">{formatTime(playerData.bestTime)}</p>
                </div>
                <div className="p-4 bg-muted rounded-lg">
                  <Coins className="w-6 h-6 mx-auto mb-2 text-chart-5" />
                  <p className="text-sm text-muted-foreground">Coins</p>
                  <p className="text-xl font-bold">{playerData.coins}</p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-center text-sm text-muted-foreground font-medium">Choose Game Mode</p>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button 
                    size="lg" 
                    className="gap-2 py-6 flex-col h-auto"
                    onClick={() => startGame("limitless")}
                    data-testid="button-start-limitless"
                  >
                    <Clock className="w-8 h-8" />
                    <span className="font-bold">Limitless</span>
                    <span className="text-xs opacity-80">Endless survival</span>
                  </Button>
                  <Button 
                    size="lg" 
                    variant="secondary"
                    className="gap-2 py-6 flex-col h-auto"
                    onClick={() => setGameState(prev => ({ ...prev, showLevelSelect: true }))}
                    data-testid="button-start-levels"
                  >
                    <Trophy className="w-8 h-8" />
                    <span className="font-bold">Levels</span>
                    <span className="text-xs opacity-80">100 stages</span>
                  </Button>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setGameState(prev => ({ ...prev, showEquipmentShop: true }))}
                    data-testid="button-equipment"
                  >
                    <Shirt className="w-4 h-4 mr-2" />
                    Equipment
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGameState(prev => ({ ...prev, showSkillTree: true }))}
                    data-testid="button-skills"
                  >
                    <TreeDeciduous className="w-4 h-4 mr-2" />
                    Skills
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setGameState(prev => ({ ...prev, showWorkshop: true }))}
                    data-testid="button-workshop"
                  >
                    <Sparkles className="w-4 h-4 mr-2" />
                    Workshop
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}
                    data-testid="button-settings"
                  >
                    <Settings className="w-4 h-4 mr-2" />
                    Settings
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="border-purple-500/50 text-purple-500 hover:bg-purple-500/10"
                    onClick={() => setGameState(prev => ({ ...prev, showSkinShop: true }))}
                    data-testid="button-skins"
                  >
                    <Palette className="w-4 h-4 mr-2" />
                    Skins
                    {playerData.hasGamePass && <Star className="w-3 h-3 ml-1 text-yellow-500" />}
                  </Button>
                  <Button
                    variant="outline"
                    className="border-chart-5/50 text-chart-5 hover:bg-chart-5/10"
                    onClick={() => setGameState(prev => ({ ...prev, showDonationShop: true }))}
                    data-testid="button-donate"
                  >
                    <Heart className="w-4 h-4 mr-2" />
                    Donate
                  </Button>
                </div>

                {scores && scores.length > 0 && (
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex items-center gap-2 mb-3">
                      <Trophy className="w-4 h-4 text-chart-5" />
                      <span className="font-medium text-sm">Leaderboard</span>
                    </div>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {scores.slice(0, 5).map((score, index) => (
                        <div 
                          key={score.id} 
                          className="flex items-center justify-between p-2 bg-muted rounded-lg text-sm"
                          data-testid={`leaderboard-entry-${index}`}
                        >
                          <div className="flex items-center gap-2">
                            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                              index === 0 ? 'bg-yellow-500 text-yellow-950' :
                              index === 1 ? 'bg-gray-300 text-gray-700' :
                              index === 2 ? 'bg-amber-600 text-amber-100' :
                              'bg-muted-foreground/20 text-muted-foreground'
                            }`}>
                              {index + 1}
                            </span>
                            <span className="font-medium truncate max-w-[100px]">{score.playerName}</span>
                          </div>
                          <span className="font-bold text-primary">{score.score.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Link href="/">
                  <Button variant="ghost" className="w-full">
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        {gameState.showSettings && (
          <SettingsModal
            settings={settings}
            onUpdate={updateSettings}
            onClose={() => setGameState(prev => ({ ...prev, showSettings: false }))}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        )}

        {gameState.showWorkshop && (
          <WorkshopModal
            playerData={playerData}
            onPurchase={handlePurchaseUpgrade}
            onClose={() => setGameState(prev => ({ ...prev, showWorkshop: false }))}
          />
        )}

        {gameState.showEquipmentShop && (
          <EquipmentShopModal
            playerData={playerData}
            onPurchase={(id) => { purchaseEquipment(id); setPlayerData(getPlayerData()); }}
            onEquip={(id) => { equipItem(id); setPlayerData(getPlayerData()); }}
            onUnequip={(slot) => { unequipItem(slot); setPlayerData(getPlayerData()); }}
            onClose={() => setGameState(prev => ({ ...prev, showEquipmentShop: false }))}
          />
        )}

        {gameState.showSkillTree && (
          <SkillTreeModal
            playerData={playerData}
            onPurchase={(id) => { purchaseSkillNode(id); setPlayerData(getPlayerData()); }}
            onClose={() => setGameState(prev => ({ ...prev, showSkillTree: false }))}
          />
        )}

        {gameState.showDonationShop && (
          <DonationShopModal
            onClose={() => setGameState(prev => ({ ...prev, showDonationShop: false }))}
          />
        )}

        {gameState.showSkinShop && (
          <SkinShopModal
            playerData={playerData}
            onEquip={(skinId) => { equipSkin(skinId); setPlayerData(getPlayerData()); }}
            onClose={() => setGameState(prev => ({ ...prev, showSkinShop: false }))}
          />
        )}

        {gameState.showLevelSelect && (
          <LevelSelectModal
            playerData={playerData}
            onSelectLevel={(levelId) => {
              setGameState(prev => ({ ...prev, showLevelSelect: false }));
              startGame("levels", levelId);
            }}
            onClose={() => setGameState(prev => ({ ...prev, showLevelSelect: false }))}
          />
        )}
      </div>
    );
  }

  if (gameState.isGameOver) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-lg">
          <CardHeader className="text-center">
            <Trophy className="w-16 h-16 mx-auto text-chart-5 mb-4" />
            <CardTitle className="text-3xl">Game Over!</CardTitle>
            <p className="text-muted-foreground">Great effort spreading warmth!</p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div className="p-4 bg-muted rounded-lg">
                <Clock className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Time Survived</p>
                <p className="text-xl font-bold">{formatTime(gameState.timeSurvived)}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Gift className="w-5 h-5 mx-auto mb-1 text-primary" />
                <p className="text-xs text-muted-foreground">Children Helped</p>
                <p className="text-xl font-bold">{gameState.childrenHelped}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Coins className="w-5 h-5 mx-auto mb-1 text-chart-5" />
                <p className="text-xs text-muted-foreground">Coins Earned</p>
                <p className="text-xl font-bold">{gameState.coinsEarned}</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <Trophy className="w-5 h-5 mx-auto mb-1 text-chart-5" />
                <p className="text-xs text-muted-foreground">Final Score</p>
                <p className="text-xl font-bold">{gameState.score}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="playerName">Enter your name for the leaderboard</Label>
                <Input
                  id="playerName"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  placeholder="Your name"
                  maxLength={20}
                  className="mt-1"
                  data-testid="input-player-name"
                />
              </div>
              
              <Button
                className="w-full"
                onClick={submitScore}
                disabled={!playerName.trim() || submitScoreMutation.isPending}
                data-testid="button-submit-score"
              >
                {submitScoreMutation.isPending ? "Submitting..." : "Submit Score"}
              </Button>
            </div>

            <div className="flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setGameState(INITIAL_GAME_STATE)}
              >
                Play Again
              </Button>
              <Link href="/" className="flex-1">
                <Button variant="ghost" className="w-full">
                  Home
                </Button>
              </Link>
            </div>

            {status && (
              <div className="pt-4 border-t">
                <DonationProgress status={status} isLoading={false} compact />
                <Button
                  variant="outline"
                  className="w-full mt-3 gap-2"
                  onClick={() => window.open(status.donationUrl, "_blank")}
                  data-testid="button-donate-gameover"
                >
                  <Heart className="w-4 h-4" />
                  Support the Campaign
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        <div className="space-y-2 pointer-events-auto">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-card-border">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-sm font-medium">HP</span>
            </div>
            <Progress value={(gameState.hp / gameState.maxHp) * 100} className="h-3" />
            <span className="text-xs text-muted-foreground">{gameState.hp}/{gameState.maxHp}</span>
          </div>
          
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-card-border">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-chart-4" />
              <span className="text-sm font-medium">Level {gameState.level}</span>
              {playerData.hasGamePass && (
                <span className="flex items-center gap-1 text-xs bg-yellow-500/20 text-yellow-500 px-1.5 py-0.5 rounded-full">
                  <Star className="w-3 h-3" />
                  2x
                </span>
              )}
            </div>
            <Progress value={(gameState.xp / gameState.xpToLevel) * 100} className="h-2" />
          </div>
        </div>

        <div className="flex gap-2 pointer-events-auto">
          <Button size="icon" variant="secondary" onClick={pauseGame} data-testid="button-pause">
            {gameState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
          </Button>
          <Button
            size="icon"
            variant="secondary"
            onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}
          >
            <Settings className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-4 py-2 border border-card-border flex items-center gap-4">
          {gameState.gameMode === "levels" && (
            <>
              <div className="flex items-center gap-2">
                <Target className="w-4 h-4 text-chart-1" />
                <span className="font-mono font-bold text-sm">
                  Lv {gameState.currentLevel}
                </span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-primary" />
                <span className="font-mono font-bold text-sm">
                  {formatTime(Math.max(0, 300 - gameState.timeSurvived))}
                </span>
              </div>
              <div className="w-px h-6 bg-border" />
              <div className="flex items-center gap-2">
                <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                  gameState.levelPhase === "regular" ? "bg-green-500/20 text-green-500" :
                  gameState.levelPhase === "miniboss1" || gameState.levelPhase === "miniboss2" ? "bg-orange-500/20 text-orange-500" :
                  gameState.levelPhase === "finalboss" ? "bg-red-500/20 text-red-500" :
                  gameState.levelPhase === "harder" || gameState.levelPhase === "intense" ? "bg-yellow-500/20 text-yellow-500" :
                  "bg-muted text-muted-foreground"
                }`}>
                  {gameState.levelPhase === "regular" && "Phase 1"}
                  {gameState.levelPhase === "miniboss1" && "MINI-BOSS!"}
                  {gameState.levelPhase === "harder" && "Phase 2"}
                  {gameState.levelPhase === "miniboss2" && "MINI-BOSS!"}
                  {gameState.levelPhase === "intense" && "Phase 3"}
                  {gameState.levelPhase === "finalboss" && "FINAL BOSS!"}
                  {gameState.levelPhase === "complete" && "COMPLETE!"}
                </span>
              </div>
              <div className="w-px h-6 bg-border" />
            </>
          )}
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-chart-2" />
            <span className="font-mono font-bold text-sm">Wave {gameState.waveNumber}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="font-mono font-bold">{formatTime(gameState.timeSurvived)}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold">{gameState.childrenHelped}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-chart-5" />
            <span className="font-mono font-bold">{gameState.coinsEarned}</span>
          </div>
          <div className="w-px h-6 bg-border" />
          <div className="flex items-center gap-2">
            <Sword className="w-4 h-4 text-destructive" />
            <span className={`font-mono font-bold ${gameState.dangerLevel >= 2 ? 'text-destructive' : gameState.dangerLevel >= 1.5 ? 'text-chart-5' : ''}`}>
              Danger: {gameState.dangerLevel.toFixed(2)}x
            </span>
          </div>
        </div>
      </div>

      {settings.showWarmthMeter && status && (
        <div className="absolute bottom-4 right-4 z-20 w-48 pointer-events-auto">
          <DonationProgress status={status} isLoading={false} compact />
        </div>
      )}

      <div 
        ref={gameContainerRef} 
        className="flex-1 flex items-center justify-center"
        data-testid="game-canvas"
      />

      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30">
          <Card className="w-full max-w-sm">
            <CardHeader className="text-center">
              <CardTitle>Game Paused</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button className="w-full" onClick={pauseGame}>
                <Play className="w-4 h-4 mr-2" />
                Resume
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" className="w-full" onClick={endGame}>
                End Game
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState.showLevelUp && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <Sparkles className="w-12 h-12 mx-auto text-chart-5 mb-2" />
              <CardTitle className="text-2xl">Level Up!</CardTitle>
              <p className="text-muted-foreground">
                {gameState.pendingLevelUps > 1 
                  ? `Choose an upgrade (1 of ${gameState.pendingLevelUps})`
                  : "Choose an upgrade"}
              </p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {gameState.levelUpChoices.map((upgrade) => {
                  const synergyPartner = getSynergyPartner(upgrade.id);
                  const hasSynergyPartner = synergyPartner && gameState.currentUpgrades.includes(synergyPartner);
                  const synergy = SYNERGIES.find(s => 
                    (s.upgrade1 === upgrade.id && s.upgrade2 === synergyPartner) ||
                    (s.upgrade2 === upgrade.id && s.upgrade1 === synergyPartner)
                  );
                  
                  return (
                    <button
                      key={upgrade.id}
                      onClick={() => handleLevelUp(upgrade.id)}
                      className={`p-4 rounded-lg border-2 text-left transition-all hover:scale-105 ${getRarityColor(upgrade.rarity)} ${hasSynergyPartner ? 'ring-2 ring-chart-5 ring-offset-2 ring-offset-background shadow-lg shadow-chart-5/30' : ''}`}
                      data-testid={`upgrade-${upgrade.id}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase font-bold text-muted-foreground">
                          {upgrade.rarity}
                        </span>
                        {hasSynergyPartner && (
                          <span className="text-xs bg-chart-5/20 text-chart-5 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                            <Star className="w-3 h-3" />
                            Synergy
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold mb-1">{upgrade.name}</h3>
                      <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                      {hasSynergyPartner && synergy && (
                        <div className="mt-2 pt-2 border-t border-chart-5/30">
                          <p className="text-xs text-chart-5 font-medium">
                            Synergy with: {getUpgradeName(synergyPartner!)}
                          </p>
                          <p className="text-xs text-chart-5/80 mt-0.5">
                            {synergy.name}: {synergy.description}
                          </p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {gameState.showLevelComplete && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-30 p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <Trophy className="w-16 h-16 mx-auto text-chart-5 mb-2" />
              <CardTitle className="text-3xl text-chart-5">Level Complete!</CardTitle>
              <p className="text-muted-foreground">
                {getLevelConfig(gameState.currentLevel)?.name || `Level ${gameState.currentLevel}`} cleared!
              </p>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="flex justify-center gap-2 mb-2">
                {[1, 2, 3].map((star) => (
                  <Star 
                    key={star}
                    className={`w-8 h-8 ${
                      star <= (gameState.hp >= gameState.maxHp * 0.8 ? 3 : gameState.hp >= gameState.maxHp * 0.5 ? 2 : 1)
                        ? "text-chart-5 fill-chart-5"
                        : "text-muted-foreground"
                    }`}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-muted-foreground text-xs">Enemies Helped</p>
                  <p className="text-xl font-bold">{gameState.childrenHelped}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Coins Earned</p>
                  <p className="text-xl font-bold text-chart-5">+{getLevelConfig(gameState.currentLevel)?.rewards.coins || 0}</p>
                </div>
              </div>
              
              {gameState.earnedChest && (
                <Button
                  variant="secondary"
                  onClick={() => setGameState(prev => ({ ...prev, showChestReward: true, showLevelComplete: false }))}
                  className="w-full gap-2"
                  data-testid="button-view-chest"
                >
                  <Gift className="w-5 h-5 text-chart-5" />
                  Open {gameState.earnedChest.name}!
                </Button>
              )}
              
              {gameState.currentLevel < 100 ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    Next: {getLevelConfig(gameState.currentLevel + 1)?.name || `Level ${gameState.currentLevel + 1}`}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => setGameState(prev => ({ ...prev, isPlaying: false, showLevelComplete: false, earnedChest: null, chestReward: null }))}
                      className="flex-1"
                      data-testid="button-back-to-menu"
                    >
                      Menu
                    </Button>
                    <Button
                      onClick={() => {
                        setGameState(prev => ({ ...prev, earnedChest: null, chestReward: null }));
                        advanceToNextLevel();
                      }}
                      className="flex-1"
                      data-testid="button-next-level"
                    >
                      Level {gameState.currentLevel + 1}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <p className="text-chart-5 font-bold">All 100 Levels Complete!</p>
                  <Button
                    onClick={() => setGameState(prev => ({ ...prev, isPlaying: false, isGameOver: false, showLevelComplete: false, earnedChest: null, chestReward: null }))}
                    className="w-full"
                    data-testid="button-finish-campaign"
                  >
                    Return to Menu
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {gameState.showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setGameState(prev => ({ ...prev, showSettings: false }))}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}

      {gameState.showChestReward && gameState.earnedChest && (
        <ChestRewardModal
          chest={gameState.earnedChest}
          reward={gameState.chestReward}
          onOpen={() => {
            const reward = openChest(gameState.earnedChest!);
            setGameState(prev => ({ ...prev, chestReward: reward }));
            setPlayerData(getPlayerData());
          }}
          onClaim={() => {
            setGameState(prev => ({ 
              ...prev, 
              showChestReward: false, 
              showLevelComplete: true,
              earnedChest: null,
              chestReward: null
            }));
            setPlayerData(getPlayerData());
          }}
        />
      )}
    </div>
  );
}

interface SettingsModalProps {
  settings: GameSettings;
  onUpdate: (settings: Partial<GameSettings>) => void;
  onClose: () => void;
  theme: string;
  toggleTheme: () => void;
}

function SettingsModal({ settings, onUpdate, onClose, theme, toggleTheme }: SettingsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle>Settings</CardTitle>
          <Button size="icon" variant="ghost" onClick={onClose}>
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
              <Label>Dark Mode</Label>
            </div>
            <Switch
              checked={theme === "dark"}
              onCheckedChange={toggleTheme}
              data-testid="switch-dark-mode"
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Sound Effects</Label>
            <Switch
              checked={settings.soundEnabled}
              onCheckedChange={(checked) => {
                onUpdate({ soundEnabled: checked });
                soundManager.setEnabled(checked);
              }}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Reduced Motion</Label>
            <Switch
              checked={settings.reducedMotion}
              onCheckedChange={(checked) => onUpdate({ reducedMotion: checked })}
            />
          </div>

          <div className="flex items-center justify-between">
            <Label>Show Community Warmth Meter</Label>
            <Switch
              checked={settings.showWarmthMeter}
              onCheckedChange={(checked) => onUpdate({ showWarmthMeter: checked })}
            />
          </div>

          <Button className="w-full" onClick={onClose}>
            Done
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

interface WorkshopModalProps {
  playerData: PlayerMetaData;
  onPurchase: (upgradeId: string) => void;
  onClose: () => void;
}

function WorkshopModal({ playerData, onPurchase, onClose }: WorkshopModalProps) {
  const formatEffect = (upgrade: MetaUpgrade, level: number): string => {
    if (level === 0) return "None";
    
    let effectValue = level * upgrade.effect;
    if (upgrade.effectCap !== undefined) {
      effectValue = Math.min(upgrade.effectCap, effectValue);
    }
    
    if (upgrade.id === "maxHp" || upgrade.id === "startingHp") {
      return `+${Math.round(effectValue)} HP`;
    } else if (upgrade.id === "startingUpgrade") {
      return level > 0 ? "Active" : "Inactive";
    } else {
      return `+${Math.round(effectValue * 100)}%`;
    }
  };

  const isAtCap = (upgrade: MetaUpgrade, level: number): boolean => {
    if (upgrade.effectCap === undefined) return false;
    return level * upgrade.effect >= upgrade.effectCap;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader className="flex flex-row items-center justify-between pb-2 sticky top-0 bg-card z-10">
          <div>
            <CardTitle>Workshop</CardTitle>
            <p className="text-muted-foreground text-sm mt-1">Permanent upgrades for all runs</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1 rounded-full">
              <Coins className="w-4 h-4 text-chart-5" />
              <span className="font-bold">{playerData.coins.toLocaleString()}</span>
            </div>
            <Button size="icon" variant="ghost" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {META_UPGRADES.map((upgrade: MetaUpgrade) => {
            const currentLevel = playerData.upgrades[upgrade.id] || 0;
            const isMaxed = currentLevel >= upgrade.maxLevel;
            const atEffectCap = isAtCap(upgrade, currentLevel);
            const cost = getUpgradeCost(upgrade, currentLevel);
            const canAfford = playerData.coins >= cost;

            return (
              <div
                key={upgrade.id}
                className={`p-4 rounded-lg border ${isMaxed ? "bg-accent/20 border-accent" : atEffectCap ? "bg-muted/50 border-muted" : "bg-card border-card-border"}`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-bold">{upgrade.name}</h3>
                      <span className="text-xs bg-muted px-2 py-0.5 rounded">
                        Lv. {currentLevel}
                      </span>
                      {atEffectCap && !isMaxed && (
                        <span className="text-xs bg-chart-5/20 text-chart-5 px-2 py-0.5 rounded">
                          Effect Capped
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{upgrade.description}</p>
                    <div className="text-xs text-muted-foreground mt-2 flex items-center gap-4 flex-wrap">
                      <span>Current: <span className="text-foreground font-medium">{formatEffect(upgrade, currentLevel)}</span></span>
                      {!isMaxed && !atEffectCap && (
                        <span>Next: <span className="text-primary font-medium">{formatEffect(upgrade, currentLevel + 1)}</span></span>
                      )}
                    </div>
                  </div>
                  {!isMaxed && !atEffectCap && (
                    <Button
                      onClick={() => canAfford && onPurchase(upgrade.id)}
                      disabled={!canAfford}
                      className={`shrink-0 ${!canAfford ? "opacity-50 cursor-not-allowed" : ""}`}
                      data-testid={`button-purchase-${upgrade.id}`}
                      aria-disabled={!canAfford}
                    >
                      <Coins className="w-4 h-4 mr-1" />
                      {cost.toLocaleString()}
                    </Button>
                  )}
                  {atEffectCap && !isMaxed && (
                    <span className="text-sm font-medium text-chart-5">MAX EFFECT</span>
                  )}
                  {isMaxed && (
                    <span className="text-sm font-medium text-accent">MAX</span>
                  )}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

interface EquipmentShopModalProps {
  playerData: ExtendedPlayerData;
  onPurchase: (equipmentId: string) => void;
  onEquip: (equipmentId: string) => void;
  onUnequip: (slot: keyof EquipmentLoadout) => void;
  onClose: () => void;
}

function EquipmentShopModal({ playerData, onPurchase, onEquip, onUnequip, onClose }: EquipmentShopModalProps) {
  const slots = ["jacket", "socks", "gloves", "pants", "sweater"] as const;
  
  const handleUpgrade = (equipmentId: string) => {
    if (upgradeEquipment(equipmentId)) {
      onPurchase(equipmentId);
    }
  };
  
  const formatStatValue = (stat: string, value: number | undefined): string => {
    if (value === undefined) return "";
    if (stat === "hp") return `+${Math.round(value)} HP`;
    return `+${Math.round(value * 100)}%`;
  };
  
  const getStatsDescription = (equipment: Equipment, level: number): string => {
    const stats = getEquipmentStatsWithLevel(equipment, level);
    const parts: string[] = [];
    if (stats.hp) parts.push(`+${Math.round(stats.hp)} HP`);
    if (stats.speed) parts.push(`+${Math.round(stats.speed * 100)}% Speed`);
    if (stats.throwRate) parts.push(`+${Math.round(stats.throwRate * 100)}% Throw`);
    if (stats.pickupRadius) parts.push(`+${Math.round(stats.pickupRadius * 100)}% Pickup`);
    if (stats.damage) parts.push(`+${Math.round(stats.damage * 100)}% Damage`);
    return parts.join(", ");
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Shirt className="w-6 h-6 text-primary" />
              Equipment Shop
            </CardTitle>
            <p className="text-sm text-muted-foreground">Outfit your character with warm gear</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
              <Coins className="w-4 h-4 text-chart-5" />
              <span className="font-bold">{playerData.coins}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {slots.map(slot => {
            const slotItems = EQUIPMENT.filter(e => e.slot === slot);
            const equippedId = playerData.equipment[slot];
            
            return (
              <div key={slot} className="space-y-2">
                <h3 className="font-bold capitalize flex items-center gap-2">
                  {slot === "jacket" && <Shirt className="w-4 h-4" />}
                  {slot === "socks" && <Footprints className="w-4 h-4" />}
                  {slot === "gloves" && <Hand className="w-4 h-4" />}
                  {slot === "pants" && <Shirt className="w-4 h-4" />}
                  {slot === "sweater" && <Shirt className="w-4 h-4" />}
                  {slot}
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {slotItems.map(item => {
                    const owned = playerData.ownedEquipment.includes(item.id);
                    const equipped = equippedId === item.id;
                    const canAfford = playerData.coins >= item.cost;
                    const level = owned ? getEquipmentLevel(item.id) : 1;
                    const cardCount = getEquipmentCardCount(item.id);
                    const cardsNeeded = getEquipmentCardsNeeded(level);
                    const canUpgrade = owned && level < 5 && cardCount >= cardsNeeded;
                    const isMaxLevel = level >= 5;
                    
                    const rarityColor = item.rarity === "epic" ? "border-purple-500" : 
                                       item.rarity === "rare" ? "border-blue-500" : "border-gray-400";
                    
                    return (
                      <div 
                        key={item.id}
                        className={`p-3 border-2 rounded-lg ${equipped ? 'border-primary bg-primary/10' : owned ? rarityColor : 'border-border'}`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{item.name}</h4>
                              {owned && (
                                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                                  isMaxLevel ? 'bg-chart-5 text-black' : 'bg-muted'
                                }`}>
                                  Lv.{level}
                                </span>
                              )}
                              {item.rarity === "epic" && <Sparkles className="w-3 h-3 text-purple-500" />}
                              {item.rarity === "rare" && <Star className="w-3 h-3 text-blue-500" />}
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {owned ? getStatsDescription(item, level) : item.description}
                            </p>
                            {owned && !isMaxLevel && (
                              <div className="mt-1">
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Gift className="w-3 h-3" />
                                  <span>{cardCount}/{cardsNeeded} cards</span>
                                </div>
                                <Progress value={(cardCount / cardsNeeded) * 100} className="h-1 mt-1" />
                              </div>
                            )}
                            {owned && !isMaxLevel && (
                              <p className="text-xs text-chart-4 mt-1">
                                Next: {getStatsDescription(item, level + 1)}
                              </p>
                            )}
                          </div>
                          {equipped && <Check className="w-5 h-5 text-primary" />}
                        </div>
                        <div className="flex justify-end gap-2 flex-wrap">
                          {!owned && (
                            <Button
                              size="sm"
                              disabled={!canAfford}
                              onClick={() => onPurchase(item.id)}
                              data-testid={`buy-${item.id}`}
                            >
                              <Coins className="w-3 h-3 mr-1" />
                              {item.cost}
                            </Button>
                          )}
                          {owned && canUpgrade && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => handleUpgrade(item.id)}
                              data-testid={`upgrade-${item.id}`}
                            >
                              <Zap className="w-3 h-3 mr-1" />
                              Upgrade
                            </Button>
                          )}
                          {owned && !equipped && (
                            <Button size="sm" variant="outline" onClick={() => onEquip(item.id)}>
                              Equip
                            </Button>
                          )}
                          {equipped && (
                            <Button size="sm" variant="ghost" onClick={() => onUnequip(slot)}>
                              Unequip
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

interface SkillTreeModalProps {
  playerData: ExtendedPlayerData;
  onPurchase: (nodeId: string) => void;
  onClose: () => void;
}

function SkillTreeModal({ playerData, onPurchase, onClose }: SkillTreeModalProps) {
  const categories = ["offense", "defense", "utility", "weapon"] as const;
  const categoryLabels = { offense: "Offense", defense: "Defense", utility: "Utility", weapon: "Weapons" };
  const categoryColors = { offense: "text-chart-1", defense: "text-chart-2", utility: "text-chart-3", weapon: "text-chart-5" };
  
  const canPurchase = (node: SkillNode) => {
    const currentLevel = playerData.skillLevels[node.id] || 0;
    if (currentLevel >= node.maxLevel) return false;
    const cost = node.cost * (currentLevel + 1);
    if (playerData.coins < cost) return false;
    for (const prereq of node.prerequisiteIds) {
      if ((playerData.skillLevels[prereq] || 0) < 1) return false;
    }
    return true;
  };
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-5xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TreeDeciduous className="w-6 h-6 text-primary" />
              Skill Tree
            </CardTitle>
            <p className="text-sm text-muted-foreground">Unlock permanent upgrades and weapons</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
              <Coins className="w-4 h-4 text-chart-5" />
              <span className="font-bold">{playerData.coins}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {categories.map(category => (
              <div key={category} className="space-y-3">
                <h3 className={`font-bold ${categoryColors[category]}`}>
                  {categoryLabels[category]}
                </h3>
                {SKILL_TREE.filter(n => n.category === category).map(node => {
                  const currentLevel = playerData.skillLevels[node.id] || 0;
                  const isMaxed = currentLevel >= node.maxLevel;
                  const cost = node.cost * (currentLevel + 1);
                  const canBuy = canPurchase(node);
                  const hasPrereqs = node.prerequisiteIds.every(p => (playerData.skillLevels[p] || 0) >= 1);
                  
                  return (
                    <div 
                      key={node.id}
                      className={`p-3 border rounded-lg ${isMaxed ? 'border-primary bg-primary/10' : hasPrereqs ? 'border-border' : 'border-muted opacity-60'}`}
                    >
                      <div className="flex justify-between items-start mb-1">
                        <h4 className="font-semibold text-sm">{node.name}</h4>
                        {!hasPrereqs && <Lock className="w-4 h-4 text-muted-foreground" />}
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{node.description}</p>
                      <div className="flex justify-between items-center">
                        <span className="text-xs">
                          Lv {currentLevel}/{node.maxLevel}
                        </span>
                        {!isMaxed && hasPrereqs && (
                          <Button
                            size="sm"
                            disabled={!canBuy}
                            onClick={() => onPurchase(node.id)}
                            data-testid={`skill-${node.id}`}
                          >
                            <Coins className="w-3 h-3 mr-1" />
                            {cost}
                          </Button>
                        )}
                        {isMaxed && (
                          <span className="text-xs font-medium text-primary">MAX</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ChestRewardModalProps {
  chest: Chest;
  reward: ChestReward | null;
  onOpen: () => void;
  onClaim: () => void;
}

function ChestRewardModal({ chest, reward, onOpen, onClaim }: ChestRewardModalProps) {
  const chestColors: Record<string, string> = {
    wooden: "from-amber-700 to-amber-900",
    silver: "from-gray-300 to-gray-500",
    golden: "from-yellow-400 to-amber-600",
    diamond: "from-cyan-300 to-blue-500",
  };
  
  const chestGlow: Record<string, string> = {
    wooden: "shadow-amber-700/50",
    silver: "shadow-gray-400/50",
    golden: "shadow-yellow-500/50",
    diamond: "shadow-cyan-400/50",
  };
  
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md text-center">
        <CardHeader>
          <CardTitle className="text-2xl flex items-center justify-center gap-2">
            <Gift className="w-8 h-8 text-chart-5" />
            {chest.name}
          </CardTitle>
          <p className="text-muted-foreground">
            {reward ? "Here's what you got!" : "Tap to open and reveal your rewards!"}
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {!reward ? (
            <>
              <div className={`w-32 h-32 mx-auto rounded-lg bg-gradient-to-b ${chestColors[chest.rarity]} shadow-xl ${chestGlow[chest.rarity]} flex items-center justify-center`}>
                <Gift className="w-16 h-16 text-white drop-shadow-lg" />
              </div>
              <p className="text-sm text-muted-foreground">
                {chest.rarity === "diamond" && "A magnificent diamond chest! Contains the best rewards!"}
                {chest.rarity === "golden" && "A golden chest! Great rewards await!"}
                {chest.rarity === "silver" && "A silver chest with decent rewards!"}
                {chest.rarity === "wooden" && "A wooden chest. Let's see what's inside!"}
              </p>
              <Button onClick={onOpen} className="w-full gap-2" data-testid="button-open-chest">
                <Sparkles className="w-4 h-4" />
                Open Chest
              </Button>
            </>
          ) : (
            <>
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-3 p-4 bg-muted rounded-lg">
                  <Coins className="w-8 h-8 text-chart-5" />
                  <span className="text-3xl font-bold text-chart-5">+{reward.coins}</span>
                </div>
                
                {reward.cards.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium text-muted-foreground">Equipment Cards</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {reward.cards.map((card, idx) => {
                        const equipment = EQUIPMENT.find(e => e.id === card.equipmentId);
                        if (!equipment) return null;
                        const rarityColor = equipment.rarity === "epic" ? "border-purple-500 bg-purple-500/10" :
                                           equipment.rarity === "rare" ? "border-blue-500 bg-blue-500/10" : 
                                           "border-gray-400 bg-gray-400/10";
                        return (
                          <div key={idx} className={`p-2 border rounded-lg ${rarityColor}`}>
                            <div className="flex items-center gap-2">
                              <Gift className="w-4 h-4" />
                              <span className="text-sm font-medium">x{card.count}</span>
                            </div>
                            <p className="text-xs text-muted-foreground truncate">{equipment.name}</p>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
                
                {reward.newEquipment && (
                  <div className="p-4 border-2 border-primary bg-primary/10 rounded-lg">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <Sparkles className="w-5 h-5 text-chart-5" />
                      <span className="font-bold text-chart-5">NEW EQUIPMENT!</span>
                      <Sparkles className="w-5 h-5 text-chart-5" />
                    </div>
                    <p className="text-lg font-bold">
                      {EQUIPMENT.find(e => e.id === reward.newEquipment)?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {EQUIPMENT.find(e => e.id === reward.newEquipment)?.description}
                    </p>
                  </div>
                )}
              </div>
              
              <Button onClick={onClaim} className="w-full gap-2" data-testid="button-claim-rewards">
                <Check className="w-4 h-4" />
                Claim Rewards
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

interface DonationPackage {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  coins: number;
  currency: string;
}

interface DonationShopModalProps {
  onClose: () => void;
}

function DonationShopModal({ onClose }: DonationShopModalProps) {
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: packages, isLoading: packagesLoading } = useQuery<DonationPackage[]>({
    queryKey: ["/api/donation-packages"],
  });

  const { data: stripeKeyData } = useQuery<{ publishableKey: string }>({
    queryKey: ["/api/stripe-key"],
  });

  const handleDonate = async (pkg: DonationPackage) => {
    if (!pkg.priceId) {
      toast({
        title: "Error",
        description: "This package is not available for purchase at this time.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(pkg.id);
    try {
      const response = await apiRequest("POST", "/api/create-checkout", { priceId: pkg.priceId });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsCheckingOut(null);
    }
  };

  const getPackageIcon = (amount: number) => {
    if (amount >= 10000) return <Star className="w-8 h-8" />;
    if (amount >= 5000) return <Trophy className="w-8 h-8" />;
    if (amount >= 2500) return <Shield className="w-8 h-8" />;
    if (amount >= 1000) return <Gift className="w-8 h-8" />;
    return <Heart className="w-8 h-8" />;
  };

  const getPackageGradient = (amount: number) => {
    if (amount >= 10000) return "from-amber-500/20 to-yellow-500/10 border-amber-500/50";
    if (amount >= 5000) return "from-purple-500/20 to-pink-500/10 border-purple-500/50";
    if (amount >= 2500) return "from-blue-500/20 to-cyan-500/10 border-blue-500/50";
    if (amount >= 1000) return "from-green-500/20 to-emerald-500/10 border-green-500/50";
    return "from-orange-500/20 to-red-500/10 border-orange-500/50";
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency.toUpperCase(),
    }).format(amount / 100);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Heart className="w-6 h-6 text-chart-5" />
              Support the Campaign
            </CardTitle>
            <p className="text-sm text-muted-foreground">Purchase coins while helping children in need</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-donation-shop">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-gradient-to-r from-chart-5/20 to-chart-4/20 border border-chart-5/30 rounded-lg p-4 text-center">
            <Heart className="w-8 h-8 mx-auto mb-2 text-chart-5" />
            <p className="font-medium text-chart-5">
              100% of donations go directly to helping children in need this winter
            </p>
          </div>

          {packagesLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : packages && packages.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {packages.map((pkg) => (
                <div
                  key={pkg.id}
                  className={`relative rounded-lg border-2 bg-gradient-to-br p-5 transition-all hover:scale-[1.02] ${getPackageGradient(pkg.amount)}`}
                  data-testid={`donation-package-${pkg.id}`}
                >
                  <div className="flex flex-col items-center text-center space-y-3">
                    <div className="text-chart-5">
                      {getPackageIcon(pkg.amount)}
                    </div>
                    <h3 className="font-bold text-lg">{pkg.name}</h3>
                    <p className="text-2xl font-bold text-chart-5">
                      {formatPrice(pkg.amount, pkg.currency || "usd")}
                    </p>
                    <div className="flex items-center gap-1 bg-chart-5/20 px-3 py-1 rounded-full">
                      <Coins className="w-4 h-4 text-chart-5" />
                      <span className="font-bold text-chart-5">{pkg.coins.toLocaleString()} coins</span>
                    </div>
                    <p className="text-sm text-muted-foreground min-h-[2.5rem]">
                      {pkg.description}
                    </p>
                    <Button
                      className="w-full gap-2"
                      onClick={() => handleDonate(pkg)}
                      disabled={isCheckingOut !== null}
                      data-testid={`donate-button-${pkg.id}`}
                    >
                      {isCheckingOut === pkg.id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Heart className="w-4 h-4" />
                          Donate
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Gift className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                No donation packages available at this time.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Please check back later or contact support.
              </p>
            </div>
          )}

          <div className="bg-chart-4/10 border border-chart-4/30 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Have a coupon code? You can enter it on the checkout page!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
            <Shield className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
            <ExternalLink className="w-3 h-3" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ShopProduct {
  id: string;
  name: string;
  description: string;
  priceId: string;
  amount: number;
  coins: number;
  currency: string;
  type: string;
  skinId: string | null;
  color: string | null;
  perks: string | null;
}

interface SkinShopModalProps {
  playerData: ExtendedPlayerData;
  onEquip: (skinId: string | null) => void;
  onClose: () => void;
}

function SkinShopModal({ playerData, onEquip, onClose }: SkinShopModalProps) {
  const [isCheckingOut, setIsCheckingOut] = useState<string | null>(null);
  const { toast } = useToast();

  const { data: products, isLoading } = useQuery<ShopProduct[]>({
    queryKey: ["/api/shop-products"],
  });

  const gamePassProduct = products?.find(p => p.type === "gamepass");
  const skinProducts = products?.filter(p => p.type === "skin") || [];

  const handlePurchase = async (product: ShopProduct) => {
    if (!product.priceId) {
      toast({
        title: "Error",
        description: "This product is not available for purchase.",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(product.id);
    try {
      const response = await apiRequest("POST", "/api/create-checkout", { 
        priceId: product.priceId,
        productType: product.type,
        skinId: product.skinId,
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL returned");
      }
    } catch (error) {
      console.error("Checkout error:", error);
      toast({
        title: "Checkout Failed",
        description: "Unable to start checkout. Please try again.",
        variant: "destructive",
      });
      setIsCheckingOut(null);
    }
  };

  const formatPrice = (amount: number, currency: string) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency?.toUpperCase() || "USD",
    }).format(amount / 100);
  };

  const isSkinOwned = (skinId: string) => {
    return playerData.hasGamePass || playerData.ownedSkins.includes(skinId);
  };

  const isEquipped = (skinId: string) => {
    return playerData.equippedSkin === skinId;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-auto">
        <CardHeader className="flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Palette className="w-6 h-6 text-purple-500" />
              Skin Shop
            </CardTitle>
            <p className="text-sm text-muted-foreground">Customize your player with premium skins</p>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} data-testid="close-skin-shop">
            <X className="w-5 h-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          {playerData.hasGamePass && (
            <div className="bg-gradient-to-r from-yellow-500/20 to-amber-500/20 border border-yellow-500/50 rounded-lg p-4 flex items-center gap-3">
              <Star className="w-8 h-8 text-yellow-500" />
              <div>
                <p className="font-bold text-yellow-500">Game Pass Active</p>
                <p className="text-sm text-muted-foreground">All skins unlocked! Enjoy 2x XP and +100 starting coins each game.</p>
              </div>
            </div>
          )}

          {!playerData.hasGamePass && gamePassProduct && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500/50 rounded-lg p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center">
                    <Star className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{gamePassProduct.name}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{gamePassProduct.description}</p>
                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">2x XP</span>
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">+100 Starting Coins</span>
                      <span className="bg-purple-500/20 text-purple-400 px-2 py-1 rounded">All Skins</span>
                    </div>
                  </div>
                </div>
                <Button 
                  onClick={() => handlePurchase(gamePassProduct)}
                  disabled={isCheckingOut !== null}
                  className="shrink-0"
                  data-testid="buy-gamepass"
                >
                  {isCheckingOut === gamePassProduct.id ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : null}
                  {formatPrice(gamePassProduct.amount, gamePassProduct.currency)}
                </Button>
              </div>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="font-bold text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Available Skins
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {skinProducts.map((product) => {
                  const skinId = product.skinId || "";
                  const owned = isSkinOwned(skinId);
                  const equipped = isEquipped(skinId);
                  const colorHex = product.color?.replace("0x", "#") || "#888888";
                  
                  return (
                    <div
                      key={product.id}
                      className={`relative rounded-lg border-2 p-4 transition-all ${
                        equipped 
                          ? "border-purple-500 bg-purple-500/10" 
                          : owned 
                            ? "border-green-500/50 bg-green-500/5" 
                            : "border-border"
                      }`}
                      data-testid={`skin-card-${skinId}`}
                    >
                      <div className="flex items-start gap-4">
                        <div 
                          className="w-16 h-16 rounded-full shrink-0 border-4 border-background shadow-lg"
                          style={{ backgroundColor: colorHex }}
                          data-testid={`skin-preview-${skinId}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-bold">{product.name}</h4>
                            {equipped && (
                              <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded">Equipped</span>
                            )}
                            {!equipped && owned && (
                              <span className="text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded">Owned</span>
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">{product.description}</p>
                          
                          <div className="flex items-center gap-2">
                            {owned ? (
                              equipped ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  onClick={() => onEquip(null)}
                                  data-testid={`unequip-${skinId}`}
                                >
                                  Unequip
                                </Button>
                              ) : (
                                <Button 
                                  size="sm"
                                  onClick={() => onEquip(skinId)}
                                  data-testid={`equip-${skinId}`}
                                >
                                  <Check className="w-4 h-4 mr-1" />
                                  Equip
                                </Button>
                              )
                            ) : (
                              <>
                                {playerData.hasGamePass ? (
                                  <span className="text-sm text-muted-foreground">Included with Game Pass</span>
                                ) : (
                                  <Button
                                    size="sm"
                                    onClick={() => handlePurchase(product)}
                                    disabled={isCheckingOut !== null}
                                    data-testid={`buy-skin-${skinId}`}
                                  >
                                    {isCheckingOut === product.id ? (
                                      <Loader2 className="w-4 h-4 animate-spin mr-1" />
                                    ) : null}
                                    {formatPrice(product.amount, product.currency)}
                                  </Button>
                                )}
                                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                  <Coins className="w-3 h-3" />
                                  +{product.coins} bonus
                                </div>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {skinProducts.length === 0 && !isLoading && (
            <div className="text-center py-8">
              <Palette className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No skins available yet.</p>
              <p className="text-sm text-muted-foreground mt-1">Check back later for new cosmetics!</p>
            </div>
          )}

          <div className="bg-chart-4/10 border border-chart-4/30 rounded-lg p-3 text-center">
            <p className="text-sm text-muted-foreground">
              Have a coupon code? You can enter it on the checkout page!
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-4 border-t">
            <Shield className="w-4 h-4" />
            <span>Secure payment powered by Stripe</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface LevelSelectModalProps {
  playerData: ExtendedPlayerData;
  onSelectLevel: (levelId: number) => void;
  onClose: () => void;
}

function LevelSelectModal({ playerData, onSelectLevel, onClose }: LevelSelectModalProps) {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  
  const getStarsDisplay = (levelId: number) => {
    const progress = playerData.levelsCompleted[levelId];
    if (!progress?.completed) return null;
    return progress.stars;
  };
  
  const isUnlocked = (levelId: number) => {
    return levelId <= playerData.highestLevelUnlocked;
  };
  
  const selectedLevelConfig = selectedLevel ? getLevelConfig(selectedLevel) : null;
  const selectedMapTheme = selectedLevelConfig ? getMapTheme(selectedLevelConfig.mapId) : null;
  
  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between gap-2 shrink-0">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="w-6 h-6 text-chart-5" />
              Level Select
            </CardTitle>
            <p className="text-sm text-muted-foreground">100 stages across 10 unique worlds</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-muted px-3 py-1.5 rounded-lg">
              <Star className="w-4 h-4 text-chart-5" />
              <span className="font-bold">Lv.{playerData.highestLevelUnlocked}</span>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden flex gap-4">
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-10 gap-2">
              {GAME_LEVELS.map((level) => {
                const unlocked = isUnlocked(level.id);
                const stars = getStarsDisplay(level.id);
                const progress = playerData.levelsCompleted[level.id];
                const isSelected = selectedLevel === level.id;
                
                return (
                  <button
                    key={level.id}
                    onClick={() => unlocked && setSelectedLevel(level.id)}
                    disabled={!unlocked}
                    className={`
                      relative aspect-square rounded-lg border-2 flex items-center justify-center font-bold text-sm transition-all
                      ${isSelected ? 'border-primary bg-primary/20 scale-105' : 'border-border'}
                      ${unlocked ? 'hover:border-primary/50 cursor-pointer' : 'opacity-50 cursor-not-allowed bg-muted/50'}
                      ${progress?.completed ? 'bg-chart-5/10' : ''}
                    `}
                    data-testid={`level-${level.id}`}
                  >
                    {unlocked ? (
                      <>
                        <span>{level.id}</span>
                        {stars !== null && stars > 0 && (
                          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                            {[...Array(Math.min(3, stars))].map((_, i) => (
                              <Star key={i} className="w-2 h-2 text-chart-5 fill-chart-5" />
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Lock className="w-4 h-4 text-muted-foreground" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
          
          <div className="w-64 shrink-0 border-l pl-4 flex flex-col gap-4">
            {selectedLevelConfig ? (
              <>
                <div 
                  className="h-32 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: selectedMapTheme ? `#${selectedMapTheme.backgroundColor.toString(16).padStart(6, '0')}` : '#87CEEB' }}
                >
                  <div className="text-center">
                    <h3 className="font-bold text-lg text-white drop-shadow-lg">{selectedLevelConfig.name}</h3>
                    <p className="text-sm text-white/80 drop-shadow">{selectedMapTheme?.name}</p>
                  </div>
                </div>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Level</span>
                    <span className="font-bold">{selectedLevelConfig.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Difficulty</span>
                    <span className="font-bold">{selectedLevelConfig.difficulty.toFixed(2)}x</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-bold">5:00</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Coin Reward</span>
                    <span className="font-bold text-chart-5">{selectedLevelConfig.rewards.coins}</span>
                  </div>
                </div>
                
                <div className="space-y-1 text-xs border-t pt-2">
                  <p className="text-muted-foreground font-medium">Boss Encounters:</p>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>2:00 - {getMiniBoss(selectedLevelConfig.miniBoss1)?.name || "Mini-Boss 1"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    <span>4:00 - {getMiniBoss(selectedLevelConfig.miniBoss2)?.name || "Mini-Boss 2"}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Sword className="w-3 h-3 text-destructive" />
                    <span>5:00 - Final Boss</span>
                  </div>
                </div>
                
                <Button 
                  className="w-full mt-auto" 
                  onClick={() => onSelectLevel(selectedLevelConfig.id)}
                  data-testid="button-start-level"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Level {selectedLevelConfig.id}
                </Button>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                <div>
                  <Target className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Select a level to view details</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
