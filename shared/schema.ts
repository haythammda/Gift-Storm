import { z } from "zod";

export const scoreSchema = z.object({
  id: z.string(),
  playerName: z.string().min(1).max(20),
  score: z.number().int().min(0).max(999999),
  timeSurvived: z.number().int().min(0),
  childrenHelped: z.number().int().min(0),
  coinsEarned: z.number().int().min(0),
  createdAt: z.string(),
});

export const insertScoreSchema = scoreSchema.omit({ id: true, createdAt: true });

export type Score = z.infer<typeof scoreSchema>;
export type InsertScore = z.infer<typeof insertScoreSchema>;

export const milestoneSchema = z.object({
  threshold: z.number(),
  name: z.string(),
  description: z.string(),
  unlocked: z.boolean(),
});

export type Milestone = z.infer<typeof milestoneSchema>;

export const gameStatusSchema = z.object({
  donationTotalJOD: z.number(),
  donationGoalJOD: z.number(),
  donationUrl: z.string(),
  milestones: z.array(milestoneSchema),
  globalUnlocks: z.array(z.string()),
  devSimulationEnabled: z.boolean().optional(),
});

export type GameStatus = z.infer<typeof gameStatusSchema>;

export const adminUpdateSchema = z.object({
  donationTotalJOD: z.number().optional(),
  donationGoalJOD: z.number().optional(),
  donationUrl: z.string().optional(),
  devSimulationEnabled: z.boolean().optional(),
});

export type AdminUpdate = z.infer<typeof adminUpdateSchema>;

export const metaUpgradeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  maxLevel: z.number(),
  costPerLevel: z.number(),
  effect: z.number(),
  scalingFactor: z.number().optional(),
  effectCap: z.number().optional(),
});

export type MetaUpgrade = z.infer<typeof metaUpgradeSchema>;

export const playerMetaDataSchema = z.object({
  coins: z.number(),
  upgrades: z.record(z.string(), z.number()),
  bestTime: z.number(),
  totalChildrenHelped: z.number(),
});

export type PlayerMetaData = z.infer<typeof playerMetaDataSchema>;

export const MILESTONES: Milestone[] = [
  { threshold: 200, name: "Golden Scarf Trail", description: "Unlock a golden trail effect for your gifts!", unlocked: false },
  { threshold: 500, name: "Festival Lights", description: "Unlock a festive lights map theme!", unlocked: false },
  { threshold: 1000, name: "Warmth Champion", description: "Earn the Warmth Champion title badge!", unlocked: false },
];

export const META_UPGRADES: MetaUpgrade[] = [
  { id: "maxHp", name: "Resilience Training", description: "+10 Max HP per level", maxLevel: 999, costPerLevel: 100, effect: 10, scalingFactor: 1.15 },
  { id: "throwRate", name: "Quick Hands", description: "+3% throw rate per level", maxLevel: 999, costPerLevel: 150, effect: 0.03, scalingFactor: 1.15, effectCap: 0.8 },
  { id: "moveSpeed", name: "Swift Feet", description: "+3% move speed per level", maxLevel: 999, costPerLevel: 125, effect: 0.03, scalingFactor: 1.15, effectCap: 0.6 },
  { id: "startingUpgrade", name: "Head Start", description: "Start with a random common upgrade", maxLevel: 1, costPerLevel: 500, effect: 1 },
  { id: "coinMultiplier", name: "Golden Touch", description: "+5% coin gain per level", maxLevel: 999, costPerLevel: 200, effect: 0.05, scalingFactor: 1.15 },
  { id: "xpGain", name: "Lucky Stars", description: "+2% XP gain per level", maxLevel: 999, costPerLevel: 150, effect: 0.02, scalingFactor: 1.15 },
  { id: "damage", name: "Gift Power", description: "+2% damage per level", maxLevel: 999, costPerLevel: 175, effect: 0.02, scalingFactor: 1.15, effectCap: 0.5 },
  { id: "startingHp", name: "Starting HP Bonus", description: "+5 HP at game start per level", maxLevel: 999, costPerLevel: 125, effect: 5, scalingFactor: 1.15 },
  { id: "pickupRadius", name: "Pickup Range", description: "+3% pickup radius per level", maxLevel: 999, costPerLevel: 100, effect: 0.03, scalingFactor: 1.15, effectCap: 0.75 },
  { id: "critChance", name: "Critical Eye", description: "+1% crit chance per level", maxLevel: 999, costPerLevel: 200, effect: 0.01, scalingFactor: 1.15, effectCap: 0.25 },
  { id: "coinDropRate", name: "Lucky Pockets", description: "+3% coin drop rate per level", maxLevel: 999, costPerLevel: 175, effect: 0.03, scalingFactor: 1.15, effectCap: 0.45 },
];

export const equipmentSchema = z.object({
  id: z.string(),
  name: z.string(),
  slot: z.enum(["jacket", "socks", "gloves", "pants", "sweater"]),
  description: z.string(),
  cost: z.number(),
  stats: z.object({
    hp: z.number().optional(),
    speed: z.number().optional(),
    throwRate: z.number().optional(),
    pickupRadius: z.number().optional(),
    damage: z.number().optional(),
  }),
  sprite: z.string(),
  rarity: z.enum(["common", "rare", "epic"]),
});

export type Equipment = z.infer<typeof equipmentSchema>;

export const chestSchema = z.object({
  id: z.string(),
  name: z.string(),
  rarity: z.enum(["wooden", "silver", "golden", "diamond"]),
  equipmentChance: z.number(),
  cardRange: z.tuple([z.number(), z.number()]),
  coinRange: z.tuple([z.number(), z.number()]),
});

export type Chest = z.infer<typeof chestSchema>;

export const CHESTS: Chest[] = [
  { id: "wooden", name: "Wooden Chest", rarity: "wooden", equipmentChance: 10, cardRange: [1, 2], coinRange: [15, 35] },
  { id: "silver", name: "Silver Chest", rarity: "silver", equipmentChance: 20, cardRange: [1, 3], coinRange: [25, 60] },
  { id: "golden", name: "Golden Chest", rarity: "golden", equipmentChance: 35, cardRange: [2, 4], coinRange: [40, 100] },
  { id: "diamond", name: "Diamond Chest", rarity: "diamond", equipmentChance: 50, cardRange: [2, 5], coinRange: [75, 175] },
];

