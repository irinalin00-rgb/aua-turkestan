// ═══════════════════════════════════════════════
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ═══════════════════════════════════════════════

function aqiColor(v) {
  if (v <= 50)  return '#22c55e';
  if (v <= 100) return '#eab308';
  if (v <= 150) return '#f97316';
  if (v <= 200) return '#ef4444';
  return '#9333ea';
}

function aqiLabel(v) {
  if (v <= 50)  return 'Хорошее';
  if (v <= 100) return 'Умеренное';
  if (v <= 150) return 'Нездоровое для уязвимых';
  if (v <= 200) return 'Нездоровое';
  return 'Очень нездоровое';
}

function getAdvice(aqi) {
  if (aqi <= 50) return [
    ['✅', 'Воздух чистый — отличный день для прогулки'],
    ['🏃', 'Спорт на улице безопасен для всех'],
    ['🪟', 'Можно открывать окна для проветривания'],
  ];
  if (aqi <= 100) return [
    ['⚠️', 'Чувствительным людям ограничить время на улице'],
    ['🧒', 'Детям и пожилым — прогулки до 1–2 часов'],
    ['🪟', 'Утром окна лучше держать закрытыми'],
  ];
  if (aqi <= 150) return [
    ['🚫', 'Чувствительным группам не рекомендуется выходить на улицу'],
    ['😷', 'При выходе используйте маску FFP2'],
    ['🏠', 'По возможности оставайтесь в помещении'],
    ['💧', 'Пейте больше воды, избегайте физических нагрузок'],
  ];
  return [
    ['🚨', 'Опасный уровень — оставайтесь дома'],
    ['😷', 'На улице обязательна маска N95 или FFP3'],
    ['🏥', 'Астматикам и сердечникам — проконсультируйтесь с врачом'],
    ['🪟', 'Закройте все окна, используйте воздухоочиститель'],
  ];
}

// Демо-данные когда API недоступен
function getDemoData(station) {
  const base = { center: 87, north: 42, south: 95, east: 55, west: 38, industry: 142 };
  const aqi  = (base[station.id] || 70) + Math.floor(Math.random() * 8 - 4);
  return {
    aqi,
    stationName: station.name + ' (демо)',
    iaqi: {
      pm25: { v: +(aqi * 0.28).toFixed(1) },
      pm10: { v: +(aqi * 0.47).toFixed(1) },
      co:   { v: +(aqi * 0.009).toFixed(2) },
      no2:  { v: +(aqi * 0.21).toFixed(1) },
      o3:   { v: +(aqi * 0.72).toFixed(1) },
      so2:  { v: +(aqi * 0.10).toFixed(1) },
    }
  };
}

// Получить данные одной станции через WAQI API
async function fetchStationData(station) {
  try {
    const url  = `https://api.waqi.info/feed/geo:${station.lat};${station.lon}/?token=${WAQI_TOKEN}`;
    const res  = await fetch(url);
    const json = await res.json();

    if (json.status !== 'ok') throw new Error(json.data || 'API error');

    const d = json.data;
    return {
      aqi:         typeof d.aqi === 'number' ? d.aqi : parseInt(d.aqi) || 0,
      stationName: d.city?.name || station.name,
      iaqi:        d.iaqi || {},
      time:        d.time?.s || '',
    };
  } catch (err) {
    console.warn(`[АУА] Ошибка для ${station.name}:`, err.message);
    return getDemoData(station);
  }
}
