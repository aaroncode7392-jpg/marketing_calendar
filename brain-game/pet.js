// ==========================================================
// 날씨 아래 3D 다마고치 영역 (window.PET)
// - 왼쪽: 610708 3D 캐릭터 (assets/pet/char_610708.png)
// - 오른쪽: 691105 3D 캐릭터 (assets/pet/char_691105.png)
// - 두 분의 3D 캐릭터가 항상 나란히 함께 서서 반겨주는 다마고치 스테이지
// 1) 실시간 오늘 날씨(맑음·비·눈·추위·더위·밤)에 맞춰 배경·우산·대사 자동 변화
// 2) 캐릭터 터치 시 3D 입체 기울기·점프·하트 파티클·쓰다듬기 반응과 다정한 말풍선 대사
// 3) 오늘의 두뇌운동 완료 시 '특식 밥 주기' & '간식 주기'로 친밀도 게이지 상승 및 레벨업
// ==========================================================
(function () {
  const CHAR_ASSETS = {
    '610708': 'assets/pet/char_610708.png',
    '691105': 'assets/pet/char_691105.png',
  };
  const loadedChars = {};

  function preloadCharAssets(onLoadCb) {
    Object.keys(CHAR_ASSETS).forEach((id) => {
      if (loadedChars[id]) return;
      const img = new Image();
      img.onload = () => {
        loadedChars[id] = img;
        if (typeof onLoadCb === 'function') onLoadCb(id, img);
      };
      img.src = CHAR_ASSETS[id];
    });
  }
  preloadCharAssets();

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

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
      .pet-stage-box{position:relative;margin-top:12px;border-radius:20px;overflow:hidden;border:2.5px solid rgba(255,255,255,.85);box-shadow:inset 0 2px 12px rgba(255,255,255,.45),0 8px 20px rgba(15,23,42,.12);background:linear-gradient(180deg,#8EC5FC 0%,#E0C3FC 64%,#B8E994 64%,#78E08F 100%);transition:background .5s ease;user-select:none;-webkit-user-select:none;}
      .pet-stage-box.wx-rain{background:linear-gradient(180deg,#536976 0%,#BBD2C5 64%,#7F9F80 64%,#5B7A5C 100%);}
      .pet-stage-box.wx-snow{background:linear-gradient(180deg,#83A4D4 0%,#D7E1EC 64%,#F1F5F9 64%,#E2E8F0 100%);}
      .pet-stage-box.wx-night{background:linear-gradient(180deg,#141E30 0%,#243B55 64%,#3A5A40 64%,#2D4732 100%);}
      .pet-hud{position:relative;z-index:4;display:flex;justify-content:space-between;align-items:center;padding:9px 12px 0;gap:8px;}
      .pet-lv-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);padding:4px 10px;border-radius:999px;font-family:'Jua';font-size:14px;color:#1E293B;box-shadow:0 2px 8px rgba(0,0,0,.1);}
      .pet-exp-track{width:58px;height:8px;background:#E2E8F0;border-radius:999px;overflow:hidden;}
      .pet-exp-fill{height:100%;background:linear-gradient(90deg,#FF6B6B,#FF8E53);border-radius:999px;transition:width .35s ease;}
      .pet-wx-pill{background:rgba(15,23,42,.62);backdrop-filter:blur(6px);color:#fff;font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;}
      .pet-bubble-wrap{position:relative;z-index:4;padding:7px 14px 0;display:flex;justify-content:center;}
      .pet-bubble{background:rgba(255,255,255,.96);border:2px solid #FDE68A;border-radius:16px;padding:7px 13px;font-family:'Jua';font-size:15px;color:#1E293B;line-height:1.35;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.1);max-width:95%;word-break:keep-all;position:relative;animation:pop .25s ease;}
      .pet-bubble::after{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%) rotate(45deg);width:11px;height:11px;background:#fff;border-right:2px solid #FDE68A;border-bottom:2px solid #FDE68A;}
      .pet-canvas-wrap{position:relative;z-index:3;height:215px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;}
      .pet-canvas{width:290px;height:215px;display:block;}
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

  // 날씨 코드/기온에서 다마고치 환경 상태 계산
  function parseWeatherState(brief) {
    const hour = new Date().getHours();
    const isNight = brief && brief.isDay !== undefined ? !brief.isDay : (hour >= 19 || hour < 6);
    const code = brief && Number.isFinite(brief.code) ? brief.code : 0;
    const temp = brief && Number.isFinite(brief.temp) ? brief.temp : 16;
    const isRain = [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82, 95, 96, 99].includes(code);
    const isSnow = [71, 73, 75, 77, 85, 86].includes(code);
    const isCold = temp <= 6;
    const isHot = temp >= 28;
    let prop = null;
    if (isRain) prop = 'umbrella';
    else if (isSnow || isCold) prop = 'scarf';
    else if (isHot && !isNight) prop = 'sunglasses';

    let skyClass = '';
    if (isRain) skyClass = 'wx-rain';
    else if (isSnow) skyClass = 'wx-snow';
    else if (isNight) skyClass = 'wx-night';

    let badge = '☀️ 맑음';
    if (isRain) badge = '☂️ 비 · 우산 챙기세요';
    else if (isSnow) badge = '⛄ 눈 · 미끄럼 조심';
    else if (isCold) badge = `🧣 쌀쌀함 (${temp}°)`;
    else if (isHot) badge = `🕶️ 더움 (${temp}°)`;
    else if (isNight) badge = `🌙 편안한 밤 (${temp}°)`;
    else if (brief && Number.isFinite(brief.temp)) badge = `🌤️ ${temp}° 산책하기 좋은 날`;

    return { isNight, isRain, isSnow, isCold, isHot, prop, skyClass, badge, temp, tip: brief && brief.tip };
  }

  function mountHomeTamagotchi(homeView) {
    const hero = homeView.querySelector('.hero');
    if (!hero) return;
    injectStyle();
    preloadCharAssets();

    const state = getPetState();
    const doneToday = isSessionDoneToday();
    const today = todayKey();
    const fedToday = state.fedDay === today;

    let savedBrief = null;
    try { savedBrief = JSON.parse(localStorage.getItem('wxBrief') || 'null'); } catch (e) { savedBrief = null; }
    let wx = parseWeatherState(savedBrief);

    const stageBox = document.createElement('div');
    stageBox.className = `pet-stage-box ${wx.skyClass}`;
    stageBox.id = 'petStageBox';

    const initLine = () => {
      if (doneToday && !fedToday) return '🎉 오늘 두뇌운동을 끝내셨네요! 아래 [🍖 밥 주기]를 눌러 두 분께 특식을 주세요!';
      if (wx.isRain) return '☂️ 오늘은 비 소식이 있어요! 외출하실 때 우산 꼭 챙기세요 😊';
      if (wx.isCold || wx.isSnow) return '🧣 날씨가 쌀쌀해요! 따뜻하게 입으시고 감기 조심하세요 💕';
      if (doneToday && fedToday) return '🥰 특식 덕분에 기분 최고예요! 두 분 캐릭터를 톡톡 눌러 쓰다듬어 주세요!';
      return '💑 두 분의 3D 캐릭터예요! 톡톡 터치해 보시고, 오늘 두뇌운동 끝내면 특식도 주세요!';
    };

    stageBox.innerHTML = `
      <div class="pet-hud">
        <div class="pet-lv-pill">
          <span>❤️ 친밀도 <b id="petLvTxt">Lv.${state.lv}</b></span>
          <div class="pet-exp-track"><div class="pet-exp-fill" id="petExpFill" style="width:${Math.min(100, state.exp)}%"></div></div>
        </div>
        <div class="pet-wx-pill" id="petWxPill">${wx.badge}</div>
      </div>
      <div class="pet-bubble-wrap">
        <div class="pet-bubble" id="petBubble">${initLine()}</div>
      </div>
      <div class="pet-canvas-wrap" id="petCanvasWrap">
        <canvas class="pet-canvas" id="petCanvas" width="580" height="430"></canvas>
        <div class="pet-fx-layer" id="petFxLayer"></div>
      </div>
      <div class="pet-actions">
        <button type="button" class="pet-act-btn" id="petBtnStroke">👋 쓰다듬기</button>
        <button type="button" class="pet-act-btn ${doneToday && !fedToday ? 'ready-feed' : fedToday ? 'done-feed' : ''}" id="petBtnFeed">
          🍖 ${fedToday ? '식사 완료' : doneToday ? '특식 밥주기!' : '밥 주기'}
        </button>
        <button type="button" class="pet-act-btn" id="petBtnSnack">🍓 간식 주기</button>
      </div>
    `;

    hero.appendChild(stageBox);

    const bubbleEl = stageBox.querySelector('#petBubble');
    const lvTxtEl = stageBox.querySelector('#petLvTxt');
    const expFillEl = stageBox.querySelector('#petExpFill');
    const wxPillEl = stageBox.querySelector('#petWxPill');
    const fxLayer = stageBox.querySelector('#petFxLayer');
    const cv = stageBox.querySelector('#petCanvas');
    const ctx = cv.getContext('2d');
    const feedBtn = stageBox.querySelector('#petBtnFeed');

    function say(text) {
      bubbleEl.style.animation = 'none';
      void bubbleEl.offsetWidth;
      bubbleEl.style.animation = 'pop .25s ease';
      bubbleEl.textContent = text;
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
        sp.style.top = `${30 + Math.random() * 28}%`;
        sp.style.animationDelay = `${i * 0.08}s`;
        fxLayer.appendChild(sp);
        setTimeout(() => sp.remove(), 1100);
      }
    }

    // 3D 캐릭터 물리 상태 (점프, 기울기, 찌부/늘어남, 표정)
    const anim = {
      vy: 0,
      y: 0,
      scaleX: 1,
      scaleY: 1,
      tiltX: 0,
      mood: 'idle', // 'idle' | 'happy' | 'eat' | 'love'
      moodUntil: 0,
      foodEmoji: null,
      foodProg: 0,
    };

    function triggerJump(mood = 'happy', durMs = 1800) {
      anim.vy = -5.8;
      anim.scaleX = 1.12;
      anim.scaleY = 0.88;
      anim.mood = mood;
      anim.moodUntil = performance.now() + durMs;
    }

    const COUPLE_LINES = [
      '💑 두 분이 함께 활짝 웃으시니 복이 가득 들어와요!',
      '☝️ 하하하! 오늘도 두 분 나란히 두뇌운동 화이팅입니다!',
      '🌸 호호호~ 다정하게 터치해 주셔서 기분이 최고예요 🥰',
      '✨ 언제 봐도 참 다정하고 멋지신 두 분이에요 💕',
      '💪 오늘도 건강하고 웃음 가득한 하루 보내세요!',
    ];

    function onStroke(clientX) {
      if (typeof beep === 'function') beep(660, 0.08);
      if (clientX && cv) {
        const rect = cv.getBoundingClientRect();
        const relX = ((clientX - rect.left) / rect.width - 0.5) * 2;
        anim.tiltX = Math.max(-1, Math.min(1, relX)) * 14;
      }
      triggerJump('love', 1800);
      spawnParticles(['❤️', '💕', '✨']);
      state.petCount = (state.petCount || 0) + 1;
      const up = addExp(5);
      if (up) say(`🎊 우와! 친밀도가 Lv.${state.lv}로 올랐어요! 늘 아껴 주셔서 감사해요!`);
      else say(COUPLE_LINES[state.petCount % COUPLE_LINES.length]);
    }

    stageBox.querySelector('#petCanvasWrap').addEventListener('click', (e) => {
      onStroke(e.clientX);
    });
    stageBox.querySelector('#petBtnStroke').addEventListener('click', () => {
      onStroke();
    });

    stageBox.querySelector('#petBtnFeed').addEventListener('click', () => {
      const done = isSessionDoneToday();
      const t = todayKey();
      if (state.fedDay === t) {
        if (typeof beep === 'function') beep(587, 0.08);
        triggerJump('happy', 1600);
        spawnParticles(['🍖', '😋', '✨']);
        say('😋 오늘 주신 특식 덕분에 두 분 다 배가 든든해요! 내일 두뇌운동 끝나고 또 주세요!');
        return;
      }
      if (!done) {
        if (typeof beep === 'function') beep(440, 0.1);
        anim.foodEmoji = '🍙';
        anim.foodProg = 1;
        triggerJump('eat', 1800);
        spawnParticles(['🍙', '💪']);
        addExp(4);
        say('🍙 맛보기 주먹밥 냠냠! 아래 [시작하기]로 오늘 두뇌운동을 끝내시면 황금 특식을 드실 수 있어요!');
        return;
      }
      // 오늘 두뇌운동 완료 상태 -> 황금 특식 급여!
      state.fedDay = t;
      feedBtn.classList.remove('ready-feed');
      feedBtn.classList.add('done-feed');
      feedBtn.innerHTML = '🍖 식사 완료';
      anim.foodEmoji = '🍖';
      anim.foodProg = 1;
      triggerJump('eat', 2400);
      spawnParticles(['🍖', '🎉', '❤️', '🌟']);
      const up = addExp(45);
      if (up) say(`🎉 황금 특식 냠냠! 친밀도가 Lv.${state.lv}로 레벨업했어요! 최고예요!`);
      else say('😋 우와! 오늘 두뇌운동 완주 보상으로 주신 황금 특식, 정말 꿀맛이에요!');
    });

    stageBox.querySelector('#petBtnSnack').addEventListener('click', () => {
      const t = todayKey();
      const snacks = ['🎂', '🍓', '🍰', '🍡', '🍊'];
      const pickSnack = snacks[Math.floor(Math.random() * snacks.length)];
      if (typeof beep === 'function') beep(740, 0.08);
      anim.foodEmoji = pickSnack;
      anim.foodProg = 1;
      triggerJump('eat', 1900);
      spawnParticles([pickSnack, '😋', '💕']);
      if (state.snackDay !== t) {
        state.snackDay = t;
        const up = addExp(18);
        if (up) say(`🎊 달콤한 간식 먹고 친밀도가 Lv.${state.lv}로 올랐어요!`);
        else say(`${pickSnack} 달콤한 간식 냠냠! 두 분 함께 드시니 더 맛있어요 🥰`);
      } else {
        addExp(3);
        say(`${pickSnack} 오물오물~ 간식은 언제 먹어도 정말 맛있어요! 😊`);
      }
    });

    // 날씨 배경 입자 (비, 눈, 별/햇살)
    const bgParticles = Array.from({ length: 20 }, () => ({
      x: Math.random() * 580,
      y: Math.random() * 430,
      s: 1.2 + Math.random() * 2.2,
      v: 1.5 + Math.random() * 2.5,
    }));

    function draw3DSprite(img, xCenter, baseFootY, targetH, tOffset, mood) {
      if (!img || !img.complete || !img.naturalWidth) return false;
      const sway = Math.sin(tOffset * 2.4) * 0.022;
      const bounce = Math.abs(Math.sin(tOffset * (mood === 'idle' ? 2.6 : 7.0))) * (mood === 'idle' ? 3 : 6);
      const breathScaleX = 1 + Math.sin(tOffset * 3.0) * 0.014;
      const breathScaleY = 1 - Math.sin(tOffset * 3.0) * 0.016;

      const iw = img.naturalWidth, ih = img.naturalHeight;
      const drawH = targetH;
      const drawW = (iw / ih) * drawH;

      // 바닥 입체 그림자
      const jumpFactor = Math.max(0.6, 1 + anim.y / 140);
      ctx.save();
      const pedGrad = ctx.createRadialGradient(xCenter, baseFootY - 6, 4, xCenter, baseFootY - 6, 64 * jumpFactor);
      pedGrad.addColorStop(0, 'rgba(15, 23, 42, 0.28)');
      pedGrad.addColorStop(0.6, 'rgba(15, 23, 42, 0.14)');
      pedGrad.addColorStop(1, 'rgba(15, 23, 42, 0)');
      ctx.fillStyle = pedGrad;
      ctx.beginPath();
      ctx.ellipse(xCenter, baseFootY - 6, 64 * jumpFactor, 14 * jumpFactor, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3D 캐릭터 스프라이트 본체
      ctx.save();
      ctx.translate(xCenter, baseFootY + anim.y - bounce);
      ctx.rotate(sway + (anim.tiltX * Math.PI) / 180 * 0.38);
      ctx.scale(anim.scaleX * breathScaleX, anim.scaleY * breathScaleY);

      ctx.shadowColor = 'rgba(15, 23, 42, 0.30)';
      ctx.shadowBlur = 16;
      ctx.shadowOffsetY = 6;
      ctx.drawImage(img, -drawW / 2, -drawH + 8, drawW, drawH);
      ctx.restore();
      return true;
    }

    let rafId = null;
    function renderLoop(now) {
      if (!cv.isConnected) {
        if (rafId) cancelAnimationFrame(rafId);
        return;
      }
      const t = now * 0.001;

      // 물리 업데이트
      if (anim.y < 0 || anim.vy !== 0) {
        anim.y += anim.vy;
        anim.vy += 0.52;
        if (anim.y >= 0) {
          anim.y = 0;
          anim.vy = 0;
          anim.scaleX = 1.12;
          anim.scaleY = 0.88;
        }
      }
      anim.scaleX += (1 - anim.scaleX) * 0.16;
      anim.scaleY += (1 - anim.scaleY) * 0.16;
      anim.tiltX *= 0.9;
      if (anim.mood !== 'idle' && now > anim.moodUntil) anim.mood = 'idle';
      if (anim.foodProg > 0) anim.foodProg = Math.max(0, anim.foodProg - 0.018);

      ctx.clearRect(0, 0, 580, 430);

      // 1. 날씨 배경 입자 (비 / 눈 / 반짝이)
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
          ctx.arc(p.x, p.y * 0.55, p.s * (1 + pulse), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const cx = 290 + anim.tiltX;
      const baseFootY = 412;

      // 왼쪽: 610708 3D 캐릭터, 오른쪽: 691105 3D 캐릭터 항상 나란히 표시
      if (loadedChars['610708']) {
        draw3DSprite(loadedChars['610708'], cx - 92, baseFootY, 348, t, anim.mood);
      }
      if (loadedChars['691105']) {
        draw3DSprite(loadedChars['691105'], cx + 92, baseFootY, 340, t + 0.8, anim.mood);
      }

      // 두 분 사이 하트 둥실둥실
      ctx.save();
      const heartY = baseFootY - 265 + Math.sin(t * 3.2) * 6 + anim.y * 0.6;
      ctx.font = '32px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('❤️', cx, heartY);
      ctx.restore();

      if (wx.prop === 'umbrella') {
        ctx.save();
        ctx.translate(cx, baseFootY + anim.y - 180);
        draw3DUmbrella(ctx, t);
        ctx.restore();
      }

      // 밥/간식 먹기 애니메이션
      if (anim.foodProg > 0 && anim.foodEmoji) {
        ctx.save();
        const fx = cx + 88 * anim.foodProg;
        const fy = baseFootY - 175 - Math.sin(anim.foodProg * Math.PI) * 45;
        ctx.font = '52px sans-serif';
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
    };
  }

  function draw3DUmbrella(ctx, t) {
    ctx.save();
    ctx.translate(0, -155 + Math.sin(t * 3) * 2);
    ctx.rotate(0.06);
    ctx.strokeStyle = '#7C4A00';
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 115);
    ctx.arc(-8, 115, 8, 0, Math.PI);
    ctx.stroke();
    const uGrad = ctx.createRadialGradient(-20, -15, 8, 0, 0, 110);
    uGrad.addColorStop(0, '#FF9F1C');
    uGrad.addColorStop(1, '#E03131');
    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.arc(0, 12, 105, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function onWeather(brief) {
    if (activeMount && typeof activeMount.updateWeather === 'function') {
      activeMount.updateWeather(brief);
    }
  }

  window.PET = { mountHomeTamagotchi, onWeather, getPetState };
})();
