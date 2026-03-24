import React, { useState } from 'react';
import { Search, Compass, Footprints, MapPin } from 'lucide-react';
import { TrailData } from '../types';

interface HeroSearchProps {
  onSearch: (query: string) => void;
  isLoading: boolean;
  savedTrails: TrailData[];
  communityTrails: TrailData[];
  onSelectTrail: (trail: TrailData) => void;
  onCommunityClick: () => void;
}

const HeroSearch: React.FC<HeroSearchProps> = ({ onSearch, isLoading, savedTrails, communityTrails, onSelectTrail, onCommunityClick }) => {
  const [input, setInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) {
      onSearch(input);
    }
  };

  const suggestions = [
    "深圳塘朗山",
    "深圳梧桐山",
    "深圳莲花山",
    "香港麦理浩径第二段",
    "武功山",
    "珠峰东坡",
    "贡嘎转山"
  ];

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center overflow-hidden bg-earth-100">
      {/* Background Decorative Elements */}
      <div className="absolute inset-0 z-0 opacity-10">
         <svg className="w-full h-full text-forest-700" fill="currentColor">
           <pattern id="pattern-circles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse" patternContentUnits="userSpaceOnUse">
             <circle id="pattern-circle" cx="10" cy="10" r="1.6257413380501518" fill="currentColor"></circle>
           </pattern>
           <rect id="rect" x="0" y="0" width="100%" height="100%" fill="url(#pattern-circles)"></rect>
         </svg>
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-earth-50/80 z-0 pointer-events-none" />

      <div className="z-10 w-full max-w-2xl px-6 text-center">
        <div className="mb-8 animate-fade-in-down">
          <div className="inline-flex items-center justify-center p-3 bg-forest-100 rounded-full mb-6">
            <Compass className="w-8 h-8 text-forest-700" />
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-earth-900 mb-4 tracking-tight">
            粤晋山海 户外向导
          </h1>
          <p className="text-lg md:text-xl text-earth-600 font-light max-w-lg mx-auto">
            你的私人 AI 户外伴侣。带着信心去探索世界。
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative w-full mb-8 group">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className={`w-6 h-6 ${isLoading ? 'text-forest-500 animate-pulse' : 'text-earth-400'}`} />
          </div>
          <input
            type="text"
            className="w-full pl-12 pr-4 py-4 rounded-2xl border-2 border-earth-200 bg-white/90 backdrop-blur-sm text-lg text-earth-800 placeholder-earth-400 focus:outline-none focus:border-forest-500 focus:ring-4 focus:ring-forest-100 transition-all shadow-lg hover:shadow-xl"
            placeholder="你想去哪里徒步？"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
          <button 
            type="button" 
            onClick={handleSubmit}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 bg-forest-600 hover:bg-forest-700 text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? '规划中...' : '开始探索'}
          </button>
        </form>

        {/* Saved / Contributed Trails Section */}
        {savedTrails.length > 0 && (
           <div className="mb-8 animate-fade-in-up">
              <h3 className="text-xs font-bold text-earth-400 uppercase tracking-widest mb-3">继续你的探索 / 我的收藏</h3>
              <div className="flex flex-wrap justify-center gap-3">
                 {savedTrails.slice(0, 4).map((trail, idx) => (
                    <button
                        key={trail.id || idx}
                        onClick={() => onSelectTrail(trail)}
                        className="bg-white/80 backdrop-blur border border-forest-100 hover:border-forest-300 hover:bg-white text-earth-700 px-4 py-2 rounded-full shadow-sm hover:shadow-md transition-all flex items-center gap-2 group"
                    >
                        <Footprints size={16} className="text-forest-500 group-hover:text-forest-600" />
                        <span className="font-medium text-sm">{trail.name}</span>
                    </button>
                 ))}
                 {savedTrails.length > 4 && (
                    <span className="text-xs text-earth-400 self-center flex items-center">+{savedTrails.length - 4} 更多</span>
                 )}
              </div>
           </div>
        )}

        {/* Community Trails Button */}
        {communityTrails.length > 0 && (
           <div className="mb-6 animate-fade-in-up">
              <button
                  onClick={onCommunityClick}
                  className="bg-gradient-to-r from-forest-500 to-forest-600 hover:from-forest-600 hover:to-forest-700 text-white px-6 py-3 rounded-full shadow-lg hover:shadow-xl transition-all flex items-center gap-2 font-medium"
              >
                  <MapPin size={18} />
                  <span>浏览社区路线 ({communityTrails.length})</span>
              </button>
           </div>
        )}

        <div className="flex flex-wrap justify-center gap-2 text-sm text-earth-500">
          <span className="opacity-70">试试搜索：</span>
          {suggestions.map((s, i) => (
            <button
              key={i}
              onClick={() => {
                setInput(s);
                onSearch(s);
              }}
              className="hover:text-forest-600 hover:underline transition-colors"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
      
      {/* Decorative Bottom */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-earth-50 to-transparent pointer-events-none" />
    </div>
  );
};

export default HeroSearch;