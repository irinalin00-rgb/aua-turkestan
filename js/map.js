// ═══════════════════════════════════════════════
// КАРТА — LEAFLET
// ═══════════════════════════════════════════════

let mapObj  = null;
let layers  = {};   // { stationId: [circle, marker] }

// Инициализация карты
function initMap() {
  mapObj = L.map('map', {
    center: MAP_CENTER,
    zoom:   MAP_ZOOM,
  });

  // Тёмная тема карты (CartoDB Dark Matter — бесплатно, без ключа)
  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> © <a href="https://carto.com/">CARTO</a>',
    subdomains:  'abcd',
    maxZoom:     19,
  }).addTo(mapObj);
}

// Добавить / обновить маркер станции
function addMarker(station, data) {
  const { aqi, stationName, iaqi } = data;
  const color  = aqiColor(aqi);
  const label  = aqiLabel(aqi);

  // Радиус круга — больше при высоком загрязнении
  const radius = 500 + (Math.min(aqi, 300) / 300) * 900;

  // Удалить старые слои
  if (layers[station.id]) {
    layers[station.id].forEach(l => mapObj.removeLayer(l));
  }

  // Цветной круг зоны
  const circle = L.circle([station.lat, station.lon], {
    radius,
    color,
    fillColor:   color,
    fillOpacity: 0.2,
    weight:      2,
    opacity:     0.65,
  }).addTo(mapObj);

  // Подпись с числом AQI
  const icon = L.divIcon({
    className: '',
    html: `
      <div style="
        background: rgba(10,14,26,0.9);
        border: 1.5px solid ${color};
        border-radius: 10px;
        padding: 6px 10px;
        text-align: center;
        backdrop-filter: blur(8px);
        box-shadow: 0 4px 20px rgba(0,0,0,0.5), 0 0 12px ${color}33;
        white-space: nowrap;
        pointer-events: none;
      ">
        <div style="font-size:9px;color:#6b7280;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:2px;">
          ${station.emoji} ${station.name}
        </div>
        <div style="font-family:'Unbounded',sans-serif;font-size:20px;font-weight:800;color:${color};line-height:1">
          ${aqi}
        </div>
        <div style="font-size:9px;color:${color};opacity:0.85;margin-top:1px;">
          ${label}
        </div>
      </div>`,
    iconAnchor: [65, 32],
    iconSize:   [130, 64],
  });

  const marker = L.marker([station.lat, station.lon], { icon }).addTo(mapObj);

  // Попап с деталями
  const popupHtml = buildPopup(station, data, color, label);
  circle.bindPopup(popupHtml);
  marker.bindPopup(popupHtml);

  layers[station.id] = [circle, marker];
}

// HTML попапа
function buildPopup(station, data, color, label) {
  const { aqi, stationName, iaqi } = data;
  const v = key => iaqi[key]?.v ?? '—';

  return `
    <div class="popup-inner">
      <div class="popup-name">${station.emoji} ${station.name}</div>
      <div class="popup-aqi-row">
        <div class="popup-aqi-num" style="color:${color}">${aqi}</div>
        <div class="popup-aqi-info">
          <div class="popup-badge" style="background:${color}22;color:${color}">${label}</div>
          <div class="popup-coords">${station.lat.toFixed(3)}°N · ${station.lon.toFixed(3)}°E</div>
        </div>
      </div>
      <div class="popup-metrics">
        <div class="popup-metric"><div class="popup-metric-label">PM2.5</div><div class="popup-metric-val">${v('pm25')}</div></div>
        <div class="popup-metric"><div class="popup-metric-label">PM10</div><div class="popup-metric-val">${v('pm10')}</div></div>
        <div class="popup-metric"><div class="popup-metric-label">NO₂</div><div class="popup-metric-val">${v('no2')}</div></div>
        <div class="popup-metric"><div class="popup-metric-label">O₃</div><div class="popup-metric-val">${v('o3')}</div></div>
        <div class="popup-metric"><div class="popup-metric-label">SO₂</div><div class="popup-metric-val">${v('so2')}</div></div>
        <div class="popup-metric"><div class="popup-metric-label">CO</div><div class="popup-metric-val">${v('co')}</div></div>
      </div>
      <div class="popup-source">📡 WAQI · ${stationName}</div>
    </div>`;
}

// Перелёт к станции на карте
function flyToStation(station) {
  mapObj.flyTo([station.lat, station.lon], 14, { duration: 0.8 });
  layers[station.id]?.[0]?.openPopup();
}
