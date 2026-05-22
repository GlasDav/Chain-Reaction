# Infinite Progression & Monetization Design

This document details the architectural design for introducing infinite progression upgrades, simulated in-app purchases (IAP), rewarded video ads, and dynamic difficulty scaling in the React/Vite-based game **Chain Reaction**.

---

## 1. Mathematical Upgrade Scaling Engine

To support infinite upgrades without breaking the physical limits of the canvas rendering, we classify upgrades into two categories: **Continuous Stats** (utilizing asymptotic soft caps) and **Discrete/Percentage Stats** (utilizing hard limits for value scaling but infinite prestige levels for costs).

### Cost Formula (All Upgrades)
All upgrade levels $L$ scale exponentially, driving grinding or purchase triggers at high tiers:
$$\text{Cost}(L) = \text{BaseCost} \times \text{Multiplier}^L$$

### A. Continuous Upgrades (Asymptotic Diminishing Returns)
These stats increase infinitely but approach a mathematical ceiling, ensuring that active explosions or magnet fields never exceed physical screen dimensions.
$$\text{Value}(L) = \text{BaseValue} + \text{MaxIncrease} \times (1 - \lambda^L)$$
Where $0 < \lambda < 1$ controls the speed of convergence.

1. **Catalyst Core (Explosion Radius Boost - `sparkRadiusBoost`)**
   * *Formula:* $\text{RadiusMultiplier}(L) = 1.0 + 1.8 \times (1 - 0.78^L)$
   * *Ceiling:* Physical maximum size multiplier of $+180\%$ ($2.8\text{x}$ baseline).
   * *Base Cost:* $400$ shards. *Multiplier:* $1.8$x.

2. **Quantum Fuel Module (Magnet Sweep Fuel - `maxMagnetFuel`)**
   * *Formula:* $\text{FuelCap}(L) = 100 + 400 \times (1 - 0.85^L)$
   * *Ceiling:* $500$ fuel units.
   * *Base Cost:* $300$ shards. *Multiplier:* $1.7$x.

3. **Tractor Drive Pulse (Gravity Pull Strength - `magnetPower`)**
   * *Formula:* $\text{PullStrength}(L) = 1.0 + 3.0 \times (1 - 0.80^L)$
   * *Ceiling:* $4.0\text{x}$ base pull strength.
   * *Base Cost:* $250$ shards. *Multiplier:* $1.65$x.

4. **Resonance Sustain Core (Explosion Hold Time - `resonanceDuration`)**
   * *Formula:* $\text{HoldFrames}(L) = 120 + 240 \times (1 - 0.82^L)$
   * *Ceiling:* $360$ frames ($6.0$ seconds).
   * *Base Cost:* $300$ shards. *Multiplier:* $1.75$x.

### B. Discrete & Percentage Upgrades (Sensible Maximum Caps)
These stats increase linearly up to a logical limit (e.g., 100% chance or 10 sparks), after which their *costs* continue to scale exponentially as a prestige achievement sink, but their value remains capped at the max threshold.

1. **Cascade Spark Battery (Spark Retries - `extraSparks`)**
   * *Formula:* $\text{Sparks}(L) = 1 + L$, capped at a maximum of $8$ Sparks (Level 7).
   * *Base Cost:* $800$ shards. *Multiplier:* $3.5$x.

2. **Decay Neutralizer Shield (Absorb Probability - `decayResist`)**
   * *Formula:* $\text{AbsorbChance}(L) = 0.125 \times L$, capped at $100\%$ probability (Level 8).
   * *Base Cost:* $400$ shards. *Multiplier:* $1.85$x.

3. **Reactor Volatility (Special Particle Spawn Rate - `specialSpawnRate`)**
   * *Formula:* $\text{SpecialSpawnRate}(L) = 0.15 + 0.05 \times L$, capped at $65\%$ probability (Level 10).
   * *Base Cost:* $500$ shards. *Multiplier:* $2.0$x.

4. **Vortex Fuel Recycler (Autopilot Recharge Speed - `magnetAutopilot`)**
   * *Formula:* $\text{RechargeSpeed}(L) = 0.04 \times L$, capped at $0.40$ fuel units/frame (Level 10).
   * *Base Cost:* $400$ shards. *Multiplier:* $1.9$x.

5. **Combo Resonance Charger (Combo Shards Booster - `comboShardMultiplier`)**
   * *Formula:* $\text{BonusShardsPerHit}(L) = 4 \times L$ (Uncapped, scales linearly forever).
   * *Base Cost:* $300$ shards. *Multiplier:* $1.75$x.

---

## 2. Dynamic Exponential Difficulty Scaling

