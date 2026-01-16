import { type PlayerMetaData, META_UPGRADES, EQUIPMENT, SKILL_TREE, WEAPONS, CHESTS, type Equipment, type Chest } from "@shared/schema";

const STORAGE_KEY = "giftstorm_player_data";
const SETTINGS_KEY = "giftstorm_settings";

export interface EquipmentLoadout {
  jacket: string | null;
  socks: string | null;
  gloves: string | null;
  pants: string | null;
  sweater: string | null;
}

export interface LevelProgress {
  completed: boolean;
  stars: number;
  bestTime: number;
  attempts: number;
}

export interface ChestReward {
  coins: number;
  cards: { equipmentId: string; count: number }[];
  newEquipment?: string;
}

export interface PendingChest {
  chest: Chest;
  levelEarned: number;
}

export interface ExtendedPlayerData extends PlayerMetaData {
  equipment: EquipmentLoadout;
  ownedEquipment: string[];
  skillLevels: Record<string, number>;
  unlockedWeapons: string[];
  activeWeapons: string[];
  weaponUpgrades: Record<string, string[]>;
  hasGamePass: boolean;
  ownedSkins: string[];
  equippedSkin: string | null;
  levelsCompleted: Record<number, LevelProgress>;
  highestLevelUnlocked: number;
  equipmentCards: Record<string, number>;
  equipmentLevels: Record<string, number>;
  pendingChests: PendingChest[];
}

export interface GameSettings {
  soundEnabled: boolean;
  reducedMotion: boolean;
  mobileControlSize: "small" | "medium" | "large";
  manualAim: boolean;
  showWarmthMeter: boolean;
}

const DEFAULT_PLAYER_DATA: ExtendedPlayerData = {
  coins: 0,
  upgrades: {},
  bestTime: 0,
  totalChildrenHelped: 0,
  equipment: {
    jacket: null,
    socks: null,
    gloves: null,
    pants: null,
    sweater: null,
  },
  ownedEquipment: [],
  skillLevels: {},
  unlockedWeapons: ["gift_box"],
  activeWeapons: ["gift_box"],
  weaponUpgrades: {},
  hasGamePass: false,
  ownedSkins: [],
  equippedSkin: null,
  levelsCompleted: {},
  highestLevelUnlocked: 1,
  equipmentCards: {},
  equipmentLevels: {},
  pendingChests: [],
};

const DEFAULT_SETTINGS: GameSettings = {
  soundEnabled: true,
  reducedMotion: false,
  mobileControlSize: "medium",
  manualAim: false,
  showWarmthMeter: true,
};

export function getPlayerData(): ExtendedPlayerData {
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    if (data) {
      const parsed = JSON.parse(data);
      return { 
        ...DEFAULT_PLAYER_DATA, 
        ...parsed,
        equipment: { ...DEFAULT_PLAYER_DATA.equipment, ...(parsed.equipment || {}) },
      };
    }
  } catch (e) {
    console.error("Failed to load player data:", e);
  }
  return { ...DEFAULT_PLAYER_DATA };
}

export function savePlayerData(data: ExtendedPlayerData): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save player data:", e);
  }
}

export function addCoins(amount: number): ExtendedPlayerData {
  const data = getPlayerData();
  data.coins += amount;
  savePlayerData(data);
  return data;
}

export function purchaseEquipment(equipmentId: string): boolean {
  const data = getPlayerData();
  const equipment = EQUIPMENT.find(e => e.id === equipmentId);
  if (!equipment) return false;
  if (data.ownedEquipment.includes(equipmentId)) return false;
  if (data.coins < equipment.cost) return false;
  
  data.coins -= equipment.cost;
  data.ownedEquipment.push(equipmentId);
  savePlayerData(data);
  return true;
}

export function equipItem(equipmentId: string): boolean {
  const data = getPlayerData();
  const equipment = EQUIPMENT.find(e => e.id === equipmentId);
  if (!equipment) return false;
  if (!data.ownedEquipment.includes(equipmentId)) return false;
  
  data.equipment[equipment.slot] = equipmentId;
  savePlayerData(data);
  return true;
}

export function unequipItem(slot: keyof EquipmentLoadout): boolean {
  const data = getPlayerData();
  data.equipment[slot] = null;
  savePlayerData(data);
  return true;
}