export const EQUIPMENT: Equipment[] = [
  // ==================== JACKETS (15 items) ====================
  // Common (5)
  { id: "wool_jacket", name: "Wool Jacket", slot: "jacket", description: "+10 Max HP", cost: 100, stats: { hp: 10 }, sprite: "jacket_wool", rarity: "common" },
  { id: "puffer_jacket", name: "Puffer Jacket", slot: "jacket", description: "+15 Max HP", cost: 150, stats: { hp: 15 }, sprite: "jacket_puffer", rarity: "common" },
  { id: "fleece_jacket", name: "Fleece Jacket", slot: "jacket", description: "+12 Max HP, +3% Speed", cost: 175, stats: { hp: 12, speed: 0.03 }, sprite: "jacket_fleece", rarity: "common" },
  { id: "denim_jacket", name: "Denim Jacket", slot: "jacket", description: "+8 Max HP, +5% Damage", cost: 200, stats: { hp: 8, damage: 0.05 }, sprite: "jacket_denim", rarity: "common" },
  { id: "windbreaker", name: "Windbreaker", slot: "jacket", description: "+10 Max HP, +5% Speed", cost: 225, stats: { hp: 10, speed: 0.05 }, sprite: "jacket_wind", rarity: "common" },
  // Rare (5)
  { id: "down_jacket", name: "Down Jacket", slot: "jacket", description: "+25 Max HP", cost: 400, stats: { hp: 25 }, sprite: "jacket_down", rarity: "rare" },
  { id: "thermal_jacket", name: "Thermal Jacket", slot: "jacket", description: "+20 Max HP, +8% Speed", cost: 450, stats: { hp: 20, speed: 0.08 }, sprite: "jacket_thermal", rarity: "rare" },
  { id: "winter_parka", name: "Winter Parka", slot: "jacket", description: "+30 Max HP, +5% Damage", cost: 500, stats: { hp: 30, damage: 0.05 }, sprite: "jacket_parka", rarity: "rare" },
  { id: "insulated_coat", name: "Insulated Coat", slot: "jacket", description: "+25 Max HP, +10% Pickup", cost: 525, stats: { hp: 25, pickupRadius: 0.1 }, sprite: "jacket_insulated", rarity: "rare" },
  { id: "arctic_jacket", name: "Arctic Jacket", slot: "jacket", description: "+35 Max HP", cost: 550, stats: { hp: 35 }, sprite: "jacket_arctic", rarity: "rare" },
  // Epic (5)
  { id: "legendary_parka", name: "Legendary Parka", slot: "jacket", description: "+50 Max HP, +10% All", cost: 1000, stats: { hp: 50, speed: 0.1, throwRate: 0.1, damage: 0.1 }, sprite: "jacket_legendary", rarity: "epic" },
  { id: "frost_guardian", name: "Frost Guardian Jacket", slot: "jacket", description: "+45 Max HP, +15% Speed", cost: 1100, stats: { hp: 45, speed: 0.15 }, sprite: "jacket_guardian", rarity: "epic" },
  { id: "champions_coat", name: "Champion's Coat", slot: "jacket", description: "+40 Max HP, +20% Damage", cost: 1200, stats: { hp: 40, damage: 0.2 }, sprite: "jacket_champion", rarity: "epic" },
  { id: "phoenix_jacket", name: "Phoenix Jacket", slot: "jacket", description: "+60 Max HP", cost: 1400, stats: { hp: 60 }, sprite: "jacket_phoenix", rarity: "epic" },
  { id: "divine_warmth", name: "Divine Warmth Jacket", slot: "jacket", description: "+75 Max HP, +15% All", cost: 2000, stats: { hp: 75, speed: 0.15, throwRate: 0.15, damage: 0.15 }, sprite: "jacket_divine", rarity: "epic" },

  // ==================== SOCKS (15 items) ====================
  // Common (5)
  { id: "cotton_socks", name: "Cotton Socks", slot: "socks", description: "+5% Move Speed", cost: 80, stats: { speed: 0.05 }, sprite: "socks_cotton", rarity: "common" },
  { id: "wool_socks", name: "Wool Socks", slot: "socks", description: "+8% Move Speed", cost: 120, stats: { speed: 0.08 }, sprite: "socks_wool", rarity: "common" },
  { id: "athletic_socks", name: "Athletic Socks", slot: "socks", description: "+6% Speed, +5% Pickup", cost: 150, stats: { speed: 0.06, pickupRadius: 0.05 }, sprite: "socks_athletic", rarity: "common" },
  { id: "thermal_socks", name: "Thermal Socks", slot: "socks", description: "+10% Move Speed", cost: 180, stats: { speed: 0.1 }, sprite: "socks_thermal", rarity: "common" },
  { id: "hiking_socks", name: "Hiking Socks", slot: "socks", description: "+8% Speed, +5 HP", cost: 200, stats: { speed: 0.08, hp: 5 }, sprite: "socks_hiking", rarity: "common" },
  // Rare (5)
  { id: "lucky_socks", name: "Lucky Socks", slot: "socks", description: "+12% Speed, +10% Pickup", cost: 350, stats: { speed: 0.12, pickupRadius: 0.1 }, sprite: "socks_lucky", rarity: "rare" },
  { id: "sprint_socks", name: "Sprint Socks", slot: "socks", description: "+15% Move Speed", cost: 400, stats: { speed: 0.15 }, sprite: "socks_sprint", rarity: "rare" },
  { id: "cozy_socks", name: "Cozy Socks", slot: "socks", description: "+12% Speed, +10 HP", cost: 450, stats: { speed: 0.12, hp: 10 }, sprite: "socks_cozy", rarity: "rare" },
  { id: "adventure_socks", name: "Adventure Socks", slot: "socks", description: "+14% Speed, +5% Damage", cost: 500, stats: { speed: 0.14, damage: 0.05 }, sprite: "socks_adventure", rarity: "rare" },
  { id: "explorer_socks", name: "Explorer Socks", slot: "socks", description: "+18% Move Speed", cost: 550, stats: { speed: 0.18 }, sprite: "socks_explorer", rarity: "rare" },
  // Epic (5)
  { id: "legendary_speed_socks", name: "Legendary Speed Socks", slot: "socks", description: "+25% Move Speed", cost: 900, stats: { speed: 0.25 }, sprite: "socks_legendary", rarity: "epic" },
  { id: "phantom_socks", name: "Phantom Socks", slot: "socks", description: "+22% Speed, +15% Pickup", cost: 1000, stats: { speed: 0.22, pickupRadius: 0.15 }, sprite: "socks_phantom", rarity: "epic" },
  { id: "champions_socks", name: "Champion's Socks", slot: "socks", description: "+20% Speed, +10% All", cost: 1100, stats: { speed: 0.2, throwRate: 0.1, damage: 0.1 }, sprite: "socks_champion", rarity: "epic" },
  { id: "lightning_socks", name: "Lightning Socks", slot: "socks", description: "+30% Move Speed", cost: 1300, stats: { speed: 0.3 }, sprite: "socks_lightning", rarity: "epic" },
  { id: "divine_swift_socks", name: "Divine Swift Socks", slot: "socks", description: "+35% Speed, +20% Pickup", cost: 1800, stats: { speed: 0.35, pickupRadius: 0.2 }, sprite: "socks_divine", rarity: "epic" },

  // ==================== GLOVES (15 items) ====================
  // Common (5)
  { id: "cotton_gloves", name: "Cotton Gloves", slot: "gloves", description: "+5% Throw Rate", cost: 80, stats: { throwRate: 0.05 }, sprite: "gloves_cotton", rarity: "common" },
  { id: "knit_gloves", name: "Knit Gloves", slot: "gloves", description: "+8% Throw Rate", cost: 120, stats: { throwRate: 0.08 }, sprite: "gloves_knit", rarity: "common" },
  { id: "leather_gloves", name: "Leather Gloves", slot: "gloves", description: "+6% Throw Rate, +3% Damage", cost: 150, stats: { throwRate: 0.06, damage: 0.03 }, sprite: "gloves_leather", rarity: "common" },
  { id: "thermal_gloves", name: "Thermal Gloves", slot: "gloves", description: "+10% Throw Rate", cost: 180, stats: { throwRate: 0.1 }, sprite: "gloves_thermal", rarity: "common" },
  { id: "grip_gloves", name: "Grip Gloves", slot: "gloves", description: "+12% Throw Rate", cost: 200, stats: { throwRate: 0.12 }, sprite: "gloves_grip", rarity: "common" },
  // Rare (5)
  { id: "padded_gloves", name: "Padded Gloves", slot: "gloves", description: "+12% Throw Rate, +5% Damage", cost: 350, stats: { throwRate: 0.12, damage: 0.05 }, sprite: "gloves_padded", rarity: "rare" },
  { id: "rapid_gloves", name: "Rapid Gloves", slot: "gloves", description: "+15% Throw Rate", cost: 400, stats: { throwRate: 0.15 }, sprite: "gloves_rapid", rarity: "rare" },
  { id: "heated_gloves", name: "Heated Gloves", slot: "gloves", description: "+14% Throw Rate, +8% Damage", cost: 450, stats: { throwRate: 0.14, damage: 0.08 }, sprite: "gloves_heated", rarity: "rare" },
  { id: "precision_gloves", name: "Precision Gloves", slot: "gloves", description: "+18% Throw Rate, +5% Pickup", cost: 500, stats: { throwRate: 0.18, pickupRadius: 0.05 }, sprite: "gloves_precision", rarity: "rare" },
  { id: "combat_gloves", name: "Combat Gloves", slot: "gloves", description: "+20% Throw Rate", cost: 550, stats: { throwRate: 0.2 }, sprite: "gloves_combat", rarity: "rare" },
  // Epic (5)
  { id: "legendary_gloves", name: "Legendary Gloves", slot: "gloves", description: "+25% Throw Rate", cost: 900, stats: { throwRate: 0.25 }, sprite: "gloves_legendary", rarity: "epic" },
  { id: "storm_gloves", name: "Storm Gloves", slot: "gloves", description: "+22% Throw Rate, +15% Damage", cost: 1000, stats: { throwRate: 0.22, damage: 0.15 }, sprite: "gloves_storm", rarity: "epic" },
  { id: "champions_gloves", name: "Champion's Gloves", slot: "gloves", description: "+28% Throw Rate, +10% All", cost: 1100, stats: { throwRate: 0.28, speed: 0.1, damage: 0.1 }, sprite: "gloves_champion", rarity: "epic" },
  { id: "inferno_gloves", name: "Inferno Gloves", slot: "gloves", description: "+30% Throw Rate, +20% Damage", cost: 1400, stats: { throwRate: 0.3, damage: 0.2 }, sprite: "gloves_inferno", rarity: "epic" },
  { id: "divine_gloves", name: "Divine Touch Gloves", slot: "gloves", description: "+35% Throw Rate, +15% All", cost: 1800, stats: { throwRate: 0.35, speed: 0.15, damage: 0.15 }, sprite: "gloves_divine", rarity: "epic" },

  // ==================== PANTS (15 items) ====================
  // Common (5)
  { id: "cotton_pants", name: "Cotton Pants", slot: "pants", description: "+8 Max HP", cost: 100, stats: { hp: 8 }, sprite: "pants_cotton", rarity: "common" },
  { id: "cargo_pants", name: "Cargo Pants", slot: "pants", description: "+10 Max HP, +3% Speed", cost: 150, stats: { hp: 10, speed: 0.03 }, sprite: "pants_cargo", rarity: "common" },
  { id: "fleece_pants", name: "Fleece Pants", slot: "pants", description: "+12 Max HP", cost: 175, stats: { hp: 12 }, sprite: "pants_fleece", rarity: "common" },
  { id: "thermal_pants", name: "Thermal Pants", slot: "pants", description: "+8 Max HP, +5% Speed", cost: 200, stats: { hp: 8, speed: 0.05 }, sprite: "pants_thermal", rarity: "common" },
  { id: "snow_pants", name: "Snow Pants", slot: "pants", description: "+15 Max HP, +3% Speed", cost: 225, stats: { hp: 15, speed: 0.03 }, sprite: "pants_snow", rarity: "common" },
  // Rare (5)
  { id: "insulated_pants", name: "Insulated Pants", slot: "pants", description: "+20 Max HP, +5% Speed", cost: 400, stats: { hp: 20, speed: 0.05 }, sprite: "pants_insulated", rarity: "rare" },
  { id: "reinforced_pants", name: "Reinforced Pants", slot: "pants", description: "+25 Max HP, +5% Damage", cost: 450, stats: { hp: 25, damage: 0.05 }, sprite: "pants_reinforced", rarity: "rare" },
  { id: "arctic_pants", name: "Arctic Pants", slot: "pants", description: "+30 Max HP", cost: 500, stats: { hp: 30 }, sprite: "pants_arctic", rarity: "rare" },
  { id: "adventure_pants", name: "Adventure Pants", slot: "pants", description: "+22 Max HP, +8% Speed", cost: 525, stats: { hp: 22, speed: 0.08 }, sprite: "pants_adventure", rarity: "rare" },
  { id: "explorer_pants", name: "Explorer Pants", slot: "pants", description: "+28 Max HP, +10% Speed", cost: 550, stats: { hp: 28, speed: 0.1 }, sprite: "pants_explorer", rarity: "rare" },
  // Epic (5)
  { id: "legendary_pants", name: "Legendary Pants", slot: "pants", description: "+45 Max HP, +10% Speed", cost: 1000, stats: { hp: 45, speed: 0.1 }, sprite: "pants_legendary", rarity: "epic" },
  { id: "titan_pants", name: "Titan Pants", slot: "pants", description: "+50 Max HP, +15% Damage", cost: 1200, stats: { hp: 50, damage: 0.15 }, sprite: "pants_titan", rarity: "epic" },
  { id: "champions_pants", name: "Champion's Pants", slot: "pants", description: "+40 Max HP, +12% All", cost: 1400, stats: { hp: 40, speed: 0.12, throwRate: 0.12, damage: 0.12 }, sprite: "pants_champion", rarity: "epic" },
  { id: "fortress_pants", name: "Fortress Pants", slot: "pants", description: "+70 Max HP", cost: 1600, stats: { hp: 70 }, sprite: "pants_fortress", rarity: "epic" },
  { id: "divine_pants", name: "Divine Guard Pants", slot: "pants", description: "+60 Max HP, +15% All", cost: 2000, stats: { hp: 60, speed: 0.15, throwRate: 0.15, damage: 0.15 }, sprite: "pants_divine", rarity: "epic" },

  // ==================== SWEATERS (15 items) ====================
  // Common (5)
  { id: "cotton_sweater", name: "Cotton Sweater", slot: "sweater", description: "+5 HP, +3% All", cost: 120, stats: { hp: 5, speed: 0.03, throwRate: 0.03 }, sprite: "sweater_cotton", rarity: "common" },
  { id: "knit_sweater", name: "Knit Sweater", slot: "sweater", description: "+8 HP, +4% All", cost: 160, stats: { hp: 8, speed: 0.04, throwRate: 0.04 }, sprite: "sweater_knit", rarity: "common" },
  { id: "wool_sweater", name: "Wool Sweater", slot: "sweater", description: "+10 HP, +5% Speed", cost: 200, stats: { hp: 10, speed: 0.05 }, sprite: "sweater_wool", rarity: "common" },
  { id: "holiday_sweater", name: "Holiday Sweater", slot: "sweater", description: "+8 HP, +5% All", cost: 225, stats: { hp: 8, speed: 0.05, throwRate: 0.05, damage: 0.05 }, sprite: "sweater_holiday", rarity: "common" },
  { id: "cozy_sweater", name: "Cozy Sweater", slot: "sweater", description: "+12 HP, +5% Throw Rate", cost: 250, stats: { hp: 12, throwRate: 0.05 }, sprite: "sweater_cozy", rarity: "common" },
  // Rare (5)
  { id: "thermal_sweater", name: "Thermal Sweater", slot: "sweater", description: "+15 HP, +8% All", cost: 400, stats: { hp: 15, speed: 0.08, throwRate: 0.08 }, sprite: "sweater_thermal", rarity: "rare" },
  { id: "festive_sweater", name: "Festive Sweater", slot: "sweater", description: "+18 HP, +10% Speed", cost: 450, stats: { hp: 18, speed: 0.1 }, sprite: "sweater_festive", rarity: "rare" },
  { id: "winter_sweater", name: "Winter Sweater", slot: "sweater", description: "+20 HP, +8% All", cost: 500, stats: { hp: 20, speed: 0.08, throwRate: 0.08, damage: 0.08 }, sprite: "sweater_winter", rarity: "rare" },
  { id: "aurora_sweater", name: "Aurora Sweater", slot: "sweater", description: "+15 HP, +10% All", cost: 550, stats: { hp: 15, speed: 0.1, throwRate: 0.1, damage: 0.1 }, sprite: "sweater_aurora", rarity: "rare" },
  { id: "champion_sweater", name: "Champion's Sweater", slot: "sweater", description: "+22 HP, +12% All", cost: 600, stats: { hp: 22, speed: 0.12, throwRate: 0.12, pickupRadius: 0.12 }, sprite: "sweater_champion", rarity: "rare" },
  // Epic (5)
  { id: "legendary_sweater", name: "Legendary Sweater", slot: "sweater", description: "+30 HP, +15% All", cost: 1000, stats: { hp: 30, speed: 0.15, throwRate: 0.15, damage: 0.15 }, sprite: "sweater_legendary", rarity: "epic" },
  { id: "blizzard_sweater", name: "Blizzard Sweater", slot: "sweater", description: "+35 HP, +18% All", cost: 1300, stats: { hp: 35, speed: 0.18, throwRate: 0.18, damage: 0.18 }, sprite: "sweater_blizzard", rarity: "epic" },
  { id: "grandmaster_sweater", name: "Grandmaster's Sweater", slot: "sweater", description: "+40 HP, +20% All", cost: 1600, stats: { hp: 40, speed: 0.2, throwRate: 0.2, damage: 0.2 }, sprite: "sweater_grandmaster", rarity: "epic" },
  { id: "eternal_sweater", name: "Eternal Warmth", slot: "sweater", description: "+50 HP, +22% All", cost: 1900, stats: { hp: 50, speed: 0.22, throwRate: 0.22, damage: 0.22, pickupRadius: 0.22 }, sprite: "sweater_eternal", rarity: "epic" },
  { id: "divine_sweater", name: "Divine Comfort", slot: "sweater", description: "+60 HP, +25% All", cost: 2200, stats: { hp: 60, speed: 0.25, throwRate: 0.25, damage: 0.25, pickupRadius: 0.25 }, sprite: "sweater_divine", rarity: "epic" },
];