To encourage grinding and store interaction, game difficulty will escalate starting at Level 5:
* **Drift Velocities:** Scale exponentially: $\text{SpeedMultiplier} = 1.35 \times 1.18^{\max(0, \text{Level} - 5)}$
* **Drift Hitbox Radius:** Shrinks exponentially: $\text{RadiusMultiplier} = 1.0 \times 0.88^{\max(0, \text{Level} - 5)}$
* **Hazard Quantities:**
  * **Decay Cells:** Scaling percentage of drift count starting at Level 2: $15\% + 6\% \times (\text{Level} - 2)$, capped at $60\%$ of drift count.
  * **Void Anomalies:** Escalating counts starting at Level 3: $\min(6, \lfloor(\text{Level} - 1) / 2\rfloor)$.

*Result:* At Level 8+, standard drifting particles move so rapidly and have such tiny collision hitboxes that clearing 100% of them is practically impossible without high level upgrades in `sparkRadiusBoost` and `resonanceDuration` or multiple `extraSparks` retries.

---

## 3. Immersive Monetization UI/UX

When a user tries to purchase an upgrade they cannot afford, or when they experience a frustrating level failure, a highly engaging **Quantum Syndicate Monetization Overlay** will appear.

```
+-------------------------------------------------------+
|                    QUANTUM SYNDICATE                  |
|                   - CRITICAL DEPLETION -              |
|                                                       |
|   You require 850 ⚡ Shards for Catalyst Core Tier 4.  |
|                                                       |
|   [ WATCH VIDEO AD ]         [ BUY SHARD CACHE ]      |
|   +250 Shards immediately    Get instant Quantum Shards|
|                              to power up your engine!  |
|   * Simulated 5s video ad                              |
|                              [ MINI PACK: $0.99 ]      |
|                              [ CARGO CORE: $2.49 ]     |
|                              [ SINGULARITY: $4.99 ]    |
|                                                       |
| [ BACK TO LAB ]                                       |
+-------------------------------------------------------+
```

### Components of the Monetization Flow
1. **`<MonetizationModal />`:** A visually stunning React overlay featuring deep-space glow rings, alarm animations, a custom terminal display, and crisp sci-fi sound prompts.
2. **Interactive Video Ad Simulator:** 
   * Clicking "WATCH VIDEO AD" transitions the screen to a fullscreen, retro-themed terminal display: `[ DOWNLOADING HARVEST BEACON RELAY STATE ]`.
   * Features a visible **5-second interactive countdown timer** with beeping audio chimes on each second.
   * On completion, triggers a rewarding cash register sound effect, adds $+250$ shards to their balance, and drops a floating `+250 Shards!` message onto their screen.
3. **Simulated Shard Shop (In-App Purchases):**
   * Three themed packages:
     * **Mini Shard Pack (1,200 Shards for $0.99)**
     * **Quantum Cargo Core (3,500 Shards for $2.49)**
     * **Singularity Core Pack (10,000 Shards for $4.99)**
   * Clicking a pack pops open a sleek checkout card overlay: `[ PROCESSING TRANSACTION PROTOCOL... ]`.
   * Requires a 2-second authorization delay, displays a success tick, plays a premium chord chime, and updates their shard inventory.
4. **Decoupled Architecture (Production-Ready Integration):**
   To prepare the app for actual web/mobile ads (e.g., Google AdMob/GPT or Unity Ads) and actual transactions (e.g., Stripe/Apple Pay/Google Pay), all hooks will lead into modular callbacks in `App.tsx`:
   * `triggerRewardedAd(onRewardCallback)`
   * `processInAppPurchase(packId, onSuccessCallback)`
   These hooks are fully decoupled from UI presentation, permitting easy drops-ins of real SDK scripts in the future.

---

## 4. Engineering Verification Plan

### Automated Checks
* **TypeScript Integrity:** Run `npx tsc --noEmit` to verify type checker compliance.
* **Vite Static Build:** Confirm output compilation via `npm run build`.

### Manual Progression & Economy Playtest
1. **Verification of Infinite Costs:** Verify that as upgrades scale to Level 15+, costs grow exponentially to levels that demand simulated purchases.
2. **Soft-Capped Value Limits:** Confirm that continuous upgrade parameters (radius, gravity pull) remain stable and bounded on screen even at extremely high upgrade levels (e.g., Level 50+).
3. **Dynamic Difficulty Grinding:** Advance to Level 8 and verify the high particle speed and tiny hitboxes make completion extremely challenging without upgrades.
4. **Ad & Store Simulation Verification:** Trigger the monetization panel, complete a simulated video ad, and buy a Singularity pack to verify shard updates, countdown logic, and sound chimes.
