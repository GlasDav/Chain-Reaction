# Chain Reaction — Live Developer Context & System Handbook

Welcome to the **Chain Reaction** workspace context document. This handbook is designed to get any incoming coding agent or developer instantly up to speed on the project architecture, mathematical systems, dynamic difficulty scaling, and high-fidelity simulated monetization system.

---

## 🎮 Project Architecture Overview

Chain Reaction is a single-screen hyper-casual freemium mobile/web game built using the following stack:
1. **Frontend Core:** React 19, TypeScript, and Vite.
2. **Graphics & Rendering:** HTML5 Canvas API driven by a custom physics engine class (`GameEngine` in `src/lib/engine.ts`).
3. **Sound System:** Procedural Web Audio API synthesizer (`src/lib/audio.ts`) providing custom oscillators, chord sweeps, warning beeps, and a dedicated gravimetric vortex sweep (`playGravityAbsorb`) to acoustically distinguish `'GRAVITY'` particle detonations from standard elements.
4. **Styling:** Tailwind CSS v4.0 with vibrant neon-glow theme colors (STANDARD, NEBULA, MATRIX, SUPERNOVA).
5. **Mobile Native Shells:** Capacitor wrappers scaffolded for iOS and Android, compiling in Xcode and Android Studio.
6. **Assets & App Icons:** Automatically generated using `@capacitor/assets` from a single dark-theme centered master icon (`assets/logo.png`).

### Key Files in Workspace
* [src/App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx) — Main dashboard UI, screen states (`'START'`, `'GAME'`, `'ROUND_OVER'`, `'SHOP'`, `'PRESTIGE_SHOP'`), persistent upgrades storage, guided onboarding cards, best score panels, the dashboard **Reactor Anomaly Scanner** progress tracker, and the **Quantum Syndicate Portal** premium monetization flow.
* [src/lib/engine.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/engine.ts) — Physics engine running within canvas loops. Handles drifting particles, gravity sweep vectors, void singularities, decay conversions, Resonance Dampeners, Gravity Sinkholes, and chain-reaction calculations.
* [src/lib/audio.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/audio.ts) — Procedural Web Audio API sound synthesis.
* [src/index.css](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/index.css) — Global CSS custom keyframe definitions (`fadeIn`, `scaleUp`, `pulse-ring`, `bounce-finger`, `bounce-finger-left`) and animations.
* [MainActivity.java](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/android/app/src/main/java/com/quantum/chainreaction/MainActivity.java) — Native Android Java wrapper implementing immersive fullscreen behaviors.

---

## 💎 Infinite Progression & Asymptotic Upgrade Formulas

To support infinite upgrades without breaking the physical boundaries of the canvas rendering, stats are categorized into two classes:

### Category A: Continuous Stats (Asymptotic Soft-Caps)
These stats increase infinitely (levels $L$ can reach $100+$) but approach a mathematical ceiling, ensuring that active explosions or magnet fields never exceed physical screen dimensions:
$$\text{Value}(L) = \text{BaseValue} + \text{MaxIncrease} \times (1 - \lambda^L)$$

* **Catalyst Core (`sparkRadiusBoost`):** Spark reach explosion radius.
  * *Formula:* $\text{RadiusMultiplier}(L) = 1.0 + 1.8 \times (1 - 0.78^L)$ *(Asymptotes at $2.8\text{x}$ reaches)*
* **Quantum Fuel Module (`maxMagnetFuel`):** Sweeping magnet fuel capacity.
  * *Formula:* $\text{FuelCap}(L) = 100 + 400 \times (1 - 0.85^L)$ *(Asymptotes at $500$ sweep capacity)*
* **Tractor Drive Pulse (`magnetPower`):** Gravitational sweep pull strength.
  * *Formula:* $\text{PullStrength}(L) = 1.0 + 3.0 \times (1 - 0.80^L)$ *(Asymptotes at $4.0\text{x}$ pull power)*
  * *Bipolar Repulsion Field:* Generates a hazard repulsion field at a $185\text{px}$ radius (outlined by a pulsating dashed red HUD ring). Clearable atoms are pulled in, while dangerous **Decay Cells**, **Void Singularities**, and **Resonance Dampeners** are repelled away to carve out safe sweeping pathways.
* **Resonance Sustain Core (`resonanceDuration`):** Active explosion hold frames duration.
  * *Formula:* $\text{HoldFrames}(L) = 120 + 240 \times (1 - 0.82^L)$ *(Asymptotes at $360$ frames / 6s)*

