import { useEffect, useRef, useState, useCallback } from "react";
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
import nipplejs from 'nipplejs';
import { 
  Pause, Play, Settings, Home, Heart, Gift, Trophy, 
  Coins, Clock, Zap, Shield, Sparkles, Sun, Moon, X, Target,
  Shirt, Footprints, Hand, Lock, Check, TreeDeciduous, Sword, Star,
  ExternalLink, Loader2, Palette
} from "lucide-react";
import { 
  getSettings, saveSettings, getPlayerData, savePlayerData, addCoins, updateBestTime, 
  addChildrenHelped, purchaseUpgrade, purchaseEquipment, equipItem, unequipItem,
  purchaseSkillNode, getEquippedStats, getSkillStats,
  unlockGamePass, unlockSkin, equipSkin, getUpgradeCost,
  completeLevel, isLevelUnlocked,
  getEquipmentLevel, getEquipmentCardCount, getEquipmentCardsNeeded, 
  upgradeEquipment, getEquipmentStatsWithLevel, awardChest, openChest,
  type GameSettings, type ExtendedPlayerData, type EquipmentLoadout,
  type ChestReward, type PendingChest
} from "@/lib/storage";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { 
  META_UPGRADES, EQUIPMENT, SKILL_TREE,
  GAME_LEVELS, getLevelConfig, getMapTheme, getMiniBoss,
  type GameStatus, type InsertScore, type Score, type PlayerMetaData, type MetaUpgrade, 
  type Equipment, type SkillNode, type Chest
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
          const fw = 512;
          const fh = 512;

          this.load.spritesheet("player", "/assets/characters/mainCharacter.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("firstMob", "/assets/characters/firstMob.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("secondMob", "/assets/characters/secondMob.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("thirdMob", "/assets/characters/thirdMob.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("firstBoss", "/assets/characters/firstBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("secondBoss", "/assets/characters/secondBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("thirdBoss", "/assets/characters/thirdBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("fourthBoss", "/assets/characters/fourthBoss.png", { frameWidth: fw, frameHeight: fh });
          this.load.spritesheet("fifthBoss", "/assets/characters/fifthBoss.png", { frameWidth: fw, frameHeight: fh });
          
          // Gift projectile
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
          graphics.generateTexture("gift", 24, 24);
          
          // Winter Coin
          graphics.clear();
          graphics.fillStyle(0xffa500);
          graphics.fillCircle(12, 14, 10);
          graphics.fillStyle(0xffd700);
          graphics.fillCircle(12, 14, 8);
          graphics.generateTexture("coin", 24, 24);
          
          // XP Snowflake
          graphics.clear();
          graphics.fillStyle(0x1a4a6e);
          graphics.fillCircle(12, 12, 11);
          graphics.fillStyle(0x2a6a9e);
          graphics.fillCircle(12, 12, 9);
          graphics.generateTexture("xp", 24, 24);
          
          graphics.destroy();
        },
        create: function(this: Phaser.Scene) {
          const scene = this;

          for (let i = 0; i < 20; i++) {
            const bgGraphics = this.add.graphics();
            const x = Phaser.Math.Between(0, 800);
            const buildingHeight = Phaser.Math.Between(100, 300);
            const buildingWidth = Phaser.Math.Between(40, 80);
            bgGraphics.fillStyle(theme === "dark" ? 0x2a2a4e : 0xb8d4e8, 0.6);
            bgGraphics.fillRect(x, 600 - buildingHeight, buildingWidth, buildingHeight);
            bgGraphics.setDepth(-10);
          }
          
          const metaThrowBonus = 1 - (playerData.upgrades["throwRate"] || 0) * 0.08;
          const metaSpeedBonus = 1 + (playerData.upgrades["moveSpeed"] || 0) * 0.08;
          const metaCoinDropBonus = (playerData.upgrades["coinDropRate"] || 0) * 0.03;
          
          const extendedData = playerData as ExtendedPlayerData;
          const equipStats = getEquippedStats(extendedData);
          const skillStats = getSkillStats(extendedData);
          
          const equipSpeedBonus = 1 + Math.min(equipStats.speedBonus || 0, 0.5);
          const equipThrowBonus = Math.max(0.5, 1 - Math.min(equipStats.throwRateBonus || 0, 0.4));
          const equipHpBonus = Math.floor((equipStats.hpBonus || 0) * 10);
          const equipDamageBonus = 1 + Math.min(equipStats.damageBonus || 0, 0.5);
          const equipPickupBonus = Math.floor((equipStats.pickupRadiusBonus || 0) * 50);
          
          const skillDamageBonus = 1 + Math.min(skillStats.damageBonus || 0, 0.5);
          const skillDefenseBonus = Math.max(0.5, 1 - Math.min(skillStats.defenseBonus || 0, 0.3));
          const skillSpeedBonus = 1 + Math.min(skillStats.speedBonus || 0, 0.3);
          const skillPickupBonus = Math.floor(skillStats.pickupBonus || 0);
          
          const isLevelMode = gameState.gameMode === "levels";
          const levelConfig = isLevelMode ? getLevelConfig(gameState.currentLevel) : null;
          const LEVEL_DURATION = 300000;
          
          const totalDamageMultiplier = equipDamageBonus * skillDamageBonus;
          const baseHp = gameState.maxHp + equipHpBonus;
          
          const baseLevelSpawnRate = levelConfig ? Math.max(200, 600 / levelConfig.spawnRateMultiplier) : 600;
          
          const gameData = {
            player: null as Phaser.Physics.Arcade.Sprite | null,
            children: null as Phaser.Physics.Arcade.Group | null,
            gifts: null as Phaser.Physics.Arcade.Group | null,
            pickups: null as Phaser.Physics.Arcade.Group | null,
            cursors: null as Phaser.Types.Input.Keyboard.CursorKeys | null,
            wasd: null as { W: Phaser.Input.Keyboard.Key; A: Phaser.Input.Keyboard.Key; S: Phaser.Input.Keyboard.Key; D: Phaser.Input.Keyboard.Key } | null,
            joystick: null as { x: number, y: number } | null,
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
            bossSpawnInterval: 90000,
            playerSlowed: false,
            playerSlowTimer: 0,
            pendingLevelUps: 0,
            vampiricKillCount: 0,
            regenerationTimer: 0,
            lastMovementDirection: { x: 0, y: 0 },
            playerDashCooldown: 0,
            doubleTapTimer: 0,
            metaCoinDropBonus: Math.min(metaCoinDropBonus, 0.45),
          };

          gameData.player = scene.physics.add.sprite(400, 300, "player", 0);
          gameData.player.setScale(0.10);
          gameData.player.body.setSize(220, 220, true);
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

          // Game helper functions
          const helpChild = (childSprite: Phaser.Physics.Arcade.Sprite) => {
            soundManager.playHit();
            childSprite.destroy();
            gameData.score += 10;
            gameData.childrenHelped++;
            setGameState(prev => ({
              ...prev,
              score: gameData.score,
              childrenHelped: gameData.childrenHelped,
            }));
          };

          const BOSS_CONFIG: Record<string, any> = {
            frostGiant: { sprite: "firstBoss", scale: 0.14, baseHp: 8, speed: 40 },
            blizzardKing: { sprite: "secondBoss", scale: 0.14, baseHp: 10, speed: 35 },
            iceDragon: { sprite: "thirdBoss", scale: 0.14, baseHp: 12, speed: 45 },
          };
          (gameData as any).BOSS_CONFIG = BOSS_CONFIG;

          (scene as any).gameData = gameData;
        },
        update: function(this: Phaser.Scene, time: number, delta: number)
        {
          const gameData = (this as any).gameData;
          if (!gameData || !gameData.player || gameStateRef.current.isPaused || gameStateRef.current.showLevelUp || gameStateRef.current.showLevelComplete) return;

          gameData.gameTime += delta;
          const timeSurvived = Math.floor(gameData.gameTime / 1000);
          
          if (timeSurvived !== gameData.lastTimeSurvived) {
            gameData.lastTimeSurvived = timeSurvived;
            setGameState(prev => ({ ...prev, timeSurvived }));
          }

          // Movement Logic
          let vx = 0, vy = 0;
          if (gameData.cursors?.left.isDown || gameData.wasd?.A.isDown) vx = -1;
          if (gameData.cursors?.right.isDown || gameData.wasd?.D.isDown) vx = 1;
          if (gameData.cursors?.up.isDown || gameData.wasd?.W.isDown) vy = -1;
          if (gameData.cursors?.down.isDown || gameData.wasd?.S.isDown) vy = 1;

          if (gameData.joystick) {
            vx = gameData.joystick.x;
            vy = -gameData.joystick.y;
          }

          const len = Math.sqrt(vx * vx + vy * vy);
          if (len > 0) {
            vx = (vx / len) * gameData.baseMoveSpeed;
            vy = (vy / len) * gameData.baseMoveSpeed;
          }
          gameData.player.setVelocity(vx, vy);

          // Throwing logic
          if (time - gameData.lastThrow > gameData.baseThrowRate) {
            gameData.lastThrow = time;
            const gift = this.physics.add.sprite(gameData.player.x, gameData.player.y, "gift");
            gameData.gifts.add(gift);
            gift.setVelocity(0, -300); // Simple upward throw for now
            this.time.delayedCall(2000, () => { if (gift.active) gift.destroy(); });
          }
        },
      },
      scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
      },
    };

    gameRef.current = new Phaser.Game(config);
    
    // Joystick setup
    const joystickZone = document.getElementById('joystick-zone');
    let joystickManager: nipplejs.JoystickManager | null = null;

    if (joystickZone) {
      joystickManager = nipplejs.create({
        zone: joystickZone,
        mode: 'static',
        position: { left: '50%', top: '50%' },
        color: 'white',
        size: 100
      });

      joystickManager.on('move', (evt, data) => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.scenes[0];
          const dataAny = (scene as any).gameData;
          if (dataAny && data.vector) {
            dataAny.joystick = data.vector;
          }
        }
      });

      joystickManager.on('end', () => {
        if (gameRef.current) {
          const scene = gameRef.current.scene.scenes[0];
          const dataAny = (scene as any).gameData;
          if (dataAny) {
            dataAny.joystick = null;
          }
        }
      });
    }

    return () => {
      if (joystickManager) joystickManager.destroy();
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
                <Button onClick={() => startGame("limitless")} className="w-full h-auto py-4">Start Game</Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button variant="outline" onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}>Settings</Button>
                  <Button variant="outline" onClick={() => setGameState(prev => ({ ...prev, showEquipmentShop: true }))}>Shop</Button>
                </div>
                <Link href="/">
                  <Button variant="ghost" className="w-full">Back to Home</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
        {gameState.showSettings && <SettingsModal settings={settings} onUpdate={updateSettings} onClose={() => setGameState(prev => ({ ...prev, showSettings: false }))} theme={theme} toggleTheme={toggleTheme} />}
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden relative">
      {/* HUD - Desktop & Mobile */}
      <div className="absolute top-4 left-4 right-4 z-20 flex justify-between items-start pointer-events-none">
        
        {/* Desktop Top Bar */}
        <div className="hidden md:flex space-y-2 pointer-events-auto min-w-[200px] flex-col">
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-card-border shadow-lg">
            <div className="flex items-center gap-2 mb-1">
              <Heart className="w-4 h-4 text-destructive" />
              <span className="text-sm font-bold">HP</span>
            </div>
            <Progress value={(gameState.hp / gameState.maxHp) * 100} className="h-3" />
            <span className="text-xs text-muted-foreground">{Math.ceil(gameState.hp)}/{gameState.maxHp}</span>
          </div>
          <div className="bg-card/90 backdrop-blur-sm rounded-lg p-3 border border-card-border shadow-lg">
             <div className="flex items-center gap-2 mb-1">
               <Zap className="w-4 h-4 text-chart-4" />
               <span className="text-sm font-bold">Level {gameState.level}</span>
             </div>
             <Progress value={(gameState.xp / gameState.xpToLevel) * 100} className="h-2" />
          </div>
        </div>

        {/* Center Stats (Desktop) */}
        <div className="hidden md:flex bg-card/90 backdrop-blur-sm rounded-lg px-6 py-3 border border-card-border shadow-lg items-center gap-6 pointer-events-auto">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold text-lg">{formatTime(gameState.timeSurvived)}</span>
          </div>
          <div className="flex items-center gap-2">
            <Gift className="w-4 h-4 text-primary" />
            <span className="font-mono font-bold">{gameState.childrenHelped}</span>
          </div>
          <div className="flex items-center gap-2">
            <Coins className="w-4 h-4 text-chart-5" />
            <span className="font-mono font-bold">{gameState.coinsEarned}</span>
          </div>
        </div>

        {/* Mobile Top Bar */}
        <div className="md:hidden flex w-full justify-between items-start pointer-events-none">
           <div className="space-y-1 pointer-events-auto w-[40%]">
              <div className="bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-white/10">
                 <div className="flex items-center gap-1 mb-1">
                    <Heart className="w-3 h-3 text-red-500" />
                    <Progress value={(gameState.hp / gameState.maxHp) * 100} className="h-1.5 w-full" />
                 </div>
                 <div className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-yellow-500" />
                    <Progress value={(gameState.xp / gameState.xpToLevel) * 100} className="h-1.5 w-full" />
                 </div>
              </div>
           </div>
           
           <div className="bg-black/60 backdrop-blur-md rounded-md px-3 py-1 border border-white/10 pointer-events-auto">
              <span className="font-mono font-bold text-white text-lg drop-shadow-md">
                 {formatTime(gameState.timeSurvived)}
              </span>
           </div>

           <div className="pointer-events-auto">
              <Button size="icon" variant="secondary" onClick={pauseGame} className="h-8 w-8 bg-black/60 border border-white/10 text-white hover:bg-black/80">
                 {gameState.isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
              </Button>
           </div>
        </div>

        {/* Desktop Controls */}
        <div className="hidden md:flex gap-2 pointer-events-auto">
           <Button size="icon" variant="secondary" onClick={pauseGame}>
             {gameState.isPaused ? <Play className="w-5 h-5" /> : <Pause className="w-5 h-5" />}
           </Button>
           <Button size="icon" variant="secondary" onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}>
             <Settings className="w-5 h-5" />
           </Button>
        </div>
      </div>

      {/* Mobile Bottom Stats */}
      <div className="md:hidden absolute top-14 right-2 z-20 pointer-events-none flex flex-col gap-2 items-end">
         <div className="bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-white/10 flex items-center gap-2 text-white text-xs">
            <Gift className="w-3 h-3 text-green-400" />
            <span className="font-mono font-bold">{gameState.childrenHelped}</span>
         </div>
         <div className="bg-black/60 backdrop-blur-md rounded-md p-1.5 border border-white/10 flex items-center gap-2 text-white text-xs">
            <Coins className="w-3 h-3 text-yellow-400" />
            <span className="font-mono font-bold">{gameState.coinsEarned}</span>
         </div>
      </div>

      {/* Game Canvas */}
      <div ref={gameContainerRef} className="flex-1 w-full h-full flex items-center justify-center bg-black" />

      {/* Joystick Zone (Mobile) */}
      <div id="joystick-zone" className="block md:hidden" />

      {/* Pause Modal */}
      {gameState.isPaused && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card className="w-[85%] max-w-sm border-white/20 bg-card">
            <CardHeader className="text-center py-4">
              <CardTitle>Paused</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pb-6">
              <Button className="w-full h-12 text-lg" onClick={pauseGame}>
                <Play className="w-5 h-5 mr-2" />
                Resume
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setGameState(prev => ({ ...prev, showSettings: true }))}>
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </Button>
              <Button variant="ghost" className="w-full text-destructive" onClick={endGameRef.current}>
                End Run
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Level Up Modal */}
      {gameState.showLevelUp && (
        <div className="absolute inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-y-auto">
            <CardHeader className="text-center py-3">
              <Sparkles className="w-8 h-8 mx-auto text-chart-5 mb-1" />
              <CardTitle className="text-xl">Level Up!</CardTitle>
              <p className="text-muted-foreground text-sm">Choose a reward</p>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 gap-3">
                {gameState.levelUpChoices.map((upgrade) => (
                   <button
                      key={upgrade.id}
                      onClick={() => handleLevelUp(upgrade.id)}
                      className={`p-3 rounded-lg border-2 text-left transition-all active:scale-95 flex items-center gap-3 ${getRarityColor(upgrade.rarity)}`}
                    >
                      <div className={`p-2 rounded-full bg-background/50`}>
                        <Zap className="w-5 h-5" /> 
                      </div>
                      <div>
                        <h3 className="font-bold mb-1">{upgrade.name}</h3>
                        <p className="text-sm text-muted-foreground">{upgrade.description}</p>
                      </div>
                    </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Game Over Modal */}
      {gameState.isGameOver && (
          <div className="absolute inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
            <Card className="w-full max-w-md border-white/10">
              <CardHeader className="text-center">
                <Trophy className="w-12 h-12 mx-auto text-yellow-500 mb-2" />
                <CardTitle className="text-2xl text-white">Game Over</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3 text-center">
                   <div className="bg-muted/20 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Time</p>
                      <p className="text-lg font-bold text-white">{formatTime(gameState.timeSurvived)}</p>
                   </div>
                   <div className="bg-muted/20 p-2 rounded">
                      <p className="text-xs text-muted-foreground">Score</p>
                      <p className="text-lg font-bold text-white">{gameState.score}</p>
                   </div>
                </div>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="playerName" className="text-white">Enter your name</Label>
                    <Input
                      id="playerName"
                      value={playerName}
                      onChange={(e) => setPlayerName(e.target.value)}
                      placeholder="Your name"
                      maxLength={20}
                      className="mt-1 bg-black/50 border-white/20 text-white"
                    />
                  </div>
                  <Button
                    className="w-full"
                    onClick={submitScore}
                    disabled={!playerName.trim() || submitScoreMutation.isPending}
                  >
                    {submitScoreMutation.isPending ? "Submitting..." : "Submit Score"}
                  </Button>
                </div>

                <div className="flex gap-2">
                   <Button className="flex-1 h-12 text-lg font-bold" onClick={() => window.location.reload()}>
                      Play Again
                   </Button>
                   <Link href="/" className="flex-1">
                      <Button variant="ghost" className="w-full text-white h-12">Menu</Button>
                   </Link>
                </div>
              </CardContent>
            </Card>
          </div>
      )}
      
      {/* Settings Modal */}
      {gameState.showSettings && (
        <SettingsModal
          settings={settings}
          onUpdate={updateSettings}
          onClose={() => setGameState(prev => ({ ...prev, showSettings: false }))}
          theme={theme}
          toggleTheme={toggleTheme}
        />
      )}
    </div>
  );
}

// Sub-components located at the bottom of the file
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
            <Switch checked={theme === "dark"} onCheckedChange={toggleTheme} />
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
          <Button className="w-full" onClick={onClose}>Done</Button>
        </CardContent>
      </Card>
    </div>
  );
}