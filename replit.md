# GiftStorm - Winter Campaign Edition

## Overview

GiftStorm is a charity-themed browser game inspired by Survivor.io's core loop. Players throw gifts (warmth kits, scarves, food packs, toys) to help children in need during a winter campaign. The game features no violence - instead of defeating enemies, players help waves of children by delivering gifts. The project combines a playable Phaser 3 game with a donation campaign system, leaderboards, and community milestone tracking.

The application follows a full-stack TypeScript architecture with React frontend, Express backend, and PostgreSQL database (via Drizzle ORM).

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite with custom configuration for development and production
- **Routing**: Wouter (lightweight React router)
- **State Management**: TanStack React Query for server state
- **UI Components**: shadcn/ui component library built on Radix UI primitives
- **Styling**: Tailwind CSS with custom CSS variables for theming (light/dark mode support)
- **Game Engine**: Phaser 3 for the interactive game canvas

**Key Design Decisions**:
- Component-based architecture with shared UI components in `client/src/components/ui/`
- Custom theming system using CSS variables defined in `client/src/index.css`
- Typography uses Fredoka (primary, game-appropriate) and Inter (data/numbers) fonts
- Mobile-first responsive design with desktop game canvas max-width of 1400px

### Backend Architecture
- **Framework**: Express.js with TypeScript
- **Runtime**: Node.js with tsx for TypeScript execution
- **API Design**: RESTful endpoints prefixed with `/api/`
- **Build**: esbuild for production bundling with selective dependency bundling

**API Endpoints**:
- `GET /api/status` - Campaign status, donation totals, milestones
- `GET /api/scores` - Leaderboard scores
- `POST /api/score` - Submit new score
- `POST /api/admin/update` - Admin updates (requires ADMIN_KEY)
- `POST /api/admin/simulate` - Development donation simulation
- `GET /api/donation-packages` - List Stripe donation products
- `POST /api/create-checkout` - Create Stripe checkout session
- `GET /api/stripe-key` - Get Stripe publishable key
- `POST /api/stripe/webhook` - Stripe webhook handler

### Data Storage
- **Primary Database**: PostgreSQL via Drizzle ORM
- **Schema Location**: `shared/schema.ts` with Zod validation integration
- **Fallback/Dev Storage**: JSON file storage in `data/state.json` for state persistence
- **Client Storage**: localStorage for player progress and settings

**Data Models**:
- Scores (leaderboard entries with player stats)
- Game status (donation totals, goals, milestones)
- Player metadata (coins, upgrades, best times)

### Development vs Production
- Development: Vite dev server with HMR, integrated with Express
- Production: Static file serving from `dist/public`, bundled server in `dist/index.cjs`
- Build script: `script/build.ts` handles both client (Vite) and server (esbuild) builds

## External Dependencies

### Database
- **PostgreSQL**: Primary database (connection via `DATABASE_URL` environment variable)
- **Drizzle ORM**: Type-safe database queries and migrations
- **drizzle-kit**: Database migration tooling (`npm run db:push`)

### Payment/Donations
- External donation URL (configurable via admin panel)
- MVP approach: Opens external payment link in new tab
- Dev simulation mode for testing donation increments

### UI Component Libraries
- **Radix UI**: Accessible, unstyled component primitives (accordion, dialog, dropdown, etc.)
- **Lucide React**: Icon library
- **class-variance-authority**: Component variant styling
- **Embla Carousel**: Carousel functionality

### Game Engine
- **Phaser 3**: HTML5 game framework for the survival arena gameplay

### Equipment System
Players can purchase and equip 5 equipment slots for permanent stat bonuses:
- **Jacket**: Provides HP bonus
- **Socks**: Provides speed bonus
- **Gloves**: Provides throw rate bonus (faster attacks)
- **Pants**: Provides defense bonus (damage reduction)
- **Sweater**: Provides pickup radius bonus

Each equipment slot has 2 tiers with increasing costs and stats.

### Skill Tree System
4 skill categories with permanent upgrades:
- **Offense**: Damage, critical chance bonuses
- **Defense**: Max HP, dodge chance bonuses
- **Utility**: Speed, pickup range bonuses
- **Weapons**: Unlock new weapon types

Skills have multiple levels and scale with investment.

### Storage Helper Functions
- `getEquippedStats(data)`: Returns equipment stat bonuses (hpBonus, speedBonus, throwRateBonus, damageBonus, pickupRadiusBonus)
- `getSkillStats(data)`: Returns skill tree bonuses (damageBonus, defenseBonus, speedBonus, pickupBonus, hpBonus)
- Stats are computed once at game start and apply as multipliers with clamping

