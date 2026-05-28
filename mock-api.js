(() => {
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const DEFAULT_CENTER = {
  lat: 39.905,
  lng: 116.391,
  name: '当前位置',
  address: '北京市海淀区附近',
};

const POIS = [
  { id: 'hotpot', name: '潮汕牛肉火锅 西单店', category: '美食', subCategory: '火锅', lat: 39.9057, lng: 116.3954, rating: 4.7, price: 96, eta: 15, tags: ['不太辣', '地铁直达', '适合聚餐'], mood: 'yellow' },
  { id: 'coffee', name: '城市露台咖啡', category: '美食', subCategory: '咖啡', lat: 39.9039, lng: 116.3982, rating: 4.8, price: 42, eta: 17, tags: ['拍照', '可聊天'], mood: 'mint' },
  { id: 'dessert', name: '漫糖甜品工坊', category: '美食', subCategory: '甜品', lat: 39.9019, lng: 116.3992, rating: 4.6, price: 38, eta: 18, tags: ['少排队', '适合拍照'], mood: 'pink' },
  { id: 'script', name: '谜城剧本社', category: '玩乐', subCategory: '剧本杀', lat: 39.9071, lng: 116.4012, rating: 4.9, price: 128, eta: 19, tags: ['5人可玩', '晚场可约'], mood: 'blue' },
  { id: 'escape', name: '谜境密室逃脱', category: '玩乐', subCategory: '密室逃脱', lat: 39.9101, lng: 116.4021, rating: 4.8, price: 158, eta: 20, tags: ['沉浸感强', '适合团建'], mood: 'blue' },
  { id: 'esports', name: '闪电电竞馆', category: '玩乐', subCategory: '电竞', lat: 39.9088, lng: 116.3928, rating: 4.7, price: 68, eta: 21, tags: ['包间', '可连坐'], mood: 'blue' },
  { id: 'beauty', name: '星芒美甲美睫', category: '玩乐', subCategory: '美甲美睫', lat: 39.9027, lng: 116.3925, rating: 4.9, price: 126, eta: 19, tags: ['快修', '约会前推荐'], mood: 'pink' },
  { id: 'climb', name: '云脊户外攀岩', category: '玩乐', subCategory: '户外攀岩', lat: 39.8988, lng: 116.3944, rating: 4.7, price: 138, eta: 22, tags: ['新手可玩', '户外感'], mood: 'yellow' },
  { id: 'bbq', name: '井字烧烤屋', category: '美食', subCategory: '烧烤', lat: 39.9041, lng: 116.4003, rating: 4.5, price: 68, eta: 20, tags: ['宵夜备选', '适合聚餐'], mood: 'yellow' },
  { id: 'sichuan', name: '川湘辣妹子', category: '美食', subCategory: '川湘菜', lat: 39.9092, lng: 116.3941, rating: 4.6, price: 78, eta: 16, tags: ['下饭', '重口味'], mood: 'yellow' },
  { id: 'japanese', name: '银月日料小馆', category: '美食', subCategory: '日料', lat: 39.9078, lng: 116.3896, rating: 4.7, price: 118, eta: 18, tags: ['安静', '适合约会'], mood: 'mint' },
  { id: 'canton', name: '广味茶餐厅', category: '美食', subCategory: '粤菜', lat: 39.9024, lng: 116.3879, rating: 4.6, price: 88, eta: 16, tags: ['清淡', '聊天友好'], mood: 'mint' },
];

const sleepJitter = (base) => base + Math.round(Math.random() * 120);

const distanceMeters = (a, b) => {
  const latMeters = 111000;
  const lngMeters = 85000;
  return Math.hypot((a.lat - b.lat) * latMeters, (a.lng - b.lng) * lngMeters);
};

const formatDistance = (meters) => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(meters > 2500 ? 1 : 2)}km`;
};

const scorePoi = (poi, center, prefs = {}) => {
  const distance = distanceMeters(center, poi);
  const categoryBonus = prefs.categories?.includes(poi.subCategory) ? 1.6 : prefs.categories?.includes(poi.category) ? 1.2 : 0.5;
  const interestBonus = prefs.fun?.includes(poi.subCategory) ? 1.2 : 0.3;
  const avoidPenalty = prefs.avoid?.some((item) => poi.tags.some((tag) => tag.includes(item))) ? 1.3 : 0;
  const ratingScore = poi.rating * 2.2;
  const distanceScore = Math.max(0, 5 - distance / 850);
  const timeScore = Math.max(0, 2.5 - Math.abs((prefs.startHour ?? 18) - poi.eta) * 0.12);
  return {
    ...poi,
    distance,
    distanceLabel: formatDistance(distance),
    score: Number((ratingScore + distanceScore + categoryBonus + interestBonus + timeScore - avoidPenalty).toFixed(2)),
  };
};

async function getUserContext() {
  await delay(sleepJitter(180));
  return {
    ...DEFAULT_CENTER,
    timestamp: Date.now(),
  };
}

async function getPoiRecommendations({ center = DEFAULT_CENTER, prefs = {} } = {}) {
  await delay(sleepJitter(240));
  const mode = prefs.mode || '综合最优';
  const pool = POIS.filter((poi) => {
    if (mode === '美食') return poi.category === '美食';
    if (mode === '玩乐') return poi.category === '玩乐';
    return true;
  });
  const enriched = pool.map((poi) => scorePoi(poi, center, prefs));
  if (mode === '近地铁') {
    return enriched.sort((a, b) => a.distance - b.distance).slice(0, 5);
  }
  return enriched.sort((a, b) => b.score - a.score).slice(0, 5);
}

async function planRoute({ origin = DEFAULT_CENTER, selectedIds = [], prefs = {}, respectOrder = false } = {}) {
  await delay(sleepJitter(320));
  const pool = selectedIds.length ? selectedIds.map((id) => getPoiById(id)).filter(Boolean) : POIS.slice(0, 4);
  const scored = pool.map((poi) => scorePoi(poi, origin, prefs));
  const ordered = respectOrder
    ? scored
    : orderByShortestWalk(origin, scored);
  const legs = [];
  let prev = origin;
  for (const poi of ordered) {
    const meters = distanceMeters(prev, poi);
    legs.push({
      from: prev.name ?? '起点',
      to: poi.name,
      distanceMeters: meters,
      distanceLabel: formatDistance(meters),
      walkMinutes: Math.max(2, Math.round(meters / 80)),
    });
    prev = poi;
  }
  const totalMeters = legs.reduce((sum, leg) => sum + leg.distanceMeters, 0);
  return {
    origin,
    selected: ordered,
    legs,
    totalDistanceMeters: totalMeters,
    totalDistanceLabel: formatDistance(totalMeters),
    aiReason: '已结合当前位置、评分、品类偏好和晚间时间段，优先安排近距离高分店，再按步行成本做了局部排序。',
  };
}

function orderByShortestWalk(origin, points) {
  const remaining = points.slice();
  const ordered = [];
  let cursor = origin;
  while (remaining.length) {
    remaining.sort((a, b) => {
      const distanceDiff = distanceMeters(cursor, a) - distanceMeters(cursor, b);
      if (Math.abs(distanceDiff) > 80) return distanceDiff;
      return b.score - a.score;
    });
    const next = remaining.shift();
    ordered.push(next);
    cursor = next;
  }
  return ordered;
}

function getPoiById(id) {
  return POIS.find((poi) => poi.id === id) || null;
}

function getAllPois() {
  return POIS.slice();
}

async function searchPois(query = '', center = DEFAULT_CENTER) {
  await delay(sleepJitter(180));
  const key = query.trim().toLowerCase();
  const pool = key ? POIS.filter((poi) => [poi.name, poi.category, poi.subCategory, ...poi.tags].some((value) => String(value).toLowerCase().includes(key))) : POIS.slice();
  return pool
    .map((poi) => scorePoi(poi, center, {}))
    .sort((a, b) => b.score - a.score)
    .slice(0, 6);
}

window.MockApi = {
  getAllPois,
  getPoiById,
  getPoiRecommendations,
  getUserContext,
  planRoute,
  searchPois,
};
})();