### Category B: Discrete/Percentage Stats (Linear Clamps)
These stats increase linearly up to logical limits (e.g. 100% absorption or 8 sparks), after which their *costs* continue to scale exponentially as a prestige achievement sink, but their value remains capped at the max threshold:

* **Cascade Spark Battery (`extraSparks`):** Spark Retries. Capped at **Level 7 (8 Sparks)**.
* **Decay Neutralizer Shield (`decayResist`):** Converts decay cells to explosions. Capped at **Level 8 (100%)**.
* **Reactor Volatility (`specialSpawnRate`):** Spawn frequency of special atoms. Capped at **Level 10 (65%)**.
* **Vortex Fuel Recycler (`magnetAutopilot`):** Inactive magnet sweep fuel trickle recharge. Capped at **Level 10 (0.40/f)**.
* **Combo Resonance Charger (`comboShardMultiplier`):** Bonus shards per peak combo. Uncapped ($\text{Bonus} = 4 \times L$).

### Leftover Spark Economy Bonuses
To reward efficiency and precise tactical placements, completing a level with unused trigger sparks awards a significant economy bonus:
$$\text{ShardBonus} = \text{SparksLeft} \times 50\text{ Shards}$$
This bonus is added directly to the round's unmultiplied rewards total and is fully eligible for slot machine resonance multiplication during the fuser stage.

### Cost Progression (Exponential with Prestige Discounts)
Costs scale exponentially for all standard shop items, attenuated by permanent prestige research efficiency modifiers:
$$\text{Cost}(L) = \text{BaseCost} \times \text{Multiplier}^L \times 0.88^{\text{PrestigeGridEfficiency}}$$

---

## 🏆 Sector Retirement & Extraction (Prestige)

Standard progression caps at **Level 50 (Master Grid)**. Upon beating Sector 50, the player can continue playing infinitely to harvest standard shards, or initiate **Sector Retirement & Extraction**:
- Career progress resets: Level resets to 1, standard StoreUpgrades to level 0, and shards to 30.
- Player is awarded **+1 Permanent Dark Matter Catalyst** (prestige token).
- Permanent upgrades can be unlocked in the **Quantum Prestige Shop**:
  1. **Prestige Catalyst Core (Max Lvl 5):** Permanent $+15\%$ spark expansion radius (multiplicative).
  2. **Pulsar Tractor Beam (Max Lvl 5):** Permanent $+20\%$ magnet sweep herding pull speed (multiplicative).
  3. **Grid Core Efficiency (Max Lvl 5):** Permanent $-12\%$ standard upgrade cost discount (multiplicative).
  4. **Dark Matter Transmuter (Max Lvl 3):** Permanent $+10\%$ chance per level for standard atoms to spawn as radioactive purple **Dark Matter Atoms**, yielding double score and $+10$ extra shards!

---

## 🌪️ Dynamic Exponential Difficulty & Blockers

To incentivize shop upgrades, the reactor grid difficulty spikes dynamically:
1. **Drift Velocity Acceleration:** Drifting particles accelerate exponentially:
   $$\text{SpeedMultiplier} = 1.45 \times 1.18^{\max(0, \text{Level} - 5)}$$
2. **Hitbox Radius Shrinkage:** Particle collision hitboxes shrink exponentially:
   $$\text{RadiusMultiplier} = \text{BaseRadius} \times 0.88^{\max(0, \text{Level} - 5)}$$
3. **Particle Swarm Regulation:** Clearable drifting particle counts are moderated to prevent automatic cascading wins:
   $$\text{Count}(L) = \min(85, 20 + \lfloor L \times 1.3 \rfloor)$$
4. **Void Singularities (`VOID_ANOMALY`):** Swirling obstacle zones pulling atoms in and swallowing active explosions (Level 3+).
5. **Anti-Matter Decay Cells (`DECAY`):** Heavy particles resisting sweeps, repelled by active sweeper fields, and extinguishing overlapping chain-reactions (Level 2+).
6. **Quantum Pulsars (`PULSAR` - Sector 20+):** Slowly drifting orange warning hazards running on a 220-frame EM cycle, emitting expanding shockwaves that repel particles (impulse 3.8) and instantly collapse overlapping explosions to 15% size.
7. **Resonance Dampeners (`DAMPENER` - Sector 35+):** Magenta drifting hazards repelled by active sweeps that emit a suppression field, instantly collapsing active chain reactions to 15% size.
8. **Gravity Sinkholes (`SINKHOLE` - Sector 35+):** Stationary black vortexes with accretion rings that actively suck standard atoms in and swallow detonator sparks dropped inside their event horizons.

