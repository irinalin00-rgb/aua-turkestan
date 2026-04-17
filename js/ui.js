// ═══════════════════════════════════════════════
// ИНТЕРФЕЙС — САЙДБАР, СТАТУС, МОДАЛ
// ═══════════════════════════════════════════════

let allData = {};   // { stationId: data }

// Отрисовать всю боковую панель
function renderSidebar() {
  renderDistrictList();
  renderMainAqi();
  renderAdvice();
  renderStatusPill();
}

// Список районов
function renderDistrictList() {
  const list = document.getElementById('district-list');
  list.innerHTML = '';

  STATIONS.forEach(station => {
    const data = allData[station.id];
    if (!data) return;

    const color = aqiColor(data.aqi);
    const item  = document.createElement('div');
    item.className = 'district-item';
    item.innerHTML = `
      <div class="district-dot" style="background:${color};box-shadow:0 0 6px ${color}66"></div>
      <div class="district-info">
        <div class="district-name">${station.emoji} ${station.name}</div>
        <div class="district-sub">${aqiLabel(data.aqi)}</div>
      </div>
      <div class="district-aqi" style="color:${color}">${data.aqi}</div>`;

    item.addEventListener('click', () => {
      flyToStation(station);
      document.querySelectorAll('.district-item').forEach(i => i.classList.remove('active'));
      item.classList.add('active');
    });

    list.appendChild(item);
  });
}

// Главный AQI (среднее по всем станциям)
function renderMainAqi() {
  const values = STATIONS.map(s => allData[s.id]?.aqi).filter(Boolean);
  if (!values.length) return;

  const avg   = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const color = aqiColor(avg);
  const pct   = Math.min((avg / 300) * 100, 100).toFixed(1);

  // Число
  const numEl = document.getElementById('main-aqi');
  numEl.textContent  = avg;
  numEl.style.color  = color;

  // Бейдж
  const badge = document.getElementById('main-badge');
  badge.textContent      = aqiLabel(avg);
  badge.style.background = color + '22';
  badge.style.color      = color;

  // Полоса
  const bar = document.getElementById('main-bar');
  bar.style.width      = pct + '%';
  bar.style.background = `linear-gradient(90deg, #22c55e, ${color})`;

  // Метрики центра
  const center = allData['center'];
  if (center?.iaqi) {
    const v = key => center.iaqi[key]?.v ?? '—';
    document.getElementById('m-pm25').textContent = v('pm25');
    document.getElementById('m-pm10').textContent = v('pm10');
    document.getElementById('m-co').textContent   = v('co');
    document.getElementById('m-no2').textContent  = v('no2');
    document.getElementById('m-o3').textContent   = v('o3');
    document.getElementById('m-so2').textContent  = v('so2');
  }
}

// Советы
function renderAdvice() {
  const values = STATIONS.map(s => allData[s.id]?.aqi).filter(Boolean);
  if (!values.length) return;

  const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  document.getElementById('advice-content').innerHTML =
    getAdvice(avg)
      .map(([icon, text]) => `<div class="advice-item"><span>${icon}</span><span>${text}</span></div>`)
      .join('');
}

// Статус в шапке
function renderStatusPill(isDemo = false) {
  const values = STATIONS.map(s => allData[s.id]?.aqi).filter(Boolean);
  if (!values.length) return;

  const avg   = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
  const color = aqiColor(avg);
  const time  = new Date().toLocaleTimeString('ru-KZ', { hour: '2-digit', minute: '2-digit' });

  const pill = document.getElementById('status-pill');
  pill.style.background  = color + '18';
  pill.style.borderColor = color + '44';
  pill.style.color       = color;

  document.getElementById('pulse-dot').style.background = color;
  document.getElementById('status-text').textContent =
    (isDemo ? '🎭 Демо · ' : '🛰 WAQI · ') + time;
}

// ─── Модальное окно токена ───────────────────
function openTokenModal() {
  document.getElementById('token-modal').classList.add('open');
}

function closeTokenModal() {
  document.getElementById('token-modal').classList.remove('open');
  document.getElementById('key-error').style.display = 'none';
}

// Закрыть по клику вне карточки
document.getElementById('token-modal').addEventListener('click', function(e) {
  if (e.target === this) closeTokenModal();
});

// Закрыть по Escape
document.addEventListener('keydown', e => {
  if (e.key === 'Escape') closeTokenModal();
});

// Кнопка токена в шапке
async function submitKey() {
  const val = document.getElementById('key-input').value.trim();
  if (!val) return;

  const errEl = document.getElementById('key-error');
  errEl.style.display = 'none';

  try {
    const res  = await fetch(`https://api.waqi.info/feed/geo:${MAP_CENTER[0]};${MAP_CENTER[1]}/?token=${val}`);
    const json = await res.json();
    if (json.status !== 'ok') throw new Error();

    // Токен работает — обновляем конфиг и перезагружаем
    window.WAQI_TOKEN_OVERRIDE = val;
    closeTokenModal();

    const btn = document.getElementById('token-btn');
    btn.textContent = '✅ WAQI подключён';
    btn.classList.add('connected');

    loadAll(false); // перезагрузить с новым токеном
  } catch {
    errEl.style.display = 'block';
  }
}

// Enter в поле токена
document.getElementById('key-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') submitKey();
});
