import { GoogleGenAI, Type } from "@google/genai";
import { TrailData } from '../types';

const apiKey = import.meta.env.VITE_API_KEY || '';
console.log('API Key loaded:', apiKey ? 'Yes' : 'No');
if (!apiKey) {
  console.error('API Key is not defined! Please check your .env.local file.');
}

// Initialize client
const ai = new GoogleGenAI({ apiKey });

// Helper to safely parse JSON from chatty AI responses
const safeParseJSON = (text: string | undefined) => {
    if (!text) throw new Error("No response from AI");
    // Remove markdown code blocks if present
    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    try {
        return JSON.parse(cleanText);
    } catch (e) {
        console.error("Failed to parse JSON:", text);
        throw new Error("Invalid JSON response from AI");
    }
};

// 计算字符串相似度的简单函数
const calculateSimilarity = (query: string, trailName: string): number => {
    const q = query.toLowerCase().trim();
    const t = trailName.toLowerCase().trim();
    
    // 完全匹配
    if (q === t) return 1.0;
    
    // 包含关系
    if (q.includes(t) || t.includes(q)) return 0.8;
    
    // 计算字符相似度
    let matches = 0;
    const shorter = q.length < t.length ? q : t;
    const longer = q.length >= t.length ? q : t;
    
    for (let i = 0; i < shorter.length; i++) {
        if (longer.includes(shorter[i])) {
            matches++;
        }
    }
    
    return matches / longer.length;
};

// 1. Basic Schema (Fast Load - Stage 1)
const basicSchema = {
  type: Type.OBJECT,
  properties: {
    name: { type: Type.STRING, description: "Official name of the trail or mountain in Chinese." },
    location: { type: Type.STRING, description: "Specific geographic location in Chinese." },
    centerCoordinates: {
        type: Type.OBJECT,
        properties: {
            latitude: { type: Type.NUMBER, description: "Latitude of the trail head or mountain peak." },
            longitude: { type: Type.NUMBER, description: "Longitude of the trail head or mountain peak." }
        },
        required: ["latitude", "longitude"],
        description: "The central geo-coordinates for the map view."
    },
    highlight: { type: Type.STRING, description: "One engaging sentence summarizing the trail's unique appeal in Chinese." },
    difficulty: { type: Type.NUMBER, description: "Difficulty rating from 1 (Easy) to 5 (Expert)." },
    duration: { type: Type.STRING, description: "Estimated time to complete in Chinese (e.g., '6-8 小时')." },
    length: { type: Type.STRING, description: "Total distance in Chinese (e.g., '15 公里')." },
    elevationGain: { type: Type.STRING, description: "Cumulative elevation gain in Chinese (e.g., '800 米')." },
  },
  required: ["name", "location", "centerCoordinates", "highlight", "difficulty", "duration", "length", "elevationGain"]
};

// 2. Misc Schema (Fast Detail - Stage 2a)
const miscSchema = {
  type: Type.OBJECT,
  properties: {
    description: { type: Type.STRING, description: "A factual overview in Chinese." },
    story: { type: Type.STRING, description: "A concise narrative describing the experience in Chinese." },
    gear: {
      type: Type.OBJECT,
      properties: {
        essential: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, description: "Item name in Chinese." },
              reason: { type: Type.STRING, description: "Reason in Chinese." }
            },
            required: ["item", "reason"]
          },
          description: "Top 3 essential items."
        },
        recommended: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              item: { type: Type.STRING, description: "Item name in Chinese." },
              reason: { type: Type.STRING, description: "Reason in Chinese." }
            },
            required: ["item", "reason"]
          },
          description: "Top 3 recommended items."
        }
      },
      required: ["essential", "recommended"]
    },
    safetyTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 important safety tips in Chinese." },
    bestSeason: { type: Type.STRING, description: "Best months in Chinese." },
    communityTips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 2 brief community tips in Chinese." },
  },
  required: ["description", "story", "gear", "safetyTips", "bestSeason", "communityTips"]
};