export function getEquippedStats(data: ExtendedPlayerData): { hpBonus: number; speedBonus: number; throwRateBonus: number; pickupRadiusBonus: number; damageBonus: number } {
  const stats = { hpBonus: 0, speedBonus: 0, throwRateBonus: 0, pickupRadiusBonus: 0, damageBonus: 0 };
  
  Object.values(data.equipment).forEach(equipId => {
    if (equipId) {
      const item = EQUIPMENT.find(e => e.id === equipId);
      if (item) {
        stats.hpBonus += item.stats.hp || 0;
        stats.speedBonus += item.stats.speed || 0;
        stats.throwRateBonus += item.stats.throwRate || 0;
        stats.pickupRadiusBonus += item.stats.pickupRadius || 0;
        stats.damageBonus += item.stats.damage || 0;
      }
    }
  });
  
  return stats;
}

export function purchaseSkillNode(nodeId: string): boolean {
  const data = getPlayerData();
  const node = SKILL_TREE.find(n => n.id === nodeId);
  if (!node) return false;
  
  const currentLevel = data.skillLevels[nodeId] || 0;
  if (currentLevel >= node.maxLevel) return false;
  
  const cost = node.cost * (currentLevel + 1);
  if (data.coins < cost) return false;
  
  for (const prereq of node.prerequisiteIds) {
    const prereqNode = SKILL_TREE.find(n => n.id === prereq);
    if (prereqNode && (data.skillLevels[prereq] || 0) < 1) return false;
  }
  
  data.coins -= cost;
  data.skillLevels[nodeId] = currentLevel + 1;
  
  if (node.effect.stat === "unlockWeapon") {
    const weaponMap: Record<string, string> = {
      "unlock_sock": "boomerang_sock",
      "unlock_candy": "candy_cane",
      "unlock_aura": "warmth_aura",
    };
    const weaponId = weaponMap[nodeId];
    if (weaponId && !data.unlockedWeapons.includes(weaponId)) {
      data.unlockedWeapons.push(weaponId);
    }
  }
  
  savePlayerData(data);
  return true;
}

export function toggleActiveWeapon(weaponId: string): boolean {
  const data = getPlayerData();
  if (!data.unlockedWeapons.includes(weaponId)) return false;
  
  const idx = data.activeWeapons.indexOf(weaponId);
  if (idx >= 0) {
    if (data.activeWeapons.length <= 1) return false;
    data.activeWeapons.splice(idx, 1);
  } else {
    if (data.activeWeapons.length >= 3) return false;
    data.activeWeapons.push(weaponId);
  }
  
  savePlayerData(data);
  return true;
}

export function getSkillStats(data: ExtendedPlayerData): { damageBonus: number; defenseBonus: number; speedBonus: number; pickupBonus: number; hpBonus: number } {
  const stats = { damageBonus: 0, defenseBonus: 0, speedBonus: 0, pickupBonus: 0, hpBonus: 0 };
  
  SKILL_TREE.forEach(node => {
    const level = data.skillLevels[node.id] || 0;
    if (level > 0 && node.effect.stat !== "unlockWeapon") {
      const effect = node.effect;
      switch (effect.stat) {
        case "damage":
          stats.damageBonus += effect.value * level;
          break;
        case "maxHp":
          stats.hpBonus += effect.value * level;
          break;
        case "speed":
          stats.speedBonus += effect.value * level;
          break;
        case "dodge":
          stats.defenseBonus += effect.value * level;
          break;
        case "critChance":
          stats.damageBonus += effect.value * level * 0.5;
          break;
        case "fireRate":
          stats.pickupBonus += effect.value * level * 20;
          break;
        case "regen":
          stats.pickupBonus += effect.value * level * 10;
          break;
      }
    }
  });
  
  return stats;
}

export function getUpgradeLevel(upgradeId: string): number {
  const data = getPlayerData();
  return data.upgrades[upgradeId] || 0;
}

export function getUpgradeCost(upgrade: { costPerLevel: number; scalingFactor?: number }, currentLevel: number): number {
  const scalingFactor = upgrade.scalingFactor || 1.15;
  return Math.floor(upgrade.costPerLevel * Math.pow(scalingFactor, currentLevel));
}

export function purchaseUpgrade(upgradeId: string): boolean {
  const data = getPlayerData();
  const upgrade = META_UPGRADES.find(u => u.id === upgradeId);
  if (!upgrade) return false;
  
  const currentLevel = data.upgrades[upgradeId] || 0;
  if (currentLevel >= upgrade.maxLevel) return false;
  
  const currentEffect = upgrade.effect * currentLevel;
  const isCapped = upgrade.effectCap !== undefined && currentEffect >= upgrade.effectCap;
  if (isCapped) return false;
  
  const cost = getUpgradeCost(upgrade, currentLevel);
  if (data.coins < cost) return false;
  
  data.coins -= cost;
  data.upgrades[upgradeId] = currentLevel + 1;
  savePlayerData(data);
  return true;
}

