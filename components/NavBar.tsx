
import React from 'react';
import { Page } from '../types';

interface Props {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

const NavBar: React.FC<Props> = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: Page.HOME, label: '首页', icon: '🏠' },
    { id: Page.RANKING, label: '排行榜', icon: '🏆' },
    { id: Page.POST, label: '投稿', icon: '➕', special: true },
    { id: Page.MESSAGES, label: '消息', icon: '🔔' },
    { id: Page.PROFILE, label: '我的', icon: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A2E]/90 backdrop-blur-xl border-t border-white/10 px-6 py-3 pb-6 flex justify-between items-end z-50">
      {navItems.map((item) => (
        <button
          key={item.id}
          onClick={() => onPageChange(item.id)}
          className={`flex flex-col items-center transition-all ${
            item.special ? '-mt-8' : ''
          }`}
        >
          {item.special ? (
            <div className="w-14 h-14 bg-orange-500 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,107,53,0.5)] border-4 border-[#1A1A2E]">
              <span className="text-2xl text-white font-bold">+</span>
            </div>
          ) : (
            <>
              <span className={`text-2xl mb-1 ${currentPage === item.id ? 'opacity-100' : 'opacity-40'}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] ${currentPage === item.id ? 'text-orange-500 font-bold' : 'text-gray-400'}`}>
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
