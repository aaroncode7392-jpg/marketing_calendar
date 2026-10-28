// ==========================================================
// 🧹 청소 심부름 (말 알아듣고 순서대로 하기 = 국어 이해 + 추론)
// 선생님이 "칠판을 닦기 전에 창문부터 열어 주세요"처럼 3~5가지 일을 말하면, 교실 지도에서 순서대로 누른다.
// 단계가 오를수록 순서를 뒤집는 말(~하기 전에), 맨 마지막, 위치로 찾는 책상(3번 책상 바로 뒤), 안 해도 되는 일이 섞인다.
// 틀려도 감점만 조금 있고, 두 번 틀리면 정답을 살짝 알려줘서 끝까지 해낼 수 있게 한다.
// ==========================================================
(function () {
  const ROUNDS = 3, MAX_LV = 6, LOG_CAP = 200;
  const rnd = n => Math.floor(Math.random() * n);
  const pickOne = a => a[rnd(a.length)];
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const hasBatchim = w => { const c = w.charCodeAt(w.length - 1); return c >= 0xAC00 && c <= 0xD7A3 && (c - 0xAC00) % 28 !== 0; };

  // 하는 일: 이어서(-고) / 부탁(-어 주세요) / 전에(-기 전에) / 안 해도(-지)
  const ACT = {
    wipe: { go: '닦고', cmd: '닦아 주세요', before: '닦기 전에', neg: '닦지' },
    tidy: { go: '정리하고', cmd: '정리해 주세요', before: '정리하기 전에', neg: '정리하지' },
    close: { go: '닫고', cmd: '닫아 주세요', before: '닫기 전에', neg: '닫지' },
    open: { go: '열고', cmd: '열어 주세요', before: '열기 전에', neg: '열지' },
    sweep: { go: '쓸고', cmd: '쓸어 주세요', before: '쓸기 전에', neg: '쓸지' },
    empty: { go: '비우고', cmd: '비워 주세요', before: '비우기 전에', neg: '비우지' },
    water: { go: '물을 주고', cmd: '물을 주세요', before: '물을 주기 전에', neg: '물을 주지' },
  };
  // 교실 물건 (창문은 왼쪽 벽, 문은 오른쪽 벽, 책상 앞줄 1·2·3 / 뒷줄 4·5·6 왼쪽부터)
  const THINGS = {
    board: { name: '칠판', act: 'wipe' }, podium: { name: '교탁', act: 'tidy' }, door: { name: '문', act: 'close' },
    window: { name: '창문', act: 'open' }, floor: { name: '바닥', act: 'sweep' }, trash: { name: '쓰레기통', act: 'empty' },
    locker: { name: '사물함', act: 'tidy' }, plant: { name: '화분', act: 'water' },
  };
  for (let n = 1; n <= 6; n++) THINGS[`d${n}`] = { name: `${n}번 책상`, act: 'wipe', desk: n };
  // 위치로 부르는 책상 이름
  const DESK_DESC = {
    1: ['창가 맨 앞 책상', '4번 책상 바로 앞 책상', '2번 책상 왼쪽 책상'],
    2: ['가운데 줄 맨 앞 책상', '교탁 바로 앞 책상', '1번과 3번 사이 책상'],
    3: ['문 쪽 맨 앞 책상', '6번 책상 바로 앞 책상', '2번 책상 오른쪽 책상'],
    4: ['창가 맨 뒤 책상', '1번 책상 바로 뒤 책상', '5번 책상 왼쪽 책상'],
    5: ['가운데 줄 뒷자리 책상', '2번 책상 바로 뒤 책상', '4번과 6번 사이 책상'],
    6: ['문 쪽 맨 뒤 책상', '3번 책상 바로 뒤 책상', '5번 책상 오른쪽 책상'],
  };
  const OBJECTS = ['board', 'podium', 'door', 'window', 'floor', 'trash', 'locker', 'plant'];

  // 단계별 규칙
  const LEVELS = {
    1: { steps: 3, desks: 0, invert: false, last: false, distract: false, relDesk: false },
    2: { steps: 4, desks: 1, invert: false, last: false, distract: false, relDesk: false },
    3: { steps: 4, desks: 1, invert: true, last: false, distract: false, relDesk: false },
    4: { steps: 4, desks: 2, invert: 'maybe', last: false, distract: false, relDesk: true },
    5: { steps: 5, desks: 2, invert: false, last: true, distract: true, relDesk: true },
    6: { steps: 5, desks: 2, invert: true, last: true, distract: true, relDesk: true },
  };

  // ---------------- 문장 만들기 ----------------
  function phrase(id, rel) {
    const t = THINGS[id];
    const name = t.desk && rel ? pickOne(DESK_DESC[t.desk]) : t.name;
    const a = ACT[t.act];
    const isWater = t.act === 'water';
    const obj = isWater ? `${name}에` : `${name}${hasBatchim(name) ? '을' : '를'}`;
    const topic = `${name}${hasBatchim(name) ? '은' : '는'}`;
    const verbOnly = a.cmd; // 목적어 없이 쓰는 부탁말
    return {
      go: `${obj} ${a.go}`, cmd: `${obj} ${a.cmd}`, before: `${obj} ${a.before}`,
      first: isWater ? `${name}에 먼저 ${verbOnly}` : `${name}부터 ${verbOnly}`,
      last: `${topic} 맨 마지막에 ${verbOnly}`,
      neg: `${topic} 오늘 ${a.neg} 않아도 돼요`,
    };
  }
  // 차례대로 말하기: 먼저 A하고, 그다음 B하고, 마지막으로 C해 주세요.
  function inOrder(ps, { lead = '먼저 ', tail = '마지막으로 ' } = {}) {
    if (ps.length === 1) return `${ps[0].cmd}.`;
    return ps.map((p, i) => (i === 0 ? `${lead}${p.go},` : i === ps.length - 1 ? `${tail}${p.cmd}.` : `그다음 ${p.go},`)).join(' ');
  }

  function makeTask(lv) {
    const L = LEVELS[lv] || LEVELS[1];
    for (let tries = 0; tries < 50; tries++) {
      const desks = shuffleArr([1, 2, 3, 4, 5, 6]).slice(0, L.desks).map(n => `d${n}`);
      const objs = shuffleArr(OBJECTS).slice(0, L.steps - desks.length);
      const steps = shuffleArr([...objs, ...desks]);
      const rest = OBJECTS.filter(o => !steps.includes(o));
      const distract = L.distract ? pickOne(rest) : null;
      const invert = L.invert === 'maybe' ? Math.random() < 0.5 : L.invert;
      const P = steps.map(id => phrase(id, L.relDesk));
      const parts = [];
      if (L.last) parts.push(`${P[P.length - 1].last}.`);
      const body = L.last ? P.slice(0, -1) : P;      // "맨 마지막"으로 뺀 일은 본문에서 제외
      if (invert) {
        // 두 번째 일부터 말하고, 첫 번째 일은 "~하기 전에 ...부터"로 뒤에 덧붙인다
        const after = body.slice(1);
        parts.push(after.length ? inOrder(after, { lead: '', tail: L.last ? '그리고 ' : '마지막으로 ' }) : '');
        parts.push(`아, ${after.length ? after[0].before : P[P.length - 1].before} ${body[0].first}.`);
      } else {
        parts.push(inOrder(body, { tail: L.last ? '그리고 ' : '마지막으로 ' }));
      }
      if (distract) parts.splice(rnd(parts.length + 1), 0, `${phrase(distract, false).neg}.`);
      const text = parts.filter(Boolean).join(' ');
      if (text.length < 160) return { steps, distract, text };
    }
    return { steps: ['board', 'podium', 'floor'], distract: null, text: '먼저 칠판을 닦고, 그다음 교탁을 정리하고, 마지막으로 바닥을 쓸어 주세요.' };
  }

  // ---------------- 선생님 그림 (안경 쓴 회색 머리 인자한 할아버지 선생님) ----------------
  const TEACHER_SVG = `<svg viewBox="0 0 140 140" width="100%" height="100%" aria-label="선생님">
    <circle cx="70" cy="70" r="68" fill="#EAF3FF"/>
    <path d="M18 140 C20 112 40 100 70 100 C100 100 120 112 122 140 Z" fill="#8B6B4E"/>
    <path d="M56 100 L70 122 L84 100 Z" fill="#FFFFFF"/>
    <path d="M66 104 L74 104 L77 126 L70 133 L63 126 Z" fill="#2F4A7A"/>
    <rect x="62" y="86" width="16" height="16" rx="6" fill="#EFC6A2"/>
    <ellipse cx="39" cy="66" rx="7" ry="9" fill="#F2C9A5"/>
    <ellipse cx="101" cy="66" rx="7" ry="9" fill="#F2C9A5"/>
    <ellipse cx="70" cy="62" rx="30" ry="34" fill="#F6D5B6"/>
    <path d="M38 58 C36 40 46 30 56 29 C50 36 47 44 46 56 Z" fill="#C3C7CC"/>
    <path d="M102 58 C104 40 94 30 84 29 C90 36 93 44 94 56 Z" fill="#C3C7CC"/>
    <path d="M47 34 C56 24 84 24 93 34 C84 30 56 30 47 34 Z" fill="#D5D8DC"/>
    <path d="M58 30 C62 27 66 27 70 29 M72 28 C76 26 80 27 83 30" stroke="#C3C7CC" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M50 49 Q57 45 64 49" stroke="#A6ACB3" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <path d="M76 49 Q83 45 90 49" stroke="#A6ACB3" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <circle cx="57" cy="60" r="10" fill="rgba(200,230,255,.25)" stroke="#5A4636" stroke-width="2.6"/>
    <circle cx="83" cy="60" r="10" fill="rgba(200,230,255,.25)" stroke="#5A4636" stroke-width="2.6"/>
    <path d="M67 59 Q70 56 73 59" stroke="#5A4636" stroke-width="2.4" fill="none"/>
    <path d="M47 58 L40 60 M93 58 L100 60" stroke="#5A4636" stroke-width="2.2"/>
    <path d="M52 61 Q57 57 62 61" stroke="#3A2E28" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M78 61 Q83 57 88 61" stroke="#3A2E28" stroke-width="2.4" fill="none" stroke-linecap="round"/>
    <path d="M45 64 L48 66 M95 64 L92 66" stroke="#D9A98A" stroke-width="1.4" stroke-linecap="round"/>
    <ellipse cx="51" cy="73" rx="6" ry="3.5" fill="#F4A6A0" opacity=".45"/>
    <ellipse cx="89" cy="73" rx="6" ry="3.5" fill="#F4A6A0" opacity=".45"/>
    <path d="M67 66 Q70 74 66 76 Q70 78 73 76" stroke="#D29A7A" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M58 82 Q64 78 70 81 Q76 78 82 82 Q76 85 70 83 Q64 85 58 82 Z" fill="#B9BEC4"/>
    <path d="M62 87 Q70 93 78 87" stroke="#9C5B4C" stroke-width="2.4" fill="none" stroke-linecap="round"/>
  </svg>`;

  // ---------------- 교실 지도 ----------------
  // [id, 왼쪽%, 위%, 너비%, 높이%, 모양]
  const LAYOUT = [
    ['board', 20, 2, 60, 10, 'board'], ['podium', 38, 15, 24, 9, 'podium'],
    ['window', 1.5, 26, 11, 27, 'window'], ['plant', 1.5, 57, 11, 11, 'plant'], ['door', 87.5, 16, 11, 22, 'door'],
    ['d1', 17, 30, 19, 13, 'desk'], ['d2', 40.5, 30, 19, 13, 'desk'], ['d3', 64, 30, 19, 13, 'desk'],
    ['d4', 17, 49, 19, 13, 'desk'], ['d5', 40.5, 49, 19, 13, 'desk'], ['d6', 64, 49, 19, 13, 'desk'],
    ['floor', 17, 67, 66, 11, 'floor'], ['locker', 15, 83, 46, 13, 'locker'], ['trash', 66, 83, 17, 13, 'trash'],
  ];
  const LABEL = { board: '칠판', podium: '교탁', window: '창문', plant: '🪴 화분', door: '문', floor: '바닥', locker: '사물함', trash: '🗑️ 쓰레기통' };

  function injectStyle() {
    if (document.getElementById('cleanStyle')) return;
    const st = document.createElement('style');
    st.id = 'cleanStyle';
    st.textContent = `
      .cl-top{display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;}
      .cl-teacher{flex:0 0 72px;width:72px;height:72px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.15));}
      .cl-teacher.happy{animation:clNod .6s ease 2;}
      @keyframes clNod{0%,100%{transform:none;}50%{transform:translateY(-6px) rotate(-3deg);}}
      .cl-bubble{position:relative;flex:1;background:#fff;border:2px solid #E5E8EB;border-radius:18px;padding:10px 14px;font-size:18px;line-height:1.55;word-break:keep-all;text-align:left;color:#191F28;box-shadow:0 4px 12px rgba(0,0,0,.06);}
      .cl-bubble::before{content:'';position:absolute;left:-10px;top:22px;border:8px solid transparent;border-right-color:#E5E8EB;}
      .cl-bubble .who{font-family:'Jua';font-size:15px;color:#6B7684;margin-bottom:2px;}
      .cl-hint{margin-top:6px;font-size:17px;color:#F04452;font-family:'Jua';}
      .cl-hint.strong{font-size:19px;line-height:1.5;background:#FFE8EA;border:2px solid #F04452;border-radius:12px;padding:8px 10px;color:#C8102E;animation:pop .3s ease;}
      .cl-room.cl-shake{animation:shake .45s ease;}
      .cl-say{border:0;background:#F2F4F6;border-radius:999px;padding:6px 12px;font-size:15px;font-weight:700;color:#333D4B;cursor:pointer;margin-top:6px;}
      .cl-prog{display:flex;align-items:center;justify-content:space-between;font-family:'Jua';font-size:18px;margin:4px 2px 8px;}
      .cl-dots span{display:inline-block;width:16px;height:16px;border-radius:50%;background:#E5E8EB;margin-left:6px;}
      .cl-dots span.on{background:#2FA28E;}
      .cl-room{position:relative;width:100%;aspect-ratio:1/0.92;border-radius:16px;border:6px solid #C9B79C;
        background:repeating-linear-gradient(90deg,#EBD9BC 0 28px,#E4D0AF 28px 30px);box-shadow:inset 0 0 20px rgba(0,0,0,.08);}
      .cl-item{position:absolute;display:flex;align-items:center;justify-content:center;flex-direction:column;border:0;padding:0;cursor:pointer;
        font-family:'Jua';font-size:15px;color:#3A2E28;border-radius:8px;transition:transform .12s,filter .2s;touch-action:manipulation;}
      .cl-item:active{transform:scale(.94);}
      .cl-item.board{background:#2F5D46;color:#F5F5F0;border:4px solid #8B6B4E;font-size:17px;}
      .cl-item.podium{background:#A47148;color:#fff;box-shadow:0 3px 0 #7A5233;}
      .cl-item.window{background:linear-gradient(135deg,#CFEAFF,#9FD3FF);border:3px solid #fff;outline:2px solid #8DB9DD;}
      .cl-item.door{background:#9A6B45;color:#fff;border-radius:6px 6px 2px 2px;}
      .cl-item.door::after{content:'';position:absolute;left:18%;top:52%;width:6px;height:6px;border-radius:50%;background:#F2C94C;}
      .cl-item.desk{background:#F6E7C8;border:2px solid #C8A878;box-shadow:0 3px 0 #C8A878;font-size:17px;}
      .cl-item.floor{background:rgba(255,255,255,.35);border:2px dashed #B49B78;color:#7A6A5E;}
      .cl-item.locker{background:repeating-linear-gradient(90deg,#B9C3CC 0 22%,#9AA6B1 22% 24%);color:#2F3A44;}
      .cl-item.trash{background:#E9EEF2;border:2px solid #AAB4BD;font-size:13px;}
      .cl-item.plant{background:#E8F5E4;border:2px solid #9CC79A;font-size:13px;}
      .cl-item.done{filter:brightness(1.12) saturate(1.1);}
      .cl-item.done::before{content:'✨';position:absolute;right:-6px;top:-10px;font-size:20px;animation:pop .35s ease;}
      .cl-item .ck{position:absolute;left:-6px;top:-8px;width:22px;height:22px;border-radius:50%;background:#2FA28E;color:#fff;font-size:13px;line-height:22px;text-align:center;}
      .cl-item.hint{animation:clHint 1s ease-in-out infinite;z-index:2;}
      @keyframes clHint{0%,100%{box-shadow:0 0 0 0 rgba(255,193,7,.0);}50%{box-shadow:0 0 0 8px rgba(255,193,7,.75);}}
      .cl-item.wrong{animation:shake .35s ease;}
      .cl-sparkle{position:absolute;pointer-events:none;font-size:22px;animation:clSpark .8s ease-out forwards;z-index:5;}
      @keyframes clSpark{from{opacity:1;transform:translate(0,0) scale(.6);}to{opacity:0;transform:translate(var(--dx),var(--dy)) scale(1.3);}}
    `;
    document.head.appendChild(st);
  }

  function speak(text) {
    try {
      if (!('speechSynthesis' in window)) return;
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR'; u.rate = 0.82; u.pitch = 0.9; // 천천히 또박또박
      window.speechSynthesis.speak(u);
    } catch (e) { /* 소리가 안 나도 글로 볼 수 있다 */ }
  }

  function sparkleAt(room, item) {
    const r = item.getBoundingClientRect(), rr = room.getBoundingClientRect();
    for (let i = 0; i < 6; i++) {
      const s = document.createElement('span');
      s.className = 'cl-sparkle';
      s.textContent = pickOne(['✨', '🫧', '⭐', '💫']);
      s.style.left = `${r.left - rr.left + r.width / 2 - 10}px`;
      s.style.top = `${r.top - rr.top + r.height / 2 - 10}px`;
      s.style.setProperty('--dx', `${Math.round(Math.cos(i) * 40)}px`);
      s.style.setProperty('--dy', `${Math.round(Math.sin(i) * 40) - 20}px`);
      room.appendChild(s);
      setTimeout(() => s.remove(), 850);
    }
  }

  const PRAISE = ['아이고, 깨끗하네요! 정말 잘했어요 👏', '역시! 순서를 딱딱 지켰네요 😊', '최고예요! 반장 해도 되겠어요 🏅', '말을 아주 잘 알아들었어요. 고마워요 🙏', '교실이 반짝반짝해졌네요! ✨'];

  // ---------------- 게임 ----------------
  function level() {
    const v = currentMember && currentMember.cleanLevel;
    return Math.min(MAX_LV, Math.max(1, Number.isFinite(v) ? v : 1));
  }

  function play({ onDone, lv } = {}) {
    injectStyle();
    const L = lv || level();
    const startedAt = Date.now();
    let round = 0, totalWrong = 0, guidedRounds = 0, roundScores = [];

    function next() {
      if (round >= ROUNDS) return finish();
      round++;
      runRound(makeTask(L));
    }

    function runRound(task) {
      api.current = task; // 관리자 확인·테스트용 (지금 문제)
      clear();
      let step = 0, stepWrong = 0, roundWrong = 0, lock = false;
      const bar = typeof stageBar === 'function' && typeof session !== 'undefined' && session ? stageBar() : '';
      const v = el(`
        <div class="fade">
          ${bar}
          <div class="scoreline"><span class="pill">🧹 ${round}/${ROUNDS} · ${L}단계</span></div>
          <div class="panel" style="padding:14px;">
            <div class="cl-top">
              <div class="cl-teacher" id="clT">${TEACHER_SVG}</div>
              <div class="cl-bubble"><div class="who">선생님</div><div id="clText">${esc(task.text)}</div><div class="cl-hint" id="clHint"></div><button class="cl-say" id="clSay" type="button">🔊 다시 듣기</button></div>
            </div>
            <div class="cl-prog"><span id="clProg">할 일 0 / ${task.steps.length}</span><span class="cl-dots">${task.steps.map(() => '<span></span>').join('')}</span></div>
            <div class="cl-room" id="clRoom">
              ${LAYOUT.map(([id, x, y, w, h, kind]) => `<button type="button" class="cl-item ${kind}" data-id="${id}" style="left:${x}%;top:${y}%;width:${w}%;height:${h}%;">${THINGS[id].desk ? `${THINGS[id].desk}번` : LABEL[id]}</button>`).join('')}
            </div>
          </div>
        </div>`);
      app.appendChild(v);
      const room = v.querySelector('#clRoom'), hintEl = v.querySelector('#clHint'), prog = v.querySelector('#clProg');
      const dots = [...v.querySelectorAll('.cl-dots span')];
      const textEl = v.querySelector('#clText'), teacher = v.querySelector('#clT');
      v.querySelector('#clSay').addEventListener('click', () => speak(task.text));
      setTimeout(() => speak(task.text), 350);

      // 틀리면: 강하게 주의 → 처음부터 다시. 한 문제에서 세 번 틀리면 선생님이 한 가지씩 같이 해 준다.
      let guided = false, guideWrong = 0;
      const guideLines = task.steps.map(id => phrase(id, false).cmd);
      const resetRound = () => {
        step = 0;
        room.querySelectorAll('.cl-item').forEach(x => { x.classList.remove('done', 'hint'); const ck = x.querySelector('.ck'); if (ck) ck.remove(); });
        dots.forEach(d => d.classList.remove('on'));
        prog.textContent = `할 일 0 / ${task.steps.length}`;
      };
      const showGuide = () => {
        const line = `${step + 1}번째: ${guideLines[step]}`;
        textEl.innerHTML = `<div style="color:#6B7684;font-size:15px;">선생님이랑 하나씩 같이 해 봐요</div><b style="font-size:21px;">👉 ${esc(line)}</b>`;
        speak(line);
      };
      const warn = html => {
        hintEl.innerHTML = html; hintEl.classList.add('strong');
        room.classList.remove('cl-shake'); void room.offsetWidth; room.classList.add('cl-shake');
        if (typeof beep === 'function') beep(330, 0.12); // 경고는 글로만, 소리는 짧고 부드럽게 (음성 없음)
        if (navigator.vibrate) { try { navigator.vibrate(60); } catch (err) { /* 무시 */ } }
        try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (err) { /* 무시 */ }
      };

      room.addEventListener('click', e => {
        const b = e.target.closest('.cl-item'); if (!b || lock) return;
        const id = b.dataset.id, want = task.steps[step];
        if (b.classList.contains('done')) { hintEl.textContent = '거기는 벌써 깨끗해요 😊'; return; }
        if (id === want) {
          b.classList.remove('hint'); b.classList.add('done');
          b.insertAdjacentHTML('beforeend', `<span class="ck">${step + 1}</span>`);
          sparkleAt(room, b);
          if (typeof beep === 'function') beep(660 + step * 80, 0.12);
          dots[step].classList.add('on');
          step++; guideWrong = 0; hintEl.textContent = ''; hintEl.classList.remove('strong');
          prog.textContent = `할 일 ${step} / ${task.steps.length}`;
          if (step >= task.steps.length) {
            lock = true;
            const praise = pickOne(PRAISE);
            textEl.textContent = praise; teacher.classList.add('happy');
            speak(praise);
            if (typeof confetti === 'function') confetti(roundWrong ? 3 : 6);
            roundScores.push(guided ? 30 : Math.max(40, 100 - roundWrong * 30));
            if (guided) guidedRounds++;
            setTimeout(next, 2300);
          } else if (guided) {
            showGuide();
          }
          return;
        }
        roundWrong++; totalWrong++;
        b.classList.remove('wrong'); void b.offsetWidth; b.classList.add('wrong');
        lock = true;
        if (guided) {
          // 같이 하는 중에는 처음으로 돌리지 않고, 두 번 틀리면 자리를 반짝여 준다
          guideWrong++;
          const name = THINGS[want].name;
          warn(`✋ 아무 곳이나 누르면 안 돼요!<br>'${esc(name)}'을(를) 찾아서 눌러 주세요.`);
          setTimeout(() => {
            lock = false;
            if (guideWrong >= 2) { const t = room.querySelector(`[data-id="${want}"]`); if (t) t.classList.add('hint'); }
          }, 2000);
          return;
        }
        const isDistract = id === task.distract;
        const dname = THINGS[id].name;
        warn(`${isDistract ? `✋ ${esc(dname)}${hasBatchim(dname) ? '은' : '는'} 오늘 안 해도 된다고 했어요!` : '✋ 앗! 아무 곳이나 누르면 안 돼요!'}<br>선생님 말을 끝까지 잘 듣고 눌러 주세요.<br><b>처음부터 다시 해요.</b>`);
        setTimeout(() => {
          resetRound();
          hintEl.classList.remove('strong');
          if (roundWrong >= 3) {
            guided = true;
            hintEl.textContent = '';
            showGuide();
          } else {
            hintEl.textContent = `다시 잘 들어 보세요 👂 (${roundWrong + 1}번째 도전)`;
            speak(task.text);
          }
          lock = false;
        }, 3600);
      });
    }

    function finish() {
      const score = Math.round(roundScores.reduce((a, b) => a + b, 0) / Math.max(1, roundScores.length));
      if (currentMember) {
        // 한 번도 안 틀리면 올리고, 같이 하기까지 갔거나 세 번 이상 틀리면 내린다
        const nextLv = totalWrong === 0 ? Math.min(MAX_LV, L + 1) : (guidedRounds > 0 || totalWrong >= 3) ? Math.max(1, L - 1) : L;
        currentMember.cleanLevel = nextLv;
        const log = currentMember.cleanLog || [];
        currentMember.cleanLog = [...log, { ts: new Date().toISOString(), lv: L, wrong: totalWrong, guided: guidedRounds, score, sec: Math.round((Date.now() - startedAt) / 1000) }].slice(-LOG_CAP);
        if (typeof saveMember === 'function') saveMember();
      }
      try { window.speechSynthesis && window.speechSynthesis.cancel(); } catch (e) { /* 무시 */ }
      if (onDone) onDone(score);
    }

    next();
  }

  // 관리자: 회원별 기록
  function injectAdminPanel(detailView, member) {
    const log = (member.cleanLog || []).slice().reverse();
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `<div class="section-title">🧹 청소 심부름 (${log.length}회 · 지금 ${Math.min(MAX_LV, Math.max(1, member.cleanLevel || 1))}단계)</div>
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;"><span>${d(r.ts)} · ${r.lv}단계 · ${r.sec}초</span><span>${r.wrong === 0 ? '⭕ 한 번도 안 틀림' : `틀림 ${r.wrong}번`}${r.guided ? ` · 같이 하기 ${r.guided}` : ''} · ${r.score}점</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  const api = { play, makeTask, injectAdminPanel, LEVELS, current: null };
  window.CLEAN = api;
})();
