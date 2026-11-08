// ==========================================================
// 날씨 아래 닌텐도 Wii (Mii) 3D 캐릭터 광장 & 두 화면 실시간 연동 (window.PET)
// - 왼쪽: 610708 닌텐도 Wii(Mii) 3D 캐릭터 (정면: char_610708.png / 좌·우 측면 보행: char_610708_side.png)
// - 오른쪽: 691105 닌텐도 Wii(Mii) 3D 캐릭터 (정면: char_691105.png / 좌·우 측면 보행: char_691105_side.png)
// 1) 정면·좌측·우측 3D 전환 및 자율 산책: 광장을 걸어 다니며 이동 방향에 따라 정면·좌측면·우측면 3D 모습이 자연스럽게 전환됨
// 2) 잔디밭 터치 이동: 화면 잔디밭 어디든 터치하면 캐릭터가 그 방향으로 몸을 돌려 걸어감
// 3) 610708 ↔ 691105 실시간 화면 연동 (Firestore onSnapshot):
//    - 상대방 접속 여부 실시간 표시 (💑 함께 접속 중)
//    - 한쪽에서 걸어가거나 [👋 반갑게 인사] / [💐 축하 꽃다발] / [🍵 다과 나누기]를 누르면 상대방 화면에서도 즉시 똑같이 걸어가고 반응함
// ==========================================================
(function () {
  const SHARED_DOC_ID = 'pet-plaza-610708-691105';
  const PRESENCE_TTL_MS = 35000;
  const HEARTBEAT_MS = 10000;

  const CHAR_ASSETS = {
    '610708_front': 'assets/pet/char_610708.png?v=3',
    '610708_side': 'assets/pet/char_610708_side.png?v=3',
    '691105_front': 'assets/pet/char_691105.png?v=3',
    '691105_side': 'assets/pet/char_691105_side.png?v=3',
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

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  function getMyId() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    const mid = m && String(m.birthdate || m.id || '');
    if (mid === '610708' || mid === '691105') return mid;
    return '610708';
  }

  function getPetState() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m) {
      if (!m.petState || typeof m.petState !== 'object') {
        const baseLv = Math.max(1, Math.min(10, Math.floor((m.streak || 1) / 2) + 1));
        m.petState = {
          lv: baseLv,
          exp: 30,
          fedDay: null,
          snackDay: null,
          petCount: 0,
        };
      }
      return m.petState;
    }
    return { lv: 1, exp: 30, fedDay: null, snackDay: null, petCount: 0 };
  }

  function savePetState() {
    if (typeof saveMember === 'function') saveMember();
  }

  function isSessionDoneToday() {
    if (window.GLASS && typeof GLASS.todayDone === 'function') return GLASS.todayDone();
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (!m) return false;
    return m.lastDay === todayKey();
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
      .pet-stage-box{position:relative;margin-top:12px;border-radius:20px;overflow:hidden;border:2.5px solid rgba(255,255,255,.85);box-shadow:inset 0 2px 12px rgba(255,255,255,.45),0 8px 20px rgba(15,23,42,.12);background:linear-gradient(180deg,#8EC5FC 0%,#E0C3FC 58%,#B8E994 58%,#78E08F 100%);transition:background .5s ease;user-select:none;-webkit-user-select:none;}
      .pet-stage-box.wx-rain{background:linear-gradient(180deg,#536976 0%,#BBD2C5 58%,#7F9F80 58%,#5B7A5C 100%);}
      .pet-stage-box.wx-snow{background:linear-gradient(180deg,#83A4D4 0%,#D7E1EC 58%,#F1F5F9 58%,#E2E8F0 100%);}
      .pet-stage-box.wx-night{background:linear-gradient(180deg,#141E30 0%,#243B55 58%,#3A5A40 58%,#2D4732 100%);}
      .pet-hud{position:relative;z-index:4;display:flex;justify-content:space-between;align-items:center;padding:8px 11px 0;gap:6px;flex-wrap:nowrap;}
      .pet-lv-pill{display:inline-flex;align-items:center;gap:5px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);padding:4px 9px;border-radius:999px;font-family:'Jua';font-size:13.5px;color:#1E293B;box-shadow:0 2px 8px rgba(0,0,0,.1);white-space:nowrap;}
      .pet-exp-track{width:48px;height:8px;background:#E2E8F0;border-radius:999px;overflow:hidden;}
      .pet-exp-fill{height:100%;background:linear-gradient(90deg,#FF6B6B,#FF8E53);border-radius:999px;transition:width .35s ease;}
      .pet-sync-pill{display:inline-flex;align-items:center;gap:4px;background:rgba(255,255,255,.9);color:#0F172A;font-size:11.5px;font-weight:800;padding:4px 9px;border-radius:999px;box-shadow:0 2px 6px rgba(0,0,0,.08);white-space:nowrap;}
      .pet-sync-dot{width:7px;height:7px;border-radius:50%;background:#10B981;display:inline-block;box-shadow:0 0 0 2px rgba(16,185,129,.25);}
      .pet-wx-pill{background:rgba(15,23,42,.62);backdrop-filter:blur(6px);color:#fff;font-size:11.5px;font-weight:700;padding:4px 9px;border-radius:999px;display:inline-flex;align-items:center;gap:3px;white-space:nowrap;}
      .pet-bubble-wrap{position:relative;z-index:4;padding:6px 12px 0;display:flex;justify-content:center;}
      .pet-bubble{background:rgba(255,255,255,.96);border:2px solid #FDE68A;border-radius:16px;padding:6px 12px;font-family:'Jua';font-size:14.5px;color:#1E293B;line-height:1.35;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.1);max-width:96%;word-break:keep-all;position:relative;animation:pop .25s ease;}
      .pet-bubble::after{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%) rotate(45deg);width:11px;height:11px;background:#fff;border-right:2px solid #FDE68A;border-bottom:2px solid #FDE68A;}
      .pet-canvas-wrap{position:relative;z-index:3;height:225px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;}
      .pet-canvas{width:100%;max-width:360px;height:225px;display:block;}
      .pet-walk-hint{position:absolute;bottom:4px;left:50%;transform:translateX(-50%);background:rgba(15,23,42,.48);color:#fff;font-size:11px;font-weight:700;padding:2px 9px;border-radius:999px;pointer-events:none;white-space:nowrap;z-index:4;}
      .pet-fx-layer{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;}
      .pet-float-item{position:absolute;font-size:24px;animation:petFloatUp .95s ease-out forwards;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2));}
      @keyframes petFloatUp{0%{opacity:1;transform:translate(-50%,0) scale(.6);}40%{opacity:1;transform:translate(-50%,-28px) scale(1.2);}100%{opacity:0;transform:translate(-50%,-64px) scale(.9);}}
      .pet-actions{position:relative;z-index:4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:6px 10px 10px;background:rgba(255,255,255,.55);backdrop-filter:blur(6px);}
      .pet-act-btn{border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.92);border-radius:13px;padding:8px 4px;font-family:'Jua';font-size:15px;color:#1E293B;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;gap:4px;transition:transform .12s,background .15s;}
      .pet-act-btn:active{transform:scale(.94);}
      .pet-act-btn.ready-feed{background:linear-gradient(135deg,#FFF3BF,#FFE066);border-color:#FCC419;color:#7C4A00;animation:petFeedGlow 1.4s ease-in-out infinite;}
      @keyframes petFeedGlow{0%,100%{box-shadow:0 0 0 0 rgba(252,196,25,.55);}50%{box-shadow:0 0 0 7px rgba(252,196,25,0);}}
      .pet-act-btn.done-feed{opacity:.75;}
    `;
    document.head.appendChild(st);
  }

  let activeMount = null;

  function parseWeatherState(brief) {
    const hour = new Date().getHours();
    const isNight = brief && brief.isDay !== undefined ? !brief.isDay : (hour >= 19 || hour < 6);
    const code = brief && Number.isFinite(brief.code) ? brief.code : 0;
    const temp = brief && Number.isFinite(brief.temp) ? brief.temp : 16;
    const isRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isCold = temp <= 6;
    const isHot = temp >= 28;
    const prop = isRain ? 'umbrella' : null;

    let skyClass = '';
    if (isRain) skyClass = 'wx-rain';
    else if (isSnow) skyClass = 'wx-snow';
    else if (isNight) skyClass = 'wx-night';

    let badge = '☀️ 맑음';
    if (isRain) badge = '☂️ 비 · 우산';
    else if (isSnow) badge = '⛄ 눈 조심';
    else if (isCold) badge = `🧣 ${temp}° 쌀쌀`;
    else if (isHot) badge = `🕶️ ${temp}° 더움`;
    else if (isNight) badge = `🌙 ${temp}° 밤`;
    else if (brief && Number.isFinite(brief.temp)) badge = `🌤️ ${temp}° 맑음`;

    return { isNight, isRain, isSnow, isCold, isHot, prop, skyClass, badge, temp };
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
  // 정면(Front) · 좌측면(Left) · 우측면(Right) 3D Mii 캐릭터 렌더링
  // ==========================================================
  function drawMii3DCharacter(ctx, charId, ch, t, wx) {
    const isFather = charId === '610708';
    const yaw = ch.yaw; // 0: 정면, -PI/2: 좌측, +PI/2: 우측
    const isWalking = ch.speed > 0.12;
    const isSideView = Math.abs(yaw) > 0.35 || isWalking;
    const facingLeft = yaw < -0.15;

    const frontImg = loadedSprites[`${charId}_front`];
    const sideImg = loadedSprites[`${charId}_side`];
    const img = isSideView ? (sideImg || frontImg) : (frontImg || sideImg);
    if (!img || !img.complete || !img.naturalWidth) return;

    const walkPhase = ch.walkPhase;
    const bobY = isWalking
      ? -Math.abs(Math.sin(walkPhase)) * 8.5
      : Math.sin(t * 2.8 + (isFather ? 0 : 1.2)) * 2.5;
    const walkTilt = isWalking
      ? Math.sin(walkPhase) * 0.065
      : Math.sin(t * 2.2 + (isFather ? 0 : 1.0)) * 0.018;
    const stepSquashX = isWalking
      ? 1 + Math.cos(walkPhase * 2) * 0.035
      : 1 + Math.sin(t * 3.0) * 0.012;
    const stepSquashY = isWalking
      ? 1 - Math.cos(walkPhase * 2) * 0.035
      : 1 - Math.sin(t * 3.0) * 0.012;

    const jumpY = ch.y || 0;
    const depthScale = 1 + (ch.z || 0) * 0.003;
    const groundY = 382 + (ch.z || 0) * 0.85;
    const cx = ch.x;

    const targetH = (isFather ? 316 : 306) * depthScale;
    const targetW = (img.naturalWidth / img.naturalHeight) * targetH;

    // 1. 바닥 입체 그림자
    const jumpFactor = Math.max(0.55, 1 + (jumpY + bobY) / 140);
    ctx.save();
    const pedGrad = ctx.createRadialGradient(cx, groundY - 4, 4, cx, groundY - 4, 56 * depthScale * jumpFactor);
    pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
    pedGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
    pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
    ctx.fillStyle = pedGrad;
    ctx.beginPath();
    ctx.ellipse(cx, groundY - 4, 54 * depthScale * jumpFactor, 12 * depthScale * jumpFactor, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. 3D Mii 캐릭터 본체 (정면 / 좌측면 / 우측면 3D 회전 전환)
    ctx.save();
    ctx.translate(cx, groundY + jumpY + bobY);
    ctx.rotate(walkTilt);

    // 좌측을 볼 때는 측면 에셋을 좌우 반전(-1), 회전 중에는 자연스러운 3D 원근 스케일 적용
    const flipX = (isSideView && facingLeft) ? -1 : 1;
    const turnPerspective = isSideView
      ? Math.max(0.84, Math.min(1.0, 0.78 + Math.abs(Math.sin(yaw)) * 0.25))
      : Math.max(0.86, Math.cos(yaw));
    ctx.scale(flipX * stepSquashX * turnPerspective, stepSquashY);

    ctx.shadowColor = 'rgba(15, 23, 42, 0.28)';
    ctx.shadowBlur = 14;
    ctx.shadowOffsetY = 6;
    ctx.drawImage(img, -targetW / 2, -targetH + 6, targetW, targetH);
    ctx.restore();

    // 3. 비 오는 날 우산 소품
    if (wx.prop === 'umbrella' && isFather) {
      ctx.save();
      ctx.translate(cx, groundY + jumpY + bobY - 145);
      draw3DUmbrella(ctx, t);
      ctx.restore();
    }
  }

  function draw3DUmbrella(ctx, t) {
    ctx.save();
    ctx.translate(35, -140 + Math.sin(t * 3) * 2);
    ctx.rotate(0.06);
    ctx.strokeStyle = '#7C4A00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 105);
    ctx.arc(-7, 105, 7, 0, Math.PI);
    ctx.stroke();
    const uGrad = ctx.createRadialGradient(-18, -12, 6, 0, 0, 90);
    uGrad.addColorStop(0, '#FF9F1C');
    uGrad.addColorStop(1, '#E03131');
    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.arc(0, 10, 88, Math.PI, 0);
    ctx.closePath();
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

    const state = getPetState();
    const myId = getMyId();
    const partnerId = myId === '610708' ? '691105' : '610708';
    const doneToday = isSessionDoneToday();
    const today = todayKey();
    const giftedToday = state.fedDay === today;

    let savedBrief = null;
    try { savedBrief = JSON.parse(localStorage.getItem('wxBrief') || 'null'); } catch (e) { savedBrief = null; }
    let wx = parseWeatherState(savedBrief);

    const stageBox = document.createElement('div');
    stageBox.className = `pet-stage-box ${wx.skyClass}`;
    stageBox.id = 'petStageBox';

    const initLine = () => {
      if (doneToday && !giftedToday) return '🎉 오늘 두뇌운동을 멋지게 끝내셨네요! 아래 [💐 축하 꽃다발]을 눌러 보세요!';
      if (wx.isRain) return '☂️ 오늘은 비 소식이 있어요! 외출하실 때 우산 꼭 챙기세요 😊';
      if (wx.isCold || wx.isSnow) return '🧣 날씨가 쌀쌀해요! 따뜻하게 입으시고 감기 조심하세요 💕';
      return '😊 잔디밭을 터치하면 좌·우로 걸어가고, 두 분의 화면이 실시간으로 연동됩니다!';
    };

    stageBox.innerHTML = `
      <div class="pet-hud">
        <div class="pet-lv-pill">
          <span>✨ 활력 <b id="petLvTxt">Lv.${state.lv}</b></span>
          <div class="pet-exp-track"><div class="pet-exp-fill" id="petExpFill" style="width:${Math.min(100, state.exp)}%"></div></div>
        </div>
        <div class="pet-sync-pill" id="petSyncPill"><span class="pet-sync-dot"></span> 실시간 연동 광장</div>
        <div class="pet-wx-pill" id="petWxPill">${wx.badge}</div>
      </div>
      <div class="pet-bubble-wrap">
        <div class="pet-bubble" id="petBubble">${initLine()}</div>
      </div>
      <div class="pet-canvas-wrap" id="petCanvasWrap">
        <canvas class="pet-canvas" id="petCanvas" width="580" height="430"></canvas>
        <div class="pet-walk-hint">👆 잔디밭 어디든 터치하면 걸어갑니다</div>
        <div class="pet-fx-layer" id="petFxLayer"></div>
      </div>
      <div class="pet-actions">
        <button type="button" class="pet-act-btn" id="petBtnStroke">👋 반갑게 인사</button>
        <button type="button" class="pet-act-btn ${doneToday && !giftedToday ? 'ready-feed' : giftedToday ? 'done-feed' : ''}" id="petBtnFeed">
          💐 ${giftedToday ? '축하 완료' : doneToday ? '축하 꽃다발!' : '꽃다발 선물'}
        </button>
        <button type="button" class="pet-act-btn" id="petBtnSnack">🍵 다과 나누기</button>
      </div>
    `;

    hero.appendChild(stageBox);

    const bubbleEl = stageBox.querySelector('#petBubble');
    const lvTxtEl = stageBox.querySelector('#petLvTxt');
    const expFillEl = stageBox.querySelector('#petExpFill');
    const syncPillEl = stageBox.querySelector('#petSyncPill');
    const wxPillEl = stageBox.querySelector('#petWxPill');
    const fxLayer = stageBox.querySelector('#petFxLayer');
    const cv = stageBox.querySelector('#petCanvas');
    const ctx = cv.getContext('2d');
    const feedBtn = stageBox.querySelector('#petBtnFeed');

    const chars = {
      '610708': {
        x: 200,
        z: 0,
        targetX: 200,
        targetZ: 0,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: 0,
        y: 0,
        vy: 0,
        pose: 'idle',
        nextWanderAt: performance.now() + 2600,
      },
      '691105': {
        x: 380,
        z: 4,
        targetX: 380,
        targetZ: 4,
        yaw: 0,
        targetYaw: 0,
        speed: 0,
        walkPhase: Math.PI,
        y: 0,
        vy: 0,
        pose: 'idle',
        nextWanderAt: performance.now() + 3400,
      },
    };

    const anim = {
      foodEmoji: null,
      foodProg: 0,
      tapRing: null,
    };

    function say(text) {
      bubbleEl.style.animation = 'none';
      void bubbleEl.offsetWidth;
      bubbleEl.style.animation = 'pop .25s ease';
      bubbleEl.textContent = text;
    }

    function triggerJumpBoth(pose = 'wave') {
      ['610708', '691105'].forEach((id) => {
        chars[id].vy = -6.2;
        chars[id].pose = pose;
      });
    }

    function addExp(amount) {
      state.exp = (state.exp || 0) + amount;
      let leveledUp = false;
      while (state.exp >= 100) {
        state.exp -= 100;
        state.lv = (state.lv || 1) + 1;
        leveledUp = true;
      }
      lvTxtEl.textContent = `Lv.${state.lv}`;
      expFillEl.style.width = `${Math.min(100, state.exp)}%`;
      savePetState();
      if (leveledUp) {
        if (typeof confetti === 'function') confetti(6);
        if (typeof beep === 'function') { beep(523, 0.1); setTimeout(() => beep(659, 0.1), 100); setTimeout(() => beep(784, 0.18), 200); }
      }
      return leveledUp;
    }

    function spawnParticles(emojis) {
      for (let i = 0; i < emojis.length; i++) {
        const sp = document.createElement('span');
        sp.className = 'pet-float-item';
        sp.textContent = emojis[i];
        sp.style.left = `${26 + Math.random() * 48}%`;
        sp.style.top = `${28 + Math.random() * 28}%`;
        sp.style.animationDelay = `${i * 0.08}s`;
        fxLayer.appendChild(sp);
        setTimeout(() => sp.remove(), 1100);
      }
    }

    // ==========================================================
    // Firestore 실시간 양방향 화면 연동 (610708 <-> 691105)
    // ==========================================================
    let sharedRef = null;
    let unsubShared = null;
    let heartbeatTimer = null;
    let lastEventSeq = null;
    let initialPositionsSynced = false;

    function pushSharedAction(actionData) {
      if (!sharedRef) return;
      const payload = {
        type: 'petPlaza',
        updatedAt: new Date().toISOString(),
        lv: state.lv,
        exp: state.exp,
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

          if (Number.isFinite(data.lv) && (data.lv > state.lv || (data.lv === state.lv && (data.exp || 0) > state.exp))) {
            state.lv = data.lv;
            state.exp = data.exp || 0;
            lvTxtEl.textContent = `Lv.${state.lv}`;
            expFillEl.style.width = `${Math.min(100, state.exp)}%`;
          }

          const isRecentPos = data.updatedAt && (Date.now() - new Date(data.updatedAt).getTime() < 20000);
          if (data.positions && (initialPositionsSynced || isRecentPos)) {
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
            // 두 캐릭터가 서로 겹치지 않도록 최소 145px 간격 보장
            if (Math.abs(chars['691105'].targetX - chars['610708'].targetX) < 145) {
              const mid = (chars['610708'].targetX + chars['691105'].targetX) * 0.5;
              chars['610708'].targetX = Math.max(105, Math.min(330, mid - 75));
              chars['691105'].targetX = Math.max(250, Math.min(475, chars['610708'].targetX + 150));
              if (!initialPositionsSynced) {
                chars['610708'].x = chars['610708'].targetX;
                chars['691105'].x = chars['691105'].targetX;
              }
            }
            initialPositionsSynced = true;
          }

          const act = data.lastAction;
          if (act && act.seq) {
            if (lastEventSeq === null) {
              lastEventSeq = act.seq;
            } else if (act.seq !== lastEventSeq) {
              lastEventSeq = act.seq;
              if (act.by !== myId) {
                if (typeof beep === 'function') beep(660, 0.08);
                triggerJumpBoth('wave');
                if (act.kind === 'greet') {
                  spawnParticles(['❤️', '👋', '✨']);
                  say(`💌 ${act.by}님이 반갑게 인사를 보냈어요! "${act.text || '오늘도 화이팅!'}"`);
                } else if (act.kind === 'flower') {
                  anim.foodEmoji = '💐';
                  anim.foodProg = 1;
                  spawnParticles(['💐', '🎉', '❤️']);
                  say(`💐 ${act.by}님이 축하 꽃다발을 보냈어요!`);
                } else if (act.kind === 'tea') {
                  anim.foodEmoji = act.emoji || '🍵';
                  anim.foodProg = 1;
                  spawnParticles([act.emoji || '🍵', '😊', '💕']);
                  say(`${act.emoji || '🍵'} ${act.by}님이 따뜻한 다과를 대접했어요!`);
                } else if (act.kind === 'walk') {
                  say(`👟 ${act.by}님이 광장에서 산책 중이에요!`);
                }
              }
            }
          }
        }, () => {});
      }
    } catch (e) { /* 오프라인 무시 */ }

    const GREET_LINES = [
      '💑 두 분이 함께 걸으며 활짝 웃으시니 보기만 해도 기분이 좋아져요!',
      '☝️ 하하하! 오늘도 활기차게 두뇌운동 화이팅입니다!',
      '🌸 호호호~ 반갑게 인사 나누니 마음이 참 따뜻하네요 🥰',
      '✨ 정면·측면 어디서 봐도 참 다정하고 멋지신 두 분이에요 💕',
      '💪 오늘도 건강하고 웃음 가득한 하루 보내세요!',
    ];

    function onGreet() {
      if (typeof beep === 'function') beep(660, 0.08);
      chars['610708'].x = 205;
      chars['610708'].z = 4;
      chars['610708'].targetX = 205;
      chars['610708'].targetZ = 4;
      chars['610708'].yaw = 0;
      chars['610708'].targetYaw = 0;
      chars['610708'].speed = 0;
      chars['691105'].x = 375;
      chars['691105'].z = 4;
      chars['691105'].targetX = 375;
      chars['691105'].targetZ = 4;
      chars['691105'].yaw = 0;
      chars['691105'].targetYaw = 0;
      chars['691105'].speed = 0;
      chars['610708'].nextWanderAt = performance.now() + 5000;
      chars['691105'].nextWanderAt = performance.now() + 5000;
      triggerJumpBoth('wave');
      spawnParticles(['❤️', '👏', '✨']);
      state.petCount = (state.petCount || 0) + 1;
      const up = addExp(5);
      const line = up
        ? `🎊 우와! 오늘의 활력 지수가 Lv.${state.lv}로 올랐어요! 늘 건강하세요!`
        : GREET_LINES[state.petCount % GREET_LINES.length];
      say(line);
      pushSharedAction({ kind: 'greet', text: line });
    }

    stageBox.querySelector('#petCanvasWrap').addEventListener('click', (e) => {
      const rect = cv.getBoundingClientRect();
      const clickX = ((e.clientX - rect.left) / rect.width) * 580;
      const clickY = ((e.clientY - rect.top) / rect.height) * 430;
      const clampedX = Math.max(95, Math.min(485, clickX));
      const clampedZ = Math.max(-24, Math.min(24, (clickY - 345) * 0.45));

      anim.tapRing = { x: clampedX, y: 382 + clampedZ * 0.85, r: 4, alpha: 1 };

      // 터치한 위치로 두 분이 겹치지 않게(150px 간격) 나란히 걸어감
      const centerTarget = Math.max(180, Math.min(400, clampedX));
      chars['610708'].targetX = centerTarget - 75;
      chars['610708'].targetZ = clampedZ;
      chars['691105'].targetX = centerTarget + 75;
      chars['691105'].targetZ = Math.max(-24, Math.min(24, clampedZ + 3));
      chars['610708'].nextWanderAt = performance.now() + 6500;
      chars['691105'].nextWanderAt = performance.now() + 6500;

      if (typeof beep === 'function') beep(580, 0.05);
      spawnParticles(['✨', '❤️']);
      pushSharedAction({ kind: 'walk' });
    });

    stageBox.querySelector('#petBtnStroke').addEventListener('click', () => {
      onGreet();
    });

    stageBox.querySelector('#petBtnFeed').addEventListener('click', () => {
      const done = isSessionDoneToday();
      const t = todayKey();
      if (state.fedDay === t) {
        if (typeof beep === 'function') beep(587, 0.08);
        triggerJumpBoth('cheer');
        spawnParticles(['💐', '🌺', '✨']);
        say('💐 향기로운 축하 꽃다발 덕분에 오늘 하루가 더욱 특별해요!');
        pushSharedAction({ kind: 'flower' });
        return;
      }
      if (!done) {
        if (typeof beep === 'function') beep(440, 0.1);
        anim.foodEmoji = '🌷';
        anim.foodProg = 1;
        triggerJumpBoth('wave');
        spawnParticles(['🌷', '💪']);
        addExp(4);
        say('🌷 응원의 꽃 한 송이! 아래 [시작하기]로 오늘 두뇌운동을 마치면 풍성한 축하 꽃다발을 드릴 수 있어요!');
        pushSharedAction({ kind: 'flower' });
        return;
      }
      state.fedDay = t;
      feedBtn.classList.remove('ready-feed');
      feedBtn.classList.add('done-feed');
      feedBtn.innerHTML = '💐 축하 완료';
      anim.foodEmoji = '💐';
      anim.foodProg = 1;
      triggerJumpBoth('cheer');
      spawnParticles(['💐', '🎉', '❤️', '🌟']);
      const up = addExp(45);
      if (up) say(`🎉 오늘의 두뇌운동 완주 축하 꽃다발! 활력 지수가 Lv.${state.lv}로 올라갔어요!`);
      else say('💐 오늘 두뇌운동 완주를 진심으로 축하드려요! 정말 멋지십니다!');
      pushSharedAction({ kind: 'flower' });
    });

    stageBox.querySelector('#petBtnSnack').addEventListener('click', () => {
      const t = todayKey();
      const treats = ['🍵', '☕', '🍊', '🍎', '🍰'];
      const pickTreat = treats[Math.floor(Math.random() * treats.length)];
      if (typeof beep === 'function') beep(740, 0.08);
      anim.foodEmoji = pickTreat;
      anim.foodProg = 1;
      triggerJumpBoth('wave');
      spawnParticles([pickTreat, '😊', '💕']);
      if (state.snackDay !== t) {
        state.snackDay = t;
        const up = addExp(18);
        if (up) say(`🎊 따뜻한 다과 시간과 함께 활력 지수가 Lv.${state.lv}로 올랐어요!`);
        else say(`${pickTreat} 향긋한 차와 다과를 함께 나누니 기분이 참 좋네요 🥰`);
      } else {
        addExp(3);
        say(`${pickTreat} 여유롭게 차 한잔 나누며 오늘도 편안한 시간 보내세요 😊`);
      }
      pushSharedAction({ kind: 'tea', emoji: pickTreat });
    });

    const bgParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 580,
      y: Math.random() * 430,
      s: 1.2 + Math.random() * 2.2,
      v: 1.5 + Math.random() * 2.5,
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
          const moveStep = Math.min(dist, 2.1);
          ch.x += (dx / dist) * moveStep;
          ch.z += (dz / dist) * moveStep;
          ch.speed = moveStep;
          ch.walkPhase += 0.22;
          // 이동 방향으로 3D 회전 (왼쪽 이동 시 -1.2 rad 좌측면, 오른쪽 이동 시 +1.2 rad 우측면)
          ch.targetYaw = dx < -1 ? -1.2 : dx > 1 ? 1.2 : 0;
        } else {
          ch.speed = 0;
          // 멈춰 있을 때는 정면(0)을 바라봄
          ch.targetYaw = 0;
        }

        ch.yaw = lerpAngle(ch.yaw, ch.targetYaw, 0.18);

        if (ch.y < 0 || ch.vy !== 0) {
          ch.y += ch.vy;
          ch.vy += 0.52;
          if (ch.y >= 0) {
            ch.y = 0;
            ch.vy = 0;
            ch.pose = 'idle';
          }
        }
      });

      if (anim.foodProg > 0) anim.foodProg = Math.max(0, anim.foodProg - 0.018);

      ctx.clearRect(0, 0, 580, 430);

      // 1. 잔디밭 원형 산책 트랙
      ctx.save();
      ctx.fillStyle = 'rgba(255, 255, 255, 0.18)';
      ctx.beginPath();
      ctx.ellipse(290, 380, 240, 36, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 2. 날씨 입자
      ctx.save();
      if (wx.isRain) {
        ctx.strokeStyle = 'rgba(255,255,255,0.58)';
        ctx.lineWidth = 2.2;
        for (const p of bgParticles) {
          p.y = (p.y + p.v * 3.4) % 430;
          p.x = (p.x - 0.9 + 580) % 580;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3.5, p.y + 14);
          ctx.stroke();
        }
      } else if (wx.isSnow) {
        ctx.fillStyle = 'rgba(255,255,255,0.88)';
        for (const p of bgParticles) {
          p.y = (p.y + p.v * 0.75) % 430;
          p.x = (p.x + Math.sin(t + p.y * 0.03) * 0.7 + 580) % 580;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 1.9, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = wx.isNight ? 'rgba(255,244,180,0.78)' : 'rgba(255,255,255,0.48)';
        for (let i = 0; i < 12; i++) {
          const p = bgParticles[i];
          const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
          ctx.beginPath();
          ctx.arc(p.x, p.y * 0.52, p.s * (1 + pulse), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      // 터치 지점 링 표시
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
      const midY = 205 + Math.sin(t * 3.2) * 5;
      ctx.save();
      ctx.font = '30px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', midX, midY);
      ctx.restore();

      // 5. 꽃다발/다과 전달 애니메이션
      if (anim.foodProg > 0 && anim.foodEmoji) {
        ctx.save();
        const fx = midX + 85 * anim.foodProg;
        const fy = 215 - Math.sin(anim.foodProg * Math.PI) * 45;
        ctx.font = '50px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(anim.foodEmoji, fx, fy);
        ctx.restore();
      }

      rafId = requestAnimationFrame(renderLoop);
    }

    rafId = requestAnimationFrame(renderLoop);

    activeMount = {
      updateWeather(brief) {
        wx = parseWeatherState(brief);
        stageBox.className = `pet-stage-box ${wx.skyClass}`;
        wxPillEl.textContent = wx.badge;
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

  window.PET = { mountHomeTamagotchi, onWeather, getPetState };
})();
