
import React, { useState } from 'react';
import { RoastTarget, Page } from '../types';
import { MOCK_TARGETS } from '../constants';
import AvatarCard from '../components/AvatarCard';

interface Props {
  onSelectTarget: (target: RoastTarget) => void;
}

const Home: React.FC<Props> = ({ onSelectTarget }) => {
  const [activeTab, setActiveTab] = useState<'hot' | 'new' | 'champ'>('hot');

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <header className="px-4 pt-6 pb-2 sticky top-0 bg-[#1A1A2E]/80 backdrop-blur-md z-40">
        <h1 className="text-3xl font-headline text-orange-500 mb-4 italic">RoastHim 骂他</h1>
        <div className="flex gap-6 border-b border-white/5 pb-2">
          {['hot', 'new', 'champ'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`text-lg font-bold pb-1 relative ${
                activeTab === tab ? 'text-white' : 'text-gray-500'
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
      <main className="px-4 py-4 columns-2 gap-4">
        {MOCK_TARGETS.map((target) => (
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
