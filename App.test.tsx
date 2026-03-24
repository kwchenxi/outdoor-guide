import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import HeroSearch from './components/HeroSearch';
import { TrailGuideView } from './components/TrailGuideView';
import LoadingScreen from './components/LoadingScreen';
import { TrailData } from './types';

const initializeApp = () => {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error("Could not find root element to mount to");
    return;
  }

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
};

const App: React.FC = () => {
  const [view, setView] = useState<'home' | 'guide' | 'saved' | 'community'>('home');
  const [isLoading, setIsLoading] = useState(false);
  const [currentTrail, setCurrentTrail] = useState<TrailData | null>(null);
  const [savedTrails, setSavedTrails] = useState<TrailData[]>([]);
  const [communityTrails, setCommunityTrails] = useState<TrailData[]>([]);

  const handleSearch = async (query: string) => {
    setIsLoading(true);
    console.log('Searching for:', query);

    setTimeout(() => {
      const mockTrail: TrailData = {
        name: query,
        location: "中国",
        highlight: "这是一条测试路线",
        difficulty: 3,
        duration: "2-3天",
        length: "25-30公里",
        elevationGain: "1600米",
        description: "测试描述",
        story: "测试故事",
      };

      setCurrentTrail(mockTrail);
      setView('guide');
      setIsLoading(false);
    }, 1000);
  };

  const handleSaveTrail = (trail: TrailData) => {
    if (!savedTrails.find(t => t.name === trail.name)) {
      setSavedTrails([...savedTrails, trail]);
    }
  };

  const isCurrentSaved = currentTrail ? !!savedTrails.find(t => t.name === currentTrail.name) : false;

  return (
    <div className="min-h-screen relative font-sans">
      {isLoading && <LoadingScreen />}

      {!isLoading && view === 'home' && (
        <HeroSearch 
          onSearch={handleSearch} 
          isLoading={isLoading} 
          savedTrails={savedTrails}
          communityTrails={communityTrails}
          onSelectTrail={(trail) => {
              setCurrentTrail(trail);
              setView('guide');
          }}
          onCommunityClick={() => setView('community')}
        />
      )}

      {!isLoading && view === 'guide' && currentTrail && (
        <TrailGuideView 
          data={currentTrail} 
          onBack={() => setView('home')} 
          onSave={handleSaveTrail}
          onUpdate={(trail) => setCurrentTrail(trail)}
          onSearch={handleSearch}
          isSaved={isCurrentSaved}
        />
      )}

      {!isLoading && view === 'saved' && (
        <div className="min-h-screen bg-earth-50 p-6 md:p-12">
            <div className="max-w-4xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-earth-800">我的收藏</h1>
                    <button onClick={() => setView('home')} className="text-forest-600 font-medium hover:underline">
                        + 探索更多
                    </button>
                </div>
                {savedTrails.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-earth-300">
                        <p className="text-earth-400">还没有收藏路线，快去探索吧！</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 gap-6">
                        {savedTrails.map((trail, idx) => (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-earth-100 group">
                                <div className="h-40 overflow-hidden relative">
                                    <img 
                                        src={`https://picsum.photos/seed/${trail.name.replace(/\s/g, '')}/800/400`} 
                                        alt={trail.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <h3 className="absolute bottom-3 left-4 text-white font-bold text-xl">{trail.name}</h3>
                                </div>
                                <div className="p-4">
                                    <p className="text-sm text-earth-600 mb-4 line-clamp-2">{trail.highlight}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-forest-600 bg-forest-50 px-2 py-1 rounded">
                                            {trail.length} • {trail.duration}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setCurrentTrail(trail);
                                                setView('guide');
                                            }}
                                            className="text-forest-700 font-medium text-sm hover:underline"
                                        >
                                            查看指南 →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}

      {!isLoading && view === 'community' && (
        <div className="min-h-screen bg-earth-50 p-6 md:p-12">
            <div className="max-w-6xl mx-auto">
                <div className="flex justify-between items-center mb-8">
                    <h1 className="text-3xl font-bold text-earth-800">社区路线</h1>
                    <button onClick={() => setView('home')} className="text-forest-600 font-medium hover:underline">
                        ← 返回搜索
                    </button>
                </div>
                {communityTrails.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-earth-300">
                        <p className="text-earth-400">社区还没有路线，成为第一个贡献者吧！</p>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {communityTrails.map((trail, idx) => (
                            <div key={idx} className="bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-earth-100 group">
                                <div className="h-48 overflow-hidden relative">
                                    <img 
                                        src={`https://picsum.photos/seed/${trail.name.replace(/\s/g, '')}/800/400`} 
                                        alt={trail.name}
                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                    />
                                    <div className="absolute top-2 right-2 bg-forest-600 text-white px-2 py-1 rounded text-xs font-bold">
                                        {trail.difficulty <= 2 ? '轻松' : trail.difficulty === 3 ? '中等' : '困难'}
                                    </div>
                                    <h3 className="absolute bottom-3 left-4 text-white font-bold text-xl">{trail.name}</h3>
                                </div>
                                <div className="p-4">
                                    <p className="text-xs text-earth-500 mb-2 flex items-center gap-1">
                                        <span>📍</span> {trail.location}
                                    </p>
                                    <p className="text-sm text-earth-600 mb-4 line-clamp-2">{trail.highlight}</p>
                                    <div className="flex justify-between items-center">
                                        <div className="text-xs font-bold text-forest-600 bg-forest-50 px-2 py-1 rounded">
                                            {trail.length} • {trail.duration}
                                        </div>
                                        <button 
                                            onClick={() => {
                                                setCurrentTrail(trail);
                                                setView('guide');
                                            }}
                                            className="text-forest-700 font-medium text-sm hover:underline"
                                        >
                                            查看详情 →
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
      )}
    </div>
  );
};

export default App;

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}
