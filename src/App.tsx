import { useEffect, useRef, useState, PointerEvent } from 'react';
import { GameEngine, GameStats, StoreUpgrades, ParticleTheme, THEME_COLORS, PrestigeUpgrades } from './lib/engine';
import { 
    initAudio, 
    playPerfectBonus, 
    playPurchaseConfirm, 
    playSlotSpin, 
    playSlotStop, 
    playSlotPayout, 
    playNearMissAlert,
    playDefeatSound,
    playAdTick,
    playTransactionChord,
    playAlertBeep,
    toggleMute,
    getMuteState
} from './lib/audio';
import { 
    Cpu,
    Share2, 
    Play, 
    RotateCcw, 
    Magnet, 
    Zap, 
    HelpCircle, 
    ShoppingBag, 
    Coins, 
    Sparkles, 
    Check, 
    ChevronLeft, 
    ChevronRight, 
    Flame, 
    Gauge,
    Dices,
    AlertTriangle,
    Trophy,
    Shield,
    Video,
    CreditCard,
    Pause,
    Volume2,
    VolumeX,
    Atom
} from 'lucide-react';

type Screen = 'START' | 'GAME' | 'ROUND_OVER' | 'SHOP' | 'PRESTIGE_SHOP';

interface ShopItem {
    id: keyof StoreUpgrades;
    name: string;
    description: string;
    baseCost: number;
    multiplier: number;
    getValueLabel: (level: number) => string;
}

const SHOP_ITEMS: ShopItem[] = [
    {
        id: 'extraSparks',
        name: 'Cascade Spark Battery',
        description: 'Enables dropping multiple detonators per level to restart failing reactions.',
        baseCost: 800,
        multiplier: 3.5,
        getValueLabel: (lvl) => {
            const val = Math.min(8, 1 + lvl);
            return `${val} Spark Detonator${val > 1 ? 's' : ''}${lvl >= 7 ? ' (Max)' : ''}`;
        }
    },
    {
        id: 'maxMagnetFuel',
        name: 'Quantum Fuel Module',
        description: 'Increases the gravity sweeper magnet fuel capacity.',
        baseCost: 300,
        multiplier: 1.7,
        getValueLabel: (lvl) => {
            const val = 100 + 400 * (1 - Math.pow(0.85, lvl));
            return `${Math.round(val)}% Sweep capacity`;
        }
    },
    {
        id: 'sparkRadiusBoost',
        name: 'Catalyst Core',
        description: 'Enlarges the trigger spark core explosion radius.',
        baseCost: 400,
        multiplier: 1.8,
        getValueLabel: (lvl) => {
            const val = 1.0 + 1.8 * (1 - Math.pow(0.78, lvl));
            return `+${Math.round((val - 1.0) * 100)}% reach radius`;
        }
    },
    {
        id: 'magnetPower',
        name: 'Tractor Drive Pulse',
        description: 'Increases speed & strength of herding gravitational pull.',
        baseCost: 250,
        multiplier: 1.65,
        getValueLabel: (lvl) => {
            const val = 1.0 + 3.0 * (1 - Math.pow(0.80, lvl));
            return `${val.toFixed(1)}x faster herding`;
        }
    },
    {
        id: 'specialSpawnRate',
        name: 'Reactor Volatility',
        description: 'Spawns more specialty Gravity and Splitter core bubbles in grids.',
        baseCost: 500,
        multiplier: 2.0,
        getValueLabel: (lvl) => {
            const val = Math.min(0.65, 0.15 + lvl * 0.05);
            return `${Math.round(val * 100)}% specialty cores${lvl >= 10 ? ' (Max)' : ''}`;
        }
    },
    {
        id: 'resonanceDuration',
        name: 'Resonance Sustain Core',
        description: 'Extends active explosion lifetimes and holds reactions frozen for longer.',
        baseCost: 300,
        multiplier: 1.75,
        getValueLabel: (lvl) => {
            const val = 120 + 240 * (1 - Math.pow(0.82, lvl));
            return `+${Math.round(((val - 120) / 120) * 100)}% longer sustain`;
        }
    },
    {
        id: 'decayResist',
        name: 'Decay Neutralizer Shield',
        description: 'Bypasses and converts Anti-Matter Decay Cells into helpful standard explosions.',
        baseCost: 400,
        multiplier: 1.85,
        getValueLabel: (lvl) => {
            const val = Math.min(1.0, 0.125 * lvl);
            return `${Math.round(val * 100)}% absorb probability${lvl >= 8 ? ' (Max)' : ''}`;
        }
    },
    {
        id: 'comboShardMultiplier',
        name: 'Combo Resonance Charger',
        description: 'Significantly increases net Quantum Shards generated per peak combo hit.',
        baseCost: 300,
        multiplier: 1.75,
        getValueLabel: (lvl) => {
            const val = 4 * lvl;
            return `+${val} bonus shards per hit`;
        }
    },
    {
        id: 'magnetAutopilot',
        name: 'Vortex Fuel Recycler',
        description: 'Passively recharges sweeping magnet fuel slowly over time when not in use.',
        baseCost: 400,
        multiplier: 1.9,
        getValueLabel: (lvl) => {
            if (lvl === 0) return 'Inert fuel depletion';
            const val = Math.min(0.40, lvl * 0.04);
            return `Passive recharge (+${val.toFixed(2)}/f)${lvl >= 10 ? ' (Max)' : ''}`;
        }
    }
];

interface ThemeShopItem {
    id: ParticleTheme;
    name: string;
    description: string;
    cost: number;
    colors: string[];
}

const THEME_SHOP_ITEMS: ThemeShopItem[] = [
    {
        id: 'STANDARD',
        name: 'Default Cybernetics',
        description: 'Glow Cyan, Fuchsia pink, and Neon Lime atoms.',
        cost: 0,
        colors: ['#22d3ee', '#fb7185', '#a3e635']
    },
    {
        id: 'NEBULA',
        name: 'Stardust Nebula',
        description: 'Galactic Rose pink, deep Violet purple, and Comet blue.',
        cost: 700,
        colors: ['#f472b6', '#a855f7', '#3b82f6']
    },
    {
        id: 'MATRIX',
        name: 'Hyper-Void Matrix',
        description: 'Malware bright Green, digital Teal, and Amber sparks.',
        cost: 1000,
        colors: ['#22c55e', '#10b981', '#fbbf24']
    },
    {
        id: 'SUPERNOVA',
        name: 'Solar Flare Supernova',
        description: 'Incandescent Solar orange, Crimson, and White Hot plasma.',
        cost: 1500,
        colors: ['#f97316', '#ef4444', '#ffffff']
    }
];

