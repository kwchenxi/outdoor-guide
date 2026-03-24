import React, { useState, useEffect } from 'react';
import { Compass, Map, Mountain, CloudSun, Binoculars } from 'lucide-react';

const LoadingScreen: React.FC = () => {
  const [stage, setStage] = useState(0);

  const stages = [
    { icon: Map, text: "正在定位区域..." },
    { icon: Mountain, text: "分析地形数据..." },
    { icon: CloudSun, text: "评估气候状况..." },
    { icon: Binoculars, text: "搜寻最佳景观..." },
    { icon: Compass, text: "生成路线详情..." },
  ];

  useEffect(() => {
    // Reverted speed to 800ms
    const interval = setInterval(() => {
      setStage((prev) => (prev + 1) % stages.length);
    }, 800); 

    return () => clearInterval(interval);
  }, []);

  const CurrentIcon = stages[stage].icon;

  return (
    <div className="fixed inset-0 bg-earth-50 z-50 flex flex-col items-center justify-center p-4">
      <div className="relative mb-8">
        {/* Pulsing background circle */}
        <div className="absolute inset-0 bg-forest-200 rounded-full animate-ping opacity-20 duration-500"></div>
        <div className="relative bg-white p-6 rounded-full shadow-xl border-4 border-earth-100">
          <CurrentIcon className="w-12 h-12 text-forest-600 animate-bounce" strokeWidth={1.5} />
        </div>
      </div>
      
      <div className="text-center space-y-2 max-w-xs mx-auto">
        <h2 className="text-xl font-bold text-earth-800 animate-fade-in key-{stage}">
          {stages[stage].text}
        </h2>
        <p className="text-earth-500 text-xs">
          AI 正在为你规划行程...
        </p>
      </div>

      {/* Progress Bar */}
      <div className="mt-8 w-64 h-1.5 bg-earth-200 rounded-full overflow-hidden">
        <div className="h-full bg-forest-500 animate-progress"></div>
      </div>
      
      <style>{`
        @keyframes progress {
          0% { width: 0%; margin-left: 0%; }
          50% { width: 100%; margin-left: 0%; }
          100% { width: 0%; margin-left: 100%; }
        }
        .animate-progress {
          animation: progress 2s infinite ease-in-out;
        }
      `}</style>
    </div>
  );
};

export default LoadingScreen;