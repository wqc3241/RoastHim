
import React from 'react';
import { RoastTarget } from '../types';

interface Props {
  target: RoastTarget;
  onClick: (target: RoastTarget) => void;
}

const AvatarCard: React.FC<Props> = ({ target, onClick }) => {
  return (
    <div 
      onClick={() => onClick(target)}
      className="glass rounded-2xl overflow-hidden mb-4 cursor-pointer transform transition-transform active:scale-95 shadow-lg"
    >
      <div className="relative h-48 w-full">
        <img 
          src={target.avatarUrl} 
          alt={target.name} 
          className="w-full h-full object-cover grayscale-[20%] group-hover:grayscale-0 transition-all"
        />
        <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-full flex items-center gap-1">
          <span className="text-red-500">🔥</span>
          <span className="text-xs font-bold">{target.heatIndex}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="text-lg font-bold truncate">{target.name}</h3>
          <span className="text-xs text-gray-400">{target.roastCount} 次被骂</span>
        </div>
        <div className="flex flex-wrap gap-1 mb-3">
          {target.tags.map(tag => (
            <span key={tag} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
              {tag}
            </span>
          ))}
        </div>
        {target.topRoastPreview && (
          <div className="bg-black/30 p-2 rounded-lg border-l-2 border-orange-500">
            <p className="text-xs text-gray-300 italic line-clamp-2">
              “{target.topRoastPreview}”
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AvatarCard;
