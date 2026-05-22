# Infinite Progression & Monetization Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Transform Chain Reaction into an engaging freemium model with infinite upgrade scaling, dynamic exponential difficulty, and high-fidelity simulated rewarded ads and shard purchases.

**Architecture:** Replace static upgrade levels with deterministic mathematical cost and value formulas (using asymptotic curves to avoid UI breakage at infinite tiers). Introduce an interactive `<MonetizationModal />` React overlay triggered by purchase shortages and round failures. Implement exponential difficulty scaling starting at level 5.

**Tech Stack:** React, TypeScript, Vite, HTML5 Canvas API, and Web Audio API.

---

## Proposed Changes

### Component 1: Mathematical Upgrades & Diminishing Returns

#### [MODIFY] [engine.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/engine.ts)
* Modify the `StoreUpgrades` interface and properties to support infinite level increments.
* Replace static upgrade lookups with mathematical functions for:
  * Spark Radius Boost (Asymptotic soft-cap: $\text{RadiusMultiplier}(L) = 1.0 + 1.8 \times (1 - 0.78^L)$)
  * Magnet Fuel Capacity (Asymptotic soft-cap: $\text{FuelCap}(L) = 100 + 400 \times (1 - 0.85^L)$)
  * Magnet Pull Power (Asymptotic soft-cap: $\text{PullStrength}(L) = 1.0 + 3.0 \times (1 - 0.80^L)$)
  * Resonance Duration (Asymptotic soft-cap: $\text{HoldFrames}(L) = 120 + 240 \times (1 - 0.82^L)$)
  * Extra Sparks (Linear cap: $1 + L$, max 8)
  * Decay Resist (Linear cap: $0.125 \times L$, max 100%)
  * Special Spawn Rate (Linear cap: $0.15 + 0.05 \times L$, max 65%)
  * Magnet Autopilot (Linear cap: $0.04 \times L$, max 0.40 fuel/frame)
  * Combo Multiplier (Linear uncapped: $4 \times L$)

#### [MODIFY] [App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx)
* Replace the hardcoded `SHOP_ITEMS` array configuration.
* Create cost formulas: $\text{Cost}(L) = \text{BaseCost} \times \text{Multiplier}^L$.
* Update upgrade purchasing logic to dynamically calculate the cost of the next tier and show current values.

---

### Component 2: Dynamic Exponential Difficulty

#### [MODIFY] [engine.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/engine.ts)
* In `startLevel()`, scale drifting particle velocity exponentially starting at Level 5: $\times 1.18^{\max(0, \text{Level} - 5)}$.
* Shrink particle radius exponentially starting at Level 5: $\times 0.88^{\max(0, \text{Level} - 5)}$.
* Scale Anti-Matter Decay Cell spawns and Void Anomaly counts starting at Level 5 for high hazard density.

---

### Component 3: Premium Simulated Monetization Modal

#### [MODIFY] [App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx)
* Implement a highly polished neon-themed `<MonetizationModal />` React component.
* Create dynamic state triggers in the purchase button and game-over retry loop: if `shards < requiredCost`, open the monetization panel.
* Add simulated IAP packs: Mini ($0.99, +1.2k shards), Cargo ($2.49, +3.5k shards), and Singularity ($4.99, +10k shards), with a 2-second mock credit card processing delay.
* Add simulated rewarded ad: fullscreen 5-second countdown with custom audio tones, awarding $+250$ shards on completion.
* Modularize hooks (`triggerRewardedAd()`, `processInAppPurchase()`) for seamless production ad SDK swap-outs.

---

## Detailed Task Breakdown

### Task 1: Mathematical Upgrades Implementation
**Files:**
* Modify: `src/lib/engine.ts`
* Modify: `src/App.tsx`

**Step 1: Write Formula Handlers in engine.ts**
Open `src/lib/engine.ts` and modify the stats translation blocks to use the soft-cap/capped equations described above.
```typescript
// Replace lines 219-227 in engine.ts:
this.maxMagnetFuel = 100 + 400 * (1 - Math.pow(0.85, this.upgrades.maxMagnetFuel || 0));
this.magnetFuel = this.maxMagnetFuel;

const durationLvl = this.upgrades.resonanceDuration || 0;
this.freezeDuration = Math.round(120 + 240 * (1 - Math.pow(0.82, durationLvl)));
```
**Step 2: Update App.tsx Dynamic Costs and Labels**
Refactor the store items renderer to calculate costs dynamically and display dynamic labels.
**Step 3: Verification**
Run `npx tsc --noEmit` to verify zero compiler errors.
**Step 4: Commit**
```bash
git add src/lib/engine.ts src/App.tsx
git commit -m "feat: implement mathematical upgrades Cost & Value scaling"
```

---

### Task 2: Dynamic Exponential Difficulty Scaling
**Files:**
* Modify: `src/lib/engine.ts`

**Step 1: Write exponential scaling inside startLevel()**
Update velocity and radius scaling math inside `startLevel()` in `src/lib/engine.ts` starting at level 5:
```typescript
const speedScale = (1.45 + Math.min(2.4, (level - 1) * 0.22)) * Math.pow(1.18, Math.max(0, level - 5));
const radiusScale = Math.max(0.25, Math.pow(0.88, Math.max(0, level - 5)));
```
**Step 2: Increase Decay Cell and Void Anomaly density**
Scale spawns aggressively as level advances to level 5+.
**Step 3: Verification**
Run `npx tsc --noEmit` to verify type safety.
**Step 4: Commit**
```bash
git add src/lib/engine.ts
git commit -m "feat: add exponential difficulty scaling and high hazard spawns"
```

---

### Task 3: Interactive Monetization Modal Overlay
**Files:**
* Modify: `src/App.tsx`

**Step 1: Implement `<MonetizationModal />` UI component**
Create the premium glassmorphism overlay with simulated Checkout screens and fullscreen 5-second ad countdowns.
**Step 2: Hook shard shortages and failure retries to the modal**
If they fail to buy an upgrade or lose a level, show the option to trigger ads/IAP.
**Step 3: Verification**
Run `npx tsc --noEmit` and `npm run build` to confirm static compiling is successful.
**Step 4: Commit**
```bash
git add src/App.tsx
git commit -m "feat: implement premium simulated monetization modal and ad countdowns"
```

---

## Verification Plan

### Automated Tests
* Run TypeScript syntax validator:
  `npx tsc --noEmit`
* Build and package production bundle:
  `npm run build`

### Manual Verification
1. Open the Upgrade Store and confirm that costs increase exponentially (e.g. purchasing tier 8 demands thousands of shards).
2. Confirm that explosion radius and magnet fuel increase smoothly and never leak off the active screen frame.
3. Advance to Level 8+ to confirm particles are moving extremely rapidly and have tiny hitboxes, creating a strong grind demand.
4. Try to buy an upgrade you cannot afford to trigger the Monetization modal. Watch a simulated ad and buy a mock pack to confirm inventory increases and chimes play correctly.
