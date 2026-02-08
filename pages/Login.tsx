import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const Login: React.FC = () => {
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showResend, setShowResend] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    setMessage(null);
    setShowResend(false);

    const authCall = mode === 'login'
      ? supabase.auth.signInWithPassword({ email, password })
      : supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/?onboarding=1` }
        });

    const { data, error } = await authCall;

    if (error) {
      setMessage(error.message);
      if (error.message.toLowerCase().includes('email not confirmed')) {
        setShowResend(true);
      }
    } else if (mode === 'signup') {
      if (data.session) {
        setMessage('注册成功，已自动登录。');
      } else {
        setMessage('注册成功，请检查邮箱进行验证。');
        setShowResend(true);
      }
    }

    setIsLoading(false);
  };

  const handleResend = async () => {
    if (!supabase || !email) return;
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
      options: { emailRedirectTo: `${window.location.origin}/?onboarding=1` }
    });
    setMessage(error ? error.message : '验证邮件已发送，请检查邮箱。');
    setIsResending(false);
  };

  const handleGoogle = async () => {
    if (!supabase) return;
    await supabase.auth.signInWithOAuth({ provider: 'google' });
  };

  return (
    <div className="min-h-screen px-6 pt-16 pb-24 flex flex-col items-center">
      <h1 className="text-3xl font-headline text-orange-600 mb-2 italic">RoastHim 骂他</h1>
      <p className="text-sm text-slate-500 mb-8">登录后开始吐槽</p>

      <div className="w-full bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
        <div className="flex gap-4 mb-6">
          {(['login', 'signup'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setMode(tab)}
              className={`text-sm font-bold pb-2 border-b-2 transition-colors ${
                mode === tab ? 'border-orange-500 text-slate-900' : 'border-transparent text-slate-400'
              }`}
            >
              {tab === 'login' ? '邮箱登录' : '邮箱注册'}
            </button>
          ))}
        </div>

        <form onSubmit={handleEmailAuth} className="space-y-4">
          <input
            type="email"
            required
            placeholder="邮箱"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            type="password"
            required
            placeholder="密码"
            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-orange-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-500 text-white font-bold py-3 rounded-xl shadow-[0_10px_30px_rgba(255,107,53,0.3)] disabled:opacity-60"
          >
            {mode === 'login' ? '登录' : '注册'}
          </button>
        </form>

        <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
          <span className="flex-1 h-px bg-slate-200" />
          或
          <span className="flex-1 h-px bg-slate-200" />
        </div>

        <button
          onClick={handleGoogle}
          className="w-full border border-slate-200 rounded-xl py-3 text-sm font-bold text-slate-700 hover:bg-slate-50"
        >
          使用 Google 登录
        </button>

        {message && (
          <p className="text-xs text-slate-500 mt-4">{message}</p>
        )}
        {showResend && (
          <button
            onClick={handleResend}
            disabled={isResending}
            className="mt-3 text-xs text-orange-600 font-bold"
          >
            {isResending ? '发送中...' : '重新发送验证邮件'}
          </button>
        )}
      </div>
    </div>
  );
};

export default Login;
