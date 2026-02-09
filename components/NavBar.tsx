
import React from 'react';
import { Page } from '../types';
import { t } from '../utils/i18n';

interface Props {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isAuthenticated?: boolean;
  onRequireLogin?: () => void;
  variant?: 'mobile' | 'desktop';
}

const NavBar: React.FC<Props> = ({
  currentPage,
  onPageChange,
  isAuthenticated = false,
  onRequireLogin,
  variant = 'mobile'
}) => {
  const navItems = [
    { id: Page.HOME, label: t('nav_home'), icon: '🏠' },
    { id: Page.RANKING, label: t('nav_rank'), icon: '🏆' },
    { id: Page.POST, label: t('nav_post'), icon: '➕', special: true },
    { id: Page.MESSAGES, label: t('nav_messages'), icon: '🔔' },
    { id: Page.PROFILE, label: t('nav_profile'), icon: '👤' },
  ];

  const requiresAuth = (page: Page) => (
    page === Page.POST || page === Page.PROFILE || page === Page.MESSAGES
  );

  const handleNavigate = (page: Page) => {
    if (!isAuthenticated && requiresAuth(page)) {
      onRequireLogin?.();
      return;
    }
    onPageChange(page);
  };

  if (variant === 'desktop') {
    return (
      <aside className="sticky top-6 h-[calc(100vh-3rem)] flex flex-col gap-4">
        <div className="bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-4 py-4 shadow-sm">
          <div className="text-2xl font-headline text-orange-600 italic">{t('login_title')}</div>
          <button
            onClick={() => handleNavigate(Page.POST)}
            className="mt-4 w-full bg-orange-500 text-white font-bold py-2 rounded-full shadow-[0_10px_25px_rgba(255,107,53,0.35)]"
          >
            {t('nav_post')}
          </button>
        </div>
        <nav className="flex-1 bg-white/80 backdrop-blur-md border border-slate-200 rounded-2xl px-3 py-3 shadow-sm flex flex-col gap-1">
          {navItems
            .filter((item) => !item.special)
            .map((item) => (
              <button
                key={item.id}
                onClick={() => handleNavigate(item.id)}
                className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${
                  currentPage === item.id ? 'bg-orange-50 text-orange-600' : 'text-slate-500 hover:bg-slate-50'
                }`}
              >
                <span className="text-xl">{item.icon}</span>
                <span className="text-sm font-semibold">{item.label}</span>
              </button>
            ))}
        </nav>
      </aside>
    );
  }

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-xl border-t border-slate-200 px-6 py-3 pb-6 flex justify-between items-end z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => handleNavigate(item.id)}
          className={`flex flex-col items-center transition-all ${
            item.special ? '-mt-8' : ''
          }`}
        >
          {item.special ? (
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_10px_25px_rgba(255,107,53,0.35)] border-4 border-white">
              <span className="text-2xl text-white font-bold">+</span>
            </div>
          ) : (
            <>
              <span className={`text-2xl mb-1 ${currentPage === item.id ? 'opacity-100' : 'opacity-50'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] ${currentPage === item.id ? 'text-orange-600 font-bold' : 'text-slate-400'}`}>
                {item.label}
              </span>
            </>
          )}
        </button>
      ))}
    </nav>
  );
};

export default NavBar;
