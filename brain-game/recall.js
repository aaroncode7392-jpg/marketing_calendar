// ==========================================================
// 어제 본 말씀 떠올리기 (간격을 두고 다시 꺼내기 + 오류 없이 배우기)
// 말씀카드를 본 날을 기록해 두었다가 1일 / 3일 / 7일 뒤에 "이어지는 말씀은?"을 물어본다.
// 틀려도 감점 없이 틀린 보기만 사라지고, 맞힐 때까지 계속 시도하게 해서 틀린 답이 기억에 남지 않게 한다.
// ==========================================================
(function () {
  const AGES = [1, 3, 7];
  const SEEN_CAP = 60, LOG_CAP = 400;

  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const daysAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return ymd(d); };
  const rand = n => Math.floor(Math.random() * n);
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rand(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const verseByRef = ref => BIBLE_VERSES.find(v => v.ref === ref);
  const tail = v => v.content.split('\n').slice(1).join(' ');
  const head = v => v.content.split('\n')[0];

  function note(ref) {
    if (!currentMember || !ref) return;
    const d = ymd(new Date());
    const seen = currentMember.verseSeen || [];
    if (seen.some(s => s.d === d && s.ref === ref)) return;
    currentMember.verseSeen = [...seen, { d, ref }].slice(-SEEN_CAP);
    if (typeof saveMember === 'function') saveMember();
  }

  function pickTarget(member) {
    const log = member.recallLog || [];
    if (log.some(r => r.d === ymd(new Date()))) return null;
    const seen = member.verseSeen || [];
    const start = log.length % AGES.length;
    for (let k = 0; k < AGES.length; k++) {
      const age = AGES[(start + k) % AGES.length];
      const day = daysAgo(age);
      const refs = [...new Set(seen.filter(s => s.d === day).map(s => s.ref))].filter(verseByRef);
      if (refs.length) return { age, ref: refs[rand(refs.length)] };
    }
    return null;
  }

  function render(html) {
    const root = document.getElementById('app');
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'fade';
    wrap.innerHTML = html;
    root.appendChild(wrap);
    window.scrollTo(0, 0);
    return wrap;
  }
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const ageText = age => (age === 1 ? '어제' : `${age}일 전에`);

  function start(target) {
    const verse = verseByRef(target.ref);
    const wrongPool = shuffleArr(BIBLE_VERSES.filter(v => v.ref !== verse.ref)).slice(0, 2);
    const options = shuffleArr([{ text: tail(verse), ok: true }, ...wrongPool.map(v => ({ text: tail(v), ok: false }))]);
    let tries = 0;
    const gone = new Set();

    const draw = (hint) => {
      const v = render(`
        <div class="topbar"><div class="brand" style="font-size:22px;">📝 말씀 떠올리기</div><button class="iconbtn" id="rcExit">✕</button></div>
        <div class="panel" style="text-align:center;padding:24px 18px;">
          <div style="font-size:15px;color:var(--ink-soft);">${ageText(target.age)} 본 말씀이에요</div>
          <div style="font-family:'Jua';font-size:22px;margin:12px 0 4px;line-height:1.6;white-space:pre-line;">“${esc(head(verse))}</div>
          <div style="font-size:16px;color:var(--ink-soft);margin-bottom:14px;">이어지는 말씀은 무엇일까요?</div>
          ${hint ? `<div style="font-size:15px;color:var(--ok);margin-bottom:10px;">${esc(hint)}</div>` : ''}
          <div style="display:flex;flex-direction:column;gap:10px;">
            ${options.map((o, i) => gone.has(i) ? '' : `<button class="choice" data-i="${i}" style="font-size:17px;line-height:1.5;padding:14px 12px;text-align:left;font-family:inherit;">${esc(o.text)}</button>`).join('')}
          </div>
        </div>`);
      v.querySelector('#rcExit').addEventListener('click', () => renderHome());
      v.querySelectorAll('[data-i]').forEach(b => b.addEventListener('click', () => pick(+b.dataset.i)));
    };

    const pick = (i) => {
      tries++;
      if (options[i].ok) return done();
      gone.add(i);
      if (typeof beep === 'function') beep(330, 0.1);
      const first = tail(verse).trim().charAt(0);
      draw(`괜찮아요, 다시 생각해봐요. 힌트: 이어지는 말씀은 '${first}'(으)로 시작해요`);
    };

    const done = () => {
      if (typeof beep === 'function') { beep(660, 0.12); setTimeout(() => beep(880, 0.2), 120); }
      if (typeof confetti === 'function') confetti(3);
      currentMember.recallLog = [...(currentMember.recallLog || []), { ts: new Date().toISOString(), d: ymd(new Date()), ref: verse.ref, age: target.age, tries }].slice(-LOG_CAP);
      if (typeof saveMember === 'function') saveMember();
      const v = render(`
        <div class="panel" style="text-align:center;padding:28px 20px;">
          <div style="font-size:56px;">🎉</div>
          <div style="font-family:'Jua';font-size:24px;margin:8px 0;">${tries === 1 ? '한 번에 기억하셨어요!' : '맞혔어요! 잘 떠올리셨어요'}</div>
          <div style="font-size:19px;line-height:1.8;white-space:pre-line;margin:14px 0 4px;">“${esc(verse.content)}”</div>
          <div style="font-size:15px;color:var(--ink-soft);">${esc(verse.ref)} (새번역)</div>
          <button class="btn btn-primary" id="rcOk" style="margin-top:20px;font-size:21px;padding:16px;">마음에 새기기 🙏</button>
        </div>`);
      v.querySelector('#rcOk').addEventListener('click', () => renderHome());
    };
    draw('');
  }

  function injectHomeCard(homeView) {
    if (!currentMember) return;
    const target = pickTarget(currentMember);
    const anchor = homeView.querySelector('#startBtn');
    if (!target || !anchor) return;
    const card = document.createElement('div');
    card.className = 'hero';
    card.style.cssText = 'padding:16px 20px;border-color:#F2D9A6;background:#FFFBF0;';
    card.innerHTML = `
      <div style="font-family:'Jua';font-size:20px;">📝 ${ageText(target.age)} 본 말씀 떠올리기</div>
      <div style="font-size:15px;color:var(--ink-soft);margin:4px 0 10px;line-height:1.5;">틀려도 괜찮아요. 1분이면 돼요.</div>
      <button class="btn" id="rcStart" style="margin:0;background:#D9952A;font-size:20px;padding:14px;">떠올려 보기</button>`;
    anchor.parentNode.insertBefore(card, anchor);
    card.querySelector('#rcStart').addEventListener('click', () => start(target));
  }

  function injectAdminPanel(detailView, member) {
    const log = (member.recallLog || []).slice().reverse();
    const first = log.filter(r => r.tries === 1).length;
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `
      <div class="section-title">📝 말씀 떠올리기 (${log.length}회${log.length ? ` · 한 번에 정답 ${first}회` : ''})</div>
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;">
          <span>${d(r.ts)} · ${r.age}일 전 · ${r.ref}</span><span>${r.tries === 1 ? '⭕ 한 번에' : `${r.tries}번 만에`}</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">말씀카드를 본 다음 날부터 홈 화면에 떠요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  window.RECALL = { note, injectHomeCard, injectAdminPanel, pickTarget };
})();
