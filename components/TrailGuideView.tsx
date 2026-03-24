import React, { useState, useEffect, useRef } from 'react';
import { 
  Clock, MapPin, TrendingUp, Ruler, AlertTriangle, 
  ThermometerSun, Camera, Volume2, MessageCircle, 
  ArrowLeft, Share2, Save, PenLine, X, Check, CheckCircle2, Plus, Trash2, Milestone, Flag, Footprints, Info, Image as ImageIcon, Search, Map as MapIcon,
  Navigation, Satellite, Crosshair, Loader2
} from 'lucide-react';
import { TrailData, RouteSegment, RouteNode } from '../types';

// Declare global Leaflet variable since we are loading it via script tag
declare const L: any;

interface TrailGuideViewProps {
  data: TrailData;
  onBack: () => void;
  onSave: (trail: TrailData) => void;
  onUpdate: (trail: TrailData) => void;
  onPublish?: (trail: TrailData) => void;
  onSearch: (query: string) => void;
  isSaved: boolean;
  onToggleFavorite?: (trail: TrailData) => void;
  onSubmitCorrection?: (trailId: string, field: string, oldValue: string, newValue: string) => void;
}

// Editable Component Helper (For simple strings)
interface EditableProps {
  value: string | number | undefined;
  label: string;
  onSave: (value: any) => void;
  isCorrectionMode: boolean;
  multiline?: boolean;
  className?: string;
  placeholder?: string;
}

// Map Picker Component Props
interface MapPickerProps {
    initialCenter: { lat: number, lng: number };
    initialMarker?: [number, number];
    initialQuery?: string; // Pre-fill search with node name
    onConfirm: (coords: [number, number], locationName?: string) => void;
    onCancel: () => void;
}

// Skeleton Components
const TextSkeleton = ({ width = "w-full", lines = 3 }: { width?: string, lines?: number }) => (
    <div className="space-y-2 animate-pulse">
        {[...Array(lines)].map((_, i) => (
            <div key={i} className={`h-4 bg-earth-200 rounded ${i === lines - 1 ? 'w-2/3' : width}`}></div>
        ))}
    </div>
);

const CardSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-earth-100 relative overflow-hidden animate-pulse mb-8">
        <div className="h-6 w-1/3 bg-earth-200 rounded mb-4"></div>
        <div className="h-4 w-1/4 bg-earth-100 rounded mb-6"></div>
        <div className="space-y-3">
            <div className="h-4 w-full bg-earth-100 rounded"></div>
            <div className="h-4 w-full bg-earth-100 rounded"></div>
            <div className="h-4 w-2/3 bg-earth-100 rounded"></div>
        </div>
        <div className="mt-8 border-l-2 border-dashed border-earth-200 ml-3 pl-8 space-y-8">
             {[1, 2, 3].map(i => (
                 <div key={i} className="space-y-2">
                     <div className="h-4 w-1/4 bg-earth-200 rounded"></div>
                     <div className="h-3 w-1/2 bg-earth-100 rounded"></div>
                 </div>
             ))}
        </div>
    </div>
);

