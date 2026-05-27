# Instability Expansion — Quantum Pulsars & Progress Scanner Implementation Plan

> **For Claude / Developer:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a balanced menu return path to the post-round screen, introduce a slow-moving pulsating EM shockwave hazard (Quantum Pulsar) at Sector 20+ that repels atoms and collapses overlapping explosions, and integrate a high-fidelity mystery anomaly unlock scanner on the Start screen dashboard.

**Architecture:**
1. **Menu Return Interface:** Add `returnToMainMenu` handler inside `src/App.tsx` which increments the level if the round was won (preserving progress), and transitions the screen back to `'START'`. Hook this up to a custom-designed `🏠 RETURN TO MAIN MENU` button.
2. **Quantum Pulsar Hazard:** Expand the `'ParticleType'` union inside `src/lib/engine.ts` to support `'PULSAR'`. Spawn them at levels 20+ with a custom EM cycle timer. Update the physics update loop to calculate expanding shockwave radius and apply impulse forces to standard particles while triggering collapse state transitions on overlapping explosive rings. Render them on the canvas with custom concentric warning gradients and expanding alpha-fade pulse lines.
3. **Mystery Anomaly Scanner:** Render a futuristic glassmorphism progression track below dashboard controls inside `src/App.tsx` start menu that scans for milestone hazard unlocks at Sectors 2, 3, 20, and 35. Mask locked anomalies with secret classification labels and locks to preserve the progression mystery.

**Tech Stack:** React 19, TypeScript, HTML5 Canvas API, Tailwind CSS, Lucide Icons.

---

## Proposed Changes

### Task 1: Navigation & Post-Round Menu Return

**Files:**
* Modify: [src/App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx) — Add menu return handler and render the navigation button on post-round screens.

#### Step 1.1: Add the Return To Main Menu handler
* In `src/App.tsx`, near `startGame` (line 889), add the `returnToMainMenu` function:
```typescript
    const returnToMainMenu = () => {
        initAudio(); // Initialize audio securely
        if (screen === 'ROUND_OVER' && didWinLast) {
            setLevel(l => l + 1);
        }
        setScreen('START');
    };
```

#### Step 1.2: Add the Menu Return Button on the standard Round Over screen
* In `src/App.tsx` (around lines 2184-2193), inside the standard round over buttons wrapper:
```diff
                                    <button 
                                        onClick={startGame}
                                        disabled={didWinLast && !slotHasSpun}
                                        className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all outline-none ${
                                            didWinLast && !slotHasSpun
                                                ? 'bg-zinc-800 text-zinc-655 border border-zinc-750 cursor-not-allowed shadow-none'
                                                : 'bg-white text-black hover:scale-103 active:scale-97 cursor-pointer shadow-[0_0_20px_rgba(255,255,255,0.15)]'
                                        }`}
                                    >
                                        {didWinLast ? (
                                            !slotHasSpun ? (
                                                <>
                                                    Locked: Resonate Core Fusers ⚡
                                                </>
                                            ) : (
                                                <>
                                                    <Play className="w-5 h-5 fill-black text-black" /> PROCEED TO LEVEL {level + 1}
                                                </>
                                            )
                                        ) : (
                                            <>
                                                <RotateCcw className="w-5 h-5 text-black" /> RE-ENGAGE SEQUENCE
                                            </>
                                        )}
                                    </button>
+
+                                    <button 
+                                        onClick={returnToMainMenu}
+                                        disabled={didWinLast && !slotHasSpun}
+                                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
+                                            didWinLast && !slotHasSpun
+                                                ? 'bg-zinc-900 text-zinc-600 border-zinc-850 cursor-not-allowed shadow-none'
+                                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 active:scale-95'
+                                        }`}
+                                    >
+                                        🏠 RETURN TO MAIN MENU
+                                    </button>
```

#### Step 1.3: Run TypeScript verify to check syntax compile correctness
* Run: `npx tsc --noEmit`
* Expected: PASS (no type errors in `App.tsx`)

---

### Task 2: Quantum Pulsar Engine Core & Math

**Files:**
* Modify: [src/lib/engine.ts](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/lib/engine.ts) — Add `'PULSAR'` type, config spawning, dynamic EM physics, and visual rendering.

