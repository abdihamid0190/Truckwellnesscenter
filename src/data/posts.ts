// Driver posts for a gym: truck parking votes and short tips. Gyms are keyed
// by their OpenStreetMap id (see gyms.ts), which stays the same between searches.

import { supabase } from '@/lib/supabase';

export type ParkingVote = { userId: string; canPark: boolean; votedAt: string };

export type ParkingSummary = {
  yes: number;
  no: number;
  // Recent votes count more, so an old "yes" fades once a lot changes hands.
  verdict: 'yes' | 'no' | 'mixed' | 'none';
  lastVotedAt?: string;
};

export type Tip = { id: number; userId: string; handle: string; body: string; createdAt: string };

const VOTE_HALF_LIFE_DAYS = 60;
const DAY_MS = 24 * 60 * 60 * 1000;

export function summarizeParking(votes: ParkingVote[], now = Date.now()): ParkingSummary {
  if (votes.length === 0) return { yes: 0, no: 0, verdict: 'none' };
  let yesWeight = 0;
  let totalWeight = 0;
  for (const vote of votes) {
    const ageDays = Math.max(0, now - Date.parse(vote.votedAt)) / DAY_MS;
    const weight = 0.5 ** (ageDays / VOTE_HALF_LIFE_DAYS);
    totalWeight += weight;
    if (vote.canPark) yesWeight += weight;
  }
  const share = yesWeight / totalWeight;
  const lastVotedAt = votes.reduce((latest, vote) => (vote.votedAt > latest ? vote.votedAt : latest), votes[0].votedAt);
  return {
    yes: votes.filter((vote) => vote.canPark).length,
    no: votes.filter((vote) => !vote.canPark).length,
    verdict: share >= 0.65 ? 'yes' : share <= 0.35 ? 'no' : 'mixed',
    lastVotedAt,
  };
}

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.max(0, Math.round((now - Date.parse(iso)) / 60000));
  if (minutes < 60) return minutes <= 1 ? 'just now' : `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 60) return days === 1 ? 'yesterday' : `${days} days ago`;
  const months = Math.round(days / 30);
  return months < 24 ? `${months} months ago` : `${Math.round(months / 12)} years ago`;
}

export async function getParkingVotes(gymId: string): Promise<ParkingVote[]> {
  const { data, error } = await supabase
    .from('parking_votes')
    .select('user_id, can_park, voted_at')
    .eq('gym_id', gymId)
    .order('voted_at', { ascending: false })
    .limit(200);
  if (error) throw error;
  return data.map((row) => ({ userId: row.user_id, canPark: row.can_park, votedAt: row.voted_at }));
}

export async function voteParking(gymId: string, userId: string, canPark: boolean): Promise<void> {
  const { error } = await supabase
    .from('parking_votes')
    .upsert({ gym_id: gymId, user_id: userId, can_park: canPark, voted_at: new Date().toISOString() });
  if (error) throw error;
}

export async function getTips(gymId: string): Promise<Tip[]> {
  const { data, error } = await supabase
    .from('tips')
    .select('id, user_id, body, created_at, profiles(handle)')
    .eq('gym_id', gymId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return data.map((row) => {
    const profile = row.profiles as unknown as { handle: string } | null;
    return { id: row.id, userId: row.user_id, handle: profile?.handle ?? 'driver', body: row.body, createdAt: row.created_at };
  });
}

export const TIP_MAX_LENGTH = 280;

// Links and phone numbers are the usual spam, so tips can't carry them.
export function tipProblem(body: string): string | null {
  const text = body.trim();
  if (text.length < 2) return 'Write a little more.';
  if (text.length > TIP_MAX_LENGTH) return `Keep it under ${TIP_MAX_LENGTH} letters.`;
  if (/https?:\/\/|www\.|\.(com|net|org|io)\b/i.test(text)) return 'Tips can’t include links.';
  if (/\d{3}\D{0,2}\d{3}\D?\d{4}/.test(text)) return 'Tips can’t include phone numbers. The gym page has the number.';
  return null;
}

export async function addTip(gymId: string, userId: string, body: string): Promise<void> {
  const { error } = await supabase.from('tips').insert({ gym_id: gymId, user_id: userId, body: body.trim() });
  if (error) throw error;
}

export async function deleteTip(id: number): Promise<void> {
  const { error } = await supabase.from('tips').delete().eq('id', id);
  if (error) throw error;
}

export async function reportTip(id: number, userId: string): Promise<void> {
  const { error } = await supabase.from('reports').insert({ tip_id: id, reporter_id: userId });
  // Reporting twice is fine; the first report already counts.
  if (error && error.code !== '23505') throw error;
}

export async function blockDriver(blockerId: string, blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').insert({ blocker_id: blockerId, blocked_id: blockedId });
  if (error && error.code !== '23505') throw error;
}

export async function getBlockedDrivers(): Promise<{ id: string; handle: string }[]> {
  const { data, error } = await supabase.from('blocks').select('blocked_id, profiles!blocks_blocked_id_fkey(handle)');
  if (error) throw error;
  return data.map((row) => {
    const profile = row.profiles as unknown as { handle: string } | null;
    return { id: row.blocked_id, handle: profile?.handle ?? 'driver' };
  });
}

export async function unblockDriver(blockedId: string): Promise<void> {
  const { error } = await supabase.from('blocks').delete().eq('blocked_id', blockedId);
  if (error) throw error;
}
