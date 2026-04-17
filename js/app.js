// ═══════════════════════════════════════════════
// ГЛАВНЫЙ МОДУЛЬ — ЗАПУСК И ОБНОВЛЕНИЕ
// ═══════════════════════════════════════════════

// Загрузить данные всех станций и обновить UI
async function loadAll(isDemo = false) {
  const barEl = document.getElementById('loading-bar');
  const txtEl = document.getElementById('loading-text');

  const total = STATIONS.length;
  let done    = 0;

  // Загружаем все станции параллельно
  await Promise.all(STATIONS.map(async station => {
    // Если передан override токен (из модала) — подменяем глобальный
    const tokenToUse = window.WAQI_TOKEN_OVERRIDE || WAQI_TOKEN;

    let data;
    if (isDemo) {
      data = getDemoData(station);
    } else {
      // Временно заменяем токен если есть override
      const origToken = window.WAQI_TOKEN;
      if (window.WAQI_TOKEN_OVERRIDE) {
        // helpers.js использует WAQI_TOKEN, патчим через fetch напрямую
        data = await fetchWithToken(station, tokenToUse);
      } else {
        data = await fetchStationData(station);
      }
    }

    allData[station.id] = data;
    addMarker(station, data);

    done++;
    if (barEl) barEl.style.width = (done / total * 100) + '%';
    if (txtEl) txtEl.textContent = `Загружаем: ${station.name}...`;
  }));

  renderSidebar(isDemo);
  hideLoading();
}

// Загрузка с кастомным токеном
async function fetchWithToken(station, token) {
  try {
    const url  = `https://api.waqi.info/feed/geo:${station.lat};${station.lon}/?token=${token}`;
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

// Скрыть загрузочный экран
function hideLoading() {
  const el = document.getElementById('loading');
  if (!el) return;
  setTimeout(() => {
    el.classList.add('hidden');
    setTimeout(() => el.remove(), 600);
  }, 400);
}

// Обновить статус в сайдбаре с учётом демо/реал
function renderSidebar(isDemo = false) {
  renderDistrictList();
  renderMainAqi();
  renderAdvice();
  renderStatusPill(isDemo);
}

// ─── Старт приложения ────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  // Показать загрузку
  document.getElementById('loading').style.display = 'flex';

  // Инициализировать карту
  initMap();

  // Попробовать загрузить реальные данные
  // Если WAQI_TOKEN задан — грузим реальные, иначе демо
  const useDemo = !WAQI_TOKEN || WAQI_TOKEN === 'ВАШ_ТОКЕН';
  await loadAll(useDemo);

  // Если загрузили реальные данные — показать это в кнопке
  if (!useDemo) {
    const btn = document.getElementById('token-btn');
    if (btn) {
      btn.textContent = '✅ WAQI подключён';
      btn.classList.add('connected');
    }
  }

  // Автообновление каждые 10 минут
  setInterval(() => {
    const isDemo = !WAQI_TOKEN && !window.WAQI_TOKEN_OVERRIDE;
    loadAll(isDemo);
  }, REFRESH_INTERVAL);
});
