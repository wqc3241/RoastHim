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
          className="w-10 h-10 mx-auto border border-slate-200 rounded-full flex items-center justify-center text-slate-700 hover:bg-slate-50"
          aria-label="Google 登录"
        >
          <svg
            width="18"
            height="18"
            viewBox="0 0 48 48"
            aria-hidden="true"
            className="block"
          >
              <path fill="#EA4335" d="M24 9.5c3.2 0 6 .9 8.2 2.7l6.1-6.1C34.6 2.3 29.7 0 24 0 14.6 0 6.5 5.4 2.6 13.3l7.2 5.6C11.6 12.9 17.3 9.5 24 9.5z"/>
              <path fill="#4285F4" d="M46.5 24.5c0-1.6-.2-3.1-.5-4.5H24v9h12.6c-.6 3.1-2.3 5.7-4.9 7.4l7.5 5.8c4.4-4.1 7.3-10.1 7.3-17.7z"/>
              <path fill="#FBBC05" d="M9.8 28.9c-.5-1.6-.8-3.2-.8-4.9s.3-3.3.8-4.9l-7.2-5.6C1 16.9 0 20.3 0 24s1 7.1 2.6 10.5l7.2-5.6z"/>
              <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.8-5.8l-7.5-5.8c-2.1 1.4-4.8 2.3-8.3 2.3-6.7 0-12.4-3.4-14.2-9.4l-7.2 5.6C6.5 42.6 14.6 48 24 48z"/>
          </svg>
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