### Upgrade System Architecture
The game features two types of upgrades:

**Meta Upgrades (Workshop/Permanent)**:
- Purchased with coins earned from gameplay
- Persist across game sessions via localStorage
- Applied when a new game starts in the Phaser scene's `create()` function
- Types: Throw Rate, Move Speed, Max HP, Coin Multiplier

**In-Run Upgrades (Level-Up Choices)**:
- Selected when player levels up during gameplay
- Applied each frame via React refs (upgradesRef.current)
- Scene persists during gameplay - useEffect only depends on [isPlaying, theme]
- 12 abilities: Rapid Fire, Gift Storm, Hot Cocoa Rush, Warmth Shield, Boomerang Gift, Gift Explosion, Mega Magnet, Piercing Gifts, Freeze Blast, Healing Warmth, Gift Chain, Critical Gift

**Key Implementation Details**:
- React state bridged to Phaser via refs (upgradesRef, gameStateRef, endGameRef)
- Boomerang gifts survive first hit and return to player
- Splash effect helps nearby children within 100px radius with visual effect
- Magnet attracts pickups within configurable radius
- Piercing allows gifts to pass through 2 targets
- Freeze applies 2s slow with blue tint
- Chain creates 2 projectiles to nearby enemies
- Healing grants +5 HP per 10 helped
- Critical has 20% chance for 2x score

### Game Modes
**Limitless Mode**: Endless survival where score is based on time and children helped
**Levels Mode**: Progressive stages with target goals (6 levels from Snowy Streets to North Pole HQ)

### Enemy Types
- **Normal**: Standard speed, 1 hit needed
- **Fast (Blue)**: 140+ base speed, appears after 15s
- **Armored (Brown)**: Slower, 3 hits needed, appears after 30s  
- **Boss (Pink)**: Slowest, 8 hits needed, spawns every 90 seconds in limitless mode

### Enemy Special Abilities
Enemies have a 25% chance to spawn with special abilities:
- **Dash (6%)**: Quick charge toward player when nearby
- **Shield (6%)**: 60% chance to block frontal gift hits with visual feedback
- **SlowPlayer (6%)**: Slows player movement for 1.5s on contact with blue tint
- **Split (7%)**: Spawns 2 smaller enemies (70% scale) on death

### Boss Spawning (Limitless Mode)
- Bosses spawn every 90 seconds in Limitless mode
- Boss HP: 8 hits needed
- Boss rewards: 5 coins per boss defeated
- Visual: Pink tint with larger size

### Levels Mode (100 Levels)
Each level is a 5-minute timed challenge with structured boss encounters:
- **0:00 - 2:00**: Regular enemies spawn with increasing intensity
- **2:00**: First Mini-Boss spawns (must defeat to continue)
- **2:00 - 4:00**: Harder enemies spawn
- **4:00**: Second Mini-Boss spawns
- **4:00 - 5:00**: Intense enemy waves
- **5:00**: Final Boss spawns (level complete when defeated)

**Difficulty Scaling per Level:**
- difficulty = 1 + (level - 1) * 0.05 (5% harder each level)
- enemyHealth = 1 + (level - 1) * 0.03 (3% more HP)
- enemySpeed = min(2.0, 1 + (level - 1) * 0.01) (1% faster, capped at 2x)
- spawnRate = 1 + (level - 1) * 0.02 (2% more spawns)

**Star Rating System:**
- 3 Stars: Complete with 80%+ HP remaining
- 2 Stars: Complete with 50%+ HP remaining
- 1 Star: Complete the level

### Map Themes (15 themes)
Maps shuffle per level:
- Snowy Streets, Frozen Park, Ice Rink, Snow Village, Mountain Path
- Glacier Valley, Frost Cave, Arctic Tundra, Blizzard Plains, Crystal Forest
- Aurora Fields, Candy Village, Frozen Lake, North Pole HQ, Winter Wonderland

### Skill Tree System (100 Skills)
5 categories with tiered progression (20 skills each):
- **Offense**: Damage, fire rate, projectile speed, crit chance/damage, piercing
- **Defense**: HP, armor, regeneration, shields, dodge, lifesteal, thorns
- **Utility**: Speed, pickup radius, XP gain, coin bonus, movement abilities
- **Weapons**: Unlock and upgrade 4 weapon types with ultimate abilities
- **Special**: Cross-category synergy skills requiring multiple prerequisites