// 3. Routes Schema (Thinking/Slow - Stage 2b) - UPDATED for Real Coordinates
const routesSchema = {
  type: Type.OBJECT,
  properties: {
    routeSegments: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          name: { type: Type.STRING, description: "Segment name in Chinese (e.g. '经典正穿', '西脊线')." },
          distance: { type: Type.STRING, description: "Total distance." },
          time: { type: Type.STRING, description: "Total time." },
          description: { type: Type.STRING, description: "Overview of this specific route option in Chinese." },
          landmarks: { type: Type.STRING, description: "Summary string of key nodes in Chinese (e.g. 'A->B->C')." },
          timeline: {
            type: Type.ARRAY,
            description: "CRITICAL: Step-by-step waypoints with REAL coordinates.",
            items: {
                type: Type.OBJECT,
                properties: {
                    name: { type: Type.STRING, description: "Name of the checkpoint (e.g. '绝望坡')." },
                    coordinates: {
                        type: Type.ARRAY,
                        items: { type: Type.NUMBER },
                        description: "REAL GPS [Latitude, Longitude]. Do not hallucinate."
                    },
                    distance: { type: Type.STRING, description: "Distance from start." },
                    time: { type: Type.STRING, description: "Time from start." },
                    description: { type: Type.STRING, description: "Details about terrain/view." },
                    highlights: { type: Type.STRING, description: "Key photo spot." }
                },
                required: ["name", "coordinates", "description"]
            }
          }
        },
        required: ["name", "distance", "time", "description", "landmarks", "timeline"]
      },
      description: "Generate exactly 2 distinct route options."
    }
  },
  required: ["routeSegments"]
};

