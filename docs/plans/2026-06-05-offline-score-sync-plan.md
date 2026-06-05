# Offline Score Queue & Sync Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Store unsubmitted scores locally in a queue when the user is offline, and automatically upload them once they reconnect.

**Architecture:** Add local storage utilities for queueing, a queue synchronization engine `processOfflineQueue` bound to browser online events and app mounts, and logic to queue failed score transmissions while resetting the current run score state.

**Tech Stack:** React 19, TypeScript, Supabase JS Client, browser local storage.

---

### Task 1: Offline Queue Utilities & Main App Mount Integration

**Files:**
- Modify: [src/App.tsx](file:///c:/Users/David%20Glasser/Projects/Chain%20Reaction/src/App.tsx)

**Step 1.1: Add Offline Transmission Interface & Helper Functions**
* Insert the type definition and storage functions near the top of the file, just below imports:
```typescript
interface PendingTransmission {
    player_tag: string;
    score: number;
    highest_sector: number;
    type: 'arcade' | 'career';
    timestamp: number;
}

const getOfflineQueue = (): PendingTransmission[] => {
    try {
        const queue = localStorage.getItem('chain_reaction_pending_transmissions_v3');
        return queue ? JSON.parse(queue) : [];
    } catch {
        return [];
    }
};

const saveOfflineQueue = (queue: PendingTransmission[]) => {
    try {
        localStorage.setItem('chain_reaction_pending_transmissions_v3', JSON.stringify(queue));
    } catch (e) {
        console.error(e);
    }
};
```

**Step 1.2: Add processOfflineQueue logic inside App component**
* Insert the synchronization engine method inside the `App` component right after `addFloatNotif` (around line 452):
```typescript
    const processOfflineQueue = async () => {
        const queue = getOfflineQueue();
        if (queue.length === 0) return;

        const remainingQueue: PendingTransmission[] = [];
        let processedCount = 0;

        for (const item of queue) {
            if (processedCount > 0 && remainingQueue.length > 0) {
                remainingQueue.push(item);
                continue;
            }

            try {
                const success = await submitRanking({
                    player_tag: item.player_tag,
                    score: item.score,
                    highest_sector: item.highest_sector,
                    type: item.type
                });

                if (success) {
                    processedCount++;
                    addFloatNotif(`📡 SYNCED: ${item.type.toUpperCase()} RECORD OF ${item.score.toLocaleString()} PTS UPLOADED!`);
                } else {
                    remainingQueue.push(item);
                }
            } catch (e) {
                console.error('Failed to sync queued item:', e);
                remainingQueue.push(item);
            }
        }

        saveOfflineQueue(remainingQueue);
    };
```

**Step 1.3: Hook up Mount and Online Event Listeners**
* Locate the start screen lifecycle hooks block (around line 800) and add a startup/online mount listener `useEffect`:
```typescript
    useEffect(() => {
        processOfflineQueue();

        window.addEventListener('online', processOfflineQueue);
        return () => {
            window.removeEventListener('online', processOfflineQueue);
        };
    }, []);
```

**Step 1.4: Verify TypeScript compilation**
* Run: `npx tsc --noEmit`
* Expected output: SUCCESS

**Step 1.5: Commit**
```bash
git add src/App.tsx
git commit -m "feat: implement offline queue storage and synchronization engine"
```

---

### Task 2: Update submitArcadeScore helper to support local queue fallback

**Files:**
- Modify: [src/App.tsx](file:///c:/Users/David%20Glasser/Projects/Chain%20Reaction/src/App.tsx)

**Step 2.1: Refactor submitArcadeScore to queue failed submissions**
* Update `submitArcadeScore` (around line 456) to append to the offline queue and notify when offline:
```typescript
    const submitArcadeScore = async (score: number, tag: string, sector: number): Promise<boolean> => {
        let isGlobalTop10 = false;
        try {
            const topRankings = await getTopRankings('arcade');
            if (topRankings.length < 10 || (topRankings.length > 0 && score > topRankings[topRankings.length - 1].score)) {
                isGlobalTop10 = true;
            }
        } catch (e) {
            console.error('Error checking global top 10:', e);
        }

        const isPersonalBest = score >= highScore && score > 0;

        const success = await submitRanking({
            player_tag: tag.toUpperCase(),
            score: score,
            highest_sector: sector,
            type: 'arcade'
        });

        if (success) {
            if (isPersonalBest && isGlobalTop10) {
                addFloatNotif(`🏆👑 NEW PB & GLOBAL TOP 10! RUN OF ${score.toLocaleString()} PTS TRANSMITTED!`);
            } else if (isPersonalBest) {
                addFloatNotif(`🏆 NEW PERSONAL BEST! RUN OF ${score.toLocaleString()} PTS TRANSMITTED!`);
            } else if (isGlobalTop10) {
                addFloatNotif(`👑 GLOBAL TOP 10! RUN OF ${score.toLocaleString()} PTS TRANSMITTED!`);
            }
        } else {
            // Queue failed score locally
            const queue = getOfflineQueue();
            queue.push({
                player_tag: tag.toUpperCase(),
                score: score,
                highest_sector: sector,
                type: 'arcade',
                timestamp: Date.now()
            });
            saveOfflineQueue(queue);
            addFloatNotif("📡 OFFLINE - SCORE QUEUED FOR SYNC");
        }

        return success;
    };
```

**Step 2.2: Ensure all failure blocks clean runScore**
* In the `handleRoundEnd` failure block (around line 770), ensure `setRunScore(0)` runs on both success and fail (since the failed score is queued safely):
```typescript
            if (runScore > 0) {
                if (pilotTag && pilotTag.trim().length > 0) {
                    submitArcadeScore(runScore, pilotTag, level).then(() => {
                        setRunScore(0);
                    });
                } else {
                    setShowTagPrompt(true);
                    setTagInput('');
                }
            }
```

* In `forfeitNearMissRound` (around line 1010):
```typescript
        if (runScore > 0) {
            if (pilotTag && pilotTag.trim().length > 0) {
                submitArcadeScore(runScore, pilotTag, level).then(() => {
                    setRunScore(0);
                });
            } else {
                setShowTagPrompt(true);
                setTagInput('');
            }
        }
```

* In the prestige retirement confirmation button click handler (around line 2865):
```typescript
                                    if (runScore > 0) {
                                        if (pilotTag && pilotTag.trim().length > 0) {
                                            setLeaderboardSubmitting(true);
                                            submitArcadeScore(runScore, pilotTag, level).then(() => {
                                                setLeaderboardSubmitting(false);
                                                setRunScore(0);
                                                
                                                // Execute Reset:
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
                                            });
                                        }
```

* In the pilot tag prompt modal submit action (around line 3080):
```typescript
                                     if (runScore > 0) {
                                         setLeaderboardSubmitting(true);
                                         try {
                                             await submitArcadeScore(runScore, uppercaseTag, level);
                                             playTransactionChord(); // Cash chime
                                             setPilotTag(uppercaseTag);
                                             setRunScore(0);
                                             setShowTagPrompt(false);
                                             if (prestigePending) {
```

**Step 2.3: Verify Type-checking & Build correctness**
* Run: `npx tsc --noEmit`
* Run: `npm run build`
* Expected output: SUCCESS

**Step 2.4: Commit**
```bash
git add src/App.tsx
git commit -m "feat: integrate local queue fallback for failed score transmissions"
```

---

### Verification Plan

#### Automated Verification
* TypeScript syntax: `npx tsc --noEmit`
* Bundling verification: `npm run build`

#### Manual Verification
1. Block connection or turn on Wi-Fi offline emulation.
2. Complete or forfeit an arcade run with a score > 0.
3. Confirm that the toast `📡 OFFLINE - SCORE QUEUED FOR SYNC` shows up.
4. Confirm `localStorage` shows the record queued under `chain_reaction_pending_transmissions_v3` and the UI `runScore` resets to `0`.
5. Restore internet access.
6. Verify that the score is uploaded automatically and `📡 SYNCED: ...` appears.
