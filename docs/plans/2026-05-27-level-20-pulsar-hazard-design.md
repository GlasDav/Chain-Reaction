# Reactor Instability & Progress Tracking - Level 20 Pulsar Hazard Design

This design document outlines the technical specification for adding a new high-instability hazard at Sector 20, providing a sleek "Reactor Anomaly Scanner" progression tracker on the dashboard Start screen, and introducing a balanced "Return to Main Menu" button on the post-round screen.

---

## 1. Post-Round Menu Navigation

### Goal
Allow players to navigate back to the main menu from the post-round screen while respecting the shard-multiplier slot machine loop.

### Specification
* **Menu Return Button:** A new button `🏠 RETURN TO MAIN MENU` will be added to the post-round action list in `App.tsx`.
* **State Updates:**
  * To maintain the game's reward loop, if the user cleared the level (`didWinLast === true`), the button is **disabled** until the slot machine fuser has spun (`slotHasSpun === true`), matching the behavior of the `PROCEED TO LEVEL X` button.
  * If the user failed the level (`didWinLast === false`), the button is enabled immediately.
  * When clicked, if `didWinLast` is true, the active level is incremented (`setLevel(l => l + 1)`), persisting their victory.
  * The active screen state transitions back to the dashboard (`setScreen('START')`).

---

## 2. Sector 20 Hazard: Quantum Pulsar (`PULSAR`)

### Goal
Counter the high-particle density at Level 20+ that makes chain reactions trivial to sustain. The Quantum Pulsar introduces active electromagnetic disruption that disperses clusters of drifting particles and dampens overlapping explosion fields.

### Physics & Behavior Specs
* **Unlock Milestone:** Spawns at **Sector 20+**.
* **Spawn Frequency:** Spawns `1` pulsar at Level 20, scaling up to `Math.min(3, 1 + Math.floor((level - 20) / 8))` at higher sectors.
* **Movement:** Drifts very slowly across the canvas, rebounding off screen borders at `25%` of standard particle velocity.
* **EM Pulse Cycle:**
  * Runs on a cycle of `220 frames` (~3.6 seconds).
  * Pulsars spawn with a randomized initial timer offset (`p.timer = Math.floor(Math.random() * 100)`) so they do not pulse simultaneously.
  * **Charging Phase (`timer > 40`):** The pulsar core slowly pulses with a glowing orange warning light.
  * **Active Pulse Phase (`timer` counts down from `40` to `0`):** An expanding shockwave ring spreads outward from the core to a maximum radius of `120px`.
  * **Wave Radius Formula:** 
    $$\text{WaveRadius} = 120 \times \left(1 - \frac{T}{40}\right)$$
    *(where $T$ is the current countdown frame from 40 to 0)*
* **Force Fields & Interactions:**
  1. **Shockwave Particle Repulsion:** Any drifting particle (standard, gravity, splitter, or decay) caught in the shockwave is forcefully repelled outward away from the pulsar core.
     * *Force Application:* If the particle distance $d$ from the pulsar core is close to the expanding wave front ($|d - \text{WaveRadius}| < 15$), we apply an outward vector impulse:
       $$\vec{v}_{new} = \vec{v}_{old} + \frac{\vec{u}_{diff}}{d} \times F_{impulse}$$
       *(where $F_{impulse} = 3.8$)*
  2. **Active Explosion Collapse:** Any active chain-reaction explosion (state: `'EXPANDING'`, `'FROZEN'`, or `'SHRINKING'`) overlapped by the expanding pulse is collapsed immediately:
     * State set to `'SHRINKING'`.
     * Explosion timer set to `0`.
     * Radius collapsed to $15\%$ of its max expansion size.
  3. **Detonator Spark Absorption:** Detonator sparks dropped inside a pulsar's event horizon (`30px` core radius) are swallowed and neutralized instantly (matching Gravity Sinkhole behavior).

### Visual Rendering
* **Core Style:** High-contrast warning-orange radial gradient with a dark, dense inner singularity core, surrounded by glowing orbital dashed rings.
* **Active Shockwave:** An expanding concentric orange ring drawn with a fading opacity profile:
  $$\text{Opacity} = 1.0 - \left(1.0 - \frac{T}{40}\right)$$
  Synthesizes highly accelerated, GPU-friendly rendering inside the Canvas context.

---

## 3. Dashboard "Reactor Anomaly Scanner"

### Goal
Provide a premium progress scanner showing completed hazard milestones and teasing upcoming classifications as locked secrets.

### Specification
* **Dashboard Component:** Rendered on the `START` screen in `App.tsx` below the action buttons.
* **Visual Theme:** A high-tech diagnostic grid card styled with dark glassmorphism and thin neon-cyan borders (`border-cyan-500/20`).
* **Progress Track:** A horizontal diagnostic bar showing sector milestones at Levels 2, 3, 20, and 35.
* **Mystery Lock Pacing:**
  * **Sector 2:** Unlocks `🧬 Anti-Matter Cell` (if level >= 2, else `🔒 CLASSIFIED ANOMALY`)
  * **Sector 3:** Unlocks `🌪️ Void Singularity` (if level >= 3, else `🔒 CLASSIFIED ANOMALY`)
  * **Sector 20:** Unlocks `💥 Quantum Pulsar` (if level >= 20, else `🔒 CLASSIFIED ANOMALY`)
  * **Sector 35:** Unlocks `⚛️ Resonance Dampeners & Sinkholes` (if level >= 35, else `🔒 CLASSIFIED ANOMALY`)
* **Locked Hover/Details:** Displays classification status and target sector requirements, maintaining mystery and offering clear progression goals.