// Stage 1: Fast Basic Info
export const generateBasicTrailInfo = async (query: string): Promise<Partial<TrailData>> => {
    // 预定义一些常见路线的基本信息，作为后备方案
    const knownTrails: Record<string, Partial<TrailData>> = {
        "深圳塘朗山": {
            name: "深圳塘朗山",
            location: "中国广东省深圳市南山区",
            highlight: "城市中的绿色氧吧，深圳十峰之一。",
            difficulty: 2,
            duration: "3-4小时",
            length: "8公里",
            elevationGain: "450米",
            centerCoordinates: { latitude: 22.6173, longitude: 113.9427 }
        },
        "深圳梧桐山": {
            name: "深圳梧桐山",
            location: "中国广东省深圳市",
            highlight: "鹏城第一峰，深圳市民喜爱的登山胜地。",
            difficulty: 3,
            duration: "4-6小时",
            length: "11公里",
            elevationGain: "943米",
            centerCoordinates: { latitude: 22.5715, longitude: 114.1083 }
        },
        "深圳莲花山": {
            name: "深圳莲花山",
            location: "中国广东省深圳市福田区",
            highlight: "城市中心区内的天然氧吧，登山观景两相宜。",
            difficulty: 2,
            duration: "2-3小时",
            length: "6公里",
            elevationGain: "350米",
            centerCoordinates: { latitude: 22.5589, longitude: 114.0602 }
        },
        "香港麦理浩径第二段": {
            name: "香港麦理浩径第二段",
            location: "中国香港特别行政区",
            highlight: "香港著名远足径，世界最美徒步路线之一。",
            difficulty: 3,
            duration: "5-6小时",
            length: "13公里",
            elevationGain: "800米",
            centerCoordinates: { latitude: 22.2470, longitude: 114.1680 }
        },
        "武功山": {
            name: "武功山",
            location: "中国江西省萍乡市",
            highlight: "云中草原，户外天堂，华东朝圣之路。",
            difficulty: 3,
            duration: "2-3天",
            length: "25-30公里",
            elevationGain: "1600米",
            centerCoordinates: { latitude: 27.4618, longitude: 114.1385 }
        },
        "珠峰东坡": {
            name: "珠峰东坡",
            location: "中国西藏自治区",
            highlight: "世界之巅，登山者终极梦想。",
            difficulty: 5,
            duration: "7-9天",
            length: "22公里",
            elevationGain: "3500米",
            centerCoordinates: { latitude: 28.0050, longitude: 86.8633 }
        },
        "贡嘎转山": {
            name: "贡嘎转山",
            location: "中国四川省",
            highlight: "蜀山之王，雪山朝圣之地。",
            difficulty: 5,
            duration: "7-10天",
            length: "60公里",
            elevationGain: "4000米",
            centerCoordinates: { latitude: 29.5833, longitude: 101.8833 }
        }
    };

    // 首先检查是否是预定义的路线
    const normalizedQuery = query.trim().toLowerCase();
    for (const [trailName, trailData] of Object.entries(knownTrails)) {
        if (normalizedQuery.includes(trailName.toLowerCase()) || trailName.toLowerCase().includes(normalizedQuery)) {
            console.log(`找到预定义路线: ${trailName}`);
            return trailData;
        }
    }

    try {
        console.log('开始获取基础信息:', query);
        
        // 尝试直接搜索路线信息 - 使用更强大的模型
        const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: "user", parts: [{ text: `你是一个专业的户外向导。请返回关于徒步路线 "${query}" 的基本信息。

请确保所有输出都使用简体中文。
请提供有效的JSON格式数据，符合以下模式。` }] }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: basicSchema,
        }
    });
    
    console.log('API响应成功:', response.text);
    const result = safeParseJSON(response.text) as Partial<TrailData>;
    
    // 放宽验证条件，只需要基本字段
    if (!result || !result.name) {
        throw new Error("返回的路线信息不完整");
    }
    
    // 如果缺少一些字段，尝试用默认值填充
    if (!result.location) result.location = "中国";
    if (!result.difficulty) result.difficulty = 3;
    if (!result.duration) result.duration = "4-6小时";
    if (!result.length) result.length = "10公里";
    if (!result.elevationGain) result.elevationGain = "500米";
    if (!result.highlight) result.highlight = "美丽的徒步路线，值得一游。";
    
    console.log('解析后的数据:', result);
    return result;
    } catch (error) {
        console.error('获取基础信息时出错:', error);
        
        // 如果第一次尝试失败，尝试更灵活的搜索方式
        try {
            console.log('尝试灵活搜索:', query);
            const fallbackResponse = await ai.models.generateContent({
                model: 'gemini-2.0-flash',
                contents: [{ role: "user", parts: [{ text: `你是一个专业的户外向导。用户正在寻找关于 "${query}" 的徒步信息。

请用简体中文提供推荐路线的基本信息。
请提供有效的JSON格式数据，符合以下模式。` }] }],
                config: {
                    responseMimeType: 'application/json',
                    responseSchema: basicSchema,
                }
            });
            
            console.log('灵活搜索API响应成功:', fallbackResponse.text);
            const fallbackResult = safeParseJSON(fallbackResponse.text) as Partial<TrailData>;
            
            // 放宽验证条件
            if (!fallbackResult || !fallbackResult.name) {
                throw new Error("无法找到相关路线信息");
            }
            
            // 如果缺少一些字段，尝试用默认值填充
            if (!fallbackResult.location) fallbackResult.location = "中国";
            if (!fallbackResult.difficulty) fallbackResult.difficulty = 3;
            if (!fallbackResult.duration) fallbackResult.duration = "4-6小时";
            if (!fallbackResult.length) fallbackResult.length = "10公里";
            if (!fallbackResult.elevationGain) fallbackResult.elevationGain = "500米";
            if (!fallbackResult.highlight) fallbackResult.highlight = "美丽的徒步路线，值得一游。";
            
            return {
                ...fallbackResult,
                // 添加一个标记，表示这是一个推荐路线
                isRecommended: true
            };
        } catch (fallbackError) {
            console.error('灵活搜索也失败:', fallbackError);
            
            // 最后的后备方案：尝试从预定义路线中找一个最相似的
            let bestMatch: Partial<TrailData> | null = null;
            let bestScore = 0;
            
            for (const [trailName, trailData] of Object.entries(knownTrails)) {
                const score = calculateSimilarity(query, trailName);
                if (score > bestScore) {
                    bestScore = score;
                    bestMatch = trailData;
                }
            }
            
            if (bestMatch && bestScore > 0.3) {
                console.log(`使用最相似的预定义路线: ${bestMatch.name} (相似度: ${bestScore})`);
                return {
                    ...bestMatch,
                    isRecommended: true,
                    originalQuery: query
                };
            }
            
            throw new Error(`无法找到关于"${query}"的路线信息，请尝试输入更具体的路线名称。`);
        }
    }
}

