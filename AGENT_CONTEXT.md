# Chain Reaction — Live Developer Context & System Handbook

Welcome to the **Chain Reaction** workspace context document. This handbook is designed to get any incoming coding agent or developer instantly up to speed on the project architecture, mathematical systems, dynamic difficulty scaling, and high-fidelity simulated monetization system.

---

## 🎮 Project Architecture Overview

Chain Reaction is a single-screen hyper-casual freemium web game built using the following stack:
1. **Frontend Core:** React 19, TypeScript, and Vite.
2. **Graphics & Rendering:** HTML5 Canvas API driven by a custom physics engine class (`GameEngine` in `src/lib/engine.ts`).
3. **Sound System:** Procedural Web Audio API synthesizer (`src/lib/audio.ts`) providing custom oscillators, chord sweeps, and warning beeps.
4. **Styling:** Tailwind CSS v4.0 with vibrant neon-glow theme colors (STANDARD, NEBULA, MATRIX, SUPERNOVA).
5. **Assets & App Icons:** Automatically generated using `@capacitor/assets` from a single dark-theme centered master icon (`assets/logo.png`).

### Key Files in Workspace
* [src/App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx) — Main dashboard UI, screen states (`'START'`, `'GAME'`, `'ROUND_OVER'`, `'SHOP'`, `'PRESTIGE_SHOP'`), persistent upgrades storage, guided onboarding cards, and the **Quantum Syndicate Portal** premium monetization flow.
* [src/lib/engine.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/engine.ts) — Physics engine running within canvas loops. Handles drifting particles, gravity sweep vectors, void singularities, decay conversions, Resonance Dampeners, Gravity Sinkholes, and chain-reaction calculations.
* [src/lib/audio.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/audio.ts) — Procedural Web Audio API sound synthesis.
* [src/index.css](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/index.css) — Global CSS custom keyframe definitions (`fadeIn`, `scaleUp`, `pulse-ring`, `bounce-finger`, `bounce-finger-left`) and animations.

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
* **Resonance Sustain Core (`resonanceDuration`):** Active explosion hold frames duration.
  * *Formula:* $\text{HoldFrames}(L) = 120 + 240 \times (1 - 0.82^L)$ *(Asymptotes at $360$ frames / 6s)*

### Category B: Discrete/Percentage Stats (Linear Clamps)
These stats increase linearly up to logical limits (e.g. 100% absorption or 8 sparks), after which their *costs* continue to scale exponentially as a prestige achievement sink, but their value remains capped at the max threshold:

* **Cascade Spark Battery (`extraSparks`):** Spark Retries. Capped at **Level 7 (8 Sparks)**.
* **Decay Neutralizer Shield (`decayResist`):** Converts decay cells to explosions. Capped at **Level 8 (100%)**.
* **Reactor Volatility (`specialSpawnRate`):** Spawn frequency of special atoms. Capped at **Level 10 (65%)**.
* **Vortex Fuel Recycler (`magnetAutopilot`):** Inactive magnet sweep fuel trickle recharge. Capped at **Level 10 (0.40/f)**.
* **Combo Resonance Charger (`comboShardMultiplier`):** Bonus shards per peak combo. Uncapped ($\text{Bonus} = 4 \times L$).

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
3. **Void Singularities (`VOID_ANOMALY`):** Swirling obstacle zones pulling atoms in and swallowing active explosions (Level 3+).
4. **Anti-Matter Decay Cells (`DECAY`):** Heavy particles resisting sweeps and extinguishing overlapping chain-reactions (Level 2+).
5. **Resonance Dampeners (`DAMPENER` - Sector 35+):** Magenta drifting hazards that emit a suppression field, instantly collapsing overlapping active chain reactions to 15% size.
6. **Gravity Sinkholes (`SINKHOLE` - Sector 35+):** Stationary black vortexes with accretion rings that actively suck standard atoms in and swallow detonator sparks dropped inside their event horizons.

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

### 2. Simulated In-App Purchases (Stripe Checkout)
- Features 3 premium transaction core packages:
  - **Mini Shard Cache:** $0.99 for +1,200 ⚡
  - **Quantum Cargo Core:** $2.49 for +3,500 ⚡
  - **Singularity Core Pack:** $4.99 for +10,000 ⚡
- Clicking a package pops up a sleek card authorization dialog with active processing spinner wheels, transaction chimes, and successful verification checkmarks.

---

## 🚦 Verification Commands

To check the project compile states or verify static assets, execute the following shell scripts from the root directory:
```bash
# Verify TypeScript compiler compliance
npx tsc --noEmit

# Compile static assets production bundle
npm run build

# Start local development server (Vite on Port 3000)
npm run dev
```

Good luck developing in the Reactor Grid! 💥
