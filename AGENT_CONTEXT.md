# Chain Reaction — Agent Handover & Session Context

This context document is designed to get the next coding agent instantly up to speed on the React/Vite-based canvas game **Chain Reaction** and provide exact, actionable solutions for the two target bugs.

---

## 🎮 Project Architecture Overview

Chain Reaction is a single-screen hyper-casual web game built using the following stack:
1. **Frontend Core:** React, TypeScript, and Vite.
2. **Graphics & Rendering:** HTML5 Canvas API driven by a custom physics engine class (`GameEngine` in `src/lib/engine.ts`).
3. **Sound System:** Procedural Web Audio API synthesizer (`src/lib/audio.ts`) providing dynamic chord sweeps, perfect bonus arpeggios, near-miss warnings, and minor arpeggios.
4. **Styling:** Vanilla Tailwind CSS with vibrant neon-glow theme colors (STANDARD, NEBULA, MATRIX, SUPERNOVA).

### Key Files
* [App.tsx](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/App.tsx) — Main dashboard UI, dashboard screens (`'START'`, `'GAME'`, `'ROUND_OVER'`, `'SHOP'`), persistent states (localStorage for shards, high score, and upgrade tier progress), and slot-machine reactor rewards.
* [engine.ts](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/lib/engine.ts) — Physics engine running inside canvas animation loops. Handles drifting elements, splitter sparks, sweeper magnet gravity formulas, void anomaly collisions, and chain-reaction calculations.
* [audio.ts](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/lib/audio.ts) — Dynamic Web Audio synthesizer.

---

## ⚡ Summary of Recent Work Done

The game recently underwent a massive features, performance, and balancing overhaul:
1. **Difficulty/Progression Balancing:** Gifted starting shards were reduced to `30`, starting explosion radii shrunk by ~40%, and standard drifting particle hitboxes scaled down. Levels now require **100% all-clear** (liquidating all standard drift particles) to advance.
2. **Rendering Performance Optimization:** High CPU-overhead `shadowBlur` and `shadowColor` properties were replaced with procedurally painted semi-transparent glow rings. Debris particles now paint via fast `fillRect` rather than slow circles (`arc`). Grid spacing was optimized to keep rendering at a locked **60 FPS** even during massive chain reactions.
3. **Hazards & Shop Additions:**
   * **Void Singularities (`VOID_ANOMALY`):** Red/black swirling hazards spawning at level 3+ that pull atoms and instantly swallow active explosions.
   * **Resonance Sustain Core (`resonanceDuration`):** Extends active explosion lifetimes up to 3.0 seconds.
   * **Decay Neutralizer Shield (`decayResist`):** Grants a chance to bypass and absorb heavy Anti-Matter Decay Cells (turning them into green standard explosions with a popup).
   * **Combo Resonance Charger (`comboShardMultiplier`):** Boosts Shard yields on peak combo hits.
   * **Vortex Fuel Recycler (`magnetAutopilot`):** Trickle-recharges gravity herder magnet fuel slowly when inactive.
4. **Custom Defeat Audio:** Added `playDefeatSound()` which sounds a descending minor arpeggio when a round fails.

---

## 🎯 Target Bugs & Actionable Solutions

The user has reported two critical bugs from playtesting. Follow the plans below to resolve them:

### Bug 1: Upgrade Shop Level Regression
**Symptom:** Going into the Upgrade Shop and buying something returns the player to their previous level (effectively sending them "back" a level) rather than letting them proceed to the next unlocked level.

#### 🔍 Root Cause Analysis
1. When a player clears a level, they are shown the `'ROUND_OVER'` screen with the slot machine.
2. If they click **PROCEED TO LEVEL X**, the `startGame()` function is invoked:
   ```typescript
   if (screen === 'ROUND_OVER' && didWinLast) {
       setLevel(l => l + 1); // Advances level!
   }
   ```
