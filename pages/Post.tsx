
import React, { useEffect, useRef, useState } from 'react';
import { AppUser, AvatarStyle, RoastTarget } from '../types';
import { getPersonaAvatarUrl } from '../constants';
import { supabase } from '../supabaseClient';
import { applyProgress, EXP_RULES, syncBadges } from '../utils/progression';
import { containsProfanity } from '../utils/moderation';
import { getLocale, t } from '../utils/i18n';
import { getTypeLabel, normalizeTypeValue, TYPE_OPTIONS } from '../utils/labels';

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
  const [textError, setTextError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const isZh = getLocale() === 'zh';
  const styleOptions: { id: AvatarStyle; zh: string; en: string; icon: string }[] = [
    { id: 'suit-man', zh: '西装男', en: 'Suit man', icon: '👔' },
    { id: 'casual-woman', zh: '休闲女', en: 'Casual woman', icon: '👚' },
    { id: 'uncle', zh: '大叔', en: 'Uncle', icon: '🧔' },
    { id: 'fresh-boy', zh: '小鲜肉', en: 'Fresh boy', icon: '👦' },
    { id: 'mature-woman', zh: '御姐', en: 'Mature woman', icon: '💃' },
    { id: 'mystery', zh: '神秘人', en: 'Mystery', icon: '👤' },
  ];
  const styles = styleOptions.map((s) => ({
    id: s.id,
    label: isZh ? s.zh : s.en,
    icon: s.icon
  }));

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
    return normalizeTypeValue(value);
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
      setAiError(t('post_voice_unsupported'));
      return;
    }

    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = isZh ? 'zh-CN' : 'en-US';
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
      setAiError(t('post_need_experience'));
      return;
    }
    if (containsProfanity(experienceText)) {
      setTextError(t('post_profanity_experience'));
      return;
    }
    setIsGenerating(true);
    setAiError(null);
    setTextError(null);

    const typeLabels = TYPE_OPTIONS.map((opt) => (isZh ? opt.zh : opt.en)).join(isZh ? '、' : ', ');
    const prompt = isZh
      ? `你是内容整理助手。根据用户描述生成结构化信息，严格输出 JSON，字段为：
name, type, description, avatarStyle, tags。
约束：
- type 必须是以下之一：${typeLabels}。
- avatarStyle 必须是以下之一：${styles.map(s => s.id).join('、')}。
- description 用一句话概括“为什么要骂TA”（不超过 200 字）。
- tags 是数组，最多 3 个，短词即可（如：甲方、改稿王、职场）。
用户描述：${experienceText}`
      : `You are a content summarizer. Based on the user story, output STRICT JSON with fields:
name, type, description, avatarStyle, tags.
Constraints:
- type must be one of: ${typeLabels}.
- avatarStyle must be one of: ${styles.map(s => s.id).join(', ')}.
- description is one sentence for why to roast (<= 200 chars).
- tags is an array, up to 3 short words (e.g. client, late, office).
User description: ${experienceText}`;

    try {
      const res = await fetch('/api/ai/generate-target', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt })
      });

      if (!res.ok) {
        let errMessage = `HTTP ${res.status}`;
        try {
          const errJson = await res.json();
          errMessage = errJson?.error || errMessage;
        } catch {
          const errText = await res.text();
          if (errText) errMessage = errText;
        }
        throw new Error(errMessage);
      }

      const data = await res.json();
      const text = data?.text ?? '';
      const jsonText = text.match(/\{[\s\S]*\}/)?.[0];
      if (!jsonText) {
        throw new Error(t('post_parse_failed'));
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
      setAiError(`${t('post_generate_failed')} (${error?.message || 'unknown'})`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;
    if (
      containsProfanity(formData.name) ||
      containsProfanity(formData.description) ||
      containsProfanity(formData.tags.join(' '))
    ) {
      setTextError(t('post_error_profanity'));
      return;
    }
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
      <h2 className="text-3xl font-headline text-orange-600 mb-8 italic">{t('post_heading')}</h2>

      {!isAuthenticated && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 text-center">
          <p className="text-sm text-slate-600 mb-4">{t('post_login_required')}</p>
          <button
            onClick={() => onRequireLogin?.()}
            className="px-4 py-2 rounded-full bg-orange-500 text-white font-bold text-sm"
          >
            {t('post_login_cta')}
          </button>
        </div>
      )}

      {isAuthenticated && (
        <>
        {step === 1 && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 mb-6">
          <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_experience_label')}</label>
          <textarea
            rows={6}
            placeholder={t('post_experience_placeholder')}
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
              {isRecording ? t('post_voice_stop') : t('post_voice_input')}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white disabled:opacity-60"
            >
              {isGenerating ? t('post_loading') : t('post_generate_ai')}
            </button>
          </div>
          {aiError && <p className="text-xs text-red-500 mt-2">{aiError}</p>}
          {textError && <p className="text-xs text-red-500 mt-2">{textError}</p>}
          <p className="text-[10px] text-slate-400 mt-2">{t('post_next_hint')}</p>
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
              {t('post_back_edit')}
            </button>
            <button
              type="button"
              onClick={handleGenerate}
              disabled={isGenerating}
              className="text-xs text-white bg-slate-900 rounded-full px-3 py-1 disabled:opacity-60"
            >
              {isGenerating ? t('post_loading') : t('post_regen')}
            </button>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_name_label')}</label>
            <input 
              required
              placeholder={t('post_name_placeholder')}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_type_label')}</label>
            <div className="grid grid-cols-3 gap-2">
              {TYPE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, type: option.value })}
                  className={`py-2 rounded-lg text-xs font-bold transition-all border ${
                    formData.type === option.value ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-slate-200 text-slate-500'
                  }`}
                >
                  {getTypeLabel(option.value)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_desc_label')}</label>
            <textarea 
              required
              rows={4}
              placeholder={t('post_desc_placeholder')}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_tags_label')}</label>
            <input
              placeholder={t('post_tags_placeholder')}
              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 focus:outline-none focus:border-orange-500 text-sm"
              value={formData.tags.join(',')}
              onChange={(e) =>
                setFormData({ ...formData, tags: normalizeTags(e.target.value) })
              }
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-500 mb-2">{t('post_style_label')}</label>
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
            {t('post_submit_now')}
          </button>
          {textError && <p className="text-xs text-red-500">{textError}</p>}
        </form>
        )}
        </>
      )}
    </div>
  );
};

export default Post;
