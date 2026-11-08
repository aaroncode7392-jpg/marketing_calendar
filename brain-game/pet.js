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

  function getCurrentSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  function parseWeatherState(brief, previewPreset) {
    if (previewPreset) {
      if (previewPreset === 'rain') {
        return { season: getCurrentSeason(), isRain: true, isSnow: false, isCold: false, isHot: false, isNight: false, outfit: 'short', hasUmbrella: true, badge: '☂️ 비 · 우산 산책', line: '☂️ 비가 내려서 두 분 다 우산을 챙겨 들고 산책 중이에요!' };
      }
      if (previewPreset === 'cold') {
        return { season: 'autumn', isRain: false, isSnow: false, isCold: true, isHot: false, isNight: false, outfit: 'coat', hasUmbrella: false, badge: '🧣 추위 · 코트와 목도리', line: '🧣 날씨가 쌀쌀해서 따뜻한 코트와 목도리를 두르고 산책 중이에요!' };
      }
      if (previewPreset === 'snow') {
        return { season: 'winter', isRain: false, isSnow: true, isCold: true, isHot: false, isNight: false, outfit: 'pad', hasUmbrella: true, badge: '⛄ 눈 · 우산과 패딩', line: '⛄ 함박눈이 내려서 따뜻한 패딩을 입고 우산을 쓰고 걸어요!' };
      }
      if (previewPreset === 'hot') {
        return { season: 'summer', isRain: false, isSnow: false, isCold: false, isHot: true, isNight: false, outfit: 'short', hasUmbrella: false, badge: '☀️ 더움 · 시원한 반팔', line: '☀️ 햇살이 따뜻한 날이라 시원한 반팔 차림으로 산책 중이에요!' };
      }
      if (previewPreset === 'spring') {
        return { season: 'spring', isRain: false, isSnow: false, isCold: false, isHot: false, isNight: false, outfit: 'short', hasUmbrella: false, badge: '🌸 봄꽃 공원 · 반팔', line: '🌸 벚꽃이 살랑살랑 흩날리는 봄날 공원을 함께 걸어요!' };
      }
    }

    const hour = new Date().getHours();
    const isNight = brief && brief.isDay !== undefined ? !brief.isDay : (hour >= 19 || hour < 6);
    const code = brief && Number.isFinite(brief.code) ? brief.code : 0;
    const temp = brief && Number.isFinite(brief.temp) ? brief.temp : 16;

    const isRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isCold = !isSnow && temp <= 10;
    const isHot = temp >= 23;

    let season = getCurrentSeason();
    if (isSnow || temp <= 2) season = 'winter';
    else if (isHot) season = 'summer';
    else if (isCold) season = 'autumn';

    let outfit = 'short';
    if (isSnow) outfit = 'pad';
    else if (isCold) outfit = 'coat';
    else outfit = 'short';

    const hasUmbrella = isRain || isSnow;

    let badge = '🌤️ 산책하기 좋은 날';
    let line = '😊 광장에서 산책·턱걸이 운동·의자 휴식·낮잠을 자유롭게 즐겨요!';
    if (isSnow) {
      badge = `⛄ 눈 (${temp}°) · 패딩과 우산`;
      line = '⛄ 눈 소식이 있어 따뜻한 패딩에 우산을 챙겨 들고 산책해요!';
    } else if (isRain && isCold) {
      badge = `☂️ 찬비 (${temp}°) · 코트와 우산`;
      line = '☂️ 비가 내리고 쌀쌀해서 코트와 목도리에 우산까지 챙겼어요!';
    } else if (isRain) {
      badge = `☂️ 비 (${temp}°) · 우산 산책`;
      line = '☂️ 오늘은 비 소식이 있어요! 외출하실 때 우산 꼭 챙기세요 😊';
    } else if (isCold) {
      badge = `🧣 쌀쌀함 (${temp}°) · 코트와 목도리`;
      line = '🧣 날씨가 쌀쌀해서 두 분 다 따뜻한 코트와 목도리를 착용하셨어요!';
    } else if (isHot) {
      badge = `☀️ 따뜻함 (${temp}°) · 반팔 산책`;
      line = '☀️ 날씨가 따뜻해서 가벼운 반팔 차림으로 상쾌하게 산책해요!';
    } else if (brief && Number.isFinite(brief.temp)) {
      const seasonKor = { spring: '🌸 봄', summer: '🌿 여름', autumn: '🍁 가을', winter: '❄️ 겨울' }[season];
      badge = `${seasonKor} ${temp}° · 산책 광장`;
    }

    return { season, isNight, isRain, isSnow, isCold, isHot, outfit, hasUmbrella, badge, line, temp };
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
  // 계절(봄·여름·가을·겨울) & 날씨(맑음·비·눈·밤) 배경 공간 렌더러
  // ==========================================================
  function drawSceneryBackground(ctx, t, wx, bgParticles, ripples) {
    const W = 580, H = 430;
    const horizonY = 252;

    // 1. 하늘 그라데이션
    const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
    if (wx.isNight) {
      skyGrad.addColorStop(0, '#0F172A');
      skyGrad.addColorStop(1, '#1E3A5F');
    } else if (wx.isRain) {
      skyGrad.addColorStop(0, '#475569');
      skyGrad.addColorStop(1, '#94A3B8');
    } else if (wx.isSnow || wx.season === 'winter') {
      skyGrad.addColorStop(0, '#7DD3FC');
      skyGrad.addColorStop(0.55, '#BAE6FD');
      skyGrad.addColorStop(1, '#F1F5F9');
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

    // 2. 해 / 달 / 구름
    ctx.save();
    if (wx.isNight) {
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FEF08A';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(485, 82, 22, 0, Math.PI * 2);
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
      ? 'rgba(100, 116, 139, 0.82)'
      : wx.isNight
        ? 'rgba(148, 163, 184, 0.25)'
        : 'rgba(255, 255, 255, 0.82)';
    ctx.fillStyle = cloudColor;
    [
      { baseX: 110, y: 88, s: 1.0, spd: 4 },
      { baseX: 340, y: 72, s: 0.85, spd: 3 },
      { baseX: 470, y: 105, s: 0.75, spd: 5 },
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

    // 3. 원경 산자락 & 언덕 (계절별 색상)
    ctx.save();
    let farHillColor = '#86EFAC';
    let nearHillColor = '#4ADE80';
    let lawnTopColor = '#86EFAC';
    let lawnBotColor = '#4ADE80';
    let pathColor = '#E2E8F0';

    if (wx.isSnow || wx.season === 'winter') {
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
    } else if (wx.isRain) {
      farHillColor = '#64748B';
      nearHillColor = '#6EE7B7';
      lawnTopColor = '#6EE7B7';
      lawnBotColor = '#34D399';
      pathColor = '#94A3B8';
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
    ctx.quadraticCurveTo(145, horizonY - 48, 310, horizonY + 4);
    ctx.quadraticCurveTo(455, horizonY - 38, W, horizonY + 8);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = nearHillColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8);
    ctx.quadraticCurveTo(210, horizonY - 22, 410, horizonY + 10);
    ctx.quadraticCurveTo(510, horizonY - 10, W, horizonY + 12);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    const lawnGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    lawnGrad.addColorStop(0, lawnTopColor);
    lawnGrad.addColorStop(1, lawnBotColor);
    ctx.fillStyle = lawnGrad;
    ctx.fillRect(0, horizonY + 6, W, H - horizonY);

    ctx.fillStyle = pathColor;
    ctx.globalAlpha = wx.isRain ? 0.55 : 0.72;
    ctx.beginPath();
    ctx.ellipse(290, 384, 248, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // 4. 계절별 나무 & 공원 운동기구(철봉) & 원목 의자/벤치 배치
    drawSeasonTree(ctx, 46, 268, 0.94, wx, t);
    drawSeasonTree(ctx, 528, 272, 0.92, wx, t + 1.5);

    // 왼쪽 공원 턱걸이 철봉 기구 (x=126, y=348)
    drawPullupBarStation(ctx, 126, 348, wx);

    // 오른쪽 공원 원목 의자/벤치 & 가로등 (x=446, y=348)
    drawParkChairStation(ctx, 446, 348, wx);

    // 눈 오는 날 / 겨울에는 귀여운 눈사람 추가 (x=216, y=274)
    if (wx.isSnow || wx.season === 'winter') {
      drawSnowman(ctx, 216, 276);
    }

    // 비 오는 날 바닥 물웅덩이 파장(Ripples)
    if (wx.isRain && ripples) {
      ctx.save();
      ctx.lineWidth = 1.5;
      for (const rp of ripples) {
        rp.r += 0.45;
        if (rp.r > 22) {
          rp.r = 2;
          rp.x = 90 + Math.random() * 400;
          rp.y = 355 + Math.random() * 55;
        }
        const alpha = Math.max(0, 1 - rp.r / 22) * 0.65;
        ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.beginPath();
        ctx.ellipse(rp.x, rp.y, rp.r, rp.r * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // 5. 계절·날씨 하늘 입자
    ctx.save();
    if (wx.isRain) {
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.62)';
      ctx.lineWidth = 2.0;
      for (const p of bgParticles) {
        p.y = (p.y + p.v * 3.8) % H;
        p.x = (p.x - 1.1 + W) % W;
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        ctx.lineTo(p.x - 4, p.y + 15);
        ctx.stroke();
      }
    } else if (wx.isSnow || wx.season === 'winter') {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.92)';
      for (const p of bgParticles) {
        p.y = (p.y + p.v * 0.85) % H;
        p.x = (p.x + Math.sin(t + p.y * 0.03) * 0.8 + W) % W;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.s * 2.1, 0, Math.PI * 2);
        ctx.fill();
      }
    } else if (wx.season === 'spring') {
      ctx.fillStyle = '#F9A8D4';
      for (const p of bgParticles) {
        p.y = (p.y + p.v * 0.65) % H;
        p.x = (p.x + Math.sin(t * 1.5 + p.y * 0.04) * 1.1 + W) % W;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t + p.x * 0.05);
        ctx.beginPath();
        ctx.ellipse(0, 0, p.s * 2.4, p.s * 1.4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    } else if (wx.season === 'autumn') {
      for (let i = 0; i < bgParticles.length; i++) {
        const p = bgParticles[i];
        p.y = (p.y + p.v * 0.7) % H;
        p.x = (p.x + Math.sin(t * 1.3 + i) * 1.1 + W) % W;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(t * 1.2 + i);
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
        const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
        ctx.beginPath();
        ctx.arc(p.x, p.y * 0.55, p.s * (1 + pulse), 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function drawSeasonTree(ctx, x, y, scale, wx, t) {
    ctx.save();
    ctx.translate(x, y);
    ctx.scale(scale, scale);
    const sway = Math.sin(t * 1.6) * 0.025;
    ctx.rotate(sway);

    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(-8, -58, 16, 62, 5);
    ctx.fill();

    let c1 = '#22C55E', c2 = '#16A34A';
    if (wx.isSnow || wx.season === 'winter') {
      c1 = '#15803D';
      c2 = '#166534';
    } else if (wx.season === 'spring') {
      c1 = '#FBCFE8';
      c2 = '#F472B6';
    } else if (wx.season === 'autumn') {
      c1 = x < 290 ? '#FBBF24' : '#F87171';
      c2 = x < 290 ? '#D97706' : '#DC2626';
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

      if (wx.isSnow || wx.season === 'winter') {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pf.dx, pf.dy - 4, pf.r * 0.85, Math.PI * 1.08, Math.PI * 1.92);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  // 왼쪽 턱걸이 운동기구 (철봉: 성인용 높은 바 + 미니 머털이용 낮은 바)
  function drawPullupBarStation(ctx, x, y, wx) {
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

    if (wx.isSnow || wx.season === 'winter') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-38, -237, 76, 3);
    }
    ctx.restore();
  }

  // 오른쪽 공원 원목 의자/벤치 & 가로등
  function drawParkChairStation(ctx, x, y, wx) {
    ctx.save();
    ctx.translate(x, y);

    // 가로등 기둥
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(58, 0);
    ctx.lineTo(58, -135);
    ctx.stroke();

    ctx.fillStyle = (wx.isNight || wx.isRain || wx.isSnow) ? '#FDE047' : '#FEF9C3';
    if (wx.isNight || wx.isRain || wx.isSnow) {
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = 16;
    }
    ctx.beginPath();
    ctx.arc(58, -140, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

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

    if (wx.isSnow || wx.season === 'winter') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-48, -48, 96, 3.5);
    }
    ctx.restore();
  }

  // 이불 덮고 잠드는 침구(매트 + 베개 + 포근한 퀼팅 이불 + Zzz) 렌더링
  function drawSleepingBedAndBlanket(ctx, charId, img, targetW, targetH, t, isMini) {
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

    // 5) 쿨쿨 잠드는 Zzz 애니메이션 방울
    const zPhase = (t * 1.4) % 1;
    ctx.font = `bold ${isMini ? 13 : 16}px sans-serif`;
    ctx.fillStyle = '#1E293B';
    ctx.fillText('💤', pillowX - 8, pillowY - 22 - zPhase * 12);
    ctx.font = `bold ${isMini ? 10 : 12}px sans-serif`;
    ctx.fillStyle = '#475569';
    ctx.fillText('Zzz', pillowX + 12, pillowY - 30 - ((zPhase + 0.4) % 1) * 12);
    ctx.restore();
  }

  function drawSnowman(ctx, x, y) {
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, -12, 14, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(0, -31, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#EF4444';
    ctx.fillRect(-9, -23, 18, 4.5);
    ctx.fillStyle = '#F97316';
    ctx.beginPath();
    ctx.moveTo(0, -31);
    ctx.lineTo(7, -29);
    ctx.lineTo(0, -28);
    ctx.fill();
    ctx.restore();
  }

  // ==========================================================
  // 정면(Front) · 좌측면(Left) · 우측면(Right) + 무작위 행동(걸어다니기 / 이불 덮고 잠들기 / 의자에 앉기 / 턱걸이 운동) 렌더링
  // ==========================================================
  function drawMii3DCharacter(ctx, charId, ch, t, wx) {
    const isFather = charId === '610708';
    const yaw = ch.yaw;
    const isWalking = ch.speed > 0.12;
    const isAtTarget = Math.hypot(ch.targetX - ch.x, ch.targetZ - ch.z) <= 8;
    const act = isAtTarget ? (ch.activity || 'walk') : 'walk';

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

    // [행동 A] 이불 덮고 잠들기 (sleep)
    if (act === 'sleep') {
      ctx.save();
      ctx.translate(cx, groundY + jumpY);
      drawSleepingBedAndBlanket(ctx, charId, img, targetW, targetH, t, false);
      ctx.restore();
      return;
    }

    // [행동 B] 철봉 턱걸이 운동하기 (pullup)
    if (act === 'pullup') {
      const pullCycle = t * 4.2 + (isFather ? 0 : 1.2);
      const pullPhase = (Math.sin(pullCycle) + 1) * 0.5; // 0(매달림) ~ 1(턱걸이 정점)
      const pullScale = 0.85;
      const pH = targetH * pullScale;
      const pW = targetW * pullScale;
      const pullLiftY = -12 - pullPhase * 34;
      const barLocalY = -232 - (groundY - 348); // 머리 위 철봉 가로바 높이

      // 바닥 그림자
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.2)';
      ctx.beginPath();
      ctx.ellipse(cx, groundY - 2, 34 * (1 - pullPhase * 0.25), 7.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      ctx.save();
      ctx.translate(cx, groundY + jumpY);

      // 어깨에서 머리 위 철봉 바깥쪽(±28)으로 뻗어 매달린 양팔
      const shoulderY = pullLiftY - pH * 0.42;
      const armColor = outfit === 'coat'
        ? (isFather ? '#B47B48' : '#E5D5C5')
        : outfit === 'pad'
          ? (isFather ? '#1E3A5F' : '#F4B8C4')
          : (isFather ? '#1E293B' : '#F1F5F9');
      ctx.strokeStyle = armColor;
      ctx.lineWidth = 10;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(-18, shoulderY);
      ctx.quadraticCurveTo(-34, (shoulderY + barLocalY) * 0.5, -28, barLocalY + 3);
      ctx.moveTo(18, shoulderY);
      ctx.quadraticCurveTo(34, (shoulderY + barLocalY) * 0.5, 28, barLocalY + 3);
      ctx.stroke();

      // 캐릭터 본체 (턱걸이 상하 리프트)
      ctx.save();
      ctx.translate(0, pullLiftY);
      ctx.scale(1 + pullPhase * 0.03, 1 - pullPhase * 0.02);
      ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, -pW / 2, -pH + 6, pW, pH);
      ctx.restore();

      // 머리 위 철봉 바를 꽉 쥔 두 손 (얼굴 바깥쪽 철봉 위치!)
      ctx.fillStyle = '#FDBA8C';
      ctx.strokeStyle = '#9A3412';
      ctx.lineWidth = 1.5;
      [-28, 28].forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, barLocalY, 6, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      });

      // 턱걸이 구호 배지
      ctx.font = 'bold 13px sans-serif';
      ctx.fillStyle = '#DC2626';
      ctx.textAlign = 'center';
      ctx.fillText(pullPhase > 0.5 ? '💪 으랏차! 턱걸이!' : '💪 하나, 둘!', 0, barLocalY - 12);
      ctx.restore();
      return;
    }

    // [행동 C] 의자에 앉아있기 (sit)
    if (act === 'sit') {
      const seatSway = Math.sin(t * 2.4 + (isFather ? 0 : 1.3)) * 0.025;
      const legSwing = Math.sin(t * 3.8 + (isFather ? 0 : 1.0)) * 3.5;
      ctx.save();
      ctx.translate(cx, groundY + jumpY + 12);
      ctx.rotate(seatSway);
      ctx.scale(1.02, 0.88);
      ctx.shadowColor = 'rgba(15, 23, 42, 0.24)';
      ctx.shadowBlur = 12;
      ctx.drawImage(img, -targetW / 2, -targetH + 6 + legSwing * 0.2, targetW, targetH);

      if (wx.hasUmbrella) {
        ctx.save();
        ctx.scale(0.88, 0.88);
        drawHeldUmbrella(ctx, t, isFather, false, outfit);
        ctx.restore();
      }
      ctx.font = '16px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('☕', isFather ? -36 : 36, -targetH * 0.55 + Math.sin(t * 3) * 3);
      ctx.restore();
      return;
    }

    // [행동 D] 자연스럽게 좌·우·정면으로 걸어다니기 (walk)
    const walkPhase = ch.walkPhase;
    const bobY = isWalking
      ? -Math.abs(Math.sin(walkPhase)) * 8.5
      : Math.sin(t * 2.8 + (isFather ? 0 : 1.2)) * 2.5;
    const walkTilt = isWalking
      ? Math.sin(walkPhase) * 0.06
      : Math.sin(t * 2.2 + (isFather ? 0 : 1.0)) * 0.016;
    const stepSquashX = isWalking
      ? 1 + Math.cos(walkPhase * 2) * 0.032
      : 1 + Math.sin(t * 3.0) * 0.012;
    const stepSquashY = isWalking
      ? 1 - Math.cos(walkPhase * 2) * 0.032
      : 1 - Math.sin(t * 3.0) * 0.012;

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

    // [행동 B] 미니 철봉 턱걸이 운동하기 (pullup - 미니 머털도사)
    if (act === 'pullup' && isMutul) {
      const pullPhase = (Math.sin(t * 4.8 + 0.7) + 1) * 0.5;
      const pullScale = 0.85;
      const pH = targetH * pullScale;
      const pW = targetW * pullScale;
      const pullLiftY = -8 - pullPhase * 22;
      const barLocalY = -138 - (groundY - 348);

      ctx.save();
      ctx.translate(cx, groundY + jumpY);
      ctx.strokeStyle = '#334155';
      ctx.lineWidth = 6.5;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-10, pullLiftY - pH * 0.38);
      ctx.quadraticCurveTo(-20, (pullLiftY - pH * 0.38 + barLocalY) * 0.5, -15, barLocalY + 2);
      ctx.moveTo(10, pullLiftY - pH * 0.38);
      ctx.quadraticCurveTo(20, (pullLiftY - pH * 0.38 + barLocalY) * 0.5, 15, barLocalY + 2);
      ctx.stroke();

      ctx.save();
      ctx.translate(0, pullLiftY);
      ctx.drawImage(img, -pW / 2, -pH + 4, pW, pH);
      ctx.restore();

      ctx.fillStyle = '#FDBA8C';
      [-15, 15].forEach((hx) => {
        ctx.beginPath();
        ctx.arc(hx, barLocalY, 4.2, 0, Math.PI * 2);
        ctx.fill();
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
      ctx.rotate(Math.sin(t * 2.8) * 0.03);
      ctx.scale(1.03, 0.88);
      ctx.drawImage(img, -targetW / 2, -targetH + 4, targetW, targetH);
      ctx.font = '13px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('🎵', 22, -targetH * 0.7);
      ctx.restore();
      return;
    }

    // [행동 D] 자연스럽게 좌·우로 걸어다니기 (walk)
    const walkPhase = ch.walkPhase;
    const bobY = isWalking
      ? -Math.abs(Math.sin(walkPhase)) * (isMutul ? 6.5 : 5.5)
      : Math.sin(t * 3.4 + (isMutul ? 0.5 : 2.1)) * 2.0;
    const walkTilt = isWalking
      ? Math.sin(walkPhase) * (isMutul ? 0.065 : 0.055)
      : Math.sin(t * 2.6 + (isMutul ? 0 : 1.4)) * 0.018;
    const stepSquashX = isWalking
      ? 1 + Math.cos(walkPhase * 2) * 0.035
      : 1 + Math.sin(t * 3.5) * 0.014;
    const stepSquashY = isWalking
      ? 1 - Math.cos(walkPhase * 2) * 0.035
      : 1 - Math.sin(t * 3.5) * 0.014;

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
    const PRESETS = [null, 'rain', 'cold', 'snow', 'hot', 'spring'];
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
        nextActivityAt: performance.now() + 6200,
        nextWanderAt: performance.now() + 2400,
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
        nextActivityAt: performance.now() + 7100,
        nextWanderAt: performance.now() + 2800,
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
        nextActivityAt: performance.now() + 5800,
        nextWanderAt: performance.now() + 1800,
      },
      puppy: {
        x: 385,
        z: 12,
        targetX: 165,
        targetZ: 12,
        yaw: -1.2,
        targetYaw: -1.2,
        speed: 2.1,
        walkPhase: 2.1,
        y: 0,
        vy: 0,
        activity: 'walk',
        nextActivityAt: performance.now() + 5200,
        nextWanderAt: performance.now() + 1500,
      },
    };

    function applyActivityToChar(id, act, now, snapImmediate = false) {
      const ch = chars[id];
      if (!ch) return;
      ch.activity = act;
      ch.nextActivityAt = now + 5400 + Math.random() * 3400;

      if (act === 'pullup') {
        ch.targetX = id === 'mutul' ? 74 : 126;
        ch.targetZ = -4;
      } else if (act === 'sit') {
        ch.targetX = id === '610708' ? 424 : id === '691105' ? 466 : id === 'mutul' ? 426 : 464;
        ch.targetZ = -4;
      } else if (act === 'sleep') {
        ch.targetX = id === '610708' ? 245 : id === '691105' ? 325 : id === 'mutul' ? 220 : 355;
        ch.targetZ = (id === '610708' || id === '691105') ? 4 : 10;
      } else {
        // 'walk': 각자 영역에서 좌·우로 겹치지 않게 걸어다님
        const isLeftChar = id === '610708' || id === 'mutul';
        const minLane = isLeftChar ? 95 : 305;
        const maxLane = isLeftChar ? 275 : 485;
        const midLane = (minLane + maxLane) * 0.5;
        const goRight = ch.x < midLane;
        ch.targetX = goRight ? (midLane + 35 + Math.random() * 50) : (minLane + Math.random() * 50);
        ch.targetZ = (id === '610708' || id === '691105') ? (-8 + Math.random() * 14) : (6 + Math.random() * 10);
        ch.nextWanderAt = now + 2200 + Math.random() * 1600;
      }

      if (snapImmediate) {
        if (act === 'walk') {
          const isLeftChar = id === '610708' || id === 'mutul';
          ch.x = isLeftChar ? 145 : 345;
          ch.z = (id === '610708' || id === '691105') ? -2 : 10;
          ch.targetX = isLeftChar ? 265 : 465;
          ch.yaw = 1.2;
          ch.targetYaw = 1.2;
          ch.speed = 1.9;
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
          sharedRef.set({
            type: 'petPlaza',
            presence: { [myId]: new Date().toISOString() },
          }, { merge: true }).catch(() => {});
        };
        beat();
        heartbeatTimer = setInterval(beat, HEARTBEAT_MS);

        unsubShared = sharedRef.onSnapshot((snap) => {
          if (!snap.exists) return;
          const data = snap.data() || {};
          const pTime = data.presence && data.presence[partnerId];
          const partnerOnline = pTime && (Date.now() - new Date(pTime).getTime() < PRESENCE_TTL_MS);
          if (partnerOnline) {
            syncPillEl.innerHTML = `<span class="pet-sync-dot"></span> 💑 ${partnerId}님과 함께 접속 중!`;
          } else {
            syncPillEl.innerHTML = `<span class="pet-sync-dot"></span> 실시간 연동 광장`;
          }

          const act = data.lastAction;
          const isFromMe = act && act.by === myId && initialPositionsSynced;
          const isRecentPos = data.updatedAt && (Date.now() - new Date(data.updatedAt).getTime() < 20000);
          if (data.positions && !isFromMe && isRecentPos) {
            ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
              const pos = data.positions[id];
              if (pos && Number.isFinite(pos.x) && chars[id]) {
                const tx = Math.max(70, Math.min(495, pos.x));
                const tz = Math.max(-24, Math.min(24, pos.z || 0));
                if (pos.act) chars[id].activity = pos.act;
                chars[id].targetX = tx;
                chars[id].targetZ = tz;
                chars[id].nextActivityAt = performance.now() + 6500;
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
      '☝️ 하하하! 오늘도 상쾌하게 운동하며 두뇌운동 화이팅입니다!',
      '🐶 멍멍! 강아지와 미니 머털도사도 신나게 뛰어놀아요 🥰',
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
        applyActivityToChar('610708', 'pullup', now, false);
        applyActivityToChar('mutul', 'pullup', now, false);
      } else if (clickX > 400 && clickY < 370) {
        applyActivityToChar('691105', 'sit', now, false);
        applyActivityToChar('610708', 'sit', now, false);
      } else {
        const centerTarget = Math.max(170, Math.min(410, clampedX));
        ['610708', '691105', 'mutul', 'puppy'].forEach((id) => {
          chars[id].activity = 'walk';
          chars[id].nextActivityAt = now + 5500;
          chars[id].nextWanderAt = now + 4500;
        });
        chars['610708'].targetX = centerTarget - 70;
        chars['610708'].targetZ = clampedZ;
        chars['691105'].targetX = centerTarget + 70;
        chars['691105'].targetZ = Math.max(-18, Math.min(18, clampedZ + 3));
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

        if (now > ch.nextActivityAt) {
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
          ch.nextWanderAt = now + 2400 + Math.random() * 1800;
        }

        const curDx = ch.targetX - ch.x;
        const curDz = ch.targetZ - ch.z;
        const curDist = Math.hypot(curDx, curDz);

        if (curDist > 3.2) {
          const maxSpd = id === 'puppy' ? 2.35 : id === 'mutul' ? 1.95 : 1.85;
          const moveStep = Math.min(curDist, maxSpd);
          ch.x += (curDx / curDist) * moveStep;
          ch.z += (curDz / curDist) * moveStep;
          ch.speed = moveStep;
          ch.walkPhase += id === 'puppy' ? 0.28 : 0.22;
          ch.targetYaw = curDx < -0.5 ? -1.2 : curDx > 0.5 ? 1.2 : 0;
        } else {
          ch.speed = 0;
          ch.targetYaw = 0;
        }

        ch.yaw = lerpAngle(ch.yaw, ch.targetYaw, 0.2);

        if (ch.y < 0 || ch.vy !== 0) {
          ch.y += ch.vy;
          ch.vy += 0.54;
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
      const midY = 202 + Math.sin(t * 3.2) * 5;
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
      cleanup() {
        if (rafId) cancelAnimationFrame(rafId);
        if (heartbeatTimer) clearInterval(heartbeatTimer);
        if (unsubShared) unsubShared();
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

  window.PET = { mountHomeTamagotchi, onWeather, setPreview, setActivities, getPetState };
})();
