// ==========================================================
// 날씨·계절 연동 3D Mii 캐릭터 산책 광장 & 실시간 화면 연동 (window.PET)
// - 다마고치 버튼 제거 (순수 3D 산책 & 날씨·계절 공간)
// - 날씨별 복장 & 소품 자동 변화:
//   1) 더우면 / 맑고 따뜻하면: 반팔 (char_610708 / char_691105)
//   2) 비오면: 우산 들고 산책
//   3) 추우면: 코트와 목도리 착용 (char_*_coat)
//   4) 눈오면: 패딩 입고 우산 들고 산책 (char_*_pad + 우산)
// - 무작위 자율 행동:
//   1) 자연스럽게 좌·우 걸어다니기 (walk)
//   2) 이불 덮고 잠들기 (sleep)
//   3) 의자에 앉아있기 (sit)
//   4) 철봉 턱걸이 운동하기 (pullup)
// - 계절(봄·여름·가을·겨울) 및 날씨(맑음·비·눈·추위·더위·밤)가 입체적으로 표현되는 배경 공간
// - 정면·좌측면·우측면 3D 보행 및 610708 ↔ 691105 실시간 화면 연동
// ==========================================================
(function () {
  const SHARED_DOC_ID = 'pet-plaza-610708-691105';
  const PRESENCE_TTL_MS = 35000;
  const HEARTBEAT_MS = 10000;

  const CHAR_ASSETS = {
    '610708_short_front': 'assets/pet/char_610708.png?v=5',
    '610708_short_side': 'assets/pet/char_610708_side.png?v=5',
    '691105_short_front': 'assets/pet/char_691105.png?v=5',
    '691105_short_side': 'assets/pet/char_691105_side.png?v=5',

    '610708_coat_front': 'assets/pet/char_610708_coat.png?v=5',
    '610708_coat_side': 'assets/pet/char_610708_coat_side.png?v=5',
    '691105_coat_front': 'assets/pet/char_691105_coat.png?v=5',
    '691105_coat_side': 'assets/pet/char_691105_coat_side.png?v=5',

    '610708_pad_front': 'assets/pet/char_610708_pad.png?v=5',
    '610708_pad_side': 'assets/pet/char_610708_pad_side.png?v=5',
    '691105_pad_front': 'assets/pet/char_691105_pad.png?v=5',
    '691105_pad_side': 'assets/pet/char_691105_pad_side.png?v=5',

    'mutul_front': 'assets/pet/char_mutul.png?v=1',
    'mutul_side': 'assets/pet/char_mutul_side.png?v=1',
    'puppy_front': 'assets/pet/char_puppy.png?v=1',
    'puppy_side': 'assets/pet/char_puppy_side.png?v=1',
  };
  const loadedSprites = {};

  function preloadSprites() {
    Object.keys(CHAR_ASSETS).forEach((k) => {
      if (loadedSprites[k]) return;
      const img = new Image();
      img.onload = () => { loadedSprites[k] = img; };
      img.src = CHAR_ASSETS[k];
    });
  }
  preloadSprites();

  function getMyId() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    const mid = m && String(m.birthdate || m.id || '');
    if (mid === '610708' || mid === '691105') return mid;
    return '610708';
  }

  function getPetState() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m && m.petState && typeof m.petState === 'object') return m.petState;
    return { lv: 1, exp: 30 };
  }

  function injectStyle() {
    if (document.getElementById('petTamagotchiStyle')) return;
    const st = document.createElement('style');
    st.id = 'petTamagotchiStyle';
    st.textContent = `
      .hero-compact-stats{display:flex;align-items:center;justify-content:space-between;gap:6px;background:#F8FAFC;border:1.5px solid #E2E8F0;border-radius:12px;padding:7px 11px;margin-bottom:10px;font-size:13.5px;font-weight:700;color:#334155;white-space:nowrap;overflow:hidden;}
      .hero-compact-stats span{display:inline-flex;align-items:center;gap:3px;}
      .hero-compact-stats .stat-div{color:#CBD5E1;font-weight:400;}
      .hero-compact-stats .stat-card-link{background:#FFF3E0;color:#D97706;padding:2px 8px;border-radius:999px;cursor:pointer;border:1px solid #FDE68A;}
      .pet-stage-box{position:relative;margin-top:12px;border-radius:20px;overflow:hidden;border:2.5px solid rgba(255,255,255,.9);box-shadow:0 8px 22px rgba(15,23,42,.13);background:#BAE6FD;user-select:none;-webkit-user-select:none;}
      .pet-hud{position:absolute;top:8px;left:10px;right:10px;z-index:4;display:flex;justify-content:space-between;align-items:center;gap:6px;pointer-events:none;}
      .pet-sync-pill{pointer-events:auto;display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);color:#0F172A;font-size:12px;font-weight:800;padding:4px 10px;border-radius:999px;box-shadow:0 2px 8px rgba(0,0,0,.1);white-space:nowrap;}
      .pet-sync-dot{width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;box-shadow:0 0 0 2px rgba(16,185,129,.25);}
      .pet-wx-pill{pointer-events:auto;background:rgba(15,23,42,.68);backdrop-filter:blur(6px);color:#fff;font-size:12px;font-weight:700;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;white-space:nowrap;cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.12);}
      .pet-bubble-wrap{position:absolute;top:36px;left:12px;right:12px;z-index:4;display:flex;justify-content:center;pointer-events:none;}
      .pet-bubble{background:rgba(255,255,255,.92);backdrop-filter:blur(6px);border:1.5px solid #FDE68A;border-radius:999px;padding:4px 12px;font-family:'Jua';font-size:12.5px;color:#1E293B;line-height:1.25;text-align:center;box-shadow:0 3px 10px rgba(0,0,0,.08);max-width:96%;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;position:relative;transition:opacity .35s ease,transform .35s ease;}
      .pet-bubble.is-hidden{opacity:0;transform:translateY(-6px);}
      .pet-canvas-wrap{position:relative;z-index:3;height:280px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;}
      .pet-canvas{width:100%;height:280px;display:block;}
      .pet-fx-layer{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;}
      .pet-float-item{position:absolute;font-size:24px;animation:petFloatUp .95s ease-out forwards;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2));}
      @keyframes petFloatUp{0%{opacity:1;transform:translate(-50%,0) scale(.6);}40%{opacity:1;transform:translate(-50%,-28px) scale(1.2);}100%{opacity:0;transform:translate(-50%,-64px) scale(.9);}}
    `;
    document.head.appendChild(st);
  }

  let activeMount = null;
  let globalPlayingHeartbeat = null;

  // 자정(00:00) 기준 오늘 날짜 문자열 ('YYYY-MM-DD') 반환
  function getTodayLocalYMD(d = new Date()) {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth() + 1).padStart(2, '0');
    const day = String(dt.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // 해당 회원이 오늘(자정 00:00 ~ 23:59:59) 게임을 완료했는지 확인
  function hasMemberCompletedToday(memberDoc) {
    if (!memberDoc || typeof memberDoc !== 'object') return false;
    const today = getTodayLocalYMD();
    if (memberDoc.crownDate === today) return true;
    const isHit = (ts) => ts && getTodayLocalYMD(new Date(ts)) === today;
    if (Array.isArray(memberDoc.completedLog) && memberDoc.completedLog.some(isHit)) return true;
    if (Array.isArray(memberDoc.scoreLog) && memberDoc.scoreLog.some((s) => s && isHit(s.ts))) return true;
    return false;
  }

  const playerState = {
    '610708': { playing: false, gameLabel: '두뇌운동', crownDate: null, crownOverride: null },
    '691105': { playing: false, gameLabel: '두뇌운동', crownDate: null, crownOverride: null },
  };

  // 로컬스토리지에 저장된 오늘의 왕관 기록 복원
  ['610708', '691105'].forEach((id) => {
    try {
      const savedDate = localStorage.getItem('petCrownDate:' + id);
      if (savedDate === getTodayLocalYMD()) {
        playerState[id].crownDate = savedDate;
      }
    } catch (e) { /* 무시 */ }
  });

  // 현재 시각 기준(자정 전까지) 해당 캐릭터가 왕관을 써야 하는지 판별
  function hasCrownNow(charId) {
    const st = playerState[charId];
    if (!st) return false;
    if (typeof st.crownOverride === 'boolean') return st.crownOverride;
    const today = getTodayLocalYMD();
    if (st.crownDate === today) return true;
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m && String(m.birthdate || m.id || '') === charId && hasMemberCompletedToday(m)) {
      st.crownDate = today;
      return true;
    }
    return false;
  }

  function syncPlayerStateToFirestore(extraPayload) {
    try {
      const db = typeof initFirebase === 'function' ? initFirebase() : null;
      if (!db) return;
      const myId = getMyId();
      const st = playerState[myId];
      const payload = {
        type: 'petPlaza',
        presence: { [myId]: new Date().toISOString() },
        playingState: {
          [myId]: {
            playing: Boolean(st && st.playing),
            label: (st && st.gameLabel) || '두뇌운동',
            at: new Date().toISOString(),
          },
        },
        crowns: {
          [myId]: hasCrownNow(myId) ? getTodayLocalYMD() : null,
        },
        ...(extraPayload || {}),
      };
      db.collection('members').doc(SHARED_DOC_ID).set(payload, { merge: true }).catch(() => {});
    } catch (e) { /* 오프라인 무시 */ }
  }

  function setPlayingState(isPlaying, gameLabel = '두뇌운동', targetId = null) {
    const id = targetId || getMyId();
    if (!playerState[id]) return;
    playerState[id].playing = Boolean(isPlaying);
    if (gameLabel) playerState[id].gameLabel = gameLabel;

    if (activeMount && typeof activeMount.onPlayerStateChanged === 'function') {
      activeMount.onPlayerStateChanged(id);
    }
    syncPlayerStateToFirestore();

    if (!targetId) {
      if (globalPlayingHeartbeat) {
        clearInterval(globalPlayingHeartbeat);
        globalPlayingHeartbeat = null;
      }
      if (isPlaying) {
        globalPlayingHeartbeat = setInterval(() => {
          syncPlayerStateToFirestore();
        }, HEARTBEAT_MS);
      }
    }
  }

  function markCompletedToday(targetId = null) {
    const id = targetId || getMyId();
    const today = getTodayLocalYMD();
    if (playerState[id]) {
      playerState[id].crownDate = today;
    }
    try {
      localStorage.setItem('petCrownDate:' + id, today);
    } catch (e) { /* 무시 */ }
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m && String(m.birthdate || m.id || '') === id) {
      m.crownDate = today;
      if (typeof saveMember === 'function') saveMember();
    }
    if (activeMount && typeof activeMount.onPlayerStateChanged === 'function') {
      activeMount.onPlayerStateChanged(id);
    }
    syncPlayerStateToFirestore();
  }

  function getCurrentSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  function parseWeatherState(brief, previewPreset) {
    if (previewPreset) {
      if (previewPreset === 'drizzle') {
        return { season: getCurrentSeason(), isChristmas: false, isRain: true, isDrizzle: true, isSnow: false, isCold: false, isHot: false, isNight: false, outfit: 'short', hasUmbrella: true, badge: '🌦️ 이슬비 · 우산 산책', line: '🌦️ 촉촉한 이슬비가 내려서 우산을 챙겨 들고 산책해요!' };
      }
      if (previewPreset === 'rain') {
        return { season: getCurrentSeason(), isChristmas: false, isRain: true, isDrizzle: false, isSnow: false, isCold: false, isHot: false, isNight: false, outfit: 'short', hasUmbrella: true, badge: '☂️ 비 · 우산 산책', line: '☂️ 비가 내려서 두 분 다 우산을 챙겨 들고 산책 중이에요!' };
      }
      if (previewPreset === 'cold') {
        return { season: 'winter', isChristmas: true, isRain: false, isDrizzle: false, isSnow: false, isCold: true, isHot: false, isNight: false, outfit: 'coat', hasUmbrella: false, badge: '🎄 추위 · 코트와 목도리', line: '🎄 크리스마스 겨울 광장! 날씨가 쌀쌀해서 따뜻한 코트와 목도리를 두르고 산책해요!' };
      }
      if (previewPreset === 'snow') {
        return { season: 'winter', isChristmas: true, isRain: false, isDrizzle: false, isSnow: true, isCold: true, isHot: false, isNight: false, outfit: 'pad', hasUmbrella: true, badge: '🎄 눈 · 우산과 패딩', line: '🎄 화이트 크리스마스! 함박눈이 내려서 패딩을 입고 우산을 쓰고 걸어요!' };
      }
      if (previewPreset === 'hot') {
        return { season: 'summer', isChristmas: false, isRain: false, isDrizzle: false, isSnow: false, isCold: false, isHot: true, isNight: false, outfit: 'short', hasUmbrella: false, badge: '☀️ 더움 · 시원한 반팔', line: '☀️ 햇살이 따뜻한 날이라 시원한 반팔 차림으로 산책 중이에요!' };
      }
      if (previewPreset === 'spring') {
        return { season: 'spring', isChristmas: false, isRain: false, isDrizzle: false, isSnow: false, isCold: false, isHot: false, isNight: false, outfit: 'short', hasUmbrella: false, badge: '🌸 봄꽃 공원 · 반팔', line: '🌸 벚꽃이 살랑살랑 흩날리는 봄날 공원을 함께 걸어요!' };
      }
    }

    const hour = new Date().getHours();
    const isNight = brief && brief.isDay !== undefined ? !brief.isDay : (hour >= 19 || hour < 6);
    const rawCode = brief && Number.isFinite(brief.code) ? brief.code : 0;
    const dailyCode = brief && Number.isFinite(brief.dailyCode) ? brief.dailyCode : rawCode;
    const currentCode = brief && Number.isFinite(brief.currentCode) ? brief.currentCode : rawCode;
    const temp = brief && Number.isFinite(brief.temp) ? brief.temp : 16;

    // 상단 날씨 헤드라인 텍스트("🌦️ 오늘 서울은 이슬비가 내려요" 등)도 함께 파싱하여 맵 날씨와 100% 일치시킴!
    let titleText = (brief && typeof brief.title === 'string') ? brief.title : '';
    if (!titleText && typeof document !== 'undefined') {
      const helloEl = document.querySelector('.hero .hello');
      if (helloEl && helloEl.textContent) titleText = helloEl.textContent;
    }

    const DRIZZLE_CODES = [51, 53, 55, 56, 57];
    const RAIN_CODES = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99];
    const SNOW_CODES = [71, 73, 75, 77, 85, 86];

    const isDrizzle = DRIZZLE_CODES.includes(rawCode) || DRIZZLE_CODES.includes(dailyCode) || DRIZZLE_CODES.includes(currentCode) || /이슬비|안개비|가랑비/.test(titleText);
    const isSnow = SNOW_CODES.includes(rawCode) || SNOW_CODES.includes(dailyCode) || SNOW_CODES.includes(currentCode) || /눈이|싸락눈|폭설|함박눈/.test(titleText);
    const isRain = !isSnow && (isDrizzle || RAIN_CODES.includes(rawCode) || RAIN_CODES.includes(dailyCode) || RAIN_CODES.includes(currentCode) || /비|소나기|천둥|번개/.test(titleText));
    const isCold = !isSnow && temp <= 10;
    const isHot = temp >= 23;

    let season = getCurrentSeason();
    if (isSnow || (!isRain && (isCold || temp <= 10))) season = 'winter';
    else if (isHot) season = 'summer';

    // 이슬비·비가 내릴 때는 눈 덮인 크리스마스 배경 대신 비/이슬비 맵이 표현되도록 함!
    const isChristmas = Boolean(!isRain && (isSnow || isCold || season === 'winter'));

    let outfit = 'short';
    if (isSnow) outfit = 'pad';
    else if (isCold || season === 'winter') outfit = 'coat';
    else outfit = 'short';

    const hasUmbrella = isRain || isSnow;

    let badge = '🌤️ 산책하기 좋은 날';
    let line = '😊 광장에서 산책·턱걸이 운동·의자 휴식·낮잠을 자유롭게 즐겨요!';
    if (isSnow) {
      badge = `🎄 눈 (${temp}°) · 패딩과 우산`;
      line = '🎄 화이트 크리스마스! 따뜻한 패딩에 우산을 챙겨 들고 산책해요!';
    } else if (isDrizzle && isCold) {
      badge = `🌦️ 이슬비 (${temp}°) · 코트와 우산`;
      line = '🌦️ 쌀쌀한 이슬비가 촉촉하게 내려요! 코트와 목도리, 우산을 챙겼어요 😊';
    } else if (isDrizzle) {
      badge = `🌦️ 이슬비 (${temp}°) · 우산 산책`;
      line = '🌦️ 오늘 서울에 촉촉한 이슬비가 내려요! 우산을 쓰고 산책해요 😊';
    } else if (isRain && isCold) {
      badge = `☂️ 찬비 (${temp}°) · 코트와 우산`;
      line = '☂️ 쌀쌀한 비 소식에 코트와 목도리, 우산까지 따뜻하게 챙겼어요!';
    } else if (isRain) {
      badge = `☂️ 비 (${temp}°) · 우산 산책`;
      line = '☂️ 오늘은 비 소식이 있어요! 외출하실 때 우산 꼭 챙기세요 😊';
    } else if (isCold || season === 'winter') {
      badge = `🎄 추위 (${temp}°) · 코트와 목도리`;
      line = '🎄 크리스마스 겨울 광장! 쌀쌀한 날씨에 따뜻한 코트와 목도리를 착용하셨어요!';
    } else if (isHot) {
      badge = `☀️ 따뜻함 (${temp}°) · 반팔 산책`;
      line = '☀️ 날씨가 따뜻해서 가벼운 반팔 차림으로 상쾌하게 산책해요!';
    } else if (brief && Number.isFinite(brief.temp)) {
      const seasonKor = { spring: '🌸 봄', summer: '🌿 여름', autumn: '🍁 가을', winter: '🎄 겨울' }[season];
      badge = `${seasonKor} ${temp}° · 산책 광장`;
    }

    return { season, isChristmas, isNight, isRain, isDrizzle, isSnow, isCold, isHot, outfit, hasUmbrella, badge, line, temp };
  }

  function normAngle(a) {
    while (a > Math.PI) a -= Math.PI * 2;
    while (a < -Math.PI) a += Math.PI * 2;
    return a;
  }
  function lerpAngle(cur, target, rate) {
    const diff = normAngle(target - cur);
    return normAngle(cur + diff * rate);
  }

  // ==========================================================
  // 계절(봄·여름·가을·겨울 크리스마스) & 날씨(맑음·이슬비·비·눈·추위·밤) 배경 공간 렌더러
  // ==========================================================
  function drawSceneryBackground(ctx, t, wx, bgParticles, ripples) {
    const W = 580, H = 430;
    const horizonY = 252;
    // 비·이슬비가 내릴 때는 크리스마스 눈 배경 대신 비/이슬비 맵이 표현되도록 함!
    const isXmas = Boolean(!wx.isRain && (wx.isChristmas || wx.isSnow));

    // 1. 하늘 그라데이션
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (wx.isNight && !wx.isRain) {
      skyGrad.addColorStop(0, '#0F172A');
      skyGrad.addColorStop(1, '#1E3A5F');
    } else if (wx.isRain) {
      if (wx.isDrizzle) {
        // 이슬비 내리는 촉촉한 안개빛 하늘
        skyGrad.addColorStop(0, '#475569');
        skyGrad.addColorStop(0.55, '#64748B');
        skyGrad.addColorStop(1, '#CBD5E1');
      } else {
        // 비 내리는 비구름 하늘
        skyGrad.addColorStop(0, '#334155');
        skyGrad.addColorStop(0.55, '#64748B');
        skyGrad.addColorStop(1, '#94A3B8');
      }
    } else if (isXmas) {
      if (wx.isSnow) {
        // 눈 오는 화이트 크리스마스 하늘
        skyGrad.addColorStop(0, '#1D4ED8');
        skyGrad.addColorStop(0.52, '#60A5FA');
        skyGrad.addColorStop(1, '#E0F2FE');
      } else {
        // 추운 날 포근한 겨울 크리스마스 하늘
        skyGrad.addColorStop(0, '#1E3A8A');
        skyGrad.addColorStop(0.55, '#3B82F6');
        skyGrad.addColorStop(1, '#BAE6FD');
      }
    } else if (wx.season === 'autumn') {
      skyGrad.addColorStop(0, '#38BDF8');
      skyGrad.addColorStop(0.65, '#BAE6FD');
      skyGrad.addColorStop(1, '#FDE68A');
    } else if (wx.season === 'spring') {
      skyGrad.addColorStop(0, '#60A5FA');
      skyGrad.addColorStop(0.6, '#BFDBFE');
      skyGrad.addColorStop(1, '#FCE7F3');
    } else {
      skyGrad.addColorStop(0, '#0284C7');
      skyGrad.addColorStop(0.65, '#7DD3FC');
      skyGrad.addColorStop(1, '#E0F2FE');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY + 10);

    // 크리스마스 하늘 반짝이는 황금 별빛
    if (isXmas) {
      ctx.save();
      const stars = [
        { x: 64, y: 74, r: 2.2 },
        { x: 148, y: 92, r: 1.8 },
        { x: 235, y: 68, r: 2.5 },
        { x: 342, y: 84, r: 2.0 },
        { x: 432, y: 66, r: 2.4 },
        { x: 518, y: 88, r: 1.9 },
      ];
      stars.forEach((st, idx) => {
        const twinkle = 0.45 + 0.55 * Math.sin(t * 3.6 + idx * 1.3);
        ctx.fillStyle = `rgba(254, 240, 138, ${twinkle})`;
        ctx.shadowColor = '#FDE047';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.arc(st.x, st.y, st.r * (0.8 + twinkle * 0.4), 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    // 2. 해 / 달 / 구름
    ctx.save();
    if ((wx.isNight && !wx.isRain) || (isXmas && !wx.isSnow)) {
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FEF08A';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(488, 84, 20, 0, Math.PI * 2);
      ctx.fill();
    } else if (!wx.isRain && !wx.isSnow) {
      const sunPulse = 1 + Math.sin(t * 2) * 0.05;
      const sunGrad = ctx.createRadialGradient(485, 82, 6, 485, 82, 54 * sunPulse);
      sunGrad.addColorStop(0, 'rgba(255, 251, 235, 1)');
      sunGrad.addColorStop(0.4, 'rgba(253, 224, 71, 0.85)');
      sunGrad.addColorStop(1, 'rgba(253, 224, 71, 0)');
      ctx.fillStyle = sunGrad;
      ctx.beginPath();
      ctx.arc(485, 82, 54 * sunPulse, 0, Math.PI * 2);
      ctx.fill();
    }

    const cloudColor = wx.isRain
      ? 'rgba(71, 85, 105, 0.86)'
      : wx.isNight
        ? 'rgba(148, 163, 184, 0.25)'
        : isXmas
          ? 'rgba(255, 255, 255, 0.68)'
          : 'rgba(255, 255, 255, 0.82)';
    ctx.fillStyle = cloudColor;
    [
      { baseX: 95, y: 78, s: 1.02, spd: 1.6 },
      { baseX: 280, y: 64, s: 0.90, spd: 1.2 },
      { baseX: 455, y: 88, s: 0.85, spd: 1.9 },
    ].forEach((cl) => {
      const cx = ((cl.baseX + t * cl.spd) % (W + 120)) - 60;
      ctx.save();
      ctx.translate(cx, cl.y);
      ctx.scale(cl.s, cl.s);
      ctx.beginPath();
      ctx.arc(0, 0, 22, 0, Math.PI * 2);
      ctx.arc(20, -6, 26, 0, Math.PI * 2);
      ctx.arc(44, 0, 20, 0, Math.PI * 2);
      ctx.arc(22, 8, 22, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
    ctx.restore();

    // 2.5. 도심 속 공원 느낌을 주는 서울 스카이라인 & 빌딩 숲 (원경 언덕 뒤편)
    drawCitySkyline(ctx, horizonY, wx, isXmas, t);

    // 3. 원경 산자락 & 언덕 (계절 및 비/이슬비 색상)
    ctx.save();
    let farHillColor = '#86EFAC';
    let nearHillColor = '#4ADE80';
    let lawnTopColor = '#86EFAC';
    let lawnBotColor = '#4ADE80';
    let pathColor = '#E2E8F0';

    if (wx.isRain) {
      farHillColor = '#64748B';
      nearHillColor = '#34D399';
      lawnTopColor = '#6EE7B7';
      lawnBotColor = '#10B981';
      pathColor = '#94A3B8';
    } else if (isXmas) {
      farHillColor = '#CBD5E1';
      nearHillColor = '#E2E8F0';
      lawnTopColor = '#F8FAFC';
      lawnBotColor = '#E2E8F0';
      pathColor = '#CBD5E1';
    } else if (wx.season === 'autumn') {
      farHillColor = '#FCD34D';
      nearHillColor = '#BBF7D0';
      lawnTopColor = '#BEF264';
      lawnBotColor = '#84CC16';
      pathColor = '#FEF3C7';
    } else if (wx.season === 'spring') {
      farHillColor = '#A7F3D0';
      nearHillColor = '#6EE7B7';
      lawnTopColor = '#A7F3D0';
      lawnBotColor = '#34D399';
      pathColor = '#FDF2F8';
    } else {
      farHillColor = '#4ADE80';
      nearHillColor = '#22C55E';
      lawnTopColor = '#86EFAC';
      lawnBotColor = '#22C55E';
      pathColor = '#F1F5F9';
    }

    ctx.fillStyle = farHillColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 12);
    ctx.quadraticCurveTo(145, horizonY - 34, 310, horizonY + 6);
    ctx.quadraticCurveTo(455, horizonY - 28, W, horizonY + 8);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = nearHillColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8);
    ctx.quadraticCurveTo(210, horizonY - 18, 410, horizonY + 10);
    ctx.quadraticCurveTo(510, horizonY - 8, W, horizonY + 12);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const lawnGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    lawnGrad.addColorStop(0, lawnTopColor);
    lawnGrad.addColorStop(1, lawnBotColor);
    ctx.fillStyle = lawnGrad;
    ctx.fillRect(0, horizonY + 6, W, H - horizonY);

    // 도심 공원 산책로 난간(펜스) — 도시와 공원의 경계를 자연스럽게 연결
    ctx.save();
    ctx.strokeStyle = isXmas ? 'rgba(148, 163, 184, 0.55)' : 'rgba(71, 85, 105, 0.32)';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 10);
    ctx.lineTo(W, horizonY + 10);
    ctx.moveTo(0, horizonY + 16);
    ctx.lineTo(W, horizonY + 16);
    for (let fx = 12; fx < W; fx += 28) {
      ctx.moveTo(fx, horizonY + 7);
      ctx.lineTo(fx, horizonY + 19);
    }
    ctx.stroke();
    ctx.restore();

    // 이슬비 내릴 때 지평선 위로 은은하게 깔리는 촉촉한 물안개 레이어
    if (wx.isRain) {
      const mistGrad = ctx.createLinearGradient(0, horizonY - 24, 0, horizonY + 26);
      mistGrad.addColorStop(0, 'rgba(226, 232, 240, 0)');
      mistGrad.addColorStop(0.5, wx.isDrizzle ? 'rgba(226, 232, 240, 0.42)' : 'rgba(203, 213, 225, 0.28)');
      mistGrad.addColorStop(1, 'rgba(226, 232, 240, 0)');
      ctx.fillStyle = mistGrad;
      ctx.fillRect(0, horizonY - 24, W, 50);
    }

    ctx.fillStyle = pathColor;
    ctx.globalAlpha = wx.isRain ? 0.65 : 0.72;
    ctx.beginPath();
    ctx.ellipse(290, 384, 248, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // 비/이슬비 내릴 때 광장 바닥에 반짝이는 물웅덩이(Puddles)
    if (wx.isRain) {
      ctx.fillStyle = 'rgba(125, 211, 252, 0.35)';
      [
        { px: 165, py: 382, rx: 38, ry: 9 },
        { px: 295, py: 392, rx: 46, ry: 11 },
        { px: 415, py: 378, rx: 34, ry: 8 },
      ].forEach((pd) => {
        ctx.beginPath();
        ctx.ellipse(pd.px, pd.py, pd.rx, pd.ry, 0, 0, Math.PI * 2);
        ctx.fill();
      });
    }
    ctx.restore();

    // 4. 풍성한 도심 숲 나무 심기 (원경 능선 나무숲 + 중경 산책로 나무 + 양옆 큰 나무까지 총 12그루!)
    const backTrees = [
      { x: 86, y: 253, s: 0.58, v: 1 },
      { x: 158, y: 247, s: 0.54, v: 2 },
      { x: 234, y: 252, s: 0.62, v: 0 },
      { x: 344, y: 250, s: 0.60, v: 1 },
      { x: 414, y: 254, s: 0.56, v: 2 },
      { x: 486, y: 251, s: 0.58, v: 0 },
    ];
    const midTrees = [
      { x: 18, y: 268, s: 0.76, v: 2 },
      { x: 196, y: 264, s: 0.72, v: 1 },
      { x: 382, y: 265, s: 0.74, v: 0 },
      { x: 562, y: 270, s: 0.76, v: 2 },
    ];
    if (isXmas) {
      backTrees.forEach((tr, idx) => drawChristmasTree(ctx, tr.x, tr.y, tr.s, t + idx * 0.5, idx % 2 === 0, false));
      midTrees.forEach((tr, idx) => drawChristmasTree(ctx, tr.x, tr.y, tr.s, t + idx * 0.7, idx % 2 === 1, false));
      drawChristmasTree(ctx, 52, 284, 1.0, t, true, true);
      drawChristmasTree(ctx, 528, 286, 0.96, t + 1.2, false, true);
    } else {
      backTrees.forEach((tr, idx) => drawSeasonTree(ctx, tr.x, tr.y, tr.s, wx, t + idx * 0.6, tr.v));
      midTrees.forEach((tr, idx) => drawSeasonTree(ctx, tr.x, tr.y, tr.s, wx, t + idx * 0.8, tr.v));
      drawSeasonTree(ctx, 52, 274, 0.96, wx, t, 0);
      drawSeasonTree(ctx, 528, 276, 0.94, wx, t + 1.5, 1);
    }

    // 왼쪽 공원 턱걸이 철봉 기구 (x=126, y=348)
    drawPullupBarStation(ctx, 126, 348, wx, t);

    // 오른쪽 공원 원목 의자/벤치 & 가로등 (x=446, y=348)
    drawParkChairStation(ctx, 446, 348, wx, t);

    // 겨울 크리스마스(눈 오는 날 / 추운 날)에는 산타 모자 쓴 눈사람 & 선물상자 추가 (x=290, y=276)
    if (isXmas) {
      drawSnowman(ctx, 290, 276, t);
    }

    // 비·이슬비 오는 날 바닥 물웅덩이 파장(Ripples - 잔잔한 속도)
    if (wx.isRain && ripples) {
      ctx.save();
      ctx.lineWidth = wx.isDrizzle ? 1.4 : 1.7;
      for (const rp of ripples) {
        rp.r += wx.isDrizzle ? 0.22 : 0.28;
        if (rp.r > 22) {
          rp.r = 2;
          rp.x = 95 + Math.random() * 390;
          rp.y = 356 + Math.random() * 52;
        }
        const alpha = Math.max(0, 1 - rp.r / 22) * 0.72;
        ctx.strokeStyle = `rgba(224, 242, 254, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 계절·날씨 하늘 입자 (이슬비 / 비 / 눈 / 꽃잎 / 단풍잎 - 차분한 낙하 속도)
    ctx.save();
    if (wx.isRain) {
      ctx.strokeStyle = wx.isDrizzle ? 'rgba(224, 242, 254, 0.74)' : 'rgba(255, 255, 255, 0.68)';
      ctx.lineWidth = wx.isDrizzle ? 1.45 : 2.1;
      ctx.lineCap = 'round';
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.y = (p.y + p.v * (wx.isDrizzle ? 1.65 : 2.35)) % H;
        p.x = (p.x - (wx.isDrizzle ? 0.45 : 0.72) + W) % W;
        const dropLen = wx.isDrizzle ? 10 : 16;
        const dropDx = wx.isDrizzle ? -2.4 : -4.2;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x + dropDx, p.y + dropLen);
        ctx.stroke();
        // 이슬비는 촘촘하고 잔잔한 안개비 줄기를 한 겹 더 표현!
        if (wx.isDrizzle) {
          const px2 = (p.x + 145) % W;
          const py2 = (p.y + 95) % H;
          ctx.beginPath();
          ctx.moveTo(px2, py2);
          ctx.lineTo(px2 - 2.0, py2 + 8.5);
          ctx.stroke();
        }
      }
    } else if (wx.isSnow) {
      // 눈 오는 크리스마스: 함박눈 + 반짝이는 골드 스파클
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.y = (p.y + p.v * 0.52) % H;
        p.x = (p.x + Math.sin(t * 0.8 + p.y * 0.03) * 0.55 + W) % W;
        ctx.fillStyle = i % 5 === 0 ? 'rgba(254, 240, 138, 0.9)' : 'rgba(255, 255, 255, 0.94)';
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (isXmas) {
      // 추운 날 크리스마스: 잔잔한 눈송이 + 황금빛 크리스마스 반짝이
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.y = (p.y + p.v * 0.28) % H;
        p.x = (p.x + Math.sin(t * 0.7 + i) * 0.4 + W) % W;
        const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 + i);
        ctx.fillStyle = i % 2 === 0
          ? `rgba(254, 240, 138, ${0.85 * pulse})`
          : `rgba(255, 255, 255, ${0.8 * pulse})`;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * (1.3 + pulse * 0.6), 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (wx.season === 'spring') {
      ctx.fillStyle = '#F9A8D4';
      for (const p of bgParticles) {
        p.y = (p.y + p.v * 0.38) % H;
        p.x = (p.x + Math.sin(t * 0.9 + p.y * 0.04) * 0.65 + W) % W;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 0.6 + p.x * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 2.4, p.s * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (wx.season === 'autumn') {
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.y = (p.y + p.v * 0.42) % H;
        p.x = (p.x + Math.sin(t * 0.8 + i) * 0.65 + W) % W;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 0.7 + i);
        ctx.fillStyle = i % 2 === 0 ? '#F59E0B' : '#EF4444';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 2.6, p.s * 1.5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
      for (let i = 0; i < 12; i++) {
        const p = bgParticles[i];
        const pulse = 0.5 + 0.5 * Math.sin(t * 1.4 + i);
        ctx.beginPath();
        ctx.arc(p.x, p.y * 0.55, p.s * (1 + pulse), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  // 도심 속 공원 배경을 위한 서울 시티 스카이라인 (빌딩 숲 + 남산타워/타워 실루엣 + 창문 불빛)
  function drawCitySkyline(ctx, horizonY, wx, isXmas, t) {
    ctx.save();
    const isLit = Boolean(wx.isNight || wx.isRain || isXmas);

    // 1) 원경 스카이라인 빌딩 실루엣
    const farBldColor = wx.isNight
      ? 'rgba(30, 41, 59, 0.72)'
      : wx.isRain
        ? 'rgba(71, 85, 105, 0.48)'
        : isXmas
          ? 'rgba(51, 65, 85, 0.46)'
          : 'rgba(100, 116, 139, 0.28)';
    ctx.fillStyle = farBldColor;
    const farBuildings = [
      { x: 14, w: 34, h: 64 },
      { x: 52, w: 28, h: 82 },
      { x: 86, w: 38, h: 56 },
      { x: 132, w: 30, h: 72 },
      { x: 214, w: 36, h: 68 },
      { x: 256, w: 42, h: 92 },
      { x: 304, w: 32, h: 62 },
      { x: 344, w: 38, h: 86 },
      { x: 388, w: 30, h: 58 },
      { x: 424, w: 36, h: 76 },
      { x: 514, w: 38, h: 70 },
    ];
    farBuildings.forEach((b) => {
      ctx.beginPath();
      ctx.roundRect(b.x, horizonY - b.h, b.w, b.h + 10, [3, 3, 0, 0]);
      ctx.fill();
    });

    // 왼쪽 언덕 위 남산 서울타워 랜드마크 실루엣 (x=184)
    const tx = 184, ty = horizonY - 26;
    ctx.fillStyle = farBldColor;
    ctx.fillRect(tx - 10, ty - 14, 20, 16);
    ctx.fillRect(tx - 2.5, ty - 62, 5, 48);
    ctx.beginPath();
    ctx.roundRect(tx - 9, ty - 72, 18, 11, 4);
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = farBldColor;
    ctx.beginPath();
    ctx.moveTo(tx, ty - 72);
    ctx.lineTo(tx, ty - 94);
    ctx.stroke();
    // 타워 꼭대기 불빛
    const beaconPulse = 0.55 + 0.45 * Math.sin(t * 2.2);
    ctx.fillStyle = `rgba(251, 113, 133, ${beaconPulse})`;
    ctx.beginPath();
    ctx.arc(tx, ty - 95, 2.8, 0, Math.PI * 2);
    ctx.fill();

    // 오른쪽 랜드마크 스카이타워 실루엣 (x=482)
    const ltx = 482;
    ctx.fillStyle = farBldColor;
    ctx.beginPath();
    ctx.moveTo(ltx - 15, horizonY + 6);
    ctx.lineTo(ltx - 6, horizonY - 108);
    ctx.lineTo(ltx + 6, horizonY - 108);
    ctx.lineTo(ltx + 15, horizonY + 6);
    ctx.closePath();
    ctx.fill();

    // 2) 중경 입체 도심 빌딩 + 창문 디테일
    const nearBldColor = wx.isNight
      ? '#1E293B'
      : wx.isRain
        ? '#475569'
        : isXmas
          ? '#334155'
          : '#64748B';
    const nearBuildings = [
      { x: 32, w: 32, h: 54 },
      { x: 104, w: 34, h: 64 },
      { x: 236, w: 38, h: 74 },
      { x: 282, w: 32, h: 52 },
      { x: 356, w: 36, h: 68 },
      { x: 438, w: 34, h: 58 },
      { x: 532, w: 34, h: 60 },
    ];
    nearBuildings.forEach((b, bIdx) => {
      const topY = horizonY - b.h;
      ctx.fillStyle = nearBldColor;
      ctx.globalAlpha = wx.isNight || isXmas ? 0.82 : 0.52;
      ctx.beginPath();
      ctx.roundRect(b.x, topY, b.w, b.h + 10, [3, 3, 0, 0]);
      ctx.fill();

      // 옥상 포인트 라인
      ctx.fillStyle = isLit ? '#94A3B8' : '#E2E8F0';
      ctx.fillRect(b.x + 2, topY, b.w - 4, 2.5);
      ctx.globalAlpha = 1;

      // 빌딩 창문 격자 (밤/비/겨울엔 따뜻한 노란 불빛, 낮엔 유리창 반사광)
      const cols = 3;
      const rows = Math.floor((b.h - 14) / 10);
      const winW = 5, winH = 5.5;
      const startX = b.x + (b.w - (cols * winW + (cols - 1) * 4)) * 0.5;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const isWindowOn = ((bIdx * 7 + r * 3 + c * 5) % 3 !== 0);
          if (isLit) {
            ctx.fillStyle = isWindowOn ? 'rgba(254, 240, 138, 0.78)' : 'rgba(148, 163, 184, 0.22)';
          } else {
            ctx.fillStyle = isWindowOn ? 'rgba(224, 242, 254, 0.62)' : 'rgba(255, 255, 255, 0.28)';
          }
          ctx.fillRect(startX + c * (winW + 4), topY + 7 + r * 10, winW, winH);
        }
      }
    });

    ctx.restore();
  }

  // 겨울(눈 오는 날 · 추운 날) 화려한 크리스마스 트리 + 오너먼트 + 알전구 + 선물상자
  function drawChristmasTree(ctx, x, y, scale, t, isLeft, showGifts = true) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);

    // 바닥 그림자
    ctx.fillStyle = 'rgba(15, 23, 42, 0.18)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 42, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 나무 기둥
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(-9, -28, 18, 30, 4);
    ctx.fill();

    // 3단 전나무 잎 (아래 -> 중간 -> 위) + 가지 끝 하얀 눈
    const tiers = [
      { topY: -86, botY: -22, halfW: 44 },
      { topY: -122, botY: -56, halfW: 36 },
      { topY: -154, botY: -92, halfW: 27 },
    ];
    tiers.forEach((tr) => {
      const grad = ctx.createLinearGradient(0, tr.topY, 0, tr.botY);
      grad.addColorStop(0, '#16A34A');
      grad.addColorStop(1, '#14532D');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(0, tr.topY);
      ctx.lineTo(tr.halfW, tr.botY);
      ctx.quadraticCurveTo(0, tr.botY + 8, -tr.halfW, tr.botY);
      ctx.closePath();
      ctx.fill();

      // 가지 끝 소복한 눈장식
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
      ctx.lineWidth = 3.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-tr.halfW + 3, tr.botY - 1);
      ctx.quadraticCurveTo(0, tr.botY + 7, tr.halfW - 3, tr.botY - 1);
      ctx.stroke();
    });

    // 황금 가랜드 줄 (Tinsel Garland)
    ctx.strokeStyle = 'rgba(253, 224, 71, 0.85)';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(-18, -108);
    ctx.quadraticCurveTo(2, -96, 22, -102);
    ctx.moveTo(-26, -74);
    ctx.quadraticCurveTo(0, -60, 28, -68);
    ctx.moveTo(-34, -40);
    ctx.quadraticCurveTo(4, -26, 36, -34);
    ctx.stroke();

    // 컬러 오너먼트 볼 & 반짝이는 크리스마스 알전구
    const ornaments = [
      { dx: -12, dy: -112, c: '#EF4444' },
      { dx: 11, dy: -102, c: '#FACC15' },
      { dx: -20, dy: -76, c: '#38BDF8' },
      { dx: 4, dy: -82, c: '#EF4444' },
      { dx: 20, dy: -70, c: '#F472B6' },
      { dx: -26, dy: -42, c: '#FACC15' },
      { dx: -4, dy: -46, c: '#EF4444' },
      { dx: 16, dy: -38, c: '#38BDF8' },
      { dx: 28, dy: -44, c: '#4ADE80' },
    ];
    ornaments.forEach((ob, idx) => {
      const glow = 0.5 + 0.5 * Math.sin(t * 2.4 + idx * 1.1);
      ctx.save();
      ctx.fillStyle = ob.c;
      ctx.shadowColor = glow > 0.7 ? '#FEF08A' : ob.c;
      ctx.shadowBlur = glow * 10;
      ctx.beginPath();
      ctx.arc(ob.dx, ob.dy, 4.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });

    // 트리 꼭대기 황금 별 (Christmas Star)
    const starPulse = 1 + Math.sin(t * 2.0) * 0.06;
    ctx.save();
    ctx.translate(0, -158);
    ctx.scale(starPulse, starPulse);
    ctx.fillStyle = '#FACC15';
    ctx.strokeStyle = '#FEF08A';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 16;
    ctx.beginPath();
    for (let i = 0; i < 5; i++) {
      const outerA = -Math.PI / 2 + (i * Math.PI * 2) / 5;
      const innerA = outerA + Math.PI / 5;
      const ox = Math.cos(outerA) * 12;
      const oy = Math.sin(outerA) * 12;
      const ix = Math.cos(innerA) * 5.2;
      const iy = Math.sin(innerA) * 5.2;
      if (i === 0) ctx.moveTo(ox, oy);
      else ctx.lineTo(ox, oy);
      ctx.lineTo(ix, iy);
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 전경 메인 트리 아래 크리스마스 선물상자 2개
    if (showGifts) {
      const giftDir = isLeft ? 1 : -1;
      drawGiftBox(ctx, giftDir * 16, -2, 18, 15, '#EF4444', '#FACC15');
      drawGiftBox(ctx, giftDir * 31, 0, 14, 12, '#16A34A', '#FCA5A5');
    }

    ctx.restore();
  }

  function drawGiftBox(ctx, x, y, w, h, boxColor, ribbonColor) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = boxColor;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(-w / 2, -h, w, h, 2.5);
    ctx.fill();
    ctx.stroke();

    // 십자 리본
    ctx.fillStyle = ribbonColor;
    ctx.fillRect(-2, -h, 4, h);
    ctx.fillRect(-w / 2, -h * 0.58, w, 3.2);

    // 상단 리본 매듭
    ctx.beginPath();
    ctx.ellipse(-3.5, -h - 2, 4, 2.2, -0.3, 0, Math.PI * 2);
    ctx.ellipse(3.5, -h - 2, 4, 2.2, 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawChristmasWreath(ctx, x, y, r) {
    ctx.save();
    ctx.translate(x, y);
    ctx.strokeStyle = '#15803D';
    ctx.lineWidth = r * 0.55;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.stroke();

    // 빨간 열매 장식
    ctx.fillStyle = '#EF4444';
    [0, 1.6, 3.1, 4.7].forEach((a) => {
      ctx.beginPath();
      ctx.arc(Math.cos(a) * r, Math.sin(a) * r, 2.2, 0, Math.PI * 2);
      ctx.fill();
    });

    // 상단 빨간 리본
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(-4, -r + 1, 4.5, 2.6, -0.35, 0, Math.PI * 2);
    ctx.ellipse(4, -r + 1, 4.5, 2.6, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawSeasonTree(ctx, x, y, scale, wx, t, variant = 0) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const sway = Math.sin(t * 0.75) * 0.015;
    ctx.rotate(sway);

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(-8, -58, 16, 62, 5);
    ctx.fill();

    let c1 = '#22C55E', c2 = '#16A34A';
    if (wx.season === 'spring') {
      if (variant === 2) {
        c1 = '#86EFAC';
        c2 = '#22C55E';
      } else {
        c1 = '#FBCFE8';
        c2 = '#F472B6';
      }
    } else if (wx.season === 'autumn') {
      if (variant === 2) {
        c1 = '#4ADE80';
        c2 = '#15803D';
      } else if (variant === 1 || x < 240) {
        c1 = '#FBBF24';
        c2 = '#D97706';
      } else {
        c1 = '#F87171';
        c2 = '#DC2626';
      }
    } else {
      if (variant === 1) {
        c1 = '#34D399';
        c2 = '#059669';
      } else if (variant === 2) {
        c1 = '#4ADE80';
        c2 = '#15803D';
      }
    }

    const puffs = [
      { dx: 0, dy: -92, r: 32 },
      { dx: -24, dy: -72, r: 26 },
      { dx: 24, dy: -72, r: 26 },
      { dx: -14, dy: -56, r: 24 },
      { dx: 14, dy: -56, r: 24 },
    ];
    puffs.forEach((pf) => {
      const g = ctx.createRadialGradient(pf.dx - 6, pf.dy - 6, 3, pf.dx, pf.dy, pf.r);
      g.addColorStop(0, c1);
      g.addColorStop(1, c2);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(pf.dx, pf.dy, pf.r, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  // 왼쪽 턱걸이 운동기구 (철봉: 성인용 높은 바 + 미니 머털이용 낮은 바)
  function drawPullupBarStation(ctx, x, y, wx, t = 0) {
    const isXmas = Boolean(!wx.isRain && (wx.isChristmas || wx.isSnow));
    ctx.save();
    ctx.translate(x, y);

    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(-6, 2, 58, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 미니 머털이용 왼쪽 보조 낮은 철봉 (x: -68 ~ -36, 높이 -138)
    ctx.strokeStyle = '#64748B';
    ctx.lineWidth = 4.5;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-68, 0);
    ctx.lineTo(-68, -138);
    ctx.lineTo(-36, -138);
    ctx.stroke();

    // 성인용 메인 턱걸이 철봉 기둥 2개 (x: -36, +36, 높이 -238)
    ctx.strokeStyle = '#1E293B';
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(-36, 2);
    ctx.lineTo(-36, -238);
    ctx.moveTo(36, 2);
    ctx.lineTo(36, -238);
    ctx.stroke();

    // 상단 수평 철봉 바 (은빛 크롬, 높이 -232)
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(-40, -232);
    ctx.lineTo(40, -232);
    ctx.stroke();

    // 기둥 하단 노란 안전 캡
    ctx.fillStyle = '#F59E0B';
    ctx.fillRect(-41, -6, 10, 8);
    ctx.fillRect(31, -6, 10, 8);
    ctx.fillRect(-72, -5, 8, 7);

    if (isXmas) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-38, -237, 76, 3);
      // 철봉 기둥에 크리스마스 리스 장식 & 알전구
      drawChristmasWreath(ctx, 36, -195, 10);
      const bulbColors = ['#EF4444', '#FACC15', '#4ADE80', '#38BDF8', '#F472B6'];
      for (let i = 0; i < 5; i++) {
        const bx = -30 + i * 15;
        const pulse = 0.5 + 0.5 * Math.sin(t * 4.5 + i);
        ctx.save();
        ctx.fillStyle = bulbColors[i];
        ctx.shadowColor = bulbColors[i];
        ctx.shadowBlur = 6 * pulse;
        ctx.beginPath();
        ctx.arc(bx, -236, 2.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // 오른쪽 공원 원목 의자/벤치 & 가로등
  function drawParkChairStation(ctx, x, y, wx, t = 0) {
    const isXmas = Boolean(!wx.isRain && (wx.isChristmas || wx.isSnow));
    ctx.save();
    ctx.translate(x, y);

    // 가로등 기둥
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.lineTo(58, -135);
    ctx.stroke();

    ctx.fillStyle = (wx.isNight || wx.isRain || isXmas) ? '#FDE047' : '#FEF9C3';
    if (wx.isNight || wx.isRain || isXmas) {
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = 18;
    }
    ctx.beginPath();
    ctx.arc(58, -140, 9.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 크리스마스 시즌 가로등 리스 장식
    if (isXmas) {
      drawChristmasWreath(ctx, 58, -112, 10);
    }

    // 벤치 그림자
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 58, 9, 0, 0, Math.PI * 2);
    ctx.fill();

    // 벤치 다리 & 팔걸이
    ctx.fillStyle = '#1E293B';
    ctx.fillRect(-46, -16, 6, 18);
    ctx.fillRect(40, -16, 6, 18);
    ctx.fillRect(-50, -34, 6, 22);
    ctx.fillRect(44, -34, 6, 22);

    // 원목 등받이 판자 2줄
    ctx.fillStyle = '#B45309';
    ctx.beginPath();
    ctx.roundRect(-48, -46, 96, 10, 3);
    ctx.roundRect(-48, -33, 96, 10, 3);
    ctx.fill();

    // 원목 좌판
    ctx.fillStyle = '#D97706';
    ctx.beginPath();
    ctx.roundRect(-50, -21, 100, 9, 3);
    ctx.fill();

    if (isXmas) {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-48, -48, 96, 3.5);
    }
    ctx.restore();
  }

  // 게임 완료 캐릭터 머리 위에 자정(00:00)까지 씌우는 3D 황금 왕관 (Royal Golden Crown)
  function drawGoldenCrown(ctx, x, y, scale, t) {
    ctx.save();
    ctx.translate(x, y);
    const pulse = 1 + Math.sin(t * 3.8) * 0.035;
    ctx.scale(scale * pulse, scale * pulse);

    // 왕관 후광
    ctx.shadowColor = 'rgba(250, 204, 21, 0.75)';
    ctx.shadowBlur = 12;

    // 1) 안쪽 붉은 벨벳 쿠션 캡
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.ellipse(0, -10, 20, 11, 0, Math.PI, 0);
    ctx.fill();

    // 2) 5봉우리 3D 황금 왕관 본체
    const cGrad = ctx.createLinearGradient(-24, -28, 24, 0);
    cGrad.addColorStop(0, '#FEF08A');
    cGrad.addColorStop(0.45, '#FACC15');
    cGrad.addColorStop(0.85, '#EAB308');
    cGrad.addColorStop(1, '#B45309');

    ctx.fillStyle = cGrad;
    ctx.strokeStyle = '#92400E';
    ctx.lineWidth = 1.6;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-20, -2);
    ctx.lineTo(-24, -20);
    ctx.lineTo(-13, -10);
    ctx.lineTo(-11, -24);
    ctx.lineTo(-4, -12);
    ctx.lineTo(0, -28);
    ctx.lineTo(4, -12);
    ctx.lineTo(11, -24);
    ctx.lineTo(13, -10);
    ctx.lineTo(24, -20);
    ctx.lineTo(20, -2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 3) 왕관 하단 황금 밴드 테두리
    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(-21, -6, 42, 6.5, 3);
    ctx.fill();
    ctx.stroke();

    ctx.shadowBlur = 0;

    // 4) 왕관 밴드 보석 3개 (중앙 루비, 좌 사파이어, 우 에메랄드)
    const jewels = [
      { jx: -11, jy: -2.8, r: 2.3, c: '#3B82F6' },
      { jx: 0, jy: -2.8, r: 3.0, c: '#EF4444' },
      { jx: 11, jy: -2.8, r: 2.3, c: '#10B981' },
    ];
    jewels.forEach((jw) => {
      ctx.fillStyle = jw.c;
      ctx.strokeStyle = '#FEF08A';
      ctx.lineWidth = 0.9;
      ctx.beginPath();
      ctx.arc(jw.jx, jw.jy, jw.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 5) 5개 왕관 꼭짓점 진주/황금 구슬
    const tips = [
      { tx: -24, ty: -21, r: 2.6 },
      { tx: -11, ty: -25, r: 2.6 },
      { tx: 0, ty: -29.5, r: 3.4 },
      { tx: 11, ty: -25, r: 2.6 },
      { tx: 24, ty: -21, r: 2.6 },
    ];
    tips.forEach((tp) => {
      ctx.fillStyle = '#FEF9C3';
      ctx.strokeStyle = '#B45309';
      ctx.lineWidth = 1.1;
      ctx.beginPath();
      ctx.arc(tp.tx, tp.ty, tp.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 6) 왕관 주변 반짝이는 황금 스파클
    const spAlpha = 0.55 + 0.45 * Math.sin(t * 5.2);
    ctx.fillStyle = `rgba(254, 240, 138, ${spAlpha})`;
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('✨', -29, -18 - Math.sin(t * 4) * 2);
    ctx.fillText('✨', 29, -22 + Math.cos(t * 4) * 2);

    ctx.restore();
  }

  // 이불 덮고 잠드는 침구(매트 + 베개 + 포근한 퀼팅 이불 + Zzz) 렌더링
  function drawSleepingBedAndBlanket(ctx, charId, img, targetW, targetH, t, isMini, hasCrown = false) {
    const breath = 1 + Math.sin(t * 2.5) * 0.028;
    const lieScale = isMini ? 0.78 : 0.66;
    const charLen = targetH * lieScale;
    const matW = charLen * 1.06;
    const matH = isMini ? 28 : 42;

    // 1) 폭신한 매트리스 패드
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
    ctx.beginPath();
    ctx.ellipse(0, 2, matW * 0.56, matH * 0.54, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#FEF3C7';
    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(-matW * 0.52, -matH * 0.78, matW * 1.04, matH, 12);
    ctx.fill();
    ctx.stroke();

    // 2) 왼쪽 하얀 솜베개
    const pillowX = -matW * 0.34;
    const pillowY = -matH * 0.32;
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(pillowX - (isMini ? 16 : 24), pillowY - (isMini ? 12 : 17), isMini ? 32 : 48, isMini ? 24 : 34, 8);
    ctx.fill();
    ctx.stroke();

    // 3) 왼쪽 베개에 머리가 오고 오른쪽 이불 아래에 몸통·다리가 들어가도록 눕힘!
    ctx.save();
    ctx.translate(charLen * 0.46, -matH * 0.24);
    ctx.rotate(-Math.PI * 0.48);
    ctx.scale(lieScale, lieScale * breath);
    ctx.drawImage(img, -targetW / 2, -targetH + 6, targetW, targetH);
    if (hasCrown) {
      drawGoldenCrown(ctx, 0, -targetH + 14, 0.96, t);
    }
    ctx.restore();

    // 4) 몸통과 다리 위에 덮인 포근한 3D 퀼팅 이불 (목 아래부터 발끝까지 완전히 덮음!)
    const blanketX = -charLen * 0.06;
    const blanketW = charLen * 0.58;
    const blanketH = (isMini ? 32 : 46) * breath;
    const blanketY = -matH * 0.28 - blanketH * 0.52;

    const bGrad = ctx.createLinearGradient(blanketX, blanketY, blanketX, blanketY + blanketH);
    if (charId === '610708') {
      bGrad.addColorStop(0, '#60A5FA');
      bGrad.addColorStop(1, '#2563EB');
    } else if (charId === '691105') {
      bGrad.addColorStop(0, '#FDA4AF');
      bGrad.addColorStop(1, '#E11D48');
    } else if (charId === 'mutul') {
      bGrad.addColorStop(0, '#FBBF24');
      bGrad.addColorStop(1, '#D97706');
    } else {
      bGrad.addColorStop(0, '#6EE7B7');
      bGrad.addColorStop(1, '#059669');
    }

    ctx.fillStyle = bGrad;
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.roundRect(blanketX, blanketY, blanketW, blanketH, 11);
    ctx.fill();
    ctx.stroke();

    // 이불 목 부분 하얀 접힘 깃
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(blanketX, blanketY, isMini ? 10 : 14, blanketH, [10, 3, 3, 10]);
    ctx.fill();

    // 이불 퀼팅 스티치
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.44)';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(blanketX + (isMini ? 14 : 20), blanketY + blanketH * 0.5);
    ctx.lineTo(blanketX + blanketW - 6, blanketY + blanketH * 0.5);
    ctx.moveTo(blanketX + blanketW * 0.55, blanketY + 4);
    ctx.lineTo(blanketX + blanketW * 0.55, blanketY + blanketH - 4);
    ctx.stroke();

    // 5) 쿨쿨 잠드는 Zzz 애니메이션 방울 (천천히 평화롭게 떠오름)
    const zPhase = (t * 0.55) % 1;
    ctx.font = `bold ${isMini ? 13 : 16}px sans-serif`;
    ctx.fillStyle = '#1E293B';
    ctx.fillText('💤', pillowX - 8, pillowY - 22 - zPhase * 12);
    ctx.font = `bold ${isMini ? 10 : 12}px sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Zzz', pillowX + 12, pillowY - 30 - ((zPhase + 0.4) % 1) * 12);
    ctx.restore();
  }

  // ==========================================================
  // 턱걸이(pullup) 및 게임중(gaming) 전용: PNG 원본의 아래쪽 팔이 중복 출력(팔 4개 현상)되지 않도록
  // 3D Mii 헤드만 크롭하고 몸통·바지·신발을 깔끔한 3D 도형으로 렌더링하여 팔이 정확히 2개만 보이게 하는 헬퍼!
  // ==========================================================
  function drawMiiHeadAndArmlessBody(ctx, charId, fallbackImg, pH, outfit, hasCrown, t, isMini = false) {
    const isFather = charId === '610708';
    const isMutul = charId === 'mutul';
    // 610708_short_front에는 왼손 검지 포즈가 턱 근처에 있으므로 헤드 크롭 시에는 손이 아래에 있는 pad/coat 스프라이트 우선 사용!
    const headImg = isFather
      ? (loadedSprites['610708_pad_front'] || loadedSprites['610708_coat_front'] || fallbackImg)
      : isMutul
        ? (loadedSprites['mutul_front'] || fallbackImg)
        : (loadedSprites['691105_coat_front'] || loadedSprites['691105_pad_front'] || fallbackImg);

    const headRatio = isMutul ? 0.565 : (isFather ? 0.472 : 0.482);
    const footY = isMini ? 4 : 6;
    const topY = footY - pH;
    const neckY = topY + pH * headRatio;
    const bodyH = footY - neckY;
    const hipY = neckY + bodyH * 0.52;
    const u = pH / 200;

    ctx.save();
    // 1) 다리(바지/반바지) & 신발
    const legX = 8.5 * u;
    const legW = 12 * u;
    const legTopY = hipY - 2 * u;
    const shoeY = footY - 4.5 * u;

    [-legX, legX].forEach((lx) => {
      if (isFather && outfit === 'short') {
        // 카키 반바지 + 종아리
        ctx.fillStyle = '#C2B280';
        ctx.beginPath();
        ctx.roundRect(lx - legW / 2, legTopY, legW, bodyH * 0.24, 3 * u);
        ctx.fill();
        ctx.fillStyle = '#FDBA8C';
        ctx.beginPath();
        ctx.roundRect(lx - legW * 0.42, legTopY + bodyH * 0.2, legW * 0.84, shoeY - (legTopY + bodyH * 0.2), 2.5 * u);
        ctx.fill();
      } else {
        // 긴바지 (아버지/머털이: 네이비 차콜, 어머니: 데님 청바지)
        ctx.fillStyle = (!isFather && !isMutul) ? '#3B6E9C' : '#1E293B';
        ctx.beginPath();
        ctx.roundRect(lx - legW / 2, legTopY, legW, shoeY - legTopY + 2 * u, 3.5 * u);
        ctx.fill();
      }
      // 신발
      ctx.fillStyle = (!isFather && !isMutul) ? '#64748B' : '#334155';
      ctx.strokeStyle = '#F8FAFC';
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.ellipse(lx, shoeY, 6.8 * u, 4.2 * u, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    });

    // 2) 팔 없는 깔끔한 3D 몸통 (복장별 렌더링)
    const torsoTopY = neckY - 3 * u;
    const torsoBotY = (outfit === 'coat' && !isMutul) ? (hipY + bodyH * 0.16) : (hipY + 3 * u);
    const torsoH = torsoBotY - torsoTopY;
    const torsoW = (outfit === 'coat' || outfit === 'pad') && !isMutul ? 40 * u : 35 * u;

    if (isMutul) {
      // 미니 머털도사 전통 조끼/도포 몸통 + 주황색 동정 깃
      ctx.fillStyle = '#334155';
      ctx.beginPath();
      ctx.roundRect(-torsoW / 2, torsoTopY, torsoW, torsoH, [8 * u, 8 * u, 4 * u, 4 * u]);
      ctx.fill();
      ctx.strokeStyle = '#F97316';
      ctx.lineWidth = 5 * u;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-8 * u, torsoTopY + 3 * u);
      ctx.lineTo(5 * u, torsoTopY + torsoH * 0.55);
      ctx.moveTo(8 * u, torsoTopY + 3 * u);
      ctx.lineTo(-9 * u, torsoTopY + torsoH * 0.72);
      ctx.stroke();
    } else if (outfit === 'coat') {
      // 겨울 코트 + 따뜻한 목도리
      const cGrad = ctx.createLinearGradient(0, torsoTopY, 0, torsoBotY);
      cGrad.addColorStop(0, isFather ? '#B47B48' : '#F3E8D6');
      cGrad.addColorStop(1, isFather ? '#8C5A2B' : '#D6C4B0');
      ctx.fillStyle = cGrad;
      ctx.beginPath();
      ctx.roundRect(-torsoW / 2, torsoTopY, torsoW, torsoH, [9 * u, 9 * u, 4 * u, 4 * u]);
      ctx.fill();
      // 코트 단추
      ctx.fillStyle = '#451A03';
      ctx.beginPath();
      ctx.arc(0, torsoTopY + torsoH * 0.52, 2.2 * u, 0, Math.PI * 2);
      ctx.arc(0, torsoTopY + torsoH * 0.72, 2.2 * u, 0, Math.PI * 2);
      ctx.fill();
      // 목도리
      ctx.fillStyle = isFather ? '#DC2626' : '#F87171';
      ctx.beginPath();
      ctx.roundRect(-torsoW * 0.48, torsoTopY + 1 * u, torsoW * 0.96, 10 * u, 5 * u);
      ctx.roundRect(1 * u, torsoTopY + 7 * u, 9 * u, 16 * u, 3 * u);
      ctx.fill();
    } else if (outfit === 'pad') {
      // 겨울 패딩 점퍼 (퀼팅 스티치)
      const pGrad = ctx.createLinearGradient(0, torsoTopY, 0, torsoBotY);
      if (isFather) {
        pGrad.addColorStop(0, '#1E3A5F');
        pGrad.addColorStop(1, '#0F2342');
      } else {
        pGrad.addColorStop(0, '#F4B8C4');
        pGrad.addColorStop(0.42, '#F4B8C4');
        pGrad.addColorStop(0.43, '#F5EFE6');
        pGrad.addColorStop(1, '#E5DCCB');
      }
      ctx.fillStyle = pGrad;
      ctx.beginPath();
      ctx.roundRect(-torsoW / 2, torsoTopY, torsoW, torsoH, [10 * u, 10 * u, 5 * u, 5 * u]);
      ctx.fill();
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.25)';
      ctx.lineWidth = 1.2 * u;
      ctx.beginPath();
      ctx.moveTo(-torsoW * 0.46, torsoTopY + torsoH * 0.36);
      ctx.lineTo(torsoW * 0.46, torsoTopY + torsoH * 0.36);
      ctx.moveTo(-torsoW * 0.46, torsoTopY + torsoH * 0.68);
      ctx.lineTo(torsoW * 0.46, torsoTopY + torsoH * 0.68);
      ctx.moveTo(0, torsoTopY + 2 * u);
      ctx.lineTo(0, torsoBotY);
      ctx.stroke();
    } else {
      // 반팔 티셔츠 (아버지: 차콜 블랙 + X 로고, 어머니: 스트라이프 + 꽃 브로치)
      if (isFather) {
        ctx.fillStyle = '#1E293B';
        ctx.beginPath();
        ctx.roundRect(-torsoW / 2, torsoTopY, torsoW, torsoH, [8 * u, 8 * u, 3 * u, 3 * u]);
        ctx.fill();
        ctx.strokeStyle = '#F8FAFC';
        ctx.lineWidth = 2.2 * u;
        ctx.beginPath();
        ctx.moveTo(-7 * u, torsoTopY + 10 * u);
        ctx.lineTo(7 * u, torsoTopY + 24 * u);
        ctx.moveTo(7 * u, torsoTopY + 10 * u);
        ctx.lineTo(-7 * u, torsoTopY + 24 * u);
        ctx.stroke();
      } else {
        ctx.fillStyle = '#F8FAFC';
        ctx.beginPath();
        ctx.roundRect(-torsoW / 2, torsoTopY, torsoW, torsoH, [8 * u, 8 * u, 3 * u, 3 * u]);
        ctx.fill();
        ctx.fillStyle = '#1E293B';
        for (let sy = torsoTopY + 6 * u; sy < torsoBotY - 3 * u; sy += 6.5 * u) {
          ctx.fillRect(-torsoW * 0.46, sy, torsoW * 0.92, 2.6 * u);
        }
        // 빨간 꽃 장식
        ctx.fillStyle = '#EF4444';
        ctx.beginPath();
        ctx.arc(6 * u, torsoTopY + 15 * u, 4.2 * u, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(6 * u, torsoTopY + 15 * u, 1.8 * u, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 3) 3D Mii 헤드 크롭 렌더링 (턱 위쪽 영역만 크롭하여 원본 팔이 절대 찍히지 않음!)
    if (headImg && headImg.complete && headImg.naturalWidth) {
      const fullDrawW = (headImg.naturalWidth / headImg.naturalHeight) * pH;
      const srcH = Math.round(headImg.naturalHeight * headRatio);
      const dstH = pH * headRatio;
      ctx.shadowColor = 'rgba(15, 23, 42, 0.22)';
      ctx.shadowBlur = 10;
      ctx.drawImage(
        headImg,
        0, 0, headImg.naturalWidth, srcH,
        -fullDrawW / 2, topY, fullDrawW, dstH
      );
      ctx.shadowBlur = 0;
    }

    // 4) 오늘 게임 완료 시 머리 위 황금 왕관!
    if (hasCrown) {
      drawGoldenCrown(ctx, 0, topY + (isFather ? 13 : 15) * u, isMini ? 0.75 : 0.92, t);
    }

    ctx.restore();
    return { u, topY, neckY, shoulderY: neckY + 8 * u, hipY };
  }

  // 서로 게임 중일 때 캐릭터가 휴대용 3D 두뇌게임기를 들고 집중해서 플레이하는 모션 (팔 2개만 렌더링!)
  function drawGamingMotion(ctx, charId, cx, groundY, jumpY, depthScale, img, targetW, targetH, t, outfit, hasCrown, gameLabel) {
    const isFather = charId === '610708';
    const gameBobY = Math.sin(t * 2.6 + (isFather ? 0 : 1.4)) * 1.6;
    const gameTilt = Math.sin(t * 1.8 + (isFather ? 0 : 1.1)) * 0.018;

    // 바닥 그림자
    ctx.save();
    const pedGrad = ctx.createRadialGradient(cx, groundY - 4, 4, cx, groundY - 4, 46 * depthScale);
    pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    pedGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
    pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 4, 44 * depthScale, 10 * depthScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, groundY + jumpY + gameBobY);
    ctx.rotate(gameTilt);

    // 1) 팔 없는 3D 몸통 + 3D Mii 헤드 + 왕관 렌더링
    const { u, shoulderY } = drawMiiHeadAndArmlessBody(ctx, charId, img, targetH, outfit, hasCrown, t, false);

    // 2) 가슴 앞에서 양손으로 잡고 있는 3D 휴대용 두뇌게임기 (Handheld Brain Console)
    const consoleY = -targetH * 0.36 + Math.sin(t * 4.5) * 0.9;

    // 게임기 화면에서 얼굴로 퍼지는 네온 빛무리
    const screenGlow = ctx.createRadialGradient(0, consoleY - 6, 4, 0, consoleY - 18, 48);
    screenGlow.addColorStop(0, 'rgba(56, 189, 248, 0.52)');
    screenGlow.addColorStop(0.6, 'rgba(250, 204, 21, 0.24)');
    screenGlow.addColorStop(1, 'rgba(56, 189, 248, 0)');
    ctx.fillStyle = screenGlow;
    ctx.beginPath();
    ctx.arc(0, consoleY - 12, 48, 0, Math.PI * 2);
    ctx.fill();

    // 어깨에서 게임기 양옆으로 모인 딱 2개의 팔!
    const sleeveColor = outfit === 'coat'
      ? (isFather ? '#B47B48' : '#E5D5C5')
      : outfit === 'pad'
        ? (isFather ? '#1E3A5F' : '#F4B8C4')
        : '#FDBA8C';
    ctx.strokeStyle = sleeveColor;
    ctx.lineWidth = 10 * u;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(-17 * u, shoulderY);
    ctx.quadraticCurveTo(-30 * u, (shoulderY + consoleY) * 0.52, -25, consoleY + 3);
    ctx.moveTo(17 * u, shoulderY);
    ctx.quadraticCurveTo(30 * u, (shoulderY + consoleY) * 0.52, 25, consoleY + 3);
    ctx.stroke();

    if (outfit === 'short') {
      // 반팔 소매 캡
      ctx.strokeStyle = isFather ? '#1E293B' : '#F8FAFC';
      ctx.lineWidth = 11.5 * u;
      ctx.beginPath();
      ctx.moveTo(-17 * u, shoulderY);
      ctx.lineTo(-23 * u, shoulderY + 10 * u);
      ctx.moveTo(17 * u, shoulderY);
      ctx.lineTo(23 * u, shoulderY + 10 * u);
      ctx.stroke();
    }

    // 3D 휴대용 콘솔 본체 (네이비 바디 + 왼쪽 블루 조이콘 + 오른쪽 레드 조이콘)
    ctx.save();
    ctx.translate(0, consoleY);

    // 왼쪽 블루 그립
    ctx.fillStyle = '#0284C7';
    ctx.beginPath();
    ctx.roundRect(-31, -15, 13, 30, [8, 2, 2, 8]);
    ctx.fill();

    // 오른쪽 코랄레드 그립
    ctx.fillStyle = '#E11D48';
    ctx.beginPath();
    ctx.roundRect(18, -15, 13, 30, [2, 8, 8, 2]);
    ctx.fill();

    // 중앙 콘솔 바디 & 빛나는 액정
    ctx.fillStyle = '#0F172A';
    ctx.strokeStyle = '#E2E8F0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(-20, -15, 40, 30, 4);
    ctx.fill();
    ctx.stroke();

    const lcdGrad = ctx.createLinearGradient(-16, -11, 16, 11);
    lcdGrad.addColorStop(0, '#38BDF8');
    lcdGrad.addColorStop(0.5, '#818CF8');
    lcdGrad.addColorStop(1, '#FACC15');
    ctx.fillStyle = lcdGrad;
    ctx.beginPath();
    ctx.roundRect(-16, -11, 32, 22, 2.5);
    ctx.fill();

    // 십자키 & 컬러 버튼
    ctx.fillStyle = '#F8FAFC';
    ctx.fillRect(-26, -3, 5, 2);
    ctx.fillRect(-24.5, -4.5, 2, 5);
    ctx.fillStyle = '#FACC15';
    ctx.beginPath();
    ctx.arc(24, -4, 1.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#4ADE80';
    ctx.beginPath();
    ctx.arc(26, 0, 1.8, 0, Math.PI * 2);
    ctx.fill();

    // 차분하게 버튼을 누르는 두 손 (엄지손가락 상하 탭 모션)
    const leftTap = Math.sin(t * 5.8) * 1.6;
    const rightTap = Math.cos(t * 5.8) * 1.6;
    ctx.fillStyle = '#FDBA8C';
    ctx.strokeStyle = '#9A3412';
    ctx.lineWidth = 1.3;
    ctx.beginPath();
    ctx.arc(-26, 4 + leftTap, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(26, 4 + rightTap, 5.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4) 게임기 주변으로 부드럽게 떠오르는 두뇌게임 이펙트 아이콘 (🎮, 🧠, ⚡)
    const icons = ['🎮', '🧠', '⚡'];
    icons.forEach((ic, idx) => {
      const cycle = (t * 0.55 + idx * 0.33) % 1;
      const ix = (idx - 1) * 28 + Math.sin(t * 1.8 + idx) * 4;
      const iy = consoleY - 14 - cycle * 34;
      ctx.save();
      ctx.globalAlpha = Math.max(0, 1 - cycle * 0.9);
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(ic, ix, iy);
      ctx.restore();
    });

    // 5) 게임기 바로 아래 '🎮 두뇌운동 중!' 상태 배지 (왕관 및 상단 말풍선과 절대 겹치지 않도록 배치)
    const badgeY = consoleY + 34;
    const badgeText = `🎮 ${gameLabel || '두뇌게임'} 중!`;
    ctx.save();
    ctx.font = 'bold 11.5px sans-serif';
    const tw = Math.max(92, ctx.measureText(badgeText).width + 18);
    ctx.fillStyle = 'rgba(15, 23, 42, 0.9)';
    ctx.strokeStyle = '#38BDF8';
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.roundRect(-tw / 2, badgeY - 16, tw, 20, 10);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#FEF08A';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, 0, badgeY - 2);
    ctx.restore();

    ctx.restore();
  }

  // 산타 모자와 목도리를 두른 크리스마스 눈사람 + 캔디케인 + 선물상자
  function drawSnowman(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);

    // 그림자
    ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
    ctx.beginPath();
    ctx.ellipse(0, 2, 22, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 눈사람 몸통 & 머리
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, -14, 16, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -35, 11.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    // 눈 & 당근 코 & 단추
    ctx.fillStyle = '#1E293B';
    ctx.beginPath();
    ctx.arc(-4, -37, 1.5, 0, Math.PI * 2);
    ctx.arc(4, -37, 1.5, 0, Math.PI * 2);
    ctx.arc(0, -17, 1.6, 0, Math.PI * 2);
    ctx.arc(0, -10, 1.6, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(0, -35);
    ctx.lineTo(8, -33);
    ctx.lineTo(0, -31.5);
    ctx.fill();

    // 빨강·초록 크리스마스 목도리
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.roundRect(-10, -26, 20, 5.5, 2.5);
    ctx.fill();
    ctx.fillStyle = '#16A34A';
    ctx.fillRect(-5, -26, 3.5, 5.5);
    ctx.fillRect(2, -26, 3.5, 5.5);
    ctx.fillStyle = '#DC2626';
    ctx.fillRect(4, -23, 4.5, 10);

    // 귀여운 빨간 산타 모자 (Santa Hat)
    ctx.fillStyle = '#DC2626';
    ctx.beginPath();
    ctx.moveTo(-11, -43);
    ctx.quadraticCurveTo(2, -60, 14, -48);
    ctx.lineTo(10, -43);
    ctx.closePath();
    ctx.fill();

    // 산타 모자 흰색 털 테두리 & 방울
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.roundRect(-12, -45, 24, 5, 2.5);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(14, -48, 4, 0, Math.PI * 2);
    ctx.fill();

    // 옆에 놓인 크리스마스 미니 선물상자
    drawGiftBox(ctx, -22, 0, 13, 11, '#EF4444', '#FDE047');

    ctx.restore();
  }

  // ==========================================================
  // 정면(Front) · 좌측면(Left) · 우측면(Right) + 무작위 행동 + 게임중 모션(gaming) + 완료 왕관(자정까지) 렌더링
  // ==========================================================
  function drawMii3DCharacter(ctx, charId, ch, t, wx) {
    const isFather = charId === '610708';
    const yaw = ch.yaw;
    const isWalking = ch.speed > 0.12;
    const isAtTarget = Math.hypot(ch.targetX - ch.x, ch.targetZ - ch.z) <= 8;
    const isGaming = Boolean(playerState[charId] && playerState[charId].playing) || ch.activity === 'gaming';
    const hasCrown = hasCrownNow(charId);
    const act = isGaming ? 'gaming' : (isAtTarget ? (ch.activity || 'walk') : 'walk');

    const isSideView = act === 'walk' && (Math.abs(yaw) > 0.25 || isWalking);
    const facingLeft = yaw < -0.15;

    const outfit = wx.outfit || 'short';
    const viewKey = isSideView ? 'side' : 'front';
    const spriteKey = `${charId}_${outfit}_${viewKey}`;
    const fallbackKey = `${charId}_short_${viewKey}`;
    const img = loadedSprites[spriteKey] || loadedSprites[fallbackKey];
    if (!img || !img.complete || !img.naturalWidth) return;

    const jumpY = ch.y || 0;
    const depthScale = 1 + (ch.z || 0) * 0.003;
    const groundY = 352 + (ch.z || 0) * 0.65;
    const cx = ch.x;

    const targetH = (isFather ? 226 : 216) * depthScale;
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;

    // [행동 0] 게임중인 모션 (gaming)
    if (act === 'gaming') {
      const gameLabel = (playerState[charId] && playerState[charId].gameLabel) || '두뇌운동';
      drawGamingMotion(ctx, charId, cx, groundY, jumpY, depthScale, img, targetW, targetH, t, outfit, hasCrown, gameLabel);
      return;
    }

    // [행동 A] 이불 덮고 잠들기 (sleep)
    if (act === 'sleep') {
      ctx.save();
      ctx.translate(cx, groundY + jumpY);
      drawSleepingBedAndBlanket(ctx, charId, img, targetW, targetH, t, false, hasCrown);
      ctx.restore();
      return;
    }

    // [행동 B] 철봉 턱걸이 운동하기 (pullup - 팔 2개만 렌더링, 여유 있는 템포!)
    if (act === 'pullup') {
      const pullCycle = t * 1.45 + (isFather ? 0 : 1.2);
      const pullPhase = (Math.sin(pullCycle) + 1) * 0.5; // 0(매달림) ~ 1(턱걸이 정점)
      const pullScale = 0.85;
      const pH = targetH * pullScale;
      const pullLiftY = -12 - pullPhase * 34;
      const barLocalY = -232 - (groundY - 348); // 머리 위 철봉 가로바 높이
      const u = pH / 200;
      const headRatio = isFather ? 0.472 : 0.482;
      const shoulderY = pullLiftY + 6 - pH * (1 - headRatio) + 8 * u;

      // 바닥 그림자
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 2, 34 * (1 - pullPhase * 0.25), 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, groundY + jumpY);

      // 1) 어깨에서 머리 위 철봉 바깥쪽(±26)으로 뻗어 매달린 딱 2개의 팔!
      const sleeveColor = outfit === 'coat'
        ? (isFather ? '#B47B48' : '#E5D5C5')
        : outfit === 'pad'
          ? (isFather ? '#1E3A5F' : '#F4B8C4')
          : '#FDBA8C';
      ctx.strokeStyle = sleeveColor;
      ctx.lineWidth = 10 * u;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-16 * u, shoulderY);
      ctx.quadraticCurveTo(-32 * u, (shoulderY + barLocalY) * 0.52, -26, barLocalY + 3);
      ctx.moveTo(16 * u, shoulderY);
      ctx.quadraticCurveTo(32 * u, (shoulderY + barLocalY) * 0.52, 26, barLocalY + 3);
      ctx.stroke();

      if (outfit === 'short') {
        // 반팔 소매 캡 (어깨 위쪽만 소매, 팔뚝은 맨살)
        ctx.strokeStyle = isFather ? '#1E293B' : '#F8FAFC';
        ctx.lineWidth = 11.5 * u;
        ctx.beginPath();
        ctx.moveTo(-16 * u, shoulderY);
        ctx.lineTo(-22 * u, shoulderY - 12 * u);
        ctx.moveTo(16 * u, shoulderY);
        ctx.lineTo(22 * u, shoulderY - 12 * u);
        ctx.stroke();
      }

      // 2) 팔 없는 깔끔한 3D 몸통·바지·신발 + 3D Mii 헤드 (턱걸이 상하 리프트)
      ctx.save();
      ctx.translate(0, pullLiftY);
      ctx.scale(1 + pullPhase * 0.025, 1 - pullPhase * 0.015);
      drawMiiHeadAndArmlessBody(ctx, charId, img, pH, outfit, hasCrown, t, false);
      ctx.restore();

      // 3) 머리 위 철봉 바를 꽉 쥔 두 손 (얼굴 바깥쪽 철봉 위치!)
      ctx.fillStyle = '#FDBA8C';
      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 1.5;
      [-26, 26].forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, barLocalY, 5.8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 4) 턱걸이 구호 배지
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#DC2626';
      ctx.textAlign = 'center';
      ctx.fillText(pullPhase > 0.5 ? '💪 으랏차! 턱걸이!' : '💪 하나, 둘!', 0, barLocalY - 12);
      ctx.restore();
      return;
    }

    // [행동 C] 의자에 앉아있기 (sit - 차분한 휴식)
    if (act === 'sit') {
      const seatSway = Math.sin(t * 1.1 + (isFather ? 0 : 1.3)) * 0.018;
      const legSwing = Math.sin(t * 1.6 + (isFather ? 0 : 1.0)) * 2.2;
      ctx.save();
      ctx.translate(cx, groundY + jumpY + 12);
      ctx.rotate(seatSway);
      ctx.scale(1.02, 0.88);
      ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, -targetW / 2, -targetH + 6 + legSwing * 0.2, targetW, targetH);
      ctx.shadowBlur = 0;

      if (hasCrown) {
        drawGoldenCrown(ctx, 0, -targetH + (isFather ? 14 : 16) + legSwing * 0.2, 0.98, t);
      }

      if (wx.hasUmbrella) {
        ctx.save();
        ctx.scale(0.88, 0.88);
        drawHeldUmbrella(ctx, t, isFather, false, outfit);
        ctx.restore();
      }
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☕', isFather ? -36 : 36, -targetH * 0.55 + Math.sin(t * 1.4) * 2);
      ctx.restore();
      return;
    }

    // [행동 D] 자연스럽게 좌·우·정면으로 천천히 걸어다니기 (walk)
    const walkPhase = ch.walkPhase;
    const bobY = isWalking
      ? -Math.abs(Math.sin(walkPhase)) * 4.2
      : Math.sin(t * 1.4 + (isFather ? 0 : 1.2)) * 1.5;
    const walkTilt = isWalking
      ? Math.sin(walkPhase) * 0.028
      : Math.sin(t * 1.1 + (isFather ? 0 : 1.0)) * 0.01;
    const stepSquashX = isWalking
      ? 1 + Math.cos(walkPhase * 2) * 0.018
      : 1 + Math.sin(t * 1.5) * 0.008;
    const stepSquashY = isWalking
      ? 1 - Math.cos(walkPhase * 2) * 0.018
      : 1 - Math.sin(t * 1.5) * 0.008;

    const jumpFactor = Math.max(0.55, 1 + (jumpY + bobY) / 140);
    ctx.save();
    const pedGrad = ctx.createRadialGradient(cx, groundY - 4, 4, cx, groundY - 4, 48 * depthScale * jumpFactor);
    pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    pedGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
    pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 4, 46 * depthScale * jumpFactor, 10.5 * depthScale * jumpFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, groundY + jumpY + bobY);
    ctx.rotate(walkTilt);

    const flipX = (isSideView && facingLeft) ? -1 : 1;
    const turnPerspective = isSideView
      ? Math.max(0.86, Math.min(1.0, 0.80 + Math.abs(Math.sin(yaw)) * 0.22))
      : Math.max(0.88, Math.cos(yaw));
    ctx.scale(flipX * stepSquashX * turnPerspective, stepSquashY);

    ctx.shadowColor = 'rgba(15, 23, 42, 0.26)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 5;
    ctx.drawImage(img, -targetW / 2, -targetH + 6, targetW, targetH);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    if (hasCrown) {
      drawGoldenCrown(ctx, isSideView ? 4 : 0, -targetH + (isFather ? 14 : 16), 1.0, t);
    }

    if (wx.hasUmbrella) {
      ctx.save();
      ctx.scale(0.9, 0.9);
      drawHeldUmbrella(ctx, t, isFather, isSideView, outfit);
      ctx.restore();
    }

    ctx.restore();
  }

  // ==========================================================
  // 두 분 아래쪽 앞마당을 돌아다니는 미니미 머털도사 & 말라뮤트 강아지 (걸어다니기 / 잠들기 / 의자 앉기 / 턱걸이)
  // ==========================================================
  function drawMiniCompanion(ctx, compId, ch, t, wx) {
    const isMutul = compId === 'mutul';
    const yaw = ch.yaw;
    const isWalking = ch.speed > 0.1;
    const isAtTarget = Math.hypot(ch.targetX - ch.x, ch.targetZ - ch.z) <= 8;
    const act = isAtTarget ? (ch.activity || 'walk') : 'walk';

    const isSideView = act === 'walk' && (Math.abs(yaw) > 0.22 || isWalking);
    const facingLeft = yaw < -0.12;

    const viewKey = isSideView ? 'side' : 'front';
    const img = loadedSprites[`${compId}_${viewKey}`] || loadedSprites[`${compId}_front`];
    if (!img || !img.complete || !img.naturalWidth) return;

    const jumpY = ch.y || 0;
    const depthScale = 1 + (ch.z || 0) * 0.0025;
    const groundY = (act === 'pullup' || act === 'sit' ? 352 : 408) + (ch.z || 0) * 0.45;
    const cx = ch.x;

    const targetH = (isMutul ? 116 : 86) * depthScale;
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;

    // [행동 A] 이불 덮고 잠들기 (sleep)
    if (act === 'sleep') {
      ctx.save();
      ctx.translate(cx, groundY + jumpY);
      drawSleepingBedAndBlanket(ctx, compId, img, targetW, targetH, t, true);
      ctx.restore();
      return;
    }

    // [행동 B] 미니 철봉 턱걸이 운동하기 (pullup - 미니 머털도사, 팔 2개만 렌더링!)
    if (act === 'pullup' && isMutul) {
      const pullPhase = (Math.sin(t * 1.65 + 0.7) + 1) * 0.5;
      const pullScale = 0.85;
      const pH = targetH * pullScale;
      const pullLiftY = -8 - pullPhase * 22;
      const barLocalY = -138 - (groundY - 348);
      const u = pH / 200;
      const shoulderY = pullLiftY + 4 - pH * (1 - 0.565) + 8 * u;

      ctx.save();
      ctx.translate(cx, groundY + jumpY);

      // 1) 어깨에서 철봉 바(±14)로 뻗은 딱 2개의 팔!
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-9, shoulderY);
      ctx.quadraticCurveTo(-19, (shoulderY + barLocalY) * 0.52, -14, barLocalY + 2);
      ctx.moveTo(9, shoulderY);
      ctx.quadraticCurveTo(19, (shoulderY + barLocalY) * 0.52, 14, barLocalY + 2);
      ctx.stroke();

      // 2) 팔 없는 깔끔한 미니 머털도사 3D 몸통 + 3D 헤드
      ctx.save();
      ctx.translate(0, pullLiftY);
      drawMiiHeadAndArmlessBody(ctx, 'mutul', img, pH, 'short', false, t, true);
      ctx.restore();

      // 3) 철봉을 꽉 쥔 두 손
      ctx.fillStyle = '#FDBA8C';
      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 1.2;
      [-14, 14].forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, barLocalY, 4.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });
      ctx.font = 'bold 11px sans-serif';
      ctx.fillStyle = '#EA580C';
      ctx.textAlign = 'center';
      ctx.fillText('💪 영차!', 0, barLocalY - 10);
      ctx.restore();
      return;
    }

    // [행동 C] 의자에 앉아 쉬기 (sit)
    if (act === 'sit') {
      ctx.save();
      ctx.translate(cx, groundY + jumpY + 6);
      ctx.rotate(Math.sin(t * 1.3) * 0.02);
      ctx.scale(1.03, 0.88);
      ctx.drawImage(img, -targetW / 2, -targetH + 4, targetW, targetH);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', 22, -targetH * 0.7);
      ctx.restore();
      return;
    }

    // [행동 D] 자연스럽게 좌·우로 천천히 걸어다니기 (walk)
    const walkPhase = ch.walkPhase;
    const bobY = isWalking
      ? -Math.abs(Math.sin(walkPhase)) * (isMutul ? 3.2 : 2.8)
      : Math.sin(t * 1.6 + (isMutul ? 0.5 : 2.1)) * 1.2;
    const walkTilt = isWalking
      ? Math.sin(walkPhase) * (isMutul ? 0.03 : 0.025)
      : Math.sin(t * 1.2 + (isMutul ? 0 : 1.4)) * 0.01;
    const stepSquashX = isWalking
      ? 1 + Math.cos(walkPhase * 2) * 0.018
      : 1 + Math.sin(t * 1.6) * 0.008;
    const stepSquashY = isWalking
      ? 1 - Math.cos(walkPhase * 2) * 0.018
      : 1 - Math.sin(t * 1.6) * 0.008;

    const jumpFactor = Math.max(0.55, 1 + (jumpY + bobY) / 100);
    ctx.save();
    const shadowRx = (isMutul ? 28 : 34) * depthScale * jumpFactor;
    const pedGrad = ctx.createRadialGradient(cx, groundY - 3, 2, cx, groundY - 3, shadowRx);
    pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    pedGrad.addColorStop(0.65, 'rgba(15, 23, 42, 0.13)');
    pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 3, shadowRx, 7.5 * depthScale * jumpFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(cx, groundY + jumpY + bobY);
    ctx.rotate(walkTilt);

    const flipX = (isSideView && facingLeft) ? -1 : 1;
    ctx.scale(flipX * stepSquashX, stepSquashY);

    ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;
    ctx.drawImage(img, -targetW / 2, -targetH + 4, targetW, targetH);

    if (isMutul && wx.hasUmbrella) {
      ctx.save();
      ctx.translate(isSideView ? 12 : -18, -118 + Math.sin(t * 3.8) * 1.5);
      ctx.rotate(isSideView ? -0.08 : -0.1);
      ctx.strokeStyle = '#475569';
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(0, 4);
      ctx.lineTo(0, 68);
      ctx.stroke();
      const mGrad = ctx.createRadialGradient(-8, -2, 3, 0, 6, 36);
      mGrad.addColorStop(0, '#FDE047');
      mGrad.addColorStop(0.65, '#F59E0B');
      mGrad.addColorStop(1, '#B45309');
      ctx.fillStyle = mGrad;
      ctx.beginPath();
      ctx.arc(0, 12, 34, Math.PI, 0);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    ctx.restore();
  }

  function drawHeldUmbrella(ctx, t, isFather, isSideView, outfit) {
    ctx.save();
    const handX = isSideView ? 32 : (isFather ? -48 : 44);
    const handY = (isFather && !isSideView && outfit === 'short') ? -152 : -112;
    const canopyCenterX = isSideView ? 8 : (isFather ? -14 : 12);
    const canopyTopY = (isFather ? -274 : -266) + Math.sin(t * 3.2) * 2;

    const dx = handX - canopyCenterX;
    const dy = handY - (canopyTopY + 18);
    const shaftAngle = Math.atan2(dx, dy);
    const shaftLen = Math.hypot(dx, dy);

    ctx.translate(canopyCenterX, canopyTopY);
    ctx.rotate(-shaftAngle);

    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 18 + shaftLen);
    ctx.stroke();

    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(0, 14 + shaftLen);
    ctx.lineTo(0, 24 + shaftLen);
    ctx.arc(isFather ? -5.5 : 5.5, 24 + shaftLen, 5.5, isFather ? 0 : Math.PI, isFather ? Math.PI : 0, !isFather);
    ctx.stroke();

    const domeGrad = ctx.createRadialGradient(-16, -6, 6, 0, 8, 70);
    if (isFather) {
      domeGrad.addColorStop(0, '#60A5FA');
      domeGrad.addColorStop(0.6, '#2563EB');
      domeGrad.addColorStop(1, '#1E3A8A');
    } else {
      domeGrad.addColorStop(0, '#FDA4AF');
      domeGrad.addColorStop(0.6, '#F43F5E');
      domeGrad.addColorStop(1, '#BE123C');
    }
    ctx.fillStyle = domeGrad;
    ctx.beginPath();
    ctx.arc(0, 20, 66, Math.PI, 0);
    ctx.quadraticCurveTo(44, 12, 22, 20);
    ctx.quadraticCurveTo(0, 12, -22, 20);
    ctx.quadraticCurveTo(-44, 12, -66, 20);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = '#F59E0B';
    ctx.beginPath();
    ctx.roundRect(-2.5, -52, 5, 7, 2);
    ctx.fill();
    ctx.restore();
  }

  function mountHomeTamagotchi(homeView) {
    const hero = homeView.querySelector('.hero');
    if (!hero) return;
    injectStyle();
    preloadSprites();

    if (activeMount && typeof activeMount.cleanup === 'function') {
      activeMount.cleanup();
    }

    const myId = getMyId();
    const partnerId = myId === '610708' ? '691105' : '610708';

    let savedBrief = null;
    try { savedBrief = JSON.parse(localStorage.getItem('wxBrief') || 'null'); } catch (e) { savedBrief = null; }
    let previewPreset = null;
    const PRESETS = [null, 'drizzle', 'rain', 'cold', 'snow', 'hot', 'spring'];
    let presetIdx = 0;

    let wx = parseWeatherState(savedBrief, previewPreset);

    const stageBox = document.createElement('div');
    stageBox.className = 'pet-stage-box';
    stageBox.id = 'petStageBox';

    stageBox.innerHTML = `
      <div class="pet-hud">
        <div class="pet-sync-pill" id="petSyncPill"><span class="pet-sync-dot"></span> 실시간 연동 광장</div>
        <div class="pet-wx-pill" id="petWxPill" title="터치하면 날씨·계절별 복장과 배경을 미리 볼 수 있어요">${wx.badge}</div>
      </div>
      <div class="pet-bubble-wrap">
        <div class="pet-bubble" id="petBubble">${wx.line}</div>
      </div>
      <div class="pet-canvas-wrap" id="petCanvasWrap">
        <canvas class="pet-canvas" id="petCanvas" width="580" height="430"></canvas>
        <div class="pet-fx-layer" id="petFxLayer"></div>
      </div>
    `;

    hero.appendChild(stageBox);

    const bubbleEl = stageBox.querySelector('#petBubble');
    const syncPillEl = stageBox.querySelector('#petSyncPill');
    const wxPillEl = stageBox.querySelector('#petWxPill');
    const fxLayer = stageBox.querySelector('#petFxLayer');
    const cv = stageBox.querySelector('#petCanvas');
    const ctx = cv.getContext('2d');

    const chars = {
      '610708': {
        x: 126,
        z: -4,
        targetX: 126,
        targetZ: -4,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: 0,
        y: 0,
        vy: 0,
        activity: 'pullup',
        nextActivityAt: performance.now() + 16000,
        nextWanderAt: performance.now() + 7200,
      },
      '691105': {
        x: 454,
        z: -4,
        targetX: 454,
        targetZ: -4,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: Math.PI,
        y: 0,
        vy: 0,
        activity: 'sit',
        nextActivityAt: performance.now() + 18500,
        nextWanderAt: performance.now() + 8000,
      },
      mutul: {
        x: 225,
        z: 10,
        targetX: 225,
        targetZ: 10,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: 0.4,
        y: 0,
        vy: 0,
        activity: 'sleep',
        nextActivityAt: performance.now() + 17000,
        nextWanderAt: performance.now() + 6800,
      },
      puppy: {
        x: 385,
        z: 12,
        targetX: 165,
        targetZ: 12,
        yaw: -1.2,
        targetYaw: -1.2,
        speed: 0.72,
        walkPhase: 2.1,
        y: 0,
        vy: 0,
        activity: 'walk',
        nextActivityAt: performance.now() + 15500,
        nextWanderAt: performance.now() + 6500,
      },
    };

    function applyActivityToChar(id, act, now, snapImmediate = false) {
      const ch = chars[id];
      if (!ch) return;
      if (playerState[id] && playerState[id].playing) {
        act = 'gaming';
      }
      ch.activity = act;
      ch.nextActivityAt = now + 15000 + Math.random() * 10000;

      if (act === 'gaming') {
        ch.targetX = id === '610708' ? 235 : 375;
        ch.targetZ = 2;
      } else if (act === 'pullup') {
        ch.targetX = id === 'mutul' ? 74 : 126;
        ch.targetZ = -4;
      } else if (act === 'sit') {
        ch.targetX = id === '610708' ? 424 : id === '691105' ? 466 : id === 'mutul' ? 426 : 464;
        ch.targetZ = -4;
      } else if (act === 'sleep') {
        ch.targetX = id === '610708' ? 245 : id === '691105' ? 325 : id === 'mutul' ? 220 : 355;
        ch.targetZ = (id === '610708' || id === '691105') ? 4 : 10;
      } else {
        // 'walk': 각자 영역에서 좌·우로 여유롭게 걸어다님
        const isLeftChar = id === '610708' || id === 'mutul';
        const minLane = isLeftChar ? 95 : 305;
        const maxLane = isLeftChar ? 275 : 485;
        const midLane = (minLane + maxLane) * 0.5;
        const goRight = ch.x < midLane;
        ch.targetX = goRight ? (midLane + 35 + Math.random() * 50) : (minLane + Math.random() * 50);
        ch.targetZ = (id === '610708' || id === '691105') ? (-8 + Math.random() * 14) : (6 + Math.random() * 10);
        ch.nextWanderAt = now + 6500 + Math.random() * 4500;
      }

      if (snapImmediate) {
        if (act === 'walk') {
          const isLeftChar = id === '610708' || id === 'mutul';
          ch.x = isLeftChar ? 145 : 345;
          ch.z = (id === '610708' || id === '691105') ? -2 : 10;
          ch.targetX = isLeftChar ? 265 : 465;
          ch.yaw = 1.2;
          ch.targetYaw = 1.2;
          ch.speed = 0.62;
        } else {
          ch.x = ch.targetX;
          ch.z = ch.targetZ;
          ch.yaw = 0;
          ch.targetYaw = 0;
          ch.speed = 0;
        }
      }
    }

    function pickRandomActivityFor(id, now) {
      if (playerState[id] && playerState[id].playing) {
        applyActivityToChar(id, 'gaming', now, false);
        return;
      }
      const pool = id === 'puppy'
        ? ['walk', 'walk', 'sleep', 'sit']
        : ['walk', 'walk', 'pullup', 'sit', 'sleep'];
      const otherIds = ['610708', '691105', 'mutul', 'puppy'].filter((k) => k !== id);

      const candidates = pool.filter((cand) => {
        if (cand === 'pullup') {
          if (id === 'mutul') return true;
          const otherAdult = id === '610708' ? '691105' : '610708';
          return chars[otherAdult].activity !== 'pullup';
        }
        if (cand === 'sleep') {
          const sleepingCount = otherIds.filter((k) => chars[k].activity === 'sleep').length;
          return sleepingCount < 2;
        }
        return true;
      });

      const nextAct = candidates[Math.floor(Math.random() * candidates.length)] || 'walk';
      applyActivityToChar(id, nextAct, now, false);
    }

    // 홈 화면에 진입했으므로 내 캐릭터의 게임중 상태는 해제 및 오늘 완료 여부 체크
    if (playerState[myId]) {
      playerState[myId].playing = false;
      const curMem = typeof currentMember !== 'undefined' ? currentMember : null;
      if (curMem && hasMemberCompletedToday(curMem)) {
        playerState[myId].crownDate = getTodayLocalYMD();
      }
    }

    (function initRandomBehaviors() {
      const now = performance.now();
      const parentRoles = [
        ['pullup', 'sit', 'sleep', 'walk'],
        ['walk', 'pullup', 'sit', 'sleep'],
        ['sleep', 'walk', 'pullup', 'sit'],
        ['sit', 'sleep', 'walk', 'pullup'],
      ];
      const pick = parentRoles[Math.floor(Math.random() * parentRoles.length)];
      applyActivityToChar('610708', pick[0], now, true);
      applyActivityToChar('691105', pick[1], now, true);
      applyActivityToChar('mutul', pick[2], now, true);
      applyActivityToChar('puppy', pick[3] === 'pullup' ? 'walk' : pick[3], now, true);
    })();

    const anim = {
      tapRing: null,
    };

    let bubbleTimer = null;
    function say(text, duration = 2600) {
      bubbleEl.classList.remove('is-hidden');
      bubbleEl.textContent = text;
      if (bubbleTimer) clearTimeout(bubbleTimer);
      if (duration > 0) {
        bubbleTimer = setTimeout(() => {
          bubbleEl.classList.add('is-hidden');
        }, duration);
      }
    }
    say(wx.line, 2600);

    function triggerJumpBoth() {
      ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
        chars[id].vy = -5.8;
      });
    }

    function spawnParticles(emojis) {
      for (let i = 0; i < emojis.length; i++) {
        const sp = document.createElement('span');
        sp.className = 'pet-float-item';
        sp.textContent = emojis[i];
        sp.style.left = `${26 + Math.random() * 48}%`;
        sp.style.top = `${32 + Math.random() * 26}%`;
        sp.style.animationDelay = `${i * 0.08}s`;
        fxLayer.appendChild(sp);
        setTimeout(() => sp.remove(), 1100);
      }
    }

    wxPillEl.addEventListener('click', (e) => {
      e.stopPropagation();
      presetIdx = (presetIdx + 1) % PRESETS.length;
      previewPreset = PRESETS[presetIdx];
      wx = parseWeatherState(savedBrief, previewPreset);
      wxPillEl.textContent = wx.badge;
      say(wx.line, 2600);
      triggerJumpBoth();
    });

    // ==========================================================
    // Firestore 실시간 양방향 화면 연동 (610708 <-> 691105)
    // ==========================================================
    let sharedRef = null;
    let unsubShared = null;
    let unsubMember61 = null;
    let unsubMember69 = null;
    let heartbeatTimer = null;
    let lastEventSeq = null;
    let initialPositionsSynced = false;

    function pushSharedAction(actionData) {
      initialPositionsSynced = true;
      if (!sharedRef) return;
      const payload = {
        type: 'petPlaza',
        updatedAt: new Date().toISOString(),
        positions: {
          '610708': { x: Math.round(chars['610708'].targetX), z: Math.round(chars['610708'].targetZ), act: chars['610708'].activity },
          '691105': { x: Math.round(chars['691105'].targetX), z: Math.round(chars['691105'].targetZ), act: chars['691105'].activity },
          mutul: { x: Math.round(chars.mutul.targetX), z: Math.round(chars.mutul.targetZ), act: chars.mutul.activity },
          puppy: { x: Math.round(chars.puppy.targetX), z: Math.round(chars.puppy.targetZ), act: chars.puppy.activity },
        },
        crowns: {
          [myId]: hasCrownNow(myId) ? getTodayLocalYMD() : null,
        },
      };
      if (actionData) {
        payload.lastAction = {
          ...actionData,
          by: myId,
          seq: Date.now() + Math.floor(Math.random() * 1000),
          at: new Date().toISOString(),
        };
      }
      sharedRef.set(payload, { merge: true }).catch(() => {});
    }

    try {
      const db = typeof initFirebase === 'function' ? initFirebase() : null;
      if (db) {
        sharedRef = db.collection('members').doc(SHARED_DOC_ID);
        const beat = () => {
          syncPlayerStateToFirestore();
        };
        beat();
        heartbeatTimer = setInterval(beat, HEARTBEAT_MS);

        // 두 분 회원 문서에서 오늘의 게임 완료 기록(자정까지 왕관)을 실시간 확인
        const watchMemberCrown = (id) => db.collection('members').doc(id).onSnapshot((mSnap) => {
          if (!mSnap.exists) return;
          const mData = mSnap.data() || {};
          if (hasMemberCompletedToday(mData)) {
            const today = getTodayLocalYMD();
            playerState[id].crownDate = today;
            try { localStorage.setItem('petCrownDate:' + id, today); } catch (e) {}
          }
        }, () => {});
        unsubMember61 = watchMemberCrown('610708');
        unsubMember69 = watchMemberCrown('691105');

        unsubShared = sharedRef.onSnapshot((snap) => {
          if (!snap.exists) return;
          const data = snap.data() || {};
          const today = getTodayLocalYMD();

          // 1) 왕관 상태 동기화 (자정까지 유지)
          if (data.crowns && typeof data.crowns === 'object') {
            ['610708', '691105'].forEach((id) => {
              if (data.crowns[id] === today) {
                playerState[id].crownDate = today;
                try { localStorage.setItem('petCrownDate:' + id, today); } catch (e) {}
              }
            });
          }

          // 2) 서로 게임 중인지(playingState) 실시간 확인 -> 게임중인 모션으로 전환!
          if (data.playingState && typeof data.playingState === 'object') {
            const pState = data.playingState[partnerId];
            if (pState && typeof pState === 'object') {
              const pAge = pState.at ? (Date.now() - new Date(pState.at).getTime()) : 999999;
              const isPartnerPlaying = Boolean(pState.playing) && pAge < 90000;
              const wasPlaying = playerState[partnerId].playing;
              playerState[partnerId].playing = isPartnerPlaying;
              if (pState.label) playerState[partnerId].gameLabel = pState.label;

              if (isPartnerPlaying && !wasPlaying) {
                applyActivityToChar(partnerId, 'gaming', performance.now(), false);
                say(`🎮 지금 ${partnerId}님이 열공 두뇌게임 중이에요! 응원해 주세요 💪`, 3600);
              } else if (!isPartnerPlaying && wasPlaying) {
                pickRandomActivityFor(partnerId, performance.now());
              }
            }
          }

          // 3) 상단 접속 배지 업데이트
          const pTime = data.presence && data.presence[partnerId];
          const partnerOnline = pTime && (Date.now() - new Date(pTime).getTime() < PRESENCE_TTL_MS);
          if (playerState[partnerId].playing) {
            syncPillEl.innerHTML = `<span class="pet-sync-dot"></span> 🎮 ${partnerId}님 열공 게임 중!`;
          } else if (partnerOnline) {
            syncPillEl.innerHTML = `<span class="pet-sync-dot"></span> 💑 ${partnerId}님과 함께 접속 중!`;
          } else {
            syncPillEl.innerHTML = `<span class="pet-sync-dot"></span> 실시간 연동 광장`;
          }

          const act = data.lastAction;
          const isFromMe = act && act.by === myId && initialPositionsSynced;
          const isRecentPos = data.updatedAt && (Date.now() - new Date(data.updatedAt).getTime() < 20000);
          if (data.positions && !isFromMe && isRecentPos) {
            ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
              if (playerState[id] && playerState[id].playing) return;
              const pos = data.positions[id];
              if (pos && Number.isFinite(pos.x) && chars[id]) {
                const tx = Math.max(70, Math.min(495, pos.x));
                const tz = Math.max(-24, Math.min(24, pos.z || 0));
                if (pos.act) chars[id].activity = pos.act;
                chars[id].targetX = tx;
                chars[id].targetZ = tz;
                chars[id].nextActivityAt = performance.now() + 16000;
              }
            });
          }
          initialPositionsSynced = true;

          if (act && act.seq) {
            if (lastEventSeq === null) {
              lastEventSeq = act.seq;
            } else if (act.seq !== lastEventSeq) {
              lastEventSeq = act.seq;
              if (act.by !== myId) {
                if (typeof beep === 'function') beep(580, 0.05);
                spawnParticles(['❤️', '✨']);
                say(`👟 ${act.by}님이 광장에서 함께 활동 중이에요!`, 2600);
              }
            }
          }
        }, () => {});
      }
    } catch (e) { /* 오프라인 무시 */ }

    const WALK_LINES = [
      '💪 철봉 턱걸이부터 🛌 낮잠·🪑 벤치 휴식·🚶 산책까지 자유롭게 즐겨요!',
      '👑 오늘의 두뇌운동을 완료하면 자정까지 멋진 황금 왕관을 써요!',
      '🎮 서로 게임 중이면 캐릭터도 두뇌게임기를 들고 열공 모션으로 바뀌어요!',
      '✨ 터치할 때마다 새로운 무작위 행동과 산책을 함께해요 💕',
    ];
    let walkClickCount = 0;

    stageBox.querySelector('#petCanvasWrap').addEventListener('click', (e) => {
      const rect = cv.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 580;
      const clickY = ((e.clientY - rect.top) / rect.height) * 430;
      const clampedX = Math.max(85, Math.min(495, clickX));
      const clampedZ = Math.max(-18, Math.min(18, (clickY - 350) * 0.45));
      const now = performance.now();

      anim.tapRing = { x: clampedX, y: 368 + clampedZ * 0.75, r: 4, alpha: 1 };

      if (clickX < 165 && clickY < 370) {
        if (!playerState['610708'].playing) applyActivityToChar('610708', 'pullup', now, false);
        applyActivityToChar('mutul', 'pullup', now, false);
      } else if (clickX > 400 && clickY < 370) {
        if (!playerState['691105'].playing) applyActivityToChar('691105', 'sit', now, false);
        if (!playerState['610708'].playing) applyActivityToChar('610708', 'sit', now, false);
      } else {
        const centerTarget = Math.max(170, Math.min(410, clampedX));
        ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
          if (playerState[id] && playerState[id].playing) return;
          chars[id].activity = 'walk';
          chars[id].nextActivityAt = now + 16000;
          chars[id].nextWanderAt = now + 10000;
        });
        if (!playerState['610708'].playing) {
          chars['610708'].targetX = centerTarget - 70;
          chars['610708'].targetZ = clampedZ;
        }
        if (!playerState['691105'].playing) {
          chars['691105'].targetX = centerTarget + 70;
          chars['691105'].targetZ = Math.max(-18, Math.min(18, clampedZ + 3));
        }
        chars.mutul.targetX = Math.max(85, Math.min(495, centerTarget - 50));
        chars.mutul.targetZ = 8;
        chars.puppy.targetX = Math.max(85, Math.min(495, centerTarget + 50));
        chars.puppy.targetZ = 12;
      }

      if (typeof beep === 'function') beep(580, 0.05);
      spawnParticles(['✨', '❤️', '🐾']);
      walkClickCount++;
      say(WALK_LINES[walkClickCount % WALK_LINES.length]);
      pushSharedAction({ kind: 'walk' });
    });

    const bgParticles = Array.from({ length: 24 }, () => ({
      x: Math.random() * 580,
      y: Math.random() * 430,
      s: 1.2 + Math.random() * 2.2,
      v: 1.4 + Math.random() * 2.4,
    }));

    const ripples = Array.from({ length: 8 }, () => ({
      x: 90 + Math.random() * 400,
      y: 355 + Math.random() * 55,
      r: Math.random() * 20,
    }));

    let rafId = null;
    function renderLoop(now) {
      if (!cv.isConnected) {
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }
      const t = now * 0.001;

      ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
        const isMini = id === 'mutul' || id === 'puppy';
        const isLeftChar = id === '610708' || id === 'mutul';
        const ch = chars[id];

        if (playerState[id] && playerState[id].playing && ch.activity !== 'gaming') {
          applyActivityToChar(id, 'gaming', now, false);
        } else if (now > ch.nextActivityAt) {
          pickRandomActivityFor(id, now);
        }

        const dx = ch.targetX - ch.x;
        const dz = ch.targetZ - ch.z;
        const dist = Math.hypot(dx, dz);

        if (ch.activity === 'walk' && (dist <= 6 || now > ch.nextWanderAt)) {
          const minLane = isLeftChar ? 95 : 305;
          const maxLane = isLeftChar ? 275 : 485;
          const midLane = (minLane + maxLane) * 0.5;
          const goRight = ch.x < midLane;
          ch.targetX = goRight
            ? (midLane + 30 + Math.random() * 55)
            : (minLane + Math.random() * 55);
          ch.targetZ = isMini ? (4 + Math.random() * 12) : (-10 + Math.random() * 16);
          ch.nextWanderAt = now + 6800 + Math.random() * 4800;
        }

        const curDx = ch.targetX - ch.x;
        const curDz = ch.targetZ - ch.z;
        const curDist = Math.hypot(curDx, curDz);

        if (curDist > 3.2) {
          const maxSpd = id === 'puppy' ? 0.76 : id === 'mutul' ? 0.64 : 0.55;
          const moveStep = Math.min(curDist, maxSpd);
          ch.x += (curDx / curDist) * moveStep;
          ch.z += (curDz / curDist) * moveStep;
          ch.speed = moveStep;
          ch.walkPhase += id === 'puppy' ? 0.082 : 0.065;
          ch.targetYaw = curDx < -0.5 ? -1.2 : curDx > 0.5 ? 1.2 : 0;
        } else {
          ch.speed = 0;
          ch.targetYaw = 0;
        }

        ch.yaw = lerpAngle(ch.yaw, ch.targetYaw, 0.08);

        if (ch.y < 0 || ch.vy !== 0) {
          ch.y += ch.vy;
          ch.vy += 0.36;
          if (ch.y >= 0) {
            ch.y = 0;
            ch.vy = 0;
          }
        }
      });

      ctx.clearRect(0, 0, 580, 430);

      drawSceneryBackground(ctx, t, wx, bgParticles, ripples);

      if (anim.tapRing && anim.tapRing.alpha > 0.02) {
        ctx.save();
        ctx.strokeStyle = `rgba(255, 255, 255, ${anim.tapRing.alpha})`;
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(anim.tapRing.x, anim.tapRing.y, anim.tapRing.r, anim.tapRing.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        anim.tapRing.r += 1.4;
        anim.tapRing.alpha *= 0.92;
      }

      const order = ['610708', '691105'].sort((a, b) => chars[a].z - chars[b].z);
      order.forEach((id) => {
        drawMii3DCharacter(ctx, id, chars[id], t, wx);
      });

      const midX = (chars['610708'].x + chars['691105'].x) * 0.5;
      const midY = 202 + Math.sin(t * 1.5) * 3.5;
      ctx.save();
      ctx.font = '24px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', midX, midY);
      ctx.restore();

      const compOrder = ['mutul', 'puppy'].sort((a, b) => chars[a].z - chars[b].z);
      compOrder.forEach((cid) => {
        drawMiniCompanion(ctx, cid, chars[cid], t, wx);
      });

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);

    activeMount = {
      updateWeather(brief) {
        savedBrief = brief;
        if (!previewPreset) {
          wx = parseWeatherState(savedBrief, null);
          wxPillEl.textContent = wx.badge;
          say(wx.line);
        }
      },
      setPreview(preset) {
        previewPreset = preset;
        wx = parseWeatherState(savedBrief, previewPreset);
        wxPillEl.textContent = wx.badge;
        say(wx.line);
      },
      setActivities(actMap, snapImmediate = true) {
        const now = performance.now();
        Object.keys(actMap || {}).forEach((id) => {
          applyActivityToChar(id, actMap[id], now, snapImmediate);
        });
      },
      onPlayerStateChanged(id) {
        const now = performance.now();
        if (playerState[id] && playerState[id].playing) {
          applyActivityToChar(id, 'gaming', now, true);
        }
      },
      cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (unsubShared) unsubShared();
        if (unsubMember61) unsubMember61();
        if (unsubMember69) unsubMember69();
      },
    };
  }

  function onWeather(brief) {
    if (activeMount && typeof activeMount.updateWeather === 'function') {
      activeMount.updateWeather(brief);
    }
  }

  function setPreview(preset) {
    if (activeMount && typeof activeMount.setPreview === 'function') {
      activeMount.setPreview(preset);
    }
  }

  function setActivities(actMap, snapImmediate = true) {
    if (activeMount && typeof activeMount.setActivities === 'function') {
      activeMount.setActivities(actMap, snapImmediate);
    }
  }

  function setPlayerStatus(statusMap) {
    const today = getTodayLocalYMD();
    Object.keys(statusMap || {}).forEach((id) => {
      if (!playerState[id]) return;
      const cfg = statusMap[id] || {};
      if (typeof cfg.playing === 'boolean') {
        playerState[id].playing = cfg.playing;
      }
      if (cfg.gameLabel) {
        playerState[id].gameLabel = cfg.gameLabel;
      }
      if (typeof cfg.crown === 'boolean') {
        playerState[id].crownOverride = cfg.crown;
        playerState[id].crownDate = cfg.crown ? today : null;
      }
      if (activeMount && typeof activeMount.onPlayerStateChanged === 'function') {
        activeMount.onPlayerStateChanged(id);
      }
    });
  }

  window.PET = {
    mountHomeTamagotchi,
    onWeather,
    setPreview,
    setActivities,
    setPlayingState,
    markCompletedToday,
    setPlayerStatus,
    hasCrownNow,
    getTodayLocalYMD,
    getPetState,
  };
})();