export default function App() {
    const [screen, setScreen] = useState<Screen>('START');
    const [shopReferrer, setShopReferrer] = useState<Screen>('START');
    const [showHelp, setShowHelp] = useState(false);
    const [isMuted, setIsMuted] = useState(() => getMuteState());
    const [isPaused, setIsPaused] = useState(false);
    
    // Onboarding Tutorial state variables
    const [tutorialCompleted, setTutorialCompleted] = useState<boolean>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_tutorial_completed_v3');
            return saved === 'true';
        } catch {
            return false;
        }
    });

    const [tutorialStep, setTutorialStep] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_tutorial_step_v3');
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });

    // Persistent stats
    const [level, setLevel] = useState<number>(() => {
        try {
            const savedCompleted = localStorage.getItem('chain_reaction_tutorial_completed_v3');
            if (savedCompleted !== 'true') return 0;
            const saved = localStorage.getItem('chain_reaction_level_v3');
            return saved ? parseInt(saved, 10) : 1;
        } catch {
            return 0;
        }
    });
    const [totalScore, setTotalScore] = useState(0);
    const [peakCombo, setPeakCombo] = useState(0);
    const [highScore, setHighScore] = useState(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_high_score_v2');
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });

    // Upgrades Currency & Stats
    const [shards, setShards] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_shards_v3');
            return saved ? parseInt(saved, 10) : 30; // Gift 30 shards at start for progression pacing
        } catch {
            return 30;
        }
    });

    const [upgrades, setUpgrades] = useState<StoreUpgrades>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_upgrades_v3');
            return saved ? JSON.parse(saved) : { extraSparks: 0, maxMagnetFuel: 0, magnetPower: 0, sparkRadiusBoost: 0, specialSpawnRate: 0, resonanceDuration: 0, decayResist: 0, comboShardMultiplier: 0, magnetAutopilot: 0 };
        } catch {
            return { extraSparks: 0, maxMagnetFuel: 0, magnetPower: 0, sparkRadiusBoost: 0, specialSpawnRate: 0, resonanceDuration: 0, decayResist: 0, comboShardMultiplier: 0, magnetAutopilot: 0 };
        }
    });

    const [purchasedThemes, setPurchasedThemes] = useState<ParticleTheme[]>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_purchased_themes_v3');
            return saved ? JSON.parse(saved) : ['STANDARD'];
        } catch {
            return ['STANDARD'];
        }
    });

    const [activeTheme, setActiveTheme] = useState<ParticleTheme>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_active_theme_v3');
            return (saved as ParticleTheme) || 'STANDARD';
        } catch {
            return 'STANDARD';
        }
    });

    const [levelHighScores, setLevelHighScores] = useState<Record<number, number>>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_level_scores_v3');
            return saved ? JSON.parse(saved) : {};
        } catch {
            return {};
        }
    });

    // Breakdown for round rewards
    const [earnedShardStats, setEarnedShardStats] = useState<{ base: number; perfect: number; combo: number; darkMatter?: number; total: number } | null>(null);
    
    // Persistent clear streaks
    const [clearStreak, setClearStreak] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_clear_streak_v3');
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });

    // Prestige (Sector Retirement) States
    const [darkMatter, setDarkMatter] = useState<number>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_dark_matter_v1');
            return saved ? parseInt(saved, 10) : 0;
        } catch {
            return 0;
        }
    });

    const [prestigeUpgrades, setPrestigeUpgrades] = useState<PrestigeUpgrades>(() => {
        try {
            const saved = localStorage.getItem('chain_reaction_prestige_upgrades_v1');
            return saved ? JSON.parse(saved) : { catalystCore: 0, tractorPulsar: 0, gridEfficiency: 0, darkMatterConversion: 0 };
        } catch {
            return { catalystCore: 0, tractorPulsar: 0, gridEfficiency: 0, darkMatterConversion: 0 };
        }
    });

    const [showPrestigeOverlay, setShowPrestigeOverlay] = useState(false);

    // Quantum Reactor Overcharge mechanics state variables
    const [slotSpinning, setSlotSpinning] = useState(false);
    const [slotReels, setSlotReels] = useState<string[]>(['⚡ IONIC', '💠 PLAS', '🌀 CRIT']);
    const [slotMultiplier, setSlotMultiplier] = useState(1.0);
    const [slotPayoutMessage, setSlotPayoutMessage] = useState("⚡ STANDBY: CHARGE REACTOR TO MULTIPLY SHARD HARVEST ⚡");
    const [slotHasSpun, setSlotHasSpun] = useState(false);
    const [showPayoutBanner, setShowPayoutBanner] = useState(false);
    const [reactorCharge, setReactorCharge] = useState(0);
    
    const [isNearMissScreen, setIsNearMissScreen] = useState(false);
    const [nearMissSparksPurchased, setNearMissSparksPurchased] = useState(0);
    const [consolationShardsAwarded, setConsolationShardsAwarded] = useState<number | null>(null);

    // Monetization System States & Decoupled APIs
    const [monetizationOpen, setMonetizationOpen] = useState(false);
    const [monetizationReason, setMonetizationReason] = useState<{ item: string; shortage: number } | null>(null);
    const [adActive, setAdActive] = useState(false);
    const [adCountdown, setAdCountdown] = useState(5);
    const [iapActive, setIapActive] = useState(false);
    const [iapPack, setIapPack] = useState<{ name: string; price: string; shards: number } | null>(null);
    const [iapSuccess, setIapSuccess] = useState(false);
    const [floatNotifs, setFloatNotifs] = useState<{ id: number; text: string }[]>([]);

    const addFloatNotif = (text: string) => {
        const id = Date.now() + Math.random();
        setFloatNotifs(prev => [...prev, { id, text }]);
        setTimeout(() => {
            setFloatNotifs(prev => prev.filter(n => n.id !== id));
        }, 3000);
    };

    // DECOUPLED AD SDK INTERCONNECT PROTOCOL
    const triggerRewardedAd = (onRewardCallback: () => void) => {
        initAudio();
        playAlertBeep();
        
        const isNative = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform();
        const plugins = (window as any).Capacitor?.Plugins;

        // If running inside native compiled app with AdMob plugin loaded
        if (isNative && plugins?.AdMob) {
            try {
                const AdMob = plugins.AdMob;
                
                // Listen for ad completion reward
                const rewardListener = AdMob.addListener('onRewardedVideoAdRewarded', () => {
                    playTransactionChord();
                    onRewardCallback();
                    rewardListener.remove();
                });

                AdMob.prepareRewardVideoAd({
                    adId: (window as any).Capacitor.getPlatform() === 'ios'
                        ? 'YOUR-IOS-REWARDED-AD-UNIT-ID' 
                        : 'YOUR-ANDROID-REWARDED-AD-UNIT-ID',
                }).then(() => {
                    AdMob.showRewardVideoAd();
                }).catch((err: any) => {
                    console.error("AdMob preparation failure", err);
                    // Fall back to simulation if native preparation failed
                    runSimulatedAd(onRewardCallback);
                });
                return;
            } catch (err) {
                console.error("Native AdMob execution failed, falling back to simulated ad", err);
            }
        }

        // Web / Local Sandbox Fallback
        runSimulatedAd(onRewardCallback);
    };

    const runSimulatedAd = (onRewardCallback: () => void) => {
        setAdActive(true);
        setAdCountdown(5);
        
        let counter = 5;
        const interval = setInterval(() => {
            counter--;
            setAdCountdown(counter);
            if (counter > 0) {
                playAdTick();
            } else {
                clearInterval(interval);
                setAdActive(false);
                playTransactionChord();
                onRewardCallback();
            }
        }, 1000);
    };

    // DECOUPLED IN-APP PURCHASE PAYMENT GATEWAY INTERCONNECT
    const processInAppPurchase = (pack: { name: string; price: string; shards: number; id: string }, onSuccessCallback: () => void) => {
        initAudio();
        playAlertBeep();

        const isNative = (window as any).Capacitor && (window as any).Capacitor.isNativePlatform();
        const store = (window as any).CdvPurchase?.store || (window as any).store;

        // If running inside native compiled app with In-App Billing loaded
        if (isNative && store) {
            try {
                const productCode = `com.quantum.chainreaction.${pack.id}`;
                
                store.register({
                    id: productCode,
                    type: store.CONSUMABLE || 'consumable'
                });

                store.when(productCode)
                    .approved((transaction: any) => {
                        transaction.verify();
                    })
                    .verified((receipt: any) => {
                        receipt.finish();
                        playTransactionChord();
                        onSuccessCallback();
                    })
                    .cancelled(() => {
                        addFloatNotif("Purchase cancelled");
                    })
                    .error((err: any) => {
                        console.error("IAP Product Error", err);
                        addFloatNotif("Purchase error occurred");
                    });

                store.initialize();
                store.order(productCode);
                return;
            } catch (err) {
                console.error("Native Purchase failed, falling back to simulated purchase", err);
            }
        }

        // Web / Local Sandbox Fallback
        setIapPack(pack);
        setIapActive(true);
        setIapSuccess(false);
        
        setTimeout(() => {
            setIapSuccess(true);
            playTransactionChord();
            setTimeout(() => {
                setIapActive(false);
                setIapPack(null);
                setIapSuccess(false);
                onSuccessCallback();
            }, 1200);
        }, 2000);
    };

    const IAP_PACKS = [
        { id: 'mini', name: 'Mini Shard Cache', price: '$0.99', shards: 1200, label: 'Standard Boost' },
        { id: 'cargo', name: 'Quantum Cargo Core', price: '$2.49', shards: 3500, label: 'Popular Value' },
        { id: 'singularity', name: 'Singularity Core Pack', price: '$4.99', shards: 10000, label: 'Ultimate Surge' }
    ];

    // Save clear streak consistently
    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_clear_streak_v3', clearStreak.toString());
        } catch (e) {
            console.error(e);
        }
    }, [clearStreak]);

    // Dynamic live reporting stats from engine
    const [liveStats, setLiveStats] = useState<GameStats | null>(null);
    const [didWinLast, setDidWinLast] = useState(false);
    const [isPerfectClear, setIsPerfectClear] = useState(false);
    
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const engineRef = useRef<GameEngine | null>(null);

    // Pointer coordinates refs to distinguish a quick tap vs dragging herding herder
    const pointerDownRef = useRef(false);
    const startPosRef = useRef({ x: 0, y: 0, time: 0 });

    const handleScoreUpdate = (stats: GameStats) => {
        setLiveStats(stats);
        
        // Onboarding Tutorial step progression
        if (level === 0 && !tutorialCompleted) {
            if (tutorialStep === 0 && stats.tapped) {
                setTutorialStep(1); // Advance to Step 2
            }
        }
    };

    const handleRoundEnd = (win: boolean, stats: GameStats) => {
        if (level === 0) {
            setDidWinLast(win);
            setLiveStats(stats);
            if (win) {
                // Step 3: Success message after clearing. Award +200 shards!
                setShards(prev => prev + 200);
                setTutorialStep(2); // Set step to 2 (Step 3: success screen)
                playPerfectBonus(); // Play positive feedback audio
            } else {
                // Reset to step 0 on loss to retry
                setTutorialStep(0);
            }
            setScreen('ROUND_OVER');
            return;
        }

        setDidWinLast(win);
        setPeakCombo(prev => Math.max(prev, stats.maxCombo));
        
        const perfect = stats.cleared === stats.totalParticles && stats.totalParticles > 0;
        setIsPerfectClear(perfect);

        // Track and persist sector score attempt
        const attemptScore = stats.cleared * 100 + stats.maxCombo * 50 + (perfect ? 2500 : 0);
        setLevelHighScores(prev => {
            const prevBest = prev[level] || 0;
            if (attemptScore > prevBest) {
                const next = { ...prev, [level]: attemptScore };
                try {
                    localStorage.setItem('chain_reaction_level_scores_v3', JSON.stringify(next));
                } catch (e) {
                    console.error(e);
                }
                return next;
            }
            return prev;
        });

        // Required count to win
        const requiredCount = Math.max(1, Math.floor(stats.totalParticles * (stats.targetPct / 100)));
        const diffRequired = requiredCount - stats.cleared;
        const closeEnough = !win && diffRequired > 0 && diffRequired <= 3;

        if (closeEnough) {
            // Trigger high alert near-miss continue pop!
            setIsNearMissScreen(true);
            playNearMissAlert();
            setEarnedShardStats(null);
            setConsolationShardsAwarded(null);
            setScreen('ROUND_OVER');
            return;
        }

        setIsNearMissScreen(false);

        if (win) {
            if (perfect) {
                playPerfectBonus();
            }

            // Streak advancement! Standard slot machine variable reward schedules
            const currentStreak = clearStreak + 1;
            setClearStreak(currentStreak);

            // Shards payout layout:
            // Base shards, incremented by streak level bonus (+15 shards per active level in consecutive streak!)
            const streakBonus = currentStreak * 15;
            const shardBase = 150 + level * 10 + streakBonus;
            const shardPerfectValue = perfect ? 350 : 0;
            const comboBonusPerHit = 5 + (upgrades.comboShardMultiplier || 0) * 4;
            const shardComboValue = stats.maxCombo * comboBonusPerHit;
            const darkMatterBonus = (stats.darkMatterCleared || 0) * 10;
            const shardTotalGained = shardBase + shardPerfectValue + shardComboValue + darkMatterBonus;

            setEarnedShardStats({
                base: shardBase,
                perfect: shardPerfectValue,
                combo: shardComboValue,
                darkMatter: darkMatterBonus,
                total: shardTotalGained
            });

            // DO NOT award shards yet! They must pull the mutator slot lever to secure and multiply them.
            setSlotHasSpun(false);
            setSlotMultiplier(1.0);
            setSlotPayoutMessage("🎰 CLICK 'PULL LEVER' FOR CASCADE MULTIPLIER! 🎰");
            setShowPayoutBanner(false);

            // Save standard score
            setTotalScore(prev => {
                let scoreGain = stats.cleared * 100 + stats.maxCombo * 50;
                if (perfect) {
                    scoreGain += 2500;
                }
                const nextScore = prev + scoreGain;
                if (nextScore > highScore) {
                    setHighScore(nextScore);
                    try {
                        localStorage.setItem('chain_reaction_high_score_v2', nextScore.toString());
                    } catch (e) {
                        console.error(e);
                    }
                }
                return nextScore;
            });

            // Clear continue count on successful finish
            setNearMissSparksPurchased(0);
        } else {
            // Level completely failed (and was not a Near Miss, or they clicked to forfeit/end)
            setClearStreak(0);
            setEarnedShardStats(null);
            setNearMissSparksPurchased(0);

            // LOSS:
            // Pay consolation shards so failing always feels addictive and releases positive triggers!
            const consolationReward = Math.max(15, Math.floor(stats.cleared * 2.5));
            setConsolationShardsAwarded(consolationReward);
            setShards(prev => prev + consolationReward);
            playDefeatSound(); // Play soft dissonant/minor descending defeat arpeggio!
        }
        setScreen('ROUND_OVER');
    };

    // Save states consistently
    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_shards_v3', shards.toString());
        } catch (e) {
            console.error(e);
        }
    }, [shards]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_level_v3', level.toString());
        } catch (e) {
            console.error(e);
        }
    }, [level]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_tutorial_completed_v3', tutorialCompleted ? 'true' : 'false');
        } catch (e) {
            console.error(e);
        }
    }, [tutorialCompleted]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_tutorial_step_v3', tutorialStep.toString());
        } catch (e) {
            console.error(e);
        }
    }, [tutorialStep]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_upgrades_v3', JSON.stringify(upgrades));
        } catch (e) {
            console.error(e);
        }
    }, [upgrades]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_purchased_themes_v3', JSON.stringify(purchasedThemes));
        } catch (e) {
            console.error(e);
        }
    }, [purchasedThemes]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_active_theme_v3', activeTheme);
        } catch (e) {
            console.error(e);
        }
    }, [activeTheme]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_level_v3', level.toString());
        } catch (e) {
            console.error(e);
        }
    }, [level]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_dark_matter_v1', darkMatter.toString());
        } catch (e) {
            console.error(e);
        }
    }, [darkMatter]);

    useEffect(() => {
        try {
            localStorage.setItem('chain_reaction_prestige_upgrades_v1', JSON.stringify(prestigeUpgrades));
        } catch (e) {
            console.error(e);
        }
    }, [prestigeUpgrades]);

    useEffect(() => {
        if (screen === 'GAME' && canvasRef.current) {
            engineRef.current = new GameEngine(
                canvasRef.current, 
                handleScoreUpdate, 
                handleRoundEnd
            );
            engineRef.current.startLevel(level, upgrades, activeTheme, prestigeUpgrades);
        }
        
        return () => {
            if (engineRef.current) {
                engineRef.current.destroy();
                engineRef.current = null;
            }
        };
    }, [screen, level]);

    const pullSlotLever = () => {
        if (slotSpinning || slotHasSpun || !earnedShardStats) return;
        
        setSlotSpinning(true);
        setSlotHasSpun(false);
        setSlotMultiplier(1.0);
        setSlotPayoutMessage("⚡ INJECTING PARTICLES & MEASURING STABLE HARVEST RESIDUE... ⚡");
        setShowPayoutBanner(false);
        setReactorCharge(0);
        
        const symbols = ['🧬 DECAY', '⚡ IONIC', '💠 PLAS', '🌀 CRIT', '☀️ SOLAR'];
        let ticksCount = 0;

        // Perform fast visual roll iterations matching tactical resonance charge buildup
        const spinInterval = setInterval(() => {
            ticksCount++;
            setReactorCharge(Math.min(100, Math.floor((ticksCount / 12) * 100)));
            // Randomize three reel positions to sound authentic!
            setSlotReels([
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)],
                symbols[Math.floor(Math.random() * symbols.length)]
            ]);
            playSlotSpin();
            if (ticksCount >= 12) {
                clearInterval(spinInterval);
                finishSlotLeverSpin();
            }
        }, 115);
    };

    const finishSlotLeverSpin = () => {
        // High-tension weighted chance generator
        const rand = Math.random() * 100;
        let finalReels: string[] = [];
        let multiplier = 1.0;
        let msg = "";

        if (rand < 7) {
            finalReels = ['☀️ SOLAR', '☀️ SOLAR', '☀️ SOLAR'];
            multiplier = 5.0;
            msg = "⚡ MULTIPLIER CRITICAL JACKPOT: 5.0X HARVEST CORE SECURITISED! ⚡";
        } else if (rand < 20) {
            finalReels = ['🌀 CRIT', '🌀 CRIT', '🌀 CRIT'];
            multiplier = 3.0;
            msg = "🌀 HYPER-VELOCITY COMPRESSION CASCADE: 3.0X DIRECT PAYOUT GOAL! 🌀";
        } else if (rand < 40) {
            finalReels = ['💠 PLAS', '💠 PLAS', '💠 PLAS'];
            multiplier = 2.0;
            msg = "💠 PLASMA STABILITY OVERCHARGE INDEX: 2.0X NET FORCE RATIO! 💠";
        } else if (rand < 65) {
            finalReels = ['⚡ IONIC', '⚡ IONIC', '⚡ IONIC'];
            multiplier = 1.5;
            msg = "⚡ ION BEAM INJECTOR STABILIZED: 1.5X SHARD FLOW ACCORDED! ⚡";
        } else if (rand < 90) {
            const chosenMajor = ['⚡ IONIC', '💠 PLAS', '🌀 CRIT', '☀️ SOLAR'][Math.floor(Math.random() * 4)];
            const chosenOther = ['🧬 DECAY', '⚡ IONIC', '💠 PLAS', '🌀 CRIT', '☀️ SOLAR'].filter(x => x !== chosenMajor)[Math.floor(Math.random() * 4)];
            finalReels = [chosenMajor, chosenMajor, chosenOther];
            multiplier = 1.25;
            msg = "🔮 NEAR-MISS QUANTUM TUNNELING FLUX: +1.25X SHARDS REOVERCLOCKED! 🔮";
        } else {
            // Three unmatching symbols
            finalReels = ['⚡ IONIC', '💠 PLAS', '🧬 DECAY'];
            multiplier = 1.15;
            msg = "🔋 REACTOR GRID STABLE BASELINE: +1.15X RECHARGE MULTIPLIER SECURED! 🔋";
        }

        // Apply visual stop animations left-to-right to build massive expectation tension
        setSlotReels([finalReels[0], '🧬 DECAY', '🧬 DECAY']);
        playSlotStop();

        setTimeout(() => {
            setSlotReels([finalReels[0], finalReels[1], '🧬 DECAY']);
            playSlotStop();
        }, 220);

        setTimeout(() => {
            setSlotReels(finalReels);
            setSlotMultiplier(multiplier);
            setSlotPayoutMessage(msg);
            setSlotSpinning(false);
            setSlotHasSpun(true);
            setShowPayoutBanner(true);
            setReactorCharge(100);

            // Calculate final multiplied reward
            const computedGained = Math.floor((earnedShardStats?.total || 100) * multiplier);
            setShards(prev => prev + computedGained);
            playSlotPayout(multiplier >= 3.0);
        }, 440);
    };

    const buySecondChanceSpark = () => {
        const fee = 50 * (nearMissSparksPurchased + 1);
        if (shards >= fee && engineRef.current) {
            setShards(s => s - fee);
            setNearMissSparksPurchased(n => n + 1);
            setIsNearMissScreen(false);
            engineRef.current.resumeWithExtraSpark();
        }
    };

    const forfeitNearMissRound = () => {
        setIsNearMissScreen(false);
        setClearStreak(0);
        setNearMissSparksPurchased(0);
        
        if (liveStats) {
            const consolationReward = Math.max(15, Math.floor(liveStats.cleared * 2.5));
            setConsolationShardsAwarded(consolationReward);
            setShards(prev => prev + consolationReward);
            playDefeatSound(); // Play defeat arpeggio
        }
        setScreen('ROUND_OVER');
    };

    const pauseGame = () => {
        if (engineRef.current && engineRef.current.started && !isPaused) {
            engineRef.current.started = false;
            setIsPaused(true);
        }
    };

    const resumeGame = () => {
        if (engineRef.current && !engineRef.current.started && isPaused) {
            engineRef.current.started = true;
            setIsPaused(false);
            engineRef.current.loop();
        }
    };

    const restartLevel = () => {
        setIsPaused(false);
        setIsNearMissScreen(false);
        if (engineRef.current) {
            engineRef.current.startLevel(level, upgrades, activeTheme);
        }
    };

    const forfeitActiveGame = () => {
        setIsPaused(false);
        setIsNearMissScreen(false);
        if (engineRef.current) {
            engineRef.current.started = false;
            const stats = engineRef.current.getStats();
            handleRoundEnd(false, stats);
        }
    };

    const startGame = () => {
        initAudio(); // Initialize sound synthesis securely on main player interaction
        setIsPerfectClear(false);
        setIsNearMissScreen(false);
        setConsolationShardsAwarded(null);
        if (screen === 'ROUND_OVER' && !didWinLast) {
            // Retain the current level for retrying!
            setTotalScore(0);
            setPeakCombo(0);
        } else if (screen === 'ROUND_OVER' && didWinLast) {
            setLevel(l => l + 1);
        }
        setScreen('GAME');
    };

    const returnToMainMenu = () => {
        initAudio(); // Initialize audio securely
        if (screen === 'ROUND_OVER' && didWinLast) {
            setLevel(l => l + 1);
        }
        setScreen('START');
    };

    // Advanced Input Handling coordinate calculations
    const handlePointerDown = (e: PointerEvent<HTMLCanvasElement>) => {
        if (!engineRef.current || (liveStats && liveStats.sparksLeft <= 0)) return;
        const rect = e.currentTarget.getBoundingClientRect();
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        pointerDownRef.current = true;
        startPosRef.current = { x, y, time: Date.now() };

        // Start local gravitational magnetic sweeper at click position
        engineRef.current.setMagnet(x, y, true);
    };

    const handlePointerMove = (e: PointerEvent<HTMLCanvasElement>) => {
        if (!pointerDownRef.current || !engineRef.current) return;
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        // Shift active magnet sweep center
        engineRef.current.setMagnet(x, y, true);
    };

    const handlePointerUp = (e: PointerEvent<HTMLCanvasElement>) => {
        if (!pointerDownRef.current || !engineRef.current) return;
        pointerDownRef.current = false;
        
        // Disable magnet on release
        engineRef.current.setMagnet(0, 0, false);

        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const duration = Date.now() - startPosRef.current.time;
        const dx = x - startPosRef.current.x;
        const dy = y - startPosRef.current.y;
        const dist = Math.sqrt(dx*dx + dy*dy);

        // A quick press with minimal hand jitter denotes deployment of trigger spark
        if (duration < 240 && dist < 12) {
            engineRef.current.dropTriggerSpark(x, y);
        }
    };

    const handlePointerLeave = () => {
        if (pointerDownRef.current && engineRef.current) {
            pointerDownRef.current = false;
            engineRef.current.setMagnet(0, 0, false);
        }
    };

    // Drop detonator at current center coords in case of accessibility button click
    const deployManualSpark = () => {
        if (!engineRef.current || !canvasRef.current || (liveStats && liveStats.sparksLeft <= 0)) return;
        const halfWidth = canvasRef.current.width / (2 * (window.devicePixelRatio || 1));
        const halfHeight = canvasRef.current.height / (2 * (window.devicePixelRatio || 1));
        engineRef.current.dropTriggerSpark(halfWidth, halfHeight);
    };

    const shareScore = () => {
        const text = isPerfectClear 
            ? `I hit a PERFECT ALL-CLEAR on Level ${level} of Chain Reaction with a peak combo of ${peakCombo} and Score of ${totalScore}! 🌟💥 Can you beat this dynamic chaos?`
            : `I hit a ${peakCombo}x COMBO with a Score of ${totalScore} on Chain Reaction! Can you handle the chaos? 💥`;
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(() => {
                alert("Score copied! Share on social media!");
            });
        }
    };

    const playPurchaseSound = () => {
        playPurchaseConfirm();
    };

    const resetAllProgress = () => {
        const confirmReset = window.confirm("⚠️ WARNING: THIS WILL PERMANENTLY WIPE ALL YOUR QUANTUM PROGRESS, SHARDS, LEVEL SCORES, UNLOCKED THEMES, AND UPGRADES! ARE YOU SURE?");
        if (confirmReset) {
            try {
                localStorage.removeItem('chain_reaction_high_score_v2');
                localStorage.removeItem('chain_reaction_shards_v3');
                localStorage.removeItem('chain_reaction_upgrades_v3');
                localStorage.removeItem('chain_reaction_purchased_themes_v3');
                localStorage.removeItem('chain_reaction_active_theme_v3');
                localStorage.removeItem('chain_reaction_clear_streak_v3');
                localStorage.removeItem('chain_reaction_level_scores_v3');
                localStorage.removeItem('chain_reaction_level_v3');
            } catch (e) {
                console.error(e);
            }
            
            // Reset React state
            setLevel(1);
            setHighScore(0);
            setShards(30); // reset back to standard 30 gifted starting shards
            setUpgrades({
                extraSparks: 0,
                maxMagnetFuel: 0,
                magnetPower: 0,
                sparkRadiusBoost: 0,
                specialSpawnRate: 0,
                resonanceDuration: 0,
                decayResist: 0,
                comboShardMultiplier: 0,
                magnetAutopilot: 0
            });
            setPurchasedThemes(['STANDARD']);
            setActiveTheme('STANDARD');
            setClearStreak(0);
            setLevelHighScores({});
            setTotalScore(0);
            setPeakCombo(0);
            
            addFloatNotif("REACTOR DATABASES DECLASSIFIED & RESET!");
        }
    };

    // Circle progress indicators setup parameters matching design specs
    const targetProgressSq = liveStats ? Math.min(100, Math.round((liveStats.cleared / liveStats.totalRequired) * 100)) : 0;
    const progressRadius = 22;
    const progressCirc = 2 * Math.PI * progressRadius; // 138.2
    const strokeOffset = progressCirc - (targetProgressSq / 100) * progressCirc;

    // Detect mobile screens or native Capacitor platform
    const isMobileDevice = typeof window !== 'undefined' && (window.innerWidth < 768 || (window as any).Capacitor?.isNativePlatform());

    return (
        <div className={`flex flex-col md:flex-row items-center justify-center bg-[#050505] text-white selection:bg-none font-sans ${
            isMobileDevice 
                ? 'fixed inset-0 w-full h-full p-0 gap-0 overflow-hidden' 
                : 'min-h-screen p-4 gap-8'
        }`}>
            
            {/* Left Column: Tactical Game Dashboard Window */}
            <div className={`w-full relative bg-[#0c0c0e] flex flex-col shadow-2xl transition-all duration-300 ${
                isMobileDevice 
                    ? 'h-full w-full border-0 rounded-none' 
                    : 'max-w-[380px] h-[80vh] min-h-[640px] border-[12px] border-[#1a1a1e] rounded-[48px] overflow-hidden'
            }`}>
                {!isMobileDevice && (
                    <div className="h-6 w-32 bg-[#1a1a1e] absolute top-0 left-1/2 -translate-x-1/2 rounded-b-2xl z-50 pointer-events-none"></div>
                )}
                
                {/* DYNAMIC SCROLLABLE MANUAL OVERLAY FOR MOBILE/COMPACT SCREENS */}
                {showHelp && (
                    <div className="absolute inset-0 flex flex-col p-6 z-50 bg-[#0c0c0e]/98 overflow-y-auto pt-10 select-none scrollbar-none animate-fadeIn">
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                            <button 
                                onClick={() => setShowHelp(false)}
                                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-cyan-400" />
                                BACK TO MAIN
                            </button>
                        </div>
                        
                        {/* MANUAL CONTENT */}
                        <div className="space-y-4 text-left">
                            <div>
                                <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-fuchsia-400 uppercase tracking-tighter leading-none mb-1">
                                    SCI-OPS TACTICAL DIRECTIVE
                                </h2>
                                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                    REACTOR MANUAL & INTEL
                                </p>
                            </div>
                            
                            <p className="text-zinc-400 text-xs leading-relaxed font-medium">
                                Trigger precise kinetic sweeps and herd particle cascades with your gravity magnet. Reactor volatility increases grid speeds exponentially at higher levels.
                            </p>

                            <div className="space-y-2 font-sans text-xs">
                                <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500/15 via-orange-500/5 to-red-500/15 border border-red-500/20 flex gap-3 items-start">
                                    <span className="flex-shrink-0 text-red-400 text-sm animate-pulse">🚨</span>
                                    <div>
                                        <h4 className="font-bold text-red-400 tracking-tight uppercase text-[9px]">100% Sector Clear Required</h4>
                                        <p className="text-[11px] text-zinc-300 leading-normal font-medium">To advance, you must liquidate 100% of the drifting particles! Perfect clearances also yield a massive +2,500 pts and +350 bonus Shards.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e879f9]/20 border border-[#e879f9]/50 flex items-center justify-center text-xs text-[#e879f9] font-black leading-none">
                                        🟣
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-[#e879f9] tracking-tight uppercase text-[10px]">Gravity Pulse Core</h4>
                                        <p className="text-[11px] text-zinc-300 leading-normal">Pulls all shifting atoms closely toward itself during explosions. Creates robust chain reaction nodes.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#facc15]/20 border border-[#facc15]/50 flex items-center justify-center text-xs text-[#facc15] font-black leading-none font-mono">
                                        🟡
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-[#facc15] tracking-tight uppercase text-[10px]">Cross Star Splitter</h4>
                                        <p className="text-[11px] text-zinc-300 leading-normal">Detonates into an 8-axis laser surge comet swarm, igniting volatile elements across long distances.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400 font-bold leading-none">
                                        🟢
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-cyan-400 tracking-tight uppercase text-[10px]">Standard Element</h4>
                                        <p className="text-[11px] text-zinc-300 leading-normal">Molecular drifting cells. Hitboxes shrink and speed increases radically based on current Level.</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-red-950/20 border border-red-500/20">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-400/20 border border-red-500 flex items-center justify-center text-xs text-red-400 font-bold leading-none font-mono">
                                        ✖
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-red-400 tracking-tight uppercase text-[10px]">Anti-Matter Decay Cell</h4>
                                        <p className="text-[11px] text-red-300/90 leading-normal">Heavy atoms spawning at Lvl 2+. They resist sweeps, block split comets, and **instantly extinguish** touching explosions!</p>
                                    </div>
                                </div>

                                <div className="flex gap-3 items-start p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/35">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-400/20 border border-rose-500 flex items-center justify-center text-xs text-rose-400 font-bold leading-none">
                                        🌀
                                    </span>
                                    <div>
                                        <h4 className="font-bold text-rose-400 tracking-tight uppercase text-[10px]">Void Singularity Hazard</h4>
                                        <p className="text-[11px] text-rose-300/90 leading-normal">Swirling crimson hazards at Lvl 3+. They drift slowly, drag standard particles, but **instantly swallow** touching explosions!</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
                
                {/* ONBOARDING TUTORIAL GLASSMORPHIC BANNER */}
                {screen === 'GAME' && level === 0 && !tutorialCompleted && (
                    <div className="absolute top-24 left-4 right-4 z-50 p-4 rounded-2xl bg-[#0f1115]/90 border border-purple-500/40 backdrop-blur-md text-center shadow-[0_0_20px_rgba(168,85,247,0.3)] animate-scaleUp pointer-events-none">
                        <div className="text-[10px] font-black text-purple-400 uppercase tracking-widest mb-1 font-mono">
                            REACTOR TRAINING • SECTOR 0 (STEP {tutorialStep + 1}/2)
                        </div>
                        <p className="text-xs text-white font-bold leading-relaxed">
                            {tutorialStep === 0 
                                ? "Tap anywhere inside the reactor grid to drop a detonator spark and trigger a chain reaction!"
                                : "Hold your mouse/finger on the grid to activate the Gravitational Magnet, herding atoms toward the active explosion!"
                            }
                        </p>
                    </div>
                )}

                {/* START SCREEN */}
                {screen === 'START' && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-10 bg-[#0c0c0e]/95 backdrop-blur-sm select-none">
                        <div className="mb-4 inline-flex items-center justify-center bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 p-3 rounded-full animate-pulse shadow-[0_0_15px_rgba(34,211,238,0.2)]">
                            <Magnet className="w-8 h-8 text-cyan-400" />
                        </div>
                        <h1 className="text-5xl font-black italic mb-2 tracking-tighter bg-gradient-to-br from-cyan-400 via-fuchsia-500 to-yellow-400 text-transparent bg-clip-text drop-shadow-[0_0_15px_rgba(34,211,238,0.3)] leading-none text-center">
                            CHAIN<br/>REACTION
                        </h1>
                        <p className="text-zinc-500 text-xs tracking-widest uppercase mb-10 font-bold">VORTEX EXPANSION EDITION</p>
                        
                        <div className="space-y-3 w-full mb-8">
                            <button 
                                onClick={startGame}
                                className="w-full bg-white text-black py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(255,255,255,0.25)] cursor-pointer"
                            >
                                <Play className="w-5 h-5 fill-black text-black" />
                                START ENGINE
                            </button>

                            {!tutorialCompleted && tutorialStep === 3 ? (
                                <div className="relative w-full">
                                    {/* Bouncing pointing finger above the button */}
                                    <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center animate-bounce-finger pointer-events-none">
                                        <span className="text-3xl filter drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">👇</span>
                                        <span className="text-[10px] font-black text-yellow-400 bg-black/90 px-2 py-0.5 rounded-md border border-yellow-500/30 uppercase tracking-widest leading-none mt-1 font-mono shadow-[0_0_10px_rgba(250,204,21,0.3)]">RESEARCH UPGRADE</span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setShopReferrer('START');
                                            setTutorialStep(4); // Advance to Step 5 (Shop purchase)
                                            setScreen('SHOP');
                                        }}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer animate-pulse-ring border-2 border-yellow-400"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        QUANTUM STORE [ {shards.toLocaleString()} ⚡ ]
                                    </button>
                                </div>
                            ) : (
                                <>
                                    <button 
                                        onClick={() => {
                                            setShopReferrer('START');
                                            setScreen('SHOP');
                                        }}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(245,158,11,0.25)] cursor-pointer"
                                    >
                                        <ShoppingBag className="w-5 h-5" />
                                        QUANTUM STORE [ {shards.toLocaleString()} ⚡ ]
                                    </button>

                                    {tutorialCompleted && (
                                        <button 
                                            onClick={() => {
                                                setShopReferrer('START');
                                                setScreen('PRESTIGE_SHOP');
                                            }}
                                            className="w-full bg-gradient-to-r from-purple-600 to-fuchsia-600 text-white py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.25)] cursor-pointer"
                                        >
                                            <Atom className="w-5 h-5 text-purple-300" />
                                            PRESTIGE VORTEX [ {darkMatter} 🧪 ]
                                        </button>
                                    )}
                                </>
                            )}
                            
                            <button 
                                onClick={() => setShowHelp(!showHelp)}
                                className="w-full bg-[#16161a] border border-zinc-800 text-zinc-300 py-3 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5 hover:bg-zinc-800 active:scale-98 transition-all cursor-pointer"
                            >
                                <HelpCircle className="w-4 h-4" />
                                {showHelp ? 'HIDE SCI-OPS MANUAL' : 'VIEW SCI-OPS MANUAL'}
                            </button>
                        </div>

                        {/* REACTOR ANOMALY PROGRESS TRACKER */}
                        <div className="w-full bg-[#111114]/90 border border-zinc-900 rounded-2xl p-4 text-left space-y-3 mb-6 select-none font-sans max-w-[400px]">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black uppercase text-cyan-400 tracking-wider flex items-center gap-1.5 font-mono">
                                    <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse animate-duration-2000" /> REACTOR ANOMALY SCANNER
                                </span>
                                <span className="text-[9px] font-mono text-zinc-500 uppercase">Sector {level}</span>
                            </div>
                            
                            <div className="space-y-2">
                                {/* Progress bar track */}
                                <div className="relative w-full h-1.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900/60">
                                    <div 
                                        className="h-full bg-gradient-to-r from-cyan-400 via-fuchsia-500 to-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.3)] transition-all duration-500"
                                        style={{ width: `${Math.min(100, Math.max(5, (level / 35) * 100))}%` }}
                                    />
                                </div>
                                
                                {/* Hazard Nodes Grid */}
                                <div className="grid grid-cols-4 gap-1.5 pt-1.5">
                                    {[
                                        { lvl: 2, icon: '🧬', name: 'Decay Cell', desc: 'Resists herding and snuffs out active explosions.' },
                                        { lvl: 3, icon: '🌪️', name: 'Void Anomaly', desc: 'Pulls atoms in and swallows detonator sparks.' },
                                        { lvl: 20, icon: '💥', name: 'Quantum Pulsar', desc: 'Pulsates EM disruption to repel particles and damp explosions.' },
                                        { lvl: 35, icon: '⚛️', name: 'Resonance Dampener', desc: 'Magenta collapsing nodes & gravity event horizons.' }
                                    ].map((hz) => {
                                        const unlocked = level >= hz.lvl;
                                        return (
                                            <div 
                                                key={hz.lvl}
                                                title={unlocked ? hz.desc : `Classified anomaly signature detected. Unlock requirements: Sector ${hz.lvl}`}
                                                className={`p-2 rounded-xl border flex flex-col items-center text-center transition-all duration-300 ${
                                                    unlocked 
                                                        ? 'bg-zinc-900/20 border-cyan-500/20 text-zinc-300 shadow-[0_0_8px_rgba(34,211,238,0.02)]' 
                                                        : 'bg-black/20 border-zinc-900/60 text-zinc-600'
                                                }`}
                                            >
                                                <span className={`text-sm mb-1 select-none transition-transform duration-300 hover:scale-110 ${unlocked ? 'filter drop-shadow-[0_0_4px_rgba(34,211,238,0.35)]' : 'opacity-25 grayscale'}`}>
                                                    {unlocked ? hz.icon : '🔒'}
                                                </span>
                                                <span className={`block text-[7px] font-mono font-black uppercase tracking-wider leading-none ${unlocked ? 'text-zinc-400' : 'text-zinc-650'}`}>
                                                    SEC {hz.lvl}
                                                </span>
                                                <span className={`block text-[8px] font-black leading-tight truncate w-full mt-1.5 uppercase tracking-wide font-sans ${unlocked ? 'text-cyan-400' : 'text-zinc-650 font-bold'}`}>
                                                    {unlocked ? hz.name.split(' ')[0] : 'SECRET'}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>

                        {/* Top Score banner inside Start View */}
                        <div className="text-center">
                            <span className="block text-[10px] text-zinc-500 uppercase tracking-widest font-black">RECORD STANDING</span>
                            <span className="text-xl font-black font-mono text-cyan-400">{highScore.toLocaleString()} pts</span>
                            
                            <button 
                                onClick={resetAllProgress}
                                className="block mt-4 mx-auto text-[9px] text-zinc-650 hover:text-rose-500 font-bold uppercase tracking-widest transition-colors cursor-pointer select-none"
                            >
                                [ ⚠️ RESET SYSTEM DATA ]
                            </button>
                        </div>
                    </div>
                )}

                {/* QUANTUM PRESTIGE SHOP SCREEN */}
                {screen === 'PRESTIGE_SHOP' && (
                    <div className="absolute inset-0 flex flex-col p-6 z-40 bg-[#0c0c0e]/98 overflow-y-auto pt-10 select-none scrollbar-none">
                        
                        {/* Catalysts tracker Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                            <button 
                                onClick={() => setScreen(shopReferrer)}
                                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-purple-400" />
                                BACK
                            </button>

                            <button 
                                onClick={() => {
                                    setShopReferrer('PRESTIGE_SHOP');
                                    setScreen('SHOP');
                                }}
                                className="flex items-center gap-1 text-yellow-400 hover:text-yellow-300 transition-colors text-[9px] font-bold uppercase tracking-wider cursor-pointer bg-yellow-950/20 border border-yellow-500/20 px-2 py-0.5 rounded-lg"
                            >
                                <ShoppingBag className="w-3.5 h-3.5" /> SHARD SHOP
                            </button>

                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 font-bold font-mono text-xs shadow-[0_0_10px_rgba(168,85,247,0.15)] animate-pulse">
                                🧪 {darkMatter} Catalysts
                            </div>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 uppercase tracking-tighter leading-none mb-1">
                                ANOMALY RESEARCH
                            </h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                PERMANENT PRESTIGE UPGRADES
                            </p>
                        </div>

                        {/* PRESTIGE UPGRADES LIST */}
                        <div className="space-y-3 mb-6">
                            {[
                                {
                                    id: 'catalystCore',
                                    name: 'Quantum Catalyst Core',
                                    description: 'Boosts trigger spark expansion radius by +15% per tier (multiplicative).',
                                    icon: Sparkles,
                                    color: '#d946ef',
                                    getLabel: (lvl) => `+${Math.round((Math.pow(1.15, lvl) - 1) * 100)}% Spark Radius`
                                },
                                {
                                    id: 'tractorPulsar',
                                    name: 'Pulsar Tractor Beam',
                                    description: 'Boosts magnetic sweeper herding pull force by +20% per tier (multiplicative).',
                                    icon: Magnet,
                                    color: '#a855f7',
                                    getLabel: (lvl) => `+${Math.round((Math.pow(1.20, lvl) - 1) * 100)}% Pull Force`
                                },
                                {
                                    id: 'gridEfficiency',
                                    name: 'Grid Core Efficiency',
                                    description: 'Reduces standard upgrade costs by 12% per tier (multiplicative).',
                                    icon: Cpu,
                                    color: '#818cf8',
                                    getLabel: (lvl) => `-${Math.round((1 - Math.pow(0.88, lvl)) * 100)}% Cost Reduction`
                                },
                                {
                                    id: 'darkMatterConversion',
                                    name: 'Dark Matter Transmuter',
                                    description: 'Grants a +10% chance per tier for atoms to spawn as radioactive Dark Matter. Clearing them awards +10 bonus shards directly (bypassing multipliers).',
                                    icon: Atom,
                                    color: '#c084fc',
                                    getLabel: (lvl) => `${lvl * 10}% Spawn Chance`
                                }
                            ].map((pItem) => {
                                const currentLvl = (prestigeUpgrades)[pItem.id] || 0;
                                const cost = 1;
                                const currentLvlLabel = pItem.getLabel(currentLvl);

                                return (
                                    <div key={pItem.id} className="p-3.5 rounded-2xl bg-white/5 border border-purple-500/10 flex flex-col gap-2 shadow-[0_0_15px_rgba(168,85,247,0.03)] text-left">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-zinc-800 border border-zinc-700 flex-shrink-0" style={{ color: pItem.color }}>
                                                    <pItem.icon className="w-4 h-4" style={{ fill: pItem.color }} />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xs text-white uppercase tracking-tight flex items-center gap-1.5">
                                                        {pItem.name}
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20 font-mono font-bold leading-none">
                                                            Tier {currentLvl}
                                                        </span>
                                                    </h3>
                                                    <p className="text-[10px] text-zinc-400 leading-tight max-w-[190px]">{pItem.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 gap-2">
                                            <span className="text-[10px] font-mono font-bold text-zinc-500">{currentLvlLabel}</span>
                                            
                                            <button
                                                onClick={() => {
                                                    if (darkMatter >= cost) {
                                                        setDarkMatter(dm => dm - cost);
                                                        setPrestigeUpgrades(prev => ({
                                                            ...prev,
                                                            [pItem.id]: currentLvl + 1
                                                        }));
                                                        playPurchaseConfirm();
                                                        addFloatNotif(`Purchased ${pItem.name} Tier ${currentLvl + 1}!`);
                                                    } else {
                                                        addFloatNotif("Insufficient Dark Matter Catalysts!");
                                                    }
                                                }}
                                                disabled={darkMatter < cost}
                                                className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                                    darkMatter >= cost
                                                        ? 'bg-purple-500 text-white shadow-[0_0_10px_rgba(168,85,247,0.3)] hover:scale-105 active:scale-95 font-bold'
                                                        : 'bg-zinc-800 border border-zinc-700 text-zinc-400 cursor-not-allowed shadow-none'
                                                }`}
                                            >
                                                Spend 1 🧪
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* SHOP SCREEN */}
                {screen === 'SHOP' && (
                    <div className="absolute inset-0 flex flex-col p-6 z-40 bg-[#0c0c0e]/98 overflow-y-auto pt-10 select-none scrollbar-none">
                        
                        {/* Shards tracker Header */}
                        <div className="flex items-center justify-between mb-4 pb-3 border-b border-zinc-800">
                            <button 
                                onClick={() => setScreen(shopReferrer)}
                                className="flex items-center gap-1 text-zinc-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-wider cursor-pointer"
                            >
                                <ChevronLeft className="w-4 h-4 text-cyan-400" />
                                BACK
                            </button>
                            
                            <button 
                                onClick={() => {
                                    setShopReferrer('SHOP');
                                    setScreen('PRESTIGE_SHOP');
                                }}
                                className="flex items-center gap-1 text-purple-400 hover:text-purple-300 transition-colors text-[9px] font-bold uppercase tracking-wider cursor-pointer bg-purple-950/20 border border-purple-500/20 px-2 py-0.5 rounded-lg"
                            >
                                <Atom className="w-3 h-3 text-purple-400" /> PRESTIGE SHOP
                            </button>

                            <div className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-500/10 border border-yellow-500/30 rounded-full text-yellow-400 font-bold font-mono text-xs shadow-[0_0_10px_rgba(250,204,21,0.15)] animate-pulse">
                                <Coins className="w-3.5 h-3.5 text-yellow-400" />
                                {shards.toLocaleString()} ⚡
                            </div>
                        </div>

                        <div className="mb-4">
                            <h2 className="text-xl font-black italic text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-400 uppercase tracking-tighter leading-none mb-1">
                                QUANTUM RESEARCH
                            </h2>
                            <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">
                                UPGRADE POWER-UPS & STYLES
                            </p>
                        </div>

                        {/* UPGRADES MODULES LIST */}
                        <div className="space-y-3 mb-6">
                            {SHOP_ITEMS.map((item) => {
                                const currentLvl = upgrades[item.id] || 0;
                                const isTutorialGift = !tutorialCompleted && tutorialStep === 4 && item.id === 'sparkRadiusBoost';
                                const discount = Math.pow(0.88, prestigeUpgrades.gridEfficiency || 0);
                                const cost = isTutorialGift ? 0 : Math.round(item.baseCost * Math.pow(item.multiplier, currentLvl) * discount);
                                const currentLvlLabel = item.getValueLabel(currentLvl);

                                const isMaxed = 
                                    (item.id === 'extraSparks' && currentLvl >= 7) ||
                                    (item.id === 'specialSpawnRate' && currentLvl >= 10) ||
                                    (item.id === 'decayResist' && currentLvl >= 8) ||
                                    (item.id === 'magnetAutopilot' && currentLvl >= 10);

                                // Icon pairing matcher
                                 const IconComp = 
                                     item.id === 'extraSparks' ? Zap : 
                                     item.id === 'maxMagnetFuel' ? Gauge : 
                                     item.id === 'sparkRadiusBoost' ? Sparkles : 
                                     item.id === 'magnetPower' ? Magnet :
                                     item.id === 'specialSpawnRate' ? Flame :
                                     item.id === 'resonanceDuration' ? Flame :
                                     item.id === 'decayResist' ? Shield :
                                     item.id === 'comboShardMultiplier' ? Coins : Cpu; 

                                return (
                                    <div 
                                        key={item.id} 
                                        className={`p-3.5 rounded-2xl bg-white/5 border flex flex-col gap-2 transition-all relative ${
                                            isTutorialGift 
                                                ? 'border-purple-500/80 bg-purple-950/20 shadow-[0_0_20px_rgba(168,85,247,0.25)] ring-2 ring-purple-500/50' 
                                                : 'border-white/5'
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="flex items-center gap-3">
                                                <div className="p-1.5 rounded-lg bg-zinc-800 text-cyan-400 border border-zinc-700 flex-shrink-0">
                                                    <IconComp className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                                                </div>
                                                <div>
                                                    <h3 className="font-bold text-xs text-white uppercase tracking-tight flex items-center gap-1.5">
                                                        {item.name}
                                                        <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 font-mono font-bold leading-none">
                                                            Tier {currentLvl}
                                                        </span>
                                                    </h3>
                                                    <p className="text-[10px] text-zinc-400 leading-tight max-w-[190px]">{item.description}</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between mt-1 pt-2 border-t border-white/10 gap-2">
                                            <span className="text-[10px] font-mono font-bold text-zinc-500">{currentLvlLabel}</span>
                                            
                                            {isMaxed ? (
                                                <span className="px-2.5 py-1 text-[9px] font-black text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 rounded-lg tracking-widest uppercase">
                                                    MAX LEVEL
                                                </span>
                                            ) : (
                                                <div className="flex items-center gap-2">
                                                    {isTutorialGift && (
                                                        <div className="flex items-center gap-1.5 animate-bounce-finger-left">
                                                            <span className="text-xl">👉</span>
                                                        </div>
                                                    )}
                                                    <button
                                                        onClick={() => {
                                                            if (isTutorialGift) {
                                                                setUpgrades(prev => ({
                                                                    ...prev,
                                                                    sparkRadiusBoost: 1
                                                                }));
                                                                setTutorialCompleted(true);
                                                                setTutorialStep(5);
                                                                setLevel(1);
                                                                playPurchaseSound();
                                                                addFloatNotif("Catalyst Core Active! Reactor Initialized!");
                                                                setScreen('START');
                                                                return;
                                                            }
                                                            if (shards >= cost) {
                                                                setShards(s => s - cost);
                                                                setUpgrades(prev => ({
                                                                    ...prev,
                                                                    [item.id]: currentLvl + 1
                                                                }));
                                                                playPurchaseSound();
                                                                addFloatNotif(`Purchased ${item.name} Tier ${currentLvl + 1}!`);
                                                            } else {
                                                                setMonetizationReason({
                                                                    item: `${item.name} Tier ${currentLvl + 1}`,
                                                                    shortage: cost - shards
                                                                });
                                                                setMonetizationOpen(true);
                                                            }
                                                        }}
                                                        className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all flex items-center gap-1 cursor-pointer ${
                                                            isTutorialGift
                                                                ? 'bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white shadow-[0_0_15px_rgba(168,85,247,0.5)] border border-purple-400 hover:scale-105 active:scale-95 font-bold animate-pulse-ring'
                                                                : shards >= cost
                                                                    ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:scale-105 active:scale-95 font-bold'
                                                                    : 'bg-zinc-800 border border-zinc-700 text-zinc-400 hover:bg-zinc-755 hover:text-yellow-400 hover:scale-105 active:scale-95 shadow-[0_0_10px_rgba(250,204,21,0.05)]'
                                                        }`}
                                                    >
                                                        {isTutorialGift ? '🎁 FREE GIFT' : `${cost} ⚡`}
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* PARTICLE THEMES SHOP MODULE */}
                        <div className="mb-2">
                            <h2 className="text-sm font-black italic text-cyan-400 uppercase tracking-tight leading-none mb-0.5">
                                GLOW MATRIX CORE DECODES
                            </h2>
                            <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mb-2">
                                EXCHANGE CELLS FOR THEMED PARTICLE CODES
                            </p>
                        </div>

                        <div className="space-y-3 mb-6">
                            {THEME_SHOP_ITEMS.map((themeItem) => {
                                const isUnlocked = purchasedThemes.includes(themeItem.id);
                                const isActive = activeTheme === themeItem.id;

                                return (
                                    <div key={themeItem.id} className="p-3.5 rounded-2xl bg-white/5 border border-white/5 flex flex-col gap-2">
                                        <div className="flex items-center justify-between gap-2">
                                            <div>
                                                <h3 className="font-bold text-xs text-white uppercase tracking-tight">{themeItem.name}</h3>
                                                <p className="text-[10px] text-zinc-400 leading-tight max-w-[190px]">{themeItem.description}</p>
                                            </div>
                                            <div className="flex gap-1 p-1 bg-zinc-950/80 rounded-lg border border-zinc-800 flex-shrink-0">
                                                {themeItem.colors.map((color, cIdx) => (
                                                    <div 
                                                        key={cIdx} 
                                                        className="w-3.5 h-3.5 rounded-full shadow-sm"
                                                        style={{ backgroundColor: color, boxShadow: `0 0 6px ${color}50` }}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-end pt-2 border-t border-white/10 mt-1">
                                            {isActive ? (
                                                <span className="px-3 py-1 bg-cyan-500/10 border border-cyan-400/25 rounded-lg text-cyan-400 text-[10px] font-black tracking-wider uppercase flex items-center gap-1 font-bold">
                                                    <Check className="w-3.5 h-3.5 text-cyan-400" /> ACTIVE
                                                </span>
                                            ) : isUnlocked ? (
                                                <button
                                                    onClick={() => {
                                                        setActiveTheme(themeItem.id);
                                                        playPurchaseSound();
                                                    }}
                                                    className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all hover:scale-103 cursor-pointer"
                                                >
                                                    ENGAGE
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => {
                                                        if (shards >= themeItem.cost) {
                                                            setShards(s => s - themeItem.cost);
                                                            setPurchasedThemes(prev => [...prev, themeItem.id]);
                                                            setActiveTheme(themeItem.id);
                                                            playPurchaseSound();
                                                        }
                                                    }}
                                                    disabled={shards < themeItem.cost}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black tracking-wider uppercase transition-all ${
                                                        shards >= themeItem.cost
                                                            ? 'bg-yellow-400 text-black shadow-[0_0_10px_rgba(250,204,21,0.2)] hover:scale-105 active:scale-95 cursor-pointer font-bold'
                                                            : 'bg-zinc-800 text-zinc-500 border border-zinc-700 cursor-not-allowed'
                                                    }`}
                                                >
                                                    UNLOCK ({themeItem.cost} ⚡)
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* LIVE GAMEPLAY HUD */}
                {screen === 'GAME' && liveStats && (
                    <div className="absolute top-10 left-0 right-0 px-6 pointer-events-none z-40 flex justify-between items-center drop-shadow-md">
                        <div className="flex flex-col">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold">Level</span>
                            <span className="text-2xl font-black text-white">{liveStats.level.toString().padStart(2, '0')}</span>
                        </div>

                        {/* Highly responsive radial percentage indicator */}
                        <div className="flex flex-col items-center">
                            <div className="w-14 h-14 rounded-full border-4 border-zinc-900/80 flex items-center justify-center relative bg-slate-950/80">
                                <svg className="absolute inset-0 w-full h-full -rotate-90">
                                    <circle 
                                        cx="24" 
                                        cy="24" 
                                        r="22" 
                                        fill="transparent" 
                                        stroke="#1e293b" 
                                        strokeWidth="4"
                                    />
                                    <circle 
                                        cx="24" 
                                        cy="24" 
                                        r="22" 
                                        fill="transparent" 
                                        stroke={targetProgressSq >= 100 ? '#22c55e' : '#22d3ee'} 
                                        strokeWidth="4"
                                        strokeDasharray={progressCirc}
                                        strokeDashoffset={strokeOffset}
                                        strokeLinecap="round"
                                        style={{ transition: 'stroke-dashoffset 0.35s ease' }}
                                    />
                                </svg>
                                <span className={`text-sm font-black ${targetProgressSq >= 100 ? 'text-green-400 font-black' : 'text-cyan-400 font-black'}`}>
                                    {targetProgressSq}%
                                </span>
                            </div>
                            <span className="text-[8px] uppercase tracking-widest mt-1 text-zinc-400 font-bold">
                                Target: {liveStats.totalRequired}
                            </span>
                        </div>

                        <div className="flex flex-col items-end">
                            <span className="text-[10px] uppercase tracking-widest text-zinc-500 font-bold flex items-center gap-1.5 justify-end">
                                Cleared
                                <button 
                                    onClick={pauseGame}
                                    className="p-1.5 rounded-lg bg-zinc-900/90 border border-zinc-800 text-zinc-400 hover:text-white pointer-events-auto hover:bg-zinc-800 active:scale-90 transition-all cursor-pointer flex items-center justify-center shadow-sm"
                                    title="Pause Game"
                                >
                                    <Pause className="w-3 h-3 text-cyan-400 fill-cyan-400" />
                                </button>
                            </span>
                            <span className="text-2xl font-black text-cyan-400">
                                {liveStats.cleared}<span className="text-xs font-normal text-zinc-500">/{liveStats.totalParticles}</span>
                            </span>
                        </div>
                    </div>
                )}

                {/* State Tracking Guidance overlays */}
                {screen === 'GAME' && liveStats && (
                    <div className="absolute top-28 left-0 right-0 text-center pointer-events-none z-10">
                        {liveStats.combo > 1 && (
                            <span className="inline-block text-3xl font-black text-yellow-400 italic tracking-tighter uppercase drop-shadow-[0_0_10px_rgba(250,204,21,0.7)] animate-bounce">
                                {liveStats.combo}x Combo!
                            </span>
                        )}
                    </div>
                )}

                {/* ACTIVE INTERACTIVE BOTTOM PANEL FOR HERDER MECHANICS */}
                {screen === 'GAME' && liveStats && (
                    <div className="absolute bottom-6 left-6 right-6 pointer-events-none z-40 text-center flex flex-col items-center justify-end">
                        {liveStats.sparksLeft > 0 ? (
                            <div className="flex items-center gap-2.5 justify-center bg-slate-950/85 border border-white/5 px-3.5 py-2 rounded-full backdrop-blur-md max-w-[240px] w-full shadow-lg">
                                <Magnet className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0 animate-pulse" />
                                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                                    <div 
                                        id="magnet-fuel-bar"
                                        className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-75"
                                        style={{ width: `${(liveStats.magnetFuel / liveStats.maxMagnetFuel) * 100}%` }}
                                    />
                                </div>
                                <span 
                                    id="magnet-fuel-text"
                                    className="text-[10px] font-bold font-mono text-yellow-400 flex-shrink-0"
                                >
                                    {Math.round((liveStats.magnetFuel / liveStats.maxMagnetFuel) * 100)}%
                                </span>
                                <span className="text-[9px] text-zinc-500 font-bold flex-shrink-0">
                                    ({liveStats.sparksLeft} ⚡)
                                </span>
                            </div>
                        ) : (
                            <div className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-cyan-950/50 border border-cyan-800/30 backdrop-blur-md text-[10px] font-bold text-cyan-300 uppercase tracking-widest animate-pulse shadow-lg">
                                <Zap className="w-3 h-3 text-cyan-400 fill-cyan-400" /> Systemic reaction cascading...
                            </div>
                        )}
                    </div>
                )}

                {/* ROUND OVER STATUS SCREEN DISPLAY */}
                {/* IN-GAME PAUSE MENU OVERLAY */}
                {screen === 'GAME' && isPaused && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center z-50 bg-[#0c0c0e]/95 backdrop-blur-md select-none animate-fadeIn pointer-events-auto">
                        <div className="mb-4 inline-flex items-center justify-center bg-cyan-900/20 text-cyan-400 border border-cyan-500/30 p-4 rounded-full shadow-[0_0_20px_rgba(34,211,238,0.25)]">
                            <Pause className="w-8 h-8 text-cyan-400 fill-cyan-400 animate-pulse" />
                        </div>
                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1 text-white drop-shadow-[0_0_15px_rgba(34,211,238,0.3)]">
                            REACTOR PAUSED
                        </h2>
                        <p className="text-zinc-500 text-[10px] tracking-widest uppercase mb-10 font-bold">GRID OPERATIONS TEMPORARILY HALTED</p>
                        
                        <div className="space-y-3.5 w-full mb-6">
                            {/* Resume button */}
                            <button 
                                onClick={resumeGame}
                                className="w-full bg-white text-black py-3.5 rounded-xl font-black text-sm flex items-center justify-center gap-2 hover:scale-103 active:scale-97 transition-all shadow-[0_0_15px_rgba(255,255,255,0.15)] cursor-pointer"
                            >
                                <Play className="w-4 h-4 fill-black text-black" />
                                RESUME REACTION
                            </button>

                            {/* Restart level */}
                            <button 
                                onClick={restartLevel}
                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-zinc-800 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                <RotateCcw className="w-4 h-4 text-cyan-400" />
                                RESTART SECTOR
                            </button>

                            {/* Sound Mute Toggle */}
                            <button 
                                onClick={() => {
                                    const muted = toggleMute();
                                    setIsMuted(muted);
                                    playAlertBeep();
                                }}
                                className="w-full bg-zinc-900 border border-zinc-800 text-zinc-200 py-3 rounded-xl text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:bg-zinc-800 active:scale-97 transition-all cursor-pointer"
                            >
                                {isMuted ? (
                                    <>
                                        <VolumeX className="w-4 h-4 text-red-400 animate-pulse" />
                                        UNMUTE COMMS (SOUND OFF)
                                    </>
                                ) : (
                                    <>
                                        <Volume2 className="w-4 h-4 text-emerald-400 animate-bounce" />
                                        MUTE COMMS (SOUND ON)
                                    </>
                                )}
                            </button>

                            {/* Forfeit game */}
                            <button 
                                onClick={forfeitActiveGame}
                                className="w-full bg-red-950/20 border border-red-500/20 text-red-400 py-3 rounded-xl text-xs font-black uppercase tracking-wider hover:bg-red-950/40 active:scale-97 transition-all cursor-pointer flex items-center justify-center gap-2"
                            >
                                Forfeit Sweep
                            </button>
                        </div>
                    </div>
                )}

                {/* IN-GAME NEAR-MISS OVERLAY */}
                {screen === 'GAME' && liveStats && isNearMissScreen && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-50 bg-[#0c0c0e]/95 backdrop-blur-lg select-none overflow-y-auto pointer-events-auto">
                        <div className="w-full flex flex-col items-center">
                            <div className="mb-2 mt-4 inline-flex items-center justify-center p-4 bg-red-950/40 border border-red-500/50 rounded-full animate-bounce">
                                <AlertTriangle className="w-10 h-10 text-red-500 fill-red-500 animate-pulse" />
                            </div>
                            
                            <div className="mb-1 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-500 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">
                                ⚠️ INSTABILITY WARNING ⚠️
                            </div>

                            <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                CRITICAL NEAR-MISS!
                            </h2>
                            
                            <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[270px] mb-4">
                                Grid reached <span className="text-white font-extrabold">{Math.round((liveStats.cleared/liveStats.totalRequired)*100)}%</span> of target progress. Stabilize reactor immediately before gravity collapse!
                            </p>

                            {/* Progress statistics */}
                            <div className="p-3 w-full bg-red-950/10 border border-red-500/20 rounded-2xl mb-4 text-center">
                                <div className="flex justify-between text-xs text-zinc-300 font-bold mb-1">
                                    <span>CELLS DETONATED:</span>
                                    <span className="text-white">{liveStats.cleared} / {liveStats.totalRequired}</span>
                                </div>
                                <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                        style={{ width: `${Math.min(100, (liveStats.cleared / liveStats.totalRequired) * 100)}%` }}
                                    />
                                </div>
                                <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-1.5">COLLAPSE THRESHOLD DETECTED</span>
                            </div>

                            {/* Shards status and buy decision */}
                            <div className="w-full space-y-2.5 mb-2">
                                <button 
                                    onClick={buySecondChanceSpark}
                                    disabled={shards < 50 * (nearMissSparksPurchased + 1)}
                                    className={`w-full py-4 rounded-xl font-extrabold text-sm flex flex-col items-center justify-center gap-0.5 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] ${
                                        shards >= 50 * (nearMissSparksPurchased + 1)
                                            ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:scale-103 active:scale-97 text-black cursor-pointer font-black'
                                            : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                    }`}
                                >
                                    <span className="flex items-center gap-1 uppercase tracking-wider text-xs font-black">
                                        <Zap className="w-4 h-4 text-black fill-black" /> SECURE SECOND-CHANCE SPARK
                                    </span>
                                    <span className="text-[10px] font-bold opacity-80">
                                        Cost: {50 * (nearMissSparksPurchased + 1)} ⚡ (Your Shards: {shards} ⚡)
                                    </span>
                                </button>

                                <button 
                                    onClick={forfeitNearMissRound}
                                    className="w-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700/80 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                                >
                                    💔 FORFEIT SWEEP & EXTRACT CONSOLATION CORES
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ROUND OVER STATUS SCREEN DISPLAY */}
                {screen === 'ROUND_OVER' && liveStats && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-40 bg-[#0c0c0e]/95 backdrop-blur-lg select-none overflow-y-auto">
                        
                        {/* Sector 0 Onboarding Tutorial Success/Failure Overlays */}
                        {level === 0 && !tutorialCompleted ? (
                            didWinLast && tutorialStep === 2 ? (
                                <div className="w-full flex flex-col items-center">
                                    <div className="mb-4 inline-flex items-center justify-center p-4 bg-purple-950/40 border border-purple-500/50 rounded-full animate-bounce shadow-[0_0_20px_rgba(168,85,247,0.3)]">
                                        <Sparkles className="w-10 h-10 text-purple-400 fill-purple-400 animate-pulse" />
                                    </div>
                                    <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">
                                        🏆 LEVEL 0 COMPLETED 🏆
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400 drop-shadow-[0_0_15px_rgba(168,85,247,0.4)]">
                                        REACTOR STABILIZED!
                                    </h2>
                                    <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[270px] mb-6">
                                        Excellent work! You trigger-sparked a perfect sequence cascade and successfully herded all particles using the magnetic sweep core.
                                    </p>
                                    <div className="w-full p-4 mb-8 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
                                        <span className="block text-[8px] font-black text-purple-400 uppercase tracking-widest mb-1">HARVEST BONUS AWARDED</span>
                                        <span className="text-2xl font-black text-yellow-400 font-mono flex items-center justify-center gap-1">
                                            +200 SHARDS ⚡
                                        </span>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            setTutorialStep(3); // Advance to Step 4 (Shop pointer)
                                            setScreen('START');
                                        }}
                                        className="w-full bg-gradient-to-r from-purple-500 to-fuchsia-500 text-white py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(168,85,247,0.3)] cursor-pointer"
                                    >
                                        PROCEED TO RESEARCH LABS <ChevronRight className="w-5 h-5 animate-pulse" />
                                    </button>
                                </div>
                            ) : (
                                <div className="w-full flex flex-col items-center">
                                    <div className="mb-4 inline-flex items-center justify-center p-3 rounded-full bg-rose-950/40 border border-rose-500/30 text-rose-455">
                                        <RotateCcw className="w-8 h-8 text-rose-400" />
                                    </div>
                                    <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2 text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]">
                                        SEQUENCE CRITICAL FAULT!
                                    </h2>
                                    <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[270px] mb-8">
                                        The chain reaction fizzled out before all atoms were neutralized. Let's try again! Remember, drop the detonator spark right in the middle of a dense group of atoms.
                                    </p>
                                    <button 
                                        onClick={startGame}
                                        className="w-full bg-white text-black py-4 rounded-xl font-black text-base flex items-center justify-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] cursor-pointer"
                                    >
                                        <RotateCcw className="w-5 h-5 text-black" /> RE-ENGAGE SEQUENCE
                                    </button>
                                </div>
                            )
                        ) : isNearMissScreen ? (
                            /* HIGH ALERT NEAR-MISS POPUP OVERLAY */
                            <div className="w-full flex flex-col items-center">
                                <div className="mb-2 mt-4 inline-flex items-center justify-center p-4 bg-red-950/40 border border-red-500/50 rounded-full animate-bounce">
                                    <AlertTriangle className="w-10 h-10 text-red-500 fill-red-500 animate-pulse" />
                                </div>
                                
                                <div className="mb-1 inline-flex items-center gap-1.5 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-full text-red-500 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">
                                    ⚠️ INSTABILITY WARNING ⚠️
                                </div>

                                <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-1 text-red-500 drop-shadow-[0_0_15px_rgba(239,68,68,0.4)]">
                                    CRITICAL NEAR-MISS!
                                </h2>
                                
                                <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[270px] mb-4">
                                    Grid reached <span className="text-white font-extrabold">{Math.round((liveStats.cleared/liveStats.totalRequired)*100)}%</span> of target progress. Stabilize reactor immediately before gravity collapse!
                                </p>

                                {/* Progress statistics */}
                                <div className="p-3 w-full bg-red-950/10 border border-red-500/20 rounded-2xl mb-4 text-center">
                                    <div className="flex justify-between text-xs text-zinc-300 font-bold mb-1">
                                        <span>CELLS DETONATED:</span>
                                        <span className="text-white">{liveStats.cleared} / {liveStats.totalRequired}</span>
                                    </div>
                                    <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]"
                                            style={{ width: `${Math.min(100, (liveStats.cleared / liveStats.totalRequired) * 100)}%` }}
                                        />
                                    </div>
                                    <span className="block text-[8px] text-zinc-500 uppercase font-black tracking-widest mt-1.5">COLLAPSE THRESHOLD DETECTED</span>
                                </div>

                                {/* Shards status and buy decision */}
                                <div className="w-full space-y-2.5 mb-2">
                                    <button 
                                        onClick={buySecondChanceSpark}
                                        disabled={shards < 50 * (nearMissSparksPurchased + 1)}
                                        className={`w-full py-4 rounded-xl font-extrabold text-sm flex flex-col items-center justify-center gap-0.5 transition-all shadow-[0_0_20px_rgba(239,68,68,0.15)] ${
                                            shards >= 50 * (nearMissSparksPurchased + 1)
                                                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:scale-103 active:scale-97 text-black cursor-pointer font-black'
                                                : 'bg-zinc-900 text-zinc-600 border border-zinc-800 cursor-not-allowed'
                                        }`}
                                    >
                                        <span className="flex items-center gap-1 uppercase tracking-wider text-xs">
                                            <Zap className="w-4 h-4 text-black fill-black" /> SECURE SECOND-CHANCE SPARK
                                        </span>
                                        <span className="text-[10px] font-bold opacity-80">
                                            Cost: {50 * (nearMissSparksPurchased + 1)} ⚡ (Your Shards: {shards} ⚡)
                                        </span>
                                    </button>

                                    <button 
                                        onClick={forfeitNearMissRound}
                                        className="w-full bg-zinc-800/40 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-zinc-700/80 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                                    >
                                        💔 FORFEIT SWEEP & EXTRACT CONSOLATION CORES
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* STANDARD OR SUCCESS DISPLAY WITH SLOT MACHINE MUTATOR REELS */
                            <div className="w-full flex flex-col items-center">
                                <div className="mb-2 mt-2 inline-flex items-center justify-center p-3 rounded-full border border-white/10">
                                    {isPerfectClear ? (
                                        <div className="bg-yellow-900/20 text-yellow-400 border-yellow-500/30 p-2 rounded-full animate-pulse shadow-[0_0_15px_rgba(250,204,21,0.3)]">
                                            <Zap className="w-8 h-8 text-yellow-400 fill-yellow-400" />
                                        </div>
                                    ) : didWinLast ? (
                                        <div className="bg-lime-900/20 text-lime-400 border-lime-500/30 p-2 rounded-full">
                                            <Zap className="w-8 h-8 text-lime-400 fill-lime-400" />
                                        </div>
                                    ) : (
                                        <div className="bg-rose-900/20 text-rose-400 border-rose-500/30 p-2 rounded-full font-bold font-bold">
                                            <RotateCcw className="w-8 h-8 text-rose-400" />
                                        </div>
                                    )}
                                </div>
                                
                                {isPerfectClear && (
                                    <div className="mb-1 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-yellow-500/10 border border-yellow-400/30 text-yellow-400 font-bold text-[9px] uppercase tracking-widest animate-bounce">
                                        🌟 PERFECT CLEAR BONUS 🌟
                                    </div>
                                )}

                                {/* High-Dopamine Levels Success Streak */}
                                {didWinLast && clearStreak > 0 && (
                                    <div className="mb-1.5 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-orange-500/15 border border-orange-400/30 text-orange-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse shadow-[0_0_10px_rgba(249,115,22,0.15)]">
                                        <Flame className="w-3.5 h-3.5 text-orange-400 fill-orange-400" /> STREAK: {clearStreak} SECTORS CLEARED!
                                    </div>
                                )}

                                <h2 className={`text-4xl font-black italic tracking-tighter uppercase leading-none mb-1 ${
                                    isPerfectClear 
                                        ? 'text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.5)]' 
                                        : didWinLast 
                                            ? 'text-lime-400 drop-shadow-[0_0_15px_rgba(163,230,53,0.4)]' 
                                            : 'text-rose-500 drop-shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                                }`}>
                                    {isPerfectClear ? 'PERFECT ALL-CLEAR!' : didWinLast ? 'LEVEL CLEARED!' : 'TACTICAL FAULT!'}
                                </h2>
                                
                                <p className="text-zinc-500 text-xs font-bold leading-tight max-w-[240px] mb-4">
                                    {isPerfectClear
                                        ? `Systemic sequence perfection! Every single element detonated.`
                                        : didWinLast 
                                            ? `Success! Heavy systemic sequence cascade completed.` 
                                            : `Reaction died prior to clearance objective. Required: ${liveStats.totalRequired}.`}
                                </p>

                                <div className="grid grid-cols-3 gap-2 w-full mb-3">
                                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center relative overflow-hidden">
                                        {isPerfectClear && <div className="absolute inset-0 bg-yellow-400/5 animate-pulse" />}
                                        <span className="block text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">SCORE</span>
                                        <span className="text-base font-black text-cyan-400 font-mono">
                                            {liveStats.cleared * 100 + liveStats.maxCombo * 50 + (isPerfectClear ? 2500 : 0)}
                                        </span>
                                    </div>
                                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center relative overflow-hidden">
                                        <span className="block text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">COMBO</span>
                                        <span className="text-base font-black text-orange-400 italic font-mono">{liveStats.maxCombo}x</span>
                                    </div>
                                    <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center relative overflow-hidden text-center">
                                        <span className="block text-[7px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">BEST</span>
                                        <span className="text-base font-black text-yellow-400 font-mono">
                                            {Math.max(levelHighScores[level] || 0, liveStats.cleared * 100 + liveStats.maxCombo * 50 + (isPerfectClear ? 2500 : 0))}
                                        </span>
                                        {(liveStats.cleared * 100 + liveStats.maxCombo * 50 + (isPerfectClear ? 2500 : 0)) > (levelHighScores[level] || 0) && (
                                            <div className="absolute top-0.5 right-0.5 px-0.5 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-black text-[5px] tracking-widest uppercase animate-pulse">
                                                BEST
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* QUANTUM CORE HARVEST EXTRACTION CONSOLE */}
                                {didWinLast && earnedShardStats && (
                                    <div className="w-full p-4 mb-4 bg-gradient-to-b from-[#0f1115] to-[#08090c] border border-cyan-500/30 rounded-[28px] shadow-[0_0_30px_rgba(34,211,238,0.06)] relative overflow-hidden">
                                        <div className="absolute top-1.5 left-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                                        <div className="absolute top-1.5 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-75" />
                                        <div className="absolute bottom-1.5 left-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-150" />
                                        <div className="absolute bottom-1.5 right-4 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse delay-200" />

                                        <div className="text-center font-black tracking-widest text-[9px] uppercase text-cyan-400 mb-2.5 flex items-center justify-center gap-1.5 select-none font-mono">
                                            <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" /> QUANTUM HARVEST EXTRACTION <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                                        </div>

                                        {/* Core Fluctuation Inductor Cells */}
                                        <div className="grid grid-cols-3 gap-2.5 mb-3 select-none">
                                            {slotReels.map((sym, idx) => {
                                                let badgeStyle = "border-zinc-800 text-zinc-400 bg-zinc-900/50";
                                                if (sym === '🧬 DECAY') badgeStyle = "border-rose-500/40 text-rose-400 bg-rose-950/20 shadow-[0_0_8px_rgba(244,63,94,0.15)]";
                                                else if (sym === '⚡ IONIC') badgeStyle = "border-cyan-500/40 text-cyan-400 bg-cyan-950/20 shadow-[0_0_8px_rgba(6,182,212,0.15)]";
                                                else if (sym === '💠 PLAS') badgeStyle = "border-violet-500/40 text-violet-400 bg-violet-950/20 shadow-[0_0_8px_rgba(139,92,246,0.15)]";
                                                else if (sym === '🌀 CRIT') badgeStyle = "border-amber-500/40 text-amber-400 bg-amber-950/20 shadow-[0_0_8px_rgba(245,158,11,0.15)]";
                                                else if (sym === '☀️ SOLAR') badgeStyle = "border-yellow-500/50 text-yellow-300 bg-yellow-950/30 shadow-[0_0_12px_rgba(234,179,8,0.25)] font-extrabold tracking-wider";

                                                return (
                                                    <div 
                                                        key={idx}
                                                        className="flex flex-col items-center p-2 rounded-2xl bg-black/95 border border-zinc-900/40 relative overflow-hidden"
                                                    >
                                                        <span className="block text-[7px] font-mono text-zinc-650 mb-1">CORE-{String.fromCharCode(idx + 65)}</span>
                                                        <div 
                                                            className={`w-full py-2.5 rounded-lg border text-center text-[10px] font-mono font-black transition-all ${badgeStyle} ${
                                                                slotSpinning ? 'animate-pulse scale-98 border-cyan-400/50' : ''
                                                            }`}
                                                        >
                                                            {sym}
                                                        </div>
                                                        <div className="absolute inset-x-0 bottom-0 h-[1.5px] bg-cyan-400/10 pointer-events-none"></div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Digital stabilization progress meter */}
                                        <div className="mb-3.5 px-3 py-2 bg-black/80 rounded-2xl border border-zinc-900/80">
                                            <div className="flex justify-between items-center text-[8px] font-mono text-zinc-550 mb-1 select-none">
                                                <span>STABILIZATION RATE:</span>
                                                <span className={`${slotSpinning ? 'text-cyan-400 animate-pulse' : 'text-zinc-450'}`}>
                                                    {slotSpinning ? 'FUSING CORE LOG...' : 'STABLE LOCK READY'}
                                                </span>
                                            </div>
                                            {/* Glowing progress line layout */}
                                            <div className="w-full h-2 rounded-full bg-zinc-950 overflow-hidden border border-zinc-900 flex items-center p-[1px]">
                                                <div 
                                                    className="h-full rounded-full transition-all duration-75 bg-gradient-to-r from-cyan-500 via-emerald-400 to-yellow-400 shadow-[0_0_8px_rgba(34,211,238,0.4)]"
                                                    style={{ width: `${reactorCharge}%` }}
                                                />
                                            </div>
                                            <div className="mt-1 flex justify-between items-center font-mono text-[8px] text-zinc-650 select-none">
                                                <span>GRID LOCK: {reactorCharge}%</span>
                                                <span>RES: {slotSpinning ? 'AUTO' : 'STABILIZED'}</span>
                                            </div>
                                        </div>

                                        {/* Multiplier result details and payouts info */}
                                        <div className="text-center">
                                            <p className={`text-[10px] font-extrabold tracking-tight select-none min-h-[16px] mb-2 uppercase ${
                                                slotMultiplier > 1.25 ? 'text-cyan-400 animate-pulse font-black' : 'text-zinc-350'
                                            }`}>
                                                {slotPayoutMessage}
                                            </p>
                                            
                                            <div className="flex justify-between items-center text-[10px] font-mono border-t border-zinc-900 pt-2 text-zinc-400">
                                                <span>Sector Base:</span>
                                                <span className="text-zinc-200">+{earnedShardStats.total} ⚡</span>
                                            </div>
                                            {earnedShardStats.darkMatter ? (
                                                <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                                                    <span>Dark Matter Transmuted:</span>
                                                    <span className="text-fuchsia-400 font-extrabold">+{earnedShardStats.darkMatter} ⚡</span>
                                                </div>
                                            ) : null}
                                            <div className="flex justify-between items-center text-[10px] font-mono text-zinc-400">
                                                <span>Resonance Factor:</span>
                                                <span className="text-cyan-400 font-extrabold">{slotMultiplier.toFixed(2)}x</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs font-black text-cyan-400 border-t border-zinc-900/40 mt-1 pt-1">
                                                <span>MUTATED HARVEST PAYLOAD:</span>
                                                <span className="text-sm font-black text-white bg-cyan-950/30 px-2.5 py-0.5 rounded-lg border border-cyan-500/20">{Math.floor(earnedShardStats.total * slotMultiplier)} ⚡</span>
                                            </div>
                                        </div>

                                        {/* Core stabilization triggers */}
                                        {!slotHasSpun && (
                                            <button 
                                                onClick={pullSlotLever}
                                                disabled={slotSpinning}
                                                className={`w-full mt-3 py-3 rounded-xl font-black text-xs uppercase flex items-center justify-center gap-1.5 transition-all outline-none ${
                                                    slotSpinning 
                                                        ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed border border-zinc-750' 
                                                        : 'bg-gradient-to-r from-cyan-500 to-emerald-500 hover:from-cyan-400 hover:to-emerald-400 text-black shadow-[0_0_20px_rgba(34,211,238,0.25)] hover:scale-103 active:scale-97 cursor-pointer'
                                                }`}
                                            >
                                                <Cpu className={`w-4 h-4 text-black ${slotSpinning ? 'animate-spin' : ''}`} /> ENGAGE CORE RESONATOR
                                            </button>
                                        )}
                                    </div>
                                )}

                                {/* Loss Disguised as a Win flashing rewards */}
                                {!didWinLast && consolationShardsAwarded && (
                                    <div className="w-full p-3.5 mb-4 bg-gradient-to-r from-lime-950/20 via-zinc-900/20 to-lime-950/20 border border-lime-500/20 rounded-2xl text-center shadow-[0_0_12px_rgba(132,204,22,0.1)]">
                                        <span className="inline-block text-[9px] font-black text-lime-400 uppercase tracking-widest animate-bounce mb-1">
                                            🎁 SECURED CONSOLATION EXTRACT 🎁
                                        </span>
                                        <p className="text-xs text-zinc-300 font-bold font-sans">
                                            Liquidated standard cells recovered <span className="text-lime-400 font-black">+{consolationShardsAwarded} Shards</span> directly!
                                        </p>
                                    </div>
                                )}

                                <div className="flex flex-col w-full gap-2.5 mb-4">
                                    {didWinLast && level >= 50 && slotHasSpun ? (
                                        <button 
                                            onClick={() => setShowPrestigeOverlay(true)}
                                            className="w-full py-3.5 rounded-xl font-black text-base flex items-center justify-center gap-2 transition-all outline-none bg-gradient-to-r from-purple-500 to-fuchsia-600 hover:scale-103 active:scale-97 text-white cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.4)] animate-pulse"
                                        >
                                            🚀 RETIRE SECTOR & EXTRACT CATALYST
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={startGame}
                                            disabled={didWinLast && !slotHasSpun}
                                            className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all outline-none ${
                                                didWinLast && !slotHasSpun
                                                    ? 'bg-zinc-800 text-zinc-650 border border-zinc-750 cursor-not-allowed shadow-none'
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
                                    )}

                                    <button 
                                        onClick={returnToMainMenu}
                                        disabled={didWinLast && !slotHasSpun}
                                        className={`w-full py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                                            didWinLast && !slotHasSpun
                                                ? 'bg-zinc-900 text-zinc-600 border-zinc-850 cursor-not-allowed shadow-none'
                                                : 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:bg-zinc-800 active:scale-95'
                                        }`}
                                    >
                                        🏠 RETURN TO MAIN MENU
                                    </button>

                                    <button 
                                        onClick={() => {
                                            setShopReferrer('ROUND_OVER');
                                            setScreen('SHOP');
                                        }}
                                        className="w-full bg-gradient-to-r from-yellow-500 to-amber-500 text-black py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 hover:scale-103 active:scale-97 transition-all cursor-pointer shadow-[0_0_15px_rgba(245,158,11,0.15)]"
                                    >
                                        <ShoppingBag className="w-4 h-4 text-black" /> ENTER UPGRADE SHOP
                                    </button>
                                    
                                    {!didWinLast && (
                                        <button 
                                            onClick={() => {
                                                setMonetizationReason(null);
                                                setMonetizationOpen(true);
                                            }}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-black py-3 rounded-xl font-black text-sm flex items-center justify-center gap-1.5 hover:scale-103 active:scale-97 transition-all cursor-pointer shadow-[0_0_15px_rgba(6,182,212,0.15)] animate-pulse"
                                        >
                                            <Coins className="w-4 h-4 text-black fill-black animate-bounce" /> QUANTUM SHARDS BOOSTER (+250 ⚡ Free)
                                        </button>
                                    )}

                                    <button 
                                        onClick={shareScore}
                                        className="w-full bg-zinc-900 text-zinc-300 py-2.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 border border-zinc-800 hover:bg-zinc-800 active:scale-95 transition-all cursor-pointer"
                                    >
                                        <Share2 className="w-4 h-4" /> TRANSMIT DATA COMMS
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
                
                {/* Active Interactive Physics Rendering Surface */}
                <canvas 
                    ref={canvasRef} 
                    className="w-full h-full flex-grow block touch-none cursor-pointer"
                    onPointerDown={handlePointerDown}
                    onPointerMove={handlePointerMove}
                    onPointerUp={handlePointerUp}
                    onPointerLeave={handlePointerLeave}
                    style={{ visibility: (screen === 'START' || screen === 'SHOP' || screen === 'PRESTIGE_SHOP') ? 'hidden' : 'visible' }}
                />

                {/* BOTTOM PORT STATS DOCK */}
                <div className="h-24 px-6 flex items-center justify-between gap-4 bg-[#111114] border-t border-zinc-900 relative z-40 select-none">
                    <div className="flex-1 flex flex-col justify-center">
                        <span className="text-[10px] uppercase font-bold text-zinc-500">SCORE</span>
                        <span className="text-xl font-black text-white leading-none font-mono tracking-tight">{totalScore.toLocaleString()}</span>
                    </div>

                    {/* Right-aligned deploy triggers indicator lights derived from dynamic reactive specs */}
                    {screen === 'GAME' && liveStats && (
                        <div className="flex items-center gap-3">
                            <div className="flex gap-1.5 mr-1" title={`${liveStats.sparksLeft} triggers remaining`}>
                                {Array.from({ length: liveStats.sparksTotal }).map((_, idx) => (
                                    <div 
                                        key={idx}
                                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                                            idx < liveStats.sparksLeft
                                                ? 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)] border border-cyan-300'
                                                : 'bg-zinc-800 border border-zinc-700'
                                        }`}
                                    />
                                ))}
                            </div>
                            
                            {liveStats.sparksLeft > 0 && (
                                <button 
                                    onClick={deployManualSpark}
                                    className="bg-cyan-500 hover:bg-cyan-400 text-black px-4 py-2.5 rounded-lg text-xs font-black tracking-wider uppercase flex items-center gap-1 shadow-[0_0_15px_rgba(34,211,238,0.4)] transition-all pointer-events-auto active:scale-95 cursor-pointer"
                                    title="Manually deploy a cascade detonator spark at core center details"
                                >
                                    <Zap className="w-3.5 h-3.5 fill-black text-black animate-pulse" /> SPARK
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-white/20 rounded-full"></div>

                {/* Floating Notifications Overlay */}
                <div className="absolute top-16 left-4 right-4 z-50 pointer-events-none flex flex-col gap-2">
                    {floatNotifs.map(n => (
                        <div 
                            key={n.id}
                            className="bg-emerald-500 text-black px-3 py-2 rounded-xl text-xs font-black shadow-[0_0_15px_rgba(16,185,129,0.4)] flex items-center justify-center gap-1.5 animate-bounce"
                        >
                            <span>⚡</span> {n.text}
                        </div>
                    ))}
                </div>

                {/* Quantum Syndicate Portal (Monetization Modal) */}
                {monetizationOpen && (
                    <div className="absolute inset-0 z-50 bg-black/95 backdrop-blur-md flex flex-col justify-between p-6 select-none animate-fadeIn font-sans text-white">
                        
                        {/* SCREEN 1: Fullscreen Rewarded Video Ad Simulator */}
                        {adActive ? (
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <div className="w-20 h-20 rounded-full border-4 border-dashed border-cyan-400 animate-spin flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                                    <Video className="w-8 h-8 text-cyan-400" />
                                </div>
                                <h3 className="text-lg font-black text-white italic uppercase tracking-wider mb-2 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">
                                    STREAMING HARVEST BEACON
                                </h3>
                                <p className="text-[9px] text-zinc-500 uppercase tracking-widest font-bold mb-8">
                                    SECURE QUANTUM CHANNEL CONNECTED
                                </p>
                                <div className="text-6xl font-black text-yellow-400 font-mono tracking-tighter mb-4 animate-pulse">
                                    {adCountdown}s
                                </div>
                                <p className="text-[9px] text-zinc-400 font-medium max-w-[200px] leading-relaxed uppercase tracking-wider font-sans">
                                    Do not disconnect transmitter grid. Shards will arrive shortly...
                                </p>
                            </div>
                        ) : iapActive ? (
                            /* SCREEN 2: Stripe-like simulated IAP Checkout card overlay */
                            <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                                <div className="w-full max-w-[280px] bg-zinc-900/90 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden">
                                    <div className="absolute -top-12 -left-12 w-24 h-24 bg-fuchsia-500/10 rounded-full blur-2xl"></div>
                                    <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-yellow-400/10 rounded-full blur-2xl"></div>
                                    
                                    <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-3">
                                        <div className="flex items-center gap-1.5 text-zinc-400">
                                            <CreditCard className="w-4 h-4" />
                                            <span className="text-[10px] font-black uppercase tracking-wider">SECURE CHECKOUT</span>
                                        </div>
                                        <span className="text-[10px] font-mono text-zinc-500">v3.42</span>
                                    </div>
                                    
                                    {iapSuccess ? (
                                        <div className="py-6 flex flex-col items-center justify-center animate-scaleUp">
                                            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border-2 border-emerald-400 flex items-center justify-center mb-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                                                <span className="text-2xl text-emerald-400 font-bold">✓</span>
                                            </div>
                                            <h4 className="text-sm font-black text-white uppercase tracking-wider mb-1">TRANSACTION COMPLETE</h4>
                                            <p className="text-[10px] text-emerald-400 font-bold font-mono">+{iapPack?.shards} SHARDS AUTHORIZED</p>
                                        </div>
                                    ) : (
                                        <div className="py-6 flex flex-col items-center justify-center">
                                            <div className="w-12 h-12 rounded-full border-2 border-t-yellow-400 border-r-zinc-700 border-b-zinc-700 border-l-zinc-700 animate-spin flex items-center justify-center mb-4"></div>
                                            <h4 className="text-sm font-black text-zinc-300 uppercase tracking-wider mb-1">PROCESSING</h4>
                                            <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold font-mono">DECRYPTING PACK CODES</p>
                                            <div className="mt-4 p-2.5 bg-zinc-950 rounded-xl w-full text-left border border-zinc-800">
                                                <div className="flex justify-between text-[9px] text-zinc-400 uppercase font-black leading-none">
                                                    <span>{iapPack?.name}</span>
                                                    <span className="text-white font-mono">{iapPack?.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            /* SCREEN 3: Main Quantum Syndicate Selection */
                            <div className="flex-grow flex flex-col justify-between h-full">
                                <div>
                                    {/* Header & Logo */}
                                    <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-5">
                                        <div className="flex items-center gap-1.5">
                                            <Coins className="w-5 h-5 text-yellow-400 fill-yellow-400/20" />
                                            <span className="text-xs font-black uppercase text-zinc-400 tracking-wider">QUANTUM SYNDICATE</span>
                                        </div>
                                        <div className="bg-yellow-400/10 border border-yellow-400/20 text-yellow-400 px-2 py-0.5 rounded-lg text-[9px] font-bold font-mono">
                                            {shards.toLocaleString()} ⚡
                                        </div>
                                    </div>

                                    {/* Warning alert & context of deficit */}
                                    {monetizationReason ? (
                                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-red-500/15 via-zinc-900 to-red-500/10 border border-red-500/25 shadow-[0_0_15px_rgba(239,68,68,0.05)] mb-6 text-center">
                                            <div className="text-red-400 font-bold uppercase text-[10px] tracking-wider mb-1 animate-pulse flex items-center justify-center gap-1">
                                                <span>⚠️</span> CRITICAL DEPLETION
                                            </div>
                                            <p className="text-[11px] text-zinc-300 leading-normal font-sans">
                                                You require <span className="text-yellow-400 font-bold font-mono">+{monetizationReason.shortage.toLocaleString()} ⚡</span> Shards to unlock <span className="text-white font-bold">{monetizationReason.item}</span>.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-zinc-900 to-emerald-500/10 border border-cyan-500/25 shadow-[0_0_15px_rgba(34,211,238,0.05)] mb-6 text-center">
                                            <div className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider mb-1 animate-pulse flex items-center justify-center gap-1">
                                                <span>⚡</span> HARVEST BEACON AMPLIFIER
                                            </div>
                                            <p className="text-[11px] text-zinc-300 leading-normal font-sans">
                                                Engage backup comms or purchase quantum packs to instantly supercharge your grid reserves.
                                            </p>
                                        </div>
                                    )}

                                    {/* Option 1: Watch Rewarded Ad Option */}
                                    <div className="mb-6">
                                        <button
                                            onClick={() => {
                                                triggerRewardedAd(() => {
                                                    setShards(s => s + 250);
                                                    addFloatNotif("+250 Shards Received!");
                                                    setMonetizationOpen(false);
                                                });
                                            }}
                                            className="w-full bg-gradient-to-r from-cyan-500 to-emerald-500 text-black py-4 rounded-xl font-black text-xs flex items-center justify-center gap-2 hover:scale-102 active:scale-98 transition-all cursor-pointer shadow-[0_0_20px_rgba(6,182,212,0.25)] border-none"
                                        >
                                            <Video className="w-4 h-4 fill-black text-black" /> WATCH AD COMMS (+250 ⚡ FREE)
                                        </button>
                                        <p className="text-[9px] text-zinc-500 text-center font-bold uppercase tracking-wider mt-1.5">
                                            WATCH A SECURE 5S VIDEO TRANSMISSION FOR SHARDS
                                        </p>
                                    </div>

                                    {/* Option 2: Shard credit packages list */}
                                    <div className="space-y-2.5">
                                        <div className="text-[9px] text-zinc-500 font-black uppercase tracking-widest mb-1.5 border-b border-zinc-900 pb-1">
                                            QUANTUM SHARD CORES
                                        </div>
                                        {IAP_PACKS.map(pack => (
                                            <button
                                                key={pack.id}
                                                onClick={() => {
                                                    processInAppPurchase(pack, () => {
                                                        setShards(s => s + pack.shards);
                                                        addFloatNotif(`+${pack.shards.toLocaleString()} Shards Added!`);
                                                        setMonetizationOpen(false);
                                                    });
                                                }}
                                                className="w-full bg-zinc-900/60 hover:bg-zinc-800/80 border border-zinc-800 rounded-2xl p-3 flex justify-between items-center transition-all hover:scale-102 active:scale-98 text-left cursor-pointer group"
                                            >
                                                <div className="flex flex-col">
                                                    <span className="text-[11px] font-black text-white group-hover:text-yellow-400 transition-colors uppercase leading-none mb-1">
                                                        {pack.name}
                                                    </span>
                                                    <span className="text-[9px] text-zinc-500 font-bold uppercase">
                                                        {pack.label}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2.5">
                                                    <span className="text-[10px] font-black text-yellow-400 font-mono bg-yellow-400/10 border border-yellow-400/20 px-2 py-0.5 rounded-lg">
                                                        +{pack.shards.toLocaleString()} ⚡
                                                    </span>
                                                    <span className="text-[10px] font-bold text-zinc-400 bg-zinc-800 border border-zinc-700 px-2 py-0.5 rounded-lg font-mono">
                                                        {pack.price}
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Footer & Cancel button */}
                                <button
                                    onClick={() => setMonetizationOpen(false)}
                                    className="w-full bg-zinc-950 border border-zinc-800 text-zinc-400 py-3 rounded-xl text-xs font-black tracking-widest uppercase hover:bg-zinc-900 hover:text-white active:scale-98 transition-all cursor-pointer mt-6"
                                >
                                    RETURN TO REACTOR GRID
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Right Column: Dynamic Tactical Manual explaining elements */}
            <div className="hidden md:block w-full max-w-[380px] space-y-4 select-none">
                <div className="p-6 rounded-[36px] bg-[#0c0c0e] border border-zinc-800/80 shadow-xl flex flex-col relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-400/5 rounded-full blur-2xl pointer-events-none"></div>
                    <div className="absolute bottom-0 left-0 w-24 h-24 bg-fuchsia-500/5 rounded-full blur-2xl pointer-events-none"></div>
                    
                    <h2 className="text-lg font-black text-white italic tracking-tight mb-1 bg-gradient-to-r from-cyan-400 to-fuchsia-400 text-transparent bg-clip-text">
                        SCI-OPS TACTICAL DIRECTIVE
                    </h2>
                    <p className="text-xs text-zinc-400 mb-4 leading-relaxed">
                        Precision kinetic triggers and group alignment herding sweep. Increase level speeds force faster tactics. Spend Quantum Shards in the Shop to stabilize your reactor grid.
                    </p>

                    <div className="space-y-2 font-sans text-xs">
                        {/* Perfect Clearance Requirement Section */}
                        <div className="p-2.5 rounded-xl bg-gradient-to-r from-red-500/15 via-orange-500/5 to-red-500/15 border border-red-500/20 flex gap-3 items-start shadow-[0_0_10px_rgba(239,68,68,0.05)]">
                            <span className="flex-shrink-0 text-red-400 animate-pulse text-sm">🚨</span>
                            <div>
                                <h4 className="font-bold text-red-400 tracking-tight uppercase text-[9px]">100% Sector Clear Required</h4>
                                <p className="text-[11px] text-zinc-300 leading-normal font-medium">To advance to the next level, you MUST liquidate 100% of the drifting particles! Perfect clearances also yield a massive +2,500 pts and +350 bonus Shards.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#e879f9]/20 border border-[#e879f9]/50 flex items-center justify-center text-xs text-[#e879f9] font-black leading-none">
                                🟣
                            </span>
                            <div>
                                <h4 className="font-bold text-[#e879f9] tracking-tight uppercase text-[10px]">Gravity Pulse Core</h4>
                                <p className="text-[11px] text-zinc-300 leading-normal">Pulls all shifting atoms closely toward itself during explosions. Creates robust chain reaction nodes.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-[#facc15]/20 border border-[#facc15]/50 flex items-center justify-center text-xs text-[#facc15] font-black leading-none font-mono">
                                🟡
                            </span>
                            <div>
                                <h4 className="font-bold text-[#facc15] tracking-tight uppercase text-[10px]">Cross Star Splitter</h4>
                                <p className="text-[11px] text-zinc-300 leading-normal">Detonates into an 8-axis laser surge comet swarm, igniting volatile elements across long distances.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-white/5 border border-white/5">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-400/20 border border-cyan-400/50 flex items-center justify-center text-xs text-cyan-400 font-bold leading-none">
                                🟢
                            </span>
                            <div>
                                <h4 className="font-bold text-cyan-400 tracking-tight uppercase text-[10px]">Standard Element</h4>
                                <p className="text-[11px] text-zinc-300 leading-normal">Molecular drifting cells. Hitboxes shrink and speed increases radically based on current Level.</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-red-950/20 border border-red-500/20">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-400/20 border border-red-500 flex items-center justify-center text-xs text-red-400 font-bold leading-none font-mono">
                                ✖
                            </span>
                            <div>
                                <h4 className="font-bold text-red-400 tracking-tight uppercase text-[10px]">Anti-Matter Decay Cell</h4>
                                <p className="text-[11px] text-red-300/90 leading-normal">Inert, heavy atoms spawning at Lvl 2+. They resist magnet sweeps, block split comets, and **instantly extinguish** touching explosions!</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-rose-950/30 border border-rose-500/35">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-rose-400/20 border border-rose-500 flex items-center justify-center text-xs text-rose-400 font-bold leading-none">
                                🌀
                            </span>
                            <div>
                                <h4 className="font-bold text-rose-400 tracking-tight uppercase text-[10px]">Void Singularity Hazard</h4>
                                <p className="text-[11px] text-rose-300/90 leading-normal">Swirling crimson gravitational anomalies at Lvl 3+. They drift slowly, drag standard particles gently, but **instantly swallow** touching explosions, collapsing adjacent ones!</p>
                            </div>
                        </div>

                        <div className="flex gap-3 items-start p-2.5 rounded-xl bg-orange-950/20 border border-orange-500/20">
                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-orange-400/20 border border-orange-500 flex items-center justify-center text-xs text-orange-400 font-bold leading-none">
                                🌪️
                            </span>
                            <div>
                                <h4 className="font-bold text-orange-400 tracking-tight uppercase text-[10px]">Gravity Turbulence Wave</h4>
                                <p className="text-[11px] text-orange-300/90 leading-normal">Periodic ionic re-entry waves at Lvl 3+. They sweep across the canvas, shearing and layout-disrupting herded element groups!</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Sub HUD cells info */}
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-center flex flex-col justify-center">
                        <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">SHARDS SHIELD</span>
                        <span className="text-sm font-black text-yellow-400 font-mono tracking-tighter leading-none flex items-center justify-center gap-0.5">
                            <Coins className="w-3 h-3 text-yellow-400 inline" /> {shards.toLocaleString()}
                        </span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-center flex flex-col justify-center">
                        <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">TOP COMBO</span>
                        <span className="text-lg font-black text-yellow-500 italic font-mono tracking-tighter leading-none">{peakCombo ? `${peakCombo}X` : '---'}</span>
                    </div>
                    <div className="p-3 rounded-2xl bg-[#0c0c0e] border border-zinc-800/80 text-center flex flex-col justify-center">
                        <span className="block text-[8px] font-bold text-zinc-500 uppercase tracking-widest leading-none mb-1">LEVEL PEAK</span>
                        <span className="text-lg font-black text-cyan-400 font-mono tracking-tighter leading-none">{level.toString().padStart(2, '0')}</span>
                    </div>


                {/* CELEBRATORY SECTOR RETIREMENT OVERLAY */}
                {showPrestigeOverlay && (
                    <div className="absolute inset-0 z-50 flex flex-col items-center justify-center p-6 text-center bg-black/95 backdrop-blur-xl select-none overflow-y-auto">
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(168,85,247,0.15),transparent_70%)] pointer-events-none animate-pulse"></div>
                        
                        <div className="mb-4 inline-flex items-center justify-center p-4 bg-purple-950/40 border border-purple-500/40 rounded-full animate-bounce shadow-[0_0_25px_rgba(168,85,247,0.4)]">
                            <Atom className="w-12 h-12 text-purple-400 animate-spin" />
                        </div>
                        
                        <div className="mb-2 inline-flex items-center gap-1.5 px-3 py-1 bg-purple-500/10 border border-purple-500/30 rounded-full text-purple-400 font-extrabold text-[10px] uppercase tracking-widest animate-pulse">
                            🌟 CONSTELLATION CONQUERED 🌟
                        </div>

                        <h2 className="text-3xl font-black italic tracking-tighter uppercase leading-none mb-2 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-fuchsia-500 to-indigo-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                            SECTOR RETIREMENT
                        </h2>
                        
                        <p className="text-zinc-400 text-xs font-bold leading-relaxed max-w-[280px] mb-6">
                            Excellent work, Commander! You have conquered the grid limits of <span className="text-white font-extrabold">Sector 50</span>. The reactor requires reset to synthesize dark matter.
                        </p>

                        {/* Career Stats summary */}
                        <div className="p-4 w-full bg-purple-950/10 border border-purple-500/20 rounded-2xl mb-6 text-left space-y-2">
                            <div className="text-center font-black tracking-widest text-[9px] uppercase text-purple-400 mb-1 border-b border-purple-500/20 pb-1">
                                REACTOR CAREER SUMMARY
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300 font-bold">
                                <span>MAX SECTOR REACHED:</span>
                                <span className="text-white">Sector 50</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300 font-bold">
                                <span>PEAK REACTION COMBO:</span>
                                <span className="text-yellow-400 font-mono">{peakCombo}x</span>
                            </div>
                            <div className="flex justify-between text-xs text-zinc-300 font-bold">
                                <span>DARK MATTER REWARD:</span>
                                <span className="text-purple-400 font-extrabold flex items-center gap-1">
                                    +1 🧪 CATALYST
                                </span>
                            </div>
                        </div>

                        {/* Decisions */}
                        <div className="w-full space-y-2.5">
                            <button 
                                onClick={() => {
                                    // Reset standard progress:
                                    setLevel(1);
                                    setUpgrades({ 
                                        extraSparks: 0, 
                                        maxMagnetFuel: 0, 
                                        magnetPower: 0, 
                                        sparkRadiusBoost: 0, 
                                        specialSpawnRate: 0, 
                                        resonanceDuration: 0, 
                                        decayResist: 0, 
                                        comboShardMultiplier: 0, 
                                        magnetAutopilot: 0 
                                    });
                                    setShards(30);
                                    setDarkMatter(dm => dm + 1);
                                    setShowPrestigeOverlay(false);
                                    setScreen('START');
                                    playTransactionChord();
                                }}
                                className="w-full py-4 rounded-xl font-black text-sm flex flex-col items-center justify-center gap-0.5 bg-gradient-to-r from-purple-500 to-indigo-650 hover:scale-103 active:scale-97 text-white cursor-pointer shadow-[0_0_25px_rgba(168,85,247,0.35)]"
                            >
                                <span className="flex items-center gap-1 uppercase tracking-wider text-xs font-black">
                                    🌌 RETIRE SECTOR & RESET PROGRESS
                                </span>
                                <span className="text-[9px] font-bold opacity-80 uppercase tracking-widest">
                                    RESETS SHARDS TO 30 & UPGRADES TO TIER 0
                                </span>
                            </button>

                            <button 
                                onClick={() => setShowPrestigeOverlay(false)}
                                className="w-full bg-zinc-900/40 hover:bg-zinc-800 text-zinc-400 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border border-zinc-800 active:scale-95 transition-all cursor-pointer uppercase tracking-wider"
                            >
                                🪐 STAY IN SECTOR 50 FOR NOW
                            </button>
                        </div>
                    </div>
                )}                </div>
            </div>

        </div>
    );
}