// --- Map Picker Modal Component ---
const MapPickerModal: React.FC<MapPickerProps> = ({ initialCenter, initialMarker, initialQuery, onConfirm, onCancel }) => {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const [selectedCoords, setSelectedCoords] = useState<[number, number] | null>(initialMarker || null);
    
    // Search State
    const [searchQuery, setSearchQuery] = useState(initialQuery || '');
    const [isSearching, setIsSearching] = useState(false);
    const [searchResultName, setSearchResultName] = useState<string | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current || typeof L === 'undefined') return;

        const map = L.map(mapContainerRef.current).setView([initialCenter.lat, initialCenter.lng], 13);
        
        // Use OpenStreetMap for more reliable tile loading
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            maxZoom: 19,
            attribution: 'Map data: &copy; OpenStreetMap contributors'
        }).addTo(map);

        mapRef.current = map;

        // If existing marker, add it
        if (initialMarker) {
             const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            markerRef.current = L.marker(initialMarker, { icon }).addTo(map);
            map.setView(initialMarker, 15);
        }

        // Click handler
        map.on('click', (e: any) => {
            const { lat, lng } = e.latlng;
            updateSelection([lat, lng]);
        });
        
        // Auto-search if initialQuery is provided and we don't have a marker yet
        if (initialQuery && !initialMarker) {
             handleSearch(initialQuery);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        }
    }, []);

    const updateSelection = (coords: [number, number], name?: string) => {
        setSelectedCoords(coords);
        if (name) setSearchResultName(name);

        const map = mapRef.current;
        if (!map) return;

        if (markerRef.current) {
            markerRef.current.setLatLng(coords);
        } else {
            const icon = L.divIcon({
                className: 'custom-div-icon',
                html: `<div style="background-color: #ef4444; width: 24px; height: 24px; border-radius: 50%; border: 3px solid white; box-shadow: 0 4px 6px rgba(0,0,0,0.3);"></div>`,
                iconSize: [24, 24],
                iconAnchor: [12, 12]
            });
            markerRef.current = L.marker(coords, { icon }).addTo(map);
        }
        
        // Only fly if it's a significant distance move to avoid jitter on small clicks
        map.flyTo(coords, 16, { duration: 1 });
    };

    const handleSearch = async (queryOverride?: string) => {
        const q = queryOverride || searchQuery;
        if (!q.trim()) return;

        setIsSearching(true);
        try {
            // Using OSM Nominatim for geocoding (Free, open source)
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&limit=1`);
            const results = await response.json();

            if (results && results.length > 0) {
                const lat = parseFloat(results[0].lat);
                const lon = parseFloat(results[0].lon);
                updateSelection([lat, lon], results[0].display_name.split(',')[0]); // Use the first part of the name
            } else {
                alert("未找到该地点，请尝试手动选点");
            }
        } catch (e) {
            console.error("Geocoding failed", e);
            alert("搜索服务暂不可用，请手动选点");
        } finally {
            setIsSearching(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[80] bg-earth-900/90 backdrop-blur-sm flex flex-col animate-fade-in">
            {/* Top Toolbar */}
            <div className="bg-earth-800 p-4 flex flex-col md:flex-row justify-between items-center text-white shrink-0 shadow-md z-20 gap-4">
                <div className="flex items-center gap-4 w-full md:w-auto">
                    <div>
                        <h3 className="font-bold text-lg flex items-center gap-2">
                            <Crosshair size={20} />
                            地图选点
                        </h3>
                    </div>
                </div>
                
                {/* Search Bar - Floating in toolbar on mobile, or just centered */}
                <div className="flex-1 w-full md:max-w-md relative">
                    <div className="relative group">
                        <input 
                            type="text" 
                            className="w-full bg-earth-700/50 border border-earth-600 rounded-full py-2 pl-10 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-forest-500 focus:bg-earth-700 transition-all text-white placeholder-earth-400"
                            placeholder="输入地名搜索 (如: 玉龙雪山)"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" size={16} />
                        <button 
                            onClick={() => handleSearch()}
                            disabled={isSearching}
                            className="absolute right-1 top-1/2 -translate-y-1/2 bg-forest-600 hover:bg-forest-500 p-1.5 rounded-full text-white transition-colors disabled:opacity-50"
                        >
                            {isSearching ? <Loader2 size={14} className="animate-spin"/> : <ArrowLeft size={14} className="rotate-180"/>}
                        </button>
                    </div>
                </div>

                <div className="flex gap-3 w-full md:w-auto justify-end">
                    <button onClick={onCancel} className="px-4 py-2 text-earth-300 hover:text-white transition-colors text-sm">取消</button>
                    <button 
                        onClick={() => selectedCoords && onConfirm(selectedCoords, searchResultName || undefined)}
                        disabled={!selectedCoords}
                        className="bg-forest-600 hover:bg-forest-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-5 py-2 rounded-lg font-bold transition-all shadow-lg text-sm flex items-center gap-2"
                    >
                        <Check size={16} />
                        确认坐标
                    </button>
                </div>
            </div>
            
            <div className="flex-1 relative bg-earth-100">
                <div ref={mapContainerRef} className="absolute inset-0 z-0"></div>
                
                {/* Coordinate Display Overlay */}
                {selectedCoords && (
                    <div className="absolute bottom-8 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur px-4 py-3 rounded-xl shadow-xl z-[400] text-sm text-earth-800 border border-earth-200 flex flex-col items-center gap-1 min-w-[200px]">
                        <span className="font-bold text-forest-700 flex items-center gap-1">
                            <MapPin size={14} fill="currentColor" />
                            {searchResultName || "已选定位置"}
                        </span>
                        <span className="font-mono text-xs text-earth-500">
                            {selectedCoords[0].toFixed(5)}, {selectedCoords[1].toFixed(5)}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
};


export const TrailGuideView: React.FC<TrailGuideViewProps> = ({ data, onBack, onSave, onUpdate, onPublish, onSearch, isSaved, onToggleFavorite, onSubmitCorrection }) => {
  const [activeTab, setActiveTab] = useState<'story' | 'map' | 'gear' | 'safety'>('story');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isCorrectionMode, setIsCorrectionMode] = useState(false);
  const mapSectionRef = useRef<HTMLDivElement>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  // Use any for Leaflet types to avoid import issues
  const mapInstanceRef = useRef<any>(null);
  const polylineRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Map Context State
  const [mapContext, setMapContext] = useState<string>('');
  
  // We now track the active segment itself to derive coordinates from its timeline
  const [activeSegment, setActiveSegment] = useState<RouteSegment | null>(null);

  // State for the active editing modal (Simple String)
  const [editingItem, setEditingItem] = useState<{
    value: string | number;
    label: string;
    onSave: (val: any) => void;
    multiline: boolean;
  } | null>(null);

  // State for Advanced Node Editor (Name + Coords)
  const [editingNode, setEditingNode] = useState<{
      node: RouteNode;
      segmentIndex: number; // -1 for new node
      nodeIndex: number;   // -1 for new node
      onSave: (updatedNode: RouteNode) => void;
  } | null>(null);

  // State for Map Picker
  const [isMapPickerOpen, setIsMapPickerOpen] = useState(false);
  const [mapPickerInitialQuery, setMapPickerInitialQuery] = useState<string>('');
  // Callback to handle picker result
  const mapPickerCallbackRef = useRef<((coords: [number, number], name?: string) => void) | null>(null);


  // State for Adding New Segment
  const [isAddingSegment, setIsAddingSegment] = useState(false);
  const [newSegment, setNewSegment] = useState<RouteSegment>({
    name: '',
    distance: '',
    time: '',
    description: '',
    landmarks: '',
    timeline: []
  });
  
  // Local state for timeline inputs
  const [timelineNodes, setTimelineNodes] = useState<RouteNode[]>([]);
  // We replace the complex newNodeInput state with a simpler trigger to open the Node Editor
  
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
    setMapContext(`${data.name} 概览`);
  }, [data.name]); 

  // Initialize Map when tab is 'map'
  useEffect(() => {
    // Only initialize if tab is map and container exists
    if (activeTab === 'map' && mapContainerRef.current) {
        
        // Safety: If map already exists (shouldn't happen with cleanup, but good to check), destroy it
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
        }

        const defaultLat = data.centerCoordinates?.latitude || 30.0;
        const defaultLng = data.centerCoordinates?.longitude || 102.0;

        console.log(`[Map Init] Initializing map for ${data.name} at [${defaultLat}, ${defaultLng}]`);
        console.log(`[Map Init] centerCoordinates:`, data.centerCoordinates);

        try {
            // Access global L
            if (typeof L === 'undefined') {
                console.error("Leaflet library not loaded");
                return;
            }

            const map = L.map(mapContainerRef.current).setView([defaultLat, defaultLng], 12);
            
            // Use OpenStreetMap for more reliable tile loading
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                maxZoom: 19,
                attribution: 'Map data: &copy; OpenStreetMap contributors'
            }).addTo(map);

            mapInstanceRef.current = map;
            
            // Force a resize check after mount to prevent grey tiles
            setTimeout(() => {
                map.invalidateSize();
            }, 200);

        } catch (error) {
            console.error("Map initialization failed:", error);
        }
    }

    // CLEANUP FUNCTION: Destroy map when tab changes or component unmounts
    return () => {
        if (mapInstanceRef.current) {
            mapInstanceRef.current.remove();
            mapInstanceRef.current = null;
            polylineRef.current = null;
            markersRef.current = [];
        }
    };
  }, [activeTab, data.name, data.centerCoordinates]); 

  // Update map view when data changes (if map is already initialized)
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && data.centerCoordinates) {
      const { latitude, longitude } = data.centerCoordinates;
      console.log(`[Map Update] Updating map view for ${data.name} to [${latitude}, ${longitude}]`);
      map.setView([latitude, longitude], 12);
    }
  }, [data.name, data.centerCoordinates]);

  // Force map update when switching routes
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (map && activeTab === 'map' && data.centerCoordinates) {
      const { latitude, longitude } = data.centerCoordinates;
      console.log(`[Map Force] Forcing map update for ${data.name} to [${latitude}, ${longitude}]`);
      setTimeout(() => {
        map.setView([latitude, longitude], 12);
        map.invalidateSize();
      }, 100);
    }
  }, [activeTab]);

  // Handle drawing the route on the map based on Timeline Nodes
  useEffect(() => {
      const map = mapInstanceRef.current;
      if (!map) return;
      if (typeof L === 'undefined') return;

      // Clear existing polyline and markers
      if (polylineRef.current) {
          polylineRef.current.remove();
          polylineRef.current = null;
      }
      markersRef.current.forEach(m => m.remove());
      markersRef.current = [];

      // Determine path coordinates. 
      // Priority: Timeline Node Coordinates -> data.centerCoordinates
      let pathCoords: any[] = [];

      if (activeSegment && activeSegment.timeline && activeSegment.timeline.length > 0) {
          // Filter nodes that actually have coordinates
          const nodesWithCoords = activeSegment.timeline.filter(n => n.coordinates && n.coordinates.length === 2);
          
          if (nodesWithCoords.length > 0) {
              pathCoords = nodesWithCoords.map(n => n.coordinates);
              
              // Draw Markers for each node
              nodesWithCoords.forEach((node, index) => {
                  const markerIcon = L.divIcon({
                      className: 'custom-div-icon',
                      html: `<div style="background-color: #16a34a; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; border: 2px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${index + 1}</div>`,
                      iconSize: [24, 24],
                      iconAnchor: [12, 12]
                  });

                  const marker = L.marker(node.coordinates, { icon: markerIcon })
                      .addTo(map)
                      .bindPopup(`<b>${index + 1}. ${node.name}</b><br/>${node.description || ''}`);
                  
                  markersRef.current.push(marker);
              });
          }
      } 
      // Fallback: If legacy "path" exists (from simulation), use it
      else if (activeSegment && activeSegment.path && activeSegment.path.length > 0) {
          pathCoords = activeSegment.path as any[];
      }

      // Draw Polyline if we have coords
      if (pathCoords.length > 0) {
          try {
              const polyline = L.polyline(pathCoords, {
                  color: '#ef4444', // Red-500
                  weight: 4,
                  opacity: 0.8,
                  dashArray: '5, 10', // Dashed for "trail" look
                  lineJoin: 'round'
              }).addTo(map);

              polylineRef.current = polyline;
              
              // Fit map to the route with animation
              map.fitBounds(polyline.getBounds(), { 
                  padding: [50, 50],
                  animate: true
              });

          } catch (e) {
              console.error("Error drawing route:", e);
          }
      } else if (data.centerCoordinates) {
          // Reset view to center if no route selected
          map.setView([data.centerCoordinates.latitude, data.centerCoordinates.longitude], 12);
          // Add a simple center marker
           L.marker([data.centerCoordinates.latitude, data.centerCoordinates.longitude])
              .addTo(map)
              .bindPopup("起点/中心点");
      }

  }, [activeSegment, activeTab, data.centerCoordinates]);


  const handleSearchSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (searchQuery.trim()) {
          onSearch(searchQuery);
          setSearchQuery('');
      }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  }

  const handleViewOnMap = (segment: RouteSegment) => {
      setActiveSegment(segment);
      setMapContext(`${segment.name} (轨迹视图)`);
      
      const hasCoords = segment.timeline?.some(n => n.coordinates) || (segment.path && segment.path.length > 0);
      
      if (hasCoords) {
          showToast(`已加载路线: ${segment.name}`);
      } else {
          showToast(`该路线暂无详细坐标数据，显示概览位置`);
      }
      
      setActiveTab('map');
      
      setTimeout(() => {
        if (mapSectionRef.current) {
            mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 50);
  };

  const flyToNode = (node: RouteNode) => {
      // First ensure we are on the map tab
      if (activeTab !== 'map') {
         setActiveTab('map');
         setTimeout(() => {
            if (mapSectionRef.current) {
                mapSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
            // Add a small delay for map to render before flying
            setTimeout(() => performFly(node), 300);
         }, 50);
      } else {
         performFly(node);
      }
  };

  const performFly = (node: RouteNode) => {
      if (node.coordinates && mapInstanceRef.current) {
          mapInstanceRef.current.flyTo(node.coordinates, 15, {
              animate: true,
              duration: 1.5
          });
          showToast(`定位至: ${node.name}`);
      } else {
          showToast("该节点暂无坐标数据");
      }
  }

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      if (isSpeaking) {
        window.speechSynthesis.cancel();
        setIsSpeaking(false);
      } else {
        const utterance = new SpeechSynthesisUtterance(text);
        const voices = window.speechSynthesis.getVoices();
        const zhVoice = voices.find(v => v.lang.includes('zh'));
        if (zhVoice) utterance.voice = zhVoice;
        
        utterance.onend = () => setIsSpeaking(false);
        window.speechSynthesis.speak(utterance);
        setIsSpeaking(true);
      }
    }
  };

  const handleEditSave = () => {
    if (editingItem) {
      editingItem.onSave(editingItem.value);
      setEditingItem(null);
      
      if (onSubmitCorrection && data.id) {
        onSubmitCorrection(data.id, editingItem.label, String(data[editingItem.label as keyof TrailData] || ''), editingItem.value);
      }
      
      showToast("感谢！纠错已提交至社区数据库。");
    }
  };

  // --- Node Editor Logic ---
  const openNodeEditor = (node: RouteNode, segmentIndex: number, nodeIndex: number, onSave: (n: RouteNode) => void) => {
      setEditingNode({ node: { ...node }, segmentIndex, nodeIndex, onSave });
  };

  const openMapPicker = (currentCoords?: [number, number], initialName?: string) => {
      setMapPickerInitialQuery(initialName || '');
      return new Promise<{coords: [number, number], name?: string}>((resolve) => {
          mapPickerCallbackRef.current = (coords, name) => resolve({coords, name});
          setIsMapPickerOpen(true);
      });
  };

  const handleMapPickerConfirm = (coords: [number, number], name?: string) => {
      if (mapPickerCallbackRef.current) {
          mapPickerCallbackRef.current(coords, name);
          mapPickerCallbackRef.current = null;
      }
      setIsMapPickerOpen(false);
  };

  const handleMapPickerCancel = () => {
      mapPickerCallbackRef.current = null;
      setIsMapPickerOpen(false);
  };

  const handleNodeSave = () => {
      if (editingNode) {
          editingNode.onSave(editingNode.node);
          setEditingNode(null);
          showToast("路标信息已更新");
      }
  };
  
  // --- New Segment Logic ---
  
  const handleAddNewNodeClick = () => {
      // Open the advanced editor for a blank node
      const blankNode: RouteNode = { name: '', distance: '', time: '', description: '', type: 'point' };
      openNodeEditor(blankNode, -1, -1, (savedNode) => {
          setTimelineNodes([...timelineNodes, savedNode]);
      });
  };

  const removeTimelineNode = (index: number) => {
    setTimelineNodes(timelineNodes.filter((_, i) => i !== index));
  };

  const handleAddSegment = () => {
    if (!newSegment.name) {
        showToast("请填写路线名称");
        return;
    }
    
    if (timelineNodes.length < 2) {
        showToast("请至少添加2个路标以生成完整的时间轴");
        return;
    }
    
    const totalDist = timelineNodes.map(n => n.distance).filter(Boolean).join('+') || "详见路标";
    const totalTime = timelineNodes.map(n => n.time).filter(Boolean).join('+') || "详见路标";

    const finalSegment: RouteSegment = {
        ...newSegment,
        distance: totalDist.length > 20 ? "多种路段" : totalDist,
        time: totalTime.length > 20 ? "多段耗时" : totalTime,
        description: `包含 ${timelineNodes.length} 个路标的路线: ${timelineNodes.map(n=>n.name).slice(0,3).join(', ')}...`,
        landmarks: timelineNodes.map(n => n.name).join(' -> '),
        timeline: timelineNodes,
        path: [] 
    };

    const currentSegments = data.routeSegments || [];
    const updatedSegments = [...currentSegments, finalSegment];
    onUpdate({ ...data, routeSegments: updatedSegments });
    
    setIsAddingSegment(false);
    showToast(`“${newSegment.name}”已同步至社区云端数据库！`);
    
    setNewSegment({
        name: '',
        distance: '',
        time: '',
        description: '',
        landmarks: '',
        timeline: []
    });
    setTimelineNodes([]);
  };

  const startAddSegment = () => {
      const travelerRouteCount = data.routeSegments ? data.routeSegments.length : 0;
      setNewSegment({
          name: `我的探索路线 ${travelerRouteCount + 1}`,
          distance: '',
          time: '',
          description: '',
          landmarks: '',
          timeline: []
      });
      setTimelineNodes([]);
      setIsAddingSegment(true);
  };

  const Editable: React.FC<EditableProps> = ({ value, label, onSave, isCorrectionMode, multiline, className, placeholder }) => {
    if (!isCorrectionMode) {
        if (!value) return null;
        return <span className={className}>{value}</span>;
    }

    return (
      <span 
        className={`cursor-pointer border-b-2 border-dashed border-orange-400 bg-orange-50 hover:bg-orange-100 transition-colors px-1 rounded ${className || ''} ${!value ? 'text-orange-400 italic text-xs' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
          setEditingItem({ value: value || '', label, onSave, multiline: !!multiline });
        }}
        title={`点击纠正: ${label}`}
      >
        {value || placeholder || `[添加${label}]`}
      </span>
    );
  };

  const difficultyColor = (level: number) => {
    if (level <= 2) return 'bg-forest-100 text-forest-700';
    if (level === 3) return 'bg-yellow-100 text-yellow-700';
    return 'bg-red-100 text-red-700';
  };

  const difficultyLabel = (level: number) => {
     if (level <= 2) return '轻松/入门';
     if (level === 3) return '中等';
     if (level === 4) return '困难';
     return '专家级';
  };

  const isMiscLoaded = !!data.story;
  const isRoutesLoaded = !!data.routeSegments && data.routeSegments.length > 0;

  return (
    <div className="min-h-screen bg-earth-50 pb-20 relative">
      
      {/* --- Map Picker Overlay --- */}
      {isMapPickerOpen && (
          <MapPickerModal 
            initialCenter={data.centerCoordinates ? { lat: data.centerCoordinates.latitude, lng: data.centerCoordinates.longitude } : {lat:30, lng:102}}
            initialMarker={editingNode?.node?.coordinates}
            initialQuery={mapPickerInitialQuery}
            onConfirm={handleMapPickerConfirm}
            onCancel={handleMapPickerCancel}
          />
      )}

      {isCorrectionMode && (
        <div className="sticky top-0 z-50 bg-orange-600 text-white px-4 py-3 shadow-md animate-fade-in-down flex justify-between items-center">
          <div className="flex items-center gap-2">
            <PenLine className="animate-pulse" size={20} />
            <span className="font-medium text-sm md:text-base">纠错模式已开启：点击虚线内容或路标进行纠正</span>
          </div>
          <button 
            onClick={() => setIsCorrectionMode(false)}
            className="bg-white/20 hover:bg-white/30 p-1 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* Header Image Area */}
      <div className="relative h-[20vh] md:h-[25vh] w-full overflow-hidden">
         <img 
            src={`https://picsum.photos/seed/${data.name.replace(/\s/g, '')}/1200/800`} 
            alt={data.name}
            className="w-full h-full object-cover"
         />
         <div className="absolute inset-0 bg-gradient-to-t from-earth-900/90 via-earth-900/40 to-transparent" />
         
         <div className="absolute top-0 left-0 right-0 p-4 z-30 flex items-center justify-between gap-3">
            <button onClick={onBack} className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-sm flex-shrink-0">
                <ArrowLeft size={24} />
            </button>

            <form onSubmit={handleSearchSubmit} className="flex-1 max-w-md relative group">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-white/70 group-focus-within:text-white transition-colors">
                    <Search size={16} />
                </div>
                <input 
                    type="text" 
                    className="w-full pl-9 pr-4 py-2.5 rounded-full bg-white/20 backdrop-blur-md border border-white/20 text-white placeholder-white/70 focus:outline-none focus:bg-white/30 focus:border-white/50 transition-all shadow-sm text-sm"
                    placeholder="搜新路线..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </form>

            <div className="flex gap-2 flex-shrink-0">
                <button 
                    onClick={() => setIsCorrectionMode(!isCorrectionMode)}
                    className={`p-2 backdrop-blur-md rounded-full transition-all shadow-sm ${isCorrectionMode ? 'bg-orange-500 text-white ring-2 ring-orange-200' : 'bg-white/20 text-white hover:bg-white/30'}`}
                    title={isCorrectionMode ? "退出纠错模式" : "开启纠错模式"}
                >
                    <PenLine size={24} />
                </button>
                {onToggleFavorite && (
                    <button 
                        onClick={() => onToggleFavorite(data)}
                        className={`p-2 backdrop-blur-md rounded-full transition-all shadow-sm ${isSaved ? 'bg-red-500 text-white' : 'bg-white/20 text-white hover:bg-white/30'}`}
                        title={isSaved ? "取消收藏" : "收藏路线"}
                    >
                        <Save size={24} />
                    </button>
                )}
                {onPublish && !data.id && (
                    <button 
                        onClick={() => onPublish(data)}
                        className="p-2 bg-gradient-to-r from-forest-500 to-forest-600 text-white rounded-full transition-all shadow-sm hover:shadow-lg"
                        title="发布到社区"
                    >
                        <CheckCircle2 size={24} />
                    </button>
                )}
                <button className="p-2 bg-white/20 backdrop-blur-md rounded-full text-white hover:bg-white/30 transition-all shadow-sm">
                    <Share2 size={24} />
                </button>
            </div>
         </div>

         <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10 text-white">
            <div className="flex items-center gap-2 mb-2 text-earth-100 text-sm font-medium uppercase tracking-wider">
                <MapPin size={16} />
                <Editable 
                  value={data.location} 
                  label="地点"
                  isCorrectionMode={isCorrectionMode}
                  onSave={(val) => onUpdate({...data, location: val})}
                />
            </div>
            <h1 className="text-3xl md:text-5xl font-bold mb-3 shadow-sm">
              <Editable 
                value={data.name} 
                label="路线名称"
                isCorrectionMode={isCorrectionMode}
                onSave={(val) => onUpdate({...data, name: val})}
              />
            </h1>
            <div className="text-lg text-earth-100 font-light italic opacity-90 border-l-4 border-forest-500 pl-4">
                "
                <Editable 
                  value={data.highlight} 
                  label="一句话亮点"
                  isCorrectionMode={isCorrectionMode}
                  multiline
                  onSave={(val) => onUpdate({...data, highlight: val})}
                />
                "
            </div>
         </div>
      </div>

      <div className="max-w-4xl mx-auto -mt-8 relative z-10 px-4">
        {/* Core Stats Card */}
        <div className="bg-white rounded-2xl shadow-xl p-6 grid grid-cols-2 md:grid-cols-4 gap-6 text-center border border-earth-100">
            <div className="flex flex-col items-center">
                <div className={`px-3 py-1 rounded-full text-xs font-bold mb-2 ${difficultyColor(data.difficulty)}`}>
                    {difficultyLabel(data.difficulty)}
                </div>
                <div className="flex text-yellow-400 text-sm">
                    {[...Array(5)].map((_, i) => (
                        <span key={i} className={i < data.difficulty ? "opacity-100" : "opacity-30"}>★</span>
                    ))}
                </div>
                <span className="text-earth-400 text-xs mt-1">难度等级</span>
            </div>
            <div className="flex flex-col items-center">
                <Clock className="text-forest-600 mb-2" />
                <span className="font-bold text-earth-800">
                   <Editable 
                      value={data.duration} 
                      label="预计耗时" 
                      isCorrectionMode={isCorrectionMode}
                      onSave={(val) => onUpdate({...data, duration: val})}
                   />
                </span>
                <span className="text-earth-400 text-xs">预计耗时</span>
            </div>
            <div className="flex flex-col items-center">
                <Ruler className="text-sky-600 mb-2" />
                <span className="font-bold text-earth-800">
                  <Editable 
                      value={data.length} 
                      label="总长度" 
                      isCorrectionMode={isCorrectionMode}
                      onSave={(val) => onUpdate({...data, length: val})}
                   />
                </span>
                <span className="text-earth-400 text-xs">总长度</span>
            </div>
            <div className="flex flex-col items-center">
                <TrendingUp className="text-orange-600 mb-2" />
                <span className="font-bold text-earth-800">
                  <Editable 
                      value={data.elevationGain} 
                      label="累计爬升" 
                      isCorrectionMode={isCorrectionMode}
                      onSave={(val) => onUpdate({...data, elevationGain: val})}
                   />
                </span>
                <span className="text-earth-400 text-xs">累计爬升</span>
            </div>
        </div>
      </div>

      {/* Main Content Area - Stacked Layout */}
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        
        {/* Combined Info Card (Story, Map, Gear, Safety) */}
        <div ref={mapSectionRef} className="bg-white rounded-2xl shadow-xl border border-earth-100 overflow-hidden scroll-mt-24">
             {/* Tabs Header */}
             <div className="flex border-b border-earth-100 bg-earth-50/30 overflow-x-auto no-scrollbar">
                 {['story', 'map', 'gear', 'safety'].map((tab) => (
                     <button 
                        key={tab}
                        onClick={() => setActiveTab(tab as any)}
                        className={`flex-1 py-4 text-center font-bold text-sm md:text-base transition-colors duration-200 relative whitespace-nowrap min-w-[80px]
                            ${activeTab === tab ? 'text-forest-700 bg-white' : 'text-earth-500 hover:bg-earth-50 hover:text-earth-700'}
                        `}
                     >
                        {tab === 'story' && '故事与介绍'}
                        {tab === 'map' && '地形与地图'}
                        {tab === 'gear' && '装备清单'}
                        {tab === 'safety' && '安全与贴士'}
                        {activeTab === tab && (
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-forest-500 rounded-t-full mx-6"></span>
                        )}
                     </button>
                 ))}
             </div>
             
             {/* Tab Content - Checks isMiscLoaded */}
             <div className="p-6 md:p-8 min-h-[300px]">
                {!isMiscLoaded ? (
                    <TextSkeleton lines={6} />
                ) : (
                    <>
                    {/* Story Tab */}
                    {activeTab === 'story' && (
                        <div className="animate-fade-in space-y-4">
                            <div className="flex justify-between items-center mb-2">
                                <h2 className="text-xl md:text-2xl font-bold text-earth-800">关于这条路线</h2>
                                <button 
                                    onClick={() => data.story && speakText(data.story)}
                                    className={`p-2 rounded-full transition-all ${isSpeaking ? 'bg-forest-100 text-forest-600 animate-pulse' : 'text-earth-400 hover:text-forest-600 hover:bg-forest-50'}`}
                                    title="朗读"
                                >
                                    <Volume2 size={20} />
                                </button>
                            </div>
                            <div className="prose prose-earth text-earth-600 leading-relaxed text-justify">
                                <p>
                                <Editable 
                                    value={data.story} 
                                    label="故事介绍" 
                                    isCorrectionMode={isCorrectionMode}
                                    multiline
                                    onSave={(val) => onUpdate({...data, story: val})}
                                />
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Map Tab - LEAFLET IMPLEMENTATION */}
                    {activeTab === 'map' && (
                        <div className="animate-fade-in w-full h-[400px] bg-earth-100 rounded-xl overflow-hidden relative border border-earth-200">
                             {/* Map Context Label */}
                             <div className="absolute top-2 left-12 z-[400] bg-white/90 backdrop-blur px-3 py-1 rounded-full text-xs font-bold text-earth-600 shadow-md border border-earth-200">
                                {mapContext}
                             </div>
                             
                             {/* The Leaflet Container */}
                             <div ref={mapContainerRef} className="w-full h-full z-0 bg-earth-100"></div>

                             <div className="absolute bottom-2 right-2 z-[400] bg-white/80 px-2 py-1 rounded text-[10px] text-earth-400">
                                OpenTopoMap | OSM
                             </div>
                        </div>
                    )}

                    {/* Gear Tab */}
                    {activeTab === 'gear' && (
                        <div className="animate-fade-in grid md:grid-cols-2 gap-8">
                            <div>
                                <h3 className="font-bold text-earth-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-orange-400 rounded-full"></span>
                                    必备装备
                                </h3>
                                <ul className="space-y-3">
                                    {data.gear?.essential?.map((g, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-earth-50 p-3 rounded-lg border border-transparent hover:border-orange-100 transition-colors">
                                            <div className="mt-1 text-forest-600"><CheckCircle2 size={16} /></div>
                                            <div>
                                                <div className="font-bold text-earth-800 text-sm">{g.item}</div>
                                                {g.reason && <div className="text-xs text-earth-500 mt-1">{g.reason}</div>}
                                            </div>
                                        </li>
                                    )) || <li className="text-earth-400 text-sm">暂无装备信息</li>}
                                </ul>
                            </div>
                            <div>
                                <h3 className="font-bold text-earth-800 mb-4 flex items-center gap-2">
                                    <span className="w-1.5 h-6 bg-sky-400 rounded-full"></span>
                                    推荐装备
                                </h3>
                                <ul className="space-y-3">
                                    {data.gear?.recommended?.map((g, i) => (
                                        <li key={i} className="flex items-start gap-3 bg-earth-50 p-3 rounded-lg border border-transparent hover:border-sky-100 transition-colors">
                                            <div className="mt-1 text-sky-600"><Check size={16} /></div>
                                            <div>
                                                <div className="font-bold text-earth-800 text-sm">{g.item}</div>
                                                {g.reason && <div className="text-xs text-earth-500 mt-1">{g.reason}</div>}
                                            </div>
                                        </li>
                                    )) || <li className="text-earth-400 text-sm">暂无装备信息</li>}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Safety Tab */}
                    {activeTab === 'safety' && (
                        <div className="animate-fade-in space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div>
                                    <h3 className="font-bold text-earth-800 mb-3 flex items-center gap-2">
                                        <AlertTriangle className="text-red-500" size={20} />
                                        风险提示
                                    </h3>
                                    <ul className="space-y-2">
                                        {data.safetyTips?.map((tip, i) => (
                                            <li key={i} className="text-sm text-earth-600 bg-red-50 p-3 rounded border-l-2 border-red-300">
                                                <Editable 
                                                    value={tip} 
                                                    label={`风险提示 ${i+1}`}
                                                    isCorrectionMode={isCorrectionMode}
                                                    multiline
                                                    onSave={(val) => {
                                                        const newTips = [...(data.safetyTips || [])];
                                                        newTips[i] = val;
                                                        onUpdate({...data, safetyTips: newTips});
                                                    }}
                                                />
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div>
                                    <h3 className="font-bold text-earth-800 mb-3 flex items-center gap-2">
                                        <ThermometerSun className="text-orange-500" size={20} />
                                        最佳季节
                                    </h3>
                                    <p className="text-sm text-earth-600 bg-orange-50 p-3 rounded border-l-2 border-orange-300">
                                        <Editable 
                                            value={data.bestSeason} 
                                            label="最佳季节" 
                                            isCorrectionMode={isCorrectionMode}
                                            multiline
                                            onSave={(val) => onUpdate({...data, bestSeason: val})}
                                        />
                                    </p>
                                </div>
                            </div>
                            
                            <div>
                                <h3 className="font-bold text-earth-800 mb-3 flex items-center gap-2">
                                    <MessageCircle className="text-sky-500" size={20} />
                                    驴友怎么说
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    {data.communityTips?.map((tip, i) => (
                                        <div key={i} className="bg-sky-50 p-4 rounded-xl rounded-tl-none text-sm text-earth-700 relative border border-sky-100">
                                            <span className="absolute -top-2 left-0 text-sky-300 text-2xl font-bold">“</span>
                                            <span className="relative z-10">
                                                <Editable 
                                                    value={tip} 
                                                    label={`驴友建议 ${i+1}`}
                                                    isCorrectionMode={isCorrectionMode}
                                                    multiline
                                                    onSave={(val) => {
                                                        const newTips = [...(data.communityTips || [])];
                                                        newTips[i] = val;
                                                        onUpdate({...data, communityTips: newTips});
                                                    }}
                                                />
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                    </>
                )}
             </div>
        </div>

        {/* All Route Cards - Checks isRoutesLoaded */}
        {!isRoutesLoaded ? (
            <>
                <CardSkeleton />
                <CardSkeleton />
            </>
        ) : (
            data.routeSegments?.map((segment, idx) => (
                <div key={`seg-${idx}`} className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border border-earth-100 relative overflow-hidden animate-fade-in-up">
                    
                    {/* Visual indicator for different route types */}
                    <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-xl text-xs font-bold uppercase tracking-wider flex items-center gap-1 ${
                        segment.timeline && segment.timeline.length > 0 ? 'bg-forest-100 text-forest-700' : 'bg-earth-200 text-earth-600'
                    }`}>
                        {segment.timeline && segment.timeline.length > 0 ? <Footprints size={12} /> : <MapPin size={12} />}
                        {segment.name.includes("旅友") ? "旅友贡献" : "推荐路线"}
                    </div>

                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-2">
                            <h3 className="text-xl font-bold text-earth-800 flex items-center gap-2">
                                <Flag className="text-forest-500" size={20}/>
                                <Editable 
                                        value={segment.name} 
                                        label="路线名称" 
                                        isCorrectionMode={isCorrectionMode}
                                        onSave={(val) => {
                                            const newSegs = [...(data.routeSegments || [])];
                                            newSegs[idx] = {...newSegs[idx], name: val};
                                            onUpdate({...data, routeSegments: newSegs});
                                        }}
                                    />
                            </h3>
                            {/* View Map Button for Specific Route */}
                            <button 
                                type="button"
                                onClick={(e) => {
                                    e.preventDefault();
                                    handleViewOnMap(segment);
                                }}
                                className="self-start md:self-auto flex items-center gap-1 text-xs bg-forest-50 text-forest-600 px-3 py-1.5 rounded-full hover:bg-forest-100 transition-colors border border-forest-100"
                            >
                                <MapIcon size={14} />
                                查看此路线地图
                            </button>
                        </div>
                        
                        {(segment.distance || segment.time) && (
                            <div className="flex gap-4 text-sm text-earth-500">
                                {segment.distance && <span className="flex items-center gap-1 bg-earth-100 px-2 py-1 rounded"><Ruler size={14}/> {segment.distance}</span>}
                                {segment.time && <span className="flex items-center gap-1 bg-earth-100 px-2 py-1 rounded"><Clock size={14}/> {segment.time}</span>}
                            </div>
                        )}
                    </div>

                    {/* Description Box */}
                    <p className="text-earth-600 text-sm mb-6 bg-earth-50 p-4 rounded-lg italic border-l-2 border-forest-300">
                        <Editable 
                            value={segment.description} 
                            label="路段描述" 
                            isCorrectionMode={isCorrectionMode}
                            multiline
                            onSave={(val) => {
                                const newSegs = [...(data.routeSegments || [])];
                                newSegs[idx] = {...newSegs[idx], description: val};
                                onUpdate({...data, routeSegments: newSegs});
                            }}
                        />
                    </p>

                    {/* Detailed Timeline / Landmarks Visualization */}
                    <div className="pl-4">
                        <h4 className="text-sm font-bold text-earth-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                            <Milestone size={14} />
                            详细路书 / 节点
                        </h4>
                        
                        <div className="relative border-l-2 border-dashed border-earth-200 ml-3 space-y-8 mt-6">
                            {/* Fallback for legacy data without timeline: parse landmarks string */}
                            {(!segment.timeline || segment.timeline.length === 0) && segment.landmarks ? (
                                segment.landmarks.split(/->|→/).map((lm, lmIdx) => (
                                    <div key={lmIdx} className="relative pl-8">
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-forest-300 border-2 border-white shadow-sm"></div>
                                        <h3 className="font-bold text-base text-earth-800">{lm.trim()}</h3>
                                        <p className="text-xs text-earth-400 mt-1">关键节点</p>
                                    </div>
                                ))
                            ) : (
                                /* Render Detailed Timeline Nodes */
                                segment.timeline?.map((node, nIdx) => (
                                    <div key={nIdx} className="relative pl-8 group">
                                        {/* Timeline Dot */}
                                        <div className="absolute -left-[9px] top-1 w-4 h-4 rounded-full bg-white border-2 border-forest-500 shadow-sm z-10 transition-transform group-hover:scale-125"></div>
                                        
                                        <div className="mb-1 flex items-start justify-between">
                                            <div>
                                                <h3 className="font-bold text-base text-earth-800 flex items-center gap-2">
                                                    <span className="bg-forest-100 text-forest-700 text-xs w-5 h-5 flex items-center justify-center rounded-full">{nIdx + 1}</span>
                                                    {isCorrectionMode ? (
                                                        <span 
                                                            onClick={() => openNodeEditor(node, idx, nIdx, (updatedNode) => {
                                                                const newSegs = [...(data.routeSegments || [])];
                                                                const newTimeline = [...(newSegs[idx].timeline || [])];
                                                                newTimeline[nIdx] = updatedNode;
                                                                newSegs[idx] = {...newSegs[idx], timeline: newTimeline};
                                                                onUpdate({...data, routeSegments: newSegs});
                                                            })}
                                                            className="cursor-pointer border-b-2 border-dashed border-orange-400 bg-orange-50 hover:bg-orange-100 px-1 rounded transition-colors"
                                                            title="点击纠正坐标或名称"
                                                        >
                                                            {node.name}
                                                        </span>
                                                    ) : (
                                                        <span>{node.name}</span>
                                                    )}
                                                </h3>
                                                
                                                {/* Distance/Time Badge */}
                                                {(node.distance || node.time || isCorrectionMode) && (
                                                    <div className="text-xs font-semibold text-forest-600 bg-forest-50 inline-block px-2 py-0.5 rounded mt-1">
                                                        <Editable 
                                                        value={node.distance} 
                                                        label="路标距离" 
                                                        placeholder="距离"
                                                        isCorrectionMode={isCorrectionMode}
                                                        onSave={(val) => {
                                                            const newSegs = [...(data.routeSegments || [])];
                                                            const newTimeline = [...(newSegs[idx].timeline || [])];
                                                            newTimeline[nIdx] = {...newTimeline[nIdx], distance: val};
                                                            newSegs[idx] = {...newSegs[idx], timeline: newTimeline};
                                                            onUpdate({...data, routeSegments: newSegs});
                                                        }}
                                                    />
                                                        { (node.distance && node.time) && " • " }
                                                        <Editable 
                                                        value={node.time} 
                                                        label="路标耗时" 
                                                        placeholder="耗时"
                                                        isCorrectionMode={isCorrectionMode}
                                                        onSave={(val) => {
                                                            const newSegs = [...(data.routeSegments || [])];
                                                            const newTimeline = [...(newSegs[idx].timeline || [])];
                                                            newTimeline[nIdx] = {...newTimeline[nIdx], time: val};
                                                            newSegs[idx] = {...newSegs[idx], timeline: newTimeline};
                                                            onUpdate({...data, routeSegments: newSegs});
                                                        }}
                                                    />
                                                    </div>
                                                )}
                                                
                                                {/* GPS Verified Badge */}
                                                {node.coordinates && (
                                                    <div className="flex items-center gap-1 mt-1 text-[10px] text-forest-600 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-100 self-start w-fit">
                                                        <Satellite size={10} />
                                                        <span>GPS定位</span>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Fly to Node Button */}
                                            {node.coordinates && (
                                                <button 
                                                    onClick={() => {
                                                        setActiveSegment(segment); // Ensure segment is active
                                                        flyToNode(node);
                                                    }}
                                                    className="p-1.5 text-earth-400 hover:text-forest-600 hover:bg-forest-50 rounded-full transition-colors opacity-0 group-hover:opacity-100"
                                                    title="在地图上查看位置"
                                                >
                                                    <Navigation size={16} />
                                                </button>
                                            )}
                                        </div>

                                        {/* Optional Image */}
                                        {node.image && (
                                            <div className="my-3">
                                                <img src={node.image} alt={node.name} className="w-full h-40 object-cover rounded-lg shadow-sm border border-earth-100" />
                                            </div>
                                        )}

                                        {/* Description */}
                                        {(node.description || isCorrectionMode) && (
                                            <p className="text-earth-600 text-sm mb-2 leading-relaxed">
                                                <Editable 
                                                value={node.description} 
                                                label="路标说明" 
                                                placeholder="添加路况/详情..."
                                                isCorrectionMode={isCorrectionMode}
                                                multiline
                                                onSave={(val) => {
                                                    const newSegs = [...(data.routeSegments || [])];
                                                    const newTimeline = [...(newSegs[idx].timeline || [])];
                                                    newTimeline[nIdx] = {...newTimeline[nIdx], description: val};
                                                    newSegs[idx] = {...newSegs[idx], timeline: newTimeline};
                                                    onUpdate({...data, routeSegments: newSegs});
                                                }}
                                            />
                                            </p>
                                        )}

                                        {/* Highlights */}
                                        {(node.highlights || isCorrectionMode) && (
                                            <div className="text-xs text-earth-500 flex items-start gap-1">
                                                <Camera size={12} className="mt-0.5 flex-shrink-0" />
                                                <span>
                                                    <span className="font-semibold">看点:</span> <Editable 
                                                    value={node.highlights} 
                                                    label="路标看点" 
                                                    placeholder="添加看点"
                                                    isCorrectionMode={isCorrectionMode}
                                                    onSave={(val) => {
                                                        const newSegs = [...(data.routeSegments || [])];
                                                        const newTimeline = [...(newSegs[idx].timeline || [])];
                                                        newTimeline[nIdx] = {...newTimeline[nIdx], highlights: val};
                                                        newSegs[idx] = {...newSegs[idx], timeline: newTimeline};
                                                        onUpdate({...data, routeSegments: newSegs});
                                                    }}
                                                />
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            ))
        )}

        {/* Add Route Card - Bottom Standalone (Always Visible) */}
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8 border-2 border-dashed border-earth-300 hover:border-forest-400 transition-colors animate-fade-in-up">
            {!isAddingSegment ? (
                <button 
                    onClick={startAddSegment}
                    className="w-full py-6 flex flex-col items-center justify-center gap-3 text-earth-500 hover:text-forest-600 transition-colors"
                >
                    <div className="p-4 bg-earth-50 rounded-full group-hover:bg-forest-50">
                        <Plus size={32} />
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-lg text-earth-800">贡献新路线</h3>
                        <p className="text-sm">添加新的走法，生成专属时间轴</p>
                    </div>
                </button>
            ) : (
                <div className="bg-earth-50/50 rounded-xl p-4">
                    <div className="flex justify-between items-center mb-6 pb-4 border-b border-earth-200">
                        <h3 className="text-lg font-bold text-earth-800 flex items-center gap-2">
                            <Plus className="text-forest-600" size={20} />
                            添加旅友路线
                        </h3>
                        <button onClick={() => setIsAddingSegment(false)} className="text-earth-400 hover:text-earth-600">
                            <X size={20} />
                        </button>
                    </div>
                    
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-earth-500 mb-1">路线名称</label>
                            <input 
                                className="w-full p-2 rounded border border-earth-200 focus:ring-2 focus:ring-forest-200 focus:outline-none"
                                value={newSegment.name}
                                onChange={e => setNewSegment({...newSegment, name: e.target.value})}
                                placeholder="例如：旅友探险线1号"
                            />
                        </div>
                        
                        <div className="bg-white p-4 rounded-xl border border-earth-200 shadow-sm">
                            <label className="block text-xs font-bold text-earth-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                                <Milestone size={14} />
                                构建时间轴路标 (至少2个)
                            </label>
                            
                            <div className="bg-earth-50 p-3 rounded-lg border border-earth-100 mb-4">
                                <h5 className="text-xs font-bold text-forest-700 mb-2">添加新路标节点</h5>
                                
                                <button 
                                    onClick={handleAddNewNodeClick}
                                    className="w-full py-3 bg-white border border-dashed border-forest-300 text-forest-600 rounded-lg text-sm font-medium hover:bg-forest-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <MapIcon size={16} />
                                    编辑/在地图上添加路标
                                </button>
                            </div>

                            {timelineNodes.length > 0 && (
                                <div className="space-y-2 mt-4">
                                    {timelineNodes.map((node, i) => (
                                        <div key={i} className="flex items-start gap-3 p-2 bg-earth-50 rounded border border-earth-100 animate-fade-in group hover:bg-white hover:shadow-sm transition-all cursor-pointer"
                                            onClick={() => openNodeEditor(node, -1, i, (updatedNode) => {
                                                const newTimeline = [...timelineNodes];
                                                newTimeline[i] = updatedNode;
                                                setTimelineNodes(newTimeline);
                                            })}
                                        >
                                            <span className="mt-1 bg-forest-100 text-forest-700 text-xs font-bold w-5 h-5 flex-shrink-0 flex items-center justify-center rounded-full border border-forest-200">
                                                {i + 1}
                                            </span>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between items-start">
                                                    <span className="text-sm font-bold text-earth-800 truncate">{node.name}</span>
                                                    <button 
                                                        onClick={(e) => { e.stopPropagation(); removeTimelineNode(i); }}
                                                        className="text-earth-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                <div className="text-xs text-earth-500 mt-1 flex flex-wrap gap-2">
                                                    {node.distance && <span>📏 {node.distance}</span>}
                                                    {node.time && <span>⏱️ {node.time}</span>}
                                                    {node.coordinates && <span className="text-forest-600 flex items-center gap-0.5"><Satellite size={8}/>GPS</span>}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end pt-2">
                            <button 
                                onClick={handleAddSegment}
                                className="bg-forest-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg shadow-forest-200 hover:bg-forest-700 hover:shadow-xl transition-all flex items-center gap-2"
                            >
                                <Save size={18} />
                                保存路线
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
      </div>

        {/* --- Simple String Editing Modal --- */}
      {editingItem && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all">
                <div className="bg-orange-500 p-4 text-white flex justify-between items-center">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <PenLine size={20} />
                        纠正信息: {editingItem.label}
                    </h3>
                    <button onClick={() => setEditingItem(null)} className="hover:bg-white/20 p-1 rounded">
                        <X size={20} />
                    </button>
                </div>
                <div className="p-6">
                    {editingItem.multiline ? (
                        <textarea 
                            className="w-full h-40 p-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none resize-none text-earth-800"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                        />
                    ) : (
                        <input 
                            type="text" 
                            className="w-full p-3 border border-earth-300 rounded-lg focus:ring-2 focus:ring-orange-300 focus:border-orange-500 outline-none text-earth-800"
                            value={editingItem.value}
                            onChange={(e) => setEditingItem({...editingItem, value: e.target.value})}
                        />
                    )}
                    <div className="mt-6 flex justify-end gap-3">
                        <button 
                            onClick={() => setEditingItem(null)}
                            className="px-4 py-2 text-earth-500 hover:bg-earth-50 rounded-lg transition-colors"
                        >
                            取消
                        </button>
                        <button 
                            onClick={handleEditSave}
                            className="px-6 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-bold shadow-lg shadow-orange-200 transition-all"
                        >
                            提交纠错
                        </button>
                    </div>
                </div>
            </div>
        </div>
      )}

      {/* --- Advanced Node Editing Modal (Correct Coordinates) --- */}
      {editingNode && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-fade-in">
             <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden transform scale-100 transition-all flex flex-col max-h-[90vh]">
                 <div className="bg-orange-600 p-4 text-white flex justify-between items-center shrink-0">
                    <h3 className="font-bold text-lg flex items-center gap-2">
                        <MapIcon size={20} />
                        编辑路标节点
                    </h3>
                    <button onClick={() => setEditingNode(null)} className="hover:bg-white/20 p-1 rounded">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-6 overflow-y-auto space-y-4">
                    {/* Name */}
                    <div>
                        <label className="block text-xs font-bold text-earth-500 mb-1">路标名称</label>
                        <input 
                            className="w-full p-2.5 rounded border border-earth-300 focus:ring-2 focus:ring-orange-300 focus:outline-none"
                            value={editingNode.node.name}
                            onChange={(e) => setEditingNode({...editingNode, node: {...editingNode.node, name: e.target.value}})}
                            placeholder="如：绝望坡顶"
                        />
                    </div>

                    {/* Coordinates Picker */}
                    <div className="bg-earth-50 p-4 rounded-lg border border-earth-200">
                        <label className="block text-xs font-bold text-earth-500 mb-2 flex items-center gap-1">
                             <Satellite size={12} />
                             地理位置坐标 (经纬度)
                        </label>
                        <div className="flex items-center gap-3">
                            <div className="flex-1 text-sm font-mono bg-white p-2 rounded border border-earth-200 text-earth-600 truncate">
                                {editingNode.node.coordinates 
                                    ? `${editingNode.node.coordinates[0].toFixed(5)}, ${editingNode.node.coordinates[1].toFixed(5)}` 
                                    : "未设置坐标"}
                            </div>
                            <button 
                                onClick={() => {
                                    // Use the existing name as the initial search query for the map
                                    openMapPicker(editingNode.node.coordinates, editingNode.node.name).then(({coords, name}) => {
                                        setEditingNode(prev => {
                                            if (!prev) return null;
                                            const newNode = {...prev.node, coordinates: coords};
                                            // Optionally update name if user wants, but for now just coords. 
                                            // Could add a prompt or auto-fill if name was empty.
                                            if (name && !newNode.name) {
                                                newNode.name = name;
                                            }
                                            return {...prev, node: newNode};
                                        });
                                    });
                                }}
                                className="bg-forest-600 hover:bg-forest-700 text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1 shrink-0 shadow-sm"
                            >
                                <Crosshair size={16} />
                                地图选点/搜索
                            </button>
                        </div>
                        <p className="text-[10px] text-earth-400 mt-2">提示：点击右侧按钮，支持输入地名自动搜索定位。</p>
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-bold text-earth-500 mb-1">距离 (可选)</label>
                             <input 
                                className="w-full p-2 rounded border border-earth-300 focus:ring-2 focus:ring-orange-300 text-sm"
                                value={editingNode.node.distance || ''}
                                onChange={(e) => setEditingNode({...editingNode, node: {...editingNode.node, distance: e.target.value}})}
                                placeholder="如：2.5km"
                            />
                        </div>
                         <div>
                             <label className="block text-xs font-bold text-earth-500 mb-1">耗时 (可选)</label>
                             <input 
                                className="w-full p-2 rounded border border-earth-300 focus:ring-2 focus:ring-orange-300 text-sm"
                                value={editingNode.node.time || ''}
                                onChange={(e) => setEditingNode({...editingNode, node: {...editingNode.node, time: e.target.value}})}
                                placeholder="如：1h 20m"
                            />
                        </div>
                    </div>

                    {/* Desc */}
                    <div>
                        <label className="block text-xs font-bold text-earth-500 mb-1">详情描述</label>
                        <textarea 
                            className="w-full p-2.5 h-24 rounded border border-earth-300 focus:ring-2 focus:ring-orange-300 resize-none text-sm"
                            value={editingNode.node.description || ''}
                            onChange={(e) => setEditingNode({...editingNode, node: {...editingNode.node, description: e.target.value}})}
                            placeholder="路况、植被或注意事项..."
                        />
                    </div>
                </div>

                <div className="p-4 border-t border-earth-100 flex justify-end gap-3 shrink-0">
                     <button 
                        onClick={() => setEditingNode(null)}
                        className="px-4 py-2 text-earth-500 hover:bg-earth-50 rounded-lg transition-colors"
                    >
                        取消
                    </button>
                    <button 
                        onClick={handleNodeSave}
                        className="px-6 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg font-bold shadow-md transition-all"
                    >
                        保存节点
                    </button>
                </div>
             </div>
          </div>
      )}
      
      {/* Toast Notification */}
      {toastMessage && (
          <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[70] bg-earth-800 text-white px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 animate-fade-in-up">
              <CheckCircle2 className="text-forest-400" size={20} />
              <span className="font-medium text-sm">{toastMessage}</span>
          </div>
      )}
    </div>
  );
};