# Chain Reaction — Offline Score Queue & Sync Design

This design document specifies the architecture, data structures, and lifecycle events for adding an offline score queue and event-based synchronization system to **Chain Reaction**. This ensures that scores earned while offline or during intermittent database connectivity are safely preserved locally and uploaded once a connection is restored.

---

## 1. Storage & Queue Data Structure

Unsubmitted scores will be persisted to local storage using a queue-like structure.

* **Key:** `chain_reaction_pending_transmissions_v3`
* **Type:** `PendingTransmission[]`
* **Definition:**
```typescript
interface PendingTransmission {
    player_tag: string;
    score: number;
    highest_sector: number;
    type: 'arcade' | 'career';
    timestamp: number;
}
```

---

## 2. Failure Handling & Queue Appending

To prevent the active run score (`runScore`) from merging with subsequent runs, the score state must be reset immediately upon failure.

1. **Queueing on Submission Fail:**
   When `submitRanking` fails (returns `success = false`), the system will:
   * Read the existing queue from local storage.
   * Append a new item with the score, tag, active level, and a timestamp.
   * Persist the updated queue back to `localStorage`.
   * Clear the active run score (`setRunScore(0)`).
2. **User Notification:**
   A float notification will be shown informing the user:
   `📡 OFFLINE - SCORE QUEUED FOR SYNC`

---

## 3. Queue Synchronization Engine

A synchronization function `processOfflineQueue()` will handle the sequential transmission of queued scores.

```typescript
const processOfflineQueue = async () => {
    // 1. Read queue
    const queue = getOfflineQueue();
    if (queue.length === 0) return;

    const remainingQueue: PendingTransmission[] = [];
    let processedCount = 0;

    for (const item of queue) {
        // If we already failed one item in this batch, defer the rest to avoid multiple request timeouts
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

    // 2. Persist remaining items
    saveOfflineQueue(remainingQueue);
};
```

---

## 4. Lifecycle Integration & Triggers

To process queued scores automatically, `processOfflineQueue` will be bound to two main hooks:

1. **Online Event Listener:**
   Detects when the browser regains internet connectivity:
   ```typescript
   window.addEventListener('online', processOfflineQueue);
   ```
2. **Startup Initialization:**
   Flashes the queue when the application mounts to upload any items queued during previous play sessions:
   ```typescript
   useEffect(() => {
       processOfflineQueue();
       
       window.addEventListener('online', processOfflineQueue);
       return () => {
           window.removeEventListener('online', processOfflineQueue);
       };
   }, []);
   ```

---

## 5. Verification Plan

### Automated Verification
* Execute `npx tsc --noEmit` to check type compilation.
* Execute `npm run build` to verify production builds.

### Manual Verification
1. Block internet access (or turn off Wi-Fi/use Developer Tools offline mode).
2. Play or forfeit an active run with a score > 0.
3. Confirm that the toast `📡 OFFLINE - SCORE QUEUED FOR SYNC` is displayed.
4. Verify that `localStorage` contains the record under `chain_reaction_pending_transmissions_v3` and the UI `runScore` resets to `0`.
5. Restore internet connectivity.
6. Verify that the score is uploaded automatically and a float notification (`📡 SYNCED: ...`) is displayed.
7. Check the global leaderboard to verify the score appears.
