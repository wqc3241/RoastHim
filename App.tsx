
import React, { useEffect, useRef, useState } from 'react';
import { AppUser, Page, RoastTarget } from './types';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Details from './pages/Details';
import Post from './pages/Post';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';
import Login from './pages/Login';
import { supabase } from './supabaseClient';
import Onboarding from './pages/Onboarding';
import { SpeedInsights } from '@vercel/speed-insights/react';
import { Analytics } from '@vercel/analytics/react';
import Messages from './pages/Messages';
import { t } from './utils/i18n';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [selectedTarget, setSelectedTarget] = useState<RoastTarget | null>(null);
  const [sessionUserId, setSessionUserId] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [isProfileLoading, setIsProfileLoading] = useState(false);
  const [loadProfileError, setLoadProfileError] = useState<string | null>(null);
  const isProfileLoadingRef = useRef(false);
  const [showLogin, setShowLogin] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setCurrentUser(null);
      setIsAuthReady(true);
      return;
    }

    const init = async () => {
      try {
        const { data } = await supabase.auth.getSession();
        const userId = data.session?.user?.id ?? null;
        setSessionUserId(userId);
        const url = new URL(window.location.href);
        if (url.searchParams.get('onboarding') === '1') {
          url.searchParams.delete('onboarding');
          window.history.replaceState({}, '', url.toString());
          if (userId) {
            setNeedsOnboarding(true);
          }
        }
        if (userId) {
          await loadProfile(data.session?.user);
        }
      } finally {
        setIsAuthReady(true);
      }
    };

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const userId = session?.user?.id ?? null;
      setSessionUserId(userId);
      if (userId) {
        await loadProfile(session?.user);
      } else {
        setCurrentUser(null);
        setNeedsOnboarding(false);
      }
      setIsAuthReady(true);
    });

    init();

    return () => {
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const handleChange = () => setIsDesktop(mediaQuery.matches);
    handleChange();
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const loadProfile = async (user?: { id: string; email?: string | null; user_metadata?: any }) => {
    if (!supabase || !user) return;
    if (isProfileLoadingRef.current) return;
    isProfileLoadingRef.current = true;
    setIsProfileLoading(true);
    setLoadProfileError(null);
    try {
      const withTimeout = async <T,>(promise: Promise<T>, ms = 2000) => {
        let timeoutId: number | undefined;
        const timeoutPromise = new Promise<T>((_, reject) => {
          timeoutId = window.setTimeout(() => reject(new Error('timeout')), ms);
        });
        try {
          return await Promise.race([promise, timeoutPromise]);
        } finally {
          if (timeoutId) {
            window.clearTimeout(timeoutId);
          }
        }
      };

      const profileResult = await withTimeout(
        supabase
          .from('app_users')
          .select('*')
          .eq('id', user.id)
          .maybeSingle() as unknown as Promise<any>
      );
      const { data: profile, error: profileError } = profileResult as any;
      if (profileError) {
        // Keep existing user to avoid bouncing to onboarding on transient errors.
        if (!currentUser) {
          setNeedsOnboarding(false);
        }
        return;
      }

      if (!profile || !profile.name || !profile.quote) {
        if (!currentUser) {
          setNeedsOnboarding(true);
          setCurrentUser(null);
        }
        return;
      }

      const statsResult = await withTimeout(
        supabase
          .from('user_stats')
          .select('*')
          .eq('userId', user.id)
          .maybeSingle() as unknown as Promise<any>
      );
      const { data: stats } = statsResult as any;
      setNeedsOnboarding(false);
      setCurrentUser({
        id: profile.id,
        name: profile.name,
        avatar: profile.avatar,
        badges: [],
        stats: {
          targetsCreated: stats?.targetsCreated ?? 0,
          roastsPosted: stats?.roastsPosted ?? 0,
          likesReceived: stats?.likesReceived ?? 0
        },
        quote: profile.quote,
        level: profile.level,
        email: profile.email
      });
      setLoadProfileError(null);
    } catch (error) {
      // Avoid forcing onboarding on transient timeouts.
      if (!currentUser) {
        setNeedsOnboarding(false);
        setLoadProfileError(t('app_profile_load_failed'));
      }
    } finally {
      setIsProfileLoading(false);
      isProfileLoadingRef.current = false;
    }
  };

  const handleRetryProfile = async () => {
    if (!supabase) return;
    const { data } = await supabase.auth.getUser();
    if (data.user) {
      await loadProfile(data.user);
    }
  };

  const navigateToDetails = (target: RoastTarget) => {
    setSelectedTarget(target);
    setCurrentPage(Page.DETAILS);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return (
          <Home
            onSelectTarget={navigateToDetails}
            isAuthenticated={!!sessionUserId}
            isDesktop={isDesktop}
          />
        );
      case Page.DETAILS:
        return selectedTarget ? (
          <Details
            target={selectedTarget}
            onBack={() => setCurrentPage(Page.HOME)}
            currentUser={currentUser}
            isAuthenticated={!!sessionUserId}
            onRequireLogin={() => setShowLogin(true)}
          />
        ) : (
          <Home
            onSelectTarget={navigateToDetails}
            isAuthenticated={!!sessionUserId}
            isDesktop={isDesktop}
          />
        );
      case Page.POST:
        return (
          <Post
            onSuccess={() => setCurrentPage(Page.HOME)}
            currentUser={currentUser}
            isAuthenticated={!!sessionUserId}
            onRequireLogin={() => setShowLogin(true)}
          />
        );
      case Page.RANKING:
        return <Leaderboard />;
      case Page.PROFILE:
        return (
          <Profile
            currentUser={currentUser}
            sessionUserId={sessionUserId}
            onNavigateToTarget={navigateToDetails}
            isAuthenticated={!!sessionUserId}
            onRequireLogin={() => setShowLogin(true)}
          />
        );
      case Page.MESSAGES:
        return (
          <Messages
            currentUser={currentUser}
            onNavigateToTarget={navigateToDetails}
          />
        );
      default:
        return <Home onSelectTarget={navigateToDetails} isDesktop={isDesktop} />;
    }
  };

  const canRenderApp = !!supabase && (!needsOnboarding || !!sessionUserId);

  return (
    <div className="min-h-screen bg-slate-50">
      <div className={`mx-auto min-h-screen ${isDesktop ? 'max-w-6xl px-6 py-6' : 'max-w-md'}`}>
        <div className={isDesktop ? 'grid grid-cols-[220px_minmax(0,1fr)] gap-6' : ''}>
          {isDesktop && isAuthReady && !needsOnboarding && (
            <NavBar
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              isAuthenticated={!!sessionUserId}
              onRequireLogin={() => setShowLogin(true)}
              variant="desktop"
            />
          )}
          <div
            className={`relative min-h-screen overflow-x-hidden no-scrollbar ${
              isDesktop
                ? 'bg-white/70 backdrop-blur-md rounded-3xl shadow-xl border border-slate-200'
                : 'bg-slate-50 shadow-xl'
            }`}
          >
            {!isAuthReady && (
              <div
                className={`flex items-center justify-center text-slate-400 text-sm ${
                  isDesktop ? 'min-h-[70vh]' : 'h-screen'
                }`}
              >
                <div className="flex flex-col items-center gap-3">
                  <div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
                  <div className="bg-white/80 border border-slate-200 rounded-full px-4 py-1">
                    {t('app_loading')}
                  </div>
                </div>
              </div>
            )}
            {isAuthReady && !supabase && (
              <div className="flex items-center justify-center h-screen text-slate-400 text-sm">
                {t('app_supabase_missing')}
              </div>
            )}
            {isAuthReady && supabase && sessionUserId && needsOnboarding && (
              <Onboarding
                sessionUserId={sessionUserId}
                onComplete={(user) => {
                  setCurrentUser(user);
                  setNeedsOnboarding(false);
                }}
              />
            )}
            {isAuthReady && supabase && !needsOnboarding && renderPage()}

            {!isDesktop && currentPage !== Page.DETAILS && isAuthReady && !needsOnboarding && (
              <NavBar
                currentPage={currentPage}
                onPageChange={setCurrentPage}
                isAuthenticated={!!sessionUserId}
                onRequireLogin={() => setShowLogin(true)}
              />
            )}

            {isProfileLoading && (
              <div className="fixed inset-0 bg-white/60 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="h-10 w-10 rounded-full border-4 border-orange-200 border-t-orange-500 animate-spin" />
              </div>
            )}

            {loadProfileError && (
              <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-slate-200 shadow-sm rounded-full px-4 py-2 text-xs text-slate-600 flex items-center gap-3">
                <span>{loadProfileError}</span>
                <button
                  onClick={handleRetryProfile}
                  className="text-orange-600 font-bold"
                >
                  {t('app_retry')}
                </button>
              </div>
            )}

            {showLogin && !sessionUserId && (
              <div className="fixed inset-0 bg-white/80 backdrop-blur-sm z-50 overflow-auto">
                <div className="absolute top-4 right-4">
                  <button
                    onClick={() => setShowLogin(false)}
                    className="text-xs text-slate-500 border border-slate-200 rounded-full px-3 py-1"
                  >
                    {t('app_close')}
                  </button>
                </div>
                <Login />
              </div>
            )}
            <SpeedInsights />
            <Analytics />
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