export const weaponSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cost: z.number(),
  unlockLevel: z.number(),
  baseStats: z.object({
    fireRate: z.number(),
    damage: z.number(),
    projectileSpeed: z.number(),
    projectileCount: z.number(),
    range: z.number(),
  }),
  sprite: z.string(),
  type: z.enum(["projectile", "boomerang", "aura", "orbital"]),
});

export type Weapon = z.infer<typeof weaponSchema>;

export const WEAPONS: Weapon[] = [
  { id: "gift_box", name: "Gift Boxes", description: "Classic gifts that fly toward enemies", cost: 0, unlockLevel: 1, baseStats: { fireRate: 280, damage: 1, projectileSpeed: 550, projectileCount: 1, range: 800 }, sprite: "gift", type: "projectile" },
  { id: "boomerang_sock", name: "Boomerang Sock", description: "A festive sock that returns after hitting", cost: 300, unlockLevel: 3, baseStats: { fireRate: 600, damage: 2, projectileSpeed: 400, projectileCount: 1, range: 200 }, sprite: "sock", type: "boomerang" },
  { id: "candy_cane", name: "Candy Cane Spinner", description: "Orbits around you hitting nearby enemies", cost: 500, unlockLevel: 5, baseStats: { fireRate: 0, damage: 1, projectileSpeed: 0, projectileCount: 2, range: 100 }, sprite: "candy", type: "orbital" },
  { id: "warmth_aura", name: "Warmth Aura", description: "Damages enemies within range continuously", cost: 750, unlockLevel: 8, baseStats: { fireRate: 500, damage: 0.5, projectileSpeed: 0, projectileCount: 1, range: 80 }, sprite: "aura", type: "aura" },
  { id: "snowball", name: "Snowball Burst", description: "Throws multiple snowballs in a spread", cost: 400, unlockLevel: 4, baseStats: { fireRate: 450, damage: 0.5, projectileSpeed: 650, projectileCount: 3, range: 600 }, sprite: "snowball", type: "projectile" },
];

export const weaponUpgradeSchema = z.object({
  id: z.string(),
  weaponId: z.string(),
  name: z.string(),
  description: z.string(),
  tier: z.number(),
  prerequisiteId: z.string().nullable(),
  effect: z.object({
    fireRate: z.number().optional(),
    damage: z.number().optional(),
    projectileSpeed: z.number().optional(),
    projectileCount: z.number().optional(),
    range: z.number().optional(),
    special: z.string().optional(),
  }),
});

export type WeaponUpgrade = z.infer<typeof weaponUpgradeSchema>;