export function getSettings(): GameSettings {
  try {
    const data = localStorage.getItem(SETTINGS_KEY);
    if (data) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    }
  } catch (e) {
    console.error("Failed to load settings:", e);
  }
  return { ...DEFAULT_SETTINGS };
}

export function saveSettings(settings: Partial<GameSettings>): GameSettings {
  const current = getSettings();
  const updated = { ...current, ...settings };
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Failed to save settings:", e);
  }
  return updated;
}

export function updateBestTime(time: number): void {
  const data = getPlayerData();
  if (time > data.bestTime) {
    data.bestTime = time;
    savePlayerData(data);
  }
}

export function addChildrenHelped(count: number): void {
  const data = getPlayerData();
  data.totalChildrenHelped += count;
  savePlayerData(data);
}

export function getAdminKey(): string | null {
  return localStorage.getItem("giftstorm_admin_key");
}

export function setAdminKey(key: string): void {
  localStorage.setItem("giftstorm_admin_key", key);
}

export function unlockGamePass(): void {
  const data = getPlayerData();
  data.hasGamePass = true;
  savePlayerData(data);
}

export function unlockSkin(skinId: string): void {
  const data = getPlayerData();
  if (!data.ownedSkins.includes(skinId)) {
    data.ownedSkins.push(skinId);
  }
  savePlayerData(data);
}

export function equipSkin(skinId: string | null): void {
  const data = getPlayerData();
  data.equippedSkin = skinId;
  savePlayerData(data);
}

export function completeLevel(levelId: number, timeRemaining: number, stars: number): ExtendedPlayerData {
  const data = getPlayerData();
  
  const existing = data.levelsCompleted[levelId];
  const newProgress: LevelProgress = {
    completed: true,
    stars: existing ? Math.max(existing.stars, stars) : stars,
    bestTime: existing ? Math.max(existing.bestTime, timeRemaining) : timeRemaining,
    attempts: (existing?.attempts || 0) + 1,
  };
  
  data.levelsCompleted[levelId] = newProgress;
  
  if (levelId >= data.highestLevelUnlocked && levelId < 100) {
    data.highestLevelUnlocked = levelId + 1;
  }
  
  savePlayerData(data);
  return data;
}

export function recordLevelAttempt(levelId: number): void {
  const data = getPlayerData();
  const existing = data.levelsCompleted[levelId];
  
  if (existing) {
    existing.attempts += 1;
  } else {
    data.levelsCompleted[levelId] = {
      completed: false,
      stars: 0,
      bestTime: 0,
      attempts: 1,
    };
  }
  
  savePlayerData(data);
}

export function getLevelProgress(levelId: number): LevelProgress | null {
  const data = getPlayerData();
  return data.levelsCompleted[levelId] || null;
}

export function isLevelUnlocked(levelId: number): boolean {
  const data = getPlayerData();
  return levelId <= data.highestLevelUnlocked;
}

export function getHighestLevelUnlocked(): number {
  const data = getPlayerData();
  return data.highestLevelUnlocked;
}

export function addEquipmentCard(equipmentId: string, count: number = 1): void {
  const data = getPlayerData();
  data.equipmentCards[equipmentId] = (data.equipmentCards[equipmentId] || 0) + count;
  savePlayerData(data);
}

export function getEquipmentCardCount(equipmentId: string): number {
  const data = getPlayerData();
  return data.equipmentCards[equipmentId] || 0;
}

export function getEquipmentLevel(equipmentId: string): number {
  const data = getPlayerData();
  return data.equipmentLevels[equipmentId] || 1;
}

export function getEquipmentCardsNeeded(currentLevel: number): number {
  return 10;
}

export function upgradeEquipment(equipmentId: string): boolean {
  const data = getPlayerData();
  const currentLevel = data.equipmentLevels[equipmentId] || 1;
  if (currentLevel >= 5) return false;
  
  const cardsNeeded = getEquipmentCardsNeeded(currentLevel);
  const currentCards = data.equipmentCards[equipmentId] || 0;
  if (currentCards < cardsNeeded) return false;
  
  data.equipmentCards[equipmentId] = currentCards - cardsNeeded;
  data.equipmentLevels[equipmentId] = currentLevel + 1;
  savePlayerData(data);
  return true;
}

