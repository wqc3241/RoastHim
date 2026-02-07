
import React, { useState } from 'react';
import { Page, RoastTarget } from './types';
import NavBar from './components/NavBar';
import Home from './pages/Home';
import Details from './pages/Details';
import Post from './pages/Post';
import Leaderboard from './pages/Leaderboard';
import Profile from './pages/Profile';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>(Page.HOME);
  const [selectedTarget, setSelectedTarget] = useState<RoastTarget | null>(null);

  const navigateToDetails = (target: RoastTarget) => {
    setSelectedTarget(target);
    setCurrentPage(Page.DETAILS);
  };

  const renderPage = () => {
    switch (currentPage) {
      case Page.HOME:
        return <Home onSelectTarget={navigateToDetails} />;
      case Page.DETAILS:
        return selectedTarget ? (
          <Details target={selectedTarget} onBack={() => setCurrentPage(Page.HOME)} />
        ) : <Home onSelectTarget={navigateToDetails} />;
      case Page.POST:
        return <Post onSuccess={() => setCurrentPage(Page.HOME)} />;
      case Page.RANKING:
        return <Leaderboard />;
      case Page.PROFILE:
        return <Profile />;
      case Page.MESSAGES:
        return (
          <div className="flex flex-col items-center justify-center h-screen px-10 text-center opacity-40">
            <span className="text-6xl mb-6">🔔</span>
            <h3 className="text-xl font-bold mb-2">暂无新消息</h3>
            <p className="text-sm">当有人给你点赞或评论时，你会在这里看到通知。</p>
          </div>
        );
      default:
        return <Home onSelectTarget={navigateToDetails} />;
    }
  };

  return (
    <div className="max-w-md mx-auto relative bg-[#1A1A2E] shadow-2xl min-h-screen overflow-x-hidden no-scrollbar">
      {renderPage()}
      
      {currentPage !== Page.DETAILS && (
        <NavBar currentPage={currentPage} onPageChange={setCurrentPage} />
      )}
    </div>
  );
};

export default App;
