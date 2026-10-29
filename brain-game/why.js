// ==========================================================
// 💼 원인 알아 오기 (말의 문맥을 붙잡고 끝까지 물어서 진짜 원인을 찾는 연습)
// 상사가 "왜 그랬는지 정확히 알아 와요"라고 시키면, 실수한 후배에게 가서 물어본다.
// 후배는 얼버무리고, 그냥 "왜 그랬어요?"만 물으면 같은 핑계만 되풀이한다(답답한 상황).
// 후배가 방금 한 말을 붙잡고 구체적으로 물어야 한 겹씩 이유가 나온다. 혼내거나 몰아가면 입을 닫는다.
// 언제든 상사에게 보고할 수 있지만, 진짜 원인이 아니면 상사에게 혼나고 다시 물으러 가야 한다.
// 음성은 쓰지 않는다(글로만 보여 준다).
// ==========================================================
(function () {
  const PER_GAME = 2, MAX_LV = 3, LOG_CAP = 200;
  const PENALTY = { ask: 10, report: 15, fix: 10 }, MIN_SCORE = 30;

  // 각 일: 상사(boss)가 시키고, 후배(jr)가 얼버무린다(open). layers를 차례로 물어야 마지막에 진짜 원인이 나온다.
  // fact = 보고할 때 고를 수 있는 말, no = 그걸 보고하면 상사가 하는 꾸중
  const S = [
    { boss: ['김 부장님', '👨‍💼'], jr: ['신입 민수 씨', '🧑'],
      order: '오늘 거래처에 보낸 주문서 수량이 틀렸대요. 민수 씨가 왜 그랬는지 정확히 알아 와요.',
      open: '아… 그게… 제가 좀 정신이 없어서요…',
      openFact: ['정신이 없었대요', '정신없는 건 이유가 아니에요! 뭐가 어떻게 된 건지 알아 와요.'],
      dodge: ['그냥… 정신이 없어서요…', '저도 잘 모르겠어요… 아무튼 죄송해요.', '그러니까… 그냥 그렇게 됐어요…'],
      layers: [
        { q: '뭐 하느라 정신이 없었어요?', a: '그날 오전에 주문서 두 개를 같이 쓰고 있었어요.', fact: '주문서 두 개를 한꺼번에 쓰고 있었대요', no: '두 개를 같이 쓴 건 알겠어요. 그래서 뭐가 어떻게 틀렸는데요?' },
        { q: '두 개를 같이 쓰다가 뭐가 잘못됐어요?', a: '음… 숫자를 잘못 넣은 것 같아요.', fact: '숫자를 잘못 넣었대요', no: '숫자가 틀린 건 나도 알아요! 왜 틀렸는지를 알아 오라니까요.' },
        { q: '그 숫자는 어디서 가져다 넣었어요?', a: '다른 거래처 파일에서 복사해 왔어요. 파일 이름이 비슷해서 헷갈렸고… 보내기 전에 다시 확인도 안 했어요.', fact: '이름이 비슷한 다른 거래처 파일에서 숫자를 복사했고, 보내기 전에 확인을 안 했대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '보내기 전에 숫자를 한 번 더 확인한다', ['일을 더 빨리 한다', '주문서를 아예 안 쓴다']] },
    { boss: ['이 부장님', '👩‍💼'], jr: ['신입 지영 씨', '👩'],
      order: '아침 회의 자료가 10분이나 늦게 왔어요. 지영 씨가 왜 늦었는지 정확히 알아 와요.',
      open: '죄송해요… 아침에 일이 좀 꼬여서요…',
      openFact: ['아침에 일이 꼬였대요', '일이 꼬였다는 건 이유가 아니죠. 뭐가 꼬였는지 알아 와요.'],
      dodge: ['그게… 그냥 좀 꼬였어요…', '저도 정신이 없어서요… 죄송해요.', '이것저것 하다 보니까요…'],
      layers: [
        { q: '아침에 뭐가 꼬였어요?', a: '자료를 뽑으려는데 복사기가 안 됐어요.', fact: '복사기가 안 됐대요', no: '복사기는 안 될 수도 있죠. 그런데 왜 10분이나 늦었는지를 알아 와야죠.' },
        { q: '복사기가 왜 안 됐어요?', a: '종이가 떨어졌어요. 창고에 가지러 갔는데 열쇠가 어디 있는지 몰라서 헤맸어요.', fact: '종이가 떨어졌는데 창고 열쇠를 못 찾아서 헤맸대요', no: '열쇠를 왜 몰랐는지가 중요해요. 그것까지 알아 와요.' },
        { q: '창고 열쇠 자리를 왜 몰랐어요?', a: '들어온 지 일주일이라 아무도 알려 준 적이 없어요. 그리고 자료도 회의 바로 전에 뽑기 시작했어요.', fact: '아무도 열쇠 자리를 알려 주지 않았고, 자료를 회의 바로 전에야 뽑기 시작했대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '신입에게 물건 자리를 알려 주고, 자료는 전날 미리 뽑는다', ['복사기를 새로 산다', '회의를 없앤다']] },
    { boss: ['최 사장님', '👨‍🍳'], jr: ['직원 수진 씨', '🧑‍🍳'],
      order: '3번 상 손님이 화가 나셨어요. 매운 걸 못 드신다고 했는데 매운 찌개가 나갔대요. 수진 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 제가 바빠서 깜빡했나 봐요…',
      openFact: ['바빠서 깜빡했대요', '점심때는 다 바빠요! 뭘 왜 깜빡했는지 정확히 알아 와요.'],
      dodge: ['그냥… 바빠서요…', '정신이 없어서 기억이 잘 안 나요…', '죄송해요… 깜빡했어요…'],
      layers: [
        { q: '맵지 않게 해 달라는 말, 어디에 적었어요?', a: '그게… 안 적고 머리로만 외웠어요.', fact: '주문을 적지 않고 외웠대요', no: '외웠다는 건 알겠고, 그래서 왜 틀렸는데요?' },
        { q: '외운 걸 주방에 말할 때 어떻게 됐어요?', a: '그사이에 다른 상 주문이 세 개나 들어와서, 주방에 "덜 맵게"를 빼먹었어요.', fact: '주문이 몰려서 주방에 "덜 맵게"를 빼먹었대요', no: '빼먹은 건 알겠어요. 그런데 애초에 왜 안 적었는지 알아 와요.' },
        { q: '그 바쁜 때 왜 적지 않고 외웠어요?', a: '주문 적는 수첩이 다 떨어졌는데, 바빠서 새로 못 받았어요.', fact: '주문 수첩이 떨어져서 외우다가, 주문이 몰려 "덜 맵게"를 빼먹었대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '수첩을 넉넉히 두고, 주문은 꼭 적어서 주방에 전한다', ['매운 메뉴를 없앤다', '손님을 덜 받는다']] },
    { boss: ['정 사장님', '👩‍💼'], jr: ['직원 현우 씨', '🧑'],
      order: '어제 보낸 택배가 엉뚱한 집으로 갔대요. 현우 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 주소가 좀 이상하게 됐나 봐요…',
      openFact: ['주소가 이상하게 됐대요', '주소가 왜 이상해졌는지 알아 오라는 거예요!'],
      dodge: ['저도 잘 모르겠어요… 주소가 그냥 그렇게 됐어요.', '음… 컴퓨터가 이상했나…?', '제가 실수했나 봐요…'],
      layers: [
        { q: '주소는 어떻게 옮겨 적었어요?', a: '손님 주문 화면에서 복사해서 택배 종이에 붙였어요.', fact: '주문 화면에서 주소를 복사해 붙였대요', no: '복사해서 붙이는 건 평소랑 같잖아요. 뭐가 달랐는지 알아 와요.' },
        { q: '복사해서 붙였는데 왜 다른 주소가 들어갔어요?', a: '아… 그 손님이 주소를 바꿔 달라고 문자를 보냈는데, 저는 바뀌기 전 주소를 붙였어요.', fact: '손님이 바꾼 주소 말고 예전 주소를 붙였대요', no: '예전 주소를 붙였다… 그럼 바뀐 주소는 왜 못 봤대요?' },
        { q: '주소 바꿔 달라는 문자는 왜 못 봤어요?', a: '그 문자가 가게 폰으로 왔는데, 가게 폰은 사장님만 보셔서 저한테 전달이 안 됐어요.', fact: '주소를 바꿔 달라는 문자가 가게 폰으로만 와서 전달을 못 받았대요' },
      ],
      praise: '아… 내 폰으로 왔었구나. 원인을 정확히 알아 왔네요. 고마워요.',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '주소 바꿔 달라는 문자는 바로 담당자에게 전해 준다', ['택배를 안 보낸다', '현우 씨를 크게 혼낸다']] },
    { boss: ['박 부장님', '👨‍💼'], jr: ['신입 태호 씨', '🧑'],
      order: '오늘 거래처 만남에 태호 씨가 30분이나 늦었대요. 왜 늦었는지 정확히 알아 와요.',
      open: '죄송합니다… 길이 좀 막혀서요…',
      openFact: ['길이 막혔대요', '길은 원래 막혀요! 진짜 이유를 알아 와요.'],
      dodge: ['그냥… 차가 많았어요…', '오늘따라 이상하게 막혔어요…', '죄송합니다… 길이…'],
      layers: [
        { q: '몇 시에 출발했어요?', a: '두 시 반이요. 약속이 세 시인 줄 알았거든요.', fact: '약속이 세 시인 줄 알고 두 시 반에 출발했대요', no: '세 시인 줄 알았다고요? 약속은 두 시 반이었어요. 왜 시간을 잘못 알았는지 알아 와요.' },
        { q: '약속이 세 시라고 왜 생각했어요?', a: '제 달력에 세 시로 적혀 있었어요.', fact: '달력에 세 시로 적혀 있었대요', no: '달력이 틀렸다면, 왜 틀리게 적혀 있었는지 알아 와야죠.' },
        { q: '달력에는 왜 세 시로 적혀 있었어요?', a: '거래처에서 두 시 반으로 바꾸자는 메일이 왔는데, 제가 그 메일을 못 보고 처음 시간을 그대로 뒀어요.', fact: '두 시 반으로 바뀌었다는 메일을 못 봐서, 달력에 예전 시간이 그대로 있었대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '약속 전날 메일과 시간을 한 번 더 확인한다', ['차를 새로 산다', '거래처를 안 만난다']] },
    { boss: ['관리소장님', '👨‍💼'], jr: ['김 주임', '👷'],
      order: '오늘 엘리베이터 점검인데 안내문이 안 붙어서 주민들 항의가 많아요. 김 주임한테 왜 그랬는지 알아 와요.',
      open: '그게… 붙이려고 했는데요…',
      openFact: ['붙이려고 했었대요', '붙이려고 했다는 건 이유가 아니죠! 왜 못 붙였는지 알아 와요.'],
      dodge: ['진짜 붙이려고 했어요…', '어쩌다 보니 그렇게 됐어요…', '제가 좀 늦었어요… 죄송해요.'],
      layers: [
        { q: '붙이려고 했는데 왜 못 붙였어요?', a: '안내문을 아직 못 뽑았어요.', fact: '안내문을 아직 못 뽑았대요', no: '못 뽑았으면 왜 못 뽑았는지까지 알아 와야죠.' },
        { q: '안내문은 왜 아직 못 뽑았어요?', a: '점검 날짜를 어제 저녁에야 들었어요.', fact: '점검 날짜를 어제 저녁에야 들었대요', no: '어제 저녁에 들었다… 왜 그렇게 늦게 들었는지 알아 와요.' },
        { q: '점검 날짜를 왜 어제 저녁에야 들었어요?', a: '점검 회사가 일주일 전에 팩스를 보냈는데, 팩스기 옆에 쌓인 종이에 묻혀서 아무도 못 봤어요.', fact: '일주일 전에 온 점검 팩스가 쌓인 종이에 묻혀서 아무도 못 봤대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '팩스는 매일 확인해서 바로 담당자에게 준다', ['엘리베이터 점검을 안 한다', '주민들에게 계단만 쓰라고 한다']] },
    { boss: ['빵집 사장님', '👩‍🍳'], jr: ['직원 은지 씨', '👧'],
      order: '생일 케이크 찾으러 오신 손님이 계신데 케이크가 없대요! 은지 씨한테 왜 그랬는지 알아 와요.',
      open: '어… 그 케이크 오늘 아닌 줄 알았어요…',
      openFact: ['오늘이 아닌 줄 알았대요', '오늘이 아닌 줄 알았다는 건 알겠어요. 왜 그렇게 알았는지 알아 와요.'],
      dodge: ['그냥… 오늘이 아닌 줄 알았어요…', '저도 왜 그랬는지 모르겠어요…', '죄송해요… 헷갈렸어요…'],
      layers: [
        { q: '예약은 어디에 적었어요?', a: '예약 공책에 적었어요.', fact: '예약 공책에 적었대요', no: '공책에 적었는데 왜 틀렸는지를 알아 와야죠.' },
        { q: '공책에 날짜를 뭐라고 적었어요?', a: '"토요일"이라고만 적었어요. 날짜는 안 적었어요.', fact: '날짜 없이 "토요일"이라고만 적었대요', no: '오늘이 토요일인데, 왜 오늘이 아니라고 생각했는지 알아 와요.' },
        { q: '오늘이 토요일인데 왜 오늘이 아니라고 생각했어요?', a: '손님이 어제 전화로 "토요일"이라고 하셔서 다음 주 토요일인 줄 알았어요. 손님은 오늘을 말씀하신 거였어요.', fact: '날짜 없이 "토요일"이라고만 적어서, 어느 토요일인지 헷갈렸대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '예약은 요일만 말고 날짜까지 꼭 적는다', ['케이크를 미리 많이 만든다', '예약을 안 받는다']] },
    { boss: ['마트 점장님', '👨‍💼'], jr: ['직원 동민 씨', '🧑'],
      order: '우유 칸이 텅 비어서 손님들이 그냥 가셨어요. 동민 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 우유가 좀 늦게 왔어요…',
      openFact: ['우유가 늦게 왔대요', '늦게 왔으면 왜 늦게 왔는지 알아 와야죠!'],
      dodge: ['그냥 늦게 왔어요…', '원래 오는 시간에 안 왔어요…', '저도 잘 모르겠어요…'],
      layers: [
        { q: '우유 업체에는 왜 늦었는지 물어봤어요?', a: '네, 물어보니까 주문이 안 들어와서 못 보냈대요.', fact: '업체에 주문이 안 들어갔대요', no: '주문이 안 들어갔다고요? 왜 안 들어갔는지 알아 와요.' },
        { q: '주문은 누가 넣기로 했어요?', a: '원래 제가 매일 저녁에 넣는데, 어제는 영식 씨가 넣기로 했어요.', fact: '어제는 영식 씨가 주문을 넣기로 했대요', no: '영식 씨한테 넘겼다면, 왜 주문이 빠졌는지까지 알아 와요.' },
        { q: '영식 씨한테는 어떻게 부탁했어요?', a: '퇴근하면서 말로만 "우유 주문 좀 해 줘" 했는데, 영식 씨는 못 들었대요.', fact: '말로만 부탁해서 영식 씨가 못 들었고, 그래서 주문이 빠졌대요' },
      ],
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '일을 넘길 때는 말로만 말고 적어서 확인받는다', ['우유를 안 판다', '영식 씨를 크게 혼낸다']] },
  ];

  // 그냥 "왜?"만 되풀이하는 질문 — 후배는 같은 핑계만 댄다
  const VAGUE = ['왜 그랬어요?', '그러니까 왜요?', '아니, 그러니까 왜 그랬냐고요?'];
  // 혼내기 / 딴소리 / 몰아가기 — 후배가 입을 닫거나 방어만 한다
  const SCOLD = [['또 실수했어요? 정신 좀 차려요!', '…죄송합니다. (고개를 푹 숙이고 말이 없어요)'], ['이게 몇 번째예요?', '…(아무 말도 안 해요)'], ['그걸 지금 변명이라고 해요?', '…죄송합니다…']];
  const OFF = [['점심은 먹었어요?', '네…? 아, 네… 먹었어요.'], ['요즘 날씨 춥죠?', '네… 춥네요…'], ['주말에 뭐 했어요?', '집에 있었어요… 그런데요?']];
  const LEAD = [['혹시 대충 한 거 아니에요?', '아니에요! 대충 한 거 아니에요…'], ['일부러 그런 거죠?', '아니에요! 그런 거 정말 아니에요…'], ['하기 싫었던 거죠?', '그런 거 아니에요… 억울해요…']];
  const FAKE = ['일이 너무 많아서 그랬대요', '원래 실수가 잦은 사람이래요'];
  const FAKE_NO = '그건 짐작이잖아요! 직접 들은 진짜 원인을 알아 와요.';

  const TIPS = {
    vague: '💡 그냥 "왜?"만 물으면 똑같이 얼버무려요. 후배가 <b>방금 한 말</b>을 붙잡고 자세히 물어봐요.',
    scold: '💡 혼내면 입을 닫아요. 차분하게 물어봐야 이야기를 해요.',
    off: '💡 지금 알아낼 건 <b>실수한 원인</b>이에요.',
    lead: '💡 짐작으로 몰아가면 방어만 해요. 들은 말에서 물어봐요.',
  };

  const rnd = n => Math.floor(Math.random() * n);
  const pickOne = a => a[rnd(a.length)];
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // 받침에 따라 이/가 ("민수 씨가", "김 주임이")
  const iGa = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c <= 11171 && c % 28 ? '이' : '가'); };

  function level() {
    const v = currentMember && currentMember.probeLevel;
    return Math.min(MAX_LV, Math.max(1, Number.isFinite(v) ? v : 1));
  }
  function pickScenarios() {
    const recent = new Set(((currentMember && currentMember.probeLog) || []).slice(-3).flatMap(r => r.ids || []));
    return shuffleArr(S.map((s, i) => ({ s, i, w: (recent.has(i) ? 2 : 0) + Math.random() }))).sort((a, b) => a.w - b.w).slice(0, PER_GAME);
  }

  // 단계별 보기: 1단계 = 맞는 질문 + "왜?"만, 2단계 = + 혼내기나 딴소리, 3단계 = + 몰아가기(보고에도 짐작이 섞임)
  function questionOptions(L, layer, layerIdx) {
    const opts = [{ t: layer.q, kind: 'good' }, { t: VAGUE[layerIdx % VAGUE.length], kind: 'vague' }];
    if (L >= 2) {
      const kind = Math.random() < 0.5 ? 'scold' : 'off';
      const [t, r] = pickOne(kind === 'scold' ? SCOLD : OFF);
      opts.push({ t, r, kind });
    }
    if (L >= 3) { const [t, r] = pickOne(LEAD); opts.push({ t, r, kind: 'lead' }); }
    return shuffleArr(opts);
  }

  function injectStyle() {
    if (document.getElementById('whyStyle')) return;
    const st = document.createElement('style');
    st.id = 'whyStyle';
    st.textContent = `
      .wy-chat{background:#B2C7DA;border-radius:18px;padding:14px 10px;min-height:240px;max-height:52vh;overflow-y:auto;}
      .wy-chat.shake{animation:wyShake .45s ease;}
      @keyframes wyShake{0%,100%{transform:translateX(0);}20%{transform:translateX(-9px);}40%{transform:translateX(8px);}60%{transform:translateX(-6px);}80%{transform:translateX(4px);}}
      .wy-row{display:flex;gap:8px;margin:8px 0;align-items:flex-start;}
      .wy-row.me{justify-content:flex-end;}
      .wy-face{flex:0 0 42px;width:42px;height:42px;border-radius:15px;background:#fff;display:flex;align-items:center;justify-content:center;font-size:26px;}
      .wy-name{font-size:13px;color:#3A4A5A;margin-bottom:2px;text-align:left;}
      .wy-b{max-width:78%;background:#fff;border-radius:4px 16px 16px 16px;padding:10px 13px;font-size:19px;line-height:1.5;color:#191F28;word-break:keep-all;text-align:left;animation:pop .25s ease;}
      .wy-row.me .wy-b{background:#FEE500;border-radius:16px 4px 16px 16px;}
      .wy-row.boss .wy-b{background:#EEF4FF;border:2px solid #9EC1FF;}
      .wy-row.angry .wy-b{background:#FFECEC;border:2px solid #F04452;color:#B0202E;font-weight:700;}
      .wy-row.happy .wy-b{background:#E8F7F2;border:2px solid #8FD3C2;}
      .wy-move{text-align:center;font-size:14px;color:#3A4A5A;margin:12px 0 6px;font-weight:700;}
      .wy-move span{background:rgba(255,255,255,.6);border-radius:999px;padding:4px 12px;}
      .wy-tip{margin:10px 2px 0;background:#FFF4E5;border:2px solid #FFC56B;border-radius:14px;padding:10px 12px;font-family:'Jua';font-size:18px;line-height:1.5;color:#8A5300;text-align:left;}
      .wy-tip.good{background:#E8F7F2;border-color:#8FD3C2;color:#1E6B5C;}
      .wy-tip.bad{background:#FFECEC;border-color:#F04452;color:#B0202E;}
      .wy-ask{font-family:'Jua';font-size:18px;margin:14px 2px 8px;text-align:left;color:#333D4B;}
      .wy-opt{display:block;width:100%;text-align:left;border:2px solid #E5E8EB;background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:9px;font-size:19px;line-height:1.45;color:#191F28;cursor:pointer;word-break:keep-all;}
      .wy-opt:active{transform:scale(.98);}
      .wy-opt.gone{opacity:.35;pointer-events:none;}
      .wy-report{display:block;width:100%;border:0;border-radius:16px;background:#3182F6;color:#fff;font-weight:700;font-size:19px;padding:15px;margin-top:6px;cursor:pointer;}
      .wy-report.ghost{background:#F2F4F6;color:#333D4B;}
      .wy-report.pulse{animation:wyPulse 1.2s ease-in-out infinite;}
      @keyframes wyPulse{0%,100%{box-shadow:0 0 0 0 rgba(49,130,246,.5);}50%{box-shadow:0 0 0 8px rgba(49,130,246,0);}}
    `;
    document.head.appendChild(st);
  }

  function play({ onDone } = {}) {
    injectStyle();
    const L = level();
    const picks = pickScenarios();
    const startedAt = Date.now();
    let si = 0;
    const tally = { ask: 0, report: 0, fix: 0 };
    const scores = [];

    const nextScenario = () => (si >= picks.length ? finish() : runScenario(picks[si++].s));

    function runScenario(sc) {
      clear();
      const bar = typeof stageBar === 'function' && typeof session !== 'undefined' && session ? stageBar() : '';
      const v = el(`
        <div class="fade">
          ${bar}
          <div class="scoreline"><span class="pill">💼 ${si}/${picks.length} · ${L}단계</span></div>
          <div class="panel" style="padding:14px;">
            <div class="wy-chat" id="wyChat"></div>
            <div id="wyTip"></div>
            <div id="wyArea"></div>
          </div>
        </div>`);
      app.appendChild(v);
      const chat = v.querySelector('#wyChat'), tipEl = v.querySelector('#wyTip'), area = v.querySelector('#wyArea');
      const [bossName, bossFace] = sc.boss, [jrName, jrFace] = sc.jr;
      const tallyAtStart = { ...tally };
      const known = [{ fact: sc.openFact[0], no: sc.openFact[1] }]; // 지금까지 들은 말 = 보고할 수 있는 말
      let layerIdx = 0, wrongHere = 0, dodgeIdx = 0;
      const foundRoot = () => layerIdx >= sc.layers.length;

      const scroll = () => { chat.scrollTop = chat.scrollHeight; };
      const say = (who, text, mood) => {
        const isBoss = who === 'boss';
        chat.insertAdjacentHTML('beforeend', who === 'me'
          ? `<div class="wy-row me"><div class="wy-b">${esc(text)}</div></div>`
          : `<div class="wy-row ${isBoss ? 'boss' : ''} ${mood || ''}"><div class="wy-face">${isBoss ? bossFace : jrFace}</div><div><div class="wy-name">${esc(isBoss ? bossName : jrName)}</div><div class="wy-b">${esc(text)}</div></div></div>`);
        scroll();
      };
      const move = text => { chat.insertAdjacentHTML('beforeend', `<div class="wy-move"><span>${esc(text)}</span></div>`); scroll(); };
      const tip = (html, cls) => { tipEl.innerHTML = html ? `<div class="wy-tip ${cls || ''}">${html}</div>` : ''; };
      const later = (fn, ms) => setTimeout(fn, ms);
      const penalty = () => ['ask', 'report', 'fix'].reduce((s, k) => s + (tally[k] - tallyAtStart[k]) * PENALTY[k], 0);

      function askStep() {
        if (foundRoot()) {
          area.innerHTML = `<button class="wy-report pulse" type="button" id="wyRep">📋 ${esc(bossName)}께 보고하러 가기</button>`;
          area.querySelector('#wyRep').addEventListener('click', report);
          return;
        }
        const layer = sc.layers[layerIdx];
        const opts = questionOptions(L, layer, layerIdx);
        area.innerHTML = `<div class="wy-ask">${esc(jrName)}에게 뭐라고 물어볼까요?</div>
          ${opts.map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}
          <button class="wy-report ghost" type="button" id="wyRep">📋 이 정도면 됐어요, 보고하러 가기</button>`;
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => onAsk(opts[Number(b.dataset.i)], b, layer)));
        area.querySelector('#wyRep').addEventListener('click', report);
      }

      function onAsk(o, btn, layer) {
        say('me', o.t);
        if (o.kind === 'good') {
          area.innerHTML = '';
          later(() => {
            say('jr', layer.a);
            known.push({ fact: layer.fact, no: layer.no });
            layerIdx++;
            if (typeof beep === 'function') beep(660, 0.1);
            tip(foundRoot()
              ? '🔎 진짜 원인이 나온 것 같아요! 보고하러 가 볼까요?'
              : '👍 한 겹 더 알아냈어요. 그런데 이게 진짜 원인일까요?', 'good');
            later(askStep, 1100);
          }, 600);
          return;
        }
        tally.ask++; wrongHere++;
        btn.classList.add('gone');
        const answer = o.kind === 'vague' ? sc.dodge[dodgeIdx++ % sc.dodge.length] : o.r;
        later(() => say('jr', answer), 500);
        if (typeof beep === 'function') beep(330, 0.08);
        tip(TIPS[o.kind]);
      }

      // 보고: 지금까지 들은 말 중에서 고른다. 진짜 원인이 아니면 상사에게 혼난다.
      function report() {
        move(`🚶 ${bossName}께 갔어요`);
        tip('');
        const opts = known.map((k, i) => ({ t: k.fact, no: k.no, root: foundRoot() && i === known.length - 1 }));
        if (L >= 3) opts.push({ t: pickOne(FAKE), no: FAKE_NO, root: false });
        const shown = shuffleArr(opts);
        area.innerHTML = `<div class="wy-ask">📋 뭐라고 보고할까요? "${esc(iGa(jrName))}…"</div>
          ${shown.map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}`;
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => onReport(shown[Number(b.dataset.i)])));
      }

      function onReport(o) {
        area.innerHTML = '';
        say('me', `${bossName}, ${iGa(jrName)} ${o.t}.`);
        later(() => {
          if (o.root) {
            say('boss', sc.praise || '바로 이거예요! 원인을 정확히 알아 왔네요. 👍', 'happy');
            if (typeof beep === 'function') beep(880, 0.12);
            later(askFix, 1100);
            return;
          }
          tally.report++; wrongHere++;
          say('boss', `😠 ${o.no}`, 'angry');
          chat.classList.remove('shake'); void chat.offsetWidth; chat.classList.add('shake');
          if (typeof beep === 'function') beep(220, 0.15);
          if (navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* 진동이 없는 기기 */ } }
          tip('😓 혼났어요… 아직 진짜 원인이 아니에요. 다시 가서 더 물어봐요.', 'bad');
          area.innerHTML = `<button class="wy-report" type="button" id="wyBack">🚶 ${esc(jrName)}에게 다시 물어보러 가기</button>`;
          area.querySelector('#wyBack').addEventListener('click', () => {
            move(`🚶 ${jrName}에게 다시 갔어요`);
            tip('');
            askStep();
          });
        }, 600);
      }

      // 원인을 알았으면 앞으로 어떻게 할지까지
      function askFix() {
        const [q, a, wrongs] = sc.fix;
        say('boss', q);
        const opts = shuffleArr([{ t: a, ok: true }, ...wrongs.map(t => ({ t, ok: false }))]);
        area.innerHTML = `<div class="wy-ask">🤔 알아낸 원인에 맞는 방법을 골라 보세요</div>
          ${opts.map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}`;
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => {
          const o = opts[Number(b.dataset.i)];
          if (!o.ok) {
            tally.fix++; wrongHere++;
            b.classList.add('gone');
            tip('💡 알아낸 원인을 다시 떠올려 봐요. 그 원인을 막는 방법은 뭘까요?');
            return;
          }
          area.innerHTML = '';
          say('me', o.t);
          later(() => {
            say('boss', '좋아요. 덕분에 같은 실수는 안 하겠네요. 수고했어요!', 'happy');
            scores.push(Math.max(MIN_SCORE, 100 - penalty()));
            tip(wrongHere === 0 ? '🎉 완벽해요! 끝까지 물어서 진짜 원인을 찾았어요.' : '👏 잘했어요! 진짜 원인을 찾아냈어요.', 'good');
            if (typeof confetti === 'function') confetti(wrongHere ? 2 : 5);
            area.innerHTML = `<button class="btn btn-primary" type="button" id="wyNext" style="margin-top:6px;font-size:21px;padding:16px;">${si >= picks.length ? '끝내기' : '다음 일 →'}</button>`;
            area.querySelector('#wyNext').addEventListener('click', nextScenario);
          }, 500);
        }));
      }

      say('boss', sc.order);
      later(() => { move(`🚶 ${jrName}에게 갔어요`); say('jr', sc.open); }, 900);
      later(() => {
        if (L <= 2) tip(`🎯 ${esc(iGa(bossName))} 원하는 건 <b>진짜 원인</b>이에요. ${esc(iGa(jrName))} 한 말을 붙잡고 자세히 물어보세요.`);
        askStep();
      }, 1700);
    }

    function finish() {
      const score = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
      const wrong = tally.ask + tally.report;
      if (currentMember) {
        currentMember.probeLevel = wrong <= 1 ? Math.min(MAX_LV, L + 1) : wrong >= 6 ? Math.max(1, L - 1) : L;
        currentMember.probeLog = [...(currentMember.probeLog || []), {
          ts: new Date().toISOString(), lv: L, ask: tally.ask, report: tally.report, fix: tally.fix, score,
          sec: Math.round((Date.now() - startedAt) / 1000), ids: picks.map(p => p.i),
        }].slice(-LOG_CAP);
        if (typeof saveMember === 'function') saveMember();
      }
      if (onDone) onDone(score);
    }

    nextScenario();
  }

  function injectAdminPanel(detailView, member) {
    const log = (member.probeLog || []).slice().reverse();
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `<div class="section-title">💼 원인 알아 오기 (${log.length}회 · 지금 ${Math.min(MAX_LV, Math.max(1, member.probeLevel || 1))}단계)</div>
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;gap:8px;"><span>${d(r.ts)} · ${r.lv}단계 · ${r.sec}초</span><span>${r.ask + r.report === 0 ? '⭕ 한 번에' : `헛질문 ${r.ask} · 혼남 ${r.report}`} · ${r.score}점</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  window.WHY = { play, injectAdminPanel, SCENARIOS: S };
})();
