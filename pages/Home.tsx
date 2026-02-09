
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { RoastTarget } from '../types';
import { getPersonaAvatarUrl } from '../constants';
import AvatarCard from '../components/AvatarCard';
import { supabase } from '../supabaseClient';
import { t } from '../utils/i18n';

interface Props {
  onSelectTarget: (target: RoastTarget) => void;
  isAuthenticated?: boolean;
  isDesktop?: boolean;
}

const PAGE_SIZE = 12;

const Home: React.FC<Props> = ({ onSelectTarget, isAuthenticated = false, isDesktop = false }) => {
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'champ'>('hot');
  const [targets, setTargets] = useState<RoastTarget[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(0);
  const loaderRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);

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

  const loadTargets = useCallback(async (pageIndex: number, append: boolean) => {
    if (!supabase) return;
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    if (pageIndex === 0) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }

    const rangeStart = pageIndex * PAGE_SIZE;
    const rangeEnd = rangeStart + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('roast_targets')
      .select('*')
      .order('heatIndex', { ascending: false })
      .range(rangeStart, rangeEnd);

    if (error || !data || data.length === 0) {
      if (pageIndex === 0) {
        setTargets([]);
      }
      setHasMore(false);
      setIsLoading(false);
      setIsLoadingMore(false);
      isFetchingRef.current = false;
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

    setTargets((prev) => (append ? [...prev, ...enriched] : enriched));
    setPage(pageIndex);
    setHasMore(data.length >= PAGE_SIZE);
    setIsLoading(false);
    setIsLoadingMore(false);
    isFetchingRef.current = false;
  }, []);

  useEffect(() => {
    setTargets([]);
    setHasMore(true);
    setPage(0);
    loadTargets(0, false);
  }, [loadTargets]);

  useEffect(() => {
    if (!loaderRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading && !isLoadingMore) {
          loadTargets(page + 1, true);
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, isLoadingMore, loadTargets, page]);

  return (
    <div className={`min-h-screen ${isDesktop ? 'pb-10' : 'pb-24'}`}>
      {/* Header */}
      <header
        className={`sticky top-0 bg-white/80 backdrop-blur-md z-40 ${
          isDesktop ? 'px-8 pt-8 pb-4 rounded-t-3xl' : 'px-4 pt-6 pb-2'
        }`}
      >
        <div className={`${isDesktop ? 'mb-6' : 'mb-4'}`}>
          <h1 className="text-3xl font-headline text-orange-600 italic">{t('login_title')}</h1>
        </div>
        <div className="flex gap-6 border-b border-slate-200 pb-2">
          {['hot', 'new', 'champ'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-lg font-bold pb-1 relative ${
                activeTab === tab ? 'text-slate-900' : 'text-slate-400'
              }`}
            >
              {tab === 'hot' && `🔥 ${t('home_tab_hot')}`}
              {tab === 'new' && `🆕 ${t('home_tab_new')}`}
              {tab === 'champ' && `👑 ${t('home_tab_champ')}`}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-orange-500 rounded-full" />
              )}
            </button>
          ))}
        </div>
      </header>

      {/* Feed */}
      <main className={`px-4 py-4 grid gap-4 ${isDesktop ? 'sm:px-8 sm:py-6 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4' : 'grid-cols-2'}`}>
        {isLoading && (
          <div className="text-sm text-slate-400 px-2">{t('home_loading')}</div>
        )}
        {!isLoading && sortedTargets.length === 0 && isAuthenticated && (
          <div className="text-sm text-slate-400 px-2">{t('home_empty')}</div>
        )}
        {sortedTargets.map((target) => (
          <AvatarCard 
            key={target.id} 
            target={target} 
            onClick={onSelectTarget} 
          />
        ))}
        <div ref={loaderRef} className="col-span-full h-8" />
        {isLoadingMore && (
          <div className="col-span-full flex items-center justify-center text-xs text-slate-400">
            {t('home_loading')}
          </div>
        )}
      </main>
    </div>
  );
};

export default Home;
