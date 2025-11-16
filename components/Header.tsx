import React from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { ChatIcon } from './icons/ChatIcon';
import { VideoIcon } from './icons/VideoIcon';
import { ShieldIcon } from './icons/ShieldIcon';

type ActiveTab = 'identifier' | 'chat' | 'video' | 'diagnosis';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const getTabClass = (tabName: ActiveTab) => {
    return `flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium rounded-full transition-all duration-300 ${
      activeTab === tabName
        ? 'bg-green-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`;
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10 p-4 border-b border-gray-200">
      <div className="max-w-4xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5v2z"></path><path d="M16.24 16.24a5 5 0 0 1-7.07 0l-1.42 1.42a7 7 0 0 0 9.9 0l-1.41-1.42zM5 15v-3a7 7 0 0 1 7-7 7 7 0 0 1 7 7v3"></path><path d="M12 5a2 2 0 0 1-2-2V2a2 2 0 0 1 4 0v1a2 2 0 0 1-2 2z"></path></svg>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                دستیار هوشمند <span className="text-green-600">کشاورزی</span>
            </h1>
        </div>
        <nav className="flex items-center gap-1 md:gap-2 p-1 bg-gray-100 rounded-full">
          <button onClick={() => setActiveTab('identifier')} className={getTabClass('identifier')}>
            <CameraIcon className="w-5 h-5" />
            <span className="hidden sm:inline">شناسایی</span>
          </button>
          <button onClick={() => setActiveTab('diagnosis')} className={getTabClass('diagnosis')}>
            <ShieldIcon className="w-5 h-5" />
            <span className="hidden sm:inline">تشخیص بیماری</span>
          </button>
          <button onClick={() => setActiveTab('video')} className={getTabClass('video')}>
            <VideoIcon className="w-5 h-5" />
            <span className="hidden sm:inline">تحلیل ویدیو</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={getTabClass('chat')}>
            <ChatIcon className="w-5 h-5" />
            <span className="hidden sm:inline">چت‌بات</span>
          </button>
        </nav>
      </div>
    </header>
  );
};

export default Header;
