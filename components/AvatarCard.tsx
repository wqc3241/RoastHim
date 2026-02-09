
import React from 'react';
import { RoastTarget } from '../types';
import { t } from '../utils/i18n';

interface Props {
  target: RoastTarget;
  onClick: (target: RoastTarget) => void;
}

const AvatarCard: React.FC<Props> = ({ target, onClick }) => {
  return (
    <div 
      onClick={() => onClick(target)}
      className="glass rounded-2xl overflow-hidden mb-4 cursor-pointer transform transition-transform active:scale-95 shadow-md"
    >
      <div className="relative h-48 w-full">
        <img 
          src={target.avatarUrl} 
          alt={target.name} 
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
        />
        <div className="absolute top-2 right-2 bg-white/80 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1 border border-slate-200">
          <span className="text-orange-500">👍</span>
          <span className="text-xs font-bold text-slate-800">{target.totalLikes ?? 0}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold truncate text-slate-900">{target.name}</h3>
          <span className="text-xs text-slate-400">{t('profile_target_roasts', { count: target.roastCount })}</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {target.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-600 border border-orange-500/25">
              {tag}
            </span>
          ))}
        </div>
        <div className="bg-slate-50 p-2 rounded-lg border-l-2 border-orange-500">
          <p className="text-xs text-slate-600 italic line-clamp-2">
            {target.topRoastPreview ? `“${target.topRoastPreview}”` : t('home_top_roast_empty')}
          </p>
        </div>
      </div>
    </div>
  );
};

export default AvatarCard;
