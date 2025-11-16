import React, { useState } from 'react';
import Header from './components/Header';
import PlantIdentifier from './components/PlantIdentifier';
import Chatbot from './components/Chatbot';
import VideoAnalyzer from './components/VideoAnalyzer';
import DiseaseDiagnoser from './components/DiseaseDiagnoser';
import Footer from './components/Footer';

type ActiveTab = 'identifier' | 'chat' | 'video' | 'diagnosis';

function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('identifier');

  return (
    <div className="min-h-screen bg-gray-50 text-gray-800 flex flex-col">
      <Header activeTab={activeTab} setActiveTab={setActiveTab} />
      <main className="py-4 flex-grow">
        {activeTab === 'identifier' && <PlantIdentifier />}
        {activeTab === 'diagnosis' && <DiseaseDiagnoser />}
        {activeTab === 'video' && <VideoAnalyzer />}
        {activeTab === 'chat' && <Chatbot />}
      </main>
      <Footer />
    </div>
  );
}

export default App;
