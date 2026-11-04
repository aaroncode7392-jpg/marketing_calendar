// ==========================================================
// 👩‍🍳 선배에게 배우고 후배 가르치기 (업무·레시피 기억 및 전수 시뮬레이션)
// 1) [선배에게 배우기 날]: 식당·카페·샌드위치 가게·명품매장·병원 등 다양한 근무지에서
//    선배가 한 번 알려준 레시피·고객응대 순서를 외워서 내가 맞을 때까지 직접 해 본다.
//    틀리면 선배에게 혼나고 다시 배워서 도전하고, 맞으면 칭찬받고 내일 후배 교육용으로 기억해 둔다.
// 2) [후배에게 교육시키기 날]: 어제 선배에게 배운 순서를 기억해서 오늘 신입 후배에게 알려준다.
//    후배가 내가 알려준 대로 선배에게 가서 검토(심사)를 받는다.
//    통과하면 내가 선배에게 큰 칭찬을 받고, 틀리면 내가 선배에게 혼나고 다시 배워서 후배가 통과할 때까지 가르친다.
// 음성은 쓰지 않는다(글로만 보여 준다).
// ==========================================================
(function () {
  const LOG_CAP = 200;
  const WRONG_PENALTY = 15, PEEK_PENALTY = 15, MIN_SCORE = 40;

  // 40가지 근무지 시나리오 (요리·레시피 30개 [75%] + 고객 응대·안내 10개 [25%])
  const TASKS = [
    // ---------------- 🥪 샌드위치 가게 (6) ----------------
    {
      id: 0, cat: 'cook', place: '샌드위치 가게', title: '에그마요 샌드위치 만들기',
      sr: ['박 매니저 선배님', '👩‍🍳'], jr: ['신입 지훈 씨', '🧑'],
      steps: [
        ['🍞', '식빵 두 장을 토스터에 노릇하게 굽기'],
        ['🧈', '구운 빵 안쪽에 버터를 얇게 펴 바르기'],
        ['🥬', '물기 턴 양상추 두 장을 먼저 깔기'],
        ['🥚', '으깬 달걀마요 속을 듬뿍 올리고 빵 덮기'],
      ],
      wrongs: [
        ['🍓', '식빵에 딸기잼을 두껍게 바르기'],
        ['🥒', '양상추 대신 오이 피클만 잔뜩 깔기'],
      ],
      scold: '빵에 버터와 양상추를 먼저 깔지 않으면 달걀마요 수분 때문에 빵이 다 눅눅해지잖아요!',
    },
    {
      id: 1, cat: 'cook', place: '샌드위치 가게', title: '햄치즈 클럽 샌드위치 만들기',
      sr: ['박 매니저 선배님', '👩‍🍳'], jr: ['신입 수빈 씨', '👩'],
      steps: [
        ['🍞', '구운 식빵에 허니머스타드 소스 바르기'],
        ['🧀', '노란 체다치즈 한 장을 반듯하게 올리기'],
        ['🥓', '슬라이스 햄 세 장을 겹쳐 올리기'],
        ['🍅', '토마토와 양상추를 얹고 빵 덮어 자르기'],
      ],
      wrongs: [
        ['🌶️', '매운 고추장을 식빵에 바르기'],
        ['🍍', '치즈 대신 통조림 파인애플만 넣기'],
      ],
      scold: '머스타드 소스 위에 치즈와 햄 순서로 차곡차곡 쌓아야 반으로 잘랐을 때 모양이 안 흐트러져요!',
    },
    {
      id: 2, cat: 'cook', place: '샌드위치 가게', title: '불고기 치즈 파니니 굽기',
      sr: ['최 셰프 선배님', '👨‍🍳'], jr: ['신입 민수 씨', '🧑'],
      steps: [
        ['🥖', '치아바타 빵을 옆으로 반 가르기'],
        ['🧄', '빵 안쪽에 갈릭 소스를 고루 펴 바르기'],
        ['🥩', '볶은 소불고기와 모짜렐라 치즈 채우기'],
        ['🔥', '파니니 그릴에 넣고 3분간 눌러 굽기'],
      ],
      wrongs: [
        ['🧊', '치즈를 넣기 전에 얼음을 넣기'],
        ['🔪', '굽기도 전에 빵을 잘게 다지기'],
      ],
      scold: '갈릭 소스를 먼저 바르고 불고기와 치즈를 넣어야 그릴에 구웠을 때 치즈가 고소하게 녹아들어요!',
    },
    {
      id: 3, cat: 'cook', place: '샌드위치 가게', title: '아보카도 닭가슴살 샌드위치',
      sr: ['박 매니저 선배님', '👩‍🍳'], jr: ['신입 은지 씨', '👧'],
      steps: [
        ['🍞', '통밀 식빵에 초록 바질 페스토 바르기'],
        ['🥬', '로메인 상추의 물기를 털어 가지런히 깔기'],
        ['🥑', '얇게 썬 아보카도를 나란히 올리기'],
        ['🍗', '결대로 찢은 닭가슴살 얹고 후추 뿌리기'],
      ],
      wrongs: [
        ['🍫', '식빵에 초콜릿 시럽 뿌리기'],
        ['🧂', '닭가슴살 대신 굵은소금만 한 줌 넣기'],
      ],
      scold: '바질 소스를 바르고 상추와 아보카도, 닭가슴살 순서로 올려야 손님이 베어 물 때 식감이 살아나요!',
    },
    {
      id: 4, cat: 'cook', place: '샌드위치 가게', title: '베이컨 에그 모닝 토스트',
      sr: ['최 셰프 선배님', '👨‍🍳'], jr: ['신입 현우 씨', '🧑'],
      steps: [
        ['🧈', '철판에 버터를 녹여 식빵 앞뒤로 굽기'],
        ['🍳', '철판 한쪽에 달걀 반숙 프라이 부치기'],
        ['🥓', '노릇하게 구운 베이컨 두 줄 올리기'],
        ['🍯', '달콤한 소스를 뿌리고 종이 포장으로 감싸기'],
      ],
      wrongs: [
        ['💧', '구운 식빵에 찬물을 끼얹기'],
        ['🐟', '베이컨 대신 날생선 올리기'],
      ],
      scold: '버터에 식빵부터 구운 뒤 달걀과 베이컨을 순서대로 얹어야 따끈한 모닝 토스트가 완성돼요!',
    },
    {
      id: 5, cat: 'cook', place: '샌드위치 가게', title: '참치 크랜베리 샌드위치',
      sr: ['박 매니저 선배님', '👩‍🍳'], jr: ['신입 소연 씨', '👩'],
      steps: [
        ['🥫', '통조림 참치의 기름기를 체에 꼭 짜기'],
        ['🥣', '마요네즈와 건크랜베리를 넣고 고루 버무리기'],
        ['🥬', '식빵 위에 아삭한 청상추 먼저 깔기'],
        ['🥪', '참치 속을 두툼하게 올리고 반으로 자르기'],
      ],
      wrongs: [
        ['🫗', '참치 기름을 버리지 않고 빵에 다 붓기'],
        ['🍋', '상추 대신 레몬 껍질만 넣기'],
      ],
      scold: '참치 기름기를 먼저 꼭 짜고 버무려야 샌드위치 빵이 기름에 젖지 않아요!',
    },

    // ---------------- 🍲 한식당·국밥집·분식집 (10) ----------------
    {
      id: 6, cat: 'cook', place: '한식당', title: '전주 비빔밥 고명 올리기',
      sr: ['김 주방장 선배님', '👨‍🍳'], jr: ['신입 지훈 씨', '🧑'],
      steps: [
        ['🍚', '따뜻한 흰밥을 놋대접 가운데에 담기'],
        ['🌿', '콩나물·시금치·고사리를 색 맞춰 둘러 담기'],
        ['🥩', '볶은 소고기와 고추장을 한가운데 올리기'],
        ['🥚', '달걀노른자 얹고 참기름 한 바퀴 두르기'],
      ],
      wrongs: [
        ['🫗', '밥을 담기 전에 찬물부터 한 대접 붓기'],
        ['🧊', '고추장 대신 각얼음을 올리기'],
      ],
      scold: '밥 위에 나물을 색 맞춰 둘러 담고 고추장과 노른자, 참기름을 맨 마지막에 올려야 손님상에 정갈하게 나가요!',
    },
    {
      id: 7, cat: 'cook', place: '한식당', title: '돼지김치찌개 황금 레시피',
      sr: ['김 주방장 선배님', '👨‍🍳'], jr: ['신입 동민 씨', '🧑'],
      steps: [
        ['🥩', '냄비에 참기름을 두르고 돼지고기 먼저 볶기'],
        ['🥬', '잘 익은 신김치를 넣고 고기와 함께 볶기'],
        ['🍲', '멸치 육수를 붓고 다진 마늘·고춧가루 넣기'],
        ['🌱', '두부와 대파를 썰어 넣고 한소끔 끓이기'],
      ],
      wrongs: [
        ['🌱', '고기도 안 볶았는데 두부부터 으깨 넣기'],
        ['🍯', '멸치 육수 대신 식혜를 붓기'],
      ],
      scold: '돼지고기와 김치를 참기름에 먼저 볶은 뒤에 육수를 부어야 국물이 깊고 구수하게 우러나와요!',
    },
    {
      id: 8, cat: 'cook', place: '한식당', title: '해물파전 바삭하게 부치기',
      sr: ['이 찬모 선배님', '👩‍🍳'], jr: ['신입 수진 씨', '👩'],
      steps: [
        ['🍳', '달군 팬에 식용유를 넉넉히 두르기'],
        ['🌿', '손질한 쪽파를 팬에 가지런히 먼저 깔기'],
        ['🦑', '반죽을 얇게 붓고 오징어·새우 고루 올리기'],
        ['🥚', '달걀물을 위에 풀고 앞뒤로 노릇하게 뒤집기'],
      ],
      wrongs: [
        ['💧', '기름 대신 찬물을 팬에 붓기'],
        ['🔥', '쪽파를 넣기도 전에 빈 팬만 태우기'],
      ],
      scold: '달군 팬에 쪽파를 먼저 깔고 반죽과 해물, 달걀물 순서로 올려야 파전이 찢어지지 않고 바삭해요!',
    },
    {
      id: 9, cat: 'cook', place: '국밥집', title: '사골 떡만둣국 끓이기',
      sr: ['박 주방장 선배님', '👨‍🍳'], jr: ['신입 성훈 씨', '🧑'],
      steps: [
        ['🍲', '뚝배기에 뽀얀 사골 육수를 팔팔 끓이기'],
        ['🥣', '물에 불려 둔 떡국떡을 먼저 넣기'],
        ['🥟', '손만두 4개를 넣고 떠오를 때까지 끓이기'],
        ['🍳', '달걀 지단과 김 가루 고명을 얹어 내기'],
      ],
      wrongs: [
        ['🥟', '차가운 뚝배기에 김 가루부터 넣기'],
        ['🌶️', '사골 육수 대신 초고추장을 붓기'],
      ],
      scold: '끓는 사골 육수에 떡과 만두를 먼저 익힌 뒤, 지단과 김 가루는 맨 마지막에 올려야 깔끔해요!',
    },
    {
      id: 10, cat: 'cook', place: '한식당', title: '뚝배기 소불고기 조리하기',
      sr: ['김 주방장 선배님', '👨‍🍳'], jr: ['신입 경수 씨', '🧑'],
      steps: [
        ['🥩', '양념에 재운 소불고기를 팬에 먼저 반쯤 볶기'],
        ['🍜', '뚝배기 바닥에 물에 불린 당면을 깔기'],
        ['🍄', '볶은 고기와 양파·버섯을 담고 육수 붓기'],
        ['🌱', '보글보글 끓인 뒤 대파와 통깨 올려 내기'],
      ],
      wrongs: [
        ['🍜', '불리지 않은 딱딱한 당면을 맨 위에 얹기'],
        ['🧊', '끓는 뚝배기에 얼음물을 붓기'],
      ],
      scold: '뚝배기 바닥에 불린 당면을 먼저 깔고 고기와 육수를 부어야 당면이 양념을 맛있게 머금어요!',
    },
    {
      id: 11, cat: 'cook', place: '국수집', title: '옛날 잔치국수 말아 내기',
      sr: ['최 사장 선배님', '👩‍🍳'], jr: ['신입 미숙 씨', '👩'],
      steps: [
        ['🍜', '끓는 물에 소면을 삶아 찬물에 쫄깃하게 헹구기'],
        ['🥣', '국수 그릇에 면을 예쁘게 사리 지어 담기'],
        ['🥕', '채 썬 호박·당근·김치 고명을 나란히 올리기'],
        ['🍲', '뜨거운 멸치 육수를 붓고 양념장 한 큰술 얹기'],
      ],
      wrongs: [
        ['🍜', '삶지 않은 마른 국수를 그릇에 그냥 담기'],
        ['🫗', '고명을 올리기 전에 그릇을 엎어 버리기'],
      ],
      scold: '면을 삶아 담고 고명을 가지런히 올린 뒤, 뜨거운 육수를 그릇 가장자리로 부어야 모양이 안 흐트러져요!',
    },
    {
      id: 12, cat: 'cook', place: '분식집', title: '매콤 국물 떡볶이 조리하기',
      sr: ['정 사장 선배님', '👩‍🍳'], jr: ['신입 은지 씨', '👧'],
      steps: [
        ['🌶️', '냄비에 멸치 다시마 육수와 고추장·설탕 풀기'],
        ['🍢', '말랑한 밀떡과 납작 어묵을 넣고 끓이기'],
        ['🥚', '떡에 양념이 배면 삶은 달걀과 대파 넣기'],
        ['✨', '넓은 접시에 담고 통깨를 솔솔 뿌려 내기'],
      ],
      wrongs: [
        ['🥚', '달걀 껍질을 까지 않고 통째로 넣기'],
        ['💧', '다 끓인 떡볶이를 찬물에 헹구기'],
      ],
      scold: '육수에 양념장부터 풀고 떡과 어묵을 끓인 뒤, 대파와 통깨로 마무리해야 깊은 맛이 나요!',
    },
    {
      id: 13, cat: 'cook', place: '분식집', title: '참치 김밥 터지지 않게 싸기',
      sr: ['정 사장 선배님', '👩‍🍳'], jr: ['신입 보람 씨', '👩'],
      steps: [
        ['⬛', '김발 위에 구운 김의 거친 면이 위로 오게 깔기'],
        ['🍚', '참기름·소금 간 한 밥을 김 위에 고루 펴기'],
        ['🌿', '푸른 깻잎을 깔고 마요네즈 버무린 참치 올리기'],
        ['🥕', '단무지·당근·우엉을 놓고 단단히 말아 썰기'],
      ],
      wrongs: [
        ['🔪', '김을 말기도 전에 가위로 조각내기'],
        ['🍚', '밥 대신 밀가루를 김 위에 뿌리기'],
      ],
      scold: '김 거친 면에 밥을 펴고 깻잎 위에 참치를 올려야 밥알이 눅눅해지지 않고 단단하게 말려요!',
    },
    {
      id: 14, cat: 'cook', place: '백반집', title: '고등어 무조림 칼칼하게 조리기',
      sr: ['이 찬모 선배님', '👩‍🍳'], jr: ['신입 현우 씨', '🧑'],
      steps: [
        ['🥔', '냄비 바닥에 큼직하게 썬 무를 먼저 깔기'],
        ['🐟', '깨끗이 손질한 고등어를 무 위에 올리기'],
        ['🌶️', '고춧가루·간장·다진 마늘 양념장을 고루 끼얹기'],
        ['🍲', '쌀뜨물을 자작하게 붓고 국물을 끼얹으며 조리기'],
      ],
      wrongs: [
        ['🐟', '냄비 바닥에 고등어부터 깔고 무로 짓누르기'],
        ['🍦', '양념장 대신 바닐라 시럽을 붓기'],
      ],
      scold: '냄비 바닥에 무를 먼저 깔아야 고등어가 냄비에 눌어붙지 않고 시원한 맛이 우러나요!',
    },
    {
      id: 15, cat: 'cook', place: '고깃집', title: '차돌박이 된장찌개 끓이기',
      sr: ['강 주방장 선배님', '👨‍🍳'], jr: ['신입 지훈 씨', '🧑'],
      steps: [
        ['🥩', '달군 뚝배기에 차돌박이를 먼저 고소하게 볶기'],
        ['🍲', '쌀뜨물을 붓고 집된장을 체에 걸러 풀기'],
        ['🥔', '감자·애호박·양파를 깍둑 썰어 넣기'],
        ['🌶️', '두부와 청양고추를 넣고 바글바글 끓여 내기'],
      ],
      wrongs: [
        ['🧊', '차돌박이를 볶지 않고 얼음과 함께 넣기'],
        ['🍬', '집된장 대신 설탕을 세 큰술 넣기'],
      ],
      scold: '뚝배기에 차돌박이 기름을 먼저 내고 된장을 풀어야 고깃집 된장찌개 특유의 구수한 맛이 나요!',
    },

    // ---------------- ☕ 카페·전통찻집·디저트 (8) ----------------
    {
      id: 16, cat: 'cook', place: '카페', title: '아이스 바닐라라떼 만들기',
      sr: ['한 바리스타 선배님', '👩‍🍳'], jr: ['신입 소연 씨', '👧'],
      steps: [
        ['🍯', '투명 컵 바닥에 바닐라 시럽을 세 번 짜 넣기'],
        ['🧊', '각얼음을 컵의 칠부 높이까지 채우기'],
        ['🥛', '차가운 흰 우유를 표시선까지 천천히 붓기'],
        ['☕', '갓 내린 에스프레소 두 잔을 맨 위에 붓기'],
      ],
      wrongs: [
        ['🔥', '얼음 컵에 펄펄 끓는 물을 가득 붓기'],
        ['🧂', '바닐라 시럽 대신 소금을 세 스푼 넣기'],
      ],
      scold: '시럽 → 얼음 → 우유 순서로 채운 뒤 에스프레소를 맨 마지막에 부어야 예쁜 층이 생겨요!',
    },
    {
      id: 17, cat: 'cook', place: '카페', title: '딸기 요거트 스무디 만들기',
      sr: ['한 바리스타 선배님', '👩‍🍳'], jr: ['신입 수빈 씨', '👩'],
      steps: [
        ['🧊', '믹서기 통에 얼음 한 스쿱과 우유 넣기'],
        ['🍓', '손질한 생딸기 6알과 요거트 파우더 넣기'],
        ['🌪️', '믹서기로 30초간 곱게 갈아 잔에 따르기'],
        ['✨', '맨 위에 반으로 자른 생딸기 고명 올리기'],
      ],
      wrongs: [
        ['🍓', '믹서기에 갈지 않고 통딸기와 얼음만 그냥 드리기'],
        ['🧄', '요거트 파우더 대신 다진 마늘 넣기'],
      ],
      scold: '얼음·우유·딸기·요거트를 함께 곱게 간 뒤에 마지막으로 생딸기 고명을 올려야 보기에도 예뻐요!',
    },
    {
      id: 18, cat: 'cook', place: '카페', title: '옛날 눈꽃 팥빙수 만들기',
      sr: ['오 매니저 선배님', '👩‍💼'], jr: ['신입 민수 씨', '🧑'],
      steps: [
        ['🍧', '빙수 그릇에 우유 얼음을 곱게 갈아 소복이 담기'],
        ['🥛', '달콤한 연유를 얼음 위에 골고루 한 바퀴 뿌리기'],
        ['🫘', '삶은 통단팥을 얼음 한가운데 듬뿍 올리기'],
        ['🍡', '쫄깃한 인절미 떡과 미숫가루를 얹어 내기'],
      ],
      wrongs: [
        ['🫘', '빈 그릇 바닥에 미숫가루만 붓고 얼음 안 넣기'],
        ['🌶️', '연유 대신 매운 칠리소스 뿌리기'],
      ],
      scold: '우유 얼음을 먼저 갈아 담고 연유 → 단팥 → 인절미 순서로 올려야 얼음이 녹지 않고 맛있어요!',
    },
    {
      id: 19, cat: 'cook', place: '카페', title: '따뜻한 수제 꿀자몽차 내기',
      sr: ['한 바리스타 선배님', '👩‍🍳'], jr: ['신입 유진 씨', '👩'],
      steps: [
        ['🍵', '도자기 찻잔에 따뜻한 물을 부어 잔 먼저 데우기'],
        ['🍊', '물기를 비운 잔에 수제 자몽청 세 큰술 담기'],
        ['🫖', '뜨거운 물을 붓고 긴 스푼으로 바닥까지 잘 젓기'],
        ['🌿', '말린 자몽 조각 하나와 허브 잎을 띄워 내기'],
      ],
      wrongs: [
        ['🧊', '따뜻한 차 주문인데 얼음만 잔뜩 채우기'],
        ['🫗', '자몽청을 넣지 않고 맹물만 내어가기'],
      ],
      scold: '찻잔을 먼저 따뜻하게 데운 뒤 자몽청과 뜨거운 물을 붓고 고명을 띄워야 향이 끝까지 유지돼요!',
    },
    {
      id: 20, cat: 'cook', place: '카페', title: '카라멜 마키아토 만들기',
      sr: ['오 매니저 선배님', '👩‍💼'], jr: ['신입 지훈 씨', '🧑'],
      steps: [
        ['🍯', '머그잔 바닥에 카라멜 시럽을 두 번 짜 넣기'],
        ['🥛', '따뜻하게 데운 우유와 풍성한 우유 거품 채우기'],
        ['☕', '우유 거품 한가운데로 에스프레소 샷 부어 넣기'],
        ['✨', '거품 위에 카라멜 소스를 격자 모양으로 뿌리기'],
      ],
      wrongs: [
        ['✨', '빈 잔에 격자 무늬부터 그리고 뜨거운 물로 다 씻어내기'],
        ['🍋', '우유에 레몬즙을 짜서 몽글몽글 굳히기'],
      ],
      scold: '시럽과 우유 거품을 먼저 채운 뒤 에스프레소를 붓고, 맨 위에 카라멜 드리즐을 올려야 마키아토가 완성돼요!',
    },
    {
      id: 21, cat: 'cook', place: '전통찻집', title: '대추 쌍화차 정성껏 대접하기',
      sr: ['박 다원장 선배님', '👵'], jr: ['신입 은정 씨', '👩'],
      steps: [
        ['🍵', '데운 돌잔에 진하게 달인 쌍화차를 뜨겁게 담기'],
        ['🥜', '잣과 호두, 해바라기씨를 차 위에 고루 띄우기'],
        ['🍒', '얇게 저민 대추 고명을 한가운데 올리기'],
        ['🍪', '나무 쟁반에 받치고 한과 두 개를 곁들여 내기'],
      ],
      wrongs: [
        ['🥤', '뜨거운 쌍화차를 일회용 비닐봉지에 담기'],
        ['🧊', '잣과 대추 대신 각얼음 띄우기'],
      ],
      scold: '따뜻한 돌잔에 쌍화차를 담고 견과류와 대추 고명을 띄운 뒤 한과와 함께 내야 어르신들이 좋아하세요!',
    },
    {
      id: 22, cat: 'cook', place: '카페', title: '아인슈페너(크림 커피) 만들기',
      sr: ['한 바리스타 선배님', '👩‍🍳'], jr: ['신입 성훈 씨', '🧑'],
      steps: [
        ['🥣', '차가운 생크림에 설탕을 넣고 쫀쫀하게 휘핑하기'],
        ['🧊', '유리잔에 얼음과 찬물을 먼저 담기'],
        ['☕', '진한 에스프레소를 부어 아메리카노 베이스 만들기'],
        ['🍦', '맨 위에 크림을 두껍게 얹고 코코아 가루 뿌리기'],
      ],
      wrongs: [
        ['🍦', '빈 잔 바닥에 크림부터 깔고 뜨거운 물을 부어 녹이기'],
        ['🧂', '코코아 가루 대신 고운 소금 뿌리기'],
      ],
      scold: '아메리카노를 먼저 만든 뒤 맨 위에 쫀쫀한 크림을 얹어야 크림이 가라앉지 않고 예쁘게 떠 있어요!',
    },
    {
      id: 23, cat: 'cook', place: '카페', title: '생망고 아이스크림 와플 만들기',
      sr: ['오 매니저 선배님', '👩‍💼'], jr: ['신입 나연 씨', '👩'],
      steps: [
        ['🧇', '와플 기계에 반죽을 붓고 노릇하고 바삭하게 굽기'],
        ['🍽️', '구운 와플의 김을 한 번 식혀 넓은 접시에 담기'],
        ['🍨', '바닐라 아이스크림 한 스쿱을 가운데 올리기'],
        ['🥭', '깍둑 썬 생망고와 메이플 시럽을 듬뿍 올리기'],
      ],
      wrongs: [
        ['🍨', '뜨거운 와플 기계 안에 아이스크림을 넣고 뚜껑 닫기'],
        ['🧇', '굽지 않은 묽은 반죽을 손님 접시에 그대로 붓기'],
      ],
      scold: '와플을 바삭하게 구워 한 김 식힌 뒤에 아이스크림과 망고를 올려야 아이스크림이 바로 녹아내리지 않아요!',
    },

    // ---------------- 🥐 빵집·피자·양식당 (6) ----------------
    {
      id: 24, cat: 'cook', place: '빵집', title: '생크림 딸기 케이크 완성하기',
      sr: ['윤 제과장 선배님', '👨‍🍳'], jr: ['신입 은지 씨', '👧'],
      steps: [
        ['🍰', '케이크 빵 시트에 설탕 시럽을 촉촉하게 바르기'],
        ['🍓', '생크림을 펴 바르고 얇게 썬 딸기를 채워 시트 덮기'],
        ['🎂', '케이크 겉면에 하얀 생크림을 매끈하게 바르기'],
        ['✨', '짤주머니로 크림 꽃을 짜고 꼭지 뗀 통딸기 올리기'],
      ],
      wrongs: [
        ['🔪', '크림을 바르기 전에 빵 시트를 주먹으로 으깨기'],
        ['🔥', '생크림을 다 바른 케이크를 뜨거운 오븐에 넣기'],
      ],
      scold: '시트에 시럽과 속 딸기를 먼저 채운 뒤 겉면 크림을 바르고 통딸기로 장식해야 케이크 모양이 반듯해요!',
    },
    {
      id: 25, cat: 'cook', place: '피자 가게', title: '화덕 마르게리타 피자 굽기',
      sr: ['마 셰프 선배님', '👨‍🍳'], jr: ['신입 현우 씨', '🧑'],
      steps: [
        ['🫓', '숙성된 피자 반죽을 손으로 둥글고 넓게 펴기'],
        ['🍅', '토마토소스를 국자로 떠서 테두리 남기고 바르기'],
        ['🧀', '생모짜렐라 치즈를 큼직하게 찢어 고루 올리기'],
        ['🌿', '화덕에 구워 낸 뒤 신선한 초록 바질 잎 올리기'],
      ],
      wrongs: [
        ['🍅', '반죽을 펴지도 않고 뭉친 채로 화덕에 던져 넣기'],
        ['🌿', '소스와 치즈도 없이 바질 잎만 태우기'],
      ],
      scold: '반죽을 펴고 토마토소스와 치즈를 올린 뒤 화덕에 굽고, 생바질 잎은 구운 직후에 올려야 향이 살아나요!',
    },
    {
      id: 26, cat: 'cook', place: '경양식당', title: '수제 등심 돈가스 바삭하게 튀기기',
      sr: ['홍 주방장 선배님', '👨‍🍳'], jr: ['신입 민수 씨', '🧑'],
      steps: [
        ['🥩', '돼지 등심을 망치로 두드려 펴고 소금·후추 간하기'],
        ['🌾', '고기에 하얀 밀가루를 빈틈없이 묻혀 가볍게 털기'],
        ['🥚', '잘 풀어 둔 달걀물에 고기를 푹 담가 적시기'],
        ['🍞', '빵가루를 꾹꾹 눌러 입힌 뒤 170도 기름에 튀기기'],
      ],
      wrongs: [
        ['🍞', '밀가루와 달걀물 없이 마른 고기에 빵가루만 뿌리기'],
        ['💧', '튀긴 돈가스를 찬물에 담가 식히기'],
      ],
      scold: '튀김옷은 꼭 [밀가루 → 달걀물 → 빵가루] 순서로 입혀야 기름에 튀겼을 때 옷이 벗겨지지 않아요!',
    },
    {
      id: 27, cat: 'cook', place: '양식당', title: '해산물 토마토 스파게티 조리',
      sr: ['홍 주방장 선배님', '👨‍🍳'], jr: ['신입 수진 씨', '👩'],
      steps: [
        ['🧄', '올리브유 두른 팬에 편마늘을 노릇하게 먼저 볶기'],
        ['🦐', '손질한 새우·오징어를 넣고 센 불에 빠르게 볶기'],
        ['🍝', '토마토소스와 삶은 스파게티 면을 넣고 함께 볶기'],
        ['🧀', '접시에 돌돌 말아 담고 파마산 치즈 가루 뿌리기'],
      ],
      wrongs: [
        ['🍝', '마늘과 해물을 볶기 전에 파마산 치즈부터 팬에 태우기'],
        ['🧊', '다 볶은 따뜻한 파스타에 얼음 부어 내기'],
      ],
      scold: '올리브유에 마늘 향을 먼저 내고 해물 → 소스·면 순서로 볶아야 비린내 없이 깊은 맛이 나요!',
    },
    {
      id: 28, cat: 'cook', place: '빵집', title: '수제 단팥빵 빚어 굽기',
      sr: ['윤 제과장 선배님', '👨‍🍳'], jr: ['신입 동민 씨', '🧑'],
      steps: [
        ['🫓', '발효된 빵 반죽을 동그랗게 나누어 밀대로 펴기'],
        ['🫘', '달콤한 통팥 앙금을 한가운데 넣고 터지지 않게 오므리기'],
        ['🥜', '납작하게 살짝 누른 뒤 한가운데에 호두 한 알 박기'],
        ['🥚', '윗면에 달걀물을 고루 바르고 오븐에서 노릇하게 굽기'],
      ],
      wrongs: [
        ['🫘', '반죽 안에 팥을 넣지 않고 오븐 바닥에 팥만 붓기'],
        ['🔪', '구워지기도 전인 생반죽을 칼로 다지기'],
      ],
      scold: '반죽에 팥 앙금을 넣어 오므리고 호두와 달걀물을 올린 뒤 구워야 먹음직스러운 단팥빵이 나와요!',
    },
    {
      id: 29, cat: 'cook', place: '빵집', title: '꿀마늘 바게트 노릇하게 굽기',
      sr: ['윤 제과장 선배님', '👨‍🍳'], jr: ['신입 보람 씨', '👩'],
      steps: [
        ['🥖', '바게트 빵을 먹기 좋은 두께로 어슷하게 썰기'],
        ['🧄', '버터에 다진 마늘·꿀·파슬리를 섞어 마늘소스 만들기'],
        ['🧈', '썬 바게트 앞뒷면에 마늘버터 소스를 듬뿍 펴 바르기'],
        ['🔥', '예열된 오븐에 8분간 구워 바삭할 때 진열하기'],
      ],
      wrongs: [
        ['🥖', '바게트를 썰지도 않고 통째로 물통에 담그기'],
        ['🌶️', '마늘버터 대신 청양고추 다대기 바르기'],
      ],
      scold: '바게트를 어슷하게 썰고 마늘버터 소스를 듬뿍 발라 구워야 속까지 달콤하고 바삭해요!',
    },

    // ---------------- 💎 명품 매장·병원·약국·호텔 고객 응대 (10) ----------------
    {
      id: 30, cat: 'service', place: '명품 매장', title: '명품 가방 매장 VIP 고객 응대',
      sr: ['서 지점장 선배님', '👩‍💼'], jr: ['신입 유나 씨', '👩'],
      steps: [
        ['🙇', '매장 입구에서 밝은 미소로 목례하며 맞이하기'],
        ['🍵', '상담 좌석으로 안내해 따뜻한 차 먼저 대접하기'],
        ['🧤', '깨끗한 흰 장갑을 끼고 트레이에 가방 꺼내 보여 드리기'],
        ['🪞', '거울 앞에서 착용을 돕고 품질보증서와 쇼핑백 두 손 전달하기'],
      ],
      wrongs: [
        ['🧤', '맨손으로 가방을 덥석 집어 계산대 위에 던져 놓기'],
        ['🚪', '인사도 없이 영수증부터 내밀며 빨리 고르시라고 재촉하기'],
      ],
      scold: '명품 매장에서는 맞이 인사 → 좌석·차 안내 → 흰 장갑 착용 후 상품 제시 → 거울 착용 및 보증서 전달 순서를 꼭 지켜야 해요!',
    },
    {
      id: 31, cat: 'service', place: '명품 매장', title: '명품 시계 수리·점검 접수 응대',
      sr: ['장 부점장 선배님', '👨‍💼'], jr: ['신입 성훈 씨', '🧑'],
      steps: [
        ['🤲', '흰 장갑을 끼고 고객님의 시계를 두 손으로 건네받기'],
        ['🔍', '부드러운 융 깔개 위에 놓고 외관 상태를 고객과 함께 확인하기'],
        ['📝', '수리 접수증에 고객 성함·연락처와 점검 내용을 상세히 적기'],
        ['👝', '전용 보관 파우치에 시계를 넣고 완료 예정일과 접수증 드리기'],
      ],
      wrongs: [
        ['👖', '고객 시계를 받아서 내 바지 주머니에 그냥 찔러 넣기'],
        ['📝', '접수증도 안 적고 나중에 아무 때나 오시라고 하기'],
      ],
      scold: '고가 시계는 두 손으로 받아 융 깔개 위에서 상태를 함께 확인하고, 접수증 작성 후 전용 파우치에 보관해야 실수가 없어요!',
    },
    {
      id: 32, cat: 'service', place: '백화점 VIP 라운지', title: 'VIP 라운지 고객 입장 안내',
      sr: ['서 지점장 선배님', '👩‍💼'], jr: ['신입 세라 씨', '👩'],
      steps: [
        ['💳', '환한 미소로 인사드리며 VIP 멤버십 카드를 정중히 확인하기'],
        ['🧥', '두꺼운 외투와 무거운 쇼핑백을 코트룸에 먼저 받아 보관하기'],
        ['🛋️', '창가 쪽 조용한 좌석으로 안내해 편안히 앉으시도록 돕기'],
        ['☕', '오늘의 다과와 원하시는 음료 주문을 정중히 받기'],
      ],
      wrongs: [
        ['☕', '자리 안내도 하기 전에 입구에 서서 음료부터 마시라고 주기'],
        ['🧥', '고객 외투를 바닥에 내려놓으라고 하기'],
      ],
      scold: '멤버십 확인 후 외투·짐 보관 → 좌석 안내 → 다과·음료 주문 순서로 모셔야 VIP 고객님이 편안히 쉬실 수 있어요!',
    },
    {
      id: 33, cat: 'service', place: '내과 병원', title: '내과 병원 초진 어르신 접수 안내',
      sr: ['김 수간호사 선배님', '👩‍⚕️'], jr: ['신입 보람 씨', '👩'],
      steps: [
        ['🪪', '접수대에서 눈을 맞추며 인사드리고 신분증 먼저 확인하기'],
        ['📋', '어디가 불편하신지 여쭙고 큰 글씨 초진 문진표 작성 돕기'],
        ['🩺', '대기실 혈압계로 모셔 혈압과 체온을 먼저 측정해 적기'],
        ['🪑', '진료실 앞 의자로 안내하고 성함 부르면 들어가시도록 설명하기'],
      ],
      wrongs: [
        ['🚪', '접수도 안 하고 다짜고짜 원장님 방 문을 열어젖히기'],
        ['💊', '진료도 받기 전에 약국으로 바로 가시라고 하기'],
      ],
      scold: '초진 어르신은 [신분증 접수 → 문진표 작성 → 혈압·체온 측정 → 진료실 앞 대기 안내] 순서로 친절히 모셔야 해요!',
    },
    {
      id: 34, cat: 'service', place: '안과 병원', title: '안과 시력·검안 검사 안내',
      sr: ['이 검안사 선배님', '👨‍⚕️'], jr: ['신입 지훈 씨', '🧑'],
      steps: [
        ['👓', '쓰고 계신 안경이 있는지 여쭙고 안경 도수 먼저 확인하기'],
        ['🔬', '자동 검안기 턱받침에 턱을 대시도록 돕고 눈 굴절 검사하기'],
        ['👀', '시력표 앞에 모셔 한쪽 눈씩 가리고 큰 글씨부터 읽기'],
        ['📄', '검사 결과지를 차트에 끼워 원장님 진료실로 안내하기'],
      ],
      wrongs: [
        ['👀', '불을 다 끈 깜깜한 방에서 안경을 씌운 채로 검사 끝내기'],
        ['📄', '검사도 안 하고 빈 종이만 원장님께 드리기'],
      ],
      scold: '기존 안경 확인 → 기계 굴절 검사 → 시력표 읽기 → 진료실 안내 순서로 진행해야 정확한 시력 검사가 돼요!',
    },
    {
      id: 35, cat: 'service', place: '치과 병원', title: '치과 발치 후 귀가 안내',
      sr: ['박 치위생사 선배님', '👩‍⚕️'], jr: ['신입 유진 씨', '👩'],
      steps: [
        ['🛋️', '진료 의자에서 어지럽지 않게 천천히 일어나시도록 부축하기'],
        ['🩹', '물어 둔 거즈는 2시간 동안 꽉 물고 침과 피는 삼키시도록 설명하기'],
        ['🧊', '냉찜질용 얼음팩을 챙겨 드리고 오늘 뜨거운 음식 피하시도록 안내하기'],
        ['📅', '처방전을 두 손으로 드리고 다음 주 소독 예약 날짜 잡아 드리기'],
      ],
      wrongs: [
        ['🍜', '거즈를 바로 빼고 뜨거운 국밥을 드시라고 권하기'],
        ['🏃', '설명 없이 빨리 뛰어서 집에 가시라고 하기'],
      ],
      scold: '부축해 일으켜 드린 뒤 거즈 지혈 안내 → 얼음팩·식사 주의사항 → 처방전·다음 예약 순서로 꼼꼼히 챙겨 드려야 해요!',
    },
    {
      id: 36, cat: 'service', place: '약국', title: '약국 처방 조제 및 복약 지도',
      sr: ['최 대표약사 선배님', '👨‍⚕️'], jr: ['신입 현우 씨', '🧑'],
      steps: [
        ['📄', '처방전을 두 손으로 받고 환자 성함과 생년월일 먼저 확인하기'],
        ['💊', '조제된 약봉투를 보여 드리며 아침·점심·저녁 식후 복용법 설명하기'],
        ['⚠️', '졸음이 올 수 있는 약은 주의 스티커를 붙여 한 번 더 알려드리기'],
        ['🤲', '약값 결제 후 영수증과 약봉투를 두 손으로 드리며 쾌유 인사하기'],
      ],
      wrongs: [
        ['🤲', '누구 약인지 확인도 안 하고 아무 약봉투나 건네주기'],
        ['💊', '복용 설명 없이 약을 한꺼번에 다 드시라고 하기'],
      ],
      scold: '성함 확인 → 식후 복용법 설명 → 주의사항 안내 → 두 손 전달 및 쾌유 인사 순서를 지켜야 안전한 복약 지도가 돼요!',
    },
    {
      id: 37, cat: 'service', place: '특급 호텔', title: '호텔 프런트 체크인 고객 응대',
      sr: ['정 지배인 선배님', '👨‍💼'], jr: ['신입 수빈 씨', '👩'],
      steps: [
        ['🙇', '자리에서 일어나 눈을 맞추며 밝은 환영 인사 건네기'],
        ['🪪', '예약자 성함과 신분증을 정중히 받아 객실 호수 확인하기'],
        ['🍽️', '내일 아침 조식 식당 위치와 이용 시간을 먼저 안내하기'],
        ['🔑', '객실 카드키를 두 손으로 드리고 엘리베이터 방향 안내하기'],
      ],
      wrongs: [
        ['🔑', '성함도 안 물어보고 아무 방 열쇠나 던져 주기'],
        ['🙇', '의자에 누운 채로 손가락으로만 엘리베이터 가리키기'],
      ],
      scold: '환영 인사 → 신분증·예약 확인 → 조식 안내 → 카드키 전달 및 엘리베이터 안내 순서가 호텔리어의 기본이에요!',
    },
    {
      id: 38, cat: 'service', place: '안경원', title: '맞춤 안경 완성 후 고객 전달',
      sr: ['한 원장 선배님', '👨‍⚕️'], jr: ['신입 민수 씨', '🧑'],
      steps: [
        ['✨', '완성된 안경 렌즈를 초음파 세척기로 깨끗이 닦기'],
        ['👓', '손님께 두 손으로 안경을 씌워 드리고 어지럽지 않은지 여쭙기'],
        ['🔧', '귀 뒤와 코받침 높이가 흘러내리지 않게 꼼꼼히 맞춰 조정하기'],
        ['🎁', '안경집에 안경닦이를 함께 넣어 두 손으로 전달하기'],
      ],
      wrongs: [
        ['🔧', '손님이 써 보기도 전에 안경다리를 마음대로 구부려 놓기'],
        ['✨', '렌즈에 지문이 묻은 채로 비닐봉지에 넣어 주기'],
      ],
      scold: '렌즈 세척 → 착용 및 도수 확인 → 코받침·귀 높이 피팅 → 안경집 전달 순서로 모셔야 손님이 편안해하세요!',
    },
    {
      id: 39, cat: 'service', place: '은행 창구', title: '은행 창구 정기예금 가입 안내',
      sr: ['박 부지점장 선배님', '👩‍💼'], jr: ['신입 소연 씨', '👩'],
      steps: [
        ['🔢', '대기 번호표를 확인하고 자리에서 일어나 맞이 인사하기'],
        ['🪪', '신분증을 받아 본인 확인 후 예금 이자율과 만기일 설명하기'],
        ['✍️', '신청서의 표시된 칸에 고객님이 직접 서명하시도록 안내하기'],
        ['📘', '완성된 새 통장과 신분증을 두 손으로 돌려드리며 감사 인사하기'],
      ],
      wrongs: [
        ['✍️', '신분증 확인도 안 하고 직원 마음대로 고객 서명 대신 쓰기'],
        ['🪪', '고객 신분증을 돌려드리지 않고 서랍에 넣어 버리기'],
      ],
      scold: '맞이 인사 → 신분증 확인 및 상품 설명 → 자필 서명 안내 → 통장·신분증 반환 순서를 꼭 지켜야 해요!',
    },
  ];

  const rnd = n => Math.floor(Math.random() * n);
  const shuffleArr = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = rnd(i + 1); [b[i], b[j]] = [b[j], b[i]]; } return b; };
  const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  const todayKey = () => { const d = new Date(); return `${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`; };

  function pickBg(task) {
    const p = task.place || '';
    if (/병원|내과|안과|치과|약국|안경원/.test(p)) return 'assets/why/bg_clinic.jpg';
    if (/한식당|국밥|국수|분식|백반|고깃집|경양식|양식/.test(p)) return 'assets/why/bg_restaurant.jpg';
    if (/카페|찻집|빵집|피자|샌드위치/.test(p)) return 'assets/why/bg_cafe_bakery.jpg';
    if (/명품|라운지|호텔/.test(p)) return 'assets/why/bg_boutique.jpg';
    return 'assets/why/bg_office.jpg';
  }

  function pickChar([name, face], role, avoid) {
    const s = (face || '') + (name || '');
    const isFem = /👩|👵|유나|수빈|은지|소연|수진|미숙|보람|유진|은정|나연|세라/.test(s);
    let c;
    if (/👵/.test(s)) c = 'assets/why/char_senior_woman.png';
    else if (role === 'sr' && /👨‍⚕️|👩‍⚕️/.test(s)) c = 'assets/why/char_doctor.png';
    else if (role === 'sr' && /👨‍🍳|👩‍🍳/.test(s)) c = 'assets/why/char_chef.png';
    else if (role === 'sr') c = isFem ? 'assets/why/char_boss_woman.png' : 'assets/why/char_boss_man.png';
    else c = isFem ? 'assets/why/char_jr_woman.png' : 'assets/why/char_jr_man.png';
    if (avoid && c === avoid) c = isFem ? 'assets/why/char_jr_woman.png' : 'assets/why/char_jr_man.png';
    return c;
  }

  // 어제 배운 과제가 있어서 오늘 후배에게 가르쳐야 하는지 확인
  function hasPendingTeach(member = typeof currentMember !== 'undefined' ? currentMember : null) {
    if (!member || !member.trainMemory) return false;
    const tm = member.trainMemory;
    return Number.isFinite(tm.taskId) && tm.learnedDay && tm.learnedDay !== todayKey() && tm.taughtDay !== todayKey();
  }

  // 오늘의 코스 2번째 스테이지가 '왜라고 질문하기(why)'인지 '선배·후배 교육(train)'인지 결정
  // 1) 어제 선배에게 배운 과제가 있으면 오늘은 반드시 '후배에게 교육시키기(train)'가 나온다.
  // 2) 그렇지 않으면 날마다 '왜라고 질문하기(why)'와 '선배에게 일 배우기(train)'가 번갈아 나온다.
  function pickStageMeta() {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    const today = todayKey();
    if (hasPendingTeach(m)) {
      return {
        type: 'train',
        mode: 'teach',
        label: '👩‍🏫 후배에게 교육 시키기',
        guide: '어제 선배에게 배운 순서를 기억해서 오늘 신입 후배에게 가르쳐 줘요',
      };
    }
    if (m) {
      if (m.workplaceStageDay !== today) {
        const nextType = m.workplaceStageType === 'why' ? 'train' : 'why';
        m.workplaceStageDay = today;
        m.workplaceStageType = nextType;
        if (typeof saveMember === 'function') saveMember();
      }
      if (m.workplaceStageType === 'train') {
        return {
          type: 'train',
          mode: 'learn',
          label: '👩‍🍳 선배에게 일 배우기',
          guide: '선배가 한 번 알려준 레시피·응대 순서를 기억해서 맞을 때까지 해 봐요',
        };
      }
      return {
        type: 'why',
        label: '💼 왜라고 질문하기',
        guide: '후배에게 "왜?"라고 물어서 진짜 원인을 알아 와요',
      };
    }
    return {
      type: 'train',
      mode: 'learn',
      label: '👩‍🍳 선배에게 일 배우기',
      guide: '선배가 한 번 알려준 레시피·응대 순서를 기억해서 맞을 때까지 해 봐요',
    };
  }

  function pickTaskForToday(mode) {
    const m = typeof currentMember !== 'undefined' ? currentMember : null;
    const today = todayKey();
    if (mode === 'teach' && m && m.trainMemory && Number.isFinite(m.trainMemory.taskId)) {
      const found = TASKS.find(t => t.id === m.trainMemory.taskId);
      if (found) return found;
    }
    if (m) {
      if (m.trainTaskDay !== today || !Number.isFinite(m.trainTaskId)) {
        const nextIdx = Number.isFinite(m.trainCursor) ? (m.trainCursor + 1) % TASKS.length : rnd(TASKS.length);
        m.trainCursor = nextIdx;
        m.trainTaskId = TASKS[nextIdx].id;
        m.trainTaskDay = today;
        if (typeof saveMember === 'function') saveMember();
      }
      return TASKS.find(t => t.id === m.trainTaskId) || TASKS[0];
    }
    return TASKS[rnd(TASKS.length)];
  }

  function injectStyle() {
    if (!document.getElementById('whyStyle')) {
      const ws = document.createElement('style');
      ws.id = 'whyStyle';
      ws.textContent = `
        .wy-panel{padding:10px!important;overflow:hidden;}
        .wy-stage{position:relative;width:100%;min-height:370px;border-radius:20px;overflow:hidden;background:#2C3E50 center/cover no-repeat;box-shadow:0 8px 24px rgba(15,23,42,.18);display:flex;flex-direction:column;justify-content:space-between;transition:background-position .6s ease;}
        .wy-stage.at-boss{background-position:32% center;}
        .wy-stage.at-jr{background-position:68% center;}
        .wy-stage::before{content:'';position:absolute;inset:0;background:linear-gradient(180deg,rgba(15,23,42,.38) 0%,rgba(15,23,42,.04) 36%,rgba(15,23,42,.62) 100%);pointer-events:none;z-index:1;}
        .wy-stage.shake{animation:wyShake .45s ease;}
        .wy-hud{position:relative;z-index:4;display:flex;justify-content:space-between;align-items:center;gap:6px;padding:10px 12px 0;flex-wrap:wrap;}
        .wy-badge{background:rgba(15,23,42,.72);backdrop-filter:blur(6px);color:#fff;font-family:'Jua';font-size:15px;padding:5px 12px;border-radius:999px;border:1px solid rgba(255,255,255,.22);}
        .wy-badge.loc{background:rgba(255,255,255,.92);color:#191F28;font-weight:700;box-shadow:0 2px 8px rgba(0,0,0,.15);}
        .wy-mysay{position:relative;z-index:4;align-self:flex-end;max-width:86%;margin:6px 12px 0;background:#FEE500;color:#191F28;border:2px solid #F5C400;border-radius:16px 16px 4px 16px;padding:8px 13px;font-size:17px;font-weight:700;line-height:1.4;word-break:keep-all;text-align:left;box-shadow:0 4px 12px rgba(0,0,0,.18);animation:pop .25s ease;}
        .wy-mysay[hidden]{display:none;}
        .wy-actor-layer{position:relative;z-index:2;height:225px;display:flex;align-items:flex-end;justify-content:center;pointer-events:none;margin-top:auto;}
        .wy-char-img{height:245px;width:auto;max-width:78%;object-fit:contain;object-position:bottom center;filter:drop-shadow(0 8px 18px rgba(0,0,0,.38));transform-origin:bottom center;transition:transform .3s ease;}
        .wy-char-img.enter{animation:wyCharIn .35s cubic-bezier(.2,.8,.2,1);}
        .wy-char-img.talk{animation:wyTalk .4s ease;}
        .wy-char-img.angry{animation:wyShake .45s ease;filter:drop-shadow(0 0 16px rgba(240,68,82,.75));}
        .wy-char-img.happy{animation:wyHappy .6s ease;}
        @keyframes wyCharIn{from{opacity:0;transform:translateY(18px) scale(.95);}to{opacity:1;transform:translateY(0) scale(1);}}
        @keyframes wyTalk{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-6px) scale(1.02);}}
        @keyframes wyHappy{0%,100%{transform:translateY(0);}40%{transform:translateY(-10px) rotate(-2deg);}75%{transform:translateY(-5px) rotate(2deg);}}
        .wy-mood{position:absolute;top:12px;right:18%;font-size:34px;filter:drop-shadow(0 4px 8px rgba(0,0,0,.28));animation:pop .3s ease;}
        .wy-mood[hidden]{display:none;}
        .wy-dlg{position:relative;z-index:3;margin:-18px 8px 8px;background:rgba(255,255,255,.96);backdrop-filter:blur(8px);border:3px solid #D0DDF0;border-radius:18px;padding:18px 14px 14px;text-align:left;box-shadow:0 8px 24px rgba(0,0,0,.22);}
        .wy-dlg.boss{border-color:#68A0FF;background:rgba(244,248,255,.97);}
        .wy-dlg.angry{border-color:#F04452;background:#FFF0F1;}
        .wy-dlg.happy{border-color:#2FA28E;background:#EEFAF6;}
        .wy-dlg-who{position:absolute;top:-16px;left:14px;display:inline-flex;align-items:center;gap:6px;background:#1E56A0;color:#fff;font-family:'Jua';font-size:17px;padding:4px 14px;border-radius:999px;box-shadow:0 3px 8px rgba(0,0,0,.18);}
        .wy-dlg.jr .wy-dlg-who{background:#1F7A68;}
        .wy-dlg.angry .wy-dlg-who{background:#D92D3A;}
        .wy-dlg-text{font-size:20px;line-height:1.5;font-weight:700;color:#191F28;word-break:keep-all;min-height:1.5em;}
        .wy-dlg.angry .wy-dlg-text{color:#B0202E;}
        .wy-ctx-strip{margin-top:8px;background:#F3F7FF;border:2px solid #BFD4FF;border-radius:14px;padding:10px 12px;text-align:left;font-size:17px;line-height:1.45;color:#1E3A6E;word-break:keep-all;}
        .wy-ctx-strip b{font-family:'Jua';font-size:18px;color:#154291;display:block;margin-bottom:2px;}
        .wy-help-bar{display:flex;gap:8px;margin-top:8px;}
        .wy-help-btn{flex:1;border:2px solid #CBD5E1;background:#fff;border-radius:14px;padding:11px 10px;font-family:'Jua';font-size:17px;color:#1E293B;cursor:pointer;box-shadow:0 2px 6px rgba(0,0,0,.05);word-break:keep-all;line-height:1.3;}
        .wy-help-btn.explain{background:#FFF9DB;border-color:#F59F00;color:#7C4A00;}
        .wy-help-btn.explain.open{background:#F59F00;color:#fff;}
        .wy-help-btn.restart{background:#EEF4FF;border-color:#68A0FF;color:#1E56A0;}
        .wy-help-btn:active{transform:scale(.98);}
        .wy-detail{margin-top:8px;background:#FFFDF5;border:3px solid #F59F00;border-radius:18px;padding:14px;text-align:left;box-shadow:0 6px 18px rgba(0,0,0,.08);animation:pop .25s ease;}
        .wy-detail[hidden]{display:none;}
        .wy-detail-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;padding-bottom:8px;border-bottom:2px dashed #FCD34D;}
        .wy-detail-title{font-family:'Jua';font-size:20px;color:#7C4A00;}
        .wy-detail-close{border:0;background:#FDE68A;color:#7C4A00;font-family:'Jua';font-size:16px;padding:5px 12px;border-radius:999px;cursor:pointer;}
        .wy-detail-sec{background:#fff;border:1px solid #F3E8C8;border-radius:14px;padding:11px 12px;margin-bottom:8px;font-size:18px;line-height:1.5;color:#191F28;word-break:keep-all;}
        .wy-detail-sec:last-child{margin-bottom:0;}
        .wy-detail-sec-hd{font-family:'Jua';font-size:18px;color:#92400E;margin-bottom:4px;}
        .wy-detail-step{padding:5px 0;border-top:1px dashed #E5E7EB;font-size:17px;}
        .wy-detail-step:first-of-type{border-top:0;}
        .wy-log-wrap{margin-top:12px;border-top:1px dashed #D5DCE2;padding-top:8px;}
        .wy-log-wrap summary{cursor:pointer;font-family:'Jua';font-size:16px;color:#4E5968;padding:6px 4px;text-align:left;user-select:none;}
        .wy-chat{background:#B2C7DA;border-radius:18px;padding:14px 10px;min-height:160px;max-height:36vh;overflow-y:auto;margin-top:6px;}
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
        .wy-ask{font-family:'Jua';font-size:18px;margin:12px 2px 8px;text-align:left;color:#333D4B;}
        .wy-opt{display:block;width:100%;text-align:left;border:2px solid #D0D8E2;background:#fff;border-radius:16px;padding:14px 16px;margin-bottom:9px;font-size:19px;line-height:1.45;color:#191F28;cursor:pointer;word-break:keep-all;box-shadow:0 2px 6px rgba(0,0,0,.04);}
        .wy-opt:active{transform:scale(.98);}
        .wy-opt.gone{opacity:.35;pointer-events:none;}
        .wy-report{display:block;width:100%;border:0;border-radius:16px;background:#3182F6;color:#fff;font-weight:700;font-size:19px;padding:15px;margin-top:6px;cursor:pointer;}
        .wy-report.pulse{animation:wyPulse 1.2s ease-in-out infinite;}
        @keyframes wyPulse{0%,100%{box-shadow:0 0 0 0 rgba(49,130,246,.5);}50%{box-shadow:0 0 0 8px rgba(49,130,246,0);}}
      `;
      document.head.appendChild(ws);
    }
    if (document.getElementById('trainStyle')) return;
    const st = document.createElement('style');
    st.id = 'trainStyle';
    st.textContent = `
      .stage-bar.train-bar{background:linear-gradient(135deg,#E67E22,#D35400);}
      .tr-step-list{margin:10px 0;display:flex;flex-direction:column;gap:8px;}
      .tr-step-card{display:flex;align-items:center;gap:10px;background:#FFFDF7;border:2px solid #F59F00;border-radius:14px;padding:12px 14px;font-size:19px;font-weight:700;color:#191F28;text-align:left;line-height:1.4;word-break:keep-all;box-shadow:0 2px 6px rgba(0,0,0,.04);animation:pop .25s ease;}
      .tr-step-num{flex:0 0 32px;height:32px;border-radius:999px;background:#F59F00;color:#fff;font-family:'Jua';font-size:18px;display:flex;align-items:center;justify-content:center;}
      .tr-step-ico{font-size:26px;flex:0 0 32px;text-align:center;}
      .tr-progress-box{margin:10px 0 6px;background:#F8FAFC;border:2px dashed #CBD5E1;border-radius:16px;padding:10px 12px;text-align:left;}
      .tr-progress-hd{font-family:'Jua';font-size:16px;color:#475569;margin-bottom:6px;}
      .tr-progress-row{display:flex;align-items:center;gap:8px;padding:7px 10px;border-radius:10px;background:#fff;border:1px solid #E2E8F0;margin-bottom:5px;font-size:17px;font-weight:700;color:#1E293B;line-height:1.4;word-break:keep-all;}
      .tr-progress-row span:first-child{white-space:nowrap;flex-shrink:0;}
      .tr-progress-row:last-child{margin-bottom:0;}
      .tr-progress-row.ok{background:#ECFDF5;border-color:#6EE7B7;color:#065F46;}
      .tr-progress-row.bad{background:#FEF2F2;border-color:#FCA5A5;color:#991B1B;}
      .tr-mode-switch{display:flex;gap:6px;margin-top:8px;}
      .tr-mode-pill{flex:1;border:2px solid #CBD5E1;background:#F8FAFC;border-radius:12px;padding:9px 8px;font-family:'Jua';font-size:16px;color:#475569;cursor:pointer;}
      .tr-mode-pill.active{background:#FFF4E6;border-color:#F59F00;color:#B45309;}
    `;
    document.head.appendChild(st);
  }

  function play({ onDone, mode } = {}) {
    injectStyle();
    clear();
    const initialMode = mode || (hasPendingTeach() ? 'teach' : 'learn');
    const task = pickTaskForToday(initialMode);
    run(task, initialMode, onDone);
  }

  function run(initialTask, initialMode, onDone) {
    let task = initialTask;
    let mode = initialMode; // 'learn' (선배에게 배우기) | 'teach' (후배에게 교육시키기)
    api.current = task;
    const startedAt = Date.now();
    let wrongCount = 0, peekCount = 0;

    function render(currentTask, currentMode) {
      task = currentTask;
      mode = currentMode;
      api.current = task;
      clear();

      const [srName, srFace] = task.sr, [jrName, jrFace] = task.jr;
      const bgUrl = pickBg(task);
      const srCharUrl = pickChar(task.sr, 'sr');
      const jrCharUrl = pickChar(task.jr, 'jr', srCharUrl);
      const bar = typeof stageBar === 'function' && typeof session !== 'undefined' && session ? stageBar() : '';
      const catBadge = task.cat === 'cook' ? '🍳 요리·레시피' : '🛎️ 고객 응대 순서';

      // whyStyle이 아직 없으면 기본 주입
      if (!document.getElementById('whyStyle')) {
        const s = document.createElement('style');
        s.id = 'whyStyleFallback';
        s.textContent = `.wy-panel{padding:10px!important;overflow:hidden;}.wy-stage{position:relative;width:100%;min-height:360px;border-radius:20px;overflow:hidden;background:#2C3E50 center/cover no-repeat;display:flex;flex-direction:column;justify-content:space-between;}`;
        document.head.appendChild(s);
      }

      const v = el(`
        <div class="fade">
          ${bar}
          <div class="panel wy-panel">
            <div class="wy-stage at-boss" id="trStage" style="background-image:url('${bgUrl}')">
              <div class="wy-hud">
                <span class="wy-badge">${catBadge} · ${esc(task.place)}</span>
                <span class="wy-badge loc" id="trLoc">👩‍🍳 ${esc(srName)}</span>
              </div>
              <div class="wy-mysay" id="trMySay" hidden></div>
              <div class="wy-actor-layer">
                <img class="wy-char-img enter" id="trCharImg" src="${srCharUrl}" alt="${esc(srName)}">
                <div class="wy-mood" id="trMood" hidden></div>
              </div>
              <div class="wy-dlg boss" id="trDlg">
                <div class="wy-dlg-who" id="trDlgWho">${srFace} ${esc(srName)}</div>
                <div class="wy-dlg-text" id="trDlgText"></div>
              </div>
            </div>
            <div class="wy-ctx-strip" id="trCtxStrip">
              <b>📌 오늘의 과제: [${esc(task.place)}] ${esc(task.title)}</b>
              ${mode === 'learn'
                ? `${srFace} ${esc(srName)}이 알려주신 4단계 순서를 기억해서 맞을 때까지 직접 해 보세요!`
                : `어제 ${srFace} ${esc(srName)}께 배운 [${esc(task.title)}] 순서를 ${jrFace} ${esc(jrName)}에게 그대로 가르쳐 주세요!`}
            </div>
            <div class="wy-help-bar">
              <button type="button" class="wy-help-btn explain" id="trExplainBtn">📖 상황 자세히 알려주기</button>
              <button type="button" class="wy-help-btn restart" id="trRestartBtn">🎬 처음부터 상황극 시작</button>
            </div>
            <div class="tr-mode-switch">
              <button type="button" class="tr-mode-pill ${mode === 'learn' ? 'active' : ''}" id="trModeLearn">👩‍🍳 선배님께 일 배우기</button>
              <button type="button" class="tr-mode-pill ${mode === 'teach' ? 'active' : ''}" id="trModeTeach">👩‍🏫 후배에게 교육 시키기</button>
            </div>
            <div class="wy-detail" id="trDetail" hidden></div>
            <div id="trProgress"></div>
            <div id="trTip"></div>
            <div id="trArea"></div>
            <details class="wy-log-wrap">
              <summary>📜 지금까지 나눈 대화 다시 보기</summary>
              <div class="wy-chat" id="trChat"></div>
            </details>
          </div>
        </div>`);
      app.appendChild(v);

      const stageEl = v.querySelector('#trStage'), locEl = v.querySelector('#trLoc'), mySayEl = v.querySelector('#trMySay');
      const charImgEl = v.querySelector('#trCharImg'), moodEl = v.querySelector('#trMood');
      const dlgEl = v.querySelector('#trDlg'), dlgWhoEl = v.querySelector('#trDlgWho'), dlgTextEl = v.querySelector('#trDlgText');
      const explainBtn = v.querySelector('#trExplainBtn'), restartBtn = v.querySelector('#trRestartBtn'), detailEl = v.querySelector('#trDetail');
      const progEl = v.querySelector('#trProgress'), tipEl = v.querySelector('#trTip'), area = v.querySelector('#trArea'), chat = v.querySelector('#trChat');

      v.querySelector('#trModeLearn').addEventListener('click', () => { if (mode !== 'learn') render(task, 'learn'); });
      v.querySelector('#trModeTeach').addEventListener('click', () => { if (mode !== 'teach') render(task, 'teach'); });

      let timers = [];
      const later = (fn, ms) => { const id = setTimeout(fn, ms); timers.push(id); return id; };
      const clearTimers = () => { timers.forEach(clearTimeout); timers = []; };

      let phase = 'study'; // 'study' | 'do' | 'teach' | 'review' | 'done'
      let stepIdx = 0;
      let pickedSteps = [];
      let lastSpeaker = 'sr';

      const scroll = () => { chat.scrollTop = chat.scrollHeight; };
      const tip = (html, cls) => { tipEl.innerHTML = html ? `<div class="wy-tip ${cls || ''}">${html}</div>` : ''; };

      function say(who, text, mood) {
        const isSr = who === 'sr';
        chat.insertAdjacentHTML('beforeend', who === 'me'
          ? `<div class="wy-row me"><div class="wy-b">${esc(text)}</div></div>`
          : `<div class="wy-row ${isSr ? 'boss' : ''} ${mood || ''}"><div class="wy-face">${isSr ? srFace : jrFace}</div><div><div class="wy-name">${esc(isSr ? srName : jrName)}</div><div class="wy-b">${esc(text)}</div></div></div>`);
        scroll();
        if (who === 'me') {
          mySayEl.hidden = false;
          mySayEl.textContent = `🗣️ 나: "${text}"`;
          return;
        }
        const targetUrl = isSr ? srCharUrl : jrCharUrl;
        const switched = lastSpeaker !== who;
        lastSpeaker = who;
        stageEl.classList.toggle('at-boss', isSr);
        stageEl.classList.toggle('at-jr', !isSr);
        if (charImgEl.getAttribute('src') !== targetUrl) charImgEl.setAttribute('src', targetUrl);
        charImgEl.setAttribute('alt', isSr ? srName : jrName);
        charImgEl.className = 'wy-char-img';
        void charImgEl.offsetWidth;
        charImgEl.classList.add(mood === 'angry' ? 'angry' : mood === 'happy' ? 'happy' : switched ? 'enter' : 'talk');
        if (mood === 'angry') { moodEl.hidden = false; moodEl.textContent = '😠'; }
        else if (mood === 'happy') { moodEl.hidden = false; moodEl.textContent = '😊'; }
        else if (!isSr) { moodEl.hidden = false; moodEl.textContent = '📝'; }
        else { moodEl.hidden = true; }
        dlgEl.className = `wy-dlg ${isSr ? 'boss' : 'jr'} ${mood || ''}`;
        dlgWhoEl.textContent = `${isSr ? srFace : jrFace} ${isSr ? srName : jrName}`;
        dlgTextEl.textContent = text;
      }

      function renderDetail() {
        if (detailEl.hidden) return;
        const roleHtml = mode === 'learn'
          ? `👩‍🍳 여기는 <b>${esc(task.place)}</b>이에요.<br>선배인 <b>${esc(srName)}</b>이 <b>[${esc(task.title)}]</b> 순서를 한 번 알려주시면, 그 순서를 잘 외웠다가 틀리지 않고 끝까지 해 보는 역할이에요.<br>오늘 잘 배워 두면 <b>내일 새로 오는 후배(${esc(jrName)})</b>에게 그대로 가르쳐 주게 돼요!`
          : `👩‍🏫 여기는 <b>${esc(task.place)}</b>이에요.<br>어제 <b>${esc(srName)}</b>께 배운 <b>[${esc(task.title)}]</b> 순서를 기억해서 오늘 신입 후배 <b>${esc(jrName)}</b>에게 차례대로 알려주는 역할이에요.<br>내가 알려준 대로 후배가 선배님께 가서 <b>검토(심사)</b>를 받으니 정확히 알려줘야 해요!`;
        const nowHtml = phase === 'study'
          ? `화면 아래에 적힌 <b>1번부터 ${task.steps.length}번까지의 순서</b>를 눈으로 천천히 읽고 외우신 뒤, 파란 시작 버튼을 눌러 주세요.`
          : phase === 'do'
          ? `방금 선배님께 배운 순서 중 <b>${stepIdx + 1}번째로 해야 할 일</b>을 보기에서 골라 눌러 주세요. 틀리면 선배님께 혼나고 다시 배울 수 있어요!`
          : phase === 'teach'
          ? `후배 <b>${esc(jrName)}</b>에게 <b>${stepIdx + 1}번째로 해야 할 일</b>을 골라 알려주세요. 기억이 안 나면 [💡 선배님께 다시 여쭤보기]를 누르셔도 돼요.`
          : `모든 과정을 잘 마치셨어요! 아래 버튼을 눌러 다음으로 넘어가세요.`;
        detailEl.innerHTML = `
          <div class="wy-detail-head">
            <span class="wy-detail-title">📖 이번 상황 쉽게 이해하기</span>
            <button type="button" class="wy-detail-close" id="trDetailClose">닫기 ✕</button>
          </div>
          <div class="wy-detail-sec">
            <div class="wy-detail-sec-hd">① 어디서 무슨 역할을 하나요?</div>
            ${roleHtml}
          </div>
          <div class="wy-detail-sec">
            <div class="wy-detail-sec-hd">② 등장인물 소개</div>
            <div><b>${srFace} ${esc(srName)}(선배님):</b> 나에게 일을 가르쳐 주시고, 후배가 잘하는지 검토해 칭찬하거나 꾸중하시는 분</div>
            <div style="margin-top:5px;"><b>${jrFace} ${esc(jrName)}(신입 후배):</b> 나에게 일하는 순서를 배워서 선배님께 검사받는 후배</div>
          </div>
          <div class="wy-detail-sec" style="background:#EEF4FF;border-color:#9EC1FF;">
            <div class="wy-detail-sec-hd" style="color:#1E56A0;">③ 지금 어떻게 하면 되나요?</div>
            ${nowHtml}
          </div>`;
        const cBtn = detailEl.querySelector('#trDetailClose');
        if (cBtn) cBtn.addEventListener('click', () => toggleDetail(false));
      }

      function toggleDetail(forceOpen) {
        const open = typeof forceOpen === 'boolean' ? forceOpen : detailEl.hidden;
        detailEl.hidden = !open;
        explainBtn.classList.toggle('open', open);
        explainBtn.textContent = open ? '📖 상황 설명 접기 ▲' : '📖 상황 자세히 알려주기';
        if (open) renderDetail();
      }
      explainBtn.addEventListener('click', () => toggleDetail());

      // ---------------- 모드 1: 선배님께 배워서 맞을 때까지 해 보기 ----------------
      function showStudyScreen(isRetry) {
        clearTimers();
        phase = 'study';
        stepIdx = 0;
        pickedSteps = [];
        progEl.innerHTML = '';
        mySayEl.hidden = true;
        locEl.textContent = `👩‍🍳 ${srName}의 시범`;
        say('sr', isRetry
          ? `다시 한 번 [${task.title}] 순서를 처음부터 알려드릴게요! 이번엔 순서가 헷갈리지 않게 꼭 외워 보세요!`
          : `잘 오셨어요! 오늘 배울 일은 [${task.title}]예요. 제가 딱 한 번 순서를 알려드릴 테니 잘 기억했다가 똑같이 해 보세요. 내일 후배가 오면 그대로 알려주셔야 해요!`);
        tip('👀 <b>1번부터 4번까지 순서</b>를 눈으로 천천히 읽고 기억한 뒤 아래 버튼을 눌러 주세요.');
        area.innerHTML = `
          <div class="wy-ask">📋 ${esc(srName)}이 알려주시는 [${esc(task.title)}] 순서</div>
          <div class="tr-step-list">
            ${task.steps.map(([ico, txt], i) => `
              <div class="tr-step-card">
                <div class="tr-step-num">${i + 1}</div>
                <div class="tr-step-ico">${ico}</div>
                <div>${esc(txt)}</div>
              </div>`).join('')}
          </div>
          <button class="wy-report pulse" type="button" id="trStartDo" style="margin-top:10px;">
            ${task.cat === 'cook' ? '🍳 다 외웠어요! 순서대로 만들어 보기 →' : '🛎️ 다 외웠어요! 순서대로 해 보기 →'}
          </button>`;
        area.querySelector('#trStartDo').addEventListener('click', () => {
          stepIdx = 0;
          pickedSteps = [];
          askDoStep();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        });
        renderDetail();
      }

      function renderProgressBox(title, list) {
        if (!list.length) { progEl.innerHTML = ''; return; }
        progEl.innerHTML = `
          <div class="tr-progress-box">
            <div class="tr-progress-hd">${esc(title)}</div>
            ${list.map((s, i) => `<div class="tr-progress-row ${s.cls || 'ok'}"><span>${i + 1}단계:</span> <span>${s.ico} ${esc(s.txt)}</span></div>`).join('')}
          </div>`;
      }

      function askDoStep() {
        phase = 'do';
        renderDetail();
        locEl.textContent = `🧪 실습 중 (${stepIdx + 1}/${task.steps.length}단계)`;
        if (stepIdx === 0) {
          say('sr', `자, 설명을 가렸어요! [${task.title}] 1번째로 해야 할 일은 무엇인가요?`);
        } else {
          say('sr', `좋아요! 그럼 ${stepIdx + 1}번째로 해야 할 일은 무엇인가요?`);
        }
        tip(`🤔 방금 배운 순서 중 <b>${stepIdx + 1}번째 할 일</b>을 골라 눌러 주세요.`);
        const remaining = task.steps.slice(stepIdx).map(([ico, txt], idx) => ({ ico, txt, stepOrder: stepIdx + idx, isCorrect: idx === 0 }));
        const wrongPool = task.wrongs.map(([ico, txt]) => ({ ico, txt, stepOrder: -1, isCorrect: false }));
        const choices = shuffleArr([...remaining, ...shuffleArr(wrongPool).slice(0, 1)]);

        area.innerHTML = `
          <div class="wy-ask">👉 ${stepIdx + 1}번째 순서로 알맞은 것을 고르세요</div>
          ${choices.map((c, i) => `<button class="wy-opt" type="button" data-i="${i}">${c.ico} ${esc(c.txt)}</button>`).join('')}
          <button class="wy-help-btn explain" type="button" id="trPeekStudy" style="width:100%;margin-top:4px;">💡 기억이 안 나요 · 선배님 설명 다시 보기</button>`;

        area.querySelector('#trPeekStudy').addEventListener('click', () => {
          peekCount++;
          showStudyScreen(true);
        });
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => {
          const picked = choices[Number(b.dataset.i)];
          onPickDoStep(picked);
        }));
      }

      function onPickDoStep(picked) {
        area.innerHTML = '';
        say('me', `${picked.ico} ${picked.txt}`);
        if (!picked.isCorrect) {
          wrongCount++;
          if (typeof beep === 'function') beep(220, 0.15);
          later(() => {
            const correct = task.steps[stepIdx];
            const reason = picked.stepOrder > stepIdx
              ? `그건 ${picked.stepOrder + 1}번째에 할 일이잖아요! 지금은 ${stepIdx + 1}번째인 '${correct[1]}'부터 해야죠!`
              : `그런 건 제가 알려드린 적도 없잖아요! ${stepIdx + 1}번째는 '${correct[1]}' 순서예요!`;
            say('sr', `😠 잠깐만요! 순서가 틀렸어요! ${reason} ${task.scold}`, 'angry');
            stageEl.classList.remove('shake'); void stageEl.offsetWidth; stageEl.classList.add('shake');
            tip('😓 <b>순서가 틀려서 선배님께 꾸중을 들었어요.</b> 다시 한 번 순서를 배우고 처음부터 맞을 때까지 해 봐요!', 'bad');
            area.innerHTML = `<button class="wy-report pulse" type="button" id="trRetryLearn">📖 선배님께 다시 배우고 처음부터 해 보기 →</button>`;
            area.querySelector('#trRetryLearn').addEventListener('click', () => showStudyScreen(true));
          }, 500);
          return;
        }

        // 정답 단계!
        if (typeof beep === 'function') beep(660, 0.1);
        pickedSteps.push({ ico: picked.ico, txt: picked.txt, cls: 'ok' });
        renderProgressBox(`✅ 지금까지 순서대로 잘 해낸 일`, pickedSteps);
        stepIdx++;

        if (stepIdx < task.steps.length) {
          later(askDoStep, 650);
          return;
        }

        // 전 단계 모두 맞힘!
        later(() => {
          phase = 'done';
          renderDetail();
          if (typeof beep === 'function') beep(880, 0.15);
          if (typeof confetti === 'function') confetti(wrongCount === 0 ? 5 : 3);
          say('sr', `😊 와, 한 번 알려드렸는데 1번부터 ${task.steps.length}번까지 순서 하나 안 틀리고 완벽해요! 오늘 배운 [${task.title}] 순서를 꼭 기억해 두셨다가, 내일 후배 ${jrName}가 오면 그대로 알려주세요!`, 'happy');
          tip('🎉 <b>선배님께 크게 칭찬받았어요!</b> 오늘 배운 순서를 잘 기억해 두세요. 내일 신입 후배에게 알려주게 됩니다!', 'good');

          // 내일 후배 교육용으로 회원 기록에 저장
          if (typeof currentMember !== 'undefined' && currentMember) {
            currentMember.trainMemory = { taskId: task.id, learnedDay: todayKey(), taughtDay: null };
            if (typeof saveMember === 'function') saveMember();
          }

          const inCourse = typeof session !== 'undefined' && session && session.stages[session.idx] && session.stages[session.idx].type === 'train';
          const leftNote = inCourse ? '<div class="wy-ask">오늘은 아직 끝나지 않았어요. 게임이 더 남았어요!<br>아래 버튼을 눌러 다음 게임으로 넘어가요.</div>' : '';
          const nextLabel = inCourse ? '다음 게임 하러 가기 →' : '연습 마치기';
          area.innerHTML = `
            <button class="wy-opt" type="button" id="trTryTeachNow" style="border-color:#F59F00;background:#FFF9DB;font-family:'Jua';text-align:center;">
              👩‍🏫 방금 배운 걸 지금 바로 후배(${esc(jrName)})에게 가르쳐 보기
            </button>
            ${leftNote}
            <button class="btn btn-primary" type="button" id="trNext" style="margin-top:6px;font-size:21px;padding:16px;">${nextLabel}</button>`;
          area.querySelector('#trTryTeachNow').addEventListener('click', () => render(task, 'teach'));
          area.querySelector('#trNext').addEventListener('click', finish);
        }, 550);
      }

      // ---------------- 모드 2: 어제 배운 걸 후배에게 알려주고 선배에게 검토받기 ----------------
      function startTeachMode(showCheatSheetFirst) {
        clearTimers();
        phase = 'teach';
        stepIdx = 0;
        pickedSteps = [];
        progEl.innerHTML = '';
        mySayEl.hidden = true;

        if (showCheatSheetFirst) {
          locEl.textContent = `👩‍🍳 ${srName}의 재설명`;
          say('sr', `자, [${task.title}] 순서를 다시 한 번 보여드릴 테니 잘 보시고, 이번엔 후배 ${jrName}에게 정확히 가르쳐 주세요!`);
          tip('👀 순서를 다시 확인하셨으면 아래 버튼을 눌러 후배에게 알려주세요.');
          area.innerHTML = `
            <div class="tr-step-list">
              ${task.steps.map(([ico, txt], i) => `
                <div class="tr-step-card">
                  <div class="tr-step-num">${i + 1}</div>
                  <div class="tr-step-ico">${ico}</div>
                  <div>${esc(txt)}</div>
                </div>`).join('')}
            </div>
            <button class="wy-report pulse" type="button" id="trGoTeachJr" style="margin-top:10px;">
              🚶 ${esc(jrName)}에게 가서 순서 알려주기 →
            </button>`;
          area.querySelector('#trGoTeachJr').addEventListener('click', () => {
            progEl.innerHTML = '';
            askTeachStep();
            window.scrollTo({ top: 0, behavior: 'smooth' });
          });
          renderDetail();
          return;
        }

        askTeachStep();
      }

      function askTeachStep() {
        phase = 'teach';
        renderDetail();
        locEl.textContent = `👩‍🏫 후배 교육 중 (${stepIdx + 1}/${task.steps.length}단계)`;
        if (stepIdx === 0) {
          say('jr', `선배님! 어제 ${srName}께 [${task.title}] 배우셨죠? 저한테 순서를 알려주시면 그대로 배워서 ${srName}께 검사받을게요! 1번째로 뭘 해야 하나요?`);
        } else {
          say('jr', `네, 적어 뒀어요! 그럼 ${stepIdx + 1}번째로는 무엇을 해야 하나요?`);
        }
        tip(`👩‍🏫 <b>${esc(jrName)}</b>에게 <b>${stepIdx + 1}번째로 해야 할 일</b>을 골라 알려주세요. 다 알려주면 후배가 선배님께 검사받으러 가요!`);

        const remaining = task.steps.filter(([ico, txt]) => !pickedSteps.some(p => p.txt === txt)).map(([ico, txt]) => ({ ico, txt }));
        const wrongPool = task.wrongs.filter(([ico, txt]) => !pickedSteps.some(p => p.txt === txt)).map(([ico, txt]) => ({ ico, txt }));
        const choices = shuffleArr([...remaining, ...shuffleArr(wrongPool).slice(0, 1)]);

        area.innerHTML = `
          <div class="wy-ask">👉 후배 ${esc(jrName)}에게 ${stepIdx + 1}번째로 알려줄 일은?</div>
          ${choices.map((c, i) => `<button class="wy-opt" type="button" data-i="${i}">${c.ico} "${esc(c.txt)}"</button>`).join('')}
          <button class="wy-help-btn explain" type="button" id="trPeekForTeach" style="width:100%;margin-top:4px;">💡 어제 배운 순서가 헷갈려요 · 선배님께 다시 여쭤보기</button>`;

        area.querySelector('#trPeekForTeach').addEventListener('click', () => {
          peekCount++;
          startTeachMode(true);
        });
        area.querySelectorAll('.wy-opt').forEach(b => b.addEventListener('click', () => {
          const picked = choices[Number(b.dataset.i)];
          onPickTeachStep(picked);
        }));
      }

      function onPickTeachStep(picked) {
        area.innerHTML = '';
        say('me', `${stepIdx + 1}번째는 "${picked.txt}" 해 주면 돼요.`);
        pickedSteps.push({ ico: picked.ico, txt: picked.txt, cls: 'ok' });
        renderProgressBox(`📝 내가 후배(${jrName})에게 알려준 순서`, pickedSteps);
        stepIdx++;
        if (stepIdx < task.steps.length) {
          later(askTeachStep, 550);
          return;
        }
        // 4단계 모두 후배에게 알려줌 -> 선배님 검토(심사) 장면으로!
        later(() => {
          say('jr', `감사합니다 선배님! 알려주신 4가지 순서 그대로 ${srName}께 가서 검토받아 볼게요!`);
          tip('🔎 이제 후배가 내가 알려준 대로 선배님 앞에서 시연하고 검토를 받습니다!');
          area.innerHTML = `<button class="wy-report pulse" type="button" id="trGoReview">🔎 ${esc(srName)}께 검토받으러 가기 →</button>`;
          area.querySelector('#trGoReview').addEventListener('click', runSeniorReview);
        }, 550);
      }

      // 후배가 선배님 앞에서 검토받는 장면: 통과하면 내가 칭찬받고, 틀리면 내가 혼나고 다시 가르친다!
      function runSeniorReview() {
        phase = 'review';
        renderDetail();
        area.innerHTML = '';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        locEl.textContent = `🔎 ${srName}의 검토 시간`;
        say('sr', `어디 보자, ${jrName}가 어제 제가 알려준 [${task.title}] 순서를 제대로 배웠는지 하나씩 검토해 볼게요!`);

        let wrongIdx = -1;
        for (let i = 0; i < task.steps.length; i++) {
          if (!pickedSteps[i] || pickedSteps[i].txt !== task.steps[i][1]) {
            wrongIdx = i;
            break;
          }
        }

        if (wrongIdx === -1) {
          // 완벽 통과!
          later(() => {
            say('jr', `1번부터 ${task.steps.length}번까지 선배님이 가르쳐 주신 대로 다 마쳤습니다!`, 'happy');
          }, 800);
          later(() => {
            phase = 'done';
            renderDetail();
            if (typeof beep === 'function') beep(880, 0.15);
            if (typeof confetti === 'function') confetti(wrongCount === 0 ? 5 : 3);
            say('sr', `😊 합격이에요! ${jrName}가 순서 하나 안 틀리고 완벽하게 해내네요! 어제 배운 걸 잊지 않고 오늘 후배 교육까지 완벽하게 시켜 주셔서 정말 고맙고 든든합니다! 최고예요! 👍`, 'happy');
            tip('🎉 <b>후배가 선배님 검토를 완벽히 통과해서 내가 큰 칭찬을 받았어요!</b>', 'good');

            if (typeof currentMember !== 'undefined' && currentMember && currentMember.trainMemory) {
              currentMember.trainMemory.taughtDay = todayKey();
              if (typeof saveMember === 'function') saveMember();
            }

            const inCourse = typeof session !== 'undefined' && session && session.stages[session.idx] && session.stages[session.idx].type === 'train';
            const leftNote = inCourse ? '<div class="wy-ask">오늘은 아직 끝나지 않았어요. 게임이 더 남았어요!<br>아래 버튼을 눌러 다음 게임으로 넘어가요.</div>' : '';
            const nextLabel = inCourse ? '다음 게임 하러 가기 →' : '연습 마치기';
            area.innerHTML = `
              <button class="wy-opt" type="button" id="trLearnNewNext" style="border-color:#3182F6;background:#EEF4FF;font-family:'Jua';text-align:center;">
                🍳 내일 후배에게 알려줄 새로운 업무도 하나 배워 두기
              </button>
              ${leftNote}
              <button class="btn btn-primary" type="button" id="trNext" style="margin-top:6px;font-size:21px;padding:16px;">${nextLabel}</button>`;
            area.querySelector('#trLearnNewNext').addEventListener('click', () => {
              const nextTask = TASKS[(task.id + 1) % TASKS.length];
              render(nextTask, 'learn');
            });
            area.querySelector('#trNext').addEventListener('click', finish);
          }, 1600);
        } else {
          // 후배 검토 탈락 -> 내가 선배님께 혼남!
          wrongCount++;
          pickedSteps[wrongIdx].cls = 'bad';
          renderProgressBox(`❌ 선배님 검토 중 ${wrongIdx + 1}단계에서 걸렸어요!`, pickedSteps);
          later(() => {
            if (typeof beep === 'function') beep(220, 0.15);
            const rightStep = task.steps[wrongIdx][1];
            const taughtStep = pickedSteps[wrongIdx].txt;
            say('sr', `😠 스톱! 아니, 후배한테 왜 순서를 잘못 가르쳐 주셨어요! ${wrongIdx + 1}번째는 '${rightStep}' 순서인데 '${taughtStep}' 하라고 알려주시면 어떡해요! ${task.scold} 제가 다시 알려드릴 테니 잘 기억해서 후배한테 다시 제대로 가르쳐 주세요!`, 'angry');
            stageEl.classList.remove('shake'); void stageEl.offsetWidth; stageEl.classList.add('shake');
            tip(`😓 <b>후배가 선배님 검토에서 떨어져서 내가 혼났어요!</b> 선배님께 순서를 다시 확인하고 후배가 통과할 때까지 다시 가르쳐 주세요.`, 'bad');
            area.innerHTML = `<button class="wy-report pulse" type="button" id="trReLearnForJr">📖 선배님께 다시 배워서 후배 다시 교육시키기 →</button>`;
            area.querySelector('#trReLearnForJr').addEventListener('click', () => startTeachMode(true));
          }, 900);
        }
      }

      restartBtn.addEventListener('click', () => {
        if (mode === 'learn') showStudyScreen(false);
        else startTeachMode(false);
      });

      if (mode === 'learn') showStudyScreen(false);
      else startTeachMode(false);
    }

    function finish() {
      const score = Math.max(MIN_SCORE, 100 - wrongCount * WRONG_PENALTY - peekCount * PEEK_PENALTY);
      if (typeof currentMember !== 'undefined' && currentMember) {
        currentMember.trainLog = [...(currentMember.trainLog || []), {
          ts: new Date().toISOString(), mode, taskId: task.id, title: task.title,
          wrong: wrongCount, peek: peekCount, score,
          sec: Math.round((Date.now() - startedAt) / 1000),
        }].slice(-LOG_CAP);
        if (typeof saveMember === 'function') saveMember();
      }
      if (onDone) onDone(score);
    }

    render(task, mode);
  }

  function injectAdminPanel(detailView, member) {
    const log = (member.trainLog || []).slice().reverse();
    const d = iso => { const t = new Date(iso); return `${t.getMonth() + 1}/${t.getDate()}`; };
    const panel = document.createElement('div');
    panel.className = 'admin-panel';
    panel.innerHTML = `<div class="section-title">👩‍🍳 선배에게 배우고 후배 가르치기 (${log.length}회)</div>
      ${log.length ? log.slice(0, 12).map(r => `<div style="padding:6px 0;border-bottom:1px solid var(--line);font-size:14px;display:flex;justify-content:space-between;gap:8px;"><span>${d(r.ts)} · ${r.mode === 'teach' ? '후배교육' : '선배배움'} · ${esc(r.title || '')}</span><span>${r.wrong === 0 ? '⭕ 한 번에 통과' : `실수 ${r.wrong}회`} · ${r.score}점</span></div>`).join('')
        : '<div style="font-size:14px;color:var(--ink-soft);">아직 기록이 없어요</div>'}`;
    const anchor = detailView.querySelector('#back2');
    if (anchor) anchor.parentNode.insertBefore(panel, anchor); else detailView.appendChild(panel);
  }

  const api = { play, injectAdminPanel, TASKS, pickStageMeta, hasPendingTeach, current: null };
  window.TRAIN = api;
})();
