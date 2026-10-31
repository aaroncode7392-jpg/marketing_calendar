// ==========================================================
// 💼 원인 알아 오기 ("왜?"라고 물어보는 게 왜 중요한지 몸으로 배우는 대화 연습)
// 윗사람·가족·손님이 "왜 그랬는지 알아 와요"라고 하면, 실수한 사람에게 가서 "왜?"를 거듭 물어 진짜 원인을 찾는다.
// "왜?"라고 물으면 한 겹씩 이유가 나온다. 나쁜 대답은 "알겠어요", "다음부턴 조심해 줘요"처럼 대충 넘어가는 말이다.
// 대충 넘어가면 같은 실수가 더 크게 되풀이되고, 손해가 이어져 내 월급·알바비·회비·용돈까지 영향을 주는 과정을 보여 준다.
// 그런 뒤 그때로 돌아가 다시 물어볼 수 있다. 진짜 원인을 찾으면 보고하고, 막을 방법까지 고른다.
// 음성은 쓰지 않는다(글로만 보여 준다).
// ==========================================================
(function () {
  const PER_GAME = 2, MAX_LV = 3, LOG_CAP = 200;
  const PENALTY = { brush: 15, report: 10, fix: 10 }, MIN_SCORE = 30;
  const LOSS_STEP_MS = 800;

  // 각 일: 윗사람(boss)이 시키고, 실수한 사람(jr)이 얼버무린다(open). layers를 차례로 물어야 마지막에 진짜 원인이 나온다.
  // fact = 보고할 때 고를 수 있는 말, no = 그걸 보고하면 듣는 꾸중
  // repeat = 대충 넘어갔을 때 다시 벌어지는 일, loss = 손해가 내 돈까지 이어지는 과정
  const S = [
    { place: '회사', boss: ['김 부장님', '👨‍💼'], jr: ['신입 민수 씨', '🧑'],
      order: '오늘 거래처에 보낸 주문서 수량이 틀렸대요. 민수 씨가 왜 그랬는지 알아 와요.',
      open: '아… 그게… 제가 좀 정신이 없어서요…',
      openFact: ['정신이 없었대요', '정신없는 건 이유가 아니에요! 뭐가 어떻게 된 건지 알아 와요.'],
      layers: [
        { q: '왜 그렇게 정신이 없었어요?', a: '그날 오전에 주문서 두 개를 같이 쓰고 있었어요.', fact: '주문서 두 개를 한꺼번에 쓰고 있었대요', no: '두 개를 같이 쓴 건 알겠어요. 그래서 왜 틀렸는데요?' },
        { q: '같이 쓰다가 왜 수량이 틀렸어요?', a: '숫자를 다른 파일에서 복사해 왔는데, 그게 잘못된 것 같아요.', fact: '다른 파일에서 숫자를 복사해 왔대요', no: '복사한 건 알겠어요. 왜 잘못된 걸 가져왔는지가 중요해요.' },
        { q: '왜 잘못된 파일에서 복사했어요?', a: '다른 거래처 파일과 이름이 비슷해서 헷갈렸어요. 보내기 전에 다시 확인도 안 했고요…', fact: '이름이 비슷한 파일을 헷갈렸고, 보내기 전에 확인을 안 했대요' },
      ],
      repeat: '한 달 뒤, 민수 씨가 또 다른 거래처 숫자를 붙여서 보냈어요. 이번엔 100개가 아니라 1,000개로요!',
      loss: ['물건 900개가 잘못 만들어졌어요', '회사 손해 900만 원', '회사 돈이 모자라요', '부장님: "이번 달 성과급은 없어요…"'],
      pay: '내 성과급이 없어졌어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '보내기 전에 숫자를 한 번 더 확인한다', ['일을 더 빨리 한다', '주문서를 아예 안 쓴다']] },
    { place: '회사', boss: ['이 부장님', '👩‍💼'], jr: ['신입 지영 씨', '👩'],
      order: '아침 회의 자료가 10분이나 늦게 왔어요. 지영 씨가 왜 늦었는지 알아 와요.',
      open: '죄송해요… 아침에 일이 좀 꼬여서요…',
      openFact: ['아침에 일이 꼬였대요', '일이 꼬였다는 건 이유가 아니죠. 뭐가 꼬였는지 알아 와요.'],
      layers: [
        { q: '왜 일이 꼬였어요?', a: '자료를 뽑으려는데 복사기가 안 됐어요.', fact: '복사기가 안 됐대요', no: '복사기는 안 될 수도 있죠. 그런데 왜 그렇게 늦었는지 알아 와야죠.' },
        { q: '복사기가 왜 안 됐어요?', a: '종이가 떨어졌어요. 창고에 가지러 갔는데 열쇠가 어디 있는지 몰라서 헤맸어요.', fact: '종이가 떨어졌는데 창고 열쇠를 못 찾았대요', no: '열쇠를 왜 몰랐는지가 중요해요. 그것까지 알아 와요.' },
        { q: '창고 열쇠 자리를 왜 몰랐어요?', a: '들어온 지 일주일이라 아무도 알려 준 적이 없어요. 자료도 회의 바로 전에 뽑기 시작했고요.', fact: '아무도 열쇠 자리를 안 알려 줬고, 자료를 회의 바로 전에 뽑기 시작했대요' },
      ],
      repeat: '다음 주, 큰 거래처 앞에서 발표하는 날 또 자료가 늦었어요. 거래처 사람들이 30분을 기다렸어요.',
      loss: ['거래처가 "준비가 안 된 회사네요" 하며 계약을 미뤘어요', '들어올 돈 2,000만 원이 사라졌어요', '회사 돈이 모자라요', '부장님: "올해 월급 인상은 어렵겠어요…"'],
      pay: '내 월급이 안 올라요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '신입에게 물건 자리를 알려 주고, 자료는 전날 미리 뽑는다', ['복사기를 새로 산다', '회의를 없앤다']] },
    { place: '음식점', boss: ['최 사장님', '👨‍🍳'], jr: ['직원 수진 씨', '🧑‍🍳'],
      order: '3번 상 손님이 화가 나셨어요. 매운 걸 못 드신다고 했는데 매운 찌개가 나갔대요. 수진 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 제가 바빠서 깜빡했나 봐요…',
      openFact: ['바빠서 깜빡했대요', '점심때는 다 바빠요! 왜 깜빡했는지 정확히 알아 와요.'],
      layers: [
        { q: '왜 깜빡했어요?', a: '주문을 안 적고 머리로만 외웠어요.', fact: '주문을 적지 않고 외웠대요', no: '외웠다는 건 알겠고, 그래서 왜 틀렸는데요?' },
        { q: '외웠는데 왜 주방에 제대로 못 전했어요?', a: '그사이에 다른 상 주문이 세 개나 들어와서 "덜 맵게"를 빼먹었어요.', fact: '주문이 몰려서 "덜 맵게"를 빼먹었대요', no: '빼먹은 건 알겠어요. 애초에 왜 안 적었는지 알아 와요.' },
        { q: '그 바쁜 때 왜 적지 않았어요?', a: '주문 적는 수첩이 다 떨어졌는데, 바빠서 새로 못 받았어요.', fact: '주문 수첩이 떨어져서 외우다가, 주문이 몰려 빼먹었대요' },
      ],
      repeat: '다음 날, 땅콩을 빼 달라던 손님 음식에 또 땅콩이 들어갔어요! 손님이 병원에 가셨어요.',
      loss: ['병원비 50만 원을 물어 드렸어요', '"이 식당 조심하세요" 후기가 올라왔어요', '한 달 동안 손님이 절반으로 줄었어요', '사장님: "월세 내기도 빠듯해서 월급을 반만 줄 수 있어요…"'],
      pay: '내 월급이 반으로 줄었어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '수첩을 넉넉히 두고, 주문은 꼭 적어서 주방에 전한다', ['매운 메뉴를 없앤다', '손님을 덜 받는다']] },
    { place: '빵집', boss: ['빵집 사장님', '👩‍🍳'], jr: ['직원 은지 씨', '👧'],
      order: '생일 케이크 찾으러 오신 손님이 계신데 케이크가 없대요! 은지 씨한테 왜 그랬는지 알아 와요.',
      open: '어… 그 케이크 오늘 아닌 줄 알았어요…',
      openFact: ['오늘이 아닌 줄 알았대요', '오늘이 아닌 줄 알았다는 건 알겠어요. 왜 그렇게 알았는지 알아 와요.'],
      layers: [
        { q: '왜 오늘이 아닌 줄 알았어요?', a: '예약 공책에 "토요일"이라고만 적어 놨어요.', fact: '공책에 "토요일"이라고만 적었대요', no: '토요일이라고 적었으면 오늘이잖아요. 왜 헷갈렸는지 알아 와요.' },
        { q: '왜 "토요일"이라고만 적었어요?', a: '손님이 전화로 "토요일"이라고만 하셔서 그대로 적었어요.', fact: '손님이 "토요일"이라고만 말씀하셨대요', no: '손님 탓을 하면 안 되죠. 왜 오늘이 아니라고 생각했는지 알아 와요.' },
        { q: '왜 다음 주 토요일이라고 생각했어요?', a: '어제 온 전화라 당연히 다음 주인 줄 알았어요. 날짜를 여쭤보지 않았어요.', fact: '날짜를 여쭤보지 않고 요일만 적어서 어느 토요일인지 헷갈렸대요' },
      ],
      repeat: '다음 달, 또 요일만 적었다가 돌잔치 떡케이크 50개를 하루 늦게 만들었어요.',
      loss: ['돌잔치 손님께 100만 원을 돌려 드렸어요', '만든 케이크 50개는 다 버렸어요', '빵집이 이번 달 적자예요', '사장님: "이번 달 월급은 조금 늦게 줄게요…"'],
      pay: '내 월급이 밀렸어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '예약은 요일만 말고 날짜까지 꼭 적는다', ['케이크를 미리 많이 만든다', '예약을 안 받는다']] },
    { place: '편의점 알바', boss: ['편의점 점장님', '👨‍💼'], jr: ['알바 지훈 씨', '🧑'],
      order: '손님이 날짜 지난 삼각김밥을 사 가셨대요. 지훈 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 제가 못 봤나 봐요…',
      openFact: ['못 봤대요', '못 봤다는 건 이유가 아니에요. 왜 못 봤는지 알아 와요.'],
      layers: [
        { q: '왜 못 봤어요?', a: '새벽에 물건을 정리할 때 날짜를 확인 안 했어요.', fact: '정리할 때 날짜를 확인 안 했대요', no: '확인 안 한 건 알겠어요. 왜 안 했는지까지 알아 와요.' },
        { q: '정리할 때 왜 날짜를 확인 안 했어요?', a: '새 물건을 앞에 놓기 바빠서요.', fact: '새 물건을 앞에 놓기 바빴대요', no: '새 물건을 앞에 놓았다고요? 왜 그렇게 했는지 알아 와요.' },
        { q: '새 물건을 왜 앞에 놓았어요?', a: '옛날 물건을 앞에, 새 물건을 뒤에 놓는 건지 몰랐어요. 아무도 안 알려 줬어요. 그래서 뒤에 옛날 게 남아 있었어요.', fact: '옛날 물건을 앞에 두는 법을 아무도 안 알려 줘서, 날짜 지난 게 뒤에 남아 있었대요' },
      ],
      repeat: '일주일 뒤, 날짜 지난 우유를 드신 손님이 배탈이 났어요.',
      loss: ['본사에 신고가 들어갔어요', '벌금 100만 원에 버린 물건 30만 원', '가게가 이번 달 적자예요', '점장님: "알바 시간을 줄여야겠어요…"'],
      pay: '내 알바비가 줄었어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '새 알바에게 옛날 물건을 앞에 두는 법을 알려 준다', ['삼각김밥을 안 판다', '지훈 씨를 크게 혼낸다']] },
    { place: '카페 알바', boss: ['카페 매니저님', '👩‍💼'], jr: ['알바 소연 씨', '👧'],
      order: '아침에 와 보니 냉동고 문이 열려서 아이스크림이 다 녹았어요. 소연 씨한테 왜 그랬는지 알아 와요.',
      open: '어… 분명 닫은 것 같은데요…',
      openFact: ['닫은 것 같대요', '닫은 것 같다니요! 왜 열려 있었는지 알아 와요.'],
      layers: [
        { q: '닫았는데 왜 열려 있었을까요?', a: '마지막에 얼음을 꺼내고… 문을 끝까지 안 밀었나 봐요.', fact: '문을 끝까지 안 밀었대요', no: '안 민 건 알겠어요. 왜 그랬는지 알아 와요.' },
        { q: '왜 문을 끝까지 안 밀었어요?', a: '그 문은 끝까지 눌러야 닫히는데, 저는 몰랐어요.', fact: '끝까지 눌러야 닫히는 걸 몰랐대요', no: '몰랐다고요? 왜 몰랐는지까지 알아 와요.' },
        { q: '그걸 왜 몰랐어요?', a: '마감을 처음 혼자 했어요. 마감할 때 할 일 목록이 없어서 그냥 했어요.', fact: '처음 혼자 마감했는데, 마감할 일 목록이 없었대요' },
      ],
      repeat: '다음 주, 소연 씨 혼자 마감한 날 이번엔 커피 기계를 안 껐어요. 밤새 기계가 타 버렸어요.',
      loss: ['기계 고치는 데 300만 원', '사흘 동안 장사를 못 했어요', '가게 돈이 바닥났어요', '매니저: "이번 달 알바비는 다음 달에 줄게요…"'],
      pay: '내 알바비가 밀렸어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '마감할 일 목록을 만들어 붙이고 하나씩 확인한다', ['냉동고를 없앤다', '아이스크림을 안 판다']] },
    { place: '산악회', boss: ['산악회 회장님', '🧓'], jr: ['총무 미경 씨', '👩'],
      order: '오늘 가을 산행인데 버스가 안 왔어요! 회원 30명이 길에서 기다려요. 미경 씨한테 왜 그랬는지 알아 와요.',
      open: '어머… 예약은 분명히 했는데요…',
      openFact: ['예약은 했었대요', '예약을 했는데 왜 안 왔는지 알아 와야죠!'],
      layers: [
        { q: '예약했는데 왜 버스가 안 왔을까요?', a: '버스 회사에 전화해 보니 예약이 다음 주로 되어 있대요.', fact: '예약이 다음 주로 되어 있었대요', no: '다음 주로 됐다고요? 왜 그렇게 됐는지 알아 와요.' },
        { q: '왜 다음 주로 되어 있었어요?', a: '제가 "셋째 주 토요일"이라고 했는데, 그쪽에서 다르게 알아들었나 봐요.', fact: '"셋째 주 토요일"을 다르게 알아들었대요', no: '남 탓만 하지 말고, 왜 틀어졌는지 끝까지 알아 와요.' },
        { q: '왜 틀린 걸 미리 몰랐어요?', a: '날짜를 숫자로 말하지 않았고, 예약 확인 문자도 안 받아 봤어요.', fact: '날짜를 숫자로 말하지 않았고, 예약 확인 문자도 안 받아 봤대요' },
      ],
      repeat: '봄 산행 날, 이번엔 산장이 다른 날짜로 예약돼 있었어요. 30명이 잘 곳이 없었어요.',
      loss: ['급하게 비싼 숙소를 잡았어요 (150만 원 더)', '취소 수수료도 물었어요', '모아 둔 회비가 바닥났어요', '회장님: "모자란 돈은 임원들이 나눠 내야겠어요…"'],
      pay: '내 돈이 나갔어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '예약은 날짜를 숫자로 말하고, 확인 문자를 꼭 받는다', ['산행을 안 간다', '버스 회사를 바꾼다']] },
    { place: '탁구 동호회', boss: ['동호회 회장님', '👨‍🦳'], jr: ['막내 회원 성훈 씨', '🧑'],
      order: '이번 시 대회 명단에 우리 동호회가 빠졌대요! 성훈 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 신청서를 보내긴 했는데요…',
      openFact: ['신청서를 보내긴 했대요', '보냈는데 왜 빠졌는지를 알아 와야죠!'],
      layers: [
        { q: '보냈는데 왜 명단에 빠졌을까요?', a: '대회 쪽에 물어보니 신청서를 못 받았대요.', fact: '대회 쪽에서 신청서를 못 받았대요', no: '못 받았다고요? 왜 못 받았는지 알아 와요.' },
        { q: '왜 못 받았대요?', a: '제가 메일 주소를 하나 틀리게 적어서 보냈더라고요.', fact: '메일 주소를 틀리게 적었대요', no: '틀린 건 알겠어요. 왜 몰랐는지 알아 와요.' },
        { q: '틀린 걸 왜 몰랐어요?', a: '마감 날 밤에 급하게 보냈어요. 잘 받았는지 확인 전화도 안 했고요.', fact: '마감 날 밤에 급하게 보냈고, 잘 받았는지 확인도 안 했대요' },
      ],
      repeat: '다음 대회 때 성훈 씨가 또 마감 날 밤에 급하게 보냈다가, 이번엔 참가비 입금이 빠졌어요.',
      loss: ['대회에 또 못 나갔어요', '후원하던 가게가 후원을 끊었어요 (1년 60만 원)', '회비가 모자라 체육관을 못 빌려요', '회장님: "이번 달부터 회비를 두 배로 올려야겠어요…"'],
      pay: '내 회비가 두 배가 됐어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '신청은 며칠 전에 보내고, 잘 받았는지 꼭 확인한다', ['대회에 안 나간다', '성훈 씨를 내보낸다']] },
    { place: '마트', boss: ['마트 점장님', '👨‍💼'], jr: ['직원 동민 씨', '🧑'],
      order: '우유 칸이 텅 비어서 손님들이 그냥 가셨어요. 동민 씨한테 왜 그랬는지 알아 와요.',
      open: '아… 우유가 좀 늦게 왔어요…',
      openFact: ['우유가 늦게 왔대요', '늦게 왔으면 왜 늦게 왔는지 알아 와야죠!'],
      layers: [
        { q: '우유가 왜 늦게 왔어요?', a: '업체에 물어보니 주문이 안 들어와서 못 보냈대요.', fact: '업체에 주문이 안 들어갔대요', no: '주문이 안 들어갔다고요? 왜 안 들어갔는지 알아 와요.' },
        { q: '주문이 왜 안 들어갔어요?', a: '원래 제가 넣는데, 어제는 영식 씨가 넣기로 했어요.', fact: '어제는 영식 씨가 넣기로 했대요', no: '영식 씨한테 넘겼다면, 왜 빠졌는지까지 알아 와요.' },
        { q: '영식 씨는 왜 주문을 안 넣었을까요?', a: '퇴근하면서 말로만 "우유 주문 좀 해 줘" 했는데, 영식 씨는 못 들었대요.', fact: '말로만 부탁해서 영식 씨가 못 들었대요' },
      ],
      repeat: '설 명절 대목에 또 말로만 부탁했다가, 이번엔 고기 주문이 빠졌어요.',
      loss: ['명절 손님들이 다 옆 마트로 갔어요', '하루 매출 500만 원이 날아갔어요', '마트가 이번 달 적자예요', '점장님: "명절 보너스는 못 드리겠어요…"'],
      pay: '내 보너스가 없어졌어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '일을 넘길 때는 말로만 말고 적어서 확인받는다', ['우유를 안 판다', '영식 씨를 크게 혼낸다']] },
    { place: '우리 집', home: true, boss: ['여보', '🧓'], jr: ['아들 준호', '👨'],
      order: '이번 달 전기요금이 평소의 두 배가 나왔어요. 준호한테 왜 그런지 물어봐 줘요.',
      open: '아… 요즘 날이 추워서 그런가 봐요…',
      openFact: ['날이 추워서 그렇대요', '추운 건 작년에도 그랬어요! 왜 두 배인지 알아 와요.'],
      layers: [
        { q: '날이 추운데 왜 요금이 두 배나 나왔니?', a: '제 방에 전기난로를 새로 들여놨어요.', fact: '방에 전기난로를 새로 들여놨대요', no: '난로를 쓴 건 알겠어요. 왜 그렇게 많이 나왔는지 알아 와요.' },
        { q: '난로를 쓰는데 왜 그렇게 많이 나왔니?', a: '밤새 켜 놓고 잤어요.', fact: '밤새 켜 놓고 잤대요', no: '왜 밤새 켜 놓는지까지 알아 와요.' },
        { q: '왜 밤새 켜 놓고 잤니?', a: '창문 틈으로 찬 바람이 들어와서 끄면 너무 추워요. 창문이 고장 난 걸 말을 못 했어요.', fact: '창문 틈으로 바람이 들어와 난로를 밤새 켰는데, 고장 난 걸 말을 못 했대요' },
      ],
      repeat: '다음 달, 난로를 또 밤새 켜 놓았어요. 이번엔 전기요금이 세 배가 나왔어요.',
      loss: ['전기요금이 30만 원 나왔어요', '이번 달 생활비가 모자라요', '장보기와 외식을 줄였어요', '여보: "이번 달 용돈은 없어요…"'],
      pay: '내 용돈이 없어졌어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '창문 틈을 막고, 고장 나면 바로 말하게 한다', ['난로를 갖다 버린다', '준호를 크게 혼낸다']] },
    { place: '우리 집', home: true, boss: ['여보', '🧓'], jr: ['딸 수정이', '👩'],
      order: '아랫집에서 천장에 물이 샌다고 올라왔어요. 수정이한테 왜 그랬는지 물어봐 줘요.',
      open: '어… 세탁기가 좀 이상했나 봐요…',
      openFact: ['세탁기가 이상했대요', '세탁기가 어떻게 이상했는지 알아 와요!'],
      layers: [
        { q: '세탁기가 왜 이상했니?', a: '돌리는데 베란다 바닥에 물이 넘쳤어요.', fact: '베란다 바닥에 물이 넘쳤대요', no: '넘친 건 나도 봤어요. 왜 넘쳤는지 알아 와요.' },
        { q: '물이 왜 넘쳤니?', a: '물 빠지는 구멍이 막혀 있었어요.', fact: '물 빠지는 구멍이 막혀 있었대요', no: '왜 막혔는지까지 알아 와요.' },
        { q: '구멍이 왜 막혀 있었니?', a: '머리카락이랑 먼지가 잔뜩 끼었어요. 제가 청소 당번인데 한 번도 안 했어요.', fact: '구멍에 먼지가 끼었는데, 청소 당번이 한 번도 안 했대요' },
      ],
      repeat: '한 달 뒤, 구멍이 또 막혔어요. 이번엔 아랫집 벽지까지 다 젖었어요.',
      loss: ['아랫집 도배값 80만 원을 물어 줬어요', '이웃과 사이가 서먹해졌어요', '이번 달 생활비가 모자라요', '여보: "이번 달 용돈은 반만 줄게요…"'],
      pay: '내 용돈이 반으로 줄었어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '날을 정해 구멍을 청소하고 했는지 확인한다', ['세탁기를 안 쓴다', '아랫집에 사과만 한다']] },
    { place: '우리 집', home: true, boss: ['여보', '🧓'], jr: ['아들 민호', '👨'],
      order: '집으로 주차 과태료 고지서가 왔어요. 차를 쓴 민호한테 왜 그랬는지 물어봐 줘요.',
      open: '아… 잠깐 세워 둔 건데요…',
      openFact: ['잠깐 세워 뒀대요', '잠깐이어도 과태료는 나와요! 왜 거기 세웠는지 알아 와요.'],
      layers: [
        { q: '왜 거기에 세웠니?', a: '주차장이 꽉 차 있었어요.', fact: '주차장이 꽉 차 있었대요', no: '꽉 찼으면 다른 데 세워야죠. 왜 안 그랬는지 알아 와요.' },
        { q: '주차장이 꽉 찼는데 왜 다른 데를 안 찾았니?', a: '약속 시간이 다 돼서 급했어요.', fact: '약속 시간이 다 돼서 급했대요', no: '왜 그렇게 급했는지까지 알아 와요.' },
        { q: '왜 그렇게 급했니?', a: '길을 미리 안 찾아보고 나갔다가 한참 헤맸어요.', fact: '길을 미리 안 찾아보고 나가서 헤매다 급해졌대요' },
      ],
      repeat: '다음 달, 또 헤매다 급하게 세웠어요. 이번엔 차가 견인됐어요.',
      loss: ['과태료 8만 원에 견인비 15만 원이 나왔어요', '이번 달 생활비가 23만 원 모자라요', '모임 회비를 못 냈어요', '여보: "이번 달 용돈은 못 줘요…"'],
      pay: '내 용돈이 없어졌어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '길을 미리 찾아보고 일찍 출발한다', ['차를 판다', '주차장 탓을 한다']] },
    { place: '우리 집', home: true, boss: ['여보', '🧓'], jr: ['손자 지호', '👦'],
      order: '추석 장보기를 지호한테 시켰는데 고기를 안 사 왔어요. 왜 그랬는지 물어봐 줘요.',
      open: '어… 사려고 했는데요…',
      openFact: ['사려고 했었대요', '사려고 했다는 건 이유가 아니죠! 왜 안 사 왔는지 알아 와요.'],
      layers: [
        { q: '사려고 했는데 왜 안 사 왔니?', a: '돈이 모자랐어요.', fact: '돈이 모자랐대요', no: '돈은 넉넉히 줬어요! 왜 모자랐는지 알아 와요.' },
        { q: '넉넉히 줬는데 왜 모자랐니?', a: '다른 걸 먼저 많이 샀어요.', fact: '다른 걸 먼저 많이 샀대요', no: '왜 다른 걸 많이 샀는지 알아 와요.' },
        { q: '왜 다른 걸 먼저 많이 샀니?', a: '적어 주신 쪽지를 잃어버려서 생각나는 대로 그냥 샀어요.', fact: '장보기 쪽지를 잃어버려서 생각나는 대로 샀대요' },
      ],
      repeat: '설날에 또 쪽지 없이 장을 봤어요. 전날 밤에 빠진 걸 다시 사러 나갔어요.',
      loss: ['비싼 동네 가게에서 다시 샀어요 (12만 원 더)', '먼저 산 것 절반은 못 먹고 버렸어요', '이번 달 식비가 모자라요', '여보: "이번 달 용돈은 줄일게요…"'],
      pay: '내 용돈이 줄었어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '장보기 목록을 폰으로 찍어 가게 한다', ['장을 안 본다', '지호를 크게 혼낸다']] },
    { place: '우리 집', home: true, boss: ['여보', '🧓'], jr: ['동생 영희', '👩'],
      order: '영희 통장에서 30만 원이 빠져나갔대요. 왜 그랬는지 물어봐 줘요.',
      open: '아… 폰이 좀 이상했어…',
      openFact: ['폰이 이상했대요', '폰이 어떻게 이상했는지 알아 와요!'],
      layers: [
        { q: '폰이 왜 이상했어?', a: '문자에 있는 주소를 눌렀더니 화면이 이상해졌어.', fact: '문자에 있는 주소를 눌렀대요', no: '누른 건 알겠어요. 왜 눌렀는지 알아 와요.' },
        { q: '그 주소를 왜 눌렀어?', a: '택배가 못 왔다는 문자였어. 택배를 기다리고 있었거든.', fact: '택배가 못 왔다는 문자였대요', no: '택배 문자라고 다 누르면 어떡해요. 왜 진짜라고 믿었는지 알아 와요.' },
        { q: '그 문자를 왜 진짜라고 믿었어?', a: '보낸 번호도 안 봤어. 택배 회사에 물어볼 생각을 못 했어.', fact: '보낸 번호를 안 보고, 택배 회사에 확인도 안 했대요' },
      ],
      repeat: '두 달 뒤, 영희가 또 문자 주소를 눌렀어요. 이번엔 300만 원이 빠져나갔어요.',
      loss: ['300만 원을 못 찾았어요', '영희가 생활비가 없대요', '우리 집에서 200만 원을 빌려줬어요', '여보: "우리도 이번 달 빠듯해요…"'],
      pay: '내 용돈이 없어졌어요',
      fix: ['그럼 앞으로 어떻게 하면 될까요?', '모르는 문자 주소는 누르지 않고, 택배 회사에 직접 전화한다', ['폰을 없앤다', '택배를 안 시킨다']] },
    { place: '내 인쇄소', owner: true, boss: ['거래처 한 사장님', '👨‍💼'], jr: ['우리 직원 경수 씨', '🧑'],
      order: '사장님, 오늘 오기로 한 전단지가 아직 안 왔어요! 왜 늦는지 직원분께 알아봐 주세요.',
      open: '아… 사장님, 그게… 일이 좀 밀려서요…',
      openFact: ['일이 좀 밀렸대요', '일이 밀렸다는 건 이유가 안 되죠. 왜 늦었는지 알고 싶어요.'],
      layers: [
        { q: '왜 일이 밀렸어요?', a: '인쇄기가 오전 내내 멈춰 있었어요.', fact: '인쇄기가 오전 내내 멈춰 있었대요', no: '기계는 멈출 수 있죠. 왜 오전 내내 멈췄는지 알아봐 주세요.' },
        { q: '인쇄기가 왜 오전 내내 멈춰 있었어요?', a: '잉크가 떨어졌는데 새 잉크가 없었어요.', fact: '잉크가 떨어졌는데 새 잉크가 없었대요', no: '왜 잉크가 없었는지까지 알아봐 주세요.' },
        { q: '새 잉크가 왜 없었어요?', a: '남은 양을 아무도 안 보고 있었어요. 제 일인지 사장님 일인지 정하지 않았거든요.', fact: '잉크 남은 양을 아무도 안 봤고, 누구 일인지 정하지 않았대요' },
      ],
      repeat: '다음 달, 또 잉크가 떨어졌어요. 이번엔 연말 큰 주문을 제날짜에 못 맞췄어요.',
      loss: ['거래처가 위약금 200만 원을 달라고 했어요', '거래처가 다른 인쇄소로 옮겼어요', '회사 통장에 돈이 모자라요', '경수 씨 월급을 주고 나니 내 몫이 없어요'],
      pay: '내 월급이 없어졌어요',
      praise: '아, 그런 거였군요. 원인을 정확히 알려 주시니 믿음이 가네요. 👍',
      closing: '좋습니다. 그렇게 막아 주시면 앞으로도 거래할게요!',
      fix: ['그럼 앞으로 어떻게 하실 건가요?', '잉크 확인은 경수 씨 일로 정하고, 매주 남은 양을 본다', ['인쇄기를 새로 산다', '경수 씨를 내보낸다']] },
    { place: '내 반찬 가게', owner: true, boss: ['단골손님 박 여사님', '👵'], jr: ['우리 직원 미숙 씨', '👩'],
      order: '사장님, 어제 사 간 반찬이 다 쉬었어요. 왜 그런지 직원분께 알아봐 주세요.',
      open: '어머… 어제 날이 좀 더웠나 봐요…',
      openFact: ['날이 더웠나 보대요', '날씨 탓은 그만하시고요. 왜 쉬었는지 알고 싶어요.'],
      layers: [
        { q: '반찬이 왜 쉬었을까요?', a: '만들고 나서 밖에 오래 뒀어요.', fact: '만들고 나서 밖에 오래 뒀대요', no: '왜 오래 뒀는지 알아봐 주세요.' },
        { q: '왜 밖에 오래 뒀어요?', a: '냉장고에 자리가 없었어요.', fact: '냉장고에 자리가 없었대요', no: '왜 자리가 없었는지까지 알아봐 주세요.' },
        { q: '냉장고에 왜 자리가 없었어요?', a: '지난주에 남은 반찬을 안 치웠어요. 치우는 날이 따로 없어서요.', fact: '남은 반찬을 안 치워서 자리가 없었고, 치우는 날이 따로 없었대요' },
      ],
      repeat: '다음 주, 또 밖에 뒀던 반찬을 팔았어요. 손님 세 분이 탈이 나셨어요.',
      loss: ['치료비와 환불로 100만 원이 나갔어요', '동네 단골손님이 절반으로 줄었어요', '월세를 내고 나니 통장이 비었어요', '미숙 씨 월급을 주려고 내 돈을 넣었어요'],
      pay: '내 월급은커녕 내 돈이 나갔어요',
      praise: '아, 그런 거였군요. 숨기지 않고 알려 주시니 고마워요. 👍',
      closing: '좋아요. 그렇게 하시면 또 사러 올게요!',
      fix: ['그럼 앞으로 어떻게 하실 건가요?', '날을 정해 냉장고를 치우고, 반찬은 바로 넣는다', ['반찬 가게를 닫는다', '손님에게 바로 드시라고 한다']] },
    { place: '내 세탁소', owner: true, boss: ['단골손님 최 선생님', '👨‍🦳'], jr: ['우리 직원 현우 씨', '🧑'],
      order: '사장님, 맡긴 양복이 다른 사람 옷으로 왔어요. 왜 그런지 직원분께 알아봐 주세요.',
      open: '아… 옷이 좀 섞였나 봐요…',
      openFact: ['옷이 섞였대요', '왜 섞였는지를 알고 싶어요.'],
      layers: [
        { q: '옷이 왜 섞였어요?', a: '옷에 붙이는 번호표가 떨어졌어요.', fact: '번호표가 떨어졌대요', no: '왜 떨어졌는지 알아봐 주세요.' },
        { q: '번호표가 왜 떨어졌어요?', a: '테이프로만 살짝 붙여 놨어요.', fact: '테이프로만 살짝 붙였대요', no: '왜 테이프로 붙였는지까지 알아봐 주세요.' },
        { q: '왜 테이프로만 붙였어요?', a: '원래 쓰는 핀이 다 떨어졌는데, 사장님께 말을 안 했어요. 바쁘신 것 같아서요.', fact: '핀이 떨어져 테이프로 붙였는데, 사장님께 말을 못 했대요' },
      ],
      repeat: '다음 달, 또 번호표가 떨어져서 결혼식에 입을 정장이 없어졌어요.',
      loss: ['양복값 80만 원을 물어 드렸어요', '"옷 잃어버리는 집"이라고 소문이 났어요', '손님이 줄어 통장이 비었어요', '현우 씨 월급을 주고 나니 내 몫이 없어요'],
      pay: '내 월급이 없어졌어요',
      praise: '아, 그런 거였군요. 이유를 알려 주시니 마음이 풀리네요. 👍',
      closing: '좋습니다. 그렇게 하시면 계속 맡길게요!',
      fix: ['그럼 앞으로 어떻게 하실 건가요?', '물건이 떨어지면 바로 말하게 하고, 번호표는 핀으로 단다', ['양복을 안 받는다', '현우 씨를 크게 혼낸다']] },
  ];

  // 나쁜 대답 = 원인을 묻지 않고 대충 넘어가는 말
  const BRUSH = [
    ['알겠어요.', '네! 감사합니다~'],
    ['다음부턴 조심해 줘요.', '네네, 조심할게요!'],
    ['괜찮아요, 그럴 수도 있죠.', '감사합니다! 헤헤'],
    ['됐어요, 내가 알아서 처리할게요.', '앗, 감사합니다!'],
  ];
  const BRUSH_HOME = [
    ['알았다.', '네~ 고마워요!'],
    ['다음부턴 조심해라.', '네네, 조심할게요!'],
    ['괜찮다, 그럴 수도 있지.', '고마워요! 헤헤'],
    ['됐다, 내가 알아서 할게.', '앗, 고마워요!'],
  ];
  const FAKE = ['일이 너무 많아서 그랬대요', '원래 실수가 잦은 사람이래요'];
  const FAKE_NO = '그건 직접 들은 말이 아니잖아요! 들은 대로 정확히 보고해요.';
  const WHY_SEEN_TIP = '💡 그때 <b>"왜?"</b> 하고 물어봤다면 막을 수 있었어요.';

  const rnd = n => Math.floor(Math.random() * n);
  const pickOne = a => a[rnd(a.length)];
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  // 받침에 따라 이/가 ("민수 씨가", "회장님이")
  const iGa = w => { const c = w.charCodeAt(w.length - 1) - 0xAC00; return w + (c >= 0 && c <= 11171 && c % 28 ? '이' : '가'); };

  function level() {
    const v = currentMember && currentMember.probeLevel;
    return Math.min(MAX_LV, Math.max(1, Number.isFinite(v) ? v : 1));
  }
  function pickScenarios() {
    const recent = new Set(((currentMember && currentMember.probeLog) || []).slice(-3).flatMap(r => r.ids || []));
    const ranked = S.map((s, i) => ({ s, i, w: (recent.has(i) ? 2 : 0) + Math.random() })).sort((a, b) => a.w - b.w);
    // 한 판에 내 일(집안일·내 회사) 하나, 남의 회사·모임 일 하나
    const isMine = p => p.s.home || p.s.owner;
    return shuffleArr([ranked.find(isMine), ...ranked.filter(p => !isMine(p)).slice(0, PER_GAME - 1)]);
  }

  // 단계별 보기: "왜?" 질문 하나 + 대충 넘어가는 말 1개(1단계) / 2개(2단계) / 3개(3단계, 보고에도 짐작이 섞임)
  function questionOptions(L, layer, brushList) {
    const brushes = shuffleArr(brushList).slice(0, L).map(([t, r]) => ({ t, r, kind: 'brush' }));
    return shuffleArr([{ t: layer.q, kind: 'good' }, ...brushes]);
  }

  function injectStyle() {
    if (document.getElementById('whyStyle')) return;
    const st = document.createElement('style');
    st.id = 'whyStyle';
    st.textContent = `
      .wy-chat{background:#B2C7DA;border-radius:18px;padding:14px 10px;min-height:220px;max-height:46vh;overflow-y:auto;}
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
      .wy-report.pulse{animation:wyPulse 1.2s ease-in-out infinite;}
      @keyframes wyPulse{0%,100%{box-shadow:0 0 0 0 rgba(49,130,246,.5);}50%{box-shadow:0 0 0 8px rgba(49,130,246,0);}}
      .wy-loss{margin-top:10px;background:#FFF6F6;border:2px solid #F04452;border-radius:16px;padding:12px 14px;text-align:left;}
      .wy-loss-head{font-family:'Jua';font-size:19px;color:#B0202E;margin-bottom:8px;}
      .wy-loss-repeat{font-size:18px;line-height:1.5;color:#191F28;word-break:keep-all;margin-bottom:8px;}
      .wy-loss-step{background:#fff;border:1px solid #F7C5CA;border-radius:12px;padding:9px 12px;font-size:18px;line-height:1.45;color:#333D4B;word-break:keep-all;animation:pop .25s ease;}
      .wy-loss-arrow{text-align:center;font-size:16px;line-height:1.3;color:#F04452;}
      .wy-loss-step.pay{background:#F04452;border-color:#F04452;color:#fff;font-weight:700;font-size:20px;}
    `;
    document.head.appendChild(st);
  }

  function play({ onDone } = {}) {
    injectStyle();
    const L = level();
    const picks = pickScenarios();
    const startedAt = Date.now();
    let si = 0;
    const tally = { brush: 0, report: 0, fix: 0 };
    const scores = [];

    const nextScenario = () => (si >= picks.length ? finish() : runScenario(picks[si++].s));

    function runScenario(sc) {
      clear();
      const bar = typeof stageBar === 'function' && typeof session !== 'undefined' && session ? stageBar() : '';
      const v = el(`
        <div class="fade">
          ${bar}
          <div class="scoreline"><span class="pill">💼 ${si}/${picks.length} · ${esc(sc.place)} · ${L}단계</span></div>
          <div class="panel" style="padding:14px;">
            <div class="wy-chat" id="wyChat"></div>
            <div id="wyLoss"></div>
            <div id="wyTip"></div>
            <div id="wyArea"></div>
          </div>
        </div>`);
      app.appendChild(v);
      const chat = v.querySelector('#wyChat'), lossEl = v.querySelector('#wyLoss'), tipEl = v.querySelector('#wyTip'), area = v.querySelector('#wyArea');
      const [bossName, bossFace] = sc.boss, [jrName, jrFace] = sc.jr;
      const toBoss = sc.home ? `${bossName}에게` : `${bossName}께`, reportWord = sc.home ? '말하' : sc.owner ? '말씀드리' : '보고하';
      const tallyAtStart = { ...tally };
      const known = [{ fact: sc.openFact[0], no: sc.openFact[1] }]; // 지금까지 들은 말 = 보고할 때 고를 수 있는 말
      let layerIdx = 0, wrongHere = 0;
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
      const penalty = () => Object.keys(PENALTY).reduce((s, k) => s + (tally[k] - tallyAtStart[k]) * PENALTY[k], 0);

      function askStep() {
        if (foundRoot()) {
          area.innerHTML = `<button class="wy-report pulse" type="button" id="wyRep">📋 ${esc(toBoss)} ${reportWord}러 가기</button>`;
          area.querySelector('#wyRep').addEventListener('click', report);
          return;
        }
        const layer = sc.layers[layerIdx];
        const opts = questionOptions(L, layer, sc.home ? BRUSH_HOME : BRUSH);
        area.innerHTML = `<div class="wy-ask">${esc(jrName)}에게 뭐라고 할까요?</div>
          ${opts.map((o, i) => `<button class="wy-opt" type="button" data-i="${i}">${esc(o.t)}</button>`).join('')}`;
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => onAsk(opts[Number(b.dataset.i)], layer)));
      }

      function onAsk(o, layer) {
        area.innerHTML = '';
        tip('');
        say('me', o.t);
        if (o.kind === 'brush') {
          tally.brush++; wrongHere++;
          later(() => say('jr', o.r), 500);
          later(showLoss, 1500);
          return;
        }
        later(() => {
          say('jr', layer.a);
          known.push({ fact: layer.fact, no: layer.no });
          layerIdx++;
          if (typeof beep === 'function') beep(660, 0.1);
          tip(foundRoot()
            ? '🔎 진짜 원인이 나왔어요! 보고하러 가요.'
            : '👍 "왜?" 하고 물으니 이유가 나왔어요! 그런데 이게 끝일까요?', 'good');
          later(askStep, 1100);
        }, 600);
      }

      // 대충 넘어갔을 때: 같은 실수가 더 크게 되풀이되고, 손해가 내 돈까지 이어지는 걸 한 칸씩 보여 준다
      function showLoss() {
        if (typeof beep === 'function') beep(220, 0.15);
        lossEl.innerHTML = `<div class="wy-loss">
          <div class="wy-loss-head">📅 원인을 모른 채 넘어갔더니…</div>
          <div class="wy-loss-repeat">${esc(sc.repeat)}</div>
          <div id="wyLossSteps"></div>
        </div>`;
        const stepsEl = lossEl.querySelector('#wyLossSteps');
        const steps = [...sc.loss.map(t => ({ t })), { t: `💸 ${sc.pay}`, pay: true }];
        steps.forEach((s, i) => later(() => {
          stepsEl.insertAdjacentHTML('beforeend', `${i ? '<div class="wy-loss-arrow">⬇</div>' : ''}<div class="wy-loss-step${s.pay ? ' pay' : ''}">${esc(s.t)}</div>`);
          stepsEl.lastElementChild.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
          if (s.pay && navigator.vibrate) { try { navigator.vibrate(60); } catch (e) { /* 진동이 없는 기기 */ } }
        }, (i + 1) * LOSS_STEP_MS));
        later(() => {
          tip(WHY_SEEN_TIP, 'bad');
          area.innerHTML = `<button class="wy-report" type="button" id="wyBack">⏪ 그때로 돌아가서 다시 물어보기</button>`;
          area.querySelector('#wyBack').addEventListener('click', () => {
            lossEl.innerHTML = '';
            tip('');
            move('⏪ 그때로 돌아왔어요');
            askStep();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          area.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }, (steps.length + 1) * LOSS_STEP_MS);
      }

      // 보고: 들은 말 중에서 진짜 원인을 고른다. 겉으로 드러난 이유를 고르면 꾸중을 듣고 다시 고른다.
      function report() {
        move(`🚶 ${toBoss} 갔어요`);
        tip('');
        chooseReport();
      }

      function chooseReport() {
        const opts = known.map((k, i) => ({ t: k.fact, no: k.no, root: i === known.length - 1 }));
        if (L >= 3) opts.push({ t: pickOne(FAKE), no: FAKE_NO, root: false });
        const shown = shuffleArr(opts);
        area.innerHTML = `<div class="wy-ask">📋 진짜 원인은 뭐였나요? "${esc(iGa(jrName))}…"</div>
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
          tip('😓 그건 겉으로 보이는 이유예요. 마지막에 들은 말을 떠올려 봐요.', 'bad');
          area.innerHTML = `<button class="wy-report" type="button" id="wyAgain">📋 다시 ${reportWord}기</button>`;
          area.querySelector('#wyAgain').addEventListener('click', () => { tip(''); chooseReport(); });
        }, 600);
      }

      // 원인을 알았으면 앞으로 어떻게 막을지까지
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
            say('boss', sc.closing || '좋아요. "왜?"라고 물어봐 준 덕분에 큰 손해를 막았어요. 수고했어요!', 'happy');
            scores.push(Math.max(MIN_SCORE, 100 - penalty()));
            tip(wrongHere === 0 ? '🎉 완벽해요! 끝까지 "왜?"라고 물어서 손해를 막았어요.' : '👏 잘했어요! "왜?"라고 물어서 진짜 원인을 찾았어요.', 'good');
            if (typeof confetti === 'function') confetti(wrongHere ? 2 : 5);
            area.innerHTML = `<button class="btn btn-primary" type="button" id="wyNext" style="margin-top:6px;font-size:21px;padding:16px;">${si >= picks.length ? '끝내기' : '다음 일 →'}</button>`;
            area.querySelector('#wyNext').addEventListener('click', nextScenario);
          }, 500);
        }));
      }

      if (sc.owner) move('🏢 내가 사장이고, 직원은 한 명뿐인 회사예요');
      say('boss', sc.order);
      later(() => { move(`🚶 ${jrName}에게 갔어요`); say('jr', sc.open); }, 900);
      later(() => {
        if (L <= 2) tip(`🎯 <b>"왜?"</b> 하고 끝까지 물어서 진짜 원인을 알아 오세요.`);
        askStep();
      }, 1700);
    }

    function finish() {
      const score = Math.round(scores.reduce((a, b) => a + b, 0) / Math.max(1, scores.length));
      const wrong = tally.brush + tally.report;
      if (currentMember) {
        currentMember.probeLevel = wrong <= 1 ? Math.min(MAX_LV, L + 1) : wrong >= 5 ? Math.max(1, L - 1) : L;
        currentMember.probeLog = [...(currentMember.probeLog || []), {
          ts: new Date().toISOString(), lv: L, brush: tally.brush, report: tally.report, fix: tally.fix, score,
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
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;gap:8px;"><span>${d(r.ts)} · ${r.lv}단계 · ${r.sec}초</span><span>${(r.brush || 0) + r.report === 0 ? '⭕ 끝까지 물어봄' : `대충 넘김 ${r.brush || 0} · 보고 틀림 ${r.report}`} · ${r.score}점</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  window.WHY = { play, injectAdminPanel, SCENARIOS: S };
})();
