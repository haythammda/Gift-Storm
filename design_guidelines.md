# GiftStorm - Design Guidelines

## Design Approach

**Selected Approach:** Reference-Based (Game UI) + Custom Branding

Drawing inspiration from modern casual mobile games (Brawl Stars, Clash Royale) combined with charity campaign warmth. The design must feel playful yet professional, energetic without being chaotic, and family-friendly throughout.

**Core Principles:**
- Wholesome & Inviting: Bright, friendly, accessible to all ages
- Energy & Motion: Dynamic but not overwhelming
- Charity Transparency: Clear, honest, professional fundraising elements
- Game-First: UI supports gameplay without distraction

---

## Typography

**Primary Font:** Fredoka (Google Fonts) - Rounded, friendly, game-appropriate
- Hero Titles: 700 weight, 3xl-6xl sizes
- Section Headers: 600 weight, 2xl-4xl
- Body Text: 400-500 weight, base-lg
- Button Text: 600 weight, base-xl

**Secondary Font:** Inter (Google Fonts) - For data/numbers
- Stats & Scores: 500-600 weight, tabular numbers
- Leaderboard: 400 weight, mono spacing for alignment

---

## Layout System

**Spacing Units:** Tailwind 4, 6, 8, 12, 16, 24 (focused set for consistency)

**Breakpoints:**
- Mobile-first approach
- Desktop game canvas: centered, max-width 1400px
- Landing page: full-width sections with max-w-6xl content containers

---

## Page-Specific Layouts

### Landing Page (/)

**Hero Section:**
- Full-width background: Winter scene illustration (snowy cityscape at dusk with warm lights)
- Height: 85vh on desktop, 70vh mobile
- Centered content: Logo, tagline, primary CTA
- Semi-transparent overlay card for text readability

**Community Goal Section:**
- Prominent horizontal progress bar (full-width colored strip)
- Large numbers showing current/goal amounts
- Live updating "thermometer" style visualization
- Supporting text: impact description

**How It Works Section:**
- 3-column grid (stacks on mobile)
- Icon-title-description cards
- Visual flow indicators (arrows between cards)

**Leaderboard Preview:**
- Table format, top 5 scores only
- Alternating row background for readability
- "View Full Leaderboard" link

**Footer:**
- Transparency statement about donations
- Link to admin (subtle)
- Social proof elements

### Game Page (/play)

**Layout Structure:**
- Phaser canvas: centered, responsive scaling
- HUD overlay: positioned fixed corners
  - Top-left: HP bar, level, timer
  - Top-right: coins, current wave
  - Bottom: upgrade icons row
- Pause/Settings: top-right corner buttons
- Donate button: subtle, bottom-right, not intrusive

**Modal Overlays:**
- Level-Up Choice: 3-card horizontal layout, centered
- Game Over: centered card, stats grid, CTA buttons below
- Settings: slide-in panel from right
- Workshop: full-screen grid of upgrade cards

**Mobile Adaptations:**
- On-screen joystick: bottom-left
- Dash button: bottom-right
- Reduce HUD element size proportionally

### Admin Page (/admin)

**Functional Layout:**
- Single column form-based interface
- Card-based sections: Settings, Leaderboard, Simulation
- Clear section dividers
- Data tables: striped rows, fixed headers
- Action buttons: prominent, destructive actions require confirmation

---

## Component Library

### Buttons

**Primary CTA:** 
- Large pill-shaped (rounded-full)
- px-8 py-4 on desktop, px-6 py-3 mobile
- Prominent scale on press (active state)

**Secondary Buttons:**
- Rounded-lg, medium padding
- Border variant option

**Icon Buttons:**
- Square/circular, fixed sizes (w-10 h-10, w-12 h-12)
- Single icon, no text

**Buttons on Images:**
- Backdrop blur effect (backdrop-blur-md)
- Semi-transparent background
- White/light text for contrast

### Cards

**Standard Card:**
- Rounded corners (rounded-xl)
- Shadow elevation (shadow-lg)
- Inner padding p-6

**Game Upgrade Card:**
- Vertical layout: icon top, title, description, stats
- Rarity border (3px colored border based on tier)
- Hover: slight lift effect (transform scale)

**Stat Card:**
- Icon + large number + label
- Compact, grid-friendly

### Progress Bars

**Community Goal Bar:**
- Height: h-8 desktop, h-6 mobile
- Rounded ends (rounded-full)
- Animated fill (transition-all duration-500)
- Percentage text overlay

**HP Bar (in-game):**
- Compact (h-3)
- Color gradient (green to yellow to red based on value)
- Smooth depletion animation

### Modals

**Structure:**
- Centered overlay with dark backdrop (bg-black/60)
- Content card: max-w-2xl for standard, max-w-4xl for workshop
- Close button: top-right
- Padding: p-8 on desktop, p-6 mobile

### Navigation

**Landing Page:**
- Sticky header on scroll
- Logo left, nav links center, Donate button right
- Hamburger menu on mobile

**Game Page:**
- Minimal: floating corner buttons only
- No traditional nav bar

---

## Icons

**Library:** Heroicons (via CDN)
- Gift/present icons for projectiles
- Heart for HP
- Coin/currency icons
- Settings gear
- Play/pause/close standard icons

---

## Animations

**Sparingly Used:**
- Coin collect: bounce + fade (300ms)
- Level up: card entrance stagger (150ms delay between)
- Progress bar fill: smooth transition (500ms)
- Gift throw: simple arc trajectory
- NO constant idle animations, NO parallax on landing page

---

## Images

**Hero Image:** 
Yes - Winter cityscape at dusk (warm lights in windows, gentle snowfall, silhouettes of buildings). Illustrated style, not photographic. Position: background cover, center.

**Section Backgrounds:**
Use subtle textures (noise, grain) rather than full images to maintain performance and readability.

**Game Assets:**
Simple sprite-style graphics (not photographs). Child characters: icon-like, friendly shapes. Gifts: recognizable item illustrations (scarf, food box, toy).

---

## Accessibility

- Maintain 4.5:1 contrast minimum for all text
- Keyboard navigation for all interactive elements
- ARIA labels on game controls
- Reduced motion toggle honored throughout
- Touch targets minimum 44px on mobile

---

## Mobile Considerations

- Single column layouts below md breakpoint
- Larger touch targets (minimum 48px)
- Simplified nav (hamburger)
- Game canvas scales proportionally
- On-screen controls clearly visible, not overlapping critical game area