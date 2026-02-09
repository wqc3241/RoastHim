
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { t } from '../utils/i18n';

interface LeaderboardDaily {
  id: string;
  userName: string;
  userAvatar: string;
  streak: number;
  likes: number;
  quote: string;
  targetAvatar?: string;
}

interface LeaderboardTop {
  rank: number;
  userName: string;
  userAvatar: string;
  quote: string;
  likes: number;
}

interface LeaderboardHof {
  id: string;
  dateLabel: string;
  userName: string;
  userAvatar: string;
}

const fallbackDaily: LeaderboardDaily = {
  id: 'daily-1',
  userName: '毒舌老李',
  userAvatar: 'https://picsum.photos/seed/winner1/100',
  streak: 3,
  likes: 12450,
  quote: '“张总改的不是方案，是他那支离破碎的审美，建议他把公司的Logo印在脑门上，这样全世界都能一眼看出谁是那个审美孤儿。”',
  targetAvatar: 'https://picsum.photos/seed/target1/100'
};

const fallbackTop: LeaderboardTop[] = [1, 2, 3, 4, 5].map(rank => ({
  rank,
  userName: `犀利哥_${rank}`,
  userAvatar: `https://picsum.photos/seed/user${rank}/60`,
  quote: '“他这操作真的刷新了我...”',
  likes: 2000 - rank * 200
}));

const fallbackHof: LeaderboardHof[] = [1, 2, 3].map(i => ({
  id: `hof-${i}`,
  dateLabel: `09-2${i}`,
  userName: `冠军用户_${i}`,
  userAvatar: `https://picsum.photos/seed/hist${i}/80`
}));

const Leaderboard: React.FC = () => {
  const [daily, setDaily] = useState<LeaderboardDaily>(fallbackDaily);
  const [topList, setTopList] = useState<LeaderboardTop[]>(fallbackTop);
  const [hofList, setHofList] = useState<LeaderboardHof[]>(fallbackHof);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadLeaderboard = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const [{ data: dailyData }, { data: topData }, { data: hofData }] = await Promise.all([
        supabase.from('leaderboard_daily').select('*').limit(1).maybeSingle(),
        supabase.from('leaderboard_top').select('*').order('rank', { ascending: true }),
        supabase.from('leaderboard_hof').select('*').order('dateLabel', { ascending: false })
      ]);

      if (dailyData) {
        setDaily(dailyData as LeaderboardDaily);
      }
      if (topData && topData.length > 0) {
        setTopList(topData as LeaderboardTop[]);
      }
      if (hofData && hofData.length > 0) {
        setHofList(hofData as LeaderboardHof[]);
      }

      setIsLoading(false);
    };

    loadLeaderboard();
  }, []);

  return (
    <div className="min-h-screen pb-32 px-4 pt-8">
      <h2 className="text-3xl font-headline text-orange-600 mb-8 italic">{t('leaderboard_heading')}</h2>

      {/* Daily Champion */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-widest uppercase">{t('leaderboard_daily')}</h3>
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/15 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="flex items-start gap-4 mb-4 relative z-10">
            <div className="relative">
              <img src={daily.userAvatar} className="w-16 h-16 rounded-full border-4 border-yellow-500 shadow-xl" />
              <span className="absolute -bottom-1 -right-1 text-2xl">👑</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-yellow-600">{daily.userName}</h4>
              <p className="text-xs text-slate-500">{t('leaderboard_streak', { count: daily.streak })}</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm font-bold text-slate-800">{t('details_likes', { count: daily.likes.toLocaleString() })}</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 overflow-hidden">
              <img src={daily.targetAvatar ?? 'https://picsum.photos/seed/target1/100'} className="w-full h-full object-cover opacity-70" />
            </div>
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border-l-4 border-yellow-500 relative z-10">
            <p className="text-sm italic text-slate-600 font-medium leading-relaxed">
              {daily.quote}
            </p>
          </div>
        </div>
      </section>

      {/* Top 10 List */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-widest uppercase">{t('leaderboard_top_today')}</h3>
        <div className="space-y-4">
          {isLoading && (
            <div className="text-sm text-slate-400">{t('leaderboard_loading')}</div>
          )}
          {topList.map(entry => (
            <div key={entry.rank} className="flex items-center gap-4 bg-white p-4 rounded-2xl border border-slate-200">
              <span className={`text-xl font-headline italic ${entry.rank <= 3 ? 'text-orange-500' : 'text-slate-400'}`}>
                {entry.rank < 10 ? `0${entry.rank}` : entry.rank}
              </span>
              <img src={entry.userAvatar} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-bold text-slate-800">{entry.userName}</p>
                <p className="text-[10px] text-slate-500 truncate w-40">{entry.quote}</p>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-orange-600">{t('details_likes', { count: entry.likes.toLocaleString() })}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hall of Fame */}
      <section>
        <h3 className="text-sm font-bold text-slate-500 mb-4 tracking-widest uppercase">{t('leaderboard_hof')}</h3>
        <div className="grid grid-cols-3 gap-4">
          {hofList.map(entry => (
            <div key={entry.id} className="flex flex-col items-center bg-white p-3 rounded-2xl border border-slate-200">
              <span className="text-[8px] text-slate-400 mb-2">{entry.dateLabel}</span>
              <div className="relative mb-2">
                <img src={entry.userAvatar} className="w-12 h-12 rounded-full border border-orange-500/50" />
                <span className="absolute -top-1 -right-1 text-xs">🏆</span>
              </div>
              <span className="text-[10px] font-bold text-slate-700">{entry.userName}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
