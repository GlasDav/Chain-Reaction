import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://ycvztrpgihepiwqqzefz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inljdnp0cnBnaWhlcGl3cXF6ZWZ6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODAyMTk0NjYsImV4cCI6MjA5NTc5NTQ2Nn0.n7U2jeRDjRtuhDaP6eD-n-vLTSDthoelfv_k9FZKkXI';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface LeaderboardEntry {
    id?: string;
    player_tag: string;
    score: number;
    highest_sector: number;
    type: 'arcade' | 'career';
    created_at?: string;
}

// Fetch top 10 rankings for a given type
export async function getTopRankings(type: 'arcade' | 'career'): Promise<LeaderboardEntry[]> {
    try {
        const { data, error } = await supabase
            .from('leaderboards')
            .select('*')
            .eq('type', type)
            .order('score', { ascending: false })
            .limit(10);
            
        if (error) {
            console.error('Supabase query error:', error);
            return [];
        }
        return data || [];
    } catch (e) {
        console.error('Supabase getTopRankings error:', e);
        return [];
    }
}

// Submit a new high score entry
export async function submitRanking(entry: Omit<LeaderboardEntry, 'id' | 'created_at'>): Promise<boolean> {
    try {
        const { error } = await supabase
            .from('leaderboards')
            .insert([entry]);
            
        if (error) {
            console.error('Supabase insert error:', error);
            return false;
        }
        return true;
    } catch (e) {
        console.error('Supabase submitRanking error:', e);
        return false;
    }
}
