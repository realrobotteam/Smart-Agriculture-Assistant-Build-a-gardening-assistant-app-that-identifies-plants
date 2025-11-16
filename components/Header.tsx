import React, { useState } from 'react';
import { CameraIcon } from './icons/CameraIcon';
import { ChatIcon } from './icons/ChatIcon';
import { VideoIcon } from './icons/VideoIcon';
import { ShieldIcon } from './icons/ShieldIcon';
import { LeafIcon } from './icons/LeafIcon';
import { MenuIcon } from './icons/MenuIcon';
import { CommunityIcon } from './icons/CommunityIcon';

type ActiveTab = 'identifier' | 'myGarden' | 'chat' | 'video' | 'diagnosis' | 'community';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
}

const CloseIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);


const Header: React.FC<HeaderProps> = ({ activeTab, setActiveTab }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const getDesktopTabClass = (tabName: ActiveTab) => {
    return `flex items-center gap-2 px-4 py-2 text-sm md:text-base font-medium rounded-full transition-all duration-300 ${
      activeTab === tabName
        ? 'bg-green-600 text-white shadow-md'
        : 'bg-gray-200 text-gray-600 hover:bg-gray-300'
    }`;
  };

  const getMobileTabClass = (tabName: ActiveTab) => {
    return `flex items-center gap-3 w-full text-right px-4 py-3 text-base font-medium rounded-lg transition-colors duration-200 ${
      activeTab === tabName
        ? 'bg-green-100 text-green-700'
        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
    }`;
  }

  const handleMobileNavClick = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="bg-white/80 backdrop-blur-md sticky top-0 z-10">
      <div className="max-w-4xl mx-auto p-4 border-b border-gray-200 flex justify-between items-center">
        <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22a7 7 0 0 0 7-7h-2a5 5 0 0 1-5 5v2z"></path><path d="M16.24 16.24a5 5 0 0 1-7.07 0l-1.42 1.42a7 7 0 0 0 9.9 0l-1.41-1.42zM5 15v-3a7 7 0 0 1 7-7 7 7 0 0 1 7 7v3"></path><path d="M12 5a2 2 0 0 1-2-2V2a2 2 0 0 1 4 0v1a2 2 0 0 1-2 2z"></path></svg>
            <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                دستیار هوشمند <span className="text-green-600">کشاورزی</span>
            </h1>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1 md:gap-2 p-1 bg-gray-100 rounded-full">
          <button onClick={() => setActiveTab('identifier')} className={getDesktopTabClass('identifier')}>
            <CameraIcon className="w-5 h-5" />
            <span className="">شناسایی</span>
          </button>
           <button onClick={() => setActiveTab('myGarden')} className={getDesktopTabClass('myGarden')}>
            <LeafIcon className="w-5 h-5" />
            <span className="">باغ من</span>
          </button>
          <button onClick={() => setActiveTab('diagnosis')} className={getDesktopTabClass('diagnosis')}>
            <ShieldIcon className="w-5 h-5" />
            <span className="">تشخیص بیماری</span>
          </button>
          <button onClick={() => setActiveTab('community')} className={getDesktopTabClass('community')}>
            <CommunityIcon className="w-5 h-5" />
            <span className="">انجمن</span>
          </button>
          <button onClick={() => setActiveTab('video')} className={getDesktopTabClass('video')}>
            <VideoIcon className="w-5 h-5" />
            <span className="">تحلیل ویدیو</span>
          </button>
          <button onClick={() => setActiveTab('chat')} className={getDesktopTabClass('chat')}>
            <ChatIcon className="w-5 h-5" />
            <span className="">چت‌بات</span>
          </button>
        </nav>
        
        {/* Mobile menu button */}
        <div className="lg:hidden">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-green-500"
            aria-controls="mobile-menu"
            aria-expanded={isMenuOpen}
            aria-label="Open main menu"
          >
            <span className="sr-only">Open main menu</span>
            {isMenuOpen ? <CloseIcon className="block h-6 w-6" /> : <MenuIcon className="block h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="lg:hidden" id="mobile-menu">
          <nav className="p-4 space-y-2 border-b border-gray-200 bg-white">
            <button onClick={() => handleMobileNavClick('identifier')} className={getMobileTabClass('identifier')}><CameraIcon className="w-6 h-6" /><span>شناسایی</span></button>
            <button onClick={() => handleMobileNavClick('myGarden')} className={getMobileTabClass('myGarden')}><LeafIcon className="w-6 h-6" /><span>باغ من</span></button>
            <button onClick={() => handleMobileNavClick('diagnosis')} className={getMobileTabClass('diagnosis')}><ShieldIcon className="w-6 h-6" /><span>تشخیص بیماری</span></button>
            <button onClick={() => handleMobileNavClick('community')} className={getMobileTabClass('community')}><CommunityIcon className="w-6 h-6" /><span>انجمن</span></button>
            <button onClick={() => handleMobileNavClick('video')} className={getMobileTabClass('video')}><VideoIcon className="w-6 h-6" /><span>تحلیل ویدیو</span></button>
            <button onClick={() => handleMobileNavClick('chat')} className={getMobileTabClass('chat')}><ChatIcon className="w-6 h-6" /><span>چت‌بات</span></button>
          </nav>
        </div>
      )}
    </header>
  );
};

export default Header;
