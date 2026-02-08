
import React, { useEffect, useMemo, useState } from 'react';
import { RoastTarget } from '../types';
import { getPersonaAvatarUrl } from '../constants';
import AvatarCard from '../components/AvatarCard';
import { supabase } from '../supabaseClient';

interface Props {
  onSelectTarget: (target: RoastTarget) => void;
  isAuthenticated?: boolean;
}

const Home: React.FC<Props> = ({ onSelectTarget, isAuthenticated = false }) => {
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'champ'>('hot');
  const [targets, setTargets] = useState<RoastTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const sortedTargets = useMemo(() => {
    const items = [...targets];
    if (activeTab === 'new') {
      return items.sort((a: any, b: any) => {
        const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bTime - aTime;
      });
    }
    if (activeTab === 'champ') {
      return items.sort((a, b) => (b.totalLikes || 0) - (a.totalLikes || 0));
    }
    return items.sort((a, b) => (b.heatIndex || 0) - (a.heatIndex || 0));
  }, [targets, activeTab]);

  useEffect(() => {
    const loadTargets = async () => {
      if (!supabase) return;
      setIsLoading(true);
      const { data, error } = await supabase
        .from('roast_targets')
        .select('*')
        .order('heatIndex', { ascending: false });

      if (error || !data || data.length === 0) {
        setIsLoading(false);
        return;
      }

      const baseTargets = data.map((item: any) => ({
        ...item,
        avatarUrl: item.avatarUrl || getPersonaAvatarUrl(item)
      })) as RoastTarget[];

      const enriched = await Promise.all(
        baseTargets.map(async (target) => {
          const [{ count }, { data: likesRows }] = await Promise.all([
            supabase
              .from('roast_comments')
              .select('id', { count: 'exact', head: true })
              .eq('targetId', target.id),
            supabase
              .from('roast_comments')
              .select('likes')
              .eq('targetId', target.id)
          ]);
          const totalLikes = Array.isArray(likesRows)
            ? likesRows.reduce((sum, row: any) => sum + (row.likes ?? 0), 0)
            : 0;

          const { data: topRoast } = await supabase
            .from('roast_comments')
            .select('content,likes,createdAt')
            .eq('targetId', target.id)
            .order('likes', { ascending: false })
            .order('createdAt', { ascending: false })
            .limit(1)
            .maybeSingle();

          return {
            ...target,
            roastCount: count ?? target.roastCount ?? 0,
            totalLikes,
            topRoastPreview: topRoast?.content ?? ''
          };
        })
      );

      setTargets(enriched);
      setIsLoading(false);
    };

    loadTargets();
  }, []);

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 sticky top-0 bg-white/80 backdrop-blur-md z-40">
        <h1 className="text-3xl font-headline text-orange-600 mb-4 italic">RoastHim 骂他</h1>
        <div className="flex gap-6 border-b border-slate-200 pb-2">
          {['hot', 'new', 'champ'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-lg font-bold pb-1 relative ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {tab === 'hot' && '🔥 最热'}
              {tab === 'new' && '🆕 最新'}
              {tab === 'champ' && '👑 今日冠军'}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Feed */}
      <main className="px-4 py-4 grid grid-cols-2 gap-4">
        {isLoading && (
          <div className="text-sm text-slate-400 px-2">加载中...</div>
        )}
        {!isLoading && sortedTargets.length === 0 && isAuthenticated && (
          <div className="text-sm text-slate-400 px-2">暂无数据</div>
        )}
        {sortedTargets.map((target) => (
          <AvatarCard 
            key={target.id} 
            target={target} 
            onClick={onSelectTarget} 
          />
        ))}
      </main>
    </div>
  );
};

export default Home;