export const WEAPON_UPGRADES: WeaponUpgrade[] = [
  { id: "gift_multi", weaponId: "gift_box", name: "Multi-Gift", description: "+1 Projectile", tier: 1, prerequisiteId: null, effect: { projectileCount: 1 } },
  { id: "gift_pierce", weaponId: "gift_box", name: "Piercing Gifts", description: "Pass through 2 enemies", tier: 1, prerequisiteId: null, effect: { special: "pierce" } },
  { id: "gift_speed", weaponId: "gift_box", name: "Swift Delivery", description: "+20% Fire Rate", tier: 1, prerequisiteId: null, effect: { fireRate: -0.2 } },
  { id: "gift_storm", weaponId: "gift_box", name: "Gift Storm", description: "+2 Projectiles", tier: 2, prerequisiteId: "gift_multi", effect: { projectileCount: 2 } },
  { id: "gift_explosion", weaponId: "gift_box", name: "Gift Explosion", description: "Explode on impact", tier: 2, prerequisiteId: "gift_pierce", effect: { special: "explode" } },
  { id: "sock_speed", weaponId: "boomerang_sock", name: "Quick Return", description: "+30% Return Speed", tier: 1, prerequisiteId: null, effect: { projectileSpeed: 0.3 } },
  { id: "sock_range", weaponId: "boomerang_sock", name: "Long Throw", description: "+50% Range", tier: 1, prerequisiteId: null, effect: { range: 0.5 } },
  { id: "sock_double", weaponId: "boomerang_sock", name: "Sock Pair", description: "+1 Boomerang", tier: 2, prerequisiteId: "sock_speed", effect: { projectileCount: 1 } },
  { id: "sock_freeze", weaponId: "boomerang_sock", name: "Frozen Sock", description: "Freeze enemies on hit", tier: 2, prerequisiteId: "sock_range", effect: { special: "freeze" } },
  { id: "candy_count", weaponId: "candy_cane", name: "Candy Trio", description: "+1 Orbital", tier: 1, prerequisiteId: null, effect: { projectileCount: 1 } },
  { id: "candy_speed", weaponId: "candy_cane", name: "Spin Faster", description: "+25% Rotation Speed", tier: 1, prerequisiteId: null, effect: { fireRate: -0.25 } },
  { id: "candy_range", weaponId: "candy_cane", name: "Extended Orbit", description: "+30% Range", tier: 2, prerequisiteId: "candy_count", effect: { range: 0.3 } },
  { id: "aura_range", weaponId: "warmth_aura", name: "Wider Warmth", description: "+40% Aura Range", tier: 1, prerequisiteId: null, effect: { range: 0.4 } },
  { id: "aura_damage", weaponId: "warmth_aura", name: "Intense Heat", description: "+50% Aura Damage", tier: 1, prerequisiteId: null, effect: { damage: 0.5 } },
  { id: "snow_spread", weaponId: "snowball", name: "Wide Spread", description: "+2 Snowballs", tier: 1, prerequisiteId: null, effect: { projectileCount: 2 } },
  { id: "snow_freeze", weaponId: "snowball", name: "Ice Balls", description: "Slow enemies", tier: 1, prerequisiteId: null, effect: { special: "slow" } },
];

export const skillNodeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  cost: z.number(),
  maxLevel: z.number(),
  prerequisiteIds: z.array(z.string()),
  category: z.enum(["offense", "defense", "utility", "weapon", "special"]),
  effect: z.object({
    stat: z.string(),
    value: z.number(),
  }),
  position: z.object({ x: z.number(), y: z.number() }),
});

export type SkillNode = z.infer<typeof skillNodeSchema>;