export function getEquipmentStatsWithLevel(equipment: Equipment, level: number): Equipment["stats"] {
  const multiplier = 1 + (level - 1) * 0.2;
  return {
    hp: equipment.stats.hp ? Math.round(equipment.stats.hp * multiplier) : undefined,
    speed: equipment.stats.speed ? equipment.stats.speed * multiplier : undefined,
    throwRate: equipment.stats.throwRate ? equipment.stats.throwRate * multiplier : undefined,
    pickupRadius: equipment.stats.pickupRadius ? equipment.stats.pickupRadius * multiplier : undefined,
    damage: equipment.stats.damage ? equipment.stats.damage * multiplier : undefined,
  };
}

export function awardChest(levelNumber: number): Chest {
  let chestType: Chest;
  const rareChance = Math.random() * 100;
  
  if (levelNumber >= 81) {
    chestType = CHESTS[3];
  } else if (levelNumber >= 51) {
    chestType = rareChance < 15 ? CHESTS[3] : CHESTS[2];
  } else if (levelNumber >= 21) {
    chestType = rareChance < 15 ? CHESTS[2] : CHESTS[1];
  } else {
    chestType = rareChance < 15 ? CHESTS[1] : CHESTS[0];
  }
  
  const data = getPlayerData();
  data.pendingChests.push({ chest: chestType, levelEarned: levelNumber });
  savePlayerData(data);
  
  return chestType;
}

export function openChest(chest: Chest): ChestReward {
  const data = getPlayerData();
  
  const coins = Math.floor(Math.random() * (chest.coinRange[1] - chest.coinRange[0] + 1)) + chest.coinRange[0];
  const cardCount = Math.floor(Math.random() * (chest.cardRange[1] - chest.cardRange[0] + 1)) + chest.cardRange[0];
  
  const cards: { equipmentId: string; count: number }[] = [];
  let newEquipment: string | undefined = undefined;
  
  const rarityWeights: Record<string, { common: number; rare: number; epic: number }> = {
    wooden: { common: 80, rare: 18, epic: 2 },
    silver: { common: 60, rare: 30, epic: 10 },
    golden: { common: 40, rare: 40, epic: 20 },
    diamond: { common: 20, rare: 40, epic: 40 },
  };
  
  const weights = rarityWeights[chest.rarity];
  
  for (let i = 0; i < cardCount; i++) {
    const roll = Math.random() * 100;
    let rarity: "common" | "rare" | "epic";
    if (roll < weights.epic) {
      rarity = "epic";
    } else if (roll < weights.epic + weights.rare) {
      rarity = "rare";
    } else {
      rarity = "common";
    }
    
    const eligibleEquipment = EQUIPMENT.filter(e => e.rarity === rarity);
    if (eligibleEquipment.length > 0) {
      const randomEquip = eligibleEquipment[Math.floor(Math.random() * eligibleEquipment.length)];
      const existingCard = cards.find(c => c.equipmentId === randomEquip.id);
      if (existingCard) {
        existingCard.count++;
      } else {
        cards.push({ equipmentId: randomEquip.id, count: 1 });
      }
      data.equipmentCards[randomEquip.id] = (data.equipmentCards[randomEquip.id] || 0) + 1;
    }
  }
  
  if (Math.random() * 100 < chest.equipmentChance) {
    const unownedEquipment = EQUIPMENT.filter(e => !data.ownedEquipment.includes(e.id));
    if (unownedEquipment.length > 0) {
      const weightedUnowned = unownedEquipment.filter(e => {
        if (chest.rarity === "diamond") return true;
        if (chest.rarity === "golden") return e.rarity !== "epic" || Math.random() < 0.3;
        if (chest.rarity === "silver") return e.rarity === "common" || (e.rarity === "rare" && Math.random() < 0.5);
        return e.rarity === "common";
      });
      
      if (weightedUnowned.length > 0) {
        const randomEquip = weightedUnowned[Math.floor(Math.random() * weightedUnowned.length)];
        data.ownedEquipment.push(randomEquip.id);
        newEquipment = randomEquip.id;
      }
    }
  }
  
  data.coins += coins;
  
  const chestIndex = data.pendingChests.findIndex(pc => pc.chest.id === chest.id);
  if (chestIndex >= 0) {
    data.pendingChests.splice(chestIndex, 1);
  }
  
  savePlayerData(data);
  
  return { coins, cards, newEquipment };
}

export function getPendingChests(): PendingChest[] {
  const data = getPlayerData();
  return data.pendingChests || [];
}

export function clearPendingChests(): void {
  const data = getPlayerData();
  data.pendingChests = [];
  savePlayerData(data);
}
