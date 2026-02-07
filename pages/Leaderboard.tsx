
import React from 'react';

const Leaderboard: React.FC = () => {
  return (
    <div className="min-h-screen pb-32 px-4 pt-8">
      <h2 className="text-3xl font-headline text-orange-500 mb-8 italic">荣誉榜 🏆</h2>

      {/* Daily Champion */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-gray-400 mb-4 tracking-widest uppercase">今日骂王</h3>
        <div className="glass rounded-3xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 blur-3xl rounded-full -mr-10 -mt-10" />
          <div className="flex items-start gap-4 mb-4 relative z-10">
            <div className="relative">
              <img src="https://picsum.photos/seed/winner1/100" className="w-16 h-16 rounded-full border-4 border-yellow-500 shadow-xl" />
              <span className="absolute -bottom-1 -right-1 text-2xl">👑</span>
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-yellow-500">毒舌老李</h4>
              <p className="text-xs text-gray-400">蝉联冠军 x3</p>
              <div className="flex items-center gap-1 mt-1">
                <span className="text-orange-500">🔥</span>
                <span className="text-sm font-bold">12,450 赞</span>
              </div>
            </div>
            <div className="w-16 h-16 rounded-xl bg-white/5 border border-white/10 overflow-hidden">
              <img src="https://picsum.photos/seed/target1/100" className="w-full h-full object-cover opacity-50" />
            </div>
          </div>
          <div className="bg-white/5 p-4 rounded-2xl border-l-4 border-yellow-500 relative z-10">
            <p className="text-sm italic text-gray-200 font-medium leading-relaxed">
              “张总改的不是方案，是他那支离破碎的审美，建议他把公司的Logo印在脑门上，这样全世界都能一眼看出谁是那个审美孤儿。”
            </p>
          </div>
        </div>
      </section>

      {/* Top 10 List */}
      <section className="mb-10">
        <h3 className="text-sm font-bold text-gray-400 mb-4 tracking-widest uppercase">今日 TOP 10</h3>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map(rank => (
            <div key={rank} className="flex items-center gap-4 bg-white/5 p-4 rounded-2xl">
              <span className={`text-xl font-headline italic ${rank <= 3 ? 'text-orange-500' : 'text-gray-500'}`}>
                {rank < 10 ? `0${rank}` : rank}
              </span>
              <img src={`https://picsum.photos/seed/user${rank}/60`} className="w-10 h-10 rounded-full" />
              <div className="flex-1">
                <p className="text-sm font-bold">犀利哥_{rank}</p>
                <p className="text-[10px] text-gray-500 truncate w-40">“他这操作真的刷新了我...”</p>
              </div>
              <div className="text-right">
                <span className="block text-xs font-bold text-orange-400">{2000 - rank * 200} 赞</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Hall of Fame */}
      <section>
        <h3 className="text-sm font-bold text-gray-400 mb-4 tracking-widest uppercase">名人堂</h3>
        <div className="grid grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="flex flex-col items-center bg-white/5 p-3 rounded-2xl">
              <span className="text-[8px] text-gray-500 mb-2">09-2{i}</span>
              <div className="relative mb-2">
                <img src={`https://picsum.photos/seed/hist${i}/80`} className="w-12 h-12 rounded-full border border-orange-500/50" />
                <span className="absolute -top-1 -right-1 text-xs">🏆</span>
              </div>
              <span className="text-[10px] font-bold text-gray-300">冠军用户_{i}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Leaderboard;