export const SKILL_TREE: SkillNode[] = [
  // ==================== OFFENSE (20 skills) - x: 0-3 ====================
  // Tier 0 - Starting skills
  { id: "damage_1", name: "Power I", description: "+8% Damage", cost: 50, maxLevel: 5, prerequisiteIds: [], category: "offense", effect: { stat: "damage", value: 0.08 }, position: { x: 0, y: 0 } },
  { id: "firerate_1", name: "Quick Throw I", description: "+5% Fire Rate", cost: 60, maxLevel: 5, prerequisiteIds: [], category: "offense", effect: { stat: "fireRate", value: 0.05 }, position: { x: 1, y: 0 } },
  { id: "projectile_speed_1", name: "Swift Gifts I", description: "+10% Projectile Speed", cost: 50, maxLevel: 5, prerequisiteIds: [], category: "offense", effect: { stat: "projectileSpeed", value: 0.1 }, position: { x: 2, y: 0 } },
  { id: "crit_chance_1", name: "Lucky Strike I", description: "+3% Crit Chance", cost: 75, maxLevel: 5, prerequisiteIds: [], category: "offense", effect: { stat: "critChance", value: 0.03 }, position: { x: 3, y: 0 } },
  // Tier 1
  { id: "damage_2", name: "Power II", description: "+12% Damage", cost: 100, maxLevel: 5, prerequisiteIds: ["damage_1"], category: "offense", effect: { stat: "damage", value: 0.12 }, position: { x: 0, y: 1 } },
  { id: "firerate_2", name: "Quick Throw II", description: "+8% Fire Rate", cost: 120, maxLevel: 5, prerequisiteIds: ["firerate_1"], category: "offense", effect: { stat: "fireRate", value: 0.08 }, position: { x: 1, y: 1 } },
  { id: "projectile_speed_2", name: "Swift Gifts II", description: "+15% Projectile Speed", cost: 100, maxLevel: 5, prerequisiteIds: ["projectile_speed_1"], category: "offense", effect: { stat: "projectileSpeed", value: 0.15 }, position: { x: 2, y: 1 } },
  { id: "crit_damage_1", name: "Deadly Strikes I", description: "+20% Crit Damage", cost: 125, maxLevel: 5, prerequisiteIds: ["crit_chance_1"], category: "offense", effect: { stat: "critDamage", value: 0.2 }, position: { x: 3, y: 1 } },
  // Tier 2
  { id: "damage_3", name: "Power III", description: "+15% Damage", cost: 200, maxLevel: 5, prerequisiteIds: ["damage_2"], category: "offense", effect: { stat: "damage", value: 0.15 }, position: { x: 0, y: 2 } },
  { id: "multi_projectile", name: "Multi-Gift", description: "+1 Projectile", cost: 300, maxLevel: 3, prerequisiteIds: ["firerate_2"], category: "offense", effect: { stat: "projectileCount", value: 1 }, position: { x: 1, y: 2 } },
  { id: "piercing_gifts", name: "Piercing Warmth", description: "Gifts pierce +1 enemy", cost: 250, maxLevel: 3, prerequisiteIds: ["projectile_speed_2"], category: "offense", effect: { stat: "pierce", value: 1 }, position: { x: 2, y: 2 } },
  { id: "crit_damage_2", name: "Deadly Strikes II", description: "+30% Crit Damage", cost: 200, maxLevel: 5, prerequisiteIds: ["crit_damage_1"], category: "offense", effect: { stat: "critDamage", value: 0.3 }, position: { x: 3, y: 2 } },
  // Tier 3 - Elite skills
  { id: "devastation", name: "Devastation", description: "+25% Damage", cost: 400, maxLevel: 3, prerequisiteIds: ["damage_3"], category: "offense", effect: { stat: "damage", value: 0.25 }, position: { x: 0, y: 3 } },
  { id: "gift_storm", name: "Gift Storm", description: "+2 Projectiles", cost: 600, maxLevel: 2, prerequisiteIds: ["multi_projectile"], category: "offense", effect: { stat: "projectileCount", value: 2 }, position: { x: 1, y: 3 } },
  { id: "explosive_gifts", name: "Explosive Joy", description: "Gifts explode on hit", cost: 500, maxLevel: 2, prerequisiteIds: ["piercing_gifts"], category: "offense", effect: { stat: "explosionRadius", value: 50 }, position: { x: 2, y: 3 } },
  { id: "execute", name: "Kindness Execute", description: "+50% damage to low HP enemies", cost: 450, maxLevel: 2, prerequisiteIds: ["crit_damage_2"], category: "offense", effect: { stat: "executeDamage", value: 0.5 }, position: { x: 3, y: 3 } },
  // Tier 4 - Ultimate
  { id: "fury", name: "Endless Fury", description: "+40% Damage", cost: 700, maxLevel: 2, prerequisiteIds: ["devastation"], category: "offense", effect: { stat: "damage", value: 0.4 }, position: { x: 0, y: 4 } },
  { id: "barrage", name: "Gift Barrage", description: "+50% Fire Rate", cost: 750, maxLevel: 1, prerequisiteIds: ["gift_storm"], category: "offense", effect: { stat: "fireRate", value: 0.5 }, position: { x: 1, y: 4 } },
  { id: "chain_explosion", name: "Chain Reaction", description: "Explosions chain to nearby", cost: 800, maxLevel: 1, prerequisiteIds: ["explosive_gifts"], category: "offense", effect: { stat: "chainExplosion", value: 1 }, position: { x: 2, y: 4 } },
  { id: "lethal_gifts", name: "Lethal Generosity", description: "+100% Crit Damage", cost: 850, maxLevel: 1, prerequisiteIds: ["execute"], category: "offense", effect: { stat: "critDamage", value: 1.0 }, position: { x: 3, y: 4 } },

  // ==================== DEFENSE (20 skills) - x: 4-7 ====================
  // Tier 0 - Starting skills
  { id: "hp_1", name: "Vitality I", description: "+15 Max HP", cost: 50, maxLevel: 5, prerequisiteIds: [], category: "defense", effect: { stat: "maxHp", value: 15 }, position: { x: 4, y: 0 } },
  { id: "armor_1", name: "Warmth Armor I", description: "+5% Damage Reduction", cost: 60, maxLevel: 5, prerequisiteIds: [], category: "defense", effect: { stat: "damageReduction", value: 0.05 }, position: { x: 5, y: 0 } },
  { id: "regen_1", name: "Recovery I", description: "+1 HP per 15 seconds", cost: 75, maxLevel: 5, prerequisiteIds: [], category: "defense", effect: { stat: "regen", value: 1 }, position: { x: 6, y: 0 } },
  { id: "shield_1", name: "Snow Shield I", description: "5% chance to block damage", cost: 80, maxLevel: 5, prerequisiteIds: [], category: "defense", effect: { stat: "blockChance", value: 0.05 }, position: { x: 7, y: 0 } },
  // Tier 1
  { id: "hp_2", name: "Vitality II", description: "+25 Max HP", cost: 100, maxLevel: 5, prerequisiteIds: ["hp_1"], category: "defense", effect: { stat: "maxHp", value: 25 }, position: { x: 4, y: 1 } },
  { id: "armor_2", name: "Warmth Armor II", description: "+8% Damage Reduction", cost: 120, maxLevel: 5, prerequisiteIds: ["armor_1"], category: "defense", effect: { stat: "damageReduction", value: 0.08 }, position: { x: 5, y: 1 } },
  { id: "regen_2", name: "Recovery II", description: "+2 HP per 15 seconds", cost: 150, maxLevel: 5, prerequisiteIds: ["regen_1"], category: "defense", effect: { stat: "regen", value: 2 }, position: { x: 6, y: 1 } },
  { id: "dodge_1", name: "Evasion I", description: "+3% Dodge Chance", cost: 130, maxLevel: 5, prerequisiteIds: ["shield_1"], category: "defense", effect: { stat: "dodge", value: 0.03 }, position: { x: 7, y: 1 } },
  // Tier 2
  { id: "hp_3", name: "Vitality III", description: "+40 Max HP", cost: 200, maxLevel: 5, prerequisiteIds: ["hp_2"], category: "defense", effect: { stat: "maxHp", value: 40 }, position: { x: 4, y: 2 } },
  { id: "thorns", name: "Thorny Coat", description: "Reflect 10% damage", cost: 250, maxLevel: 3, prerequisiteIds: ["armor_2"], category: "defense", effect: { stat: "thorns", value: 0.1 }, position: { x: 5, y: 2 } },
  { id: "lifesteal", name: "Warmth Leech", description: "Heal 1% of damage dealt", cost: 300, maxLevel: 3, prerequisiteIds: ["regen_2"], category: "defense", effect: { stat: "lifesteal", value: 0.01 }, position: { x: 6, y: 2 } },
  { id: "dodge_2", name: "Evasion II", description: "+5% Dodge Chance", cost: 200, maxLevel: 5, prerequisiteIds: ["dodge_1"], category: "defense", effect: { stat: "dodge", value: 0.05 }, position: { x: 7, y: 2 } },
  // Tier 3 - Elite
  { id: "immortality", name: "Last Stand", description: "Survive lethal hit once", cost: 500, maxLevel: 1, prerequisiteIds: ["hp_3"], category: "defense", effect: { stat: "lastStand", value: 1 }, position: { x: 4, y: 3 } },
  { id: "revenge", name: "Frosty Revenge", description: "When hit, damage nearby enemies", cost: 400, maxLevel: 2, prerequisiteIds: ["thorns"], category: "defense", effect: { stat: "revengeDamage", value: 10 }, position: { x: 5, y: 3 } },
  { id: "vampiric", name: "Vampiric Warmth", description: "Heal 3% of damage dealt", cost: 450, maxLevel: 2, prerequisiteIds: ["lifesteal"], category: "defense", effect: { stat: "lifesteal", value: 0.03 }, position: { x: 6, y: 3 } },
  { id: "phantom", name: "Phantom Dash", description: "+10% Dodge, 0.5s invincibility", cost: 550, maxLevel: 2, prerequisiteIds: ["dodge_2"], category: "defense", effect: { stat: "phantomDodge", value: 0.1 }, position: { x: 7, y: 3 } },
  // Tier 4 - Ultimate
  { id: "undying", name: "Undying Spirit", description: "+100 Max HP", cost: 700, maxLevel: 1, prerequisiteIds: ["immortality"], category: "defense", effect: { stat: "maxHp", value: 100 }, position: { x: 4, y: 4 } },
  { id: "retribution", name: "Retribution", description: "Reflect 30% damage", cost: 650, maxLevel: 1, prerequisiteIds: ["revenge"], category: "defense", effect: { stat: "thorns", value: 0.3 }, position: { x: 5, y: 4 } },
  { id: "sanguine", name: "Sanguine Gift", description: "Heal 5% of damage dealt", cost: 700, maxLevel: 1, prerequisiteIds: ["vampiric"], category: "defense", effect: { stat: "lifesteal", value: 0.05 }, position: { x: 6, y: 4 } },
  { id: "wraith", name: "Wraith Form", description: "20% Dodge + 1s invincibility", cost: 800, maxLevel: 1, prerequisiteIds: ["phantom"], category: "defense", effect: { stat: "phantomDodge", value: 0.2 }, position: { x: 7, y: 4 } },

  // ==================== UTILITY (20 skills) - x: 8-11 ====================
  // Tier 0 - Starting skills
  { id: "speed_1", name: "Swift Feet I", description: "+5% Move Speed", cost: 50, maxLevel: 5, prerequisiteIds: [], category: "utility", effect: { stat: "speed", value: 0.05 }, position: { x: 8, y: 0 } },
  { id: "pickup_1", name: "Magnet I", description: "+10% Pickup Radius", cost: 60, maxLevel: 5, prerequisiteIds: [], category: "utility", effect: { stat: "pickupRadius", value: 0.1 }, position: { x: 9, y: 0 } },
  { id: "xp_gain_1", name: "Quick Learner I", description: "+10% XP Gain", cost: 75, maxLevel: 5, prerequisiteIds: [], category: "utility", effect: { stat: "xpGain", value: 0.1 }, position: { x: 10, y: 0 } },
  { id: "coin_bonus_1", name: "Treasure Sense I", description: "+10% Coin Gain", cost: 70, maxLevel: 5, prerequisiteIds: [], category: "utility", effect: { stat: "coinGain", value: 0.1 }, position: { x: 11, y: 0 } },
  // Tier 1
  { id: "speed_2", name: "Swift Feet II", description: "+8% Move Speed", cost: 100, maxLevel: 5, prerequisiteIds: ["speed_1"], category: "utility", effect: { stat: "speed", value: 0.08 }, position: { x: 8, y: 1 } },
  { id: "pickup_2", name: "Magnet II", description: "+15% Pickup Radius", cost: 120, maxLevel: 5, prerequisiteIds: ["pickup_1"], category: "utility", effect: { stat: "pickupRadius", value: 0.15 }, position: { x: 9, y: 1 } },
  { id: "xp_gain_2", name: "Quick Learner II", description: "+15% XP Gain", cost: 150, maxLevel: 5, prerequisiteIds: ["xp_gain_1"], category: "utility", effect: { stat: "xpGain", value: 0.15 }, position: { x: 10, y: 1 } },
  { id: "coin_bonus_2", name: "Treasure Sense II", description: "+15% Coin Gain", cost: 140, maxLevel: 5, prerequisiteIds: ["coin_bonus_1"], category: "utility", effect: { stat: "coinGain", value: 0.15 }, position: { x: 11, y: 1 } },
  // Tier 2
  { id: "sprint", name: "Sprint", description: "+15% Move Speed", cost: 200, maxLevel: 3, prerequisiteIds: ["speed_2"], category: "utility", effect: { stat: "speed", value: 0.15 }, position: { x: 8, y: 2 } },
  { id: "vacuum", name: "Gift Vacuum", description: "+25% Pickup Radius", cost: 250, maxLevel: 3, prerequisiteIds: ["pickup_2"], category: "utility", effect: { stat: "pickupRadius", value: 0.25 }, position: { x: 9, y: 2 } },
  { id: "level_rush", name: "Level Rush", description: "+25% XP Gain", cost: 300, maxLevel: 3, prerequisiteIds: ["xp_gain_2"], category: "utility", effect: { stat: "xpGain", value: 0.25 }, position: { x: 10, y: 2 } },
  { id: "gold_rush", name: "Gold Rush", description: "+25% Coin Gain", cost: 280, maxLevel: 3, prerequisiteIds: ["coin_bonus_2"], category: "utility", effect: { stat: "coinGain", value: 0.25 }, position: { x: 11, y: 2 } },
  // Tier 3 - Elite
  { id: "flash", name: "Flash Step", description: "+25% Move Speed + brief invincibility", cost: 450, maxLevel: 2, prerequisiteIds: ["sprint"], category: "utility", effect: { stat: "flashStep", value: 0.25 }, position: { x: 8, y: 3 } },
  { id: "black_hole", name: "Gift Black Hole", description: "Attract pickups from entire screen", cost: 400, maxLevel: 1, prerequisiteIds: ["vacuum"], category: "utility", effect: { stat: "magnetRange", value: 1000 }, position: { x: 9, y: 3 } },
  { id: "wisdom", name: "Ancient Wisdom", description: "+50% XP Gain", cost: 500, maxLevel: 2, prerequisiteIds: ["level_rush"], category: "utility", effect: { stat: "xpGain", value: 0.5 }, position: { x: 10, y: 3 } },
  { id: "midas", name: "Midas Touch", description: "+50% Coin Gain + bonus coins", cost: 480, maxLevel: 2, prerequisiteIds: ["gold_rush"], category: "utility", effect: { stat: "coinGain", value: 0.5 }, position: { x: 11, y: 3 } },
  // Tier 4 - Ultimate
  { id: "teleport", name: "Blink", description: "Teleport short distance", cost: 700, maxLevel: 1, prerequisiteIds: ["flash"], category: "utility", effect: { stat: "teleport", value: 1 }, position: { x: 8, y: 4 } },
  { id: "gravity_well", name: "Gravity Well", description: "Constant item attraction", cost: 650, maxLevel: 1, prerequisiteIds: ["black_hole"], category: "utility", effect: { stat: "gravityWell", value: 1 }, position: { x: 9, y: 4 } },
  { id: "enlightenment", name: "Enlightenment", description: "+100% XP Gain", cost: 750, maxLevel: 1, prerequisiteIds: ["wisdom"], category: "utility", effect: { stat: "xpGain", value: 1.0 }, position: { x: 10, y: 4 } },
  { id: "golden_age", name: "Golden Age", description: "+100% Coin Gain", cost: 720, maxLevel: 1, prerequisiteIds: ["midas"], category: "utility", effect: { stat: "coinGain", value: 1.0 }, position: { x: 11, y: 4 } },

  // ==================== WEAPONS (20 skills) - x: 12-15 ====================
  // Tier 0 - Weapon unlocks
  { id: "unlock_sock", name: "Boomerang Sock", description: "Unlock the Boomerang Sock weapon", cost: 200, maxLevel: 1, prerequisiteIds: [], category: "weapon", effect: { stat: "unlockWeapon", value: 1 }, position: { x: 12, y: 0 } },
  { id: "unlock_snowball", name: "Snowball Launcher", description: "Unlock the Snowball weapon", cost: 250, maxLevel: 1, prerequisiteIds: [], category: "weapon", effect: { stat: "unlockWeapon", value: 1 }, position: { x: 13, y: 0 } },
  { id: "unlock_candy", name: "Candy Cane", description: "Unlock the Candy Cane Spinner", cost: 300, maxLevel: 1, prerequisiteIds: ["unlock_sock"], category: "weapon", effect: { stat: "unlockWeapon", value: 1 }, position: { x: 14, y: 0 } },
  { id: "unlock_aura", name: "Warmth Aura", description: "Unlock the Warmth Aura", cost: 400, maxLevel: 1, prerequisiteIds: ["unlock_candy"], category: "weapon", effect: { stat: "unlockWeapon", value: 1 }, position: { x: 15, y: 0 } },
  // Tier 1 - Weapon upgrades
  { id: "sock_power", name: "Enhanced Sock", description: "+20% Sock damage", cost: 150, maxLevel: 5, prerequisiteIds: ["unlock_sock"], category: "weapon", effect: { stat: "sockDamage", value: 0.2 }, position: { x: 12, y: 1 } },
  { id: "snowball_size", name: "Bigger Snowballs", description: "+25% Snowball size/damage", cost: 175, maxLevel: 5, prerequisiteIds: ["unlock_snowball"], category: "weapon", effect: { stat: "snowballDamage", value: 0.25 }, position: { x: 13, y: 1 } },
  { id: "candy_spin", name: "Faster Spin", description: "+20% Candy spin speed", cost: 180, maxLevel: 5, prerequisiteIds: ["unlock_candy"], category: "weapon", effect: { stat: "candySpeed", value: 0.2 }, position: { x: 14, y: 1 } },
  { id: "aura_size", name: "Wider Aura", description: "+15% Aura size", cost: 200, maxLevel: 5, prerequisiteIds: ["unlock_aura"], category: "weapon", effect: { stat: "auraSize", value: 0.15 }, position: { x: 15, y: 1 } },
  // Tier 2
  { id: "dual_sock", name: "Twin Socks", description: "Fire 2 socks at once", cost: 350, maxLevel: 2, prerequisiteIds: ["sock_power"], category: "weapon", effect: { stat: "sockCount", value: 1 }, position: { x: 12, y: 2 } },
  { id: "snowball_burst", name: "Snowball Burst", description: "Snowballs explode on impact", cost: 380, maxLevel: 2, prerequisiteIds: ["snowball_size"], category: "weapon", effect: { stat: "snowballExplode", value: 1 }, position: { x: 13, y: 2 } },
  { id: "candy_chain", name: "Candy Chain", description: "Candy bounces to +1 enemy", cost: 400, maxLevel: 3, prerequisiteIds: ["candy_spin"], category: "weapon", effect: { stat: "candyBounce", value: 1 }, position: { x: 14, y: 2 } },
  { id: "aura_damage", name: "Scorching Warmth", description: "Aura deals extra damage", cost: 350, maxLevel: 3, prerequisiteIds: ["aura_size"], category: "weapon", effect: { stat: "auraDamage", value: 0.5 }, position: { x: 15, y: 2 } },
  // Tier 3 - Elite
  { id: "legendary_sock", name: "Legendary Sock", description: "Sock returns XP orbs", cost: 600, maxLevel: 1, prerequisiteIds: ["dual_sock"], category: "weapon", effect: { stat: "sockXP", value: 1 }, position: { x: 12, y: 3 } },
  { id: "blizzard", name: "Blizzard", description: "Snowballs create freeze zones", cost: 700, maxLevel: 1, prerequisiteIds: ["snowball_burst"], category: "weapon", effect: { stat: "freezeZone", value: 1 }, position: { x: 13, y: 3 } },
  { id: "candy_storm", name: "Candy Storm", description: "3 Candy Canes orbit you", cost: 650, maxLevel: 1, prerequisiteIds: ["candy_chain"], category: "weapon", effect: { stat: "candyCount", value: 1 }, position: { x: 14, y: 3 } },
  { id: "aura_mastery", name: "Warmth Mastery", description: "Aura also heals player", cost: 550, maxLevel: 1, prerequisiteIds: ["aura_damage"], category: "weapon", effect: { stat: "auraHeal", value: 1 }, position: { x: 15, y: 3 } },
  // Tier 4 - Ultimate
  { id: "sock_mastery", name: "Sock Mastery", description: "Triple sock damage", cost: 800, maxLevel: 1, prerequisiteIds: ["legendary_sock"], category: "weapon", effect: { stat: "sockDamage", value: 2.0 }, position: { x: 12, y: 4 } },
  { id: "ice_age", name: "Ice Age", description: "Permanent slow field", cost: 900, maxLevel: 1, prerequisiteIds: ["blizzard"], category: "weapon", effect: { stat: "permanentSlow", value: 1 }, position: { x: 13, y: 4 } },
  { id: "candy_fury", name: "Candy Fury", description: "5 Candy Canes + faster spin", cost: 850, maxLevel: 1, prerequisiteIds: ["candy_storm"], category: "weapon", effect: { stat: "candyCount", value: 2 }, position: { x: 14, y: 4 } },
  { id: "solar_aura", name: "Solar Aura", description: "Massive aura + burn effect", cost: 750, maxLevel: 1, prerequisiteIds: ["aura_mastery"], category: "weapon", effect: { stat: "solarAura", value: 1 }, position: { x: 15, y: 4 } },

  // ==================== SPECIAL (20 skills) - x: 16-19 ====================
  // Cross-category synergy skills - spread across tiers
  // Tier 0 - Entry synergies
  { id: "berserker", name: "Berserker", description: "+1% damage per 1% HP missing", cost: 400, maxLevel: 3, prerequisiteIds: ["damage_2", "hp_2"], category: "special", effect: { stat: "berserker", value: 0.01 }, position: { x: 16, y: 0 } },
  { id: "glass_cannon", name: "Glass Cannon", description: "+50% damage, -30% HP", cost: 300, maxLevel: 1, prerequisiteIds: ["damage_3"], category: "special", effect: { stat: "glassCannon", value: 0.5 }, position: { x: 17, y: 0 } },
  { id: "tank", name: "Unstoppable", description: "+100 HP, -20% speed", cost: 350, maxLevel: 1, prerequisiteIds: ["hp_3"], category: "special", effect: { stat: "tank", value: 100 }, position: { x: 18, y: 0 } },
  { id: "treasure_hunter", name: "Treasure Hunter", description: "Enemies drop more coins", cost: 350, maxLevel: 3, prerequisiteIds: ["coin_bonus_2", "pickup_2"], category: "special", effect: { stat: "treasureHunter", value: 0.25 }, position: { x: 19, y: 0 } },
  // Tier 1
  { id: "assassin", name: "Shadow Strike", description: "+100% crit damage, +10% crit chance", cost: 500, maxLevel: 2, prerequisiteIds: ["crit_damage_2", "speed_2"], category: "special", effect: { stat: "assassin", value: 1.0 }, position: { x: 16, y: 1 } },
  { id: "scholar", name: "Scholar", description: "XP orbs give +50% more XP", cost: 380, maxLevel: 3, prerequisiteIds: ["xp_gain_2", "speed_2"], category: "special", effect: { stat: "scholarXP", value: 0.5 }, position: { x: 17, y: 1 } },
  { id: "juggernaut", name: "Juggernaut", description: "Immune to slows, +25% armor", cost: 450, maxLevel: 2, prerequisiteIds: ["armor_2", "speed_1"], category: "special", effect: { stat: "juggernaut", value: 0.25 }, position: { x: 18, y: 1 } },
  { id: "elementalist", name: "Elementalist", description: "All weapons deal +10% damage", cost: 400, maxLevel: 5, prerequisiteIds: ["unlock_aura"], category: "special", effect: { stat: "allWeaponDamage", value: 0.1 }, position: { x: 19, y: 1 } },
  // Tier 2
  { id: "combo_master", name: "Combo Master", description: "+1% damage per enemy hit", cost: 550, maxLevel: 3, prerequisiteIds: ["firerate_2", "damage_2"], category: "special", effect: { stat: "comboBonus", value: 0.01 }, position: { x: 16, y: 2 } },
  { id: "second_wind", name: "Second Wind", description: "On near-death, heal 30% HP", cost: 480, maxLevel: 1, prerequisiteIds: ["hp_2", "regen_2"], category: "special", effect: { stat: "secondWind", value: 0.3 }, position: { x: 17, y: 2 } },
  { id: "momentum", name: "Momentum", description: "Speed boosts damage", cost: 420, maxLevel: 3, prerequisiteIds: ["speed_2", "damage_1"], category: "special", effect: { stat: "momentum", value: 0.1 }, position: { x: 18, y: 2 } },
  { id: "lucky_charm", name: "Lucky Charm", description: "+5% all positive effects", cost: 500, maxLevel: 3, prerequisiteIds: ["crit_chance_1", "coin_bonus_1"], category: "special", effect: { stat: "luckyCharm", value: 0.05 }, position: { x: 19, y: 2 } },
  // Tier 3
  { id: "rampage", name: "Rampage", description: "Kills increase attack speed", cost: 600, maxLevel: 2, prerequisiteIds: ["firerate_2", "speed_2"], category: "special", effect: { stat: "rampageSpeed", value: 0.02 }, position: { x: 16, y: 3 } },
  { id: "fortitude", name: "Fortitude", description: "Armor increases damage", cost: 550, maxLevel: 2, prerequisiteIds: ["armor_2", "damage_2"], category: "special", effect: { stat: "fortitude", value: 0.5 }, position: { x: 17, y: 3 } },
  { id: "weapon_master", name: "Weapon Master", description: "+30% all weapon stats", cost: 650, maxLevel: 2, prerequisiteIds: ["unlock_candy", "unlock_snowball"], category: "special", effect: { stat: "weaponMaster", value: 0.3 }, position: { x: 18, y: 3 } },
  { id: "overcharge", name: "Overcharge", description: "Max level skills give +10% bonus", cost: 700, maxLevel: 1, prerequisiteIds: ["xp_gain_2", "damage_2"], category: "special", effect: { stat: "overcharge", value: 0.1 }, position: { x: 19, y: 3 } },
  // Tier 4 - Ultimate synergies
  { id: "avatar", name: "Avatar of Warmth", description: "All stats +15%", cost: 1000, maxLevel: 1, prerequisiteIds: ["damage_3", "hp_3", "speed_2"], category: "special", effect: { stat: "avatarBonus", value: 0.15 }, position: { x: 16, y: 4 } },
  { id: "perfectionist", name: "Perfectionist", description: "Each maxed skill gives +5% damage", cost: 900, maxLevel: 1, prerequisiteIds: ["overcharge"], category: "special", effect: { stat: "perfectionist", value: 0.05 }, position: { x: 17, y: 4 } },
  { id: "harmony", name: "Harmony", description: "Balance offense/defense for +40% both", cost: 950, maxLevel: 1, prerequisiteIds: ["fortitude", "berserker"], category: "special", effect: { stat: "harmony", value: 0.4 }, position: { x: 18, y: 4 } },
  { id: "transcendence", name: "Transcendence", description: "Gain all tier 1 skills for free", cost: 1200, maxLevel: 1, prerequisiteIds: ["avatar"], category: "special", effect: { stat: "transcendence", value: 1 }, position: { x: 19, y: 4 } },
];

