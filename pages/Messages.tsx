import React, { useEffect, useState } from 'react';
import { AppUser, RoastTarget } from '../types';
import { supabase } from '../supabaseClient';

interface Props {
  currentUser: AppUser | null;
  onNavigateToTarget: (target: RoastTarget) => void;
}

interface NotificationRow {
  id: string;
  userId: string;
  type: 'comment' | 'like';
  targetId?: string;
  commentId?: string;
  actorId?: string;
  actorName?: string;
  createdAt: string;
  read: boolean;
}

const Messages: React.FC<Props> = ({ currentUser, onNavigateToTarget }) => {
  const [items, setItems] = useState<NotificationRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!supabase || !currentUser) return;
      setIsLoading(true);
      const { data } = await supabase
        .from('notifications')
        .select('*')
        .eq('userId', currentUser.id)
        .order('createdAt', { ascending: false });
      if (data) {
        setItems(data as NotificationRow[]);
      }
      setIsLoading(false);
    };
    load();
  }, [currentUser]);

  const handleOpen = async (item: NotificationRow) => {
    if (!supabase || !item.targetId) return;
    const { data: target } = await supabase
      .from('roast_targets')
      .select('*')
      .eq('id', item.targetId)
      .maybeSingle();
    if (target) {
      onNavigateToTarget(target as RoastTarget);
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', item.id);
      setItems((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
      );
    }
  };

  return (
    <div className="min-h-screen pb-32 px-4 pt-8">
      <h2 className="text-2xl font-bold mb-6">消息</h2>
      {isLoading && <div className="text-sm text-slate-400">加载中...</div>}
      {!isLoading && items.length === 0 && (
        <div className="text-sm text-slate-400">暂无消息</div>
      )}
      <div className="space-y-4">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => handleOpen(item)}
            className="w-full text-left bg-white border border-slate-200 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-slate-900">
                {item.type === 'comment'
                  ? '你的投稿收到一条新评论'
                  : '你的评论收到一个新的赞'}
              </span>
              {!item.read && (
                <span className="text-[10px] text-orange-600 font-bold">未读</span>
              )}
            </div>
            <div className="text-xs text-slate-500">
              {item.actorName ? `${item.actorName} ` : ''}刚刚发生
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Messages;