#### Step 2.1: Expand ParticleType type and THEME_COLORS exclusions
* Modify the `ParticleType` type definition (around line 4):
```typescript
export type ParticleType = 'STANDARD' | 'GRAVITY' | 'SPLITTER' | 'DECAY' | 'VOID_ANOMALY' | 'DAMPENER' | 'SINKHOLE' | 'PULSAR';
```
* Update the `THEME_COLORS` signature and type assert exclusions (around line 68 & line 280) to include `'PULSAR'`:
```typescript
export const THEME_COLORS: Record<ParticleTheme, Record<Exclude<ParticleType, 'VOID_ANOMALY' | 'DAMPENER' | 'SINKHOLE' | 'PULSAR'>, string[]>> = {
```
* And inside `startLevel` selection colors resolving:
```typescript
            const selectionColors = currentThemeColors[pType as Exclude<ParticleType, 'VOID_ANOMALY' | 'DAMPENER' | 'SINKHOLE' | 'PULSAR'>] || THEME_COLORS.STANDARD[pType as Exclude<ParticleType, 'VOID_ANOMALY' | 'DAMPENER' | 'SINKHOLE' | 'PULSAR'>];
```

#### Step 2.2: Add Pulsar spawning code
* In `startLevel` method of `src/lib/engine.ts` (around lines 360-372), append the spawn check for levels >= 20:
```typescript
        // 6. Spawn Quantum Pulsars at level 20+ (1 to 3 pulsars)
        const pulsarCount = level < 20 ? 0 : Math.min(3, 1 + Math.floor((level - 20) / 8));
        for (let i = 0; i < pulsarCount; i++) {
            this.particles.push({
                x: Math.random() * (this.width - 100) + 50,
                y: Math.random() * (this.height - 100) + 50,
                vx: (Math.random() - 0.5) * speedScale * 0.25,
                vy: (Math.random() - 0.5) * speedScale * 0.25,
                radius: 12.0 * radiusScale,
                maxRadius: 0, // Cannot explode
                color: '#f97316', // Orange warning theme
                state: 'DRIFTING',
                type: 'PULSAR',
                timer: Math.floor(Math.random() * 120) // Randomize starting timer offsets
            });
        }
```

#### Step 2.3: Implement Pulsar EM shockwave physics update
* In the `update` method of `src/lib/engine.ts`, append the update phase logic:
  * Counts down `p.timer`. If `p.timer <= 0`, resets it to a cycle duration of `220`.
  * During the active phase (timer between `0` and `40`), calculate the expanding wave radius.
  * Sweep standard atoms inside the wave front and apply outward vector impulse.
  * Sweep active explosions inside the wave and collapse them immediately.
  * Sweep detonator sparks and swallow them if inside the pulsar's core horizon (`30px`).
```typescript
        // --- QUANTUM PULSAR INSTABILITY WAVES ---
        const activeExplodingCores = this.particles.filter(p => 
            p.state === 'EXPANDING' || p.state === 'FROZEN' || p.state === 'SHRINKING'
        );

        for (let p of this.particles) {
            if (p.type === 'PULSAR') {
                p.timer--;
                if (p.timer <= 0) {
                    p.timer = 220; // 3.6s cycle
                }

                // Active shockwave expansion phase (first 40 frames of countdown)
                if (p.timer > 180) {
                    const elapsed = 220 - p.timer; // 1 to 40
                    const waveRadius = 120 * (elapsed / 40);

                    // 1. Repel standard drifting atoms hit by wavefront
                    for (let other of this.particles) {
                        if (other === p || other.state !== 'DRIFTING' || other.type === 'PULSAR') continue;
                        const dx = other.x - p.x;
                        const dy = other.y - p.y;
                        const distSq = dx*dx + dy*dy;
                        const dist = Math.sqrt(distSq || 1);

                        // Repel if close to active expanding shockwave wavefront
                        if (Math.abs(dist - waveRadius) < 16) {
                            const force = 3.8;
                            other.vx += (dx / dist) * force;
                            other.vy += (dy / dist) * force;
                        }
                    }

                    // 2. Collapse active explosion rings caught inside expanding shockwave
                    for (let exp of activeExplodingCores) {
                        const dx = exp.x - p.x;
                        const dy = exp.y - p.y;
                        const distSq = dx*dx + dy*dy;
                        if (distSq < waveRadius * waveRadius) {
                            if (exp.state !== 'SHRINKING') {
                                exp.state = 'SHRINKING';
                                exp.timer = 0;
                                exp.radius = Math.max(1.0, exp.radius * 0.15); // Instant 15% collapse
                                
                                this.texts.push({
                                    x: exp.x,
                                    y: exp.y - 12,
                                    text: '⚠️ DAMPENED!',
                                    life: 0.8,
                                    color: '#f97316'
                                });
                            }
                        }
                    }
                }

                // 3. Swallow detonator sparks dropped inside event horizon (30px)
                for (let other of this.particles) {
                    if (other.type === 'SINKHOLE' || other.type === 'DAMPENER' || other.type === 'VOID_ANOMALY' || other.type === 'PULSAR') continue;
                    // Spark in active trigger expansion stage
                    if (other.state === 'EXPANDING' && other.radius < 8) {
                        const dx = other.x - p.x;
                        const dy = other.y - p.y;
                        if (dx*dx + dy*dy < 30 * 30) {
                            other.state = 'DEAD';
                            this.texts.push({
                                x: other.x,
                                y: other.y - 15,
                                text: "💥 SPARK VAPORIZED!",
                                life: 1.2,
                                color: "#f97316"
                            });
                        }
                    }
                }
            }
        }
```