export const enemyTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hitsNeeded: z.number(),
  baseSpeed: z.number(),
  damage: z.number(),
  specialAbility: z.string().nullable(),
  sprite: z.string(),
  color: z.number(),
});

export type EnemyType = z.infer<typeof enemyTypeSchema>;

export const ENEMY_TYPES: EnemyType[] = [
  { id: "normal", name: "Chilly Child", description: "Basic enemy", hitsNeeded: 1, baseSpeed: 80, damage: 1, specialAbility: null, sprite: "child", color: 0x87ceeb },
  { id: "fast", name: "Speedy Skiier", description: "Fast but fragile", hitsNeeded: 1, baseSpeed: 150, damage: 1, specialAbility: "dash", sprite: "childFast", color: 0x4169e1 },
  { id: "armored", name: "Bundled Up", description: "Slow but tanky", hitsNeeded: 3, baseSpeed: 50, damage: 1, specialAbility: null, sprite: "childArmored", color: 0x8b4513 },
  { id: "freezer", name: "Ice Breather", description: "Slows player on hit", hitsNeeded: 2, baseSpeed: 70, damage: 1, specialAbility: "slowPlayer", sprite: "childFreezer", color: 0x00ffff },
  { id: "splitter", name: "Snow Clone", description: "Splits into 2 on death", hitsNeeded: 2, baseSpeed: 60, damage: 1, specialAbility: "split", sprite: "childSplitter", color: 0x9370db },
  { id: "shielder", name: "Shield Bearer", description: "Blocks from front", hitsNeeded: 1, baseSpeed: 65, damage: 1, specialAbility: "shield", sprite: "childShielder", color: 0xffd700 },
];

