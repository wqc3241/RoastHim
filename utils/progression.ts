import { supabase } from '../supabaseClient';

export const EXP_RULES = {
  post: 30,
  comment: 10,
  like: 2,
  receivedLike: 5
};

export const applyProgress = async (params: {
  userId: string;
  targetsCreated?: number;
  roastsPosted?: number;
  likesReceived?: number;
  exp?: number;
}) => {
  if (!supabase) return;
  await supabase.rpc('apply_progress', {
    p_user_id: params.userId,
    p_targets: params.targetsCreated ?? 0,
    p_roasts: params.roastsPosted ?? 0,
    p_likes_received: params.likesReceived ?? 0,
    p_exp: params.exp ?? 0
  });
};

export const syncBadges = async (userId: string) => {
  if (!supabase) return;
  const { data: stats } = await supabase
    .from('user_stats')
    .select('*')
    .eq('userId', userId)
    .maybeSingle();

  if (!stats) return;

  const unlocks: string[] = [];
  if ((stats.likesReceived ?? 0) >= 100) unlocks.push('b3');
  if ((stats.likesReceived ?? 0) >= 1000) unlocks.push('b4');
  if ((stats.targetsCreated ?? 0) >= 10) unlocks.push('b5');
  if ((stats.roastsPosted ?? 0) >= 100) unlocks.push('b6');
  if ((stats.roastsPosted ?? 0) >= 1) unlocks.push('b7');

  if (unlocks.length === 0) return;

  const rows = unlocks.map((badgeId) => ({
    userId,
    badgeId,
    unlocked: true
  }));

  await supabase.from('user_badges').upsert(rows, { onConflict: 'userId,badgeId' });
};