### Workshop System (10 Limitless Upgrades)
Upgrades with exponential cost scaling: cost = baseCost * (1.15 ^ level)
- **Resilience Training**: +10 Max HP per level
- **Quick Hands**: +3% throw rate per level (cap 80%)
- **Swift Feet**: +3% move speed per level (cap 60%)
- **Head Start**: Start with random upgrade (one-time)
- **Golden Touch**: +5% coin gain per level
- **Lucky Stars**: +2% XP gain per level
- **Gift Power**: +2% damage per level (cap 50%)
- **Starting HP Bonus**: +5 HP at game start per level
- **Pickup Range**: +3% pickup radius per level (cap 75%)
- **Critical Eye**: +1% crit chance per level (cap 25%)

### In-Run Upgrades (24 Total)
12 original + 12 new abilities with synergy system:
- **Original**: Rapid Fire, Gift Storm, Hot Cocoa Rush, Warmth Shield, Boomerang Gift, Gift Explosion, Mega Magnet, Piercing Gifts, Freeze Blast, Healing Warmth, Gift Chain, Critical Gift
- **New**: Double Jump, Lucky Star, Gift Barrage, Frostbite, Thorns, Regeneration, Treasure Hunter, Haste, Vampiric Gifts, Shield Breaker, Multi-Shot, Time Warp

### Synergy System
Upgrade combinations that provide bonus effects:
- **Gift Storm** (Rapid Fire + Gift Storm): +10% projectile speed
- **Deep Freeze** (Freeze Blast + Frostbite): 3s freeze instead of 2s
- **Treasure Master** (Mega Magnet + Treasure Hunter): 1.5x pickup radius
- **Gift Wave** (Piercing + Gift Chain): Chain to 3 targets
- **Life Force** (Healing Warmth + Vampiric): Healing at 15 kills instead of 20

### Level-Up System
- Game fully pauses during level-up (physics frozen, no damage taken)
- Multiple level-ups queue instead of being lost
- Shows "Choose upgrade (1 of X)" when multiple pending

### Equipment System (75 Items)
5 equipment slots with 15 items each (Common/Rare/Epic rarity):
- **Jacket**: HP bonuses (10-75 HP range)
- **Socks**: Speed bonuses (5-35% range)
- **Gloves**: Throw rate bonuses (5-35% range)
- **Pants**: Mixed HP/speed/damage
- **Sweater**: Balanced all-around bonuses

**Equipment Cards & Upgrades:**
- Collect cards from chests after completing levels
- 10 cards = upgrade equipment to next level (max level 5)
- Each level increases stat bonuses by 20%

**Chest System:**
- Wooden Chest: Levels 1-20, 10% equipment chance
- Silver Chest: Levels 21-50, 25% equipment chance
- Golden Chest: Levels 51-80, 50% equipment chance
- Diamond Chest: Levels 81-100, 80% equipment chance

### Donation System (Stripe Integration)
5 donation packages that award in-game coins:
- **Warmth Pack**: $5 → 500 coins
- **Gift Bundle**: $10 → 1,200 coins
- **Hero Package**: $25 → 3,500 coins
- **Champion Bundle**: $50 → 8,000 coins
- **Legend Pack**: $100 → 20,000 coins

100% of donations go to charity. Stripe handles secure payments.

**Coupon System:**
- Checkout supports promotion codes (allow_promotion_codes: true)
- Users can enter coupon codes on the Stripe checkout page
- Test coupon "COPTES2026" can be created in Stripe Dashboard for 100% off testing

### Game Speed & Difficulty
- Base spawn rate: 600ms, scales down to 180ms over 3 minutes
- Projectile speed: 550
- Difficulty scales aggressively with time:
  - Spawn rate decreases: 600ms → 180ms minimum
  - Enemies per spawn: 1 → 6 over time
  - Enemy speed: +5% every 30 seconds (capped at +50%)
  - Boss spawns at 60s, then every 45s
  - Elite enemies appear after 120s (5 hits, gold tint)
- HUD shows "Danger" level indicator
- Player speed: 280
- Throw rate: 280ms base
- Difficulty scales exponentially: levelDifficulty * (1 + time/30)
- Multi-spawn: 1-4 enemies per spawn based on survival time
- Wave system: New wave every 15 seconds, boss spawn chance on wave 5, 10, 15...

### Development Tools
- **Replit plugins**: Runtime error overlay, cartographer, dev banner (dev only)
- **TypeScript**: Full-stack type safety with path aliases (`@/` for client, `@shared/` for shared)

### Environment Variables
- `DATABASE_URL`: PostgreSQL connection string
- `ADMIN_KEY`: Admin panel authentication (defaults to `giftstorm-admin-2024`)
- `NODE_ENV`: Development/production mode toggle