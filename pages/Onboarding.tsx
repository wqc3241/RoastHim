import React, { useState } from 'react';
import { AppUser } from '../types';
import { supabase } from '../supabaseClient';
import { t } from '../utils/i18n';

interface Props {
  sessionUserId: string;
  onComplete: (user: AppUser) => void;
}

const Onboarding: React.FC<Props> = ({ sessionUserId, onComplete }) => {
  const [name, setName] = useState('');
  const [quote, setQuote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setError(null);

    const fallbackName = name.trim() || t('onboarding_name_placeholder');
    const fallbackQuote = quote.trim() || `“${t('onboarding_quote_placeholder')}”`;
    const avatar = `https://api.dicebear.com/7.x/personas/png?seed=${encodeURIComponent(fallbackName)}&size=200`;

    const { data: authData } = await supabase.auth.getUser();
    const email = authData.user?.email ?? null;

    await supabase.from('app_users').upsert([{
      id: sessionUserId,
      name: fallbackName,
      avatar,
      quote: fallbackQuote,
      level: 1,
      email
    }]);

    await supabase.from('user_stats').upsert([{
      userId: sessionUserId,
      targetsCreated: 0,
      roastsPosted: 0,
      likesReceived: 0,
      exp: 0
    }]);

    const { data: profile, error: profileError } = await supabase
      .from('app_users')
      .select('*')
      .eq('id', sessionUserId)
      .maybeSingle();

    if (profileError || !profile) {
      setError(t('onboarding_save_failed'));
      setIsLoading(false);
      return;
    }

    onComplete({
      id: profile.id,
      name: profile.name,
      avatar: profile.avatar,
      badges: [],
      stats: { targetsCreated: 0, roastsPosted: 0, likesReceived: 0 },
      quote: profile.quote,
      level: profile.level,
      email: profile.email
    });
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen px-6 pt-16 pb-24 flex flex-col items-center">
      <h1 className="text-2xl font-headline text-orange-600 mb-2 italic">{t('onboarding_title')}</h1>
      <p className="text-sm text-slate-500 mb-8">{t('onboarding_subtitle')}</p>

      <div className="w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder={`${t('onboarding_name')} (${t('onboarding_name_placeholder')})`}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <textarea
            rows={3}
            placeholder={`${t('onboarding_quote')} (${t('onboarding_quote_placeholder')})`}
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            value={quote}
            onChange={(e) => setQuote(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-[0_10px_30px_rgba(255,107,53,0.3)] disabled:opacity-60"
          >
            {t('onboarding_submit')}
          </button>
        </form>

        {error && (
          <p className="text-xs text-red-500 mt-4">{error}</p>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