---

## 🎓 Interactive Guided Tutorial (Sector 0)

To onboard new players, the application boots into an interactive guided training sequence (**Sector 0**) if no previous game data exists:
- **Sandbox Environment:** Spawns exactly 12 standard slow-drifting atoms. Bypasses all hazards, anomalies, and active magnet herding fuel consumption.
- **Guidance Sequence:**
  1. *Step 1:* Center pulsing orbital target guides the player to place their first detonator spark.
  2. *Step 2:* Bypasses fuel consumption and prompts the player to drag the Gravitational Magnet to herd the remaining atoms.
  3. *Step 3:* Celebratory sector clear, awarding **+200 bonus shards** and directing the player to the Shop.
  4. *Step 4:* Pulsing indicator badge redirects starting dashboard controls to the Shop entrance.
  5. *Step 5:* Guides the user to purchase their first **Catalyst Core** (offered for free as a tutorial gift), completing onboarding and loading Sector 1.

---

## ⚡ Premium Interactive Monetization Engine

When a player runs short on Quantum Shards to unlock an upgrade, or fails to clear a sector, the **Quantum Syndicate Portal** modal sheet pops open automatically.

### 1. Simulated Fullscreen Rewarded Ads
- Clicking **WATCH AD COMMS** transitions to a fullscreen countdown overlay (5 seconds).
- Synthesizes dynamic click ticks on each second (`playAdTick()`).
- Triggers a C-Major cash register bell chime on completion (`playTransactionChord()`), adds `+250` shards to balance, and floats an emerald banner `+250 Shards Received!` across the dashboard.
- Bridges directly to native Capacitor AdMob plugins when `window.Capacitor.isNativePlatform()` is active.

### 2. Simulated In-App Purchases (Stripe Checkout)
- Features 3 premium transaction core packages:
  - **Mini Shard Cache:** $0.99 for +1,200 ⚡ (Consumable ID: `com.quantum.chainreaction.mini`)
  - **Quantum Cargo Core:** $2.49 for +3,500 ⚡ (Consumable ID: `com.quantum.chainreaction.cargo`)
  - **Singularity Core Pack:** $4.99 for +10,000 ⚡ (Consumable ID: `com.quantum.chainreaction.singularity`)
- Clicking a package pops up a sleek card authorization dialog with active processing spinner wheels, transaction chimes, and successful verification checkmarks.
- Bridges directly to native `CdvPurchase.store` APIs when run in compiled mobile shells to activate Google Play and Apple Store billing processes.

---

## 📱 Mobile Platform Integrations & Rendering Optimizations

Incoming developers should pay close attention to the following design patterns that ensure native performance and full viewport compatibility on mobile devices:

### 1. Native Immersive Sticky Fullscreen Mode
To guarantee the game fits edge-to-edge under notches and does not conflict with bottom navigation buttons (Home, Back, Recents), the native wrapper [MainActivity.java](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/android/app/src/main/java/com/quantum/chainreaction/MainActivity.java) implements true immersive sticky flags:
- Modern `WindowInsetsController` hides the status and navigation bars.
- Overrides `onWindowFocusChanged` to dynamically re-immersive the application if a user swipes standard system items into visibility and releases control back to the game.

### 2. Direct-to-DOM Sweeper UI Rendering
Continuous herding sweeps are highly volatile. To prevent React state engine updates (`onScoreUpdate`) from forcing heavy Virtual DOM diffing loops 60 times a second inside `App.tsx`, fuel values are written **directly to the DOM**:
- Target elements: `id="magnet-fuel-bar"` and `id="magnet-fuel-text"`.
- The physics loop modifies these nodes directly (`0.05ms` workload). Component states are only synchronized during major milestones (explosions, comets, or round transitions), unlocking butter-smooth physics frame rates.

### 3. Squared-Distance Coordinate Fabric Grid Math
The interactive grid calculates fabric-warping gravity lines in `engine.ts` relative to comets and magnets:
- Checks if `distSq < maxDistSq` (e.g. `25600` for a `160px` magnet radius) **before** invoking `Math.sqrt` and floating divisions.
- Skips 90% of square-root calculations for grid vertices out of active sweep ranges, saving massive CPU cycles.

