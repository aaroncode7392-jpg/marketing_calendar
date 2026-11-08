// ==========================================================
// 날씨 아래 3D 다마고치 영역 (window.PET)
// 1) 실시간 오늘 날씨(맑음·비·눈·추위·더위·밤)에 맞춰 배경·소품(우산·목도리·선글라스)·대사 자동 변화
// 2) 캐릭터 터치/드래그 시 3D 입체 기울기·점프·하트 파티클·쓰다듬기 반응과 다정한 말풍선 대사
// 3) 오늘의 두뇌운동 완료 시 '특식 밥 주기' & '간식 주기'로 호감도(친밀도) 게이지 상승 및 레벨업
// 4) 직접 그린 스케치 이미지를 올리거나 assets/pet/ 에 넣으면 배경을 자동 투명화해 3D 모션으로 즉시 적용
// ==========================================================
(function () {
  const CUSTOM_IMG_KEY = 'bg:pet:customImg';

  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  function getPetState() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m) {
      if (!m.petState || typeof m.petState !== 'object') {
        const baseLv = Math.max(1, Math.min(10, Math.floor((m.streak || 1) / 2) + 1));
        m.petState = { lv: baseLv, exp: 30, fedDay: null, snackDay: null, petCount: 0 };
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

  function getCustomSketch() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m && m.petCustomImg) return m.petCustomImg;
    try { return localStorage.getItem(CUSTOM_IMG_KEY) || null; } catch (e) { return null; }
  }

  function setCustomSketch(dataUrl) {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    if (m) {
      m.petCustomImg = dataUrl || null;
      savePetState();
    }
    try {
      if (dataUrl) localStorage.setItem(CUSTOM_IMG_KEY, dataUrl);
      else localStorage.removeItem(CUSTOM_IMG_KEY);
    } catch (e) { /* 무시 */ }
  }

  // 흰 종이에 그린 스케치 사진의 밝은 배경을 자동으로 투명하게 누끼 따주는 함수
  function removeSketchWhiteBg(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = reject;
      reader.onload = () => {
        const img = new Image();
        img.onerror = reject;
        img.onload = () => {
          const maxDim = 420;
          const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const cv = document.createElement('canvas');
          cv.width = w; cv.height = h;
          const ctx = cv.getContext('2d');
          ctx.drawImage(img, 0, 0, w, h);
          const id = ctx.getImageData(0, 0, w, h);
          const d = id.data;
          // 테두리에서 시작하는 Flood-fill로 종이 배경만 투명화 (캐릭터 안쪽 흰 눈동자 등은 보존)
          const visited = new Uint8Array(w * h);
          const q = [];
          const isBg = idx => {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2], a = d[idx + 3];
            if (a < 30) return true;
            const lum = (r + g + b) / 3;
            const sat = Math.max(r, g, b) - Math.min(r, g, b);
            return lum > 222 && sat < 32;
          };
          for (let x = 0; x < w; x++) {
            q.push(x, (h - 1) * w + x);
          }
          for (let y = 0; y < h; y++) {
            q.push(y * w, y * w + (w - 1));
          }
          while (q.length) {
            const p = q.pop();
            if (p < 0 || p >= w * h || visited[p]) continue;
            visited[p] = 1;
            const idx = p * 4;
            if (!isBg(idx)) continue;
            d[idx + 3] = 0;
            const x = p % w, y = (p / w) | 0;
            if (x > 0) q.push(p - 1);
            if (x < w - 1) q.push(p + 1);
            if (y > 0) q.push(p - w);
            if (y < h - 1) q.push(p + w);
          }
          ctx.putImageData(id, 0, 0);
          resolve(cv.toDataURL('image/png'));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
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
      .pet-stage-box{position:relative;margin-top:12px;border-radius:20px;overflow:hidden;border:2.5px solid rgba(255,255,255,.85);box-shadow:inset 0 2px 12px rgba(255,255,255,.45),0 8px 20px rgba(15,23,42,.12);background:linear-gradient(180deg,#8EC5FC 0%,#E0C3FC 62%,#B8E994 62%,#78E08F 100%);transition:background .5s ease;user-select:none;-webkit-user-select:none;}
      .pet-stage-box.wx-rain{background:linear-gradient(180deg,#536976 0%,#BBD2C5 62%,#7F9F80 62%,#5B7A5C 100%);}
      .pet-stage-box.wx-snow{background:linear-gradient(180deg,#83A4D4 0%,#D7E1EC 62%,#F1F5F9 62%,#E2E8F0 100%);}
      .pet-stage-box.wx-night{background:linear-gradient(180deg,#141E30 0%,#243B55 62%,#3A5A40 62%,#2D4732 100%);}
      .pet-hud{position:relative;z-index:4;display:flex;justify-content:space-between;align-items:center;padding:9px 12px 0;gap:8px;}
      .pet-lv-pill{display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.92);backdrop-filter:blur(6px);padding:4px 10px;border-radius:999px;font-family:'Jua';font-size:14px;color:#1E293B;box-shadow:0 2px 8px rgba(0,0,0,.1);}
      .pet-exp-track{width:58px;height:8px;background:#E2E8F0;border-radius:999px;overflow:hidden;}
      .pet-exp-fill{height:100%;background:linear-gradient(90deg,#FF6B6B,#FF8E53);border-radius:999px;transition:width .35s ease;}
      .pet-wx-pill{background:rgba(15,23,42,.62);backdrop-filter:blur(6px);color:#fff;font-size:12.5px;font-weight:700;padding:4px 10px;border-radius:999px;display:inline-flex;align-items:center;gap:4px;}
      .pet-bubble-wrap{position:relative;z-index:4;padding:6px 14px 0;display:flex;justify-content:center;}
      .pet-bubble{background:rgba(255,255,255,.96);border:2px solid #FDE68A;border-radius:16px;padding:7px 13px;font-family:'Jua';font-size:15.5px;color:#1E293B;line-height:1.35;text-align:center;box-shadow:0 4px 12px rgba(0,0,0,.1);max-width:94%;word-break:keep-all;position:relative;animation:pop .25s ease;}
      .pet-bubble::after{content:'';position:absolute;bottom:-7px;left:50%;transform:translateX(-50%) rotate(45deg);width:11px;height:11px;background:#fff;border-right:2px solid #FDE68A;border-bottom:2px solid #FDE68A;}
      .pet-canvas-wrap{position:relative;z-index:3;height:165px;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;}
      .pet-canvas{width:240px;height:165px;display:block;}
      .pet-fx-layer{position:absolute;inset:0;pointer-events:none;z-index:5;overflow:hidden;}
      .pet-float-item{position:absolute;font-size:24px;animation:petFloatUp .95s ease-out forwards;pointer-events:none;filter:drop-shadow(0 2px 6px rgba(0,0,0,.2));}
      @keyframes petFloatUp{0%{opacity:1;transform:translate(-50%,0) scale(.6);}40%{opacity:1;transform:translate(-50%,-28px) scale(1.2);}100%{opacity:0;transform:translate(-50%,-64px) scale(.9);}}
      .pet-actions{position:relative;z-index:4;display:grid;grid-template-columns:1fr 1fr 1fr;gap:6px;padding:6px 10px 10px;background:rgba(255,255,255,.55);backdrop-filter:blur(6px);}
      .pet-act-btn{border:2px solid rgba(255,255,255,.9);background:rgba(255,255,255,.92);border-radius:13px;padding:8px 4px;font-family:'Jua';font-size:15px;color:#1E293B;cursor:pointer;box-shadow:0 3px 8px rgba(0,0,0,.08);display:flex;align-items:center;justify-content:center;gap:4px;transition:transform .12s,background .15s;}
      .pet-act-btn:active{transform:scale(.94);}
      .pet-act-btn.ready-feed{background:linear-gradient(135deg,#FFF3BF,#FFE066);border-color:#FCC419;color:#7C4A00;animation:petFeedGlow 1.4s ease-in-out infinite;}
      @keyframes petFeedGlow{0%,100%{box-shadow:0 0 0 0 rgba(252,196,25,.55);}50%{box-shadow:0 0 0 7px rgba(252,196,25,0);}}
      .pet-act-btn.done-feed{opacity:.75;}
      .pet-sketch-bar{display:flex;justify-content:flex-end;padding:4px 10px 0;position:relative;z-index:4;}
      .pet-sketch-btn{border:0;background:rgba(255,255,255,.78);color:#475569;font-size:11.5px;font-weight:700;padding:3px 9px;border-radius:999px;cursor:pointer;}
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

    const state = getPetState();
    const doneToday = isSessionDoneToday();
    const today = todayKey();
    const fedToday = state.fedDay === today;
    const snackToday = state.snackDay === today;

    let savedBrief = null;
    try { savedBrief = JSON.parse(localStorage.getItem('wxBrief') || 'null'); } catch (e) { savedBrief = null; }
    let wx = parseWeatherState(savedBrief);

    const stageBox = document.createElement('div');
    stageBox.className = `pet-stage-box ${wx.skyClass}`;
    stageBox.id = 'petStageBox';

    const initLine = () => {
      if (doneToday && !fedToday) return '🎉 오늘 두뇌운동을 끝내셨네요! 아래 [🍖 밥 주기]를 눌러 특식을 주세요!';
      if (wx.isRain) return '☂️ 오늘은 비 소식이 있어요! 외출하실 때 우산 꼭 챙기세요 😊';
      if (wx.isCold || wx.isSnow) return '🧣 날씨가 쌀쌀해요! 목도리 따뜻하게 하고 감기 조심하세요 💕';
      if (doneToday && fedToday) return '🥰 배도 부르고 기분 최고예요! 저를 톡톡 눌러 쓰다듬어 주세요!';
      return '👋 안녕하세요! 저를 톡톡 터치해서 쓰다듬어 주시고, 오늘 두뇌운동 끝내면 밥도 주세요!';
    };

    stageBox.innerHTML = `
      <div class="pet-hud">
        <div class="pet-lv-pill">
          <span>❤️ 친밀도 <b id="petLvTxt">Lv.${state.lv}</b></span>
          <div class="pet-exp-track"><div class="pet-exp-fill" id="petExpFill" style="width:${Math.min(100, state.exp)}%"></div></div>
        </div>
        <div class="pet-wx-pill" id="petWxPill">${wx.badge}</div>
      </div>
      <div class="pet-sketch-bar">
        <button type="button" class="pet-sketch-btn" id="petSketchBtn">🎨 내 스케치 올리기</button>
        <input type="file" id="petSketchInput" accept="image/*" style="display:none;">
      </div>
      <div class="pet-bubble-wrap">
        <div class="pet-bubble" id="petBubble">${initLine()}</div>
      </div>
      <div class="pet-canvas-wrap" id="petCanvasWrap">
        <canvas class="pet-canvas" id="petCanvas" width="480" height="330"></canvas>
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
    const sketchBtn = stageBox.querySelector('#petSketchBtn');
    const sketchInput = stageBox.querySelector('#petSketchInput');

    // 커스텀 스케치 이미지 로드
    let customImgObj = null;
    const loadCustomImg = (src) => {
      if (!src) { customImgObj = null; return; }
      const im = new Image();
      im.onload = () => { customImgObj = im; };
      im.src = src;
    };
    loadCustomImg(getCustomSketch());

    sketchBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (customImgObj && confirm('새 스케치를 올리시겠어요?\n(취소를 누르면 기본 3D 캐릭터로 돌아갑니다)')) {
        sketchInput.click();
      } else if (customImgObj) {
        setCustomSketch(null);
        customImgObj = null;
        say('✨ 기본 3D 입체 캐릭터로 돌아왔어요!');
      } else {
        sketchInput.click();
      }
    });

    sketchInput.addEventListener('change', async (e) => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      say('🎨 스케치 배경을 투명하게 다듬고 있어요…');
      try {
        const cleanDataUrl = await removeSketchWhiteBg(f);
        setCustomSketch(cleanDataUrl);
        loadCustomImg(cleanDataUrl);
        say('🎉 와! 직접 그려주신 스케치 캐릭터가 살아 움직여요!');
        spawnParticles(['✨', '🎨', '❤️', '🌟']);
      } catch (err) {
        say('이미지를 불러오지 못했어요. 다시 시도해 주세요.');
      }
    });

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
        sp.style.left = `${30 + Math.random() * 40}%`;
        sp.style.top = `${35 + Math.random() * 25}%`;
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
      tiltX: 0, // 좌우 회전감
      tiltY: 0,
      mood: 'idle', // 'idle' | 'happy' | 'eat' | 'love'
      moodUntil: 0,
      foodEmoji: null,
      foodProg: 0,
    };

    function triggerJump(mood = 'happy', durMs = 1800) {
      anim.vy = -7.2;
      anim.scaleX = 1.16;
      anim.scaleY = 0.84;
      anim.mood = mood;
      anim.moodUntil = performance.now() + durMs;
    }

    const PET_LINES = [
      '헤헤, 쓰다듬어 주셔서 기분 최고예요! 💕',
      '손길이 따뜻해서 잠이 솔솔 와요 😊',
      '오늘도 건강하고 기분 좋은 하루 보내세요! ✨',
      '저랑 매일 만나 주셔서 정말 고마워요 🥰',
      '머리 쓰다듬어 주시면 힘이 불끈 나요! 💪',
    ];

    function onStroke(clientX, clientY) {
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
      if (up) say(`🎊 우와! 친밀도가 Lv.${state.lv}로 올랐어요! 늘 예뻐해 주셔서 감사해요!`);
      else say(PET_LINES[state.petCount % PET_LINES.length]);
    }

    stageBox.querySelector('#petCanvasWrap').addEventListener('click', (e) => {
      onStroke(e.clientX, e.clientY);
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
        say('😋 오늘 주신 특식 덕분에 배가 든든해요! 내일 두뇌운동 끝나고 또 주세요!');
        return;
      }
      if (!done) {
        if (typeof beep === 'function') beep(440, 0.1);
        anim.foodEmoji = '🍙';
        anim.foodProg = 1;
        triggerJump('eat', 1800);
        spawnParticles(['🍙', '💪']);
        addExp(4);
        say('🍙 맛보기 주먹밥 냠냠! 아래 [시작하기]로 오늘 두뇌운동을 끝내시면 황금 특식을 먹을 수 있어요!');
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
      const snacks = ['🍓', '🍰', '🍡', '🍪', '🍊'];
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
        else say(`${pickSnack} 달콤한 간식 냠냠! 챙겨 주셔서 정말 고마워요 🥰`);
      } else {
        addExp(3);
        say(`${pickSnack} 오물오물~ 간식은 언제 먹어도 정말 맛있어요! 😊`);
      }
    });

    // 날씨 배경 입자 (비, 눈, 별/햇살)
    const bgParticles = Array.from({ length: 18 }, () => ({
      x: Math.random() * 480,
      y: Math.random() * 330,
      s: 1 + Math.random() * 2,
      v: 1.5 + Math.random() * 2.5,
    }));

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
        anim.vy += 0.48;
        if (anim.y >= 0) {
          anim.y = 0;
          anim.vy = 0;
          anim.scaleX = 1.14;
          anim.scaleY = 0.86;
        }
      }
      anim.scaleX += (1 - anim.scaleX) * 0.16;
      anim.scaleY += (1 - anim.scaleY) * 0.16;
      anim.tiltX *= 0.9;
      if (anim.mood !== 'idle' && now > anim.moodUntil) anim.mood = 'idle';
      if (anim.foodProg > 0) anim.foodProg = Math.max(0, anim.foodProg - 0.018);

      ctx.clearRect(0, 0, 480, 330);

      // 1. 날씨 배경 입자 (비 / 눈 / 반짝이)
      ctx.save();
      if (wx.isRain) {
        ctx.strokeStyle = 'rgba(255,255,255,0.55)';
        ctx.lineWidth = 2;
        for (const p of bgParticles) {
          p.y = (p.y + p.v * 3.2) % 330;
          p.x = (p.x - 0.8 + 480) % 480;
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(p.x - 3, p.y + 12);
          ctx.stroke();
        }
      } else if (wx.isSnow) {
        ctx.fillStyle = 'rgba(255,255,255,0.85)';
        for (const p of bgParticles) {
          p.y = (p.y + p.v * 0.7) % 330;
          p.x = (p.x + Math.sin(t + p.y * 0.03) * 0.6 + 480) % 480;
          ctx.beginPath();
          ctx.arc(p.x, p.y, p.s * 1.8, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = wx.isNight ? 'rgba(255,244,180,0.75)' : 'rgba(255,255,255,0.45)';
        for (let i = 0; i < 10; i++) {
          const p = bgParticles[i];
          const pulse = 0.5 + 0.5 * Math.sin(t * 2 + i);
          ctx.beginPath();
          ctx.arc(p.x, (p.y * 0.55), p.s * (1 + pulse), 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();

      const cx = 240 + anim.tiltX;
      const baseY = 268;
      const breath = Math.sin(t * 3.2) * 3.5;
      const jumpY = anim.y;

      // 2. 바닥 입체 그림자
      const shadowScale = Math.max(0.55, 1 + jumpY / 120);
      ctx.save();
      ctx.fillStyle = 'rgba(15, 23, 42, 0.22)';
      ctx.beginPath();
      ctx.ellipse(cx, baseY + 14, 68 * shadowScale, 16 * shadowScale, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      // 3. 캐릭터 본체 (커스텀 스케치가 있으면 스케치에 3D 숨쉬기/점프/기울기 적용, 없으면 입체 3D 강아지/펫 렌더링)
      ctx.save();
      ctx.translate(cx, baseY + jumpY);
      ctx.rotate((anim.tiltX * Math.PI) / 180 * 0.45);
      ctx.scale(anim.scaleX, anim.scaleY * (1 + breath * 0.008));

      if (customImgObj) {
        const iw = customImgObj.width, ih = customImgObj.height;
        const targetH = 210;
        const targetW = (iw / ih) * targetH;
        ctx.shadowColor = 'rgba(0,0,0,0.28)';
        ctx.shadowBlur = 16;
        ctx.shadowOffsetY = 6;
        ctx.drawImage(customImgObj, -targetW / 2, -targetH + 10, targetW, targetH);
      } else {
        draw3DPetCharacter(ctx, t, anim.mood, wx);
      }

      // 4. 날씨 맞춤 입체 소품 (우산 / 목도리 / 선글라스)
      if (wx.prop === 'umbrella') {
        draw3DUmbrella(ctx, t);
      } else if (wx.prop === 'scarf' && !customImgObj) {
        draw3DScarf(ctx);
      } else if (wx.prop === 'sunglasses' && !customImgObj) {
        draw3DSunglasses(ctx);
      }
      ctx.restore();

      // 5. 밥/간식 먹기 애니메이션
      if (anim.foodProg > 0 && anim.foodEmoji) {
        ctx.save();
        const fx = cx + 68 * anim.foodProg;
        const fy = baseY - 65 - Math.sin(anim.foodProg * Math.PI) * 35;
        ctx.font = '44px sans-serif';
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

  // 3D 구면 셰이딩(Radial Gradient + Specular Highlight)으로 입체 다마고치 캐릭터 그리기
  function draw3DPetCharacter(ctx, t, mood, wx) {
    const wag = Math.sin(t * (mood === 'idle' ? 6 : 16)) * 0.35;

    // 꼬리
    ctx.save();
    ctx.translate(54, -52);
    ctx.rotate(wag);
    const tailGrad = ctx.createRadialGradient(-4, -8, 2, 0, 0, 22);
    tailGrad.addColorStop(0, '#FFF8E7');
    tailGrad.addColorStop(1, '#E6B980');
    ctx.fillStyle = tailGrad;
    ctx.beginPath();
    ctx.ellipse(12, -8, 18, 11, -0.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 몸통 (3D 통통한 구체 셰이딩)
    const bodyGrad = ctx.createRadialGradient(-18, -78, 10, 0, -52, 68);
    bodyGrad.addColorStop(0, '#FFFFFF');
    bodyGrad.addColorStop(0.55, '#FFF3D6');
    bodyGrad.addColorStop(1, '#E2B478');
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, -50, 54, 48, 0, 0, Math.PI * 2);
    ctx.fill();

    // 앞발 두 개
    for (const sx of [-26, 26]) {
      const pawGrad = ctx.createRadialGradient(sx - 4, -10, 2, sx, -6, 16);
      pawGrad.addColorStop(0, '#FFFFFF');
      pawGrad.addColorStop(1, '#DEB074');
      ctx.fillStyle = pawGrad;
      ctx.beginPath();
      ctx.ellipse(sx, -6, 15, 11, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 양쪽 귀 (살랑살랑 움직임)
    const earFlap = Math.sin(t * 4) * 0.08;
    for (const dir of [-1, 1]) {
      ctx.save();
      ctx.translate(dir * 50, -142);
      ctx.rotate(dir * (0.38 + earFlap));
      const earGrad = ctx.createRadialGradient(-4, -6, 3, 0, 12, 34);
      earGrad.addColorStop(0, '#F6C68A');
      earGrad.addColorStop(1, '#C88A4B');
      ctx.fillStyle = earGrad;
      ctx.beginPath();
      ctx.ellipse(0, 16, 18, 30, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 머리 (3D 구면 입체 셰이딩)
    const headGrad = ctx.createRadialGradient(-22, -152, 12, 0, -124, 72);
    headGrad.addColorStop(0, '#FFFFFF');
    headGrad.addColorStop(0.5, '#FFF6E3');
    headGrad.addColorStop(0.88, '#EBC38C');
    headGrad.addColorStop(1, '#D39E5E');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.ellipse(0, -124, 64, 56, 0, 0, Math.PI * 2);
    ctx.fill();

    // 이마 입체 하이라이트 (3D 광택)
    ctx.fillStyle = 'rgba(255,255,255,0.65)';
    ctx.beginPath();
    ctx.ellipse(-20, -156, 22, 10, -0.35, 0, Math.PI * 2);
    ctx.fill();

    // 발그레한 3D 볼터치
    for (const sx of [-36, 36]) {
      const cheekGrad = ctx.createRadialGradient(sx, -114, 1, sx, -114, 15);
      cheekGrad.addColorStop(0, 'rgba(255, 118, 136, 0.65)');
      cheekGrad.addColorStop(1, 'rgba(255, 118, 136, 0)');
      ctx.fillStyle = cheekGrad;
      ctx.beginPath();
      ctx.arc(sx, -114, 15, 0, Math.PI * 2);
      ctx.fill();
    }

    // 눈 (깜빡임 및 표정)
    const blink = (Math.sin(t * 1.7) > 0.96);
    ctx.strokeStyle = '#2B1E16';
    ctx.fillStyle = '#2B1E16';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';
    for (const sx of [-23, 23]) {
      if (mood === 'happy' || mood === 'love' || blink) {
        ctx.beginPath();
        ctx.arc(sx, -126, 9, Math.PI * 1.1, Math.PI * 1.9);
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.arc(sx, -128, 8.5, 0, Math.PI * 2);
        ctx.fill();
        // 눈동자 3D 반짝임
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.arc(sx - 3, -131, 3.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(sx + 2.5, -125, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#2B1E16';
      }
    }

    // 입체 코와 입
    const snoutGrad = ctx.createRadialGradient(-3, -115, 2, 0, -112, 18);
    snoutGrad.addColorStop(0, '#FFFFFF');
    snoutGrad.addColorStop(1, '#F3DEC0');
    ctx.fillStyle = snoutGrad;
    ctx.beginPath();
    ctx.ellipse(0, -111, 17, 12, 0, 0, Math.PI * 2);
    ctx.fill();

    // 반짝이는 코
    ctx.fillStyle = '#3A2314';
    ctx.beginPath();
    ctx.ellipse(0, -116, 7, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.ellipse(-2, -118, 2.5, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // 입 모양 (오물오물 먹기 / 활짝 웃기)
    ctx.strokeStyle = '#3A2314';
    ctx.lineWidth = 3;
    if (mood === 'eat') {
      const chew = Math.abs(Math.sin(t * 15)) * 6 + 3;
      ctx.fillStyle = '#FF7688';
      ctx.beginPath();
      ctx.ellipse(0, -103, 8, chew, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(-5, -108, 5.5, 0.15, Math.PI - 0.15);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(5, -108, 5.5, 0.15, Math.PI - 0.15);
      ctx.stroke();
      if (mood === 'happy' || mood === 'love') {
        ctx.fillStyle = '#FF8598';
        ctx.beginPath();
        ctx.arc(0, -104, 5, 0, Math.PI);
        ctx.fill();
      }
    }
  }

  function draw3DUmbrella(ctx, t) {
    ctx.save();
    ctx.translate(58, -165 + Math.sin(t * 3) * 2);
    ctx.rotate(0.15);
    // 우산대
    ctx.strokeStyle = '#7C4A00';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, 95);
    ctx.arc(-7, 95, 7, 0, Math.PI);
    ctx.stroke();
    // 우산 돔
    const uGrad = ctx.createRadialGradient(-15, -15, 5, 0, 0, 65);
    uGrad.addColorStop(0, '#FF9F1C');
    uGrad.addColorStop(1, '#E03131');
    ctx.fillStyle = uGrad;
    ctx.beginPath();
    ctx.arc(0, 10, 58, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function draw3DScarf(ctx) {
    ctx.save();
    const sGrad = ctx.createLinearGradient(-45, -80, 45, -60);
    sGrad.addColorStop(0, '#E03131');
    sGrad.addColorStop(0.5, '#FF6B6B');
    sGrad.addColorStop(1, '#C92A2A');
    ctx.fillStyle = sGrad;
    ctx.beginPath();
    ctx.roundRect(-44, -84, 88, 22, 11);
    ctx.fill();
    ctx.beginPath();
    ctx.roundRect(14, -72, 20, 36, 8);
    ctx.fill();
    ctx.restore();
  }

  function draw3DSunglasses(ctx) {
    ctx.save();
    ctx.fillStyle = '#1E293B';
    ctx.strokeStyle = '#F59F00';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.roundRect(-42, -138, 34, 20, 6);
    ctx.roundRect(8, -138, 34, 20, 6);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(-8, -128);
    ctx.lineTo(8, -128);
    ctx.stroke();
    ctx.restore();
  }

  function onWeather(brief) {
    if (activeMount && typeof activeMount.updateWeather === 'function') {
      activeMount.updateWeather(brief);
    }
  }

  window.PET = { mountHomeTamagotchi, onWeather, getPetState };
})();
