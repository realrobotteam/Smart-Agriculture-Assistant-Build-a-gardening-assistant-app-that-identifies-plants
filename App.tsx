
import React, { useState } from 'react';
import Header from './components/Header';
import PlantIdentifier from './components/PlantIdentifier';
import Chatbot from './components/Chatbot';
import VideoAnalyzer from './components/VideoAnalyzer';
import DiseaseDiagnoser from './components/DiseaseDiagnoser';
import Footer from './components/Footer';
import FarmLogbook from './components/FarmLogbook';
import Community from './components/Community';
import SmartAlerts from './components/SmartAlerts';
import CropCalendar from './components/CropCalendar';
import AgriculturalCalculators from './components/AgriculturalCalculators';

type ActiveTab = 'identifier' | 'logbook' | 'chat' | 'video' | 'diagnosis' | 'community' | 'alerts' | 'calendar' | 'calculators';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('identifier');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="py-4 flex-grow">
        {activeTab === 'identifier' && <PlantIdentifier />}
        {activeTab === 'logbook' && <FarmLogbook />}
        {activeTab === 'diagnosis' && <DiseaseDiagnoser />}
        {activeTab === 'calendar' && <CropCalendar />}
        {activeTab === 'calculators' && <AgriculturalCalculators />}
        {activeTab === 'alerts' && <SmartAlerts />}
        {activeTab === 'community' && <Community />}
        {activeTab === 'video' && <VideoAnalyzer />}
        {activeTab === 'chat' && <Chatbot />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
