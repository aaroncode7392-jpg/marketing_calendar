// ==========================================================
// 💬 왜? 물어보기 (플레이어가 직접 "왜?"라고 물어서 이유를 알아내는 대화 연습)
// 손녀·남편·친구·의사 선생님이 카톡처럼 말을 건다. 이유는 말해 주지 않는다.
// 플레이어가 "왜 ~?"라고 물어야 상대가 이유를 털어놓고, 높은 단계에서는 한 번 더 "왜?"를 물어야 진짜 이유가 나온다.
// 엉뚱한 말에는 시무룩한 대답만 돌아오고, 문맥에 안 맞는 '왜'(우는 아이에게 "왜 웃니?")도 섞인다.
// 자판으로 직접 질문을 써서 물을 수도 있다('왜'가 들어 있으면 통과). 경고 음성은 없다.
// ==========================================================
(function () {
  const PER_GAME = 3, MAX_LV = 3, LOG_CAP = 200;
  const ASK_WORDS = /(왜|어째서|무슨 일|무슨 이유|이유가)/;

  // 단계: L1 = 첫 질문만, L2 = 두 번 물어보기, L3 = 두 번 + 문맥에 안 맞는 '왜'가 섞임
  // 보기: ok = 알맞은 왜 질문, non = 왜가 아닌 말, trap = 왜는 맞지만 지금 이야기와 안 맞는 질문
  const S = [
    { who: '손녀 지민', face: '👧', open: '할머니… 나 오늘 학교 가기 싫어요.', steps: [
      { ok: ['왜 학교에 가기 싫어?', '친구 민지랑 싸웠어요…'], non: [['오늘 반찬은 뭐야?', '…(고개를 푹 숙여요)'], ['그래, 알았다', '…(계속 시무룩해요)']], trap: ['왜 그렇게 신났어?', '저 하나도 안 신났어요…'] },
      { ok: ['왜 싸웠는데?', '민지가 제 지우개를 말도 없이 가져갔어요.'], non: [['민지는 키가 커?', '…그게 지금 중요해요?']], trap: ['왜 웃니?', '저 안 웃어요… 속상해요.'] },
    ], end: '할머니가 물어봐 주니까 마음이 풀렸어요. 내일 민지한테 먼저 말해 볼게요!',
      check: ['지민이는 왜 학교에 가기 싫었을까요?', '친구가 지우개를 말없이 가져가서 싸워서', ['숙제를 안 해서', '배가 아파서']] },
    { who: '남편', face: '👴', open: '여보, 나 오늘은 산책 안 갈래.', steps: [
      { ok: ['왜 오늘은 안 가요?', '무릎이 좀 쑤셔서 그래.'], non: [['산책은 몇 시에 가요?', '…안 간다니까.'], ['그래요, 나 혼자 갈게요', '그래요… (끙)']], trap: ['왜 그렇게 기분이 좋아요?', '좋긴, 무릎이 아파 죽겠는데.'] },
      { ok: ['무릎은 왜 쑤셔요?', '어제 텃밭에서 쪼그려 앉아 오래 일했거든.'], non: [['파스 어디 있어요?', '서랍에… 근데 왜 아픈지는 안 궁금해?']], trap: ['왜 텃밭을 싫어해요?', '싫어하긴, 좋아하지.'] },
    ], end: '말하고 보니 오늘은 쉬고 파스나 붙여야겠네. 물어봐 줘서 고마워요.',
      check: ['남편은 왜 산책을 안 가려고 했나요?', '어제 텃밭 일을 오래 해서 무릎이 아파서', ['비가 와서', '친구를 만나러 가려고']] },
    { who: '친구 영자', face: '👵', open: '나 이번 주 노래교실 못 가.', steps: [
      { ok: ['왜 못 와?', '손주를 봐 줘야 해서.'], non: [['노래교실 재밌지?', '응… 근데 못 가.'], ['그럼 다음에 보자', '응…']], trap: ['왜 노래를 싫어해?', '싫어하는 게 아니라니까~'] },
      { ok: ['왜 손주를 봐 줘야 해?', '딸이 이번 주에 출장을 가거든.'], non: [['손주는 몇 살이야?', '다섯 살. 근데…']], trap: ['왜 딸이랑 싸웠어?', '싸운 거 아니야~'] },
    ], end: '물어봐 줘서 고마워. 다음 주엔 꼭 갈게!',
      check: ['영자 씨는 왜 노래교실에 못 가나요?', '딸이 출장을 가서 손주를 봐야 해서', ['노래가 싫어서', '감기에 걸려서']] },
    { who: '아들', face: '👨', open: '엄마, 이번 추석엔 못 내려갈 것 같아요.', steps: [
      { ok: ['왜 못 내려오니?', '회사에 급한 일이 생겨서요.'], non: [['추석에 뭐 먹고 싶니?', '…못 간다니까요, 엄마.'], ['그래, 알았다', '죄송해요…']], trap: ['왜 그렇게 기뻐하니?', '기쁘긴요…'] },
      { ok: ['왜 급한 일이 생겼니?', '같이 일하던 동료가 다쳐서 제가 대신 맡게 됐어요.'], non: [['회사는 몇 층이니?', '…그건 왜요?']], trap: ['왜 회사를 그만뒀니?', '그만둔 거 아니에요!'] },
    ], end: '엄마가 물어봐 주니까 마음이 편하네요. 대신 다음 주말에 갈게요.',
      check: ['아들은 왜 추석에 못 오나요?', '동료가 다쳐서 대신 일을 맡게 돼서', ['기차표가 없어서', '추석이 싫어서']] },
    { who: '이웃 콩이 엄마', face: '👩', open: '요즘 우리 콩이가 밥을 통 안 먹어요.', steps: [
      { ok: ['콩이가 왜 밥을 안 먹을까요?', '이가 아픈 것 같아요. 딱딱한 걸 씹을 때 낑낑거려요.'], non: [['콩이는 무슨 색이에요?', '갈색이요… 근데 걱정이에요.'], ['우리 개는 잘 먹어요', '부럽네요…']], trap: ['콩이는 왜 그렇게 뚱뚱해요?', '뚱뚱하진 않은데요…'] },
      { ok: ['왜 이가 아플까요?', '나이가 열두 살이라 이가 약해졌대요.'], non: [['사료는 얼마예요?', '그건 잘 모르겠어요…']], trap: ['왜 산책을 안 시켜요?', '산책은 매일 해요~'] },
    ], end: '물어봐 주셔서 고마워요. 부드러운 사료로 바꿔 볼게요.',
      check: ['콩이는 왜 밥을 잘 안 먹나요?', '나이가 들어 이가 약해져서', ['사료가 맛없어서', '배가 너무 불러서']] },
    { who: '의사 선생님', face: '👨‍⚕️', open: '이번부터 혈압약을 하나 더 드릴게요.', steps: [
      { ok: ['왜 약을 하나 더 먹어야 하나요?', '요즘 혈압이 조금 높게 나와서요.'], non: [['약은 무슨 맛이에요?', '맛은… 별맛 없어요.'], ['네, 알겠습니다', '네, 다음 분 들어오세요~']], trap: ['선생님은 왜 안경을 쓰세요?', '하하, 제가 눈이 나빠서요. 혈압 얘기로 돌아갈까요?'] },
      { ok: ['혈압이 왜 높아졌을까요?', '국물을 많이 드시고 잠을 잘 못 주무신 것 같아요.'], non: [['병원은 몇 시까지 해요?', '여섯 시까지요.']], trap: ['왜 약국이 멀어요?', '그건 저도 잘…'] },
    ], end: '궁금한 걸 물어보시니 좋네요. 국물은 줄이고 푹 주무세요.',
      check: ['혈압이 왜 높아졌다고 하셨나요?', '국물을 많이 먹고 잠을 잘 못 자서', ['운동을 너무 많이 해서', '물을 많이 마셔서']] },
    { who: '손자 준호', face: '👦', open: '할아버지! 나 오늘 기분 최고예요!', steps: [
      { ok: ['왜 그렇게 기분이 좋아?', '받아쓰기 100점 맞았어요!'], non: [['밥은 먹었니?', '네! 근데 할아버지, 들어 보세요~'], ['시끄럽다', '…(시무룩)']], trap: ['왜 울어?', '안 울어요, 웃고 있잖아요!'] },
      { ok: ['왜 이번엔 100점을 받은 것 같아?', '어제 엄마랑 세 번이나 연습했거든요!'], non: [['받아쓰기는 몇 시에 했니?', '아침에요! 근데요~']], trap: ['왜 공부를 싫어하니?', '저 공부 좋아하는데요?'] },
    ], end: '할아버지가 물어봐 주니까 더 신나요! 다음에도 연습할래요!',
      check: ['준호는 왜 기분이 좋았나요?', '연습을 많이 해서 받아쓰기 100점을 맞아서', ['생일이라서', '놀이공원에 가서']] },
    { who: '딸', face: '👩‍🦰', open: '엄마, 나 다음 달에 이사해.', steps: [
      { ok: ['왜 이사를 하니?', '회사가 멀어서 출퇴근이 너무 힘들어.'], non: [['이삿짐은 많니?', '그건 나중에 얘기하고~'], ['그래, 잘 가라', '엄마, 서운하게…']], trap: ['왜 결혼을 안 하니?', '엄마, 지금 그 얘기가 아니잖아~'] },
      { ok: ['출퇴근이 왜 그렇게 힘드니?', '버스를 두 번 갈아타서 한 시간 반이나 걸려.'], non: [['버스비는 얼마니?', '천오백 원… 그게 중요한 게 아니고~']], trap: ['왜 버스를 좋아하니?', '좋아하는 게 아니라 힘들다니까~'] },
    ], end: '엄마가 물어봐 주니까 내 맘을 알아주는 것 같아. 이사하면 놀러 와!',
      check: ['딸은 왜 이사를 하나요?', '회사가 멀어서 출퇴근이 너무 힘들어서', ['집세가 올라서', '친구와 같이 살려고']] },
    { who: '성가대 권사님', face: '👵', open: '이번 주 성가대 연습은 쉬어요.', steps: [
      { ok: ['왜 쉬어요?', '지휘자 선생님이 목감기에 걸리셨대요.'], non: [['연습은 몇 시였죠?', '일곱 시였는데, 이번 주는 쉬어요.'], ['잘됐네요', '아이고, 그런 말씀을…']], trap: ['왜 성가를 부르기 싫으세요?', '싫은 게 아니고요~'] },
      { ok: ['왜 감기에 걸리셨대요?', '지난주 비 오는 날 우산 없이 다니셨대요.'], non: [['지휘자 선생님 연세가 어떻게 돼요?', '예순쯤이요. 근데…']], trap: ['왜 교회를 옮기셨어요?', '옮기신 거 아니에요~'] },
    ], end: '물어봐 주셔서 저도 다시 알게 됐네요. 다음 주에 뵈어요!',
      check: ['성가대 연습은 왜 쉬나요?', '지휘자 선생님이 비 맞고 감기에 걸리셔서', ['교회 공사 때문에', '성가대가 없어져서']] },
  ];

  const rnd = n => Math.floor(Math.random() * n);
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function level() {
    const v = currentMember && currentMember.whyLevel;
    return Math.min(MAX_LV, Math.max(1, Number.isFinite(v) ? v : 1));
  }
  function pickScenarios() {
    const recent = new Set(((currentMember && currentMember.whyLog) || []).slice(-3).flatMap(r => r.ids || []));
    return shuffleArr(S.map((s, i) => ({ s, i, w: (recent.has(i) ? 2 : 0) + Math.random() }))).sort((a, b) => a.w - b.w).slice(0, PER_GAME);
  }

  function injectStyle() {
    if (document.getElementById('whyStyle')) return;
    const st = document.createElement('style');
    st.id = 'whyStyle';
    st.textContent = `
      .wy-chat{background:#B2C7DA;border-radius:18px;padding:14px 10px;min-height:260px;}
      .wy-row{display:flex;gap:8px;margin:8px 0;align-items:flex-start;}
      .wy-row.me{justify-content:flex-end;}
      .wy-face{flex:0 0 42px;width:42px;height:42px;border-radius:15px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;}
      .wy-name{font-size:13px;color:#3A4A5A;margin-bottom:2px;text-align:left;}
      .wy-b{max-width:78%;background:#fff;border-radius:4px 16px 16px 16px;padding:10px 13px;font-size:19px;line-height:1.5;color:#191F28;word-break:keep-all;text-align:left;animation:pop .25s ease;}
      .wy-row.me .wy-b{background:#FEE500;border-radius:16px 4px 16px 16px;}
      .wy-tip{margin:10px 2px 0;background:#FFF4E5;border:2px solid #FFC56B;border-radius:14px;padding:10px 12px;font-family:'Jua';font-size:18px;line-height:1.5;color:#8A5300;text-align:left;}
      .wy-tip.good{background:#E8F7F2;border-color:#8FD3C2;color:#1E6B5C;}
      .wy-ask{font-family:'Jua';font-size:18px;margin:14px 2px 8px;text-align:left;color:#333D4B;}
      .wy-opt{display:block;width:100%;text-align:left;border:2px solid #E5E8EB;background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:9px;font-size:19px;line-height:1.45;color:#191F28;cursor:pointer;word-break:keep-all;}
      .wy-opt:active{transform:scale(.98);}
      .wy-opt.gone{opacity:.35;pointer-events:none;}
      .wy-type{display:flex;gap:8px;margin-top:4px;}
      .wy-type input{flex:1;min-width:0;font-size:19px;padding:12px 14px;border:2px solid #E5E8EB;border-radius:14px;font-family:inherit;}
      .wy-type button{border:0;border-radius:14px;background:#3182F6;color:#fff;font-weight:700;font-size:18px;padding:0 16px;cursor:pointer;}
      .wy-write{border:0;background:#F2F4F6;border-radius:999px;padding:9px 14px;font-size:16px;font-weight:700;color:#333D4B;cursor:pointer;margin:2px 0 8px;}
    `;
    document.head.appendChild(st);
  }

  function play({ onDone } = {}) {
    injectStyle();
    const L = level();
    const picks = pickScenarios();
    const startedAt = Date.now();
    let si = 0, wrongTotal = 0, typedAsks = 0;
    const scores = [];

    const nextScenario = () => (si >= picks.length ? finish() : runScenario(picks[si++].s));

    function runScenario(sc) {
      clear();
      const steps = sc.steps.slice(0, L === 1 ? 1 : 2);
      const bar = typeof stageBar === 'function' && typeof session !== 'undefined' && session ? stageBar() : '';
      const v = el(`
        <div class="fade">
          ${bar}
          <div class="scoreline"><span class="pill">💬 ${si}/${picks.length} · ${L}단계</span></div>
          <div class="panel" style="padding:14px;">
            <div class="wy-chat" id="wyChat"></div>
            <div id="wyTip"></div>
            <div id="wyArea"></div>
          </div>
        </div>`);
      app.appendChild(v);
      const chat = v.querySelector('#wyChat'), tipEl = v.querySelector('#wyTip'), area = v.querySelector('#wyArea');
      const say = (text, me) => {
        chat.insertAdjacentHTML('beforeend', me
          ? `<div class="wy-row me"><div class="wy-b">${esc(text)}</div></div>`
          : `<div class="wy-row"><div class="wy-face">${sc.face}</div><div><div class="wy-name">${esc(sc.who)}</div><div class="wy-b">${esc(text)}</div></div></div>`);
        chat.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      };
      const tip = (html, good) => { tipEl.innerHTML = html ? `<div class="wy-tip${good ? ' good' : ''}">${html}</div>` : ''; };
      let stepIdx = 0, scenarioWrong = 0;
      say(sc.open);

      const askStep = () => {
        const st = steps[stepIdx];
        const opts = [{ t: st.ok[0], r: st.ok[1], kind: 'ok' }, ...st.non.map(([t, r]) => ({ t, r, kind: 'non' }))];
        if (L >= 3 && st.trap) opts.push({ t: st.trap[0], r: st.trap[1], kind: 'trap' });
        const shown = shuffleArr(opts).slice(0, 3);
        if (!shown.some(o => o.kind === 'ok')) shown[0] = opts[0];
        area.innerHTML = `<div class="wy-ask">${stepIdx === 0 ? '뭐라고 말할까요?' : '이유를 더 알고 싶어요. 한 번 더 물어볼까요?'}</div>
          ${shuffleArr(shown).map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}
          <button class="wy-write" type="button" id="wyWrite">✍️ 직접 써서 물어보기</button>`;
        const list = [...area.querySelectorAll('.wy-opt')].map(b => shown.find(o => o.t === b.textContent));
        const proceed = (askedText, typed) => {
          say(askedText, true);
          area.innerHTML = '';
          setTimeout(() => {
            say(st.ok[1]);
            if (typed) typedAsks++;
            tip(typed ? '👍 직접 "왜"라고 잘 물어보셨어요!' : '👍 "왜"라고 물어보니 이유를 말해 줬어요!', true);
            if (typeof beep === 'function') beep(660, 0.1);
            stepIdx++;
            setTimeout(() => (stepIdx < steps.length ? askStep() : wrapUp()), 1300);
          }, 600);
        };
        area.querySelectorAll('.wy-opt').forEach((b, i) => b.addEventListener('click', () => {
          const o = list[i];
          if (o.kind === 'ok') { proceed(o.t, false); return; }
          scenarioWrong++; wrongTotal++;
          b.classList.add('gone');
          say(o.t, true);
          setTimeout(() => say(o.r), 500);
          if (typeof beep === 'function') beep(330, 0.08);
          tip(o.kind === 'trap'
            ? '💡 "왜"로 물었지만 지금 이야기와 안 맞아요. 상대가 무슨 말을 했는지 다시 볼까요?'
            : '💡 이유가 궁금할 땐 <b>"왜?"</b> 하고 물어봐요.');
        }));
        area.querySelector('#wyWrite').addEventListener('click', () => {
          area.querySelector('#wyWrite').outerHTML = `<div class="wy-type"><input id="wyIn" type="text" placeholder="예: 왜 그래?" autocomplete="off"><button type="button" id="wySend">보내기</button></div>`;
          const inp = area.querySelector('#wyIn');
          inp.focus();
          const send = () => {
            const text = inp.value.trim();
            if (!text) return;
            if (ASK_WORDS.test(text)) { proceed(text, true); return; }
            scenarioWrong++; wrongTotal++;
            say(text, true);
            setTimeout(() => say('…(이유는 말하지 않아요)'), 500);
            tip('💡 "왜"를 넣어서 물어보면 이유를 알려 줄 거예요. 예: <b>왜 그래?</b>');
            inp.value = '';
          };
          area.querySelector('#wySend').addEventListener('click', send);
          inp.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
        });
      };

      // 대화를 마치면 이유를 잘 알아들었는지 확인
      const wrapUp = () => {
        say(sc.end);
        tip('');
        const [q, a, w] = sc.check;
        const opts = shuffleArr([{ t: a, ok: true }, ...w.map(t => ({ t, ok: false }))]);
        setTimeout(() => {
          area.innerHTML = `<div class="wy-ask">🔍 ${esc(q)}</div>${opts.map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}`;
          let checkWrong = 0;
          area.querySelectorAll('.wy-opt').forEach((b, i) => b.addEventListener('click', () => {
            if (!opts[i].ok) { checkWrong++; wrongTotal++; b.classList.add('gone'); tip('💡 대화를 다시 읽어 볼까요? 상대가 말해 준 이유가 있어요.'); return; }
            const total = scenarioWrong + checkWrong;
            scores.push(total === 0 ? 100 : total === 1 ? 75 : total === 2 ? 55 : 40);
            area.innerHTML = `<button class="btn btn-primary" type="button" id="wyNext" style="margin-top:6px;font-size:21px;padding:16px;">${si >= picks.length ? '끝내기' : '다음 대화 →'}</button>`;
            tip(total === 0 ? '🎉 완벽해요! 물어보고, 듣고, 이해까지 했어요.' : '👏 잘했어요! 궁금하면 언제든 "왜?" 하고 물어봐요.', true);
            if (typeof confetti === 'function') confetti(total ? 2 : 5);
            area.querySelector('#wyNext').addEventListener('click', nextScenario);
          }));
        }, 1200);
      };

      setTimeout(askStep, 700);
    }

    function finish() {
      const score = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
      if (currentMember) {
        const nextLv = wrongTotal === 0 ? Math.min(MAX_LV, L + 1) : wrongTotal >= 4 ? Math.max(1, L - 1) : L;
        currentMember.whyLevel = nextLv;
        currentMember.whyLog = [...(currentMember.whyLog || []), { ts: new Date().toISOString(), lv: L, wrong: wrongTotal, typed: typedAsks, score, sec: Math.round((Date.now() - startedAt) / 1000), ids: picks.map(p => p.i) }].slice(-LOG_CAP);
        if (typeof saveMember === 'function') saveMember();
      }
      if (onDone) onDone(score);
    }

    nextScenario();
  }

  function injectAdminPanel(detailView, member) {
    const log = (member.whyLog || []).slice().reverse();
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `<div class="section-title">💬 왜? 물어보기 (${log.length}회 · 지금 ${Math.min(MAX_LV, Math.max(1, member.whyLevel || 1))}단계)</div>
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;"><span>${d(r.ts)} · ${r.lv}단계 · ${r.sec}초</span><span>${r.wrong === 0 ? '⭕ 한 번도 안 틀림' : `틀림 ${r.wrong}번`}${r.typed ? ` · 직접 씀 ${r.typed}` : ''} · ${r.score}점</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  window.WHY = { play, injectAdminPanel, SCENARIOS: S };
})();
