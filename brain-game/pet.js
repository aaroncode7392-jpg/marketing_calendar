// ==========================================================
// 날씨·계절 연동 3D Mii 캐릭터 산책 광장 & 실시간 화면 연동 (window.PET)
// - 다마고치 버튼 제거 (순수 3D 산책 & 날씨·계절 공간)
// - 날씨별 복장 & 소품 자동 변화:
//   1) 더우면 / 맑고 따뜻하면: 반팔 (char_610708 / char_691105)
//   2) 비오면: 우산 들고 산책
//   3) 추우면: 코트와 목도리 착용 (char_*_coat)
//   4) 눈오면: 패딩 입고 우산 들고 산책 (char_*_pad + 우산)
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
      .pet-canvas-wrap{position:relative;z-index:3;height:265px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;}
      .pet-canvas{width:100%;height:265px;display:block;}
      .pet-walk-hint{position:absolute;bottom:7px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.45);backdrop-filter:blur(4px);color:#fff;font-size:11px;font-weight:700;padding:3px 10px;border-radius:999px;pointer-events:none;white-space:nowrap;z-index:4;}
      .pet-fx-layer{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;}
      .pet-float-item{position:absolute;font-size:24px;animation:petFloatUp .95s ease-out forwards;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2));}
      @keyframes petFloatUp{0%{opacity:1;transform:translate(-50%,0) scale(.6);}40%{opacity:1;transform:translate(-50%,-28px) scale(1.2);}100%{opacity:0;transform:translate(-50%,-64px) scale(.9);}}
    `;
    document.head.appendChild(st);
  }

  let activeMount = null;

  // 현재 월 기준 기본 계절 판별 (3~5: spring, 6~8: summer, 9~11: autumn, 12~2: winter)
  function getCurrentSeason() {
    const m = new Date().getMonth() + 1;
    if (m >= 3 && m <= 5) return 'spring';
    if (m >= 6 && m <= 8) return 'summer';
    if (m >= 9 && m <= 11) return 'autumn';
    return 'winter';
  }

  // 날씨 코드/기온에서 복장(short / coat / pad) · 우산(hasUmbrella) · 계절 배경(season) 결정
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

    // 복장 규칙:
    // 1) 눈오면: 패딩(pad) + 우산(hasUmbrella = true)
    // 2) 추우면: 코트와 목도리(coat) + (비 동반 시 우산)
    // 3) 비오면: 우산(hasUmbrella = true) + 기온에 맞는 복장
    // 4) 더우면/온화하면: 반팔(short)
    let outfit = 'short';
    if (isSnow) outfit = 'pad';
    else if (isCold) outfit = 'coat';
    else outfit = 'short';

    const hasUmbrella = isRain || isSnow;

    let badge = '🌤️ 산책하기 좋은 날';
    let line = '😊 잔디밭을 터치하면 두 분이 나란히 걸어가며 실시간으로 연동됩니다!';
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
      // summer
      skyGrad.addColorStop(0, '#0284C7');
      skyGrad.addColorStop(0.65, '#7DD3FC');
      skyGrad.addColorStop(1, '#E0F2FE');
    }
    ctx.fillStyle = skyGrad;
    ctx.fillRect(0, 0, W, horizonY + 10);

    // 2. 해 / 달 / 구름
    ctx.save();
    if (wx.isNight) {
      // 초승달/보름달 & 별
      ctx.fillStyle = '#FEF08A';
      ctx.shadowColor = '#FEF08A';
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(485, 82, 22, 0, Math.PI * 2);
      ctx.fill();
    } else if (!wx.isRain && !wx.isSnow) {
      // 따뜻한 태양과 빛무리
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

    // 뭉게구름 / 비구름
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
      // summer
      farHillColor = '#4ADE80';
      nearHillColor = '#22C55E';
      lawnTopColor = '#86EFAC';
      lawnBotColor = '#22C55E';
      pathColor = '#F1F5F9';
    }

    // 뒤쪽 먼 언덕
    ctx.fillStyle = farHillColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 12);
    ctx.quadraticCurveTo(145, horizonY - 48, 310, horizonY + 4);
    ctx.quadraticCurveTo(455, horizonY - 38, W, horizonY + 8);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 앞쪽 완만한 언덕
    ctx.fillStyle = nearHillColor;
    ctx.beginPath();
    ctx.moveTo(0, horizonY + 8);
    ctx.quadraticCurveTo(210, horizonY - 22, 410, horizonY + 10);
    ctx.quadraticCurveTo(510, horizonY - 10, W, horizonY + 12);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.closePath();
    ctx.fill();

    // 잔디 광장 바닥
    const lawnGrad = ctx.createLinearGradient(0, horizonY, 0, H);
    lawnGrad.addColorStop(0, lawnTopColor);
    lawnGrad.addColorStop(1, lawnBotColor);
    ctx.fillStyle = lawnGrad;
    ctx.fillRect(0, horizonY + 6, W, H - horizonY);

    // 광장 산책로 트랙
    ctx.fillStyle = pathColor;
    ctx.globalAlpha = wx.isRain ? 0.55 : 0.72;
    ctx.beginPath();
    ctx.ellipse(290, 384, 248, 38, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
    ctx.restore();

    // 4. 계절별 나무 & 공원 소품 (좌·우 배치)
    // 왼쪽 나무 (x=64, y=262), 오른쪽 나무 (x=516, y=266)
    drawSeasonTree(ctx, 62, 268, 1.0, wx, t);
    drawSeasonTree(ctx, 518, 272, 0.92, wx, t + 1.5);

    // 공원 벤치 & 가로등 (x=455, y=264)
    drawParkBenchAndLamp(ctx, 448, 266, wx);

    // 눈 오는 날 / 겨울에는 귀여운 눈사람 추가 (x=122, y=274)
    if (wx.isSnow || wx.season === 'winter') {
      drawSnowman(ctx, 122, 276);
    }

    // 비 오는 날 바닥 물웅덩이 파장(Ripples)
    if (wx.isRain && ripples) {
      ctx.save();
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
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

    // 5. 계절·날씨 하늘 입자 (빗줄기 / 눈송이 / 벚꽃잎 / 단풍잎 / 반짝이)
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
      // 흩날리는 분홍 벚꽃잎
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
      // 떨어지는 은행잎·단풍잎
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
      // 여름 햇살 반짝이
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

    // 나무 기둥
    ctx.fillStyle = '#78350F';
    ctx.beginPath();
    ctx.roundRect(-8, -58, 16, 62, 5);
    ctx.fill();

    // 계절별 수관(나뭇잎) 색상
    let c1 = '#22C55E', c2 = '#16A34A';
    if (wx.isSnow || wx.season === 'winter') {
      c1 = '#15803D';
      c2 = '#166534';
    } else if (wx.season === 'spring') {
      c1 = '#FBCFE8';
      c2 = '#F472B6';
    } else if (wx.season === 'autumn') {
      // 왼쪽 나무는 노란 은행나무, 오른쪽 나무는 붉은 단풍나무
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

      // 겨울/눈 오는 날 나뭇가지 위 소복한 눈 모자
      if (wx.isSnow || wx.season === 'winter') {
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(pf.dx, pf.dy - 4, pf.r * 0.85, Math.PI * 1.08, Math.PI * 1.92);
        ctx.fill();
      }
    });
    ctx.restore();
  }

  function drawParkBenchAndLamp(ctx, x, y, wx) {
    ctx.save();
    ctx.translate(x, y);
    // 가로등 기둥
    ctx.strokeStyle = '#334155';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(28, 0);
    ctx.lineTo(28, -78);
    ctx.stroke();
    // 가로등 램프 불빛
    ctx.fillStyle = (wx.isNight || wx.isRain || wx.isSnow) ? '#FDE047' : '#F8FAFC';
    if (wx.isNight || wx.isRain || wx.isSnow) {
      ctx.shadowColor = '#FDE047';
      ctx.shadowBlur = 14;
    }
    ctx.beginPath();
    ctx.arc(28, -82, 7.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // 나무 벤치
    ctx.fillStyle = '#92400E';
    ctx.fillRect(-24, -18, 42, 6);
    ctx.fillRect(-24, -10, 42, 5);
    ctx.fillStyle = '#334155';
    ctx.fillRect(-18, -5, 4, 8);
    ctx.fillRect(10, -5, 4, 8);
    if (wx.isSnow || wx.season === 'winter') {
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-24, -20, 42, 3);
    }
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
    // 빨간 목도리 & 당근 코
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
  // 정면(Front) · 좌측면(Left) · 우측면(Right) + 날씨별 복장(반팔/코트+목도리/패딩) + 우산 렌더링
  // ==========================================================
  function drawMii3DCharacter(ctx, charId, ch, t, wx) {
    const isFather = charId === '610708';
    const yaw = ch.yaw;
    const isWalking = ch.speed > 0.12;
    const isSideView = Math.abs(yaw) > 0.35 || isWalking;
    const facingLeft = yaw < -0.15;

    const outfit = wx.outfit || 'short'; // 'short' | 'coat' | 'pad'
    const viewKey = isSideView ? 'side' : 'front';
    const spriteKey = `${charId}_${outfit}_${viewKey}`;
    const fallbackKey = `${charId}_short_${viewKey}`;
    const img = loadedSprites[spriteKey] || loadedSprites[fallbackKey];
    if (!img || !img.complete || !img.naturalWidth) return;

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

    const jumpY = ch.y || 0;
    const depthScale = 1 + (ch.z || 0) * 0.003;
    const groundY = 398 + (ch.z || 0) * 0.85;
    const cx = ch.x;

    const targetH = (isFather ? 264 : 254) * depthScale;
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;

    // 1. 바닥 입체 그림자
    const jumpFactor = Math.max(0.55, 1 + (jumpY + bobY) / 140);
    ctx.save();
    const pedGrad = ctx.createRadialGradient(cx, groundY - 4, 4, cx, groundY - 4, 54 * depthScale * jumpFactor);
    pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    pedGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
    pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 4, 52 * depthScale * jumpFactor, 12 * depthScale * jumpFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 3D Mii 캐릭터 본체 (정면 / 좌측면 / 우측면)
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

    // 3. 비 오거나 눈 올 때 손에 들고 쓰는 3D 우산 (두 캐릭터 각각 착용!)
    if (wx.hasUmbrella) {
      drawHeldUmbrella(ctx, t, isFather, isSideView, outfit);
    }

    ctx.restore();
  }

  function drawHeldUmbrella(ctx, t, isFather, isSideView, outfit) {
    ctx.save();
    // 바깥쪽 손 위치에서 얼굴을 가리지 않고 머리 위로 자연스럽게 뻗는 3D 우산
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

    // 우산대 (캐노피 안쪽에서 손 위치까지 연결)
    ctx.strokeStyle = '#475569';
    ctx.lineWidth = 3.4;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, 6);
    ctx.lineTo(0, 18 + shaftLen);
    ctx.stroke();

    // J자 우산 손잡이 (손 아래에서 감싸쥐는 형태)
    ctx.strokeStyle = '#78350F';
    ctx.lineWidth = 4.0;
    ctx.beginPath();
    ctx.moveTo(0, 14 + shaftLen);
    ctx.lineTo(0, 24 + shaftLen);
    ctx.arc(isFather ? -5.5 : 5.5, 24 + shaftLen, 5.5, isFather ? 0 : Math.PI, isFather ? Math.PI : 0, !isFather);
    ctx.stroke();

    // 3D 입체 우산 돔 (아버님은 클래식 로열블루, 어머님은 화사한 로즈코랄)
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
    // 우산 아래 물결 스캘럽 라인
    ctx.quadraticCurveTo(44, 12, 22, 20);
    ctx.quadraticCurveTo(0, 12, -22, 20);
    ctx.quadraticCurveTo(-44, 12, -66, 20);
    ctx.closePath();
    ctx.fill();

    // 우산 꼭지
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
        <div class="pet-walk-hint">👆 잔디밭 어디든 터치하면 두 분이 함께 걸어갑니다</div>
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
        x: 205,
        z: 0,
        targetX: 205,
        targetZ: 0,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: 0,
        y: 0,
        vy: 0,
        pose: 'idle',
        nextWanderAt: performance.now() + 3400,
      },
      '691105': {
        x: 375,
        z: 4,
        targetX: 375,
        targetZ: 4,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: Math.PI,
        y: 0,
        vy: 0,
        pose: 'idle',
        nextWanderAt: performance.now() + 4200,
      },
    };

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
      ['610708', '691105'].forEach((id) => {
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

    // 우측 상단 날씨 배지를 누르면 날씨·계절별 복장(우산/코트+목도리/패딩+우산/반팔) 미리보기 순환 가능
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
          '610708': { x: Math.round(chars['610708'].targetX), z: Math.round(chars['610708'].targetZ) },
          '691105': { x: Math.round(chars['691105'].targetX), z: Math.round(chars['691105'].targetZ) },
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
          if (data.positions && !isFromMe && (!initialPositionsSynced || isRecentPos)) {
            ['610708', '691105'].forEach((id) => {
              const pos = data.positions[id];
              if (pos && Number.isFinite(pos.x)) {
                const tx = Math.max(105, Math.min(475, pos.x));
                const tz = Math.max(-24, Math.min(24, pos.z || 0));
                if (!initialPositionsSynced) {
                  chars[id].x = tx;
                  chars[id].z = tz;
                  chars[id].yaw = 0;
                  chars[id].targetYaw = 0;
                  chars[id].speed = 0;
                }
                chars[id].targetX = tx;
                chars[id].targetZ = tz;
                chars[id].nextWanderAt = performance.now() + (initialPositionsSynced ? 6500 : 3800);
              }
            });
            if (Math.abs(chars['691105'].targetX - chars['610708'].targetX) < 145) {
              const mid = (chars['610708'].targetX + chars['691105'].targetX) * 0.5;
              chars['610708'].targetX = Math.max(105, Math.min(330, mid - 75));
              chars['691105'].targetX = Math.max(250, Math.min(475, chars['610708'].targetX + 150));
              if (!initialPositionsSynced) {
                chars['610708'].x = chars['610708'].targetX;
                chars['691105'].x = chars['691105'].targetX;
              }
            }
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
                say(`👟 ${act.by}님이 광장에서 함께 산책 중이에요!`, 2600);
              }
            }
          }
        }, () => {});
      }
    } catch (e) { /* 오프라인 무시 */ }

    const WALK_LINES = [
      '💑 두 분이 나란히 걸으시니 보기만 해도 미소가 지어져요!',
      '☝️ 하하하! 오늘도 상쾌하게 산책하며 두뇌운동 화이팅입니다!',
      '🌸 호호호~ 다정하게 함께 걸으니 발걸음이 가벼워요 🥰',
      '✨ 오늘 날씨에 딱 맞는 복장으로 기분 좋게 산책해요 💕',
    ];
    let walkClickCount = 0;

    stageBox.querySelector('#petCanvasWrap').addEventListener('click', (e) => {
      const rect = cv.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 580;
      const clickY = ((e.clientY - rect.top) / rect.height) * 430;
      const clampedX = Math.max(95, Math.min(485, clickX));
      const clampedZ = Math.max(-24, Math.min(24, (clickY - 350) * 0.45));

      anim.tapRing = { x: clampedX, y: 392 + clampedZ * 0.85, r: 4, alpha: 1 };

      const centerTarget = Math.max(180, Math.min(400, clampedX));
      chars['610708'].targetX = centerTarget - 75;
      chars['610708'].targetZ = clampedZ;
      chars['691105'].targetX = centerTarget + 75;
      chars['691105'].targetZ = Math.max(-24, Math.min(24, clampedZ + 3));
      chars['610708'].nextWanderAt = performance.now() + 6500;
      chars['691105'].nextWanderAt = performance.now() + 6500;

      if (typeof beep === 'function') beep(580, 0.05);
      spawnParticles(['✨', '❤️']);
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

      // ---- 자율 산책 & 정면/좌측/우측 3D 방향 전환 업데이트 ----
      ['610708', '691105'].forEach((id, idx) => {
        const ch = chars[id];
        if (now > ch.nextWanderAt) {
          const other = chars[id === '610708' ? '691105' : '610708'];
          const minX = idx === 0 ? 105 : 255;
          const maxX = idx === 0 ? 325 : 475;
          let nextX = minX + Math.random() * (maxX - minX);
          if (Math.abs(nextX - other.targetX) < 145) {
            nextX = idx === 0 ? Math.max(105, other.targetX - 150) : Math.min(475, other.targetX + 150);
          }
          ch.targetX = nextX;
          ch.targetZ = -20 + Math.random() * 40;
          ch.nextWanderAt = now + 3800 + Math.random() * 2600;
        }

        const dx = ch.targetX - ch.x;
        const dz = ch.targetZ - ch.z;
        const dist = Math.hypot(dx, dz);

        if (dist > 3.5) {
          const moveStep = Math.min(dist, 2.0);
          ch.x += (dx / dist) * moveStep;
          ch.z += (dz / dist) * moveStep;
          ch.speed = moveStep;
          ch.walkPhase += 0.21;
          ch.targetYaw = dx < -1 ? -1.2 : dx > 1 ? 1.2 : 0;
        } else {
          ch.speed = 0;
          ch.targetYaw = 0;
        }

        ch.yaw = lerpAngle(ch.yaw, ch.targetYaw, 0.18);

        if (ch.y < 0 || ch.vy !== 0) {
          ch.y += ch.vy;
          ch.vy += 0.52;
          if (ch.y >= 0) {
            ch.y = 0;
            ch.vy = 0;
          }
        }
      });

      ctx.clearRect(0, 0, 580, 430);

      // 1. 계절·날씨별 풍경 배경 공간 렌더링
      drawSceneryBackground(ctx, t, wx, bgParticles, ripples);

      // 2. 터치 지점 물결 링 표시
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

      // 3. z 깊이 순서대로 두 3D Mii 캐릭터 렌더링
      const order = ['610708', '691105'].sort((a, b) => chars[a].z - chars[b].z);
      order.forEach((id) => {
        drawMii3DCharacter(ctx, id, chars[id], t, wx);
      });

      // 4. 두 분 사이 하트
      const midX = (chars['610708'].x + chars['691105'].x) * 0.5;
      const midY = 215 + Math.sin(t * 3.2) * 5;
      ctx.save();
      ctx.font = '28px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', midX, midY);
      ctx.restore();

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

  window.PET = { mountHomeTamagotchi, onWeather, setPreview, getPetState };
})();
