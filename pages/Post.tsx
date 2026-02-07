
import React, { useState } from 'react';
import { AvatarStyle } from '../types';

interface Props {
  onSuccess: () => void;
}

const Post: React.FC<Props> = ({ onSuccess }) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '领导',
    description: '',
    tags: '',
    style: 'suit-man' as AvatarStyle
  });

  const styles: { id: AvatarStyle; label: string; icon: string }[] = [
    { id: 'suit-man', label: '西装男', icon: '👔' },
    { id: 'casual-woman', label: '休闲女', icon: '👚' },
    { id: 'uncle', label: '大叔', icon: '🧔' },
    { id: 'fresh-boy', label: '小鲜肉', icon: '👦' },
    { id: 'mature-woman', label: '御姐', icon: '💃' },
    { id: 'mystery', label: '神秘人', icon: '👤' },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate API call
    onSuccess();
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-10">
      <h2 className="text-3xl font-headline text-orange-500 mb-8 italic">投稿新对象 🔥</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">TA的昵称 (必填)</label>
          <input 
            required
            placeholder="例如：奇葩领导老王"
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
            value={formData.name}
            onChange={e => setFormData({...formData, name: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">关系/类型</label>
          <div className="grid grid-cols-3 gap-2">
            {['领导', '同事', '前任', '室友', '甲方', '亲戚'].map(t => (
              <button
                key={t}
                type="button"
                onClick={() => setFormData({...formData, type: t})}
                className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                  formData.type === t ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white/5 border-white/10 text-gray-400'
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">为什么要骂TA？ (必填)</label>
          <textarea 
            required
            rows={4}
            placeholder="描述一下TA做过的那些奇葩事..."
            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
            value={formData.description}
            onChange={e => setFormData({...formData, description: e.target.value})}
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-400 mb-2">头像风格</label>
          <div className="grid grid-cols-3 gap-3">
            {styles.map(s => (
              <button
                key={s.id}
                type="button"
                onClick={() => setFormData({...formData, style: s.id})}
                className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                  formData.style === s.id ? 'bg-orange-500/20 border-orange-500' : 'bg-white/5 border-white/10 opacity-50'
                }`}
              >
                <span className="text-2xl mb-1">{s.icon}</span>
                <span className="text-[10px] font-bold">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button 
          type="submit"
          className="w-full bg-orange-500 py-4 rounded-full font-bold text-xl shadow-[0_10px_30px_rgba(255,107,53,0.3)] active:scale-95 transition-all mt-4"
        >
          立即提交 🚀
        </button>
      </form>
    </div>
  );
};

export default Post;
