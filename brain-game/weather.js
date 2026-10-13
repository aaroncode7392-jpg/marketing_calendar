// ==========================================================
// 날씨 (Open-Meteo 무료 예보 + 미세먼지, 키 필요 없음)
// 지금 날씨, 오늘 챙길 것, 미세먼지, 3시간 간격 예보, 7일 예보를 크게 보여준다.
// 도시는 고르거나 "지금 있는 곳"으로 정할 수 있고, 고른 곳은 이 기기에만 기억한다.
// ==========================================================
(function () {
  const CITY_KEY = 'wxCity';
  const CACHE_MS = 15 * 60e3;
  const CITIES = [
    ['서울', 37.5665, 126.978], ['부산', 35.1796, 129.0756], ['대구', 35.8714, 128.6014], ['인천', 37.4563, 126.7052],
    ['광주', 35.1595, 126.8526], ['대전', 36.3504, 127.3845], ['울산', 35.5384, 129.3114], ['세종', 36.48, 127.289],
    ['수원', 37.2636, 127.0286], ['고양', 37.6584, 126.832], ['성남', 37.42, 127.1265], ['용인', 37.2411, 127.1776],
    ['청주', 36.6424, 127.489], ['천안', 36.8151, 127.1139], ['전주', 35.8242, 127.148], ['포항', 36.019, 129.3435],
    ['창원', 35.228, 128.6811], ['춘천', 37.8813, 127.7298], ['강릉', 37.7519, 128.8761], ['제주', 33.4996, 126.5312],
  ].map(([name, lat, lon]) => ({ name, lat, lon }));

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const cache = new Map();

  function loadCity() {
    try {
      const c = JSON.parse(localStorage.getItem(CITY_KEY) || 'null');
      if (c && typeof c.name === 'string' && Number.isFinite(c.lat) && Number.isFinite(c.lon)) return c;
    } catch (e) { /* 저장소를 못 쓰면 서울 */ }
    return CITIES[0];
  }
  function saveCity(c) { try { localStorage.setItem(CITY_KEY, JSON.stringify(c)); } catch (e) { /* 무시 */ } }

  // WMO 날씨 코드 → [설명, 낮 아이콘, 밤 아이콘]
  function describe(code, isDay = 1) {
    const T = {
      0: ['맑음', '☀️', '🌙'], 1: ['대체로 맑음', '🌤️', '🌙'], 2: ['구름 조금', '⛅', '☁️'], 3: ['흐림', '☁️', '☁️'],
      45: ['안개', '🌫️', '🌫️'], 48: ['짙은 안개', '🌫️', '🌫️'],
      51: ['약한 이슬비', '🌦️', '🌧️'], 53: ['이슬비', '🌦️', '🌧️'], 55: ['짙은 이슬비', '🌧️', '🌧️'], 56: ['어는 이슬비', '🌧️', '🌧️'], 57: ['어는 이슬비', '🌧️', '🌧️'],
      61: ['약한 비', '🌦️', '🌧️'], 63: ['비', '🌧️', '🌧️'], 65: ['강한 비', '🌧️', '🌧️'], 66: ['어는 비', '🌧️', '🌧️'], 67: ['어는 비', '🌧️', '🌧️'],
      71: ['약한 눈', '🌨️', '🌨️'], 73: ['눈', '🌨️', '🌨️'], 75: ['많은 눈', '❄️', '❄️'], 77: ['싸락눈', '🌨️', '🌨️'],
      80: ['소나기', '🌦️', '🌧️'], 81: ['소나기', '🌧️', '🌧️'], 82: ['강한 소나기', '⛈️', '⛈️'], 85: ['눈 소나기', '🌨️', '🌨️'], 86: ['눈 소나기', '❄️', '❄️'],
      95: ['천둥번개', '⛈️', '⛈️'], 96: ['우박 천둥번개', '⛈️', '⛈️'], 99: ['우박 천둥번개', '⛈️', '⛈️'],
    };
    const t = T[code] || ['알 수 없음', '🌡️', '🌡️'];
    return { text: t[0], icon: isDay ? t[1] : t[2] };
  }
  const isSnow = c => [71, 73, 75, 77, 85, 86].includes(c);

  // 우리나라 기준 미세먼지 등급
  function airGrade(v, kind) {
    if (!Number.isFinite(v)) return null;
    const cut = kind === 'pm10' ? [30, 80, 150] : [15, 35, 75];
    const g = v <= cut[0] ? 0 : v <= cut[1] ? 1 : v <= cut[2] ? 2 : 3;
    return { level: g, text: ['좋음', '보통', '나쁨', '매우 나쁨'][g], color: ['#3182F6', '#03B26C', '#FF9F1C', '#F04452'][g], emoji: ['😊', '🙂', '😷', '🤢'][g] };
  }

  async function fetchJson(url) {
    const res = await fetch(url, { signal: AbortSignal.timeout ? AbortSignal.timeout(12000) : undefined });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }

  async function load(city) {
    const key = `${city.lat.toFixed(3)},${city.lon.toFixed(3)}`;
    const hit = cache.get(key);
    if (hit && Date.now() - hit.at < CACHE_MS) return hit.data;
    const q = `latitude=${city.lat}&longitude=${city.lon}&timezone=Asia%2FSeoul`;
    const [fc, air] = await Promise.all([
      fetchJson(`https://api.open-meteo.com/v1/forecast?${q}&forecast_days=7&wind_speed_unit=ms`
        + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day'
        + '&hourly=temperature_2m,weather_code,precipitation_probability,is_day'
        + '&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,uv_index_max'),
      fetchJson(`https://air-quality-api.open-meteo.com/v1/air-quality?${q}&current=pm10,pm2_5`).catch(() => null),
    ]);
    if (!fc || !fc.current || !fc.daily || !fc.hourly) throw new Error('날씨 형식 오류');
    const data = { fc, air };
    cache.set(key, { at: Date.now(), data });
    return data;
  }

  // 오늘 챙길 것: [날씨 탭에 쓰는 문장, 첫 화면에 쓰는 짧은 문장] (중요한 것부터)
  function tips(fc, pm10, pm25) {
    const d = fc.daily, c = fc.current;
    const rain = d.precipitation_probability_max[0], tmin = d.temperature_2m_min[0], tmax = d.temperature_2m_max[0];
    const uv = d.uv_index_max[0], code = d.weather_code[0];
    const out = [];
    const add = (long, short) => out.push({ long, short });
    if (isSnow(code)) add('⛄ 눈 소식이 있어요. 길이 미끄러우니 천천히 걸으세요.', '⛄ 눈길 조심하세요');
    else if (rain >= 60) add('☂️ 비 소식이 있어요. 우산을 꼭 챙기세요.', '☂️ 우산 꼭 챙기세요');
    else if (rain >= 30) add('🌂 비가 올 수도 있어요. 작은 우산을 챙기세요.', '🌂 작은 우산 챙기세요');
    if (tmin <= 0) add('🧣 영하로 내려가요. 목도리와 두꺼운 옷을 입으세요.', '🧣 영하예요, 따뜻하게 입으세요');
    else if (tmin <= 7) add('🧥 아침저녁으로 쌀쌀해요. 겉옷을 챙기세요.', '🧥 쌀쌀해요, 겉옷 챙기세요');
    if (tmax >= 33) add('🥵 아주 더워요. 한낮 외출은 피하고 물을 자주 드세요.', '🥵 아주 더워요, 물 자주 드세요');
    else if (tmax >= 29) add('💧 더운 날이에요. 물을 자주 드세요.', '💧 더워요, 물 자주 드세요');
    if (tmax - tmin >= 10) add('🌡️ 낮과 밤 기온 차이가 커요. 얇은 옷을 겹쳐 입으세요.', '🌡️ 일교차가 커요, 겉옷 챙기세요');
    if (uv >= 8) add('🧢 햇볕이 아주 강해요. 모자와 선크림을 챙기세요.', '🧢 햇볕이 아주 강해요, 모자 쓰세요');
    else if (uv >= 6) add('🧢 햇볕이 강해요. 모자를 쓰세요.', '🧢 햇볕이 강해요, 모자 쓰세요');
    if ((pm10 && pm10.level >= 2) || (pm25 && pm25.level >= 2)) add('😷 미세먼지가 나빠요. 마스크를 쓰고 외출은 짧게 하세요.', '😷 미세먼지 나빠요, 마스크 챙기세요');
    if (c.wind_speed_10m >= 9) add('🌬️ 바람이 강해요. 모자가 날아가지 않게 조심하세요.', '🌬️ 바람이 강해요');
    if (!out.length) add('🚶 걷기 좋은 날씨예요. 30분 산책 어떠세요?', '🚶 산책하기 좋은 날이에요');
    return out;
  }

  const hourLabel = (iso, todayYmd) => {
    const h = Number(iso.slice(11, 13));
    const ampm = h < 12 ? '오전' : '오후';
    const hh = h % 12 === 0 ? 12 : h % 12;
    return `${iso.slice(0, 10) !== todayYmd ? '내일 ' : ''}${ampm} ${hh}시`;
  };
  const dayLabel = (ymdStr, i) => {
    if (i === 0) return '오늘';
    if (i === 1) return '내일';
    const [y, m, d] = ymdStr.split('-').map(Number);
    return `${'일월화수목금토'[new Date(y, m - 1, d).getDay()]}요일`;
  };

  function injectStyle() {
    if (document.getElementById('weatherStyle')) return;
    const st = document.createElement('style');
    st.id = 'weatherStyle';
    st.textContent = `
      .wx{font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#191F28;padding-top:6px;}
      .wx-loc{display:flex;align-items:center;gap:8px;margin:6px 0 4px;}
      .wx-loc button{border:0;border-radius:999px;background:#F2F4F6;color:#333D4B;font-family:inherit;font-weight:700;font-size:18px;padding:11px 18px;cursor:pointer;}
      .wx-loc button:active,.wx-pick button:active{transform:scale(.96);}
      .wx-now{text-align:center;padding:10px 0 4px;}
      .wx-ic{font-size:84px;line-height:1.1;}
      .wx-temp{font-size:64px;font-weight:800;letter-spacing:-2px;line-height:1.05;}
      .wx-desc{font-size:22px;font-weight:700;margin-top:4px;}
      .wx-meta{font-size:17px;color:#6B7684;margin-top:6px;}
      .wx-card{background:#F9FAFB;border-radius:20px;padding:16px 16px;margin-top:14px;}
      .wx-h{font-size:18px;font-weight:800;margin-bottom:10px;}
      .wx-tip{font-size:18px;line-height:1.5;padding:6px 0;}
      .wx-air{display:flex;gap:10px;}
      .wx-air div{flex:1;background:#fff;border-radius:16px;padding:12px;text-align:center;}
      .wx-air b{display:block;font-size:22px;margin-top:2px;}
      .wx-air small{font-size:15px;color:#6B7684;}
      .wx-hours{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;}
      .wx-hours div{background:#fff;border-radius:16px;padding:10px 4px;text-align:center;font-size:15px;color:#4E5968;}
      .wx-hours .i{font-size:30px;display:block;margin:2px 0;}
      .wx-hours b{font-size:20px;color:#191F28;display:block;}
      .wx-day{display:flex;align-items:center;gap:6px;padding:10px 0;border-bottom:1px solid #E5E8EB;font-size:17px;}
      .wx-day:last-child{border-bottom:0;}
      .wx-day .n{width:56px;font-weight:700;white-space:nowrap;}
      .wx-day .i{font-size:24px;width:32px;text-align:center;}
      .wx-day .r{width:52px;font-size:14px;color:#3182F6;font-weight:700;white-space:nowrap;letter-spacing:-.3px;}
      .wx-day .lo{width:34px;text-align:right;color:#6B7684;}
      .wx-day .hi{width:34px;font-weight:800;}
      .wx-bar{flex:1;height:8px;border-radius:4px;background:#E5E8EB;position:relative;}
      .wx-bar i{position:absolute;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg,#64A8FF,#FF9F1C);}
      .wx-pick{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-top:10px;}
      .wx-pick button{border:0;border-radius:14px;background:#F2F4F6;color:#333D4B;font-family:inherit;font-weight:700;font-size:17px;height:48px;cursor:pointer;}
      .wx-pick button.on{background:#191F28;color:#fff;}
      .wx-pick .me{grid-column:1/-1;background:#3182F6;color:#fff;}
      .wx-src{text-align:center;color:#8B95A1;font-size:13px;padding:14px 0 70px;}
    `;
    document.head.appendChild(st);
  }

  function render(el, city, data) {
    const { fc, air } = data;
    const c = fc.current, d = fc.daily, h = fc.hourly;
    const now = describe(c.weather_code, c.is_day);
    const pm10 = air && air.current ? airGrade(air.current.pm10, 'pm10') : null;
    const pm25 = air && air.current ? airGrade(air.current.pm2_5, 'pm25') : null;
    const todayYmd = c.time.slice(0, 10);
    const i0 = Math.max(0, h.time.indexOf(`${c.time.slice(0, 13)}:00`));
    const slots = [1, 2, 3, 4, 5, 6].map(k => i0 + k * 3).filter(i => i < h.time.length);
    const lo = Math.min(...d.temperature_2m_min), hi = Math.max(...d.temperature_2m_max), span = Math.max(1, hi - lo);
    const r = v => Math.round(v);
    el.innerHTML = `<div class="wx">
      <div class="wx-loc"><button id="wxCityBtn" type="button">📍 ${esc(city.name)} ▾</button></div>
      <div class="wx-now">
        <div class="wx-ic">${now.icon}</div>
        <div class="wx-temp">${r(c.temperature_2m)}°</div>
        <div class="wx-desc">${esc(now.text)}</div>
        <div class="wx-meta">최고 ${r(d.temperature_2m_max[0])}° · 최저 ${r(d.temperature_2m_min[0])}° · 체감 ${r(c.apparent_temperature)}°</div>
        <div class="wx-meta">습도 ${r(c.relative_humidity_2m)}% · 바람 ${c.wind_speed_10m.toFixed(1)}m/s · 비 올 확률 ${r(d.precipitation_probability_max[0] || 0)}%</div>
      </div>
      <div class="wx-card"><div class="wx-h">오늘 챙길 것</div>${tips(fc, pm10, pm25).map(t => `<div class="wx-tip">${esc(t.long)}</div>`).join('')}</div>
      ${pm10 || pm25 ? `<div class="wx-card"><div class="wx-h">미세먼지</div><div class="wx-air">
        ${pm10 ? `<div><small>미세먼지</small><b style="color:${pm10.color}">${pm10.emoji} ${pm10.text}</b><small>${r(air.current.pm10)}㎍/㎥</small></div>` : ''}
        ${pm25 ? `<div><small>초미세먼지</small><b style="color:${pm25.color}">${pm25.emoji} ${pm25.text}</b><small>${r(air.current.pm2_5)}㎍/㎥</small></div>` : ''}
      </div></div>` : ''}
      <div class="wx-card"><div class="wx-h">시간별 날씨</div><div class="wx-hours">
        ${slots.map(i => { const w = describe(h.weather_code[i], h.is_day ? h.is_day[i] : 1); return `<div>${hourLabel(h.time[i], todayYmd)}<span class="i">${w.icon}</span><b>${r(h.temperature_2m[i])}°</b>${h.precipitation_probability[i] >= 20 ? `<span style="color:#3182F6;font-weight:700;">☂ ${r(h.precipitation_probability[i])}%</span>` : '&nbsp;'}</div>`; }).join('')}
      </div></div>
      <div class="wx-card"><div class="wx-h">일주일 날씨</div>
        ${d.time.map((t, i) => { const w = describe(d.weather_code[i]); const a = (d.temperature_2m_min[i] - lo) / span * 100, b = (d.temperature_2m_max[i] - lo) / span * 100; return `<div class="wx-day"><span class="n">${dayLabel(t, i)}</span><span class="i">${w.icon}</span><span class="r">${(d.precipitation_probability_max[i] || 0) >= 20 ? `☂${r(d.precipitation_probability_max[i])}%` : ''}</span><span class="lo">${r(d.temperature_2m_min[i])}°</span><span class="wx-bar"><i style="left:${a.toFixed(0)}%;right:${(100 - b).toFixed(0)}%"></i></span><span class="hi">${r(d.temperature_2m_max[i])}°</span></div>`; }).join('')}
      </div>
      <div class="wx-src">날씨 정보: Open-Meteo · 15분마다 새로 받아와요</div>
    </div>`;
    el.querySelector('#wxCityBtn').addEventListener('click', () => pick(el, city));
  }

  function pick(el, current) {
    el.innerHTML = `<div class="wx"><div class="wx-card" style="margin-top:6px;"><div class="wx-h">어느 곳 날씨를 볼까요?</div>
      <div class="wx-pick">
        <button class="me" type="button" data-me="1">📍 지금 있는 곳으로</button>
        ${CITIES.map(c => `<button type="button" class="${c.name === current.name ? 'on' : ''}" data-n="${esc(c.name)}">${esc(c.name)}</button>`).join('')}
      </div><div class="wx-meta" id="wxPickMsg" style="text-align:center;margin-top:10px;"></div></div><div class="wx-src"></div></div>`;
    el.querySelector('.wx-pick').addEventListener('click', e => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.n) { const c = CITIES.find(x => x.name === b.dataset.n); saveCity(c); mount(el); return; }
      const msg = el.querySelector('#wxPickMsg');
      if (!navigator.geolocation) { msg.textContent = '이 기기에서는 위치를 알 수 없어요. 도시를 골라 주세요.'; return; }
      msg.textContent = '위치를 찾고 있어요… (허용을 눌러 주세요)';
      navigator.geolocation.getCurrentPosition(
        pos => { saveCity({ name: '지금 있는 곳', lat: pos.coords.latitude, lon: pos.coords.longitude }); mount(el); },
        () => { msg.textContent = '위치를 알 수 없어요. 아래에서 도시를 골라 주세요.'; },
        { timeout: 10000, maximumAge: 30 * 60e3 },
      );
    });
  }

  function mount(el) {
    injectStyle();
    const city = loadCity();
    el.innerHTML = '<div class="nw-note">날씨를 불러오는 중이에요…</div>';
    load(city).then(data => { if (el.isConnected) render(el, city, data); })
      .catch(() => {
        if (!el.isConnected) return;
        el.innerHTML = '<div class="nw-note">지금은 날씨를 불러올 수 없어요.<br>잠시 뒤에 다시 눌러 주세요.</div><div style="text-align:center;margin-top:12px;"><button class="nw-chip" id="wxRetry" type="button">다시 불러오기</button></div>';
        el.querySelector('#wxRetry').addEventListener('click', () => mount(el));
      });
  }

  // ---------------- 첫 화면: 오늘 날씨 짧게 ----------------
  const BRIEF_KEY = 'wxBrief';
  const BRIEF_FRESH_MS = 15 * 60e3, BRIEF_MAX_MS = 60 * 60e3;
  const PREDICATE = {
    0: '맑아요', 1: '대체로 맑아요', 2: '구름이 조금 있어요', 3: '흐려요', 45: '안개가 껴요', 48: '안개가 짙어요',
    51: '이슬비가 내려요', 53: '이슬비가 내려요', 55: '이슬비가 내려요', 56: '얼어붙는 비가 내려요', 57: '얼어붙는 비가 내려요',
    61: '비가 조금 와요', 63: '비가 와요', 65: '비가 많이 와요', 66: '얼어붙는 비가 와요', 67: '얼어붙는 비가 와요',
    71: '눈이 조금 와요', 73: '눈이 와요', 75: '눈이 많이 와요', 77: '싸락눈이 와요',
    80: '소나기가 와요', 81: '소나기가 와요', 82: '소나기가 세차게 와요', 85: '눈이 오다 말다 해요', 86: '눈이 많이 와요',
    95: '천둥번개가 쳐요', 96: '천둥번개가 쳐요', 99: '천둥번개가 쳐요',
  };
  // 받침이 있으면 '은', 없으면 '는'
  const topic = w => { const ch = w.charCodeAt(w.length - 1); return w + (ch >= 0xAC00 && ch <= 0xD7A3 && (ch - 0xAC00) % 28 ? '은' : '는'); };

  function briefOf(city, data) {
    const { fc, air } = data;
    const d = fc.daily, c = fc.current, r = v => Math.round(v);
    const code = d.weather_code[0];
    const place = city.name === '지금 있는 곳' ? '이곳은' : topic(city.name);
    const pm10 = air && air.current ? airGrade(air.current.pm10, 'pm10') : null;
    const pm25 = air && air.current ? airGrade(air.current.pm2_5, 'pm25') : null;
    return {
      city: city.name,
      at: Date.now(),
      title: `${describe(code, 1).icon} 오늘 ${place} ${PREDICATE[code] || '날씨를 알 수 없어요'}`,
      lines: [`지금 ${r(c.temperature_2m)}° · 최고 ${r(d.temperature_2m_max[0])}° · 최저 ${r(d.temperature_2m_min[0])}°`, tips(fc, pm10, pm25)[0].short],
    };
  }

  function injectHomeBrief(homeView) {
    const hero = homeView.querySelector('.hero');
    const hello = hero && hero.querySelector('.hello'), sub = hero && hero.querySelector('.sub');
    if (!hello || !sub || hello.textContent.includes('첫 방문')) return; // 처음 온 분께는 환영 인사를 그대로 둔다
    const orig = { hello: hello.innerHTML, sub: sub.innerHTML };
    const city = loadCity();
    const show = b => { hello.textContent = b.title; sub.innerHTML = b.lines.map(esc).join('<br>'); };
    let saved = null;
    try { saved = JSON.parse(localStorage.getItem(BRIEF_KEY) || 'null'); } catch (e) { saved = null; }
    const usable = saved && saved.city === city.name && Array.isArray(saved.lines) && Date.now() - saved.at < BRIEF_MAX_MS;
    if (usable) show(saved);
    else { hello.textContent = '🌤️ 오늘 날씨를 알아보는 중이에요'; sub.textContent = '잠깐만 기다려 주세요…'; }
    if (usable && Date.now() - saved.at < BRIEF_FRESH_MS) return;
    load(city).then(data => {
      const b = briefOf(city, data);
      try { localStorage.setItem(BRIEF_KEY, JSON.stringify(b)); } catch (e) { /* 무시 */ }
      if (hello.isConnected) show(b);
    }).catch(() => {
      // 날씨를 못 받으면 원래 인사로 되돌린다
      if (!usable && hello.isConnected) { hello.innerHTML = orig.hello; sub.innerHTML = orig.sub; }
    });
  }

  window.WEATHER = { mount, describe, airGrade, injectHomeBrief };
})();
