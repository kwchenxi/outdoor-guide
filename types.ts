
export interface RouteNode {
  name: string;
  type?: 'point' | 'view' | 'rest';
  coordinates?: [number, number]; // [Latitude, Longitude]
  distance?: string;
  time?: string;
  description?: string;
  highlights?: string;
  image?: string; // URL to the image stored in object storage (simulated)
}

export interface RouteSegment {
  name: string;
  distance: string;
  time: string;
  description: string;
  landmarks: string;
  timeline?: RouteNode[]; // For user-added routes with detailed timeline
  path?: number[][]; // Keep for backwards compatibility or high-res paths
}

export interface GearItem {
  item: string;
  reason?: string;
}

export interface TrailData {
  id?: string;
  name: string;
  location: string;
  // Geo-coordinates for the general location center
  centerCoordinates?: {
    latitude: number;
    longitude: number;
  }; 
  highlight: string;
  difficulty: number; // 1-5
  duration: string;
  length: string;
  elevationGain: string;
  
  // Detailed fields are now optional for staged loading
  description?: string;
  story?: string; // Engaging narrative
  routeSegments?: RouteSegment[];
  gear?: {
    essential: GearItem[];
    recommended: GearItem[];
  };
  safetyTips?: string[];
  bestSeason?: string;
  communityTips?: string[];
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}