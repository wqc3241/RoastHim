
import React, { useEffect, useRef, useState } from 'react';
import { AppUser, AvatarStyle, RoastTarget } from '../types';
import { getPersonaAvatarUrl } from '../constants';
import { supabase } from '../supabaseClient';
import { applyProgress, EXP_RULES, syncBadges } from '../utils/progression';

interface Props {
  onSuccess: () => void;
  currentUser: AppUser | null;
  isAuthenticated: boolean;
  onRequireLogin?: () => void;
}

const Post: React.FC<Props> = ({ onSuccess, currentUser, isAuthenticated, onRequireLogin }) => {
  const [step, setStep] = useState<1 | 2>(1);
  const [formData, setFormData] = useState({
    name: '',
    type: '领导',
    description: '',
    tags: [] as string[],
    style: 'suit-man' as AvatarStyle
  });
  const [experienceText, setExperienceText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const styles: { id: AvatarStyle; label: string; icon: string }[] = [
    { id: 'suit-man', label: '西装男', icon: '👔' },
    { id: 'casual-woman', label: '休闲女', icon: '👚' },
    { id: 'uncle', label: '大叔', icon: '🧔' },
    { id: 'fresh-boy', label: '小鲜肉', icon: '👦' },
    { id: 'mature-woman', label: '御姐', icon: '💃' },
    { id: 'mystery', label: '神秘人', icon: '👤' },
  ];

  const typeOptions = ['领导', '同事', '前任', '室友', '甲方', '亲戚', '陌生人', '其他'];

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  const normalizeType = (value?: string) => {
    if (!value) return formData.type;
    const trimmed = value.trim();
    return typeOptions.includes(trimmed) ? trimmed : '其他';
  };

  const normalizeStyle = (value?: string) => {
    if (!value) return formData.style;
    const match = styles.find((s) => s.id === value.trim());
    return (match ? match.id : 'mystery') as AvatarStyle;
  };

  const normalizeTags = (value?: string[] | string) => {
    const raw = Array.isArray(value)
      ? value
      : (value || '').split(/[,\s]+/);
    return raw
      .map((tag) => tag.trim())
      .filter(Boolean)
      .slice(0, 3)
      .map((tag) => (tag.startsWith('#') ? tag : `#${tag}`));
  };

  const handleVoiceToggle = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setAiError('当前浏览器不支持语音输入');
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'zh-CN';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event: any) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i += 1) {
        const result = event.results[i];
        if (result.isFinal) {
          finalText += result[0].transcript;
        }
      }
      if (finalText.trim()) {
        setExperienceText((prev) => `${prev}${prev ? ' ' : ''}${finalText.trim()}`);
      }
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
  };

  const handleGenerate = async () => {
    if (!experienceText.trim()) {
      setAiError('请先输入经历内容');
      return;
    }
    const geminiKey = (process as any).env?.GEMINI_API_KEY || (process as any).env?.API_KEY;
    if (!geminiKey) {
      setAiError('未配置 GEMINI_API_KEY');
      return;
    }

    setIsGenerating(true);
    setAiError(null);

    const prompt = `你是内容整理助手。根据用户描述生成结构化信息，严格输出 JSON，字段为：
name, type, description, avatarStyle, tags。
约束：
- type 必须是以下之一：${typeOptions.join('、')}。
- avatarStyle 必须是以下之一：${styles.map(s => s.id).join('、')}。
- description 用一句话概括“为什么要骂TA”（不超过 200 字）。
- tags 是数组，最多 3 个，短词即可（如：甲方、改稿王、职场）。
用户描述：${experienceText}`;

    try {
      const model = 'gemini-3-flash-preview';
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': geminiKey
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 }
        })
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const text = data?.candidates?.[0]?.content?.parts?.map((p: any) => p.text).join('') ?? '';
      const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonText) {
        throw new Error('解析失败');
      }
      const parsed = JSON.parse(jsonText);

      setFormData((prev) => ({
        ...prev,
        name: parsed.name ?? prev.name,
        type: normalizeType(parsed.type),
        description: parsed.description ?? prev.description,
        style: normalizeStyle(parsed.avatarStyle),
        tags: normalizeTags(parsed.tags)
      }));
      setStep(2);
    } catch (error: any) {
      setAiError(`生成失败，请重试 (${error?.message || 'unknown'})`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    const newTarget: RoastTarget = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      description: formData.description,
      tags: formData.tags.length > 0 ? formData.tags : [`#${formData.type}`],
      avatarStyle: formData.style,
      avatarUrl: getPersonaAvatarUrl({
        name: formData.name,
        type: formData.type,
        tags: formData.tags.length > 0 ? formData.tags : [`#${formData.type}`],
        description: formData.description
      }),
      roastCount: 0,
      totalLikes: 0,
      heatIndex: 0,
      creatorId: currentUser.id
    };

    if (supabase) {
      await supabase.from('roast_targets').insert([newTarget]);
      await applyProgress({
        userId: currentUser.id,
        targetsCreated: 1,
        exp: EXP_RULES.post
      });
      await syncBadges(currentUser.id);
    }

    onSuccess();
  };

  return (
    <div className="min-h-screen pb-32 px-6 pt-10">
      <h2 className="text-3xl font-headline text-orange-600 mb-8 italic">投稿新对象 🔥</h2>

      {!isAuthenticated && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-600 mb-4">登录后才能投稿</p>
          <button
            onClick={() => onRequireLogin?.()}
            className="px-4 py-2 rounded-full bg-orange-500 text-white font-bold text-sm"
          >
            去登录
          </button>
        </div>
      )}

      {isAuthenticated && (
        <>
        {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
          <label className="block text-sm font-bold text-slate-500 mb-2">经历描述（可语音输入）</label>
          <textarea
            rows={6}
            placeholder="描述一下你和TA的经历，越具体越好..."
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
            value={experienceText}
            maxLength={2000}
            onChange={(e) => setExperienceText(e.target.value)}
          />
          <div className="flex gap-3 mt-3">
            <button
              type="button"
              onClick={handleVoiceToggle}
              className={`px-4 py-2 rounded-lg text-xs font-bold border transition-all ${
                isRecording ? 'bg-orange-500 text-white border-orange-500' : 'bg-white text-slate-600 border-slate-200'
              }`}
            >
              {isRecording ? '停止录音' : '语音输入'}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-60"
            >
              {isGenerating ? '生成中...' : '用 AI 生成'}
            </button>
          </div>
          {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
          <p className="text-[10px] text-slate-400 mt-2">点击生成后进入下一步</p>
        </div>
      )}

        {step === 2 && (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1"
            >
              返回修改经历
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs text-white bg-slate-900 rounded-full px-3 py-1 disabled:opacity-60"
            >
              {isGenerating ? '生成中...' : '重新生成'}
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">TA的昵称 (必填)</label>
            <input 
              required
              placeholder="例如：奇葩领导老王"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">关系/类型</label>
            <div className="grid grid-cols-3 gap-2">
              {typeOptions.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setFormData({...formData, type: t})}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    formData.type === t ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">为什么要骂TA？ (必填)</label>
            <textarea 
              required
              rows={4}
              placeholder="描述一下TA做过的那些奇葩事..."
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">标签（最多3个，用逗号分隔）</label>
            <input
              placeholder="#职场,#改稿王,#甲方"
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
              value={formData.tags.join(',')}
              onChange={(e) =>
                setFormData({ ...formData, tags: normalizeTags(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">头像风格</label>
            <div className="grid grid-cols-3 gap-3">
              {styles.map(s => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setFormData({...formData, style: s.id})}
                  className={`flex flex-col items-center p-3 rounded-xl border transition-all ${
                    formData.style === s.id ? 'bg-orange-500/15 border-orange-500' : 'bg-white border-slate-200 opacity-60'
                  }`}
                >
                  <span className="text-2xl mb-1">{s.icon}</span>
                  <span className="text-[10px] font-bold text-slate-700">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-500 py-4 rounded-full font-bold text-xl text-white shadow-[0_10px_30px_rgba(255,107,53,0.3)] active:scale-95 transition-all mt-4"
          >
            立即提交 🚀
          </button>
        </form>
        )}
        </>
      )}
    </div>
  );
};

export default Post;
