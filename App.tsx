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

const trailDatabase: Record<string, TrailData> = {
  "武功山": {
    name: "武功山",
    location: "中国江西省萍乡市",
    highlight: "中国最美的高山草甸，云海日出令人震撼",
    difficulty: 3,
    duration: "2-3天",
    length: "25-30公里",
    elevationGain: "1600米",
    centerCoordinates: { latitude: 27.625336, longitude: 114.310475 },
    description: "武功山位于江西省萍乡市，是中国最美的高山草甸之一。这里有延绵起伏的高山草甸、壮观的云海日出、奇特的地质景观。武功山分为正穿和反穿两条经典路线，正穿从沈子村出发，反穿从龙山村出发，两条路线各有特色。",
    story: "当你站在金顶之上，脚下是翻涌的云海，头顶是璀璨的星空。这里是武功山最壮观的日出观赏点，高山草甸延绵起伏，如同一片绿色的海洋。清晨时分，云海翻涌，阳光穿透云层，洒在草甸上，形成金色的光带。夜晚，星空璀璨，银河清晰可见，是观星摄影的绝佳地点。",
    routeSegments: [
      {
        name: "正穿经典线 (沈子村-金顶)",
        distance: "18km",
        time: "8-10h",
        description: "最经典的登山路线，路况成熟，适合新手。",
        landmarks: "沈子村 -> 九龙山 -> 铁蹄峰 -> 金顶",
        timeline: [
          { name: "沈子村", type: "point", coordinates: [27.5, 114.2], distance: "0km", time: "0h", description: "起点，海拔约600米" },
          { name: "九龙山", type: "view", coordinates: [27.55, 114.25], distance: "6km", time: "2h", description: "第一个观景平台，视野开阔" },
          { name: "铁蹄峰", type: "rest", coordinates: [27.6, 114.28], distance: "8km", time: "3h", description: "休息点，可补充水源" },
          { name: "金顶", type: "view", coordinates: [27.625336, 114.310475], distance: "4km", time: "1.5h", description: "最高点，日出观赏点" }
        ]
      },
      {
        name: "反穿精华线",
        distance: "22km",
        time: "2天1夜",
        description: "驴友最爱路线，风景更美但难度稍大。",
        landmarks: "龙山村 -> 发云界 -> 绝望坡 -> 金顶",
        timeline: [
          { name: "龙山村", type: "point", coordinates: [27.4, 114.15], distance: "0km", time: "0h", description: "起点，海拔约800米" },
          { name: "发云界", type: "view", coordinates: [27.5, 114.2], distance: "8km", time: "3h", description: "高山草甸开始，视野开阔" },
          { name: "绝望坡", type: "point", coordinates: [27.55, 114.25], distance: "8km", time: "3h", description: "最陡峭的路段，需要小心" },
          { name: "金顶", type: "view", coordinates: [27.625336, 114.310475], distance: "6km", time: "1.5h", description: "最高点，日出观赏点" }
        ]
      }
    ],
    gear: {
      essential: [
        { item: "登山杖", reason: "保护膝盖，减轻负担" },
        { item: "登山鞋", reason: "防滑，提供良好抓地力" },
        { item: "冲锋衣", reason: "防风保暖，应对多变的天气" },
        { item: "背包", reason: "携带必需品和补给" },
        { item: "头灯", reason: "夜间行走必备" }
      ],
      recommended: [
        { item: "防晒霜", reason: "紫外线强，保护皮肤" },
        { item: "墨镜", reason: "雪地反光，保护眼睛" },
        { item: "手套", reason: "防寒保暖" },
        { item: "雨衣", reason: "应对突发天气变化" }
      ]
    },
    safetyTips: [
      "雨天路滑，建议避开或做好防滑措施",
      "山顶风大，注意保暖和防风",
      "建议结伴而行，不要单独行动",
      "携带足够的饮用水和食物",
      "注意天气变化，及时调整行程"
    ],
    bestSeason: "5月-10月",
    communityTips: [
      "建议反穿！风景更美",
      "提前查看天气预报",
      "准备充足的体能训练",
      "携带相机记录美景"
    ]
  },
  "黄山": {
    name: "黄山",
    location: "中国安徽省黄山市",
    highlight: "天下第一奇山，云海、奇松、怪石、温泉四绝",
    difficulty: 4,
    duration: "2天",
    length: "15-20公里",
    elevationGain: "1000米",
    centerCoordinates: { latitude: 30.1667, longitude: 118.1667 },
    description: "黄山位于安徽省黄山市，是中国最著名的山岳风景区之一。黄山以奇松、怪石、云海、温泉、冬雪'五绝'著称于世，是中华民族的象征之一。黄山有72峰，主峰莲花峰海拔1864米。",
    story: "黄山之美，在于其独特的地质景观。奇松如迎客松、送客松、黑虎松等，形态各异，令人叹为观止。怪石如飞来石、猴子观海、仙人指路等，栩栩如生。云海如梦如幻，时而翻涌，时而平静，让人仿佛置身仙境。温泉清澈透明，温度适宜，是放松身心的好去处。",
    routeSegments: [
      {
        name: "经典环线 (云谷寺-光明顶-玉屏楼)",
        distance: "12km",
        time: "6-8h",
        description: "最经典的登山路线，涵盖主要景点。",
        landmarks: "云谷寺 -> 白鹅岭 -> 始信峰 -> 北海宾馆 -> 光明顶 -> 鳌鱼峰 -> 莲花峰 -> 玉屏楼",
        timeline: [
          { name: "云谷寺", type: "point", coordinates: [30.1, 118.1], distance: "0km", time: "0h", description: "起点，海拔约890米" },
          { name: "白鹅岭", type: "view", coordinates: [30.12, 118.13], distance: "3km", time: "1h", description: "观景平台，视野开阔" },
          { name: "始信峰", type: "view", coordinates: [30.14, 118.15], distance: "2km", time: "1h", description: "奇松聚集地" },
          { name: "光明顶", type: "view", coordinates: [30.1667, 118.1667], distance: "3km", time: "1.5h", description: "第二高峰，观云海最佳点" },
          { name: "玉屏楼", type: "view", coordinates: [30.18, 118.18], distance: "4km", time: "2h", description: "迎客松所在地" }
        ]
      }
    ],
    gear: {
      essential: [
        { item: "登山杖", reason: "台阶多，保护膝盖" },
        { item: "登山鞋", reason: "防滑，提供良好抓地力" },
        { item: "冲锋衣", reason: "山顶风大，防风保暖" },
        { item: "背包", reason: "携带必需品和补给" }
      ],
      recommended: [
        { item: "相机", reason: "风景绝美，需要记录" },
        { item: "墨镜", reason: "阳光强烈，保护眼睛" },
        { item: "手套", reason: "扶栏杆时保护手部" },
        { item: "雨衣", reason: "山区天气多变" }
      ]
    },
    safetyTips: [
      "台阶多且陡，注意脚下安全",
      "山顶风大，注意保暖",
      "不要攀爬栏杆，遵守景区规定",
      "携带足够的饮用水",
      "提前查看天气预报"
    ],
    bestSeason: "4月-5月，9月-10月",
    communityTips: [
      "建议坐缆车上山，步行下山",
      "避开节假日，人太多",
      "一定要看日出，非常震撼",
      "住宿要提前预订"
    ]
  },
  "泰山": {
    name: "泰山",
    location: "中国山东省泰安市",
    highlight: "五岳之首，登泰山而小天下",
    difficulty: 3,
    duration: "1-2天",
    length: "10-15公里",
    elevationGain: "1500米",
    centerCoordinates: { latitude: 36.2, longitude: 117.1 },
    description: "泰山位于山东省泰安市，是中国五岳之首，被誉为'天下第一山'。泰山以雄伟壮丽著称，有'登泰山而小天下'的美誉。泰山有历代皇帝封禅的遗迹，文化底蕴深厚。",
    story: "泰山之美，在于其雄伟壮丽的自然景观和深厚的历史文化。从红门出发，沿中路上山，沿途可见历代石刻、庙宇、亭台楼阁。到达南天门后，再登上玉皇顶，可俯瞰群山，感受'会当凌绝顶，一览众山小'的壮阔。泰山日出更是不可错过的美景，太阳从云海中升起，金光万道，令人震撼。",
    routeSegments: [
      {
        name: "中路经典线 (红门-南天门-玉皇顶)",
        distance: "9km",
        time: "4-6h",
        description: "最经典的登山路线，文化底蕴深厚。",
        landmarks: "红门 -> 中天门 -> 十八盘 -> 南天门 -> 玉皇顶",
        timeline: [
          { name: "红门", type: "point", coordinates: [36.15, 117.05], distance: "0km", time: "0h", description: "起点，海拔约200米" },
          { name: "中天门", type: "rest", coordinates: [36.18, 117.08], distance: "4km", time: "2h", description: "休息点，可补充水源" },
          { name: "十八盘", type: "point", coordinates: [36.19, 117.09], distance: "1.5km", time: "1h", description: "最陡峭的路段，需要小心" },
          { name: "南天门", type: "view", coordinates: [36.2, 117.1], distance: "1.5km", time: "1h", description: "登顶前的最后一个关口" },
          { name: "玉皇顶", type: "view", coordinates: [36.21, 117.11], distance: "2km", time: "1h", description: "最高点，观日出最佳点" }
        ]
      }
    ],
    gear: {
      essential: [
        { item: "登山杖", reason: "台阶多，保护膝盖" },
        { item: "登山鞋", reason: "防滑，提供良好抓地力" },
        { item: "冲锋衣", reason: "山顶风大，防风保暖" },
        { item: "背包", reason: "携带必需品和补给" }
      ],
      recommended: [
        { item: "相机", reason: "风景绝美，需要记录" },
        { item: "墨镜", reason: "阳光强烈，保护眼睛" },
        { item: "手套", reason: "扶栏杆时保护手部" },
        { item: "雨衣", reason: "山区天气多变" }
      ]
    },
    safetyTips: [
      "台阶多且陡，注意脚下安全",
      "山顶风大，注意保暖",
      "不要攀爬栏杆，遵守景区规定",
      "携带足够的饮用水",
      "提前查看天气预报"
    ],
    bestSeason: "4月-5月，9月-10月",
    communityTips: [
      "建议夜爬，看日出",
      "体力不好的建议坐缆车",
      "一定要带身份证，需要检票",
      "住宿要提前预订"
    ]
  }
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

    try {
      let trail: TrailData | null = null;
      
      for (const [key, value] of Object.entries(trailDatabase)) {
        if (query.includes(key) || key.includes(query)) {
          trail = { ...value };
          console.log(`Found trail in database: ${key}`, trail.centerCoordinates);
          break;
        }
      }
      
      if (!trail) {
        console.log('Trail not found in database, using geocoding');
        
        let centerCoordinates = { latitude: 30.0, longitude: 102.0 };
        let location = "中国";
        
        try {
          const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const results = await response.json();
          
          if (results && results.length > 0) {
            const lat = parseFloat(results[0].lat);
            const lon = parseFloat(results[0].lon);
            centerCoordinates = { latitude: lat, longitude: lon };
            location = results[0].display_name.split(',')[0];
            console.log(`Geocoding result for "${query}": [${lat}, ${lon}]`);
          } else {
            console.log(`Geocoding failed for "${query}", using default coordinates`);
          }
        } catch (geocodingError) {
          console.error('Geocoding error:', geocodingError);
          console.log(`Using default coordinates for "${query}"`);
        }
        
        trail = {
          name: query,
          location: location,
          highlight: "这是一条测试路线",
          difficulty: 3,
          duration: "2-3天",
          length: "25-30公里",
          elevationGain: "1600米",
          centerCoordinates: centerCoordinates,
          description: "这是一个测试路线的详细描述，用于展示应用的所有功能。",
          story: "当你站在山顶之上，脚下是翻涌的云海，头顶是璀璨的星空。这里是最壮观的日出观赏点，高山草甸延绵起伏，如同一片绿色的海洋。",
          routeSegments: [
            {
              name: "经典路线",
              distance: "18km",
              time: "8-10h",
              description: "最经典的登山路线，路况成熟，适合新手。",
              landmarks: "起点 -> 中途 -> 终点",
              timeline: [
                { name: "起点", type: "point", coordinates: [centerCoordinates.latitude, centerCoordinates.longitude], distance: "0km", time: "0h", description: "起点，海拔约600米" },
                { name: "中途", type: "view", coordinates: [centerCoordinates.latitude + 0.1, centerCoordinates.longitude + 0.1], distance: "9km", time: "4h", description: "观景平台，视野开阔" },
                { name: "终点", type: "view", coordinates: [centerCoordinates.latitude + 0.2, centerCoordinates.longitude + 0.2], distance: "9km", time: "4h", description: "最高点，日出观赏点" }
              ]
            }
          ],
          gear: {
            essential: [
              { item: "登山杖", reason: "保护膝盖，减轻负担" },
              { item: "登山鞋", reason: "防滑，提供良好抓地力" },
              { item: "冲锋衣", reason: "防风保暖，应对多变的天气" },
              { item: "背包", reason: "携带必需品和补给" }
            ],
            recommended: [
              { item: "防晒霜", reason: "紫外线强，保护皮肤" },
              { item: "墨镜", reason: "阳光反光，保护眼睛" },
              { item: "手套", reason: "防寒保暖" },
              { item: "雨衣", reason: "应对突发天气变化" }
            ]
          },
          safetyTips: [
            "雨天路滑，建议避开或做好防滑措施",
            "山顶风大，注意保暖和防风",
            "建议结伴而行，不要单独行动",
            "携带足够的饮用水和食物",
            "注意天气变化，及时调整行程"
          ],
          bestSeason: "5月-10月",
          communityTips: [
            "提前查看天气预报",
            "准备充足的体能训练",
            "携带相机记录美景"
          ]
        };
      }

      setCurrentTrail(trail);
      setView('guide');
      setIsLoading(false);
    } catch (error) {
      console.error('Search failed:', error);
      setIsLoading(false);
    }
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
