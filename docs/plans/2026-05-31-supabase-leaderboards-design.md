# Chain Reaction — Supabase Real-Time Global Leaderboards Design

This design document outlines the system architecture, database schema, security policies, frontend data flows, and UI/UX mockup structures for introducing two separate global leaderboards in the React/Vite-based game **Chain Reaction**: **"Quantum Run Records"** (for single continuous arcade runs) and **"Galactic Career Standings"** (for persistent lifetime cumulative scores).

---

## 1. Database Architecture (Supabase)

We are integrating a dedicated Supabase project ID `ycvztrpgihepiwqqzefz` ("Chain Reaction") located in the `ap-northeast-1` region under organization `cwwdhkwzxqusdjviewqh`.

### Table Schema: `public.leaderboards`
We store both leaderboard types in a single database table using a `type` flag to distinguish entries, avoiding table clutter while maintaining optimal indexing.

```sql
CREATE TABLE IF NOT EXISTS public.leaderboards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    player_tag VARCHAR(3) NOT NULL,
    score BIGINT NOT NULL,
    highest_sector INTEGER NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('arcade', 'career')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);
```

### Row-Level Security (RLS) Policies
Anonymous public operations are enabled securely through standard Supabase JSON Web Token (JWT) credentials:
1. **Public Select (Read):** Anyone can read rankings to show standings inside the game.
   ```sql
   CREATE POLICY "Allow public select" ON public.leaderboards
       FOR SELECT USING (true);
   ```
2. **Public Insert (Write):** Anyone can submit a score anonymously to log new runs/career milestones.
   ```sql
   CREATE POLICY "Allow public insert" ON public.leaderboards
       FOR INSERT WITH CHECK (true);
   ```

---

## 2. Frontend Data Flow & Client SDK

We will integrate the official `@supabase/supabase-js` library to communicate with the database securely from the client.

### Client Configuration
* **Project URL:** `https://ycvztrpgihepiwqqzefz.supabase.co`
* **Anon Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljdnp0cnBnaWhlcGl3cXF6ZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTk0NjYsImV4cCI6MjA5NTc5NTQ2Nn0.n7U2jeRDjRtuhDaP6eD-n-vLTSDthoelfv_k9FZKkXI`
* Credentials will be declared inside a client module `src/lib/supabaseClient.ts` falling back to mock functions if keys are unavailable, ensuring absolute robust safety.

### Submission Lifecycle
1. **Arcade Run Submission (`type = 'arcade'`):**
   * Triggered upon a level **Forfeit** or **Sector Retirement (Prestige)**.
   * If the accumulated single-run score is greater than 0, check if it beats the player's personal local record.
   * Prompts the user with a sleek neon-themed input dialog: `📡 RECORD TRANSMISSION DETECTED! ENTER 3-LETTER PILOT TAG`.
   * Input defaults to their last saved tag (persisted in `localStorage` under `chain_reaction_pilot_tag_v3`).
   * Writes the record to Supabase, persists the tag, and opens the Leaderboards screen.
2. **Career Cumulative Submission (`type = 'career'`):**
   * Triggered automatically after a sector victory or prestige event.
   * Compares the current lifetime career `totalScore` against the player's previously submitted career score (saved locally).
   * If higher, it silently transmits an updated entry to the database, ensuring seamless automatic syncing.

---

## 3. UI/UX Interface Design

A dedicated tab button `🏆 LEADERBOARD` will be added to the Start Screen dashboard. 

### Visual Mockup
The leaderboard is rendered as an overlay dialog styled with vibrant glassmorphic dark-theme nodes and thin neon-cyan borders (`border-cyan-500/30`), maintaining premium Sci-Fi aesthetics:

```
+-------------------------------------------------------+
|             🏆 REACTOR PLATFORM STANDINGS             |
|                                                       |
|   [ ⚡ RUN RECORDS ]           [ ⚛️ CAREER GRIND ]    |
|                                                       |
|   POS   PILOT   SCORE        SECTOR    RECORD DATE    |
|   -------------------------------------------------   |
|   01.   DMG     340,500 ⚡   Sector 18  2026-05-31     |
|   02.   X12     210,400 ⚡   Sector 11  2026-05-30     |
|   03.   ABC     185,000 ⚡   Sector 08  2026-05-29     |
|                                                       |
|  [ CLOSE DECK COMMS ]                                 |
+-------------------------------------------------------+
```

* **Interactive Elements:**
  * **Tab Selector:** Smooth tab switching between `RUN RECORDS` and `CAREER GRIND` with neon indicators.
  * **Leaderboard Grid:** Display rank positions (01-10) with custom medal icons for top 3 spots, 3-char tags, score figures, highest sector numbers, and clean formatted timestamps.
  * **Pilot Profile Status:** At the bottom, displays the player's own rank standing and records (e.g. `YOUR BEST RUN: #08 (DMG - 110,200 ⚡)`), adding high context.
* **Micro-Animations:** Grid list items fade in with sequential step delays using tailwind transition utilities.
* **Sensory Audio:** Synthesizes low computer terminal clicks when opening the overlay or swapping tabs, and plays a positive chime when successfully recording a scoreboard entry.

---

## 4. Verification Plan

### Database Table Check
* Run `execute_sql` queries to ensure the `leaderboards` table exists and records can be inserted.

### Frontend Compiler Check
* Run `npx tsc --noEmit` to ensure there are no compilation or import type-checking errors.

### Manual Verification
1. Click `🏆 LEADERBOARD` on the start screen. Verify the tables are fetched and displayed.
2. Complete/forfeit a run, input pilot tag `PIL`, and verify the score is inserted into Supabase.
3. Reload the leaderboard and verify that `PIL` is listed with their score in the ranks.