3. However, if they instead click **ENTER UPGRADE SHOP** from `'ROUND_OVER'`, the screen transitions to `'SHOP'` (`setScreen('SHOP')`).
4. In [App.tsx line 702](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/App.tsx#L702), the Shop's BACK button is hardcoded to navigate to `'START'`:
   ```typescript
   onClick={() => setScreen('START')}
   ```
5. When the user is returned to the Start screen, clicking **START ENGINE** calls `startGame()` from a state of `screen === 'START'`. Because `screen` is not `'ROUND_OVER'`, the level increment logic `setLevel(l => l + 1)` is bypassed. The user is forced to replay the level they just cleared, sending them "back a level".

#### 🛠️ Recommended Fix
Introduce a referrer memory state to allow the shop to return to the screen the player came from:
1. In `src/App.tsx`, declare a new state variable:
   ```typescript
   const [shopReferrer, setShopReferrer] = useState<Screen>('START');
   ```
2. When navigating to `'SHOP'` from `'START'`, capture the origin:
   ```typescript
   onClick={() => {
       setShopReferrer('START');
       setScreen('SHOP');
   }}
   ```
3. When navigating to `'SHOP'` from `'ROUND_OVER'`, capture the origin:
   ```typescript
   onClick={() => {
       setShopReferrer('ROUND_OVER');
       setScreen('SHOP');
   }}
   ```
4. Update the Shop's BACK button to return to the referrer:
   ```typescript
   onClick={() => setScreen(shopReferrer)}
   ```
   *This returns the player to `'ROUND_OVER'`, allowing them to see their score/slot machine results and correctly proceed to the next level.*

---

### Bug 2: Inconsistent Cleared/Goal Math
**Symptom:** Converted Anti-Matter Decay Cells (via `decayResist` upgrades) increment the cleared count, causing the counter to exceed the total standard drifting particles (e.g. displaying `72/53` on the HUD) and prematurely triggering level victory while standard particles are still visible.

#### 🔍 Root Cause Analysis
1. In `startLevel()`, standard drifting particles are spawned and increment `this.totalDrifting`. Heavy **Anti-Matter Decay Cells** are spawned *in addition* to standard particles and do not count towards `this.totalDrifting`.
2. When the kinetic shield bypasses a Decay cell, the engine converts it into a standard expanding explosion.
3. However, inside both conversion bypass blocks in `src/lib/engine.ts` (Splitter spark hits and standard explosion hits), `this.cleared++` is explicitly invoked:
   * **Splitter Sparks Bypass [engine.ts line 667](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/lib/engine.ts#L667):**
     ```typescript
     this.cleared++; // <-- BUG: Increments clear requirements counter for extra/decay particles!
     this.combo++;
     ```
   * **Standard Explosions Bypass [engine.ts line 747](file:///C:/Users/David%20Glasser/antigravity/Chain-Reaction/src/lib/engine.ts#L747):**
     ```typescript
     p1.type = 'STANDARD';
     p1.state = 'EXPANDING';
     ...
     this.cleared++; // <-- BUG: Increments clear requirements counter for extra/decay particles!
     this.combo++;
     ```
4. Because decay cells are *not* part of `this.totalDrifting`, incrementing `this.cleared` when a decay cell explodes pushes `this.cleared` beyond the total drift goal. This results in broken metrics (e.g. `72 / 53` particles) and satisfies the level completion check (`this.cleared >= this.totalDrifting`) prematurely while standard drifting particles are still moving around on screen.

#### 🛠️ Recommended Fix
1. **Remove `this.cleared++`** from both `decayResist` bypass code blocks in `src/lib/engine.ts` (Line `667` and Line `747`).
   *This ensures converted decay cells generate chain-reaction cascades and increase combos/shards, but **do not** satisfy the standard cell clearance goal requirements.*
2. **Defensive Capping in `getStats()` (Optional safety):**
   In `src/lib/engine.ts`, make sure the reported stats cap `cleared` at the total drifting particles count to prevent display formatting issues:
   ```typescript
   cleared: Math.min(this.totalDrifting, this.cleared),
   ```

---

## 🚦 Next Agent Action Plan

For the incoming agent, please execute the following systematic checklist:

### Phase 1: Implement Fixes
- [ ] Add `shopReferrer` state in `src/App.tsx`.
- [ ] Wire up all `setScreen('SHOP')` calls to record the previous screen state.
- [ ] Replace the hardcoded `setScreen('START')` back button on the Shop screen with `setScreen(shopReferrer)`.
- [ ] Remove `this.cleared++;` from the two kinetic shield bypass blocks in `src/lib/engine.ts`.
- [ ] Add a `Math.min(this.totalDrifting, this.cleared)` cap to `cleared` in `getStats()`.

### Phase 2: Verification
- [ ] Verify that there are zero TypeScript compiler issues by running `npx tsc --noEmit`.
- [ ] Confirm the Vite development server is running correctly (typically `npm run dev` on port `3000`).
- [ ] **Manual Playtest:**
  1. Complete Level 1.
  2. On `'ROUND_OVER'`, enter the Shop.
  3. Buy an upgrade or leave immediately. Click **BACK**.
  4. Verify you are back on `'ROUND_OVER'` showing your completed Level 1 stats.
  5. Click **PROCEED TO LEVEL 2** and verify you correctly start Level 2 instead of repeating Level 1.
  6. Acquire the `decayResist` shield upgrade.
  7. Start a level, collide with a decay cell to trigger the green "SHIELDED!" conversion, and confirm that the HUD cleared count does **not** inflate or exceed the denominator (e.g. stays under the total drifting count) and that the round only ends when all standard atoms are cleared.

Good luck! 💥
