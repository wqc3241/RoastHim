
import React, { useState } from 'react';
import { RoastTarget, RoastComment, RoastType } from '../types';
import { MOCK_ROASTS } from '../constants';

interface Props {
  target: RoastTarget;
  onBack: () => void;
}

const Details: React.FC<Props> = ({ target, onBack }) => {
  const [roasts, setRoasts] = useState<RoastComment[]>(MOCK_ROASTS);
  const [inputText, setInputText] = useState('');
  const [sort, setSort] = useState<'hot' | 'new'>('hot');

  const handleSend = () => {
    if (!inputText.trim()) return;
    const newRoast: RoastComment = {
      id: Date.now().toString(),
      targetId: target.id,
      userId: 'me',
      userName: '毒舌小王子',
      userAvatar: 'https://picsum.photos/seed/me/200',
      content: inputText,
      type: 'text',
      likes: 0,
      isChampion: false,
      timestamp: '刚刚'
    };
    setRoasts([newRoast, ...roasts]);
    setInputText('');
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] pb-24">
      {/* Top Profile */}
      <div className="relative h-80 w-full overflow-hidden">
        <img src={target.avatarUrl} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#1A1A2E] via-[#1A1A2E]/20 to-transparent" />
        
        <button 
          onClick={onBack}
          className="absolute top-6 left-4 w-10 h-10 bg-black/40 rounded-full flex items-center justify-center backdrop-blur-md"
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
          <h2 className="text-4xl font-headline text-white mb-2">{target.name}</h2>
          <p className="text-sm text-gray-300 line-clamp-2 mb-3 bg-black/20 p-2 rounded-lg backdrop-blur-sm border border-white/5">
            {target.description}
          </p>
          <div className="flex gap-4 text-xs font-bold text-orange-400">
            <span>{target.roastCount} 次被骂</span>
            <span>{target.totalLikes} 累计获赞</span>
          </div>
        </div>
      </div>

      {/* Roasts Feed */}
      <div className="px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold">评论区 ({roasts.length})</h3>
          <div className="flex bg-white/5 rounded-full p-1">
            <button 
              onClick={() => setSort('hot')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'hot' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
            >
              最热
            </button>
            <button 
              onClick={() => setSort('new')}
              className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${sort === 'new' ? 'bg-orange-500 text-white' : 'text-gray-400'}`}
            >
              最新
            </button>
          </div>
        </div>

        <div className="space-y-6">
          {roasts.map(roast => (
            <div key={roast.id} className="animate-in slide-in-from-bottom-4 fade-in">
              <div className="flex gap-3 items-start">
                <div className="relative">
                  <img src={roast.userAvatar} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  {roast.isChampion && (
                    <span className="absolute -top-1 -right-1 text-sm">👑</span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-bold text-orange-400">{roast.userName}</span>
                    <span className="text-[10px] text-gray-500">{roast.timestamp}</span>
                  </div>
                  <p className="text-gray-200 text-sm leading-relaxed mb-3">
                    {roast.content}
                  </p>
                  
                  {roast.type === 'image' && roast.mediaUrl && (
                    <img src={roast.mediaUrl} className="w-48 rounded-xl mb-3 border border-white/5" />
                  )}

                  <div className="flex gap-4">
                    <button className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-orange-500 transition-colors">
                      <span className="text-base">👍</span>
                      {roast.likes}
                    </button>
                    <button className="text-xs text-gray-500">回复</button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A2E]/90 backdrop-blur-xl border-t border-white/10 p-4 pb-8 flex items-center gap-3">
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">📷</button>
        <button className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center text-xl">🎤</button>
        <div className="flex-1 relative">
          <input 
            type="text" 
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="用最犀利的话骂他..."
            className="w-full bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm focus:outline-none focus:border-orange-500/50"
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
