
import React, { useEffect, useMemo, useState } from 'react';
import { AppUser, RoastTarget, RoastComment, RoastType } from '../types';
import { supabase } from '../supabaseClient';

interface Props {
  target: RoastTarget;
  onBack: () => void;
  currentUser: AppUser | null;
  isAuthenticated: boolean;
}

const Details: React.FC<Props> = ({ target, onBack, currentUser, isAuthenticated }) => {
  const [roasts, setRoasts] = useState<RoastComment[]>([]);
  const [inputText, setInputText] = useState('');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');
  const [isLoading, setIsLoading] = useState(false);
  const [likedIds, setLikedIds] = useState<Set<string>>(new Set());
  const [targetStats, setTargetStats] = useState({
    roastCount: target.roastCount ?? 0,
    totalLikes: target.totalLikes ?? 0
  });

  const sortedRoasts = useMemo(() => {
    const items = [...roasts];
    if (sort === 'hot') {
      return items.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return items.sort((a: any, b: any) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return bTime - aTime;
    });
  }, [roasts, sort]);

  useEffect(() => {
    const loadRoasts = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const query = supabase
        .from('roast_comments')
        .select('*')
        .eq('targetId', target.id);

      if (sort === 'hot') {
        query.order('likes', { ascending: false });
      } else {
        query.order('createdAt', { ascending: false });
      }

      const { data, error } = await query;

      if (error || !data || data.length === 0) {
        setIsLoading(false);
        return;
      }

      const nextRoasts = data as RoastComment[];
      setRoasts(nextRoasts);
      const derivedLikes = nextRoasts.reduce((sum, roast) => sum + (roast.likes ?? 0), 0);
      setTargetStats({
        roastCount: nextRoasts.length,
        totalLikes: derivedLikes
      });
      setIsLoading(false);
    };

    loadRoasts();
  }, [target.id, sort]);

  const handleSend = async () => {
    if (!inputText.trim()) return;
    if (!currentUser) return;
    const newRoast: RoastComment = {
      id: Date.now().toString(),
      targetId: target.id,
      userId: currentUser.id,
      userName: currentUser.name,
      userAvatar: currentUser.avatar,
      content: inputText,
      type: 'text',
      likes: 0,
      isChampion: false,
      timestamp: '刚刚'
    };
    setRoasts([newRoast, ...roasts]);
    setTargetStats((prev) => ({
      roastCount: prev.roastCount + 1,
      totalLikes: prev.totalLikes
    }));
    setInputText('');

    if (supabase) {
      await supabase.from('roast_comments').insert([newRoast]);
      const { data: stats } = await supabase
        .from('user_stats')
        .select('*')
        .eq('userId', currentUser.id)
        .maybeSingle();
      if (stats) {
        await supabase
          .from('user_stats')
          .update({ roastsPosted: (stats.roastsPosted ?? 0) + 1 })
          .eq('userId', currentUser.id);
      } else {
        await supabase.from('user_stats').insert([{
          userId: currentUser.id,
          targetsCreated: 0,
          roastsPosted: 1,
          likesReceived: 0
        }]);
      }
      const { data: targetRow } = await supabase
        .from('roast_targets')
        .select('roastCount,totalLikes')
        .eq('id', target.id)
        .maybeSingle();
      await supabase
        .from('roast_targets')
        .update({
          roastCount: (targetRow?.roastCount ?? 0) + 1
        })
        .eq('id', target.id);
    }
  };

  const handleLike = async (roastId: string) => {
    if (likedIds.has(roastId)) return;
    const current = roasts.find((roast) => roast.id === roastId);
    const nextLikes = (current?.likes ?? 0) + 1;

    setLikedIds((prev) => new Set(prev).add(roastId));
    const optimisticRoasts = roasts.map((roast) =>
      roast.id === roastId ? { ...roast, likes: nextLikes } : roast
    );
    setRoasts(optimisticRoasts);
    const optimisticTotalLikes = optimisticRoasts.reduce(
      (sum, roast) => sum + (roast.likes ?? 0),
      0
    );
    setTargetStats((prev) => ({
      roastCount: prev.roastCount,
      totalLikes: optimisticTotalLikes
    }));

    if (supabase) {
      const { error: likeError } = await supabase
        .from('roast_comments')
        .update({ likes: nextLikes })
        .eq('id', roastId);

      if (likeError) {
        console.error('Like update failed:', likeError);
        setLikedIds((prev) => {
          const next = new Set(prev);
          next.delete(roastId);
          return next;
        });
        setRoasts(roasts);
        setTargetStats((prev) => ({
          roastCount: prev.roastCount,
          totalLikes: roasts.reduce((sum, roast) => sum + (roast.likes ?? 0), 0)
        }));
        return;
      }

      const { data: likeRows, error: sumError } = await supabase
        .from('roast_comments')
        .select('likes')
        .eq('targetId', target.id);
      const totalLikes = Array.isArray(likeRows)
        ? likeRows.reduce((sum, row: any) => sum + (row.likes ?? 0), 0)
        : optimisticTotalLikes;

      if (!sumError) {
        setTargetStats((prev) => ({
          roastCount: prev.roastCount,
          totalLikes
        }));
        await supabase
          .from('roast_targets')
          .update({
            roastCount: roasts.length,
            totalLikes
          })
          .eq('id', target.id);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top Profile */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={target.avatarUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-white via-white/60 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-4 w-10 h-10 bg-white/80 rounded-full flex items-center justify-center backdrop-blur-md border border-slate-200"
        >
          <span className="text-xl">←</span>
        </button>

        <div className="absolute bottom-4 left-4 right-4">
          <div className="flex gap-2 mb-2">
            {target.tags.map(tag => (
              <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500 text-white font-bold shadow-lg">
                {tag}
              </span>
            ))}
          </div>
          <h2 className="text-4xl font-headline text-slate-900 mb-2">{target.name}</h2>
          <p className="text-sm text-slate-600 line-clamp-2 mb-3 bg-white/80 p-2 rounded-lg backdrop-blur-sm border border-slate-200">
            {target.description}
          </p>
          <div className="flex gap-4 text-xs font-bold text-orange-600">
            <span>{targetStats.roastCount} 次被骂</span>
            <span>{targetStats.totalLikes} 累计获赞</span>
          </div>
        </div>
      </div>

      {/* Roasts Feed */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">评论区 ({roasts.length})</h3>
          <div className="flex bg-slate-100 rounded-full p-1">
            <button 
              onClick={() => setSort('hot')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'hot' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
            >
              最热
            </button>
            <button 
              onClick={() => setSort('new')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'new' ? 'bg-orange-500 text-white' : 'text-slate-500'}`}
            >
              最新
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {isLoading && (
            <div className="text-sm text-slate-400">加载中...</div>
          )}
          {sortedRoasts.map(roast => (
            <div key={roast.id} className="animate-in slide-in-from-bottom-4 fade-in">
              <div className="flex gap-3 items-start">
                <div className="relative">
                  <img src={roast.userAvatar} className="w-10 h-10 rounded-full object-cover border border-slate-200" />
                  {roast.isChampion && (
                    <span className="absolute -top-1 -right-1 text-sm">👑</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-orange-600">{roast.userName}</span>
                    <span className="text-[10px] text-slate-400">{roast.timestamp}</span>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-3">
                    {roast.content}
                  </p>
                  
                  {roast.type === 'image' && roast.mediaUrl && (
                    <img src={roast.mediaUrl} className="w-48 rounded-xl mb-3 border border-slate-200" />
                  )}

                  <div className="flex gap-4">
                    <button
                      onClick={() => handleLike(roast.id)}
                      className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-orange-500 transition-colors"
                    >
                      <span className="text-base">👍</span>
                      {roast.likes}
                    </button>
                    <button className="text-xs text-slate-500">回复</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 p-4 pb-8 flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">📷</button>
        <button className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-xl">🎤</button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="用最犀利的话骂他..."
            className="w-full bg-white border border-slate-200 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <button 
          onClick={handleSend}
          className="bg-orange-500 text-white font-bold px-5 py-2.5 rounded-full text-sm shadow-lg shadow-orange-500/20 active:scale-95 transition-all"
        >
          发送
        </button>
      </div>
    </div>
  );
};

export default Details;