### 4. Adaptive Fabric Grid Density
- To accommodate lower-end mobile processors, screen bounds determine grid cell size.
- If `width < 768` (mobile viewports), cell dimensions scale from `42x40px` to `72x60px`. This reduces path drawing calculations by **over 75%** on phone viewports with zero visual compromise.
- **Canvas Shadow Elimination:** Avoid Canvas 2D `shadowBlur` operations inside high-frequency frames. Procedural glow rings (concentric filled arcs with alpha falloffs) and black-outlined vector strokes are used instead to keep rendering operations strictly GPU-accelerated.

### 5. Level-Specific Progress and System Data Resets
- **Level Progression:** Saves current active level progression in `localStorage` under the key `chain_reaction_level_v3`, restoring the user's grid stage exactly upon relaunch.
- **Sector High Scores:** Tracks and saves best scores achieved *per level* in `localStorage` under `chain_reaction_level_scores_v3`. Rendered on the results screen as a 3-column stats panel (Current Score, Peak Combo, Sector Best).
- **Hard Database Wipe:** An accessibility button `[ ⚠️ RESET SYSTEM DATA ]` on the Start screen clears all database storage entries and resets state models back to clean-slate defaults.

### 6. Frozen Viewport Store Headers
To maintain access to dashboard exit paths and live shard balances during vertical scrolls, the **Quantum Store** and **Prestige Shop** overlay cards implement fixed viewport headers:
- Locks the parent screen container using `overflow-hidden`.
- Renders the header as a static `flex-shrink-0` block inside the flex tree.
- Wraps all upgrading cards and unlockable themes inside a scrolling `flex-1 overflow-y-auto` view pane, allowing elements to slide underneath the frozen top bar seamlessly.

### 7. Real-Time Global Leaderboards (Supabase Integration)
- **Database Backend:** Dedicated Supabase project reference `ycvztrpgihepiwqqzefz` under the **Chain Reaction** organization, operating on publishable anonymous client credentials with public SELECT/INSERT row-level security (RLS) policies.
- **Quantum Run Records (Arcade Standings):** Displays the top 10 longest successful continuous arcade runs. Submitted at run termination (fails, near-miss forfeit, or active-game forfeit) with a touch-friendly virtual sci-fi keypad prompting for exactly 3 uppercase pilot characters.
- **Galactic Career Standings:** Tracks and displays cumulative lifetime career scores silently synced and updated to the database as players earn shards during standard gameplay sweeps.
- **Prestige Reset Loop Protection:** Automatically intercepts "🌌 RETIRE SECTOR & RESET PROGRESS" requests, prompting players to record their active continuous run scores to the database before executing standard progress resets.
- **Standings Deck UI Modal:** Renders interactive dual-tab rankings grids with trophy accents (🥇, 🥈, 🥉), short-date formats, active pilot tag signatures, dynamic loader animations, and custom row highlights for the active player.

---

## 📦 Store Compliance & Publishing Assets

To meet Google Play Console requirements, legal policies and high-fidelity promotional graphic assets are established directly in the workspace:

### 1. GitHub Pages Privacy Policy
- **File:** [privacy.html](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/privacy.html)
- **Status:** Deployed and live via GitHub Pages.
- **Publishing URL:** `https://glasdav.github.io/Chain-Reaction/privacy.html`
- **Contents:** Standard, legally compliant mobile privacy agreement detailing data practices (zero user-identifiable tracking, local device storage only) and integrated third-party SDK connections (Google Play Services, AdMob).

### 2. Store Graphic Assets (`/icons` directory)
Google-spec visual assets are generated and cropped directly inside the workspace for simple submission:
- **Play Store App Icon:** [play_store_512_1.png](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/icons/play_store_512_1.png) — Exactly **512px by 512px PNG** displaying the high-contrast neon atom core with glowing orbital trails.
- **Store Feature Graphic 1:** [feature_graphic_1.png](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/icons/feature_graphic_1.png) — Exactly **1024px by 500px PNG** featuring a panoramic "Instability Cascade Core" chain-reaction layout.
- **Store Feature Graphic 2:** [feature_graphic_2.png](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/icons/feature_graphic_2.png) — Exactly **1024px by 500px PNG** displaying a wide "Quantum HUD Scanner Sweep" reactor grid layout.

---

## 🚦 Verification Commands

To check the project compile states or verify static assets, execute the following shell scripts from the root directory:
```bash
# Verify TypeScript compiler compliance
npx tsc --noEmit

# Compile static assets production bundle
npm run build

# Synchronize compiled web assets and native overrides to Capacitor shells
npx cap sync

# Start local development server (Vite on Port 3000)
npm run dev
```

Good luck developing in the Reactor Grid! 💥
