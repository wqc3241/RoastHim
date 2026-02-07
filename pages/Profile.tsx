
import React, { useState } from 'react';
import { CURRENT_USER, MOCK_BADGES } from '../constants';

const Profile: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'roasts' | 'targets' | 'badges'>('roasts');

  return (
    <div className="min-h-screen pb-32">
      {/* Header Info */}
      <div className="bg-gradient-to-b from-orange-600/20 to-transparent px-6 pt-16 pb-10 flex flex-col items-center text-center">
        <div className="relative mb-4">
          <img src={CURRENT_USER.avatar} className="w-24 h-24 rounded-full border-4 border-orange-500 shadow-2xl" />
          <div className="absolute -bottom-2 -right-2 bg-orange-500 text-white text-[10px] font-bold px-2 py-1 rounded-full border-2 border-[#1A1A2E]">
            LV.12
          </div>
        </div>
        <h2 className="text-2xl font-bold mb-1">{CURRENT_USER.name}</h2>
        <p className="text-xs text-gray-500 mb-6 font-medium">“键盘在手，天下我有。吐槽不息，战斗不止。”</p>
        
        <div className="grid grid-cols-3 w-full bg-white/5 rounded-2xl p-4 backdrop-blur-md border border-white/5">
          <div>
            <p className="text-lg font-bold text-orange-400">{CURRENT_USER.stats.targetsCreated}</p>
            <p className="text-[10px] text-gray-500 font-bold">投稿对象</p>
          </div>
          <div className="border-x border-white/10">
            <p className="text-lg font-bold text-orange-400">{CURRENT_USER.stats.roastsPosted}</p>
            <p className="text-[10px] text-gray-500 font-bold">发布骂评</p>
          </div>
          <div>
            <p className="text-lg font-bold text-orange-400">3.5k</p>
            <p className="text-[10px] text-gray-500 font-bold">获赞总数</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-6">
        <div className="flex gap-8 border-b border-white/5 mb-6">
          {['roasts', 'targets', 'badges'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`pb-2 text-sm font-bold relative ${
                activeTab === tab ? 'text-white' : 'text-gray-500'
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
              {MOCK_BADGES.map(badge => (
                <div key={badge.id} className={`flex flex-col items-center p-3 rounded-2xl glass transition-all ${!badge.unlocked && 'grayscale opacity-30'}`}>
                  <span className="text-3xl mb-1">{badge.icon}</span>
                  <span className="text-[10px] font-bold text-center leading-tight">{badge.name}</span>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'roasts' && (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-bold text-orange-500">骂：甲方张总</span>
                    <span className="text-[8px] text-gray-500">昨天 18:30</span>
                  </div>
                  <p className="text-xs text-gray-300 line-clamp-2">他这哪是审美，他是审美上的绝户...</p>
                  <div className="flex gap-4 mt-3">
                    <span className="text-[10px] text-gray-500">👍 128</span>
                    <span className="text-[10px] text-gray-500">💬 12</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'targets' && (
            <div className="flex flex-col items-center justify-center py-10 opacity-40">
              <span className="text-4xl mb-4">📭</span>
              <p className="text-xs">还没有被骂对象入库哦~</p>
              <button className="mt-4 text-orange-500 text-sm font-bold">去投稿一个？</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;
