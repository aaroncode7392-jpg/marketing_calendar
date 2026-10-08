// ==========================================================
// 둘이 함께 맞히기 (폰 두 대 합동 게임)
// 설명하는 사람 폰에는 정답만, 맞히는 사람 폰에는 보기만 보여서 말로 설명하고 들어야만 풀린다.
// 보안 규칙상 새 컬렉션을 쓸 수 없어 members 컬렉션 안의 'coop-설명자-맞히는사람' 문서를 방으로 쓴다.
// ==========================================================
(function () {
  const PAIRS = [{ describer: '610708', guesser: '691105' }];
  const ROUNDS = 5;
  const START_OPTIONS = 3, MIN_OPTIONS = 2, MAX_OPTIONS = 6;
  const MAX_WRONG = 2;
  const PRESENCE_TTL_MS = 25000, HEARTBEAT_MS = 8000, STALE_GAME_MS = 30 * 60 * 1000;
  const LOG_CAP = 400;
  const HINTS = ['어떻게 생겼어요?', '무슨 색이에요?', '어디서 볼 수 있어요?', '무엇에 쓰거나, 무엇을 하나요?'];
  const ITEMS = [
    ['🍎', '사과'], ['🍌', '바나나'], ['🍇', '포도'], ['🍉', '수박'], ['🍓', '딸기'], ['🍑', '복숭아'], ['🍊', '귤'],
    ['🥕', '당근'], ['🌽', '옥수수'], ['🍞', '빵'], ['🍚', '밥'], ['🍜', '국수'], ['🥛', '우유'], ['☕', '커피'],
    ['🥚', '달걀'], ['🍦', '아이스크림'], ['🍰', '케이크'], ['🍙', '주먹밥'],
    ['🐶', '강아지'], ['🐱', '고양이'], ['🐔', '닭'], ['🐮', '소'], ['🐷', '돼지'], ['🐰', '토끼'], ['🐻', '곰'],
    ['🐯', '호랑이'], ['🐘', '코끼리'], ['🐢', '거북이'], ['🦋', '나비'], ['🐝', '벌'], ['🐟', '물고기'], ['🐴', '말'], ['🐸', '개구리'],
    ['☂️', '우산'], ['👓', '안경'], ['⌚', '손목시계'], ['📱', '휴대폰'], ['📺', '텔레비전'], ['🔑', '열쇠'], ['✂️', '가위'],
    ['✏️', '연필'], ['📖', '책'], ['🎒', '가방'], ['👟', '운동화'], ['🧦', '양말'], ['🧤', '장갑'], ['👒', '모자'],
    ['🛏️', '침대'], ['💡', '전구'], ['🔨', '망치'], ['🎈', '풍선'], ['🥄', '숟가락'],
    ['🚗', '자동차'], ['🚌', '버스'], ['🚲', '자전거'], ['✈️', '비행기'], ['🚂', '기차'], ['⛵', '배'],
    ['☀️', '해'], ['🌙', '달'], ['⭐', '별'], ['❄️', '눈'], ['🌸', '꽃'], ['🌳', '나무'], ['🏠', '집'], ['⛰️', '산'], ['🌈', '무지개'],
  ];
  const EMOJI = Object.fromEntries(ITEMS.map(([e, w]) => [w, e]));

  const rand = n => Math.floor(Math.random() * n);
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const fmtBd = bd => (typeof fmtBirthdate === 'function' ? fmtBirthdate(bd) : bd);

  function myPair() {
    const bd = currentMember && currentMember.birthdate;
    const pair = PAIRS.find(p => p.describer === bd || p.guesser === bd);
    if (!pair) return null;
    return { ...pair, role: pair.describer === bd ? 'describer' : 'guesser', partner: pair.describer === bd ? pair.guesser : pair.describer };
  }
  const roomId = pair => `coop-${pair.describer}-${pair.guesser}`;
  const isOnline = (room, bd) => {
    const t = room && room.presence && room.presence[bd];
    return !!t && Date.now() - new Date(t).getTime() < PRESENCE_TTL_MS;
  };

  function makeGame(optionCount) {
    const picks = shuffleArr(ITEMS).slice(0, ROUNDS);
    return picks.map(([, word]) => {
      const others = shuffleArr(ITEMS.filter(([, w]) => w !== word)).slice(0, optionCount - 1).map(([, w]) => w);
      return { w: word, opts: shuffleArr([word, ...others]) };
    });
  }

  // ---------- 화면 ----------
  function render(html) {
    const root = document.getElementById('app');
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'fade';
    wrap.innerHTML = html;
    root.appendChild(wrap);
    return wrap;
  }
  const header = (pair) => `
    <div class="topbar">
      <div class="brand" style="font-size:22px;">👫 둘이 함께 맞히기</div>
      <button class="iconbtn" id="coopExit">✕</button>
    </div>
    <div style="font-size:14px;color:var(--ink-soft);margin:-8px 0 12px;">
      ${pair.role === 'describer' ? '나는 <b>설명하는 사람</b>' : '나는 <b>맞히는 사람</b>'} · 짝꿍 ${fmtBd(pair.partner)}
    </div>`;
  const panel = inner => `<div class="panel" style="text-align:center;padding:26px 20px;">${inner}</div>`;

  function viewLobby(pair, room) {
    const partnerOn = isOnline(room, pair.partner);
    if (!partnerOn) {
      return panel(`
        <div style="font-size:48px;">📱📱</div>
        <div style="font-family:'Jua';font-size:22px;margin:10px 0;">짝꿍을 기다리는 중이에요</div>
        <div style="font-size:16px;color:var(--ink-soft);line-height:1.6;">${fmtBd(pair.partner)}님도 <b>자기 폰</b>으로<br>'둘이 함께 맞히기'를 눌러주세요.</div>`);
    }
    if (pair.role === 'describer') {
      return panel(`
        <div style="font-family:'Jua';font-size:22px;margin-bottom:8px;">둘 다 들어왔어요! 🎉</div>
        <div style="font-size:16px;color:var(--ink-soft);line-height:1.6;">내 폰에 나오는 그림을<br><b>말로 설명</b>해주면, 짝꿍이 맞혀요.<br>그림 이름은 말하면 안 돼요!</div>
        <button class="btn btn-primary" id="coopStart" style="margin-top:18px;font-size:22px;padding:18px;">시작하기 (${ROUNDS}문제)</button>`);
    }
    return panel(`
      <div style="font-family:'Jua';font-size:22px;margin-bottom:8px;">둘 다 들어왔어요! 🎉</div>
      <div style="font-size:16px;color:var(--ink-soft);line-height:1.6;">${fmtBd(pair.partner)}님이 설명하는 걸 잘 듣고<br>무엇인지 맞혀보세요.<br><br>${fmtBd(pair.partner)}님이 시작하면 바로 시작돼요.</div>`);
  }

  function viewDescribe(pair, room) {
    const item = room.items[room.round - 1];
    const again = room.wrong > 0;
    if (pair.role === 'describer') {
      return panel(`
        <div style="font-size:15px;color:var(--ink-soft);">${room.round} / ${room.total} · 나만 보는 화면</div>
        ${again ? `<div style="font-family:'Jua';font-size:18px;color:var(--warn);margin-top:6px;">짝꿍이 헷갈려해요. 한 번 더 설명해주세요!</div>` : ''}
        <div style="font-size:90px;line-height:1.2;margin-top:6px;">${EMOJI[item.w]}</div>
        <div id="coopWord" style="font-family:'Jua';font-size:32px;">${item.w}</div>
        <div style="font-size:14px;color:var(--warn);margin:4px 0 12px;">'${item.w}'라고 말하면 안 돼요</div>
        <div style="text-align:left;background:#FFF7EC;border-radius:16px;padding:12px 16px;font-size:17px;line-height:1.9;">
          ${HINTS.map(h => `💬 ${h}`).join('<br>')}
        </div>
        <button class="btn btn-primary" id="coopDescribed" style="margin-top:16px;font-size:21px;padding:16px;">다 설명했어요 →</button>`);
    }
    return panel(`
      <div style="font-size:15px;color:var(--ink-soft);">${room.round} / ${room.total}</div>
      <div style="font-size:70px;margin:10px 0;">👂</div>
      <div style="font-family:'Jua';font-size:22px;line-height:1.5;">${fmtBd(pair.partner)}님 설명을<br>잘 들어보세요</div>
      <div style="font-size:15px;color:var(--ink-soft);margin-top:10px;line-height:1.6;">궁금한 건 물어봐도 돼요!<br>"무슨 색이야?" "어디에 있어?"</div>`);
  }

  function viewGuess(pair, room) {
    const item = room.items[room.round - 1];
    if (pair.role === 'describer') {
      return panel(`
        <div style="font-size:15px;color:var(--ink-soft);">${room.round} / ${room.total}</div>
        <div style="font-size:70px;margin:10px 0;">🤔</div>
        <div style="font-family:'Jua';font-size:22px;line-height:1.5;">${fmtBd(pair.partner)}님이<br>고르는 중이에요</div>
        <div style="font-size:15px;color:var(--ink-soft);margin-top:10px;">더 설명해도 괜찮아요</div>`);
    }
    const removed = room.removed || [];
    const opts = item.opts.filter(w => !removed.includes(w));
    return panel(`
      <div style="font-size:15px;color:var(--ink-soft);">${room.round} / ${room.total}</div>
      <div style="font-family:'Jua';font-size:22px;margin:6px 0 14px;">설명한 것은 무엇일까요?</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
        ${opts.map(w => `<button class="choice" data-pick="${w}" style="padding:14px 0;"><div style="font-size:52px;line-height:1.1;">${EMOJI[w]}</div><div style="font-family:'Jua';font-size:20px;">${w}</div></button>`).join('')}
      </div>
      <button class="btn btn-ghost" id="coopMore" style="margin-top:14px;font-size:17px;padding:12px;">더 설명해 주세요 🙏</button>`);
  }

  function viewDone(pair, room) {
    const n = room.correct || 0;
    const msg = n === room.total ? '완벽해요! 찰떡 호흡이에요 💕' : n >= 3 ? '잘했어요! 둘이 함께라 든든해요' : '수고했어요! 다음엔 더 잘 맞을 거예요';
    return panel(`
      <div style="font-size:56px;">🎉</div>
      <div style="font-family:'Jua';font-size:24px;margin:8px 0;">둘이 함께 ${n} / ${room.total}개 맞혔어요!</div>
      <div style="font-size:17px;color:var(--ink-soft);">${msg}</div>
      <div style="font-size:30px;margin:12px 0;letter-spacing:4px;">${(room.results || []).map(r => (r === 'ok' ? '⭕' : '❌')).join('')}</div>
      ${pair.role === 'describer'
        ? `<button class="btn btn-primary" id="coopStart" style="margin-top:8px;font-size:21px;padding:16px;">한 판 더</button>`
        : `<div style="font-size:15px;color:var(--ink-soft);margin-top:8px;">${fmtBd(pair.partner)}님이 '한 판 더'를 누르면 이어서 해요</div>`}
      <button class="btn btn-ghost" id="coopHome" style="margin-top:10px;font-size:18px;padding:13px;">홈으로</button>`);
  }

  function showPickFeedback(pick) {
    const ov = document.createElement('div');
    ov.className = 'overlay';
    ov.style.zIndex = '95';
    ov.innerHTML = `<div class="modal fade" style="text-align:center;padding:26px;">
      <div style="font-size:60px;">${pick.ok ? '⭕' : '❌'}</div>
      <div style="font-family:'Jua';font-size:24px;margin-top:6px;">${pick.ok ? `정답! ${pick.w}` : pick.reveal ? `정답은 '${pick.reveal}'였어요` : '아쉬워요! 한 번 더 들어봐요'}</div>
    </div>`;
    document.body.appendChild(ov);
    if (typeof beep === 'function') beep(pick.ok ? 660 : 220, 0.2);
    if (pick.ok && typeof confetti === 'function') confetti(2);
    setTimeout(() => ov.remove(), 1600);
  }

  // ---------- 상태 변경 ----------
  async function startGame(ref, room) {
    const level = Math.min(MAX_OPTIONS, Math.max(MIN_OPTIONS, (room && room.level) || START_OPTIONS));
    await ref.set({
      status: 'describe', gameId: String(Date.now()), round: 1, total: ROUNDS,
      items: makeGame(level), options: level, level, wrong: 0, removed: [], correct: 0, results: [],
      pick: null, updatedAt: new Date().toISOString(),
    }, { merge: true });
  }
  function nextRoundFields(room, ok) {
    const results = [...(room.results || []), ok ? 'ok' : 'miss'];
    const correct = (room.correct || 0) + (ok ? 1 : 0);
    const finished = room.round >= room.total;
    const base = { results, correct, wrong: 0, removed: [], updatedAt: new Date().toISOString() };
    if (!finished) return { ...base, status: 'describe', round: room.round + 1 };
    const level = correct >= 4 ? Math.min(MAX_OPTIONS, room.options + 1) : correct <= 2 ? Math.max(MIN_OPTIONS, room.options - 1) : room.options;
    return { ...base, status: 'done', level };
  }
  async function pickAnswer(ref, room, word) {
    const item = room.items[room.round - 1];
    const seq = ((room.pick && room.pick.seq) || 0) + 1;
    if (word === item.w) {
      await ref.set({ ...nextRoundFields(room, true), pick: { seq, ok: true, w: word } }, { merge: true });
      return;
    }
    const wrong = (room.wrong || 0) + 1;
    if (wrong >= MAX_WRONG) {
      await ref.set({ ...nextRoundFields(room, false), pick: { seq, ok: false, w: word, reveal: item.w } }, { merge: true });
      return;
    }
    await ref.set({ status: 'describe', wrong, removed: [...(room.removed || []), word], pick: { seq, ok: false, w: word }, updatedAt: new Date().toISOString() }, { merge: true });
  }

  function saveLog(pair, room) {
    const log = currentMember.coopLog || [];
    if (log.some(r => r.gameId === room.gameId)) return;
    currentMember.coopLog = [...log, {
      ts: new Date().toISOString(), gameId: room.gameId, role: pair.role, partner: pair.partner,
      correct: room.correct, total: room.total, options: room.options,
    }].slice(-LOG_CAP);
    if (typeof saveMember === 'function') saveMember();
  }

  // ---------- 진입 ----------
  async function open() {
    const pair = myPair();
    const db = typeof initFirebase === 'function' ? initFirebase() : null;
    if (!pair) return;
    if (typeof setGameBackground === 'function') setGameBackground(null);
    if (!db) {
      const v = render(panel(`<div style="font-size:18px;line-height:1.7;">둘이 함께 맞히기는<br>인터넷 연결이 필요해요.</div>
        <button class="btn btn-ghost" id="coopHome" style="margin-top:16px;">홈으로</button>`));
      v.querySelector('#coopHome').addEventListener('click', () => renderHome());
      return;
    }
    const ref = db.collection('members').doc(roomId(pair));
    const me = currentMember.birthdate;
    const beat = () => ref.set({ type: 'coopRoom', presence: { [me]: new Date().toISOString() } }, { merge: true }).catch(() => {});
    await beat();
    const heartbeat = setInterval(beat, HEARTBEAT_MS);
    let room = null, lastKey = '', lastPickSeq = null, busy = false;

    const leave = () => {
      clearInterval(heartbeat);
      unsubscribe();
      ref.set({ presence: { [me]: '' } }, { merge: true }).catch(() => {});
      renderHome();
    };
    const act = async fn => { if (busy) return; busy = true; try { await fn(); } finally { busy = false; } };

    const draw = () => {
      const partnerOn = isOnline(room, pair.partner);
      // 중간에 그만둔 판이 30분 넘게 방치돼 있으면 이어하지 않고 대기 화면부터 시작
      const stale = room && room.updatedAt && Date.now() - new Date(room.updatedAt).getTime() > STALE_GAME_MS;
      const raw = (room && room.status) || 'lobby';
      const status = stale && (raw === 'describe' || raw === 'guess') ? 'lobby' : raw;
      const key = JSON.stringify([status, partnerOn, room && room.gameId, room && room.round, room && room.wrong, room && room.removed]);
      if (key === lastKey) return;
      lastKey = key;
      const body = status === 'describe' ? viewDescribe(pair, room)
        : status === 'guess' ? viewGuess(pair, room)
        : status === 'done' ? viewDone(pair, room)
        : viewLobby(pair, room);
      const v = render(header(pair) + body);
      v.querySelector('#coopExit').addEventListener('click', leave);
      const on = (sel, fn) => { const b = v.querySelector(sel); if (b) b.addEventListener('click', () => act(fn)); };
      on('#coopStart', () => startGame(ref, room));
      on('#coopDescribed', () => ref.set({ status: 'guess', updatedAt: new Date().toISOString() }, { merge: true }));
      on('#coopMore', () => ref.set({ status: 'describe', updatedAt: new Date().toISOString() }, { merge: true }));
      on('#coopHome', async () => leave());
      v.querySelectorAll('[data-pick]').forEach(b => b.addEventListener('click', () => act(() => pickAnswer(ref, room, b.dataset.pick))));
    };

    const unsubscribe = ref.onSnapshot(snap => {
      room = snap.exists ? snap.data() : null;
      const seq = room && room.pick && room.pick.seq;
      if (lastPickSeq === null) lastPickSeq = seq || 0;
      else if (seq && seq !== lastPickSeq) { lastPickSeq = seq; showPickFeedback(room.pick); }
      if (room && room.status === 'done') saveLog(pair, room);
      draw();
    }, () => {});
    // 짝꿍 접속 여부는 시간이 지나면 바뀌므로 주기적으로 다시 그린다
    const presenceRedraw = setInterval(() => { if (!document.getElementById('coopExit')) { clearInterval(presenceRedraw); return; } draw(); }, 3000);
  }

  // ---------- 홈 버튼 / 관리자 ----------
  function injectHomeButton(homeView) {
    const pair = myPair();
    if (!pair) return;
    const anchor = homeView.querySelector('#myCardsBtn');
    if (!anchor) return;
    const btn = document.createElement('button');
    btn.className = 'btn';
    btn.id = 'coopOpen';
    btn.style.cssText = 'font-size:22px;padding:18px;margin-top:12px;background:#E86A92;color:#FFF;box-shadow:0 6px 0 #B84A6E;';
    btn.innerHTML = `👫 둘이 함께 맞히기 <span style="font-size:15px;opacity:.9;">(${fmtBd(pair.partner)}님과)</span>`;
    anchor.parentNode.insertBefore(btn, anchor);
    btn.addEventListener('click', open);
  }
  function injectAdminPanel(detailView, member) {
    const log = (member.coopLog || []).slice().reverse();
    if (!log.length && !PAIRS.some(p => p.describer === member.birthdate || p.guesser === member.birthdate)) return;
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panelEl = document.createElement('div');
    panelEl.className = 'admin-panel';
    panelEl.innerHTML = `
      <div class="section-title">👫 둘이 함께 맞히기 (${log.length}판)</div>
      ${log.length ? log.slice(0, 15).map(r => `<div style="padding:7px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;">
          <span>${d(r.ts)} · ${r.role === 'describer' ? '설명' : '맞히기'}</span><span>${r.correct}/${r.total} · 보기 ${r.options}개</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panelEl, anchor); else detailView.appendChild(panelEl);
  }

  window.COOP = { PAIRS, open, injectHomeButton, injectAdminPanel };
})();
