// ==========================================================
// 아바타 의상 컬렉션 · 3~4일 1회 클리어 보상 · 개인 인벤토리(내 옷장) (window.WARDROBE)
// - 모자 20종 (비니 ~ 볼캡/스냅백/트러커/헌팅캡/베레모/버킷햇/페도라/파나마/선햇/방한모)
// - 머플러 20종 (소재 5종 × 크기 3종 × 길이 3종 × 다양한 색깔·패턴)
// - 코스/측정 클리어 시 3~4일 1회 랜덤 해금 + 화려한 축하 팝업(착용하기 / 착용 안 하기)
// - 개인 인벤토리(currentMember.wardrobe)에 영구 보관되어 언제든 꺼내 착용/해제 가능
// ==========================================================
(function () {
  const MAT_LABELS = {
    cashmere: '캐시미어',
    knit: '울 니트',
    fleece: '양털 플리스',
    linen: '면 린넨',
    silk: '실크',
  };
  const SIZE_LABELS = {
    slim: '소형(슬림)',
    regular: '중형(레귤러)',
    oversize: '대형(볼륨)',
  };
  const LEN_LABELS = {
    short: '짧음(쁘띠)',
    medium: '보통(미디엄)',
    long: '김(롱)',
  };

  // -------------------- 모자 20종 (비니 ~ 캡모자 & 클래식 햇) --------------------
  const HAT_ITEMS = [
    {
      id: 'hat_beanie_charcoal', cat: 'hat', type: 'beanie', styleName: '골지 비니', name: '골지 차콜 비니',
      colorName: '차콜 그레이', rarity: '일반', crownOffsetY: 16,
      desc: '도톰한 골지 짜임이 포근하게 감싸주는 데일리 비니',
      colors: { main: '#334155', dark: '#1E293B', light: '#64748B', band: '#1E293B', accent: '#94A3B8' },
    },
    {
      id: 'hat_beanie_wine', cat: 'hat', type: 'pom_beanie', styleName: '방울 비니', name: '와인 폼폼 방울 비니',
      colorName: '버건디 와인', rarity: '고급', crownOffsetY: 23,
      desc: '귀여운 크림 털방울이 달린 따뜻한 와인빛 겨울 비니',
      colors: { main: '#9F1239', dark: '#680B24', light: '#E11D48', band: '#881337', accent: '#FEF3C7' },
    },
    {
      id: 'hat_beanie_mustard', cat: 'hat', type: 'watch_beanie', styleName: '숏 와치비니', name: '머스타드 숏 와치비니',
      colorName: '머스타드', rarity: '일반', crownOffsetY: 14,
      desc: '경쾌하고 따뜻해 보이는 산뜻한 머스타드 숏비니',
      colors: { main: '#D97706', dark: '#92400E', light: '#FBBF24', band: '#B45309', accent: '#FEF3C7' },
    },
    {
      id: 'hat_beanie_mint', cat: 'hat', type: 'stripe_beanie', styleName: '스트라이프 비니', name: '민트 줄무늬 니트비니',
      colorName: '민트&크림', rarity: '고급', crownOffsetY: 23,
      desc: '산뜻한 민트 줄무늬와 방울이 어우러진 화사한 비니',
      colors: { main: '#0D9488', dark: '#115E59', light: '#2DD4BF', band: '#0F766E', stripe: '#FEF9C3', accent: '#CCFBF1' },
    },
    {
      id: 'hat_cap_navy', cat: 'hat', type: 'cap', styleName: '클래식 볼캡', name: '클래식 네이비 볼캡',
      colorName: '딥 네이비', rarity: '일반', crownOffsetY: 15,
      desc: '산책할 때 어디에나 잘 어울리는 단정한 네이비 캡모자',
      colors: { main: '#1E3A8A', dark: '#172554', light: '#3B82F6', brim: '#172554', accent: '#FBBF24' },
    },
    {
      id: 'hat_cap_red', cat: 'hat', type: 'cap', styleName: '스포티 볼캡', name: '스포트 레드 야구캡',
      colorName: '스포트 레드', rarity: '일반', crownOffsetY: 15,
      desc: '활기찬 에너지가 넘치는 선명한 레드 야구모자',
      colors: { main: '#DC2626', dark: '#991B1B', light: '#F87171', brim: '#B91C1C', accent: '#FFFFFF' },
    },
    {
      id: 'hat_cap_khaki', cat: 'hat', type: 'cap', styleName: '코튼 볼캡', name: '워싱 카키 코튼캡',
      colorName: '워싱 카키', rarity: '일반', crownOffsetY: 15,
      desc: '부드러운 면 소재로 편안하게 쓰는 카키빛 볼캡',
      colors: { main: '#A1886F', dark: '#6F5B48', light: '#C8B49B', brim: '#7C6550', accent: '#FEF3C7' },
    },
    {
      id: 'hat_cap_trucker', cat: 'hat', type: 'trucker_cap', styleName: '트러커 캡', name: '빈티지 스카이 트러커캡',
      colorName: '스카이&크림', rarity: '고급', crownOffsetY: 16,
      desc: '시원한 투톤 배색과 별 패치가 돋보이는 트러커 캡모자',
      colors: { main: '#FEF9C3', dark: '#0369A1', light: '#FFFFFF', side: '#0284C7', brim: '#0284C7', accent: '#F59E0B' },
    },
    {
      id: 'hat_snapback_black', cat: 'hat', type: 'snapback', styleName: '스냅백 캡', name: '스트릿 블랙 스냅백',
      colorName: '블랙&골드', rarity: '고급', crownOffsetY: 16,
      desc: '반듯한 일자 챙에 황금 로고가 빛나는 멋쟁이 스냅백',
      colors: { main: '#18181B', dark: '#09090B', light: '#3F3F46', brim: '#111827', underBrim: '#E11D48', accent: '#FACC15' },
    },
    {
      id: 'hat_newsboy_tweed', cat: 'hat', type: 'newsboy', styleName: '트위드 헌팅캡', name: '헤링본 트위드 헌팅캡',
      colorName: '체스트넛', rarity: '고급', crownOffsetY: 13,
      desc: '클래식한 신사 분위기가 물씬 나는 포근한 팔각 헌팅캡',
      colors: { main: '#78350F', dark: '#451A03', light: '#B45309', brim: '#451A03', accent: '#D97706' },
    },
    {
      id: 'hat_flatcap_olive', cat: 'hat', type: 'flatcap', styleName: '울 플랫캡', name: '올리브 울 플랫캡',
      colorName: '올리브 그린', rarity: '일반', crownOffsetY: 12,
      desc: '유럽 공원 산책 느낌이 나는 깔끔한 올리브빛 플랫캡',
      colors: { main: '#4D7C0F', dark: '#365314', light: '#84CC16', brim: '#3F6212', accent: '#ECFCCB' },
    },
    {
      id: 'hat_beret_camel', cat: 'hat', type: 'beret', styleName: '울 베레모', name: '파리지앵 카멜 베레모',
      colorName: '카멜 베이지', rarity: '고급', crownOffsetY: 16,
      desc: '부드럽게 기울여 쓰는 화가 느낌의 멋스러운 카멜 베레모',
      colors: { main: '#C2855A', dark: '#7C4A2D', light: '#E6B18A', band: '#5C341E', accent: '#FDE68A' },
    },
    {
      id: 'hat_beret_lavender', cat: 'hat', type: 'beret', styleName: '플라워 베레모', name: '플라워 라벤더 베레모',
      colorName: '라벤더', rarity: '희귀', crownOffsetY: 16,
      desc: '은은한 꽃 브로치가 포인트로 달린 화사한 연보라 베레모',
      colors: { main: '#9333EA', dark: '#6B21A8', light: '#C084FC', band: '#581C87', accent: '#F472B6', flower: '#FBCFE8' },
    },
    {
      id: 'hat_bucket_denim', cat: 'hat', type: 'bucket', styleName: '데님 버킷햇', name: '인디고 데님 버킷햇',
      colorName: '인디고 블루', rarity: '일반', crownOffsetY: 16,
      desc: '자연스러운 스티치가 멋스러운 캐주얼 인디고 벙거지',
      colors: { main: '#2563EB', dark: '#1E40AF', light: '#60A5FA', band: '#1D4ED8', accent: '#DBEAFE' },
    },
    {
      id: 'hat_bucket_cream', cat: 'hat', type: 'bucket', styleName: '코듀로이 버킷햇', name: '코듀로이 크림 버킷햇',
      colorName: '웜 크림', rarity: '고급', crownOffsetY: 16,
      desc: '보들보들한 골덴 결이 살아있는 따뜻한 크림색 버킷햇',
      colors: { main: '#FDE68A', dark: '#D97706', light: '#FFFBEB', band: '#78350F', accent: '#92400E', cord: true },
    },
    {
      id: 'hat_fedora_brown', cat: 'hat', type: 'fedora', styleName: '중절모 페도라', name: '젠틀 브라운 페도라',
      colorName: '다크 브라운', rarity: '희귀', crownOffsetY: 22,
      desc: '품격 있는 리본 띠가 둘러진 클래식 브라운 페도라',
      colors: { main: '#7C4A2D', dark: '#4A2B18', light: '#A9714B', band: '#29150B', accent: '#F59E0B' },
    },
    {
      id: 'hat_panama_straw', cat: 'hat', type: 'panama', styleName: '밀짚 파나마 햇', name: '서머 밀짚 파나마 햇',
      colorName: '내추럴 스트로', rarity: '고급', crownOffsetY: 21,
      desc: '시원한 밀짚 짜임에 네이비 리본을 두른 여름 파나마 햇',
      colors: { main: '#FBBF24', dark: '#B45309', light: '#FEF3C7', band: '#1E3A8A', accent: '#F8FAFC' },
    },
    {
      id: 'hat_sunhat_rose', cat: 'hat', type: 'sunhat', styleName: '가든 선햇', name: '가든 로즈 플로피 선햇',
      colorName: '스트로&로즈', rarity: '희귀', crownOffsetY: 20,
      desc: '우아한 넓은 챙과 분홍 장미 리본이 사랑스러운 정원 모자',
      colors: { main: '#FCD34D', dark: '#D97706', light: '#FEF9C3', band: '#FB7185', accent: '#FFE4E6', flower: '#F43F5E' },
    },
    {
      id: 'hat_safari_olive', cat: 'hat', type: 'safari', styleName: '사파리 햇', name: '어드벤처 사파리 햇',
      colorName: '올리브 탄', rarity: '고급', crownOffsetY: 20,
      desc: '가죽 스트랩으로 멋을 낸 튼튼한 트레킹 탐험 모자',
      colors: { main: '#847052', dark: '#544631', light: '#B09A77', band: '#451A03', accent: '#D97706' },
    },
    {
      id: 'hat_ushanka_navy', cat: 'hat', type: 'ushanka', styleName: '털귀달이 방한모', name: '극세사 털귀달이 방한모',
      colorName: '네이비&퍼', rarity: '희귀', crownOffsetY: 20,
      desc: '부드러운 인조 양털 귀달이가 귀까지 녹여주는 한겨울 방한모',
      colors: { main: '#1E3A8A', dark: '#172554', light: '#3B82F6', fur: '#FFFBEB', furShade: '#E2E8F0', accent: '#F59E0B' },
    },
  ];

  // -------------------- 머플러 20종 (소재 × 크기 × 길이 × 색깔) --------------------
  const MUFFLER_ITEMS = [
    {
      id: 'muf_cash_red_reg_med', cat: 'muffler', name: '클래식 버건디 캐시미어 머플러',
      material: 'cashmere', size: 'regular', length: 'medium', colorName: '버건디 레드', pattern: 'solid', rarity: '고급',
      desc: '부드러운 윤기가 흐르는 고급 버건디 캐시미어 머플러',
      colors: { main: '#991B1B', dark: '#651010', light: '#EF4444', accent: '#FCA5A5', fringe: '#FCA5A5' },
    },
    {
      id: 'muf_cash_ivory_ov_long', cat: 'muffler', name: '퓨어 아이보리 롱 캐시미어 숄',
      material: 'cashmere', size: 'oversize', length: 'long', colorName: '크림 아이보리', pattern: 'border', rarity: '희귀',
      desc: '어깨까지 풍성하고 길게 떨어지는 최고급 아이보리 롱숄',
      colors: { main: '#FEF9E7', dark: '#D6C7A1', light: '#FFFFFF', accent: '#D97706', fringe: '#E7D8B6' },
    },
    {
      id: 'muf_cash_camel_reg_long', cat: 'muffler', name: '런던 카멜 체크 캐시미어',
      material: 'cashmere', size: 'regular', length: 'long', colorName: '카멜 체크', pattern: 'check', rarity: '희귀',
      desc: '품격 있는 전통 타탄 체크 패턴의 롱 캐시미어 머플러',
      colors: { main: '#D4A373', dark: '#8B5E34', light: '#FAEDCD', accent: '#7F1D1D', stripe: '#1E293B', fringe: '#B07D4F' },
    },
    {
      id: 'muf_knit_navy_ov_med', cat: 'muffler', name: '네이비 케이블 울 니트 목도리',
      material: 'knit', size: 'oversize', length: 'medium', colorName: '딥 네이비', pattern: 'solid', rarity: '고급',
      desc: '굵은 꽈배기 짜임이 도톰하게 목을 감싸주는 겨울 니트 목도리',
      colors: { main: '#1E3A8A', dark: '#172554', light: '#3B82F6', accent: '#93C5FD', fringe: '#BFDBFE' },
    },
    {
      id: 'muf_knit_mustard_reg_long', cat: 'muffler', name: '포근 머스타드 대바늘 머플러',
      material: 'knit', size: 'regular', length: 'long', colorName: '머스타드 옐로우', pattern: 'solid', rarity: '일반',
      desc: '손뜨개 감성이 느껴지는 화사한 머스타드 롱 니트 머플러',
      colors: { main: '#D97706', dark: '#92400E', light: '#FCD34D', accent: '#FEF3C7', fringe: '#FDE68A' },
    },
    {
      id: 'muf_knit_forest_ov_long', cat: 'muffler', name: '포레스트 그린 청키 롱목도리',
      material: 'knit', size: 'oversize', length: 'long', colorName: '포레스트 그린', pattern: 'solid', rarity: '희귀',
      desc: '길고 볼륨감 넘치게 두르는 깊은 숲속 색감의 청키 목도리',
      colors: { main: '#065F46', dark: '#064E3B', light: '#10B981', accent: '#A7F3D0', fringe: '#6EE7B7' },
    },
    {
      id: 'muf_knit_stripe_reg_med', cat: 'muffler', name: '홀리데이 레드 스트라이프 니트',
      material: 'knit', size: 'regular', length: 'medium', colorName: '레드&화이트', pattern: 'stripe', rarity: '고급',
      desc: '경쾌한 레드·화이트 줄무늬가 겨울 분위기를 살려주는 목도리',
      colors: { main: '#DC2626', dark: '#991B1B', light: '#F87171', stripe: '#FFFBEB', accent: '#FFFFFF', fringe: '#FEF2F2' },
    },
    {
      id: 'muf_knit_lavender_slim_short', cat: 'muffler', name: '라벤더 쁘띠 꽈배기 넥워머',
      material: 'knit', size: 'slim', length: 'short', colorName: '라벤더 퍼플', pattern: 'solid', rarity: '일반',
      desc: '가볍고 아담하게 목에 쏙 들어가는 연보라 니트 쁘띠 워머',
      colors: { main: '#7E22CE', dark: '#581C87', light: '#C084FC', accent: '#F3E8FF', fringe: '#E9D5FF' },
    },
    {
      id: 'muf_fleece_cream_ov_short', cat: 'muffler', name: '몽글몽글 크림 양털 넥워머',
      material: 'fleece', size: 'oversize', length: 'short', colorName: '웜 크림', pattern: 'solid', rarity: '고급',
      desc: '구름처럼 폭신하고 둥글게 감기는 대형 양털 플리스 넥워머',
      colors: { main: '#FFFBEB', dark: '#D6C7A1', light: '#FFFFFF', accent: '#F59E0B', fringe: '#FDE68A' },
    },
    {
      id: 'muf_fleece_cocoa_reg_med', cat: 'muffler', name: '코코아 보아 플리스 머플러',
      material: 'fleece', size: 'regular', length: 'medium', colorName: '코코아 브라운', pattern: 'solid', rarity: '일반',
      desc: '달콤한 코코아 색감의 보들보들한 플리스 데일리 목도리',
      colors: { main: '#78350F', dark: '#451A03', light: '#B45309', accent: '#FDE68A', fringe: '#D97706' },
    },
    {
      id: 'muf_fleece_pink_ov_med', cat: 'muffler', name: '딸기우유 파스텔 핑크 플리스',
      material: 'fleece', size: 'oversize', length: 'medium', colorName: '파스텔 핑크', pattern: 'solid', rarity: '고급',
      desc: '얼굴이 화사해 보이는 폭신폭신한 딸기우유빛 볼륨 플리스',
      colors: { main: '#F472B6', dark: '#BE185D', light: '#FBCFE8', accent: '#FFFFFF', fringe: '#FCE7F3' },
    },
    {
      id: 'muf_fleece_mint_slim_short', cat: 'muffler', name: '민트 퍼지 미니 플리스',
      material: 'fleece', size: 'slim', length: 'short', colorName: '파스텔 민트', pattern: 'solid', rarity: '일반',
      desc: '슬림하고 짧게 포인트를 줄 수 있는 가벼운 민트 쁘띠 플리스',
      colors: { main: '#2DD4BF', dark: '#0F766E', light: '#99F6E4', accent: '#FFFFFF', fringe: '#CCFBF1' },
    },
    {
      id: 'muf_linen_sky_slim_med', cat: 'muffler', name: '산들 스카이블루 린넨 스카프',
      material: 'linen', size: 'slim', length: 'medium', colorName: '스카이 블루', pattern: 'solid', rarity: '일반',
      desc: '봄·가을 바람에 산뜻하게 두르기 좋은 가벼운 하늘빛 린넨 스카프',
      colors: { main: '#0284C7', dark: '#075985', light: '#7DD3FC', accent: '#E0F2FE', fringe: '#BAE6FD' },
    },
    {
      id: 'muf_linen_oat_reg_long', cat: 'muffler', name: '내추럴 오트밀 린넨 롱스카프',
      material: 'linen', size: 'regular', length: 'long', colorName: '오트밀 베이지', pattern: 'check', rarity: '고급',
      desc: '자연스러운 직조 결이 살아있는 편안한 오트밀빛 롱 린넨 스카프',
      colors: { main: '#D6C7B2', dark: '#8C7A63', light: '#F5EFE6', accent: '#78350F', stripe: '#A89680', fringe: '#C5B59F' },
    },
    {
      id: 'muf_linen_sage_slim_short', cat: 'muffler', name: '세이지그린 코튼 쁘띠스카프',
      material: 'linen', size: 'slim', length: 'short', colorName: '세이지 그린', pattern: 'solid', rarity: '일반',
      desc: '담백한 세이지 빛깔의 가볍고 단정한 미니 코튼 스카프',
      colors: { main: '#4D7C0F', dark: '#365314', light: '#A3E635', accent: '#ECFCCB', fringe: '#D9F99D' },
    },
    {
      id: 'muf_linen_charcoal_reg_med', cat: 'muffler', name: '모던 차콜 헤링본 코튼 머플러',
      material: 'linen', size: 'regular', length: 'medium', colorName: '차콜 그레이', pattern: 'check', rarity: '일반',
      desc: '어느 옷에나 깔끔하게 어우러지는 모던 차콜 격자 코튼 머플러',
      colors: { main: '#475569', dark: '#1E293B', light: '#94A3B8', accent: '#E2E8F0', stripe: '#334155', fringe: '#CBD5E1' },
    },
    {
      id: 'muf_silk_coral_slim_short', cat: 'muffler', name: '로즈 코랄 쁘띠 실크 스카프',
      material: 'silk', size: 'slim', length: 'short', colorName: '로즈 코랄', pattern: 'border', rarity: '고급',
      desc: '매끈한 진주빛 광택과 고운 리본 매듭이 우아한 미니 실크 스카프',
      colors: { main: '#F43F5E', dark: '#BE123C', light: '#FDA4AF', accent: '#FFF1F2', fringe: '#FFE4E6' },
    },
    {
      id: 'muf_silk_royal_reg_med', cat: 'muffler', name: '로얄 골드트리밍 실크 머플러',
      material: 'silk', size: 'regular', length: 'medium', colorName: '로얄 블루&골드', pattern: 'border', rarity: '희귀',
      desc: '고귀한 로얄 블루 바탕에 금빛 테두리가 감도는 실크 스카프',
      colors: { main: '#1D4ED8', dark: '#1E3A8A', light: '#60A5FA', accent: '#FACC15', fringe: '#FDE047' },
    },
    {
      id: 'muf_silk_champagne_slim_long', cat: 'muffler', name: '샴페인 펄 롱 드레이프 스카프',
      material: 'silk', size: 'slim', length: 'long', colorName: '샴페인 골드', pattern: 'solid', rarity: '희귀',
      desc: '은은한 샴페인 금빛이 길고 우아하게 흐르는 롱 실크 스카프',
      colors: { main: '#FDE68A', dark: '#D97706', light: '#FFFDF5', accent: '#FFFFFF', fringe: '#FCD34D' },
    },
    {
      id: 'muf_cash_plum_ov_long', cat: 'muffler', name: '로얄 플럼 럭셔리 오버핏 롱숄',
      material: 'cashmere', size: 'oversize', length: 'long', colorName: '딥 플럼', pattern: 'border', rarity: '희귀',
      desc: '깊고 기품 있는 자주빛 플럼 컬러의 풍성한 캐시미어 롱숄',
      colors: { main: '#6B21A8', dark: '#3B0764', light: '#A855F7', accent: '#F3E8FF', fringe: '#D8B4FE' },
    },
  ];

  const ALL_ITEMS = [...HAT_ITEMS, ...MUFFLER_ITEMS];
  const ITEM_BY_ID = Object.fromEntries(ALL_ITEMS.map((it) => [it.id, it]));

  function getTodayLocalYMD(d = new Date()) {
    const dt = d instanceof Date ? d : new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`;
  }

  function parseYMDToUTC(ymd) {
    const m = /^(\d{4})-(\d{1,2})-(\d{1,2})$/.exec(String(ymd || ''));
    if (!m) return null;
    return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  }

  function diffDaysYMD(fromYMD, toYMD) {
    const a = parseYMDToUTC(fromYMD);
    const b = parseYMDToUTC(toYMD);
    if (a === null || b === null) return 999;
    return Math.round((b - a) / 86400000);
  }

  function getMember(explicitMember) {
    if (explicitMember && typeof explicitMember === 'object') return explicitMember;
    return typeof currentMember !== 'undefined' && currentMember ? currentMember : null;
  }

  function ensureState(member = null) {
    const m = getMember(member);
    if (!m) {
      return {
        owned: [],
        acquiredAt: {},
        equipped: { hatId: null, mufflerId: null },
        lastDropYMD: null,
        nextIntervalDays: null,
      };
    }
    if (!m.wardrobe || typeof m.wardrobe !== 'object') {
      m.wardrobe = {
        owned: [],
        acquiredAt: {},
        equipped: { hatId: null, mufflerId: null },
        lastDropYMD: null,
        nextIntervalDays: null,
      };
    }
    const w = m.wardrobe;
    if (!Array.isArray(w.owned)) w.owned = [];
    w.owned = w.owned.filter((id) => Boolean(ITEM_BY_ID[id]));
    if (!w.acquiredAt || typeof w.acquiredAt !== 'object') w.acquiredAt = {};
    if (!w.equipped || typeof w.equipped !== 'object') w.equipped = { hatId: null, mufflerId: null };
    if (w.equipped.hatId && !ITEM_BY_ID[w.equipped.hatId]) w.equipped.hatId = null;
    if (w.equipped.mufflerId && !ITEM_BY_ID[w.equipped.mufflerId]) w.equipped.mufflerId = null;
    return w;
  }

  function persistMember(member) {
    const m = getMember(member);
    if (!m) return;
    if (typeof currentMember !== 'undefined' && currentMember === m && typeof saveMember === 'function') {
      saveMember();
    } else if (typeof saveMemberRaw === 'function') {
      saveMemberRaw(m);
    }
  }

  function syncToPet(member = null) {
    const m = getMember(member);
    if (!m) return;
    const w = ensureState(m);
    const charId = String(m.birthdate || m.id || '');
    if (window.PET && typeof PET.setWardrobe === 'function' && (charId === '610708' || charId === '691105')) {
      PET.setWardrobe(charId, { ...w.equipped }, { push: true });
    }
  }

  function equipItem(itemId, member = null) {
    const m = getMember(member);
    const item = ITEM_BY_ID[itemId];
    if (!m || !item) return null;
    const w = ensureState(m);
    if (!w.owned.includes(itemId)) return null;
    if (item.cat === 'hat') w.equipped.hatId = item.id;
    else if (item.cat === 'muffler') w.equipped.mufflerId = item.id;
    persistMember(m);
    syncToPet(m);
    return { ...w.equipped };
  }

  function unequipSlot(cat, member = null) {
    const m = getMember(member);
    if (!m) return null;
    const w = ensureState(m);
    if (cat === 'hat') w.equipped.hatId = null;
    else if (cat === 'muffler') w.equipped.mufflerId = null;
    persistMember(m);
    syncToPet(m);
    return { ...w.equipped };
  }

  function isDropDue(member = null, todayYMD = getTodayLocalYMD()) {
    const m = getMember(member);
    if (!m) return false;
    const w = ensureState(m);
    const unowned = ALL_ITEMS.filter((it) => !w.owned.includes(it.id));
    if (!unowned.length) return false;
    if (!w.lastDropYMD) return true; // 첫 클리어 시 첫 선물 즉시 해금
    const elapsed = diffDaysYMD(w.lastDropYMD, todayYMD);
    const needed = w.nextIntervalDays === 4 ? 4 : 3;
    return elapsed >= needed;
  }

  // 코스 또는 두뇌측정 클리어 시 호출: 3~4일(랜덤)마다 1회 미보유 아이템 1종 해금
  function tryAwardClearDrop(opts = {}) {
    const m = getMember(opts.member);
    if (!m) return null;
    const w = ensureState(m);
    const todayYMD = opts.todayYMD || getTodayLocalYMD();
    const unowned = ALL_ITEMS.filter((it) => !w.owned.includes(it.id));
    if (!unowned.length) return null;

    if (!opts.force && !isDropDue(m, todayYMD)) {
      return null;
    }

    const picked = unowned[Math.floor(Math.random() * unowned.length)];
    w.owned.push(picked.id);
    w.acquiredAt[picked.id] = new Date().toISOString();
    w.lastDropYMD = todayYMD;
    w.nextIntervalDays = Math.random() < 0.5 ? 3 : 4;
    persistMember(m);

    return {
      item: picked,
      nextIntervalDays: w.nextIntervalDays,
      ownedCount: w.owned.length,
      totalCount: ALL_ITEMS.length,
    };
  }

  // ==========================================================
  // 3D Mii 캐릭터 헤드·목 앵커 및 모자/머플러 Vector 3D 렌더러
  // ==========================================================
  function getAnchorMetrics(charId, opts = {}) {
    const isFather = String(charId) === '610708';
    const pH = opts.pH || (isFather ? 226 : 216);
    const targetW = opts.targetW || pH * (isFather ? 0.44 : 0.43);
    const footY = Number.isFinite(opts.footY) ? opts.footY : 6;
    const isSide = Boolean(opts.isSideView);
    const outfit = opts.outfit || 'short';
    const armless = Boolean(opts.armless);
    const u = pH / 200;
    const topY = footY - pH;
    const headRatio = isFather ? 0.472 : 0.482;

    // 스프라이트별 실제 픽셀 중심 보정 (610708_short 정면은 왼손 검지로 인해 머리가 오른쪽 치우침)
    let headCx = 0;
    let neckCx = 0;
    if (isSide) {
      headCx = (isFather ? -0.038 : -0.022) * targetW;
      neckCx = (outfit === 'short' ? 0.032 : 0.018) * targetW;
    } else if (isFather && outfit === 'short' && !armless) {
      headCx = 0.064 * targetW;
      neckCx = 0.060 * targetW;
    }

    const headW = (isFather ? (isSide ? 0.37 : 0.345) : (isSide ? 0.405 : 0.388)) * pH;
    const brimY = topY + (isFather ? 0.146 : 0.156) * pH;
    const neckY = topY + headRatio * pH + 3 * u;
    const neckW = (isFather ? 0.165 : 0.155) * pH;

    return { headCx, neckCx, topY, brimY, neckY, headW, neckW, u, pH, isFather, isSide };
  }

  // ---- 모자 렌더링 (정면 / 우측면, ctx.scale(-1,1) 시 좌측면 자동 반전) ----
  function drawHat(ctx, itemOrId, opts = {}) {
    const item = typeof itemOrId === 'string' ? ITEM_BY_ID[itemOrId] : itemOrId;
    if (!item || item.cat !== 'hat') return { crownOffsetY: 0 };

    const m = opts.metrics || getAnchorMetrics(opts.charId || '610708', opts);
    const { headCx, brimY, headW, isSide } = m;
    const hw = headW * 0.54 * (opts.scale || 1);
    const sc = opts.scale || 1;
    const c = item.colors || {};
    const domeH = hw * (
      item.type === 'fedora' || item.type === 'panama' || item.type === 'safari' ? 0.92 :
      item.type === 'watch_beanie' || item.type === 'flatcap' ? 0.68 :
      item.type === 'pom_beanie' || item.type === 'stripe_beanie' ? 0.88 :
      item.type === 'ushanka' ? 0.86 : 0.78
    );

    ctx.save();
    ctx.translate(headCx, brimY);
    if (opts.tilt) ctx.rotate(opts.tilt);

    const fillGrad = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, c.light || c.main);
      g.addColorStop(0.55, c.main);
      g.addColorStop(1, c.dark || c.main);
      return g;
    };

    const type = item.type;

    if (type === 'beanie' || type === 'pom_beanie' || type === 'watch_beanie' || type === 'stripe_beanie') {
      // 니트 비니 돔
      ctx.fillStyle = fillGrad(-hw * 0.6, -domeH, hw * 0.8, 0);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.98, -2 * sc);
      ctx.quadraticCurveTo(-hw * 1.02, -domeH * 0.95, 0, -domeH);
      ctx.quadraticCurveTo(hw * 1.02, -domeH * 0.95, hw * 0.98, -2 * sc);
      ctx.closePath();
      ctx.fill();

      // 줄무늬 패턴
      if (type === 'stripe_beanie' && c.stripe) {
        ctx.save();
        ctx.clip();
        ctx.fillStyle = c.stripe;
        ctx.fillRect(-hw * 1.1, -domeH * 0.64, hw * 2.2, domeH * 0.16);
        ctx.fillRect(-hw * 1.1, -domeH * 0.36, hw * 2.2, domeH * 0.13);
        ctx.restore();
      }

      // 세로 골지 니트 스티치
      ctx.strokeStyle = 'rgba(255,255,255,0.20)';
      ctx.lineWidth = Math.max(1.1, 1.5 * sc);
      for (let rx = -0.68; rx <= 0.68; rx += 0.22) {
        ctx.beginPath();
        ctx.moveTo(hw * rx, -3 * sc);
        ctx.quadraticCurveTo(hw * rx * 0.82, -domeH * 0.56, hw * rx * 0.24, -domeH * 0.94);
        ctx.stroke();
      }

      // 접힌 커프 밴드
      const cuffH = type === 'watch_beanie' ? 14 * sc : 11 * sc;
      ctx.fillStyle = fillGrad(-hw, -cuffH, hw, 4);
      ctx.strokeStyle = c.dark || '#1E293B';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.roundRect(-hw * 1.03, -cuffH * 0.72, hw * 2.06, cuffH, 6 * sc);
      ctx.fill();
      ctx.stroke();

      // 커프 세로 골지
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 1.2 * sc;
      for (let lx = -0.82; lx <= 0.82; lx += 0.18) {
        ctx.beginPath();
        ctx.moveTo(hw * lx, -cuffH * 0.65);
        ctx.lineTo(hw * lx, cuffH * 0.2);
        ctx.stroke();
      }

      // 폼폼 방울
      if (type === 'pom_beanie' || type === 'stripe_beanie') {
        const py = -domeH - 6 * sc;
        ctx.fillStyle = c.accent || '#FEF3C7';
        ctx.strokeStyle = 'rgba(0,0,0,0.16)';
        ctx.lineWidth = 1.2 * sc;
        const pomR = 8.5 * sc;
        for (let a = 0; a < 8; a++) {
          const ang = (a / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(Math.cos(ang) * pomR * 0.36, py + Math.sin(ang) * pomR * 0.36, pomR * 0.65, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.beginPath();
        ctx.arc(0, py, pomR * 0.78, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
    } else if (type === 'cap' || type === 'trucker_cap' || type === 'snapback') {
      // 크라운 돔
      const cFill = fillGrad(-hw * 0.6, -domeH, hw * 0.8, 0);
      ctx.fillStyle = cFill;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.98, 0);
      ctx.quadraticCurveTo(-hw * 0.96, -domeH, 0, -domeH * 1.04);
      ctx.quadraticCurveTo(hw * 0.96, -domeH, hw * 0.98, 0);
      ctx.closePath();
      ctx.fill();

      // 트러커캡 옆면 배색 + 메쉬 감성
      if (type === 'trucker_cap') {
        ctx.fillStyle = c.side || '#0284C7';
        if (isSide) {
          ctx.beginPath();
          ctx.moveTo(-hw * 0.98, 0);
          ctx.quadraticCurveTo(-hw * 0.95, -domeH * 0.95, -hw * 0.08, -domeH * 1.02);
          ctx.lineTo(-hw * 0.08, 0);
          ctx.closePath();
          ctx.fill();
        } else {
          ctx.beginPath();
          ctx.moveTo(-hw * 0.98, 0);
          ctx.quadraticCurveTo(-hw * 0.96, -domeH * 0.7, -hw * 0.48, -domeH * 0.84);
          ctx.lineTo(-hw * 0.56, 0);
          ctx.closePath();
          ctx.fill();
          ctx.beginPath();
          ctx.moveTo(hw * 0.98, 0);
          ctx.quadraticCurveTo(hw * 0.96, -domeH * 0.7, hw * 0.48, -domeH * 0.84);
          ctx.lineTo(hw * 0.56, 0);
          ctx.closePath();
          ctx.fill();
        }
      }

      // 6패널 봉제선 & 탑 버튼
      ctx.strokeStyle = 'rgba(255,255,255,0.22)';
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.36, 0);
      ctx.quadraticCurveTo(-hw * 0.25, -domeH * 0.7, 0, -domeH);
      ctx.moveTo(hw * 0.36, 0);
      ctx.quadraticCurveTo(hw * 0.25, -domeH * 0.7, 0, -domeH);
      ctx.stroke();

      ctx.fillStyle = c.accent || '#FFFFFF';
      ctx.beginPath();
      ctx.arc(0, -domeH - 1 * sc, 2.2 * sc, 0, Math.PI * 2);
      ctx.fill();

      // 정면 엠블럼/패치 (은은한 자수 로고 감성)
      const patchX = isSide ? hw * 0.48 : 0;
      ctx.fillStyle = c.accent || '#FBBF24';
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 0.9 * sc;
      if (type === 'snapback') {
        ctx.beginPath();
        ctx.roundRect(patchX - 6.2 * sc, -domeH * 0.56, 12.4 * sc, 6.2 * sc, 2 * sc);
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.beginPath();
        ctx.roundRect(patchX - 4.2 * sc, -domeH * 0.54, 8.4 * sc, 5.4 * sc, 2.4 * sc);
        ctx.fill();
        ctx.stroke();
      }

      // 챙(바이저): 측면이면 오른쪽(+X)으로 뻗음, 정면이면 앞쪽 곡선/일자 챙
      ctx.fillStyle = c.brim || c.dark;
      ctx.strokeStyle = 'rgba(0,0,0,0.24)';
      ctx.lineWidth = 1.2 * sc;
      if (isSide) {
        ctx.beginPath();
        if (type === 'snapback') {
          ctx.moveTo(-hw * 0.2, 0);
          ctx.lineTo(hw * 1.56, 2 * sc);
          ctx.lineTo(hw * 1.50, 7 * sc);
          ctx.lineTo(0, 6 * sc);
        } else {
          ctx.moveTo(-hw * 0.2, -1 * sc);
          ctx.quadraticCurveTo(hw * 0.9, -2 * sc, hw * 1.52, 8 * sc);
          ctx.quadraticCurveTo(hw * 0.85, 11 * sc, -hw * 0.05, 4 * sc);
        }
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        if (c.underBrim) {
          ctx.fillStyle = c.underBrim;
          ctx.fillRect(hw * 0.3, 4 * sc, hw * 1.05, 2.5 * sc);
        }
      } else {
        ctx.beginPath();
        if (type === 'snapback') {
          ctx.roundRect(-hw * 1.08, -2 * sc, hw * 2.16, 11 * sc, 4 * sc);
        } else {
          ctx.moveTo(-hw * 1.06, -1 * sc);
          ctx.quadraticCurveTo(0, -10 * sc, hw * 1.06, -1 * sc);
          ctx.quadraticCurveTo(hw * 0.95, 13 * sc, 0, 12 * sc);
          ctx.quadraticCurveTo(-hw * 0.95, 13 * sc, -hw * 1.06, -1 * sc);
        }
        ctx.fill();
        ctx.stroke();
        // 챙 하이라이트 곡선
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 1.2 * sc;
        ctx.beginPath();
        ctx.moveTo(-hw * 0.8, 4 * sc);
        ctx.quadraticCurveTo(0, 8 * sc, hw * 0.8, 4 * sc);
        ctx.stroke();
      }
    } else if (type === 'newsboy' || type === 'flatcap') {
      // 헌팅캡 / 플랫캡 (유선형 앞으로 쏠린 실루엣)
      ctx.fillStyle = fillGrad(-hw, -domeH, hw, 4);
      ctx.beginPath();
      if (isSide) {
        ctx.moveTo(-hw * 1.02, -2 * sc);
        ctx.quadraticCurveTo(-hw * 0.6, -domeH * 1.05, hw * 0.45, -domeH * 0.85);
        ctx.quadraticCurveTo(hw * 1.2, -domeH * 0.45, hw * 1.15, 2 * sc);
        ctx.lineTo(-hw * 0.9, 4 * sc);
      } else {
        ctx.moveTo(-hw * 1.12, -3 * sc);
        ctx.quadraticCurveTo(-hw * 1.05, -domeH * 1.05, 0, -domeH * 0.96);
        ctx.quadraticCurveTo(hw * 1.05, -domeH * 1.05, hw * 1.12, -3 * sc);
        ctx.quadraticCurveTo(0, 6 * sc, -hw * 1.12, -3 * sc);
      }
      ctx.closePath();
      ctx.fill();

      // 패널 라인 (헌팅캡)
      if (type === 'newsboy') {
        ctx.strokeStyle = 'rgba(0,0,0,0.24)';
        ctx.lineWidth = 1.1 * sc;
        [-0.45, 0, 0.45].forEach((r) => {
          ctx.beginPath();
          ctx.moveTo(hw * r, 0);
          ctx.quadraticCurveTo(hw * r * 0.6, -domeH * 0.6, 0, -domeH * 0.92);
          ctx.stroke();
        });
        ctx.fillStyle = c.accent || '#D97706';
        ctx.beginPath();
        ctx.arc(0, -domeH * 0.95, 2.8 * sc, 0, Math.PI * 2);
        ctx.fill();
      }

      // 짧은 바이저
      ctx.fillStyle = c.brim || c.dark;
      ctx.beginPath();
      if (isSide) {
        ctx.moveTo(hw * 0.1, -1 * sc);
        ctx.quadraticCurveTo(hw * 1.0, 0, hw * 1.38, 6 * sc);
        ctx.quadraticCurveTo(hw * 0.8, 9 * sc, hw * 0.05, 4 * sc);
      } else {
        ctx.ellipse(0, 3.5 * sc, hw * 0.86, 6.5 * sc, 0, 0, Math.PI);
      }
      ctx.fill();
    } else if (type === 'beret') {
      // 비스듬히 얹은 파리지앵 베레모
      ctx.save();
      ctx.rotate(isSide ? -0.10 : -0.13);
      ctx.fillStyle = fillGrad(-hw, -domeH, hw, 4);
      ctx.beginPath();
      ctx.ellipse(hw * (isSide ? -0.05 : 0.06), -domeH * 0.46, hw * 1.24, domeH * 0.56, 0, 0, Math.PI * 2);
      ctx.fill();

      // 아래 어두운 스웨트밴드 테두리
      ctx.fillStyle = c.band || c.dark;
      ctx.beginPath();
      ctx.roundRect(-hw * 0.96, -5 * sc, hw * 1.92, 7.5 * sc, 4 * sc);
      ctx.fill();

      // 위쪽 꼬다리 꼭지
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 2.6 * sc;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(hw * 0.04, -domeH * 0.96);
      ctx.lineTo(hw * 0.08, -domeH * 1.12);
      ctx.stroke();

      // 꽃 브로치
      if (c.flower) {
        const fx = hw * (isSide ? 0.45 : 0.58), fy = -domeH * 0.45;
        ctx.fillStyle = c.flower;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 3.8 * sc, fy + Math.sin(a) * 3.8 * sc, 3 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    } else if (type === 'bucket') {
      // 버킷햇 (위쪽이 좁아지는 사다리꼴 크라운 + 햇빛 가리는 부드러운 처진 챙)
      ctx.fillStyle = fillGrad(-hw, -domeH, hw, 0);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.94, 0);
      ctx.lineTo(-hw * 0.72, -domeH * 0.84);
      ctx.quadraticCurveTo(0, -domeH * 0.98, hw * 0.72, -domeH * 0.84);
      ctx.lineTo(hw * 0.94, 0);
      ctx.closePath();
      ctx.fill();

      if (c.cord) {
        ctx.strokeStyle = 'rgba(180,120,40,0.30)';
        ctx.lineWidth = 1.2 * sc;
        for (let rx = -0.68; rx <= 0.68; rx += 0.16) {
          ctx.beginPath();
          ctx.moveTo(hw * rx, 0);
          ctx.lineTo(hw * rx * 0.78, -domeH * 0.84);
          ctx.stroke();
        }
      }

      // 띠 밴드 스티치
      ctx.fillStyle = c.band || c.dark;
      ctx.fillRect(-hw * 0.93, -6.5 * sc, hw * 1.86, 5.5 * sc);

      // 처진 원형 챙 (눈썹 위까지만 내려와 얼굴을 가리지 않음)
      ctx.fillStyle = fillGrad(-hw * 1.2, -1, hw * 1.2, 8);
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 1.15 * sc;
      ctx.beginPath();
      ctx.moveTo(-hw * 0.94, -1 * sc);
      ctx.lineTo(-hw * 1.24, 5.5 * sc);
      ctx.quadraticCurveTo(0, 10.5 * sc, hw * 1.24, 5.5 * sc);
      ctx.lineTo(hw * 0.94, -1 * sc);
      ctx.quadraticCurveTo(0, 2.5 * sc, -hw * 0.94, -1 * sc);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    } else if (type === 'fedora' || type === 'panama' || type === 'sunhat' || type === 'safari') {
      const brimW = type === 'sunhat' ? hw * 1.62 : (type === 'safari' || type === 'panama' ? hw * 1.44 : hw * 1.38);

      // 크라운 본체 (윗부분 살짝 핀치 곡선)
      ctx.fillStyle = fillGrad(-hw, -domeH, hw, 0);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.90, -2 * sc);
      ctx.lineTo(-hw * 0.72, -domeH * 0.92);
      ctx.quadraticCurveTo(-hw * 0.35, -domeH * 1.05, 0, -domeH * 0.88);
      ctx.quadraticCurveTo(hw * 0.35, -domeH * 1.05, hw * 0.72, -domeH * 0.92);
      ctx.lineTo(hw * 0.90, -2 * sc);
      ctx.closePath();
      ctx.fill();

      // 밀짚 결 가로줄 (파나마 / 선햇)
      if (type === 'panama' || type === 'sunhat') {
        ctx.strokeStyle = 'rgba(180,110,20,0.22)';
        ctx.lineWidth = 1 * sc;
        for (let wy = -domeH * 0.75; wy < -6 * sc; wy += 4.5 * sc) {
          ctx.beginPath();
          ctx.moveTo(-hw * 0.74, wy);
          ctx.lineTo(hw * 0.74, wy);
          ctx.stroke();
        }
      }

      // 리본 / 가죽 밴드
      ctx.fillStyle = c.band || '#29150B';
      ctx.fillRect(-hw * 0.90, -10 * sc, hw * 1.80, 8 * sc);

      // 넓은 챙
      ctx.fillStyle = fillGrad(-brimW, -4, brimW, 10);
      ctx.strokeStyle = c.dark;
      ctx.lineWidth = 1.2 * sc;
      ctx.beginPath();
      ctx.ellipse(0, 1.5 * sc, brimW, (type === 'sunhat' ? 11 : 7.5) * sc, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();

      // 선햇 꽃 장식
      if (type === 'sunhat' && c.flower) {
        const fx = hw * (isSide ? 0.5 : 0.68), fy = -7 * sc;
        ctx.fillStyle = c.flower;
        for (let k = 0; k < 5; k++) {
          const a = (k / 5) * Math.PI * 2;
          ctx.beginPath();
          ctx.arc(fx + Math.cos(a) * 4 * sc, fy + Math.sin(a) * 4 * sc, 3.2 * sc, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.fillStyle = '#FACC15';
        ctx.beginPath();
        ctx.arc(fx, fy, 2.2 * sc, 0, Math.PI * 2);
        ctx.fill();
      }
      // 사파리 금빛 버클 핀
      if (type === 'safari') {
        ctx.fillStyle = c.accent || '#D97706';
        ctx.beginPath();
        ctx.roundRect(hw * 0.35, -9 * sc, 8 * sc, 6 * sc, 2 * sc);
        ctx.fill();
      }
    } else if (type === 'ushanka') {
      // 겨울 털귀달이 방한모
      ctx.fillStyle = fillGrad(-hw, -domeH, hw, 0);
      ctx.beginPath();
      ctx.moveTo(-hw * 0.98, 0);
      ctx.quadraticCurveTo(-hw * 0.98, -domeH * 1.04, 0, -domeH * 1.06);
      ctx.quadraticCurveTo(hw * 0.98, -domeH * 1.04, hw * 0.98, 0);
      ctx.closePath();
      ctx.fill();

      // 양옆 복슬복슬 털 귀달이
      ctx.fillStyle = c.fur || '#FFFBEB';
      ctx.strokeStyle = c.furShade || '#CBD5E1';
      ctx.lineWidth = 1.4 * sc;
      if (isSide) {
        ctx.beginPath();
        ctx.roundRect(-hw * 0.45, -2 * sc, hw * 0.64, 24 * sc, 10 * sc);
        ctx.fill();
        ctx.stroke();
      } else {
        [-1, 1].forEach((dir) => {
          ctx.beginPath();
          ctx.roundRect(dir * hw * 0.72 - (dir < 0 ? 14 * sc : 0), -2 * sc, 15 * sc, 24 * sc, 8 * sc);
          ctx.fill();
          ctx.stroke();
        });
      }

      // 이마 앞 폭신 털 밴드
      ctx.fillStyle = c.fur || '#FFFBEB';
      ctx.beginPath();
      ctx.roundRect(-hw * 0.94, -18 * sc, hw * 1.88, 20 * sc, 8 * sc);
      ctx.fill();
      ctx.stroke();

      // 작은 금빛 배지
      ctx.fillStyle = c.accent || '#F59E0B';
      ctx.beginPath();
      ctx.arc(isSide ? hw * 0.4 : 0, -8 * sc, 3.5 * sc, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
    return { crownOffsetY: (item.crownOffsetY || 16) * sc };
  }

  // ---- 머플러 렌더링 (소재별 질감 · 크기별 두께 · 길이별 꼬리길이 · 색깔별) ----
  function drawMuffler(ctx, itemOrId, opts = {}) {
    const item = typeof itemOrId === 'string' ? ITEM_BY_ID[itemOrId] : itemOrId;
    if (!item || item.cat !== 'muffler') return;

    const m = opts.metrics || getAnchorMetrics(opts.charId || '610708', opts);
    const { neckCx, neckY, neckW, u, isSide } = m;
    const t = opts.t || 0;
    const sc = opts.scale || 1;
    const c = item.colors || {};

    // 크기(size): 목둘레 링 두께 및 앞자락 너비 반영
    const sizeScale = item.size === 'oversize' ? 1.28 : item.size === 'slim' ? 0.78 : 1.0;
    // 길이(length): 늘어뜨린 꼬리 길이 반영
    const lenPx = (item.length === 'long' ? 54 : item.length === 'short' ? 17 : 34) * u * sc;

    const ringW = Math.max(neckW * 1.22, 34 * u * sc) * (isSide ? 0.92 : 1.0);
    const ringH = 14.5 * u * sc * sizeScale;
    const tailW = 14 * u * sc * sizeScale;
    const sway = Math.sin(t * 2.1 + (m.isFather ? 0 : 1.1)) * (item.length === 'long' ? 3.5 : 1.8) * sc;

    ctx.save();
    ctx.translate(neckCx, neckY);

    const makeBodyGrad = (x0, y0, x1, y1) => {
      const g = ctx.createLinearGradient(x0, y0, x1, y1);
      g.addColorStop(0, c.light || c.main);
      g.addColorStop(0.55, c.main);
      g.addColorStop(1, c.dark || c.main);
      return g;
    };

    const drawPatternAndTexture = (rx, ry, rw, rh) => {
      ctx.save();
      ctx.beginPath();
      ctx.roundRect(rx, ry, rw, rh, 4 * sc);
      ctx.clip();

      // 색상/패턴
      if (item.pattern === 'check') {
        ctx.strokeStyle = c.accent || 'rgba(0,0,0,0.28)';
        ctx.lineWidth = Math.max(1.2, 1.8 * sc);
        for (let x = rx - rh; x < rx + rw + rh; x += 8 * sc) {
          ctx.beginPath();
          ctx.moveTo(x, ry);
          ctx.lineTo(x + rh * 0.5, ry + rh);
          ctx.stroke();
        }
        ctx.strokeStyle = c.stripe || 'rgba(255,255,255,0.4)';
        ctx.lineWidth = Math.max(1, 1.3 * sc);
        for (let y = ry + 4 * sc; y < ry + rh; y += 7 * sc) {
          ctx.beginPath();
          ctx.moveTo(rx, y);
          ctx.lineTo(rx + rw, y);
          ctx.stroke();
        }
      } else if (item.pattern === 'stripe') {
        ctx.fillStyle = c.stripe || '#FFFFFF';
        for (let y = ry + 5 * sc; y < ry + rh - 2 * sc; y += 9 * sc) {
          ctx.fillRect(rx, y, rw, 3.2 * sc);
        }
      } else if (item.pattern === 'border') {
        ctx.strokeStyle = c.accent || '#FACC15';
        ctx.lineWidth = Math.max(1.2, 2.0 * sc);
        ctx.strokeRect(rx + 2 * sc, ry + 2 * sc, Math.max(1, rw - 4 * sc), Math.max(1, rh - 4 * sc));
      }

      // 소재(material)별 텍스처
      if (item.material === 'knit') {
        ctx.strokeStyle = 'rgba(255,255,255,0.26)';
        ctx.lineWidth = 1.2 * sc;
        for (let y = ry + 4 * sc; y < ry + rh; y += 6 * sc) {
          ctx.beginPath();
          ctx.moveTo(rx + 2 * sc, y);
          ctx.lineTo(rx + rw * 0.5, y + 3 * sc);
          ctx.lineTo(rx + rw - 2 * sc, y);
          ctx.stroke();
        }
      } else if (item.material === 'linen') {
        ctx.strokeStyle = 'rgba(255,255,255,0.22)';
        ctx.lineWidth = 0.9 * sc;
        for (let x = rx + 3 * sc; x < rx + rw; x += 4.5 * sc) {
          ctx.beginPath(); ctx.moveTo(x, ry); ctx.lineTo(x, ry + rh); ctx.stroke();
        }
      } else if (item.material === 'silk') {
        const sg = ctx.createLinearGradient(rx, ry, rx + rw, ry + rh);
        sg.addColorStop(0, 'rgba(255,255,255,0)');
        sg.addColorStop(0.45, 'rgba(255,255,255,0.34)');
        sg.addColorStop(1, 'rgba(255,255,255,0)');
        ctx.fillStyle = sg;
        ctx.fillRect(rx, ry, rw, rh);
      } else if (item.material === 'cashmere') {
        const cg = ctx.createLinearGradient(rx, ry, rx, ry + rh);
        cg.addColorStop(0, 'rgba(255,255,255,0.16)');
        cg.addColorStop(1, 'rgba(0,0,0,0.08)');
        ctx.fillStyle = cg;
        ctx.fillRect(rx, ry, rw, rh);
      }
      ctx.restore();
    };

    // 1) 아래로 내려오는 머플러 꼬리 자락 (short = 쁘띠 매듭, medium = 앞자락 1줄, long = 긴 이중 롱자락!)
    const tailAnchorX = isSide ? ringW * 0.12 : 4 * u * sc;
    if (item.length === 'short') {
      if (item.material === 'silk') {
        // 쁘띠 실크 리본 두 갈래
        [-1, 1].forEach((dir) => {
          ctx.save();
          ctx.translate(tailAnchorX, ringH * 0.3);
          ctx.rotate(dir * 0.42 + sway * 0.02);
          ctx.fillStyle = makeBodyGrad(-tailW * 0.4, 0, tailW * 0.4, lenPx);
          ctx.beginPath();
          ctx.moveTo(-tailW * 0.36, 0);
          ctx.lineTo(tailW * 0.48, lenPx);
          ctx.lineTo(0, lenPx * 0.86);
          ctx.lineTo(-tailW * 0.48, lenPx);
          ctx.closePath();
          ctx.fill();
          ctx.restore();
        });
      } else {
        // 짧은 쁘띠 자락 1줄
        ctx.save();
        ctx.translate(tailAnchorX, ringH * 0.28);
        ctx.rotate(sway * 0.02);
        ctx.fillStyle = makeBodyGrad(-tailW * 0.5, 0, tailW * 0.5, lenPx);
        ctx.beginPath();
        ctx.roundRect(-tailW * 0.52, 0, tailW * 1.04, lenPx, 5 * sc);
        ctx.fill();
        drawPatternAndTexture(-tailW * 0.52, 0, tailW * 1.04, lenPx);
        ctx.restore();
      }
    } else {
      // medium or long: 메인 자락 + (long일 경우 뒤쪽 한 줄 추가!)
      if (item.length === 'long') {
        ctx.save();
        ctx.translate(tailAnchorX - tailW * 0.65, ringH * 0.28);
        ctx.rotate(-0.10 + sway * 0.022);
        const backLen = lenPx * 0.78;
        ctx.fillStyle = c.dark || c.main;
        ctx.beginPath();
        ctx.roundRect(-tailW * 0.44, 0, tailW * 0.88, backLen, 4 * sc);
        ctx.fill();
        drawPatternAndTexture(-tailW * 0.44, 0, tailW * 0.88, backLen);
        ctx.restore();
      }

      ctx.save();
      ctx.translate(tailAnchorX, ringH * 0.26);
      ctx.rotate((isSide ? 0.14 : 0.08) + sway * 0.025);
      ctx.shadowColor = 'rgba(15,23,42,0.18)';
      ctx.shadowBlur = 4 * sc;
      ctx.fillStyle = makeBodyGrad(-tailW * 0.5, 0, tailW * 0.5, lenPx);
      ctx.beginPath();
      ctx.roundRect(-tailW * 0.5, 0, tailW, lenPx, 5 * sc);
      ctx.fill();
      ctx.shadowBlur = 0;
      drawPatternAndTexture(-tailW * 0.5, 0, tailW, lenPx);

      // 끝단 수술(프린지) — 캐시미어/울 니트/린넨
      if (item.material === 'cashmere' || item.material === 'knit' || item.material === 'linen') {
        const fCount = item.size === 'oversize' ? 6 : 4;
        const fLen = (item.material === 'cashmere' ? 6.5 : 5) * sc;
        ctx.strokeStyle = c.fringe || c.accent || '#FFFBEB';
        ctx.lineWidth = (item.material === 'knit' ? 2.1 : 1.4) * sc;
        ctx.lineCap = 'round';
        for (let i = 0; i < fCount; i++) {
          const fx = -tailW * 0.36 + (tailW * 0.72 * i) / Math.max(1, fCount - 1);
          ctx.beginPath();
          ctx.moveTo(fx, lenPx - 1);
          ctx.lineTo(fx, lenPx + fLen);
          ctx.stroke();
        }
      }
      ctx.restore();
    }

    // 2) 목을 포근히 감싸는 넥 링 본체
    const rLeft = -ringW * 0.54;
    const rTop = -ringH * 0.46;
    ctx.shadowColor = 'rgba(15,23,42,0.2)';
    ctx.shadowBlur = 5 * sc;
    ctx.fillStyle = makeBodyGrad(rLeft, rTop, rLeft + ringW * 1.08, rTop + ringH);
    ctx.beginPath();
    ctx.roundRect(rLeft, rTop, ringW * 1.08, ringH, ringH * 0.48);
    ctx.fill();
    ctx.shadowBlur = 0;

    drawPatternAndTexture(rLeft, rTop, ringW * 1.08, ringH);

    // 양털 플리스(fleece): 가장자리 몽글몽글 구름 테두리
    if (item.material === 'fleece') {
      ctx.fillStyle = c.main;
      const bumps = 6;
      for (let b = 0; b <= bumps; b++) {
        const bx = rLeft + 5 * sc + ((ringW * 1.08 - 10 * sc) * b) / bumps;
        ctx.beginPath();
        ctx.arc(bx, rTop + ringH * 0.85, 4.2 * sc * sizeScale, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // 앞쪽 겹침 매듭 포인트
    ctx.fillStyle = c.dark || c.main;
    ctx.strokeStyle = 'rgba(255,255,255,0.22)';
    ctx.lineWidth = 1.1 * sc;
    ctx.beginPath();
    ctx.roundRect(tailAnchorX - tailW * 0.55, rTop + 1 * sc, tailW * 1.12, ringH * 0.92, 6 * sc);
    ctx.fill();
    ctx.stroke();

    ctx.restore();
  }

  // ==========================================================
  // 인벤토리 & 축하 팝업용 단독 아이템 아이콘 / 미니 아바타 미리보기 렌더러
  // ==========================================================
  function renderItemIconCanvas(canvas, itemOrId) {
    const item = typeof itemOrId === 'string' ? ITEM_BY_ID[itemOrId] : itemOrId;
    if (!canvas || !item) return;
    const w = canvas.width;
    const h = canvas.height;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, w, h);

    if (item.cat === 'hat') {
      drawHat(ctx, item, {
        scale: w / 92,
        metrics: {
          headCx: w * 0.5,
          brimY: h * 0.68,
          headW: 54,
          isSide: false,
          u: 0.72,
        },
      });
    } else {
      drawMuffler(ctx, item, {
        scale: w / 96,
        t: 0.6,
        metrics: {
          neckCx: w * 0.5,
          neckY: h * 0.30,
          neckW: 44,
          u: 0.72,
          isSide: false,
          isFather: false,
        },
      });
    }
  }

  const previewSprites = {};
  function getPreviewSprite(charId, outfit = 'short') {
    const key = `${charId}_${outfit}_front`;
    if (previewSprites[key]) return previewSprites[key];
    const file = outfit === 'short' ? `char_${charId}.png?v=5` : `char_${charId}_${outfit}.png?v=5`;
    const img = new Image();
    img.src = `assets/pet/${file}`;
    previewSprites[key] = img;
    return img;
  }

  function renderAvatarTryOnCanvas(canvas, charId, equipped, opts = {}) {
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const W = canvas.width;
    const H = canvas.height;
    ctx.clearRect(0, 0, W, H);

    const id = String(charId) === '691105' ? '691105' : '610708';
    const outfit = opts.outfit || 'short';
    const img = getPreviewSprite(id, outfit);
    const t = opts.t || 0;

    // 무대 배경 빛원
    const bgGrad = ctx.createRadialGradient(W * 0.5, H * 0.45, 10, W * 0.5, H * 0.5, W * 0.6);
    bgGrad.addColorStop(0, 'rgba(254, 240, 138, 0.45)');
    bgGrad.addColorStop(0.65, 'rgba(186, 230, 253, 0.25)');
    bgGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, W, H);

    const drawFrame = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, W, H);

      // 바닥 그림자
      ctx.fillStyle = 'rgba(15, 23, 42, 0.16)';
      ctx.beginPath();
      ctx.ellipse(W * 0.5, H * 0.90, W * 0.26, 7, 0, 0, Math.PI * 2);
      ctx.fill();

      if (!img.complete || !img.naturalWidth) return;

      const pH = H * 0.72;
      const targetW = (img.naturalWidth / img.naturalHeight) * pH;
      const groundY = H * 0.90;
      const bob = Math.sin(t * 2.4) * 2.2;

      ctx.save();
      ctx.translate(W * 0.5, groundY + bob);
      ctx.drawImage(img, -targetW / 2, -pH + 5, targetW, pH);

      const metrics = getAnchorMetrics(id, { pH, targetW, footY: 5, outfit, isSideView: false });
      if (equipped && equipped.mufflerId) {
        drawMuffler(ctx, equipped.mufflerId, { metrics, t });
      }
      if (equipped && equipped.hatId) {
        drawHat(ctx, equipped.hatId, { metrics, t });
      }
      ctx.restore();
    };

    drawFrame();
    if (!img.complete) {
      img.addEventListener('load', drawFrame, { once: true });
    }
  }

  // ==========================================================
  // 스타일 & 공용 배지 헬퍼
  // ==========================================================
  function injectStyle() {
    if (document.getElementById('wardrobeStyle')) return;
    const st = document.createElement('style');
    st.id = 'wardrobeStyle';
    st.textContent = `
      @keyframes wrBurstSpin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
      @keyframes wrCardPop{0%{opacity:0;transform:scale(.78) translateY(20px);}65%{transform:scale(1.03) translateY(-3px);}100%{opacity:1;transform:scale(1) translateY(0);}}
      @keyframes wrSparkFloat{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-6px) scale(1.16);}}
      .wr-celeb-ov{position:fixed;inset:0;background:radial-gradient(circle at 50% 35%,rgba(255,215,90,.28),rgba(15,23,42,.86) 70%);backdrop-filter:blur(6px);z-index:120;display:flex;align-items:center;justify-content:center;padding:16px;overflow-y:auto;}
      .wr-celeb-modal{position:relative;background:linear-gradient(180deg,#FFFDF7 0%,#FFF8E7 100%);border:3px solid #FBBF24;border-radius:28px;max-width:440px;width:100%;padding:22px 18px 20px;text-align:center;box-shadow:0 22px 60px rgba(0,0,0,.45);animation:wrCardPop .5s cubic-bezier(.34,1.56,.64,1) both;max-height:92vh;overflow-y:auto;}
      .wr-celeb-banner{display:inline-flex;align-items:center;gap:6px;background:linear-gradient(135deg,#F59E0B,#EF4444);color:#FFF;font-family:'Jua';font-size:16px;padding:6px 16px;border-radius:999px;box-shadow:0 4px 12px rgba(239,68,68,.35);margin-bottom:8px;}
      .wr-stage-wrap{position:relative;margin:8px auto 10px;width:210px;height:210px;border-radius:24px;background:linear-gradient(180deg,#E0F2FE 0%,#FEF3C7 100%);border:2.5px solid #FDE68A;display:flex;align-items:center;justify-content:center;overflow:hidden;box-shadow:inset 0 0 24px rgba(251,191,36,.35);}
      .wr-sunburst{position:absolute;inset:-40px;background:repeating-conic-gradient(from 0deg,rgba(255,255,255,.35) 0deg 15deg,rgba(255,255,255,0) 15deg 30deg);animation:wrBurstSpin 16s linear infinite;pointer-events:none;}
      .wr-tags{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:8px 0 10px;}
      .wr-tag{background:#FFF;border:1.5px solid #E2E8F0;border-radius:999px;padding:4px 10px;font-size:12.5px;font-weight:700;color:#334155;}
      .wr-tag.rare{background:#FEF3C7;border-color:#F59E0B;color:#92400E;}
      .wr-tag.spec{background:#EEF2FF;border-color:#C7D2FE;color:#3730A3;}
      .wr-btn-split{display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-top:14px;}
      .wr-btn-wear{background:linear-gradient(135deg,#2563EB,#3B82F6);color:#FFF;border:none;border-radius:18px;padding:15px 10px;font-family:'Jua';font-size:19px;cursor:pointer;box-shadow:0 5px 0 #1D4ED8;display:flex;flex-direction:column;align-items:center;gap:2px;}
      .wr-btn-wear:active{transform:translateY(3px);box-shadow:0 2px 0 #1D4ED8;}
      .wr-btn-skip{background:#F1F5F9;color:#334155;border:2px solid #CBD5E1;border-radius:18px;padding:15px 10px;font-family:'Jua';font-size:19px;cursor:pointer;box-shadow:0 5px 0 #CBD5E1;display:flex;flex-direction:column;align-items:center;gap:2px;}
      .wr-btn-skip:active{transform:translateY(3px);box-shadow:0 2px 0 #CBD5E1;}
      .wr-btn-sub{font-family:sans-serif;font-size:11.5px;font-weight:700;opacity:.88;}
      .wr-done-toast{margin-top:12px;padding:10px 14px;border-radius:14px;background:#ECFDF5;border:2px solid #10B981;color:#065F46;font-family:'Jua';font-size:18px;animation:wrCardPop .3s ease both;}

      /* 개인 인벤토리 (내 옷장) 모달 */
      .wr-inv-ov{position:fixed;inset:0;background:rgba(15,23,42,.62);backdrop-filter:blur(4px);z-index:110;display:flex;align-items:center;justify-content:center;padding:12px;}
      .wr-inv-modal{background:#FFF;border-radius:24px;max-width:480px;width:100%;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 20px 50px rgba(0,0,0,.35);}
      .wr-inv-head{display:flex;align-items:center;justify-content:space-between;padding:14px 16px;background:linear-gradient(135deg,#FFF7ED,#FEF3C7);border-bottom:1.5px solid #FDE68A;}
      .wr-inv-body{padding:14px;overflow-y:auto;flex:1;}
      .wr-mirror-card{display:flex;gap:12px;align-items:center;background:#F8FAFC;border:2px solid #E2E8F0;border-radius:18px;padding:10px 12px;margin-bottom:12px;}
      .wr-slots{flex:1;display:flex;flex-direction:column;gap:8px;min-width:0;}
      .wr-slot-row{background:#FFF;border:1.5px solid #E2E8F0;border-radius:12px;padding:7px 9px;display:flex;align-items:center;justify-content:space-between;gap:6px;}
      .wr-slot-name{font-size:13px;font-weight:800;color:#1E293B;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .wr-unequip-btn{flex-shrink:0;background:#FEE2E2;color:#B91C1C;border:1px solid #FECACA;border-radius:8px;padding:3px 8px;font-family:'Jua';font-size:12px;cursor:pointer;}
      .wr-tabs{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;}
      .wr-tab{flex:1 1 auto;min-width:max-content;padding:6px 9px;border-radius:12px;border:1.5px solid #CBD5E1;background:#F8FAFC;font-family:'Jua';font-size:12.5px;color:#475569;cursor:pointer;white-space:nowrap;text-align:center;}
      .wr-tab.active{background:#1E293B;color:#FFF;border-color:#1E293B;}
      .wr-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;}
      .wr-item-card{background:#FFF;border:2px solid #E2E8F0;border-radius:16px;padding:10px 8px;text-align:center;cursor:pointer;transition:transform .12s,border-color .15s;display:flex;flex-direction:column;align-items:center;justify-content:space-between;}
      .wr-item-card:active{transform:scale(.97);}
      .wr-item-card.equipped{border-color:#10B981;background:#ECFDF5;box-shadow:0 4px 12px rgba(16,185,129,.18);}
      .wr-item-card.locked{background:#F8FAFC;border-style:dashed;opacity:.72;}
      .wr-item-nm{font-family:'Jua';font-size:14.5px;color:#0F172A;margin-top:4px;line-height:1.25;word-break:keep-all;}
      .wr-item-meta{font-size:11px;color:#64748B;margin-top:3px;line-height:1.35;word-break:keep-all;}
      .wr-item-act{margin-top:7px;width:100%;border-radius:10px;padding:5px 6px;font-family:'Jua';font-size:13px;border:none;cursor:pointer;}
      .wr-item-act.wear{background:#3B82F6;color:#FFF;}
      .wr-item-act.off{background:#10B981;color:#FFF;}
      .wr-item-act.lock{background:#E2E8F0;color:#64748B;}
      .wr-confetti-top{position:fixed;top:-10px;font-size:24px;pointer-events:none;z-index:130;animation:fall linear forwards;}
    `;
    document.head.appendChild(st);
  }

  function itemTagsHtml(item) {
    if (item.cat === 'hat') {
      return `
        <span class="wr-tag spec">🧢 ${item.styleName}</span>
        <span class="wr-tag">${item.colorName}</span>
        <span class="wr-tag rare">✨ ${item.rarity}</span>`;
    }
    return `
      <span class="wr-tag spec">🧵 ${MAT_LABELS[item.material]}</span>
      <span class="wr-tag">📏 ${SIZE_LABELS[item.size]}</span>
      <span class="wr-tag">📐 ${LEN_LABELS[item.length]}</span>
      <span class="wr-tag">🎨 ${item.colorName}</span>`;
  }

  function playFanfareSound() {
    if (typeof beep !== 'function') return;
    [523, 659, 784, 1046].forEach((hz, idx) => {
      setTimeout(() => beep(hz, idx === 3 ? 0.28 : 0.12), idx * 95);
    });
  }

  function burstCelebrationConfetti(waves = 2) {
    const emojis = ['🎉', '🎊', '✨', '👑', '🌟', '🧢', '🧣'];
    for (let w = 0; w < waves; w++) {
      setTimeout(() => {
        for (let i = 0; i < 24; i++) {
          const el = document.createElement('div');
          el.className = 'wr-confetti-top';
          el.textContent = emojis[Math.floor(Math.random() * emojis.length)];
          el.style.left = `${Math.random() * 100}%`;
          el.style.animationDuration = `${1.6 + Math.random() * 1.4}s`;
          el.style.animationDelay = `${Math.random() * 0.35}s`;
          document.body.appendChild(el);
          setTimeout(() => el.remove(), 3400);
        }
      }, w * 450);
    }
  }

  // ==========================================================
  // 1) 클리어 시 엄청난 축하 + [착용하기] / [착용 안 하기] 분할 버튼 모달
  // ==========================================================
  function showRewardCelebration(itemOrId, opts = {}) {
    injectStyle();
    const item = typeof itemOrId === 'string' ? ITEM_BY_ID[itemOrId] : itemOrId;
    if (!item) {
      if (typeof opts.onDone === 'function') opts.onDone({ equipped: false });
      return;
    }

    const m = getMember(opts.member);
    const charId = m && String(m.birthdate || m.id || '') === '691105' ? '691105' : '610708';
    const w = ensureState(m);
    const tryOnEquipped = { ...w.equipped, [item.cat === 'hat' ? 'hatId' : 'mufflerId']: item.id };
    const nextHint = opts.nextIntervalDays ? `다음 특별 선물까지 ${opts.nextIntervalDays}일 뒤!` : '3~4일 1회 특별 선물!';

    playFanfareSound();
    burstCelebrationConfetti(2);

    const ov = document.createElement('div');
    ov.className = 'wr-celeb-ov';
    ov.innerHTML = `
      <div class="wr-celeb-modal" role="dialog" aria-modal="true">
        <div class="wr-celeb-banner">🎊 대박 축하합니다! 아바타 선물 도착! 🎊</div>
        <div style="font-family:'Jua';font-size:25px;color:#0F172A;line-height:1.25;word-break:keep-all;">
          ${item.cat === 'hat' ? '🧢' : '🧣'} ${item.name}
        </div>
        <div style="font-size:13.5px;color:#64748B;margin-top:3px;word-break:keep-all;">${item.desc}</div>

        <div class="wr-tags">${itemTagsHtml(item)}</div>

        <div class="wr-stage-wrap">
          <div class="wr-sunburst"></div>
          <canvas id="wrCelebCanvas" width="210" height="210" style="position:relative;z-index:2;width:210px;height:210px;"></canvas>
        </div>

        <div style="display:inline-flex;align-items:center;gap:6px;background:#FFF;border:1.5px solid #FDE68A;border-radius:999px;padding:4px 12px;font-size:12.5px;font-weight:700;color:#92400E;">
          🎒 내 옷장 ${w.owned.length}/${ALL_ITEMS.length}종 · ${nextHint}
        </div>

        <div id="wrActionArea">
          <div class="wr-btn-split">
            <button type="button" class="wr-btn-wear" id="wrBtnWear">
              <span>✅ 착용하기</span>
              <span class="wr-btn-sub">바로 아바타에 적용돼요</span>
            </button>
            <button type="button" class="wr-btn-skip" id="wrBtnSkip">
              <span>📦 착용 안 하기</span>
              <span class="wr-btn-sub">내 옷장에만 보관할게요</span>
            </button>
          </div>
        </div>
      </div>`;

    document.body.appendChild(ov);

    const cv = ov.querySelector('#wrCelebCanvas');
    let rafId = null;
    const animatePreview = (now) => {
      if (!ov.isConnected) return;
      renderAvatarTryOnCanvas(cv, charId, tryOnEquipped, { t: now * 0.001 });
      rafId = requestAnimationFrame(animatePreview);
    };
    rafId = requestAnimationFrame(animatePreview);

    let decided = false;
    const finishChoice = (didWear) => {
      if (decided) return;
      decided = true;
      if (rafId) cancelAnimationFrame(rafId);
      ov.remove();
      if (typeof opts.onDone === 'function') opts.onDone({ equipped: didWear, item });
    };

    ov.querySelector('#wrBtnWear').addEventListener('click', () => {
      if (decided) return;
      if (m) {
        if (!w.owned.includes(item.id)) w.owned.push(item.id);
        equipItem(item.id, m);
      }
      if (typeof beep === 'function') {
        beep(784, 0.12);
        setTimeout(() => beep(1046, 0.22), 110);
      }
      const actionArea = ov.querySelector('#wrActionArea');
      actionArea.innerHTML = `<div class="wr-done-toast">✨ 바로 착용했어요! 내 옷장에도 저장되었습니다!</div>`;
      setTimeout(() => finishChoice(true), 650);
    });

    ov.querySelector('#wrBtnSkip').addEventListener('click', () => {
      if (decided) return;
      if (typeof beep === 'function') beep(520, 0.08);
      if (m && !w.owned.includes(item.id)) {
        w.owned.push(item.id);
        persistMember(m);
      }
      finishChoice(false);
    });
  }

  // ==========================================================
  // 2) 개인 인벤토리(내 옷장) 모달 — 언제든 다시 꺼내 끼기/벗기
  // ==========================================================
  function openInventoryModal(explicitMember = null, onClosed = null) {
    injectStyle();
    const existing = document.getElementById('wrInvOverlay');
    if (existing) existing.remove();

    const m = getMember(explicitMember);
    const charId = m && String(m.birthdate || m.id || '') === '691105' ? '691105' : '610708';
    const w = ensureState(m);

    let activeTab = 'all';
    const ov = document.createElement('div');
    ov.id = 'wrInvOverlay';
    ov.className = 'wr-inv-ov';

    const countBy = (cat) => ALL_ITEMS.filter((it) => it.cat === cat && w.owned.includes(it.id)).length;

    ov.innerHTML = `
      <div class="wr-inv-modal" role="dialog" aria-modal="true">
        <div class="wr-inv-head">
          <div>
            <div style="font-family:'Jua';font-size:21px;color:#0F172A;">🎒 내 아바타 옷장</div>
            <div style="font-size:12.5px;color:#92400E;font-weight:700;">모자 ${countBy('hat')}/20 · 머플러 ${countBy('muffler')}/20 수집 중</div>
          </div>
          <button type="button" class="iconbtn" id="wrInvCloseTop" style="width:40px;height:40px;font-size:18px;">✕</button>
        </div>
        <div class="wr-inv-body">
          <div class="wr-mirror-card">
            <canvas id="wrMirrorCanvas" width="128" height="168" style="width:110px;height:144px;border-radius:14px;background:linear-gradient(180deg,#E0F2FE,#FEF9C3);border:1.5px solid #CBD5E1;flex-shrink:0;"></canvas>
            <div class="wr-slots" id="wrSlotsBox"></div>
          </div>

          <div class="wr-tabs" id="wrTabsBox">
            <button type="button" class="wr-tab active" data-tab="all">전체 (${w.owned.length}/${ALL_ITEMS.length})</button>
            <button type="button" class="wr-tab" data-tab="hat">🧢 모자 (${countBy('hat')}/20)</button>
            <button type="button" class="wr-tab" data-tab="muffler">🧣 머플러 (${countBy('muffler')}/20)</button>
            <button type="button" class="wr-tab" data-tab="owned">✨ 보유품 (${w.owned.length})</button>
          </div>

          <div class="wr-grid" id="wrGridBox"></div>
        </div>
        <div style="padding:10px 14px;border-top:1px solid #E2E8F0;background:#F8FAFC;">
          <button type="button" class="btn btn-primary" id="wrInvCloseBottom" style="margin:0;padding:12px;font-size:18px;">다 고르셨나요? 닫기</button>
        </div>
      </div>`;

    document.body.appendChild(ov);

    const mirrorCanvas = ov.querySelector('#wrMirrorCanvas');
    const slotsBox = ov.querySelector('#wrSlotsBox');
    const gridBox = ov.querySelector('#wrGridBox');
    let rafId = null;

    const animateMirror = (now) => {
      if (!ov.isConnected) return;
      renderAvatarTryOnCanvas(mirrorCanvas, charId, w.equipped, { t: now * 0.001 });
      rafId = requestAnimationFrame(animateMirror);
    };
    rafId = requestAnimationFrame(animateMirror);

    function renderSlots() {
      const hat = w.equipped.hatId ? ITEM_BY_ID[w.equipped.hatId] : null;
      const muf = w.equipped.mufflerId ? ITEM_BY_ID[w.equipped.mufflerId] : null;
      slotsBox.innerHTML = `
        <div class="wr-slot-row">
          <div style="min-width:0;">
            <div style="font-size:11px;color:#64748B;font-weight:700;">🧢 착용 중인 모자</div>
            <div class="wr-slot-name">${hat ? hat.name : '착용 안 함'}</div>
          </div>
          ${hat ? `<button type="button" class="wr-unequip-btn" data-unequip="hat">벗기</button>` : ''}
        </div>
        <div class="wr-slot-row">
          <div style="min-width:0;">
            <div style="font-size:11px;color:#64748B;font-weight:700;">🧣 착용 중인 머플러</div>
            <div class="wr-slot-name">${muf ? muf.name : '착용 안 함'}</div>
          </div>
          ${muf ? `<button type="button" class="wr-unequip-btn" data-unequip="muffler">벗기</button>` : ''}
        </div>
        <div style="font-size:11.5px;color:#64748B;line-height:1.4;">카드를 누르면 바로 끼거나 벗을 수 있어요!</div>`;
      slotsBox.querySelectorAll('[data-unequip]').forEach((b) => {
        b.addEventListener('click', () => {
          unequipSlot(b.dataset.unequip, m);
          if (typeof beep === 'function') beep(440, 0.07);
          renderSlots();
          renderGrid();
        });
      });
    }

    function renderGrid() {
      const list = ALL_ITEMS.filter((it) => {
        if (activeTab === 'hat') return it.cat === 'hat';
        if (activeTab === 'muffler') return it.cat === 'muffler';
        if (activeTab === 'owned') return w.owned.includes(it.id);
        return true;
      }).sort((a, b) => Number(w.owned.includes(b.id)) - Number(w.owned.includes(a.id)));

      gridBox.innerHTML = '';
      if (!list.length) {
        gridBox.innerHTML = `<div style="grid-column:1/-1;text-align:center;padding:28px 12px;color:#64748B;font-size:14.5px;line-height:1.6;">아직 모은 의상 아이템이 없어요.<br>오늘의 두뇌운동을 클리어하면 3~4일마다 선물로 도착해요!</div>`;
        return;
      }

      list.forEach((it) => {
        const owned = w.owned.includes(it.id);
        const isEquipped = w.equipped.hatId === it.id || w.equipped.mufflerId === it.id;
        const card = document.createElement('div');
        card.className = `wr-item-card ${isEquipped ? 'equipped' : ''} ${owned ? '' : 'locked'}`;

        const metaText = it.cat === 'hat'
          ? `${it.styleName} · ${it.colorName}`
          : `${MAT_LABELS[it.material]} · ${SIZE_LABELS[it.size]} · ${LEN_LABELS[it.length]}`;

        card.innerHTML = `
          <div style="width:100%;">
            <canvas class="wr-card-cv" width="96" height="76" style="width:82px;height:64px;display:block;margin:0 auto;${owned ? '' : 'filter:grayscale(1) contrast(.55) opacity(.45);'}"></canvas>
            <div class="wr-item-nm">${owned ? it.name : `🔒 ${it.cat === 'hat' ? '미수집 모자' : '미수집 머플러'}`}</div>
            <div class="wr-item-meta">${owned ? metaText : '클리어 시 3~4일 1회 랜덤 획득'}</div>
          </div>
          <button type="button" class="wr-item-act ${isEquipped ? 'off' : owned ? 'wear' : 'lock'}">
            ${isEquipped ? '✔️ 착용 중 (누르면 벗기)' : owned ? '착용하기' : '미보유'}
          </button>`;

        gridBox.appendChild(card);
        renderItemIconCanvas(card.querySelector('.wr-card-cv'), it);

        card.addEventListener('click', () => {
          if (!owned) {
            if (typeof beep === 'function') beep(300, 0.06);
            return;
          }
          if (isEquipped) {
            unequipSlot(it.cat, m);
            if (typeof beep === 'function') beep(460, 0.07);
          } else {
            equipItem(it.id, m);
            if (typeof beep === 'function') beep(720, 0.1);
          }
          renderSlots();
          renderGrid();
        });
      });
    }

    ov.querySelectorAll('.wr-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        activeTab = tab.dataset.tab;
        ov.querySelectorAll('.wr-tab').forEach((tEl) => tEl.classList.toggle('active', tEl === tab));
        renderGrid();
      });
    });

    const closeModal = () => {
      if (rafId) cancelAnimationFrame(rafId);
      ov.remove();
      if (typeof onClosed === 'function') onClosed();
    };
    ov.querySelector('#wrInvCloseTop').addEventListener('click', closeModal);
    ov.querySelector('#wrInvCloseBottom').addEventListener('click', closeModal);
    ov.addEventListener('click', (e) => {
      if (e.target === ov) closeModal();
    });

    renderSlots();
    renderGrid();
  }

  // 홈 광장 하단 옷장 요약 텍스트 반환용
  function getSummaryFor(member = null) {
    const m = getMember(member);
    const w = ensureState(m);
    const hat = w.equipped.hatId ? ITEM_BY_ID[w.equipped.hatId] : null;
    const muf = w.equipped.mufflerId ? ITEM_BY_ID[w.equipped.mufflerId] : null;
    return {
      ownedCount: w.owned.length,
      totalCount: ALL_ITEMS.length,
      hat,
      muffler: muf,
      equipped: { ...w.equipped },
    };
  }

  window.WARDROBE = {
    ALL_ITEMS,
    HAT_ITEMS,
    MUFFLER_ITEMS,
    ITEM_BY_ID,
    MAT_LABELS,
    SIZE_LABELS,
    LEN_LABELS,
    getTodayLocalYMD,
    ensureState,
    equipItem,
    unequipSlot,
    syncToPet,
    isDropDue,
    tryAwardClearDrop,
    getSummaryFor,
    getAnchorMetrics,
    drawHat,
    drawMuffler,
    renderItemIconCanvas,
    renderAvatarTryOnCanvas,
    showRewardCelebration,
    openInventoryModal,
  };
})();