// Stage 2a: Narrative & Misc (Fast Parallel)
export const generateTrailMisc = async (query: string, basicInfo: Partial<TrailData>): Promise<Partial<TrailData>> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: [{ role: "user", parts: [{ text: `你是一个户外故事讲述者。
        背景：为 "${basicInfo.name}"（位于 "${basicInfo.location}"）提供叙述性细节。
        请生成故事、装备清单、安全提示和最佳季节。
        保持鼓舞人心和有帮助的语调。
        重要提示：所有输出必须使用简体中文。
        请提供有效的JSON格式数据，符合以下模式。` }] }],
            config: {
                responseMimeType: 'application/json',
                responseSchema: miscSchema,
            }
        });
        console.log('API响应成功:', response.text);
        const result = safeParseJSON(response.text) as Partial<TrailData>;
        console.log('解析后的数据:', result);
        return result;
    } catch (error) {
        console.error('获取基础信息时出错:', error);
        throw error;
    }
}

// Stage 2b: Routes (Slow/Thinking Parallel) - Updated Prompt
export const generateTrailRoutes = async (query: string, basicInfo: Partial<TrailData>): Promise<Partial<TrailData>> => {
    const response = await ai.models.generateContent({
        model: 'gemini-2.0-flash',
        contents: [{ role: "user", parts: [{ text: `你是一个地理信息系统(GIS)专家和高级徒步向导。
        背景：为 "${basicInfo.name}"（位于 "${basicInfo.location}"）进行详细路线规划。
        中心坐标：${basicInfo.centerCoordinates?.latitude}, ${basicInfo.centerCoordinates?.longitude}。

        准确性关键指示：
        1. **禁止编造**：你必须为'timeline'中的每个检查点提供真实、准确的GPS坐标[纬度，经度]。
        2. **验证**：如果你不知道某块岩石/树木的确切坐标，请使用最近的主要地标（山峰、村庄、垭口、营地、小屋）的坐标。
        3. **结构**：'timeline'是真实来源。地图线将通过连接这些坐标点来绘制。
        4. **精度**：坐标使用至少4-5位小数，以确保地图上的准确性。
        5. 提供2个不同的路线选择（例如：观光路线与徒步路线）。
        6. 语言：所有输出必须使用简体中文。

        请提供有效的JSON格式数据，符合以下模式。` }] }],
        config: {
            responseMimeType: 'application/json',
            responseSchema: routesSchema,
            thinkingConfig: {
                thinkingBudget: 2048
            }
        }
    });

    return safeParseJSON(response.text) as Partial<TrailData>;
}

export const generateTrailGuide = async (query: string): Promise<TrailData> => {
    const basic = await generateBasicTrailInfo(query);
    const [misc, routes] = await Promise.all([
        generateTrailMisc(query, basic),
        generateTrailRoutes(query, basic)
    ]);
    return { ...basic, ...misc, ...routes } as TrailData;
};