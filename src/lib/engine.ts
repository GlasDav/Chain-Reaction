import { playDetonate } from './audio';

export type ParticleState = 'DRIFTING' | 'EXPANDING' | 'FROZEN' | 'SHRINKING' | 'DEAD';
export type ParticleType = 'STANDARD' | 'GRAVITY' | 'SPLITTER' | 'DECAY' | 'VOID_ANOMALY';
export type ParticleTheme = 'STANDARD' | 'NEBULA' | 'MATRIX' | 'SUPERNOVA';

export interface StoreUpgrades {
    extraSparks: number; // lvl 0, 1, 2 (meaning 1, 2, or 3 sparks)
    maxMagnetFuel: number; // lvl 0, 1, 2, 3 (meaning 100, 140, 180, 220 fuel)
    magnetPower: number; // lvl 0, 1, 2, 3 (meaning 1.0x, 1.4x, 1.8x, 2.2x pull strength)
    sparkRadiusBoost: number; // lvl 0, 1, 2, 3 (meaning +0%, +15%, +30%, +45% radius)
    specialSpawnRate: number; // lvl 0, 1, 2 (meaning base 15%, 20%, 25% special spaswn chance)
    resonanceDuration?: number; // lvl 0, 1, 2, 3
    decayResist?: number; // lvl 0, 1, 2, 3
    comboShardMultiplier?: number; // lvl 0, 1, 2, 3
    magnetAutopilot?: number; // lvl 0, 1, 2, 3
}

export interface Particle {
    x: number;
    y: number;
    vx: number;
    vy: number;
    radius: number;
    maxRadius: number;
    color: string;
    state: ParticleState;
    type: ParticleType;
    timer: number;
}

export interface Debris {
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

export interface FloatingText {
    x: number;
    y: number;
    text: string;
    life: number;
    color: string;
}

export interface SplitterSpark {
    id: number;
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
    color: string;
}

// Highly vibrant theme color variations: Standard, Nebula, Matrix, Supernova
export const THEME_COLORS: Record<ParticleTheme, Record<Exclude<ParticleType, 'VOID_ANOMALY'>, string[]>> = {
    STANDARD: {
        STANDARD: ['#22d3ee', '#fb7185', '#a3e635'],
        GRAVITY: ['#e879f9'],
        SPLITTER: ['#facc15'],
        DECAY: ['#ef4444', '#f43f5e']
    },
    NEBULA: {
        STANDARD: ['#f472b6', '#a855f7', '#ec4899'], // Rose, Violet, Intense Pink
        GRAVITY: ['#3b82f6'], // Cyan cosmic center
        SPLITTER: ['#f43f5e'], // Soft Red Spark
        DECAY: ['#e11d48', '#9f1239']
    },
    MATRIX: {
        STANDARD: ['#22c55e', '#10b981', '#14b8a6'], // Radioactive greens & custom bright cyan
        GRAVITY: ['#06b6d4'], // Plasma Cyan
        SPLITTER: ['#fbbf24'], // Bright amber trigger
        DECAY: ['#ea580c', '#c2410c']
    },
    SUPERNOVA: {
        STANDARD: ['#f97316', '#ef4444', '#ea580c'], // Deep Solar Flame tones
        GRAVITY: ['#fbbf24'], // Pure solar gold core
        SPLITTER: ['#ffffff'], // Molten white plasma star
        DECAY: ['#b91c1c', '#7f1d1d']
    }
};

const EXPAND_FRAMES = 16;
const SHRINK_FRAMES = 15;

export interface GameStats {
    level: number;
    targetPct: number;
    totalRequired: number;
    cleared: number;
    combo: number;
    maxCombo: number;
    totalParticles: number;
    magnetFuel: number;
    maxMagnetFuel: number;
    tapped: boolean;
    sparksTotal: number;
    sparksLeft: number;
}

export class GameEngine {
    canvas: HTMLCanvasElement;
    ctx: CanvasRenderingContext2D;
    width: number = 0;
    height: number = 0;
    dpr: number = 1;
    
    particles: Particle[] = [];
    debris: Debris[] = [];
    texts: FloatingText[] = [];
    splitterSparks: SplitterSpark[] = [];
    
    level: number = 1;
    targetPct: number = 100;
    cleared: number = 0;
    combo: number = 0;
    maxCombo: number = 0;
    totalDrifting: number = 0;

    // Upgrades modifiers
    upgrades: StoreUpgrades = { extraSparks: 0, maxMagnetFuel: 0, magnetPower: 0, sparkRadiusBoost: 0, specialSpawnRate: 0 };
    activeTheme: ParticleTheme = 'STANDARD';
    sparksTotal: number = 1;
    sparksLeft: number = 1;

    // Herding Magnet Mechanics
    magnetX: number = 0;
    magnetY: number = 0;
    magnetActive: boolean = false;
    magnetFuel: number = 100;
    maxMagnetFuel: number = 100;
    orbitAngle: number = 0; // Visual flavor rotation

    // Reactor Turbulence Gravity Waves
    turbulenceX: number = -200;
    turbulenceWidth: number = 80;
    turbulenceSpeed: number = 4.0;
    turbulenceActive: boolean = false;
    turbulenceWarning: boolean = false;
    turbulenceTimer: number = 400;

    // Dynamic Physics parameters
    freezeDuration: number = 120;

    started: boolean = false;
    tapped: boolean = false;
    reqId: number = 0;
    
    onScoreUpdate: (stats: GameStats) => void;
    onEndRound: (win: boolean, stats: GameStats) => void;

    constructor(
        canvas: HTMLCanvasElement, 
        onScoreUpdate: (stats: GameStats) => void,
        onEndRound: (win: boolean, stats: GameStats) => void
    ) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d', { alpha: false })!;
        this.onScoreUpdate = onScoreUpdate;
        this.onEndRound = onEndRound;
        this.resize();
        window.addEventListener('resize', this.resize);
    }

    destroy() {
        window.removeEventListener('resize', this.resize);
        cancelAnimationFrame(this.reqId);
        this.started = false;
    }

    resize = () => {
        const rect = this.canvas.parentElement!.getBoundingClientRect();
        this.dpr = window.devicePixelRatio || 1;
        this.width = rect.width;
        this.height = rect.height;
        this.canvas.width = this.width * this.dpr;
        this.canvas.height = this.height * this.dpr;
    };

    getStats(): GameStats {
        return {
            level: this.level,
            targetPct: this.targetPct,
            totalRequired: Math.max(1, Math.floor(this.totalDrifting * (this.targetPct / 100))),
            cleared: Math.min(this.totalDrifting, this.cleared),
            combo: this.combo,
            maxCombo: this.maxCombo,
            totalParticles: this.totalDrifting,
            magnetFuel: Math.max(0, Math.floor(this.magnetFuel)),
            maxMagnetFuel: Math.max(10, Math.floor(this.maxMagnetFuel)),
            tapped: this.tapped,
            sparksTotal: this.sparksTotal,
            sparksLeft: this.sparksLeft
        };
    }

    startLevel(level: number, upgrades?: StoreUpgrades, activeTheme?: ParticleTheme) {
        cancelAnimationFrame(this.reqId);
        this.level = level;
        if (upgrades) this.upgrades = upgrades;
        if (activeTheme) this.activeTheme = activeTheme;

        const extraSparksLvl = this.upgrades.extraSparks || 0;
        this.sparksTotal = Math.min(8, 1 + extraSparksLvl);
        this.sparksLeft = this.sparksTotal;

        // Strict 100% Target to pass
        this.targetPct = 100;
        this.totalDrifting = 28 + level * 5; // Slightly fewer particles per level since 100% is required, keeping it balanced but challenging!
        this.cleared = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.tapped = false;
        
        this.magnetActive = false;
        this.maxMagnetFuel = 100 + 400 * (1 - Math.pow(0.85, this.upgrades.maxMagnetFuel || 0)); 
        this.magnetFuel = this.maxMagnetFuel;
        this.orbitAngle = 0;

        // Apply Resonance Duration upgrade (asymptotic soft-cap: 120 + 240 * (1 - 0.82^L))
        const durationLvl = this.upgrades.resonanceDuration || 0;
        this.freezeDuration = Math.round(120 + 240 * (1 - Math.pow(0.82, durationLvl)));

        // Reset Reactor Turbulence
        this.turbulenceActive = false;
        this.turbulenceWarning = false;
        this.turbulenceX = -200;
        this.turbulenceTimer = 180 + Math.random() * 150; // Trigger ~3-5 seconds in

        this.particles = [];
        this.debris = [];
        this.texts = [];
        this.splitterSparks = [];

        // DIFFICULTY UPGRADES: Scaling up velocity vectors and shrinking hitbox radius at higher levels
        // For levels >= 5, speed increases exponentially and radius shrinks exponentially.
        const baseSpeedScale = 1.45 + Math.min(2.4, (level - 1) * 0.22);
        const speedScale = baseSpeedScale * Math.pow(1.18, Math.max(0, level - 5));
        
        const baseRadiusScale = Math.max(0.65, 1.0 - (level - 1) * 0.04);
        const radiusScale = Math.max(0.25, baseRadiusScale * Math.pow(0.88, Math.max(0, level - 5)));

        const activeThemeName = this.activeTheme || 'STANDARD';
        const currentThemeColors = THEME_COLORS[activeThemeName] || THEME_COLORS.STANDARD;

        // 1. Spawn clearable goal particles
        for (let i = 0; i < this.totalDrifting; i++) {
            // Special particle spawns: base is 15%. Reactor Volatility injector upgrade increases rate up to 65% max (Level 10)
            const specialRateLvl = this.upgrades.specialSpawnRate || 0;
            const specialFreq = Math.min(0.65, 0.15 + specialRateLvl * 0.05);
            const randType = Math.random();
            let pType: ParticleType = 'STANDARD';
            if (randType < specialFreq) {
                pType = 'GRAVITY';
            } else if (randType < specialFreq * 2) {
                pType = 'SPLITTER';
            }

            const selectionColors = currentThemeColors[pType as Exclude<ParticleType, 'VOID_ANOMALY'>] || THEME_COLORS.STANDARD[pType as Exclude<ParticleType, 'VOID_ANOMALY'>];
            const chosenColor = selectionColors[Math.floor(Math.random() * selectionColors.length)];

            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * speedScale,
                vy: (Math.random() - 0.5) * speedScale,
                radius: (pType === 'STANDARD' ? 4 : pType === 'GRAVITY' ? 5 : 6) * radiusScale,
                maxRadius: pType === 'STANDARD' 
                    ? (20 + Math.random() * 6) // reduced from 32-42px to 20-26px for tighter gameplay
                    : pType === 'GRAVITY' ? 34 : 28, // reduced from 52/42px to 34/28px
                color: chosenColor,
                state: 'DRIFTING',
                type: pType,
                timer: 0
            });
        }

        // 2. Spawn additional non-detonatable/heat-sink Decay particles at level 2+
        const decayCount = level < 2 ? 0 : Math.floor(this.totalDrifting * Math.min(0.60, 0.15 + (level - 2) * 0.06));
        for (let i = 0; i < decayCount; i++) {
            const decayColors = currentThemeColors.DECAY || THEME_COLORS.STANDARD.DECAY;
            const chosenColor = decayColors[Math.floor(Math.random() * decayColors.length)];
            this.particles.push({
                x: Math.random() * (this.width - 40) + 20,
                y: Math.random() * (this.height - 40) + 20,
                vx: (Math.random() - 0.5) * speedScale * 0.9,
                vy: (Math.random() - 0.5) * speedScale * 0.9,
                radius: 8.0 * radiusScale,
                maxRadius: 0, // Cannot explode
                color: chosenColor,
                state: 'DRIFTING',
                type: 'DECAY',
                timer: 0
            });
        }

        // 3. Spawn Void Singularities at level 3+
        const anomalyCount = level < 3 ? 0 : Math.min(6, Math.floor((level - 1) / 2));
        for (let i = 0; i < anomalyCount; i++) {
            this.particles.push({
                x: Math.random() * (this.width - 80) + 40,
                y: Math.random() * (this.height - 80) + 40,
                vx: (Math.random() - 0.5) * speedScale * 0.35,
                vy: (Math.random() - 0.5) * speedScale * 0.35,
                radius: 12.0 * radiusScale, // Large, black/crimson obstacle
                maxRadius: 0, // Cannot explode
                color: '#ff0055', // Neon pinkish red
                state: 'DRIFTING',
                type: 'VOID_ANOMALY',
                timer: 0
            });
        }
        
        this.started = true;
        this.onScoreUpdate(this.getStats());
        this.loop();
    }

    resumeWithExtraSpark() {
        if (this.started) return;
        this.sparksLeft = 1;
        this.started = true;
        this.magnetFuel = Math.max(this.magnetFuel, this.maxMagnetFuel * 0.4); // Restore 40% fuel for recovery
        this.onScoreUpdate(this.getStats());
        this.loop();
    }

    setMagnet(x: number, y: number, fileActive: boolean) {
        if (this.sparksLeft <= 0) {
            this.magnetActive = false;
            return;
        }
        this.magnetX = x;
        this.magnetY = y;
        this.magnetActive = fileActive && this.magnetFuel > 0;
    }

    dropTriggerSpark(x: number, y: number) {
        if (this.sparksLeft <= 0 || !this.started) return;
        this.sparksLeft--;
        this.tapped = true;
        
        if (this.sparksLeft <= 0) {
            this.magnetActive = false; 
        }

        // Apply spark radius boost upgrade (asymptotic soft-cap: 1.0 + 1.8 * (1 - 0.78^L))
        const radiusBoostLvl = this.upgrades.sparkRadiusBoost || 0;
        const sparkRadiusBoost = 1.0 + 1.8 * (1 - Math.pow(0.78, radiusBoostLvl));
        const maxRadiusWithUpgrade = 36 * sparkRadiusBoost; // reduced starting from 55 to 36
        
        // Spawn trigger spark
        this.particles.push({
            x, y, vx: 0, vy: 0,
            radius: 4, 
            maxRadius: maxRadiusWithUpgrade,
            color: '#FFFFFF',
            state: 'EXPANDING',
            type: 'STANDARD',
            timer: 0
        });
        
        this.onScoreUpdate(this.getStats());
    }

    private triggerSplitterSparks(p: Particle) {
        const directions = [
            { vx: 0, vy: -6 },  // North
            { vx: 0, vy: 6 },   // South
            { vx: -6, vy: 0 },  // West
            { vx: 6, vy: 0 },   // East
            { vx: -4.2, vy: -4.2 }, // Diagonals
            { vx: 4.2, vy: -4.2 },
            { vx: -4.2, vy: 4.2 },
            { vx: 4.2, vy: 4.2 }
        ];

        directions.forEach(dir => {
            this.splitterSparks.push({
                id: Math.random(),
                x: p.x,
                y: p.y,
                vx: dir.vx,
                vy: dir.vy,
                life: 1.0,
                color: p.color
            });
        });
    }

    private spawnExplosionJuice(p: Particle) {
        // Spawn debris outward burst
        const debrisCount = p.type === 'STANDARD' ? 8 : p.type === 'GRAVITY' ? 14 : 10;
        for (let i = 0; i < debrisCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 1.5 + Math.random() * 4.5;
            this.debris.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1.0,
                color: p.color
            });
        }

        // Floating dynamic score popups
        const textVal = p.type === 'GRAVITY' ? `GRAVITY!` : p.type === 'SPLITTER' ? `SPLIT!` : `${this.combo}X`;
        this.texts.push({
            x: p.x,
            y: p.y - 12,
            text: textVal,
            life: 1.0,
            color: p.color
        });
    }

    private triggerExtinctionShockwave(decay: Particle) {
        // Red critical text
        this.texts.push({
            x: decay.x,
            y: decay.y - 20,
            text: '💥 CHAIN BROKEN!',
            life: 1.15,
            color: '#f43f5e'
        });

        // Loop and extinguish all adjacent exploding nodes inside 150px
        for (let other of this.particles) {
            if (other.state === 'EXPANDING' || other.state === 'FROZEN' || other.state === 'SHRINKING') {
                const dx = other.x - decay.x;
                const dy = other.y - decay.y;
                if (dx*dx + dy*dy < 150 * 150) {
                    other.state = 'SHRINKING';
                    other.timer = 0;
                    other.radius = Math.max(1.5, other.radius * 0.22); // Collapse explosion immediately
                }
            }
        }
    }

    private spawnDecayAbsorbJuice(p: Particle) {
        // Spawn dark maroon and crimson debris warning sparks
        for (let i = 0; i < 7; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random() * 2.8;
            this.debris.push({
                x: p.x,
                y: p.y,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 0.85,
                color: '#ef4444'
            });
        }

        this.texts.push({
            x: p.x,
            y: p.y - 12,
            text: 'DAMPENED!',
            life: 0.85,
            color: '#ef4444'
        });
    }

    update() {
        this.orbitAngle += 0.05;

        // --- REACTOR TURBULENCE / GRAVITY WAVES ---
        if (this.level >= 3) {
            this.turbulenceTimer--;
            if (this.turbulenceTimer <= 65 && this.turbulenceTimer > 0) {
                this.turbulenceWarning = true;
            } else {
                this.turbulenceWarning = false;
            }

            if (this.turbulenceTimer <= 0) {
                this.turbulenceActive = true;
                this.turbulenceWarning = false;
                this.turbulenceX = -this.turbulenceWidth;
                // Faster cycle cooldown: ~5 to 8 seconds
                this.turbulenceTimer = 300 + Math.random() * 180;
            }

            if (this.turbulenceActive) {
                const waveSpeed = 5.5 + Math.min(3.5, (this.level - 3) * 0.7);
                this.turbulenceX += waveSpeed;
                if (this.turbulenceX > this.width + 100) {
                    this.turbulenceActive = false;
                }

                // Apply massive drag & sheer horizontal forces to drifting particles inside the wave sweep band
                for (let p of this.particles) {
                    if (p.state !== 'DRIFTING') continue;
                    if (p.x >= this.turbulenceX && p.x <= this.turbulenceX + this.turbulenceWidth) {
                        // Drag them horizontally along wave direction
                        const sweepStrength = 1.35 + Math.min(1.2, (this.level - 3) * 0.25);
                        p.vx += sweepStrength;
                        // Violent vertical oscillation
                        p.vy += Math.sin(p.x * 0.05 + this.orbitAngle * 2.2) * 1.6;
                    }
                }
            }
        }

        // 1. Update actively herded magnets
        if (this.magnetActive && this.magnetFuel > 0) {
            this.magnetFuel -= 0.55; // Slower burn to give ample planning
            if (this.magnetFuel <= 0) {
                this.magnetActive = false;
            }
            this.onScoreUpdate(this.getStats());

            // Gentle gravitational pull
            for (let p of this.particles) {
                if (p.state !== 'DRIFTING') continue;
                const dx = this.magnetX - p.x;
                const dy = this.magnetY - p.y;
                const distSq = dx*dx + dy*dy;
                const dist = Math.sqrt(distSq || 1);
                
                // Force falls off linearly after 180px, but strong inside it 
                if (dist < 185) {
                    const powerLvl = this.upgrades.magnetPower || 0;
                    const pullMultiplier = 1.0 + 3.0 * (1 - Math.pow(0.80, powerLvl));
                    // Decay particles are heavy anti-matter, matching 30% magnet strength
                    const baseForce = p.type === 'DECAY' ? 0.06 : 0.22;
                    const power = (1 - dist / 185) * baseForce * pullMultiplier;
                    p.vx += (dx / dist) * power;
                    p.vy += (dy / dist) * power;
                }
            }
        } else if (!this.magnetActive && this.upgrades.magnetAutopilot && this.upgrades.magnetAutopilot > 0) {
            // Trickle recharge magnet fuel in real-time when not active
            const autopilotLvl = this.upgrades.magnetAutopilot || 0;
            const rechargeSpeed = Math.min(0.40, autopilotLvl * 0.04);
            const rechargeRate = rechargeSpeed * 0.06;
            if (this.magnetFuel < this.maxMagnetFuel) {
                this.magnetFuel = Math.min(this.maxMagnetFuel, this.magnetFuel + rechargeRate);
                this.onScoreUpdate(this.getStats());
            }
        }

        // Also update pulling from any active expanding/frozen GRAVITY particle explosions
        for (let gp of this.particles) {
            if (gp.type === 'GRAVITY' && (gp.state === 'EXPANDING' || gp.state === 'FROZEN')) {
                // Gravity pull within local orbit
                for (let other of this.particles) {
                    if (other === gp || other.state !== 'DRIFTING') continue;
                    const dx = gp.x - other.x;
                    const dy = gp.y - other.y;
                    const distSq = dx*dx + dy*dy;
                    if (distSq < 130 * 130) {
                        const dist = Math.sqrt(distSq || 1);
                        // Decay particles resist the gravity explosion well
                        const baseGravity = other.type === 'DECAY' ? 0.12 : 0.45;
                        const pullForce = (1 - dist / 130) * baseGravity;
                        other.vx += (dx / dist) * pullForce;
                        other.vy += (dy / dist) * pullForce;
                    }
                }
            }
        }

        // Gentle gravity pull from Void Singularities
        for (let vp of this.particles) {
            if (vp.type === 'VOID_ANOMALY' && vp.state === 'DRIFTING') {
                for (let other of this.particles) {
                    if (other === vp || other.state !== 'DRIFTING') continue;
                    const dx = vp.x - other.x;
                    const dy = vp.y - other.y;
                    const distSq = dx*dx + dy*dy;
                    if (distSq < 160 * 160) {
                        const dist = Math.sqrt(distSq || 1);
                        const baseGravity = other.type === 'DECAY' ? 0.05 : 0.15;
                        const pullForce = (1 - dist / 160) * baseGravity;
                        other.vx += (dx / dist) * pullForce;
                        other.vy += (dy / dist) * pullForce;
                    }
                }
            }
        }

        // 2. Update all drift particle locations & state transitions
        const decayCells = this.particles.filter(dc => dc.state === 'DRIFTING' && dc.type === 'DECAY');

        for (let p of this.particles) {
            if (p.state === 'DRIFTING') {
                // Decay magnetic repulsion zones: clearable particles get forcefully repelled from nearby decay cells!
                if (p.type !== 'DECAY' && decayCells.length > 0) {
                    for (let dc of decayCells) {
                        const rdx = p.x - dc.x;
                        const rdy = p.y - dc.y;
                        const rdistSq = rdx*rdx + rdy*rdy;
                        if (rdistSq < 85 * 85) {
                            const rdist = Math.sqrt(rdistSq || 1);
                            // Push away with increasing strength inverse to distance
                            const rPower = (1 - rdist / 85) * 0.65;
                            p.vx += (rdx / rdist) * rPower;
                            p.vy += (rdy / rdist) * rPower;
                        }
                    }
                }

                p.x += p.vx;
                p.y += p.vy;

                // Restrict velocities to avoid chaotic zooming
                const speedSq = p.vx * p.vx + p.vy * p.vy;
                if (speedSq > 2.5 * 2.5) {
                    p.vx *= 0.95;
                    p.vy *= 0.95;
                }
                
                // Canvas edge rebounding
                if (p.x < p.radius) { p.x = p.radius; p.vx = Math.abs(p.vx); }
                else if (p.x > this.width - p.radius) { p.x = this.width - p.radius; p.vx = -Math.abs(p.vx); }
                
                if (p.y < p.radius) { p.y = p.radius; p.vy = Math.abs(p.vy); }
                else if (p.y > this.height - p.radius) { p.y = this.height - p.radius; p.vy = -Math.abs(p.vy); }
            } else if (p.state === 'EXPANDING') {
                p.radius += (p.maxRadius - 4) / EXPAND_FRAMES;
                if (p.radius >= p.maxRadius) {
                    p.radius = p.maxRadius;
                    p.state = 'FROZEN';
                    p.timer = this.freezeDuration;
                }
            } else if (p.state === 'FROZEN') {
                p.timer--;
                if (p.timer <= 0) {
                    p.state = 'SHRINKING';
                }
            } else if (p.state === 'SHRINKING') {
                p.radius -= p.maxRadius / SHRINK_FRAMES;
                if (p.radius <= 0.2) {
                    p.state = 'DEAD';
                }
            }
        }

        // 3. Filter dead particles
        this.particles = this.particles.filter(p => p.state !== 'DEAD');

        // 4. Update Splitter cross sparks
        for (let s of this.splitterSparks) {
            s.x += s.vx;
            s.y += s.vy;
            s.life -= 0.012; // slow fade-out streak
        }

        // Collision: Splitter cross sparks hitting Drifting particles
        let didClearViaSpark = false;
        for (let s of this.splitterSparks) {
            if (s.life <= 0) continue;
            for (let p of this.particles) {
                if (p.state !== 'DRIFTING') continue;
                const dx = p.x - s.x;
                const dy = p.y - s.y;
                if (dx*dx + dy*dy < (p.radius + 12) * (p.radius + 12)) {
                    if (p.type === 'DECAY') {
                        const decayResistLvl = this.upgrades.decayResist || 0;
                        const bypassChance = Math.min(1.0, 0.125 * decayResistLvl);
                        if (Math.random() < bypassChance) {
                            p.type = 'STANDARD';
                            p.state = 'EXPANDING';
                            p.vx = 0;
                            p.vy = 0;
                            p.radius = 4;
                            p.maxRadius = 16;
                            p.color = '#22c55e'; // vibrant green

                            this.combo++;
                            this.maxCombo = Math.max(this.combo, this.maxCombo);

                            playDetonate(this.combo);
                            this.texts.push({
                                x: p.x,
                                y: p.y - 15,
                                text: '🛡️ SHIELDED!',
                                life: 1.0,
                                color: '#22c55e'
                            });
                            s.life = 0;
                            didClearViaSpark = true;
                            break;
                        } else {
                            s.life = 0; // absorb spark bullet
                            this.spawnDecayAbsorbJuice(p);
                            this.triggerExtinctionShockwave(p);
                            didClearViaSpark = true;
                            break;
                        }
                    }

                    if (p.type === 'VOID_ANOMALY') {
                        s.life = 0; // swallow spark
                        this.spawnDecayAbsorbJuice(p);
                        didClearViaSpark = true;
                        break;
                    }

                    p.state = 'EXPANDING';
                    p.vx = 0;
                    p.vy = 0;
                    p.radius = 4;
                    
                    this.cleared++;
                    this.combo++;
                    this.maxCombo = Math.max(this.combo, this.maxCombo);

                    playDetonate(this.combo);
                    this.spawnExplosionJuice(p);
                    if (p.type === 'SPLITTER') {
                        this.triggerSplitterSparks(p);
                    }
                    s.life = 0; // Destroy spark bullet
                    didClearViaSpark = true;
                    break;
                }
            }
        }
        this.splitterSparks = this.splitterSparks.filter(s => s.life > 0);

        // 5. Normal collision checks (Drifting vs Active Explosive Hubs)
        const explosives = this.particles.filter(p => 
            p.state === 'EXPANDING' || p.state === 'FROZEN' || p.state === 'SHRINKING'
        );

        let didClear = false;
        for (let p1 of this.particles) {
            if (p1.state !== 'DRIFTING') continue;
            
            for (let exp of explosives) {
                const dx = p1.x - exp.x;
                const dy = p1.y - exp.y;
                const distSq = dx*dx + dy*dy;
                const targetDist = p1.radius + exp.radius;
                
                if (distSq < targetDist * targetDist) {
                    if (p1.type === 'DECAY') {
                        const decayResistLvl = this.upgrades.decayResist || 0;
                        const bypassChance = Math.min(1.0, 0.125 * decayResistLvl);
                        if (Math.random() < bypassChance) {
                            p1.type = 'STANDARD';
                            p1.state = 'EXPANDING';
                            p1.vx = 0;
                            p1.vy = 0;
                            p1.radius = 4;
                            p1.maxRadius = 16;
                            p1.color = '#22c55e'; // vibrant green

                            this.combo++;
                            this.maxCombo = Math.max(this.combo, this.maxCombo);

                            playDetonate(this.combo);
                            this.texts.push({
                                x: p1.x,
                                y: p1.y - 15,
                                text: '🛡️ SHIELDED!',
                                life: 1.0,
                                color: '#22c55e'
                            });

                            didClear = true;
                            break;
                        } else {
                            exp.state = 'SHRINKING';
                            exp.timer = 0;
                            exp.radius = Math.max(1.0, exp.radius * 0.25);
                            this.spawnDecayAbsorbJuice(p1);
                            this.triggerExtinctionShockwave(p1);
                            didClear = true;
                            break;
                        }
                    }

                    if (p1.type === 'VOID_ANOMALY') {
                        // Extinguish active explosive hub!
                        exp.state = 'SHRINKING';
                        exp.timer = 0;
                        exp.radius = Math.max(1.0, exp.radius * 0.15); // Collapse explosion immediately
                        
                        this.texts.push({
                            x: p1.x,
                            y: p1.y - 20,
                            text: '⚠️ COLLAPSED!',
                            life: 1.0,
                            color: '#ff0055'
                        });

                        this.spawnDecayAbsorbJuice(p1); 

                        // Trigger adjacent explosion collapses within 120px
                        for (let other of this.particles) {
                            if (other !== exp && (other.state === 'EXPANDING' || other.state === 'FROZEN' || other.state === 'SHRINKING')) {
                                const dx = other.x - p1.x;
                                const dy = other.y - p1.y;
                                if (dx*dx + dy*dy < 120 * 120) {
                                    other.state = 'SHRINKING';
                                    other.timer = 0;
                                    other.radius = Math.max(1.0, other.radius * 0.15);
                                }
                            }
                        }
                        didClear = true;
                        break;
                    }

                    p1.state = 'EXPANDING';
                    p1.vx = 0;
                    p1.vy = 0;
                    p1.radius = 4; 
                    
                    this.cleared++;
                    this.combo++;
                    this.maxCombo = Math.max(this.combo, this.maxCombo);
                    
                    playDetonate(this.combo);
                    this.spawnExplosionJuice(p1);
                    
                    if (p1.type === 'SPLITTER') {
                        this.triggerSplitterSparks(p1);
                    }

                    didClear = true;
                    break; 
                }
            }
        }

        if (didClear || didClearViaSpark) {
            this.onScoreUpdate(this.getStats());
        }

        // Update Debris Particles 
        for (let d of this.debris) {
            d.x += d.vx;
            d.y += d.vy;
            d.life -= 0.024;
        }
        this.debris = this.debris.filter(d => d.life > 0);

        // Update Fading Popup Texts
        for (let t of this.texts) {
            t.y -= 0.45;
            t.life -= 0.014;
        }
        this.texts = this.texts.filter(t => t.life > 0);
    }

    draw() {
        const { ctx, dpr } = this;
        
        ctx.fillStyle = '#0c0c0e';
        ctx.fillRect(0, 0, this.width * dpr, this.height * dpr);
        
        ctx.save();
        ctx.scale(dpr, dpr);

        // Pre-filter active gravity cores once per frame to avoid inner loop overhead
        const activeGravityCores = this.particles.filter(gp => 
            gp.type === 'GRAVITY' && (gp.state === 'EXPANDING' || gp.state === 'FROZEN')
        );
        
        // Visual Juice: Subtle space physics coordinate fabric grid that warps interactively
        const gridSize = 42;
        ctx.beginPath();
        for (let x = 0; x <= this.width + 10; x += gridSize) {
            for (let y = 0; y <= this.height; y += 40) {
                let drawX = x;
                let drawY = y;
                
                // Warp grid relative to active magnet vortex
                if (this.magnetActive && this.magnetFuel > 0) {
                    const dx = x - this.magnetX;
                    const dy = y - this.magnetY;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq || 1);
                    if (dist < 160) {
                        const pullPower = (1 - dist / 160) * 18 * (this.magnetFuel / 100);
                        drawX -= (dx / dist) * pullPower;
                        drawY -= (dy / dist) * pullPower;
                    }
                }

                // Warp grid relative to any gravity-type explosions
                for (let gp of activeGravityCores) {
                    const dx = x - gp.x;
                    const dy = y - gp.y;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq || 1);
                    if (dist < gp.radius + 30) {
                        const pullPower = (1 - dist / (gp.radius + 30)) * 14;
                        drawX -= (dx / dist) * pullPower;
                        drawY -= (dy / dist) * pullPower;
                    }
                }

                if (y === 0) {
                    ctx.moveTo(drawX, drawY);
                } else {
                    ctx.lineTo(drawX, drawY);
                }
            }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        ctx.beginPath();
        for (let y = 0; y <= this.height + 10; y += gridSize) {
            for (let x = 0; x <= this.width; x += 40) {
                let drawX = x;
                let drawY = y;
                
                if (this.magnetActive && this.magnetFuel > 0) {
                    const dx = x - this.magnetX;
                    const dy = y - this.magnetY;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq || 1);
                    if (dist < 160) {
                        const pullPower = (1 - dist / 160) * 18 * (this.magnetFuel / 100);
                        drawX -= (dx / dist) * pullPower;
                        drawY -= (dy / dist) * pullPower;
                    }
                }

                for (let gp of activeGravityCores) {
                    const dx = x - gp.x;
                    const dy = y - gp.y;
                    const distSq = dx*dx + dy*dy;
                    const dist = Math.sqrt(distSq || 1);
                    if (dist < gp.radius + 30) {
                        const pullPower = (1 - dist / (gp.radius + 30)) * 14;
                        drawX -= (dx / dist) * pullPower;
                        drawY -= (dy / dist) * pullPower;
                    }
                }

                if (x === 0) {
                    ctx.moveTo(drawX, drawY);
                } else {
                    ctx.lineTo(drawX, drawY);
                }
            }
        }
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.04)';
        ctx.lineWidth = 1;
        ctx.stroke();

        // Screen mode to render glowing additive objects
        ctx.globalCompositeOperation = 'screen';
        
        // Active Herding Swirl Vortex Design
        if (this.magnetActive && this.magnetFuel > 0) {
            // Pulsating magnetic ring
            ctx.beginPath();
            ctx.arc(this.magnetX, this.magnetY, 40, 0, Math.PI * 2);
            ctx.strokeStyle = `rgba(250, 204, 21, ${0.1 + Math.sin(this.orbitAngle * 2) * 0.05})`;
            ctx.lineWidth = 4;
            ctx.stroke();

            // Inner gravitational swirl lines
            const lineCount = 3;
            for (let i = 0; i < lineCount; i++) {
                const angleOffset = (i * Math.PI * 2) / lineCount + this.orbitAngle;
                ctx.beginPath();
                ctx.arc(this.magnetX, this.magnetY, 15 + i * 8, angleOffset, angleOffset + Math.PI * 0.7);
                ctx.strokeStyle = '#facc15';
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // Central particle source glow
            ctx.beginPath();
            ctx.arc(this.magnetX, this.magnetY, 4, 0, Math.PI * 2);
            ctx.fillStyle = '#FFFFFF';
            ctx.shadowBlur = 15;
            ctx.shadowColor = '#facc15';
            ctx.fill();
        }

        // 6. Draw Splitter cross Streaks
        for (let s of this.splitterSparks) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, s.life);
            
            // Fast procedural glow streak
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
            ctx.strokeStyle = s.color;
            ctx.lineWidth = 8;
            ctx.lineCap = 'round';
            ctx.globalAlpha = Math.max(0, s.life) * 0.25;
            ctx.stroke();

            // Core sharp streak
            ctx.beginPath();
            ctx.moveTo(s.x, s.y);
            ctx.lineTo(s.x - s.vx * 2.5, s.y - s.vy * 2.5);
            ctx.strokeStyle = '#FFFFFF';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.globalAlpha = Math.max(0, s.life);
            ctx.stroke();
            
            ctx.restore();
        }

        // 7. Render drifting & exploding Particles
        for (let p of this.particles) {
            ctx.save();

            // Render Void Singularity
            if (p.type === 'VOID_ANOMALY') {
                ctx.save();
                ctx.translate(p.x, p.y);
                ctx.rotate(this.orbitAngle * 1.5);
                
                // Outer crimson accretion disk glow
                ctx.beginPath();
                ctx.arc(0, 0, p.radius * 2.0, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255, 0, 85, 0.15)';
                ctx.fill();

                // Swirling crimson arcs
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 2.5;
                for (let i = 0; i < 3; i++) {
                    ctx.beginPath();
                    const arcStart = (i * Math.PI * 2) / 3;
                    ctx.arc(0, 0, p.radius * (1.2 + i * 0.25), arcStart, arcStart + Math.PI * 0.5);
                    ctx.stroke();
                }
                ctx.restore();

                // Pitch black inner core
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.85, 0, Math.PI * 2);
                ctx.fillStyle = '#000000';
                ctx.fill();
                
                // Crimson core outline
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.85, 0, Math.PI * 2);
                ctx.strokeStyle = '#ff0055';
                ctx.lineWidth = 1.5;
                ctx.stroke();

                ctx.restore();
                continue;
            }

            // Draw high-performance procedural glow rings for explosions instead of canvas shadowBlur
            const isExploding = p.state === 'EXPANDING' || p.state === 'FROZEN' || p.state === 'SHRINKING';
            if (isExploding) {
                // Procedural outer glow rings
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 1.35, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.15;
                ctx.fill();
                
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 1.15, 0, Math.PI * 2);
                ctx.fillStyle = p.color;
                ctx.globalAlpha = 0.35;
                ctx.fill();
                
                ctx.globalAlpha = 1.0;
            }

            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fillStyle = p.color;
            ctx.fill();

            // Distinct geometric indicators on active Drifting special shapes
            if (p.state === 'DRIFTING') {
                if (p.type === 'GRAVITY') {
                    // Moving orbital gravity indicator
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + 5, this.orbitAngle, this.orbitAngle + Math.PI * 0.4);
                    ctx.strokeStyle = p.color;
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else if (p.type === 'SPLITTER') {
                    // Bright caution cross-hairs Inside
                    ctx.beginPath();
                    ctx.moveTo(p.x - 3, p.y);
                    ctx.lineTo(p.x + 3, p.y);
                    ctx.moveTo(p.x, p.y - 3);
                    ctx.lineTo(p.x, p.y + 3);
                    ctx.strokeStyle = '#000000';
                    ctx.lineWidth = 1.5;
                    ctx.stroke();
                } else if (p.type === 'DECAY') {
                    // Draw outer warning boundary
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, p.radius + 4.5, 0, Math.PI * 2);
                    ctx.strokeStyle = 'rgba(239, 68, 68, 0.45)';
                    ctx.lineWidth = 1.25;
                    ctx.stroke();

                    // Faint pulsing Repulsion aura zone
                    ctx.beginPath();
                    ctx.arc(p.x, p.y, 85, 0, Math.PI * 2);
                    ctx.strokeStyle = `rgba(239, 68, 68, ${0.05 + Math.sin(this.orbitAngle * 4.0) * 0.02})`;
                    ctx.lineWidth = 1.0;
                    ctx.setLineDash([3, 5]);
                    ctx.stroke();
                    ctx.setLineDash([]); // clear dash spec

                    // Inner high-density symbol index (minus sign)
                    ctx.beginPath();
                    ctx.moveTo(p.x - p.radius * 0.40, p.y);
                    ctx.lineTo(p.x + p.radius * 0.40, p.y);
                    ctx.strokeStyle = '#FFFFFF';
                    ctx.lineWidth = 2.25;
                    ctx.stroke();
                }
            }

            // White molten core centers for explosions
            if (p.state === 'EXPANDING' || p.state === 'FROZEN' || p.state === 'SHRINKING') {
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.38, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();

                // Faint energy shockwave rings
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius * 0.85, 0, Math.PI * 2);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.45)';
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Draw debris scatter points without costly save/restore/shadows
        for (let d of this.debris) {
            ctx.fillStyle = d.color;
            ctx.globalAlpha = Math.max(0, d.life);
            ctx.fillRect(d.x - 1, d.y - 1, 2, 2);
        }
        ctx.globalAlpha = 1.0;
        
        // Draw active Turbulence Wave sweep on screen
        if (this.turbulenceActive) {
            ctx.save();
            ctx.globalCompositeOperation = 'screen';
            // Vertical band gradient
            const grad = ctx.createLinearGradient(this.turbulenceX, 0, this.turbulenceX + this.turbulenceWidth, 0);
            grad.addColorStop(0, 'rgba(239, 68, 68, 0.0)');
            grad.addColorStop(0.3, 'rgba(239, 68, 68, 0.14)');
            grad.addColorStop(0.5, 'rgba(239, 68, 68, 0.25)');
            grad.addColorStop(0.7, 'rgba(249, 115, 22, 0.14)');
            grad.addColorStop(1, 'rgba(249, 115, 22, 0.0)');

            ctx.fillStyle = grad;
            ctx.fillRect(this.turbulenceX, 0, this.turbulenceWidth, this.height);

            // Draw scanning hair lines
            ctx.beginPath();
            ctx.moveTo(this.turbulenceX + this.turbulenceWidth * 0.5, 0);
            ctx.lineTo(this.turbulenceX + this.turbulenceWidth * 0.5, this.height);
            ctx.strokeStyle = 'rgba(239, 68, 68, 0.35)';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Tiny digital core scanner texts
            ctx.font = '9px monospace';
            ctx.fillStyle = '#ef4444';
            ctx.fillText('TURBULENCE', this.turbulenceX + 5, 25);
            ctx.restore();
        }

        // Draw HUD alert warning for upcoming waves
        if (this.turbulenceWarning) {
            ctx.save();
            ctx.font = 'bold 11px sans-serif';
            ctx.fillStyle = `rgba(239, 68, 68, ${0.4 + Math.sin(this.orbitAngle * 6) * 0.35})`;
            ctx.textAlign = 'center';
            ctx.fillText('⚠️ WARNING: REACTOR GRAVITY WAVE DEVIATION ⚠️', this.width * 0.5, 32);
            ctx.restore();
        }

        ctx.globalCompositeOperation = 'source-over';

        // Draw floating text multipliers
        for (let t of this.texts) {
            ctx.save();
            ctx.globalAlpha = Math.max(0, t.life);
            ctx.font = 'bold 15px sans-serif';
            ctx.textAlign = 'center';
            ctx.fillStyle = t.color;
            ctx.shadowBlur = 5;
            ctx.shadowColor = '#000000';
            ctx.lineWidth = 3;
            ctx.strokeText(t.text, t.x, t.y);
            ctx.fillText(t.text, t.x, t.y);
            ctx.restore();
        }

        ctx.restore();
    }

    loop = () => {
        if (!this.started) return;
        
        this.update();
        this.draw();
        
        if (this.tapped) {
            const hasExplosives = this.particles.some(p => 
                p.state === 'EXPANDING' || p.state === 'FROZEN' || p.state === 'SHRINKING'
            );
            
            // End level if:
            // 1) All explosive cascade has died out AND there are no splitter comets left AND no trigger sparks left.
            // 2) OR if we have achieved perfection and liquidated 100% of standard element cells.
            const isCompleted = (!hasExplosives && this.splitterSparks.length === 0 && this.sparksLeft <= 0) || 
                                (this.cleared === this.totalDrifting && this.totalDrifting > 0);

            if (isCompleted) {
                this.started = false;
                const stats = this.getStats();
                const didWin = this.cleared >= stats.totalRequired;
                
                setTimeout(() => {
                    this.onEndRound(didWin, stats);
                }, 500); 
                return;
            }
        }

        this.reqId = requestAnimationFrame(this.loop);
    }
}
