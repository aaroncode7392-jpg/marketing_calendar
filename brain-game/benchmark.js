// ==========================================================
// 주 1회 두뇌 건강 측정 (benchmark v1)
// 매주 같은 조건으로 재야 추이를 비교할 수 있으므로, 이 파일의 문항·시간·채점 방식은 바꾸지 말 것.
// 바꿔야 한다면 BM_VERSION을 올려서 이전 버전 기록과 섞이지 않게 한다.
// ==========================================================
(function () {
  const BM_VERSION = 1;
  const DUE_DAYS = 7;
  const LOG_CAP = 240;
  const WORD_SHOW_MS = 2500, WORD_GAP_MS = 500;
  const DIGIT_SHOW_MS = 700, DIGIT_GAP_MS = 300;
  const SPAN_START = 3, SPAN_MAX = 9, TRIALS_PER_SPAN = 2;
  const SPEED_SECONDS = 40, SPEED_PRACTICE_TRIALS = 3;
  const SPEED_SYMBOLS = ['🍎', '🚗', '⭐', '🐟', '🌸', '🔔', '🎈', '🍌'];

  // 6개 형식을 번갈아 사용 — 형식마다 18단어(기억할 6 + 즉시 확인용 오답 6 + 나중 확인용 오답 6)
  const WORDS = [
    '사과','기차','연필','우산','시계','바다', '포도','버스','공책','모자','거울','하늘', '수박','택시','지갑','양말','의자','구름',
    '당근','트럭','가위','장갑','냄비','호수', '감자','사슴','풍선','신발','접시','들판', '호박','여우','열쇠','치마','화분','언덕',
    '딸기','사자','칫솔','반지','베개','폭포', '참외','토끼','비누','단추','이불','바위', '자두','오리','수건','안경','커튼','동굴',
    '양파','고래','망치','팔찌','소파','계곡', '마늘','거북','국자','조끼','책상','사막', '고추','펭귄','주걱','바지','서랍','노을',
    '버섯','나비','피리','구두','창문','들꽃', '배추','참새','장구','털실','계단','연못', '호두','제비','나팔','외투','대문','강물',
    '레몬','하마','팽이','잠옷','액자','햇살', '체리','낙타','인형','셔츠','전등','파도', '키위','수달','구슬','샌들','식탁','숲길',
  ];
  const FORM_COUNT = WORDS.length / 18;

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function seededShuffle(arr, rand) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  const appEl = () => document.getElementById('app');
  function render(html) {
    const root = appEl();
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'fade';
    wrap.innerHTML = html;
    root.appendChild(wrap);
    window.scrollTo(0, 0);
    return wrap;
  }
  const wait = ms => new Promise(r => setTimeout(r, ms));
  const tap = (freq) => { if (typeof beep === 'function') beep(freq, 0.06); };

  function v1Log(member) {
    return ((member && member.benchmarkLog) || []).filter(r => r.v === BM_VERSION);
  }
  function lastTs(member) {
    const log = v1Log(member);
    return log.length ? log[log.length - 1].ts : null;
  }
  // 측정은 매주 일요일에 한다 (같은 요일에 재야 컨디션 차이가 줄어 비교가 정확해진다)
  const SUNDAY = 0;
  const ymdOf = d => `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
  function isDue(member) {
    const now = new Date();
    if (now.getDay() !== SUNDAY) return false;
    const ts = lastTs(member);
    return !ts || ymdOf(new Date(ts)) !== ymdOf(now);
  }
  function nextDueDate(member) {
    const d = new Date();
    d.setDate(d.getDate() + ((7 - d.getDay()) % 7 || (isDue(member) ? 0 : 7)));
    return `${d.getMonth() + 1}월 ${d.getDate()}일 일요일`;
  }
  // 일요일에 "시작하기"를 누르면 측정부터 하고 이어서 두뇌운동으로 넘어간다. 맡았으면 true.
  let skippedOn = null;
  function runBeforeSession(continueFn) {
    if (!currentMember || !isDue(currentMember) || skippedOn === ymdOf(new Date())) return false;
    if (typeof setGameBackground === 'function') setGameBackground(null);
    const v = render(`
      <div class="panel" style="text-align:center;padding:30px 22px;">
        <div style="font-size:54px;">📋</div>
        <div style="font-family:'Jua';font-size:26px;margin:8px 0;">오늘은 일요일,<br>두뇌 건강 측정하는 날이에요</div>
        <div style="font-size:18px;line-height:1.7;">약 5분이면 끝나요.<br>끝나면 바로 <b>오늘의 두뇌운동</b>으로 이어져요.</div>
        <button class="btn btn-primary" id="bmGo" style="margin-top:22px;font-size:22px;padding:18px;">측정 시작하기</button>
        <button class="footer-link" id="bmSkip" style="margin-top:14px;">오늘은 건너뛰고 두뇌운동만 할게요</button>
      </div>`);
    v.querySelector('#bmGo').addEventListener('click', () => start(continueFn));
    v.querySelector('#bmSkip').addEventListener('click', () => { skippedOn = ymdOf(new Date()); continueFn(); });
    return true;
  }

  // ---------- 공통 화면 ----------
  function instruction({ step, title, body, button }) {
    return new Promise(resolve => {
      const v = render(`
        <div class="panel" style="text-align:center;padding:30px 22px;">
          <div style="font-size:14px;color:var(--ink-soft);margin-bottom:6px;">두뇌 건강 측정 ${step} / 4</div>
          <div style="font-family:'Jua';font-size:26px;margin-bottom:14px;">${title}</div>
          <div style="font-size:18px;line-height:1.7;color:var(--ink);word-break:keep-all;">${body}</div>
          <button class="btn btn-primary" id="bmGo" style="margin-top:24px;font-size:22px;padding:18px;">${button}</button>
        </div>`);
      v.querySelector('#bmGo').addEventListener('click', () => { tap(440); resolve(); });
    });
  }
  function bigText(text, sub) {
    render(`
      <div class="panel" style="text-align:center;padding:40px 20px;min-height:280px;display:flex;flex-direction:column;justify-content:center;">
        ${sub ? `<div style="font-size:15px;color:var(--ink-soft);margin-bottom:12px;">${sub}</div>` : ''}
        <div style="font-family:'Jua';font-size:64px;line-height:1.2;">${text}</div>
      </div>`);
  }

  // ---------- 1·4. 단어 기억 ----------
  async function showWords(targets) {
    for (let i = 0; i < targets.length; i++) {
      bigText(targets[i], `기억해 주세요 (${i + 1} / ${targets.length})`);
      await wait(WORD_SHOW_MS);
      bigText('&nbsp;', `기억해 주세요 (${i + 1} / ${targets.length})`);
      await wait(WORD_GAP_MS);
    }
  }
  function recognize(targets, distractors, rand, title) {
    return new Promise(resolve => {
      const items = seededShuffle([...targets, ...distractors], rand);
      const picked = new Set();
      const v = render(`
        <div class="panel" style="text-align:center;padding:24px 16px;">
          <div style="font-family:'Jua';font-size:22px;margin-bottom:6px;">${title}</div>
          <div style="font-size:16px;color:var(--ink-soft);margin-bottom:16px;">아까 본 단어를 모두 눌러주세요</div>
          <div id="bmGrid" style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;">
            ${items.map(w => `<button class="choice" data-w="${w}" style="font-size:24px;padding:18px 0;">${w}</button>`).join('')}
          </div>
          <button class="btn btn-primary" id="bmDone" style="margin-top:20px;font-size:22px;padding:16px;">다 골랐어요</button>
        </div>`);
      v.querySelectorAll('[data-w]').forEach(b => b.addEventListener('click', () => {
        const w = b.dataset.w;
        if (picked.has(w)) { picked.delete(w); b.classList.remove('right'); }
        else { picked.add(w); b.classList.add('right'); }
        tap(520);
      }));
      // 하나도 안 고르고 넘기면 한 번 더 확인한다 (건너뛴 것과 정말 기억이 안 난 것을 구분)
      let confirmedNone = false;
      v.querySelector('#bmDone').addEventListener('click', () => {
        const hit = targets.filter(w => picked.has(w)).length;
        const fa = distractors.filter(w => picked.has(w)).length;
        if (picked.size === 0 && !confirmedNone) {
          const box = document.createElement('div');
          box.className = 'overlay';
          box.style.zIndex = '95';
          box.innerHTML = `<div class="modal fade" style="text-align:center;">
            <div style="font-size:44px;">🤔</div>
            <div style="font-family:'Jua';font-size:24px;margin:8px 0;">하나도 안 고르셨어요</div>
            <div style="font-size:18px;line-height:1.6;margin-bottom:16px;">조금이라도 본 것 같은 단어가 있으면<br>눌러 주세요. 틀려도 괜찮아요.</div>
            <button class="btn btn-primary" id="bmAgain" style="font-size:21px;padding:16px;">다시 골라 볼게요</button>
            <button class="btn btn-ghost" id="bmNone" style="font-size:17px;padding:13px;">정말 하나도 기억이 안 나요</button>
          </div>`;
          document.body.appendChild(box);
          box.querySelector('#bmAgain').addEventListener('click', () => box.remove());
          box.querySelector('#bmNone').addEventListener('click', () => { box.remove(); confirmedNone = true; resolve({ hit: 0, fa: 0, none: true }); });
          return;
        }
        resolve({ hit, fa });
      });
    });
  }

  // ---------- 2. 숫자 따라 기억 (순방향 숫자폭) ----------
  function makeDigits(len, rand) {
    const out = [];
    while (out.length < len) {
      const d = 1 + Math.floor(rand() * 9);
      if (d !== out[out.length - 1]) out.push(d);
    }
    return out.join('');
  }
  function askDigits(len) {
    return new Promise(resolve => {
      let typed = '';
      const v = render(`
        <div class="panel" style="text-align:center;padding:24px 16px;">
          <div style="font-family:'Jua';font-size:22px;margin-bottom:8px;">본 숫자를 순서대로 눌러주세요</div>
          <div id="bmTyped" style="font-family:'Jua';font-size:44px;min-height:60px;letter-spacing:6px;color:var(--speed);"></div>
          <div class="numpad" style="margin-top:12px;">
            ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map(n => `<button class="npkey" data-k="${n}">${n}</button>`).join('')}
            <button class="npkey npkey-clear" data-k="clear">지우기</button>
            <button class="npkey" data-k="0">0</button>
            <button class="npkey npkey-back" data-k="back">⌫</button>
          </div>
          <button class="btn btn-primary" id="bmOk" style="margin-top:16px;font-size:22px;padding:16px;opacity:.5;">확인</button>
        </div>`);
      const typedEl = v.querySelector('#bmTyped');
      const ok = v.querySelector('#bmOk');
      const refresh = () => { typedEl.textContent = typed; ok.style.opacity = typed.length === len ? '1' : '.5'; };
      v.querySelectorAll('.npkey').forEach(k => k.addEventListener('click', () => {
        const key = k.dataset.k;
        if (key === 'clear') typed = '';
        else if (key === 'back') typed = typed.slice(0, -1);
        else if (typed.length < len) typed += key;
        tap(440); refresh();
      }));
      ok.addEventListener('click', () => { if (typed.length === len) resolve(typed); });
    });
  }
  let tries = [];
  async function digitSpan(rand) {
    let best = 0;
    tries = [];
    for (let len = SPAN_START; len <= SPAN_MAX; len++) {
      let anyCorrect = false;
      for (let t = 0; t < TRIALS_PER_SPAN; t++) {
        const seq = makeDigits(len, rand);
        bigText('준비', `${len}자리 숫자`);
        await wait(1000);
        for (const d of seq) {
          bigText(d, `${len}자리 숫자`);
          await wait(DIGIT_SHOW_MS);
          bigText('&nbsp;', `${len}자리 숫자`);
          await wait(DIGIT_GAP_MS);
        }
        const answer = await askDigits(len);
        tries.push(`${seq}/${answer}`);
        if (answer === seq) { anyCorrect = true; best = len; }
      }
      if (!anyCorrect) break;
    }
    return best;
  }

  // ---------- 3. 같은 그림 찾기 (처리속도) ----------
  function speedRound({ rand, seconds, trials }) {
    return new Promise(resolve => {
      let correct = 0, wrong = 0, done = 0;
      const rts = [];
      const v = render(`
        <div class="panel" style="text-align:center;padding:24px 16px;">
          <div id="bmTimer" style="font-size:16px;color:var(--ink-soft);margin-bottom:6px;"></div>
          <div style="font-size:16px;color:var(--ink-soft);">위와 같은 그림을 누르세요</div>
          <div id="bmTarget" style="font-size:80px;margin:10px 0 18px;"></div>
          <div id="bmOpts" style="display:grid;grid-template-columns:1fr 1fr;gap:14px;"></div>
        </div>`);
      const targetEl = v.querySelector('#bmTarget'), optsEl = v.querySelector('#bmOpts'), timerEl = v.querySelector('#bmTimer');
      const endAt = seconds ? Date.now() + seconds * 1000 : null;
      let shownAt = 0, finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        const meanMs = rts.length ? Math.round(rts.reduce((a, b) => a + b, 0) / rts.length) : null;
        resolve({ correct, wrong, meanMs });
      };
      const next = () => {
        if (endAt && Date.now() >= endAt) return finish();
        if (trials && done >= trials) return finish();
        const opts = seededShuffle(SPEED_SYMBOLS, rand).slice(0, 4);
        const target = opts[Math.floor(rand() * 4)];
        targetEl.textContent = target;
        optsEl.innerHTML = opts.map(o => `<button class="choice" data-o="${o}" style="font-size:52px;padding:18px 0;">${o}</button>`).join('');
        shownAt = performance.now();
        optsEl.querySelectorAll('[data-o]').forEach(b => b.addEventListener('click', () => {
          const rt = performance.now() - shownAt;
          done++;
          if (b.dataset.o === target) { correct++; rts.push(rt); tap(660); } else { wrong++; tap(220); }
          next();
        }));
      };
      if (endAt) {
        const tick = () => {
          if (finished) return;
          const left = Math.max(0, Math.ceil((endAt - Date.now()) / 1000));
          timerEl.textContent = `남은 시간 ${left}초`;
          if (left <= 0) finish(); else setTimeout(tick, 250);
        };
        tick();
      } else {
        timerEl.textContent = '연습';
      }
      next();
    });
  }

  // ---------- 전체 흐름 ----------
  async function start(onDone) {
    if (typeof onDone !== 'function') onDone = null;
    if (typeof setGameBackground === 'function') setGameBackground(null);
    const form = v1Log(currentMember).length % FORM_COUNT;
    const base = form * 18;
    const targets = WORDS.slice(base, base + 6);
    const immDistractors = WORDS.slice(base + 6, base + 12);
    const delDistractors = WORDS.slice(base + 12, base + 18);
    const startedAt = Date.now();

    await instruction({ step: 1, title: '단어 기억하기', button: '시작',
      body: '단어 6개가 하나씩 나와요.<br>잘 기억해 주세요.<br><b>나중에 한 번 더 물어볼 거예요.</b>' });
    await showWords(targets);
    const wordImm = await recognize(targets, immDistractors, mulberry32(form * 7919 + 1), '방금 본 단어 찾기');

    await instruction({ step: 2, title: '숫자 따라 기억하기', button: '시작',
      body: '숫자가 하나씩 나와요.<br>다 나오면 본 순서대로 눌러주세요.<br>점점 길어져요.' });
    const digitSpanResult = await digitSpan(mulberry32(form * 7919 + 2));

    await instruction({ step: 3, title: '같은 그림 찾기', button: '연습해 보기',
      body: `위에 나온 그림과 같은 것을<br>아래에서 빨리 눌러주세요.<br>먼저 ${SPEED_PRACTICE_TRIALS}번 연습해요.` });
    await speedRound({ rand: mulberry32(form * 7919 + 3), trials: SPEED_PRACTICE_TRIALS });
    await instruction({ step: 3, title: '이제 진짜 시작!', button: '시작',
      body: `${SPEED_SECONDS}초 동안 최대한 많이 맞혀주세요.` });
    const speed = await speedRound({ rand: mulberry32(form * 7919 + 4), seconds: SPEED_SECONDS });

    await instruction({ step: 4, title: '처음 본 단어 기억나세요?', button: '시작',
      body: '맨 처음에 본 단어 6개를<br>다시 찾아주세요.' });
    const wordDel = await recognize(targets, delDistractors, mulberry32(form * 7919 + 5), '처음에 본 단어 찾기');

    const record = {
      ts: new Date().toISOString(), v: BM_VERSION, form,
      wordImm, digitSpan: digitSpanResult, spanTries: tries.slice(0, 12), speed, wordDel,
      durationSec: Math.round((Date.now() - startedAt) / 1000),
    };
    currentMember.benchmarkLog = [...(currentMember.benchmarkLog || []), record].slice(-LOG_CAP);
    if (typeof saveMember === 'function') saveMember();
    showDone(onDone);
  }

  function showDone(onDone) {
    if (typeof confetti === 'function') confetti(3);
    if (onDone) {
      const v = render(`
        <div class="panel" style="text-align:center;padding:34px 22px;">
          <div style="font-size:56px;">🎉</div>
          <div style="font-family:'Jua';font-size:26px;margin:10px 0;">측정 끝! 수고하셨어요</div>
          <div style="font-size:18px;line-height:1.7;">이번 주 측정이 저장됐어요.<br>이제 오늘의 두뇌운동으로 넘어가요.</div>
          <button class="btn btn-primary" id="bmNext" style="margin-top:24px;font-size:22px;padding:18px;">두뇌운동 시작 ▶ <span id="bmCount">5</span></button>
        </div>`);
      let n = 5, done = false;
      const go = () => { if (done) return; done = true; clearInterval(t); onDone(); };
      const t = setInterval(() => { n--; const c = v.querySelector('#bmCount'); if (c) c.textContent = n; if (n <= 0) go(); }, 1000);
      v.querySelector('#bmNext').addEventListener('click', go);
      return;
    }
    const v = render(`
      <div class="panel" style="text-align:center;padding:34px 22px;">
        <div style="font-size:56px;">🎉</div>
        <div style="font-family:'Jua';font-size:26px;margin:10px 0;">수고하셨어요!</div>
        <div style="font-size:18px;line-height:1.7;color:var(--ink);">이번 주 측정이 저장됐어요.<br>다음 측정은 <b>${nextDueDate(currentMember)}</b>부터 할 수 있어요.</div>
        <button class="btn btn-primary" id="bmHome" style="margin-top:24px;font-size:22px;padding:18px;">홈으로</button>
      </div>`);
    v.querySelector('#bmHome').addEventListener('click', () => renderHome());
  }

  // ---------- 홈 화면 안내 카드 ----------
  function injectHomeCard(homeView) {
    if (!currentMember || !isDue(currentMember)) return;
    const anchor = homeView.querySelector('#startBtn');
    if (!anchor) return;
    const card = document.createElement('div');
    card.className = 'hero';
    card.style.cssText = 'padding:16px 20px;border-color:#BFDBFF;background:#F2F8FF;';
    card.innerHTML = `
      <div style="font-family:'Jua';font-size:20px;">📋 오늘은 두뇌 건강 측정하는 날 (일요일)</div>
      <div style="font-size:15px;color:var(--ink-soft);margin:4px 0 10px;line-height:1.5;">아래 '시작하기'를 누르면 측정(약 5분)부터 하고<br>바로 두뇌운동으로 이어져요.</div>
      <button class="btn" id="bmStart" style="margin:0;background:#4A7FD4;font-size:20px;padding:14px;">측정 시작하기</button>`;
    anchor.parentNode.insertBefore(card, anchor);
    card.querySelector('#bmStart').addEventListener('click', start);
  }

  // ---------- 관리자 회원 상세: 측정 결과 + 훈련 난이도 ----------
  const fmtDate = iso => { const d = new Date(iso); return `${d.getFullYear() % 100}.${d.getMonth() + 1}.${d.getDate()}`; };
  // 하나도 안 고른 기록: 확인 후 '기억 안 남'이면 0/6, 확인 전(10/29 이전) 기록은 '안 고름'으로 따로 표시
  const wordCell = w => (w.hit === 0 && !w.fa ? (w.none ? '0/6 (기억 안 남)' : '<span style="color:var(--ink-soft)">안 고름</span>') : `${w.hit}/6${w.fa ? ` <span style="color:var(--warn)">(-${w.fa})</span>` : ''}`);
  const cmp = (a, b) => (a > b ? '▲' : a < b ? '▼' : '=');
  function injectAdminPanel(detailView, member) {
    const log = v1Log(member);
    const rows = log.slice().reverse().map(r => `
      <tr>
        <td>${fmtDate(r.ts)}</td>
        <td>${wordCell(r.wordImm)}</td>
        <td>${r.digitSpan}자리</td>
        <td>${r.speed.correct}개</td>
        <td>${wordCell(r.wordDel)}</td>
      </tr>`).join('');
    let change = '';
    if (log.length >= 2) {
      const a = log[log.length - 2], b = log[log.length - 1];
      change = `<div style="font-size:13px;margin-top:8px;">직전 대비: 단어 ${cmp(b.wordImm.hit, a.wordImm.hit)} · 숫자 ${cmp(b.digitSpan, a.digitSpan)} · 그림 ${cmp(b.speed.correct, a.speed.correct)} · 나중 단어 ${cmp(b.wordDel.hit, a.wordDel.hit)}</div>`;
    }
    // 매주 재면 한 주 단위 오르내림이 크므로, 4회(약 한 달) 평균으로 흐름을 본다
    const avg4 = (rs) => {
      const m = f => (rs.reduce((s, r) => s + f(r), 0) / rs.length).toFixed(1);
      return `단어 ${m(r => r.wordImm.hit)} · 숫자 ${m(r => r.digitSpan)} · 그림 ${m(r => r.speed.correct)} · 나중 단어 ${m(r => r.wordDel.hit)}`;
    };
    if (log.length >= 4) change += `<div style="font-size:13px;margin-top:4px;"><b>최근 4회 평균</b>: ${avg4(log.slice(-4))}</div>`;
    if (log.length >= 12) change += `<div style="font-size:13px;margin-top:2px;"><b>기준선(5~8회차) 평균</b>: ${avg4(log.slice(4, 8))}</div>`;
    const dl = member.domainLevels || {};
    const lvLine = `⚡ 순간포착 ${dl.speed ?? member.level ?? 8}단계 · 🔢 빠른셈 ${dl.math ?? member.level ?? 8}단계 · 🃏 짝맞추기 ${dl.memory ?? member.level ?? 8}단계`;
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `
      <div class="section-title">🧪 주 1회 두뇌 건강 측정 (${log.length}회)</div>
      ${log.length ? `
      <div style="overflow-x:auto;">
        <table style="width:100%;border-collapse:collapse;font-size:13px;text-align:center;">
          <thead><tr style="color:var(--ink-soft);"><th>날짜</th><th>단어(즉시)</th><th>숫자폭</th><th>같은그림 40초</th><th>단어(나중)</th></tr></thead>
          <tbody>${rows}</tbody>
        </table>
      </div>${change}` : '<div style="font-size:14px;color:var(--ink-soft);">아직 측정 기록이 없어요. 홈 화면에 측정 카드가 떠 있어요.</div>'}
      <div style="font-size:12px;color:var(--ink-soft);line-height:1.6;margin-top:10px;">
        · 처음 4회(약 한 달)는 익숙해지면서 오르는 게 정상이라, 5~8회차 평균을 기준선으로 보세요.<br>
        · 매주 기록은 수면·피로·컨디션에 따라 오르내림이 커요. 한 주가 아니라 '최근 4회 평균'이 기준선보다 2달 이상 계속 낮으면(특히 '단어(나중)') 치매안심센터 선별검사를 권해요.<br>
        · 진단 도구가 아니라 같은 조건에서 본인 변화를 보는 기록이에요.
      </div>
      <div style="font-size:13px;margin-top:10px;"><b>매일 게임 훈련 난이도(자동 조절)</b><br>${lvLine}</div>`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor);
    else detailView.appendChild(panel);
  }

  window.BM = { start, isDue, runBeforeSession, injectHomeCard, injectAdminPanel, VERSION: BM_VERSION };
})();