export const bossTypeSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  hitsNeeded: z.number(),
  baseSpeed: z.number(),
  damage: z.number(),
  abilities: z.array(z.string()),
  sprite: z.string(),
  color: z.number(),
  coinReward: z.number(),
});

export type BossType = z.infer<typeof bossTypeSchema>;

export const BOSS_TYPES: BossType[] = [
  { id: "frost_giant", name: "Frost Giant", description: "Slow but devastating", hitsNeeded: 20, baseSpeed: 30, damage: 3, abilities: ["stomp", "summon"], sprite: "bossFrost", color: 0x1e90ff, coinReward: 100 },
  { id: "blizzard_witch", name: "Blizzard Witch", description: "Casts freezing spells", hitsNeeded: 15, baseSpeed: 50, damage: 2, abilities: ["freeze_burst", "teleport"], sprite: "bossWitch", color: 0x9400d3, coinReward: 120 },
  { id: "snow_golem", name: "Snow Golem", description: "Regenerates health", hitsNeeded: 25, baseSpeed: 25, damage: 2, abilities: ["regen", "armor"], sprite: "bossGolem", color: 0xf0f8ff, coinReward: 150 },
];

// ==================== MAP THEMES ====================
export const mapThemeSchema = z.object({
  id: z.string(),
  name: z.string(),
  backgroundColor: z.number(),
  groundColor: z.number(),
  decorationColor: z.number(),
  description: z.string(),
});

export type MapTheme = z.infer<typeof mapThemeSchema>;

export const MAP_THEMES: MapTheme[] = [
  { id: "snowy_streets", name: "Snowy Streets", backgroundColor: 0x87CEEB, groundColor: 0xFFFFFF, decorationColor: 0xB8D4E8, description: "Quiet neighborhood streets covered in fresh snow" },
  { id: "frozen_park", name: "Frozen Park", backgroundColor: 0xB0E0E6, groundColor: 0xE0FFFF, decorationColor: 0x98D8C8, description: "A peaceful winter park with frozen fountains" },
  { id: "ice_rink", name: "Ice Rink", backgroundColor: 0xADD8E6, groundColor: 0xF0F8FF, decorationColor: 0xE6E6FA, description: "Slippery skating rink with festive decorations" },
  { id: "snow_village", name: "Snow Village", backgroundColor: 0xE0FFFF, groundColor: 0xFFFAFA, decorationColor: 0xFFE4E1, description: "Cozy village with snow-covered cottages" },
  { id: "mountain_path", name: "Mountain Path", backgroundColor: 0x708090, groundColor: 0xDCDCDC, decorationColor: 0xA9A9A9, description: "Rocky mountain trail with icy cliffs" },
  { id: "glacier_valley", name: "Glacier Valley", backgroundColor: 0x4682B4, groundColor: 0xB0C4DE, decorationColor: 0x6495ED, description: "Deep valley surrounded by massive glaciers" },
  { id: "frost_cave", name: "Frost Cave", backgroundColor: 0x4169E1, groundColor: 0x6495ED, decorationColor: 0x483D8B, description: "Mysterious cave with glowing ice crystals" },
  { id: "arctic_tundra", name: "Arctic Tundra", backgroundColor: 0x87CEFA, groundColor: 0xF5F5F5, decorationColor: 0xB0E0E6, description: "Vast frozen plains stretching to the horizon" },
  { id: "blizzard_plains", name: "Blizzard Plains", backgroundColor: 0x778899, groundColor: 0xF5F5F5, decorationColor: 0xC0C0C0, description: "Open fields with howling winter winds" },
  { id: "aurora_fields", name: "Aurora Fields", backgroundColor: 0x191970, groundColor: 0xE6E6FA, decorationColor: 0x9400D3, description: "Magical fields under the dancing northern lights" },
  { id: "candy_village", name: "Candy Village", backgroundColor: 0xFFB6C1, groundColor: 0xFFF0F5, decorationColor: 0xFF69B4, description: "Sweet holiday village with candy cane decorations" },
  { id: "crystal_forest", name: "Crystal Forest", backgroundColor: 0x00CED1, groundColor: 0xAFEEEE, decorationColor: 0x20B2AA, description: "Enchanted forest with crystalline trees" },
  { id: "frozen_lake", name: "Frozen Lake", backgroundColor: 0x87CEFA, groundColor: 0xF0FFFF, decorationColor: 0xADD8E6, description: "Vast frozen lake reflecting the winter sky" },
  { id: "north_pole", name: "North Pole HQ", backgroundColor: 0x2F4F4F, groundColor: 0xF0FFF0, decorationColor: 0x228B22, description: "The legendary headquarters at the top of the world" },
  { id: "ice_palace", name: "Ice Palace", backgroundColor: 0x1E90FF, groundColor: 0xE0FFFF, decorationColor: 0x00BFFF, description: "Magnificent palace made entirely of ice" },
];

// ==================== MINI-BOSSES ====================
export const miniBossSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  baseHitsNeeded: z.number(),
  baseSpeed: z.number(),
  damage: z.number(),
  ability: z.string(),
  sprite: z.string(),
  color: z.number(),
  coinReward: z.number(),
});

export type MiniBoss = z.infer<typeof miniBossSchema>;