#### Step 2.4: Handle exclusions and hazard bypass logic for Pulsars
* In `src/lib/engine.ts` around line 824 and 905, exclude `'PULSAR'` from absorbing splitter sparks or normal detonations:
```typescript
// Splitter spark checks
if (p.type === 'DAMPENER' || p.type === 'SINKHOLE' || p.type === 'PULSAR') {
```
* And inside `normal collision checks` (around line 905):
```typescript
if (p1.type === 'DAMPENER' || p1.type === 'SINKHOLE' || p1.type === 'PULSAR') continue; // Hazards cannot explode
```

#### Step 2.5: Implement Pulsar drawing canvas visual sweeps
* In the `draw` method of `src/lib/engine.ts` (around lines 1311-1312), append rendering instructions for `'PULSAR'`:
```typescript
            // Render Quantum Pulsar
            if (p.type === 'PULSAR') {
                ctx.save();
                
                // Concentric warning rings
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 2.2, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(249, 115, 22, 0.12)';
                ctx.fill();

                // Draw expanding EM shockwave
                if (p.timer > 180) {
                    const elapsed = 220 - p.timer;
                    const waveRadius = 120 * (elapsed / 40);
                    const alpha = 1.0 - (elapsed / 40);

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, waveRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.75})`;
                    ctx.lineWidth = 3.5;
                    ctx.stroke();

                    ctx.beginPath();
                    ctx.arc(p.x, p.y, waveRadius, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(255, 255, 255, ${alpha * 0.4})`;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                }

                // Swirling charging ring indicators
                ctx.translate(p.x, p.y);
                ctx.rotate(this.orbitAngle * 2.0);
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.4, 0, Math.PI * 0.6);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.stroke();
                
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 1.4, Math.PI, Math.PI * 1.6);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2;
                ctx.stroke();

                ctx.restore();

                // Solid dark core surrounded by neon-orange boundary
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.85, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.85, 0, Math.PI * 2);
                ctx.strokeStyle = '#f97316';
                ctx.lineWidth = 2.0;
                ctx.stroke();

                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.35, 0, Math.PI * 2);
                ctx.fillStyle = '#ffffff';
                ctx.fill();

                ctx.restore();
                continue;
            }
```

#### Step 2.6: Run TypeScript verify to check compile completeness
* Run: `npx tsc --noEmit`
* Expected: PASS (no type errors in `engine.ts`)

---

### Task 3: Dashboard Anomaly Unlock Progress Scanner

**Files:**
* Modify: [src/App.tsx](file:///c:/Users/David%20Glasser/OneDrive/Documents/Projects/Chain%20Reaction/src/App.tsx) — Add the `Reactor Anomaly Scanner` interface and style with sleek high-fidelity neon borders.

#### Step 3.1: Add the Anomaly Scanner to the Start Screen dashboard
* In `src/App.tsx` (around lines 1231-1242), inside `screen === 'START'` block right below the buttons container (and before the record standing banner):
```diff
                        <div className="space-y-3 w-full mb-8">
                            <button 
                                onClick={startGame}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-black text-black" />
                                START ENGINE
                            </button>
                            
                            ...
                            
                            <button 
                                onClick={() => setShowHelp(!showHelp)}
                                className="w-full bg-[#16161a] border border-zinc-800 text-zinc-300 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-98 transition-all cursor-pointer"
                            >
                                <HelpCircle className="w-4 h-4" />
                                {showHelp ? 'HIDE SCI-OPS MANUAL' : 'VIEW SCI-OPS MANUAL'}
                            </button>
                        </div>
+
+                        {/* REACTOR ANOMALY PROGRESS TRACKER */}
+                        <div className="w-full bg-[#111114]/90 border border-zinc-900 rounded-2xl p-4 text-left space-y-3 mb-6 select-none font-sans max-w-[400px]">
+                            <div className="flex items-center justify-between">
+                                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 font-mono">
+                                    <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse animate-duration-2000" /> REACTOR ANOMALY SCANNER
+                                </span>
+                                <span className="text-[9px] font-mono text-zinc-500 uppercase">Sector {level}</span>
+                            </div>
+                            
+                            <div className="space-y-2">
+                                {/* Progress bar track */}
+                                <div className="relative w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
+                                    <div 
+                                        className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all duration-500"
+                                        style={{ width: `${Math.min(100, Math.max(5, (level / 35) * 100))}%` }}
+                                    />
+                                </div>
+                                
+                                {/* Hazard Nodes Grid */}
+                                <div className="grid grid-cols-4 gap-1.5 pt-1.5">
+                                    {[
+                                        { lvl: 2, icon: '🧬', name: 'Decay Cell', desc: 'Resists herding and snuffs out active explosions.' },
+                                        { lvl: 3, icon: '🌪️', name: 'Void Anomaly', desc: 'Pulls atoms in and swallows detonator sparks.' },
+                                        { lvl: 20, icon: '💥', name: 'Quantum Pulsar', desc: 'Pulsates EM disruption to repel particles and damp explosions.' },
+                                        { lvl: 35, icon: '⚛️', name: 'Resonance Dampener', desc: 'Magenta collapsing nodes & gravity event horizons.' }
+                                    ].map((hz) => {
+                                        const unlocked = level >= hz.lvl;
+                                        return (
+                                            <div 
+                                                key={hz.lvl}
+                                                title={unlocked ? hz.desc : `Classified anomaly signature detected. Unlock requirements: Sector ${hz.lvl}`}
+                                                className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${
+                                                    unlocked 
+                                                        ? 'bg-zinc-900/20 border-cyan-500/20 text-zinc-300 shadow-[0_0_8px_rgba(34,211,238,0.02)]' 
+                                                        : 'bg-black/20 border-zinc-900/60 text-zinc-600'
+                                                }`}
+                                            >
+                                                <span className={`text-sm mb-1 select-none transition-transform duration-300 hover:scale-110 ${unlocked ? 'filter drop-shadow-[0_0_4px_rgba(34,211,238,0.35)]' : 'opacity-25 grayscale'}`}>
+                                                    {unlocked ? hz.icon : '🔒'}
+                                                </span>
+                                                <span className={`block text-[7px] font-mono font-black uppercase tracking-wider leading-none ${unlocked ? 'text-zinc-400' : 'text-zinc-650'}`}>
+                                                    SEC {hz.lvl}
+                                                </span>
+                                                <span className={`block text-[8px] font-black leading-tight truncate w-full mt-1.5 uppercase tracking-wide font-sans ${unlocked ? 'text-cyan-400' : 'text-zinc-600 font-bold'}`}>
+                                                    {unlocked ? hz.name.split(' ')[0] : 'SECRET'}
+                                                </span>
+                                            </div>
+                                        );
+                                    })}
+                                </div>
+                            </div>
+                        </div>
```

#### Step 3.2: Verify compile compliance
* Run: `npx tsc --noEmit`
* Expected: PASS (no type errors in `App.tsx`)

---

## Verification Plan

### Automated Tests
* Execute TypeScript verify script: `npx tsc --noEmit`
* Compile production static bundle: `npm run build`

### Manual Verification
* Boot dev server: `npm run dev`
* Clear tutorial, run and complete level 1. Verify `🏠 RETURN TO MAIN MENU` button appears and is disabled until reward slot spins.
* Verify clicking `🏠 RETURN TO MAIN MENU` properly increments level to Sector 2 and transitions back to Start screen.
* Verify the mystery Anomaly Scanner on Start screen updates, revealing "Decay Cell" (Level 2) and "Void Anomaly" (Level 3) but keeping Level 20 and Level 35 locked/secret.
* Mock `level = 20` in localStorage and verify the "Quantum Pulsar" is unlocked on the scanner dashboard, and that the canvas spawns a pulsing orange core that forcefully pushes particles and dampens active chain reactions.
