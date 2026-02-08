
import React from 'react';
import { Page } from '../types';

interface Props {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  isAuthenticated?: boolean;
  onRequireLogin?: () => void;
}

const NavBar: React.FC<Props> = ({ currentPage, onPageChange, isAuthenticated = false, onRequireLogin }) => {
  const navItems = [
    { id: Page.HOME, label: '首页', icon: '🏠' },
    { id: Page.RANKING, label: '排行榜', icon: '🏆' },
    { id: Page.POST, label: '投稿', icon: '➕', special: true },
    { id: Page.MESSAGES, label: '消息', icon: '🔔' },
    { id: Page.PROFILE, label: '我的', icon: '👤' },
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