export const MINI_BOSSES: MiniBoss[] = [
  { id: "mini_frost", name: "Frost Sprite", description: "Quick frost elemental", baseHitsNeeded: 8, baseSpeed: 60, damage: 1, ability: "freeze_touch", sprite: "childBoss", color: 0x87CEEB, coinReward: 25 },
  { id: "mini_ice", name: "Ice Guardian", description: "Armored ice warrior", baseHitsNeeded: 12, baseSpeed: 40, damage: 2, ability: "shield", sprite: "childBoss", color: 0x4169E1, coinReward: 35 },
  { id: "mini_snow", name: "Snow Wraith", description: "Fast and elusive", baseHitsNeeded: 6, baseSpeed: 80, damage: 1, ability: "dash", sprite: "childBoss", color: 0xF5F5F5, coinReward: 30 },
  { id: "mini_crystal", name: "Crystal Shard", description: "Splits when damaged", baseHitsNeeded: 10, baseSpeed: 50, damage: 1, ability: "split", sprite: "childBoss", color: 0x00CED1, coinReward: 40 },
  { id: "mini_blizzard", name: "Blizzard Imp", description: "Creates snow storms", baseHitsNeeded: 8, baseSpeed: 55, damage: 2, ability: "slow_aura", sprite: "childBoss", color: 0x778899, coinReward: 35 },
  { id: "mini_glacier", name: "Glacier Guardian", description: "Tough and slow", baseHitsNeeded: 15, baseSpeed: 30, damage: 2, ability: "armor", sprite: "childBoss", color: 0x6495ED, coinReward: 45 },
  { id: "mini_aurora", name: "Aurora Wisp", description: "Teleports around", baseHitsNeeded: 7, baseSpeed: 70, damage: 1, ability: "teleport", sprite: "childBoss", color: 0x9400D3, coinReward: 40 },
  { id: "mini_frostbite", name: "Frostbite Hound", description: "Aggressive charger", baseHitsNeeded: 9, baseSpeed: 65, damage: 2, ability: "charge", sprite: "childBoss", color: 0x00BFFF, coinReward: 35 },
  { id: "mini_polar", name: "Polar Sentinel", description: "Summons minions", baseHitsNeeded: 11, baseSpeed: 45, damage: 1, ability: "summon", sprite: "childBoss", color: 0xB0C4DE, coinReward: 50 },
  { id: "mini_icicle", name: "Icicle Elemental", description: "Ranged attacker", baseHitsNeeded: 8, baseSpeed: 50, damage: 2, ability: "projectile", sprite: "childBoss", color: 0xADD8E6, coinReward: 40 },
  { id: "mini_permafrost", name: "Permafrost Titan", description: "Extremely tough", baseHitsNeeded: 18, baseSpeed: 25, damage: 3, ability: "regen", sprite: "childBoss", color: 0x2F4F4F, coinReward: 60 },
  { id: "mini_snowstorm", name: "Snowstorm Spirit", description: "Highly mobile", baseHitsNeeded: 6, baseSpeed: 90, damage: 1, ability: "blink", sprite: "childBoss", color: 0xE0FFFF, coinReward: 35 },
];

// ==================== GAME LEVELS ====================
export const gameLevelSchema = z.object({
  id: z.number(),
  name: z.string(),
  mapId: z.string(),
  difficulty: z.number(),
  enemyHealthMultiplier: z.number(),
  enemySpeedMultiplier: z.number(),
  spawnRateMultiplier: z.number(),
  miniBoss1: z.string(),
  miniBoss2: z.string(),
  finalBoss: z.string(),
  rewards: z.object({
    coins: z.number(),
    xp: z.number(),
  }),
});

export type GameLevel = z.infer<typeof gameLevelSchema>;

// Level name themes for each set of 10 levels
const LEVEL_NAME_THEMES = [
  ["Snowy Streets", "Frozen Park", "Ice Rink", "Snow Village", "Frosty Lane", "Winter Square", "Cold Corner", "Chilly Avenue", "Icy Boulevard", "Snowflake Plaza"],
  ["Mountain Path", "Glacier Valley", "Frost Cave", "Alpine Pass", "Summit Trail", "Frozen Peaks", "Crystal Cavern", "Snowy Ridge", "Ice Cliff", "Highland Frost"],
  ["Arctic Tundra", "Blizzard Plains", "Frozen Wastes", "Polar Expanse", "Tundra Fields", "Icy Steppes", "Snowbound Prairie", "White Desert", "Frozen Frontier", "Arctic Edge"],
  ["Aurora Fields", "Northern Lights", "Starlit Snow", "Cosmic Frost", "Galaxy Glade", "Celestial Ice", "Astral Tundra", "Nebula Frost", "Stellar Fields", "Aurora Peak"],
  ["Candy Village", "Peppermint Lane", "Gingerbread Town", "Sugarplum Square", "Caramel Corner", "Lollipop Lane", "Candy Cane Court", "Sweet Street", "Frosting Fields", "Cocoa Commons"],
  ["Crystal Forest", "Diamond Grove", "Gem Glade", "Sapphire Woods", "Emerald Ice", "Ruby Frost", "Quartz Valley", "Prism Park", "Jewel Junction", "Crystal Peak"],
  ["Frozen Lake", "Ice Bay", "Glacier Shore", "Frost Harbor", "Snowmelt Lagoon", "Winter Cove", "Icicle Isle", "Polar Bay", "Frozen Fjord", "Arctic Waters"],
  ["North Pole HQ", "Santa's Workshop", "Elf Village", "Reindeer Stables", "Gift Factory", "Toy Town", "Holiday Hall", "Yuletide Tower", "Christmas Central", "Present Plaza"],
  ["Ice Palace", "Frost Fortress", "Snow Castle", "Winter Keep", "Frozen Throne", "Crystal Citadel", "Glacial Gates", "Icy Spires", "Blizzard Bastion", "Permafrost Palace"],
  ["Final Frontier", "Ultimate Tundra", "Apex Frost", "Supreme Blizzard", "Eternal Ice", "Infinite Winter", "Legendary Snow", "Mythic Frost", "Epic Glacier", "Grand Finale"],
];

// Mini-boss assignments by difficulty tier
const EASY_MINI_BOSSES = ["mini_frost", "mini_snow", "mini_ice", "mini_blizzard"];
const MEDIUM_MINI_BOSSES = ["mini_crystal", "mini_aurora", "mini_frostbite", "mini_icicle"];
const HARD_MINI_BOSSES = ["mini_glacier", "mini_polar", "mini_permafrost", "mini_snowstorm"];

// Final boss assignments by difficulty tier
const EASY_FINAL_BOSSES = ["frost_giant"];
const MEDIUM_FINAL_BOSSES = ["frost_giant", "blizzard_witch"];
const HARD_FINAL_BOSSES = ["blizzard_witch", "snow_golem"];

function generateGameLevels(): GameLevel[] {
  const levels: GameLevel[] = [];
  
  for (let i = 1; i <= 100; i++) {
    const themeIndex = Math.floor((i - 1) / 10);
    const levelInTheme = (i - 1) % 10;
    const mapThemeIndex = themeIndex % MAP_THEMES.length;
    
    // Difficulty scaling formulas
    const difficulty = 1 + (i - 1) * 0.05;
    const enemyHealthMultiplier = 1 + (i - 1) * 0.03;
    const enemySpeedMultiplier = Math.min(2.0, 1 + (i - 1) * 0.01);
    const spawnRateMultiplier = 1 + (i - 1) * 0.02;
    
    // Assign mini-bosses based on level
    let miniBoss1Pool: string[];
    let miniBoss2Pool: string[];
    let finalBossPool: string[];
    
    if (i <= 20) {
      miniBoss1Pool = EASY_MINI_BOSSES;
      miniBoss2Pool = EASY_MINI_BOSSES;
      finalBossPool = EASY_FINAL_BOSSES;
    } else if (i <= 50) {
      miniBoss1Pool = EASY_MINI_BOSSES;
      miniBoss2Pool = MEDIUM_MINI_BOSSES;
      finalBossPool = MEDIUM_FINAL_BOSSES;
    } else if (i <= 75) {
      miniBoss1Pool = MEDIUM_MINI_BOSSES;
      miniBoss2Pool = HARD_MINI_BOSSES;
      finalBossPool = HARD_FINAL_BOSSES;
    } else {
      miniBoss1Pool = HARD_MINI_BOSSES;
      miniBoss2Pool = HARD_MINI_BOSSES;
      finalBossPool = HARD_FINAL_BOSSES;
    }
    
    const miniBoss1 = miniBoss1Pool[i % miniBoss1Pool.length];
    const miniBoss2 = miniBoss2Pool[(i + 1) % miniBoss2Pool.length];
    const finalBoss = finalBossPool[i % finalBossPool.length];
    
    // Rewards scale with level (balanced for progression)
    const baseCoins = 10 + Math.floor(i * 1.5);
    const baseXp = 0; // XP is earned in-game, not as level rewards
    
    levels.push({
      id: i,
      name: LEVEL_NAME_THEMES[themeIndex]?.[levelInTheme] || `Level ${i}`,
      mapId: MAP_THEMES[mapThemeIndex].id,
      difficulty: parseFloat(difficulty.toFixed(2)),
      enemyHealthMultiplier: parseFloat(enemyHealthMultiplier.toFixed(2)),
      enemySpeedMultiplier: parseFloat(enemySpeedMultiplier.toFixed(2)),
      spawnRateMultiplier: parseFloat(spawnRateMultiplier.toFixed(2)),
      miniBoss1,
      miniBoss2,
      finalBoss,
      rewards: {
        coins: baseCoins,
        xp: baseXp,
      },
    });
  }
  
  return levels;
}

export const GAME_LEVELS: GameLevel[] = generateGameLevels();

// Helper function to get level config
export function getLevelConfig(levelId: number): GameLevel | undefined {
  return GAME_LEVELS.find(l => l.id === levelId);
}

// Helper function to get map theme by ID
export function getMapTheme(mapId: string): MapTheme | undefined {
  return MAP_THEMES.find(m => m.id === mapId);
}

// Helper function to get mini-boss by ID
export function getMiniBoss(bossId: string): MiniBoss | undefined {
  return MINI_BOSSES.find(b => b.id === bossId);
}

export type User = {
  id: string;
  username: string;
  password: string;
};

export type InsertUser = Omit<User, "id">;
