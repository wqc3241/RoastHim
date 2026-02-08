
import React, { useEffect, useMemo, useState } from 'react';
import { AppUser, RoastComment, RoastTarget, UserStats } from '../types';
import { supabase } from '../supabaseClient';

interface Props {
  currentUser: AppUser | null;
  sessionUserId: string | null;
  onNavigateToTarget: (target: RoastTarget) => void;
  isAuthenticated: boolean;
  onRequireLogin?: () => void;
}

const Profile: React.FC<Props> = ({ currentUser, sessionUserId, onNavigateToTarget, isAuthenticated, onRequireLogin }) => {
  const [activeTab, setActiveTab] = useState<'roasts' | 'targets' | 'badges'>('roasts');
  const [user, setUser] = useState<AppUser | null>(currentUser);
  const [stats, setStats] = useState<UserStats | null>(currentUser?.stats ?? null);

  useEffect(() => {
    setUser(currentUser);
    setStats(currentUser?.stats ?? null);
  }, [currentUser]);
  const [badges, setBadges] = useState([]);
  const [myRoasts, setMyRoasts] = useState<RoastComment[]>([]);
  const [myTargets, setMyTargets] = useState<RoastTarget[]>([]);
  const [targetMap, setTargetMap] = useState<Record<string, RoastTarget>>({});
  const [isLoading, setIsLoading] = useState(false);

  const likesLabel = useMemo(() => {
    if (!stats) return '0';
    if (stats.likesReceived >= 1000) {
      return `${(stats.likesReceived / 1000).toFixed(1)}k`;
    }
    return stats.likesReceived.toString();
  }, [stats]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!supabase || !sessionUserId) return;
      setIsLoading(true);

      const [
        { data: userData },
        { data: statData },
        { data: badgeData },
        { data: userBadgeData },
        { data: roastData },
        { data: targetData },
        targetCountRes,
        roastCountRes,
        likesRes
      ] = await Promise.all([
        supabase.from('app_users').select('*').eq('id', sessionUserId).maybeSingle(),
        supabase.from('user_stats').select('*').eq('userId', sessionUserId).maybeSingle(),
        supabase.from('badges').select('*'),
        supabase.from('user_badges').select('*').eq('userId', sessionUserId),
        supabase
          .from('roast_comments')
          .select('*')
          .eq('userId', sessionUserId)
          .order('createdAt', { ascending: false })
          .limit(20),
        supabase.from('roast_targets').select('*').eq('creatorId', sessionUserId).order('createdAt', { ascending: false }),
        supabase.from('roast_targets').select('id', { count: 'exact', head: true }).eq('creatorId', sessionUserId),
        supabase.from('roast_comments').select('id', { count: 'exact', head: true }).eq('userId', sessionUserId),
        supabase.from('roast_comments').select('likes').eq('userId', sessionUserId)
      ]);

      if (userData) {
        setUser((prev) => ({
          ...(prev ?? {
            id: userData.id,
            name: userData.name,
            avatar: userData.avatar,
            badges: [],
            stats: { targetsCreated: 0, roastsPosted: 0, likesReceived: 0 }
          }),
          ...userData,
          quote: userData.quote ?? prev?.quote,
          level: userData.level ?? prev?.level
        }));
      }

      const derivedTargets = (targetCountRes as any)?.count ?? statData?.targetsCreated ?? 0;
      const derivedRoasts = (roastCountRes as any)?.count ?? statData?.roastsPosted ?? 0;
      const derivedLikes = Array.isArray((likesRes as any)?.data)
        ? (likesRes as any).data.reduce((sum: number, row: any) => sum + (row.likes ?? 0), 0)
        : (statData?.likesReceived ?? 0);

      setStats({
        targetsCreated: derivedTargets,
        roastsPosted: derivedRoasts,
        likesReceived: derivedLikes
      });

      if (statData) {
        await supabase
          .from('user_stats')
          .update({
            targetsCreated: derivedTargets,
            roastsPosted: derivedRoasts,
            likesReceived: derivedLikes
          })
          .eq('userId', sessionUserId);
      }

      if (badgeData) {
        const unlockedMap = new Map(
          (userBadgeData || []).map((entry: any) => [entry.badgeId, entry.unlocked])
        );
        const mergedBadges = badgeData.map((badge: any) => ({
          ...badge,
          unlocked: unlockedMap.get(badge.id) ?? false
        }));
        setBadges(mergedBadges);
      }

      if (roastData) {
        setMyRoasts(roastData as RoastComment[]);
      }

      if (targetData) {
        setMyTargets(targetData as RoastTarget[]);
      }

      const roastTargetIds = (roastData || [])
        .map((roast: any) => roast.targetId)
        .filter(Boolean);
      if (roastTargetIds.length > 0) {
        const { data: roastTargets } = await supabase
          .from('roast_targets')
          .select('*')
          .in('id', roastTargetIds);
        if (roastTargets) {
          const map: Record<string, RoastTarget> = {};
          roastTargets.forEach((target: any) => {
            map[target.id] = target as RoastTarget;
          });
          setTargetMap(map);
        }
      }

      setIsLoading(false);
    };

    loadProfile();
  }, [sessionUserId]);

  const handleSignOut = async () => {
    if (!supabase) return;
    await supabase.auth.signOut();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-slate-500 text-sm gap-3">
        <span>请先登录查看个人资料</span>
        <button
          onClick={() => onRequireLogin?.()}
          className="px-4 py-2 rounded-full bg-orange-500 text-white font-bold text-sm"
        >
          去登录
        </button>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-slate-400 text-sm">
        加载中...
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header Info */}
      <div className="bg-gradient-to-b from-orange-200/40 to-transparent px-6 pt-16 pb-10 flex flex-col items-center text-center">
        {supabase && (
          <button
            onClick={handleSignOut}
            className="self-end text-xs text-slate-400 border border-slate-200 rounded-full px-3 py-1 mb-4"
          >
            退出登录
          </button>
        )}
        <div className="relative mb-4">
          <img src={user.avatar} className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-2xl" />
          <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-white">
            LV.{user.level ?? 1}
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-1 text-slate-900">{user.name}</h2>
        <p className="text-xs text-slate-500 mb-6 font-medium">{user.quote ?? '“键盘在手，天下我有。吐槽不息，战斗不止。”'}</p>
        
        <div className="grid grid-cols-3 w-full bg-white rounded-2xl p-4 backdrop-blur-md border border-slate-200">
          <div>
            <p className="text-lg font-bold text-orange-600">{stats.targetsCreated}</p>
            <p className="text-[10px] text-slate-500 font-bold">投稿对象</p>
          </div>
          <div className="border-x border-slate-200">
            <p className="text-lg font-bold text-orange-600">{stats.roastsPosted}</p>
            <p className="text-[10px] text-slate-500 font-bold">发布骂评</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-600">{likesLabel}</p>
            <p className="text-[10px] text-slate-500 font-bold">获赞总数</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-8 border-b border-slate-200 mb-6">
          {['roasts', 'targets', 'badges'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-bold relative ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {tab === 'roasts' && '我的骂'}
              {tab === 'targets' && '我的投稿'}
              {tab === 'badges' && '我的徽章'}
              {activeTab === tab && <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="space-y-4">
          {activeTab === 'badges' && (
            <div className="grid grid-cols-3 gap-4 pb-10">
              {badges.map(badge => (
                <div key={badge.id} className={`flex flex-col items-center p-3 rounded-2xl glass transition-all ${!badge.unlocked && 'grayscale opacity-30'}`}>
                  <span className="text-3xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight text-slate-700">{badge.name}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roasts' && (
            <div className="space-y-4">
              {isLoading && (
                <div className="text-sm text-slate-400">加载中...</div>
              )}
              {myRoasts.length === 0 && !isLoading && (
                <div className="text-xs text-slate-400">暂无骂评记录</div>
              )}
              {myRoasts.map((roast) => {
                const target = targetMap[roast.targetId];
                return (
                  <button
                    key={roast.id}
                    type="button"
                    onClick={() => target && onNavigateToTarget(target)}
                    className="w-full text-left bg-white p-4 rounded-2xl border border-slate-200 transition-transform active:scale-[0.99]"
                  >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-600">
                      骂评 · {target ? target.name : '查看原帖'}
                    </span>
                    <span className="text-[8px] text-slate-400">{roast.timestamp ?? '刚刚'}</span>
                  </div>
                  <p className="text-xs text-slate-600 line-clamp-2">{roast.content}</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-[10px] text-slate-400">👍 {roast.likes}</span>
                    <span className="text-[10px] text-slate-400">💬 0</span>
                  </div>
                  </button>
                );
              })}
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="space-y-4">
              {isLoading && (
                <div className="text-sm text-slate-400">加载中...</div>
              )}
              {myTargets.length === 0 && !isLoading && (
                <div className="flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="text-4xl mb-4">📭</span>
                  <p className="text-xs">还没有被骂对象入库哦~</p>
                  <button className="mt-4 text-orange-600 text-sm font-bold">去投稿一个？</button>
                </div>
              )}
              {myTargets.map((target) => (
                <button
                  key={target.id}
                  type="button"
                  onClick={() => onNavigateToTarget(target)}
                  className="w-full text-left bg-white p-4 rounded-2xl border border-slate-200 transition-transform active:scale-[0.99]"
                >
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-600">{target.type}</span>
                    <span className="text-[8px] text-slate-400">{target.roastCount} 次被骂</span>
                  </div>
                  <p className="text-xs text-slate-600 font-bold">{target.name}</p>
                  <p className="text-[10px] text-slate-500 line-clamp-2 mt-1">{target.description}</p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
