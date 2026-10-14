// ==========================================================
// 오늘의 소식 (신문처럼 보는 뉴스 + 라디오 + 유튜브 + 날씨)
// 매일 아침 GitHub Actions가 assets/news-data.json 한 파일을 통째로 덮어쓰므로 어제 기사는 저절로 사라진다.
// 기기에는 "읽은 기사 표시"만 오늘 기사 번호 기준으로 잠깐 저장하고, 날이 바뀌면 같이 지워진다.
// ==========================================================
(function () {
  const DATA_URL = 'assets/news-data.json';
  const READ_KEY = 'newsRead';
  const STALE_DAYS = 3;
  const CATS = ['전체', '건강', '반려동물', '문화·생활', '스포츠', '정치', '경제', '기독교'];
  // 회원별로 맨 앞에 두고 먼저 보여줄 뉴스 분야
  const FIRST_CAT_BY_MEMBER = { '691105': '반려동물' };
  const TABS = [['news', '📰', '뉴스'], ['radio', '📻', '라디오'], ['video', '▶️', '유튜브'], ['weather', '☀️', '날씨']];
  const CAT_COLOR = { '건강': '#2FA28E', '문화·생활': '#D9779B', '스포츠': '#EE7B5B', '정치': '#3F6FB5', '경제': '#B7791F', '기독교': '#6B5B95', '반려동물': '#6E9E3F', '지식·시사': '#3F6FB5', '추억·예능': '#D9779B', '요리': '#B7791F' };

  const CACHE_TTL = 3600e3;
  let cache = null; // { data, at }

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  function readSet(updated) {
    try {
      const raw = JSON.parse(localStorage.getItem(READ_KEY) || 'null');
      if (raw && raw.updated === updated && Array.isArray(raw.ids)) return new Set(raw.ids);
    } catch (e) { /* 저장소를 못 쓰면 읽음 표시만 생략 */ }
    return new Set();
  }
  function markRead(updated, ids) {
    try { localStorage.setItem(READ_KEY, JSON.stringify({ updated, ids: [...ids] })); } catch (e) { /* 무시 */ }
  }

  async function load() {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;
    const res = await fetch(`${DATA_URL}?r=${Math.floor(Date.now() / 3600e3)}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) throw new Error('뉴스 형식 오류');
    cache = { data, at: Date.now() };
    return data;
  }

  function ago(ts) {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return `${Math.max(1, m)}분 전`;
    const h = Math.round(m / 60);
    return h < 24 ? `${h}시간 전` : `${Math.round(h / 24)}일 전`;
  }
  const safeUrl = u => (/^https:\/\//.test(u) ? u : '#');
  const todayText = () => new Date().toLocaleDateString('ko-KR', { month: 'long', day: 'numeric', weekday: 'long' });

  // 전체 보기에서는 분야가 골고루 보이도록 한 분야씩 번갈아 섞는다
  function interleave(items, key = 'cat', keys = CATS.slice(1)) {
    const groups = keys.map(k => items.filter(it => it[key] === k));
    const out = [];
    for (let i = 0; groups.some(g => g[i]); i++) for (const g of groups) if (g[i]) out.push(g[i]);
    return out;
  }

  function injectStyle() {
    if (document.getElementById('newsStyle')) return;
    if (!document.getElementById('tdsFont')) {
      const l = document.createElement('link');
      l.id = 'tdsFont'; l.rel = 'stylesheet';
      l.href = 'https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/static/pretendard.css';
      document.head.appendChild(l);
    }
    const st = document.createElement('style');
    st.id = 'newsStyle';
    st.textContent = `
      :root{--tds:'Pretendard','Apple SD Gothic Neo','Noto Sans KR','Malgun Gothic',sans-serif;}
      .nw-paper{background:#fff;border:2px solid var(--line);border-radius:18px;box-shadow:0 6px 18px rgba(0,0,0,.08);overflow:hidden;margin-bottom:14px;}
      .nw-mast{position:relative;padding:14px 16px 10px;border-bottom:4px double var(--ink);text-align:center;}
      .nw-back{position:absolute;left:12px;top:12px;border:0;background:#F2F4F6;font-family:var(--tds);font-weight:700;font-size:17px;border-radius:12px;padding:10px 14px;cursor:pointer;color:#4E5968;}
      .nw-back:active,.nw-chip:active,.nw-tab:active{transform:scale(.96);}
      .nw-logo{font-family:'Jua';font-size:34px;line-height:1.1;letter-spacing:2px;padding-top:36px;white-space:nowrap;}
      .nw-date{font-size:16px;color:var(--ink-soft);margin-top:4px;}
      .nw-tabs{display:flex;gap:4px;margin:14px 14px 4px;padding:4px;background:#F2F4F6;border-radius:18px;}
      .nw-tab{flex:1;min-width:0;border:0;background:transparent;font-family:var(--tds);font-weight:700;font-size:16px;height:62px;border-radius:14px;color:#8B95A1;cursor:pointer;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;transition:background .15s,color .15s,transform .1s;}
      .nw-tab .ic{font-size:22px;line-height:1;}
      .nw-tab.on{background:#fff;color:#191F28;box-shadow:0 2px 8px rgba(0,0,0,.12);}
      .nw-chips{display:flex;flex-wrap:wrap;gap:8px;padding:10px 14px 6px;}
      .nw-chip{flex:0 0 auto;border:0;background:#F2F4F6;color:#4E5968;font-family:var(--tds);font-weight:600;font-size:18px;height:46px;padding:0 18px;border-radius:999px;cursor:pointer;transition:background .15s,color .15s,transform .1s;}
      .nw-chip.on{background:#191F28;color:#fff;}
      .nw-body{padding:4px 14px 14px;}
      .nw-card{display:block;text-decoration:none;color:var(--ink);}
      .nw-lead{position:relative;min-height:150px;display:flex;align-items:flex-end;margin:12px -2px 4px;border-radius:14px;overflow:hidden;background:#3A2E28;}
      .nw-lead .nw-img{width:100%;height:230px;object-fit:cover;display:block;}
      .nw-lead .nw-ov{position:absolute;left:0;right:0;bottom:0;padding:44px 14px 14px;background:linear-gradient(transparent,rgba(0,0,0,.82));color:#fff;}
      .nw-lead .nw-title{font-size:24px;line-height:1.35;color:#fff;margin:4px 0 6px;}
      .nw-lead .nw-meta{color:rgba(255,255,255,.85);}
      .nw-row{display:flex;gap:12px;padding:15px 0;border-bottom:1px solid var(--line);}
      .nw-row:last-of-type{border-bottom:0;}
      .nw-txt{flex:1;min-width:0;}
      .nw-thumb{flex:0 0 96px;width:96px;height:96px;border-radius:10px;object-fit:cover;background:#EFE6D3;align-self:center;}
      .nw-tag{display:inline-block;font-family:'Jua';font-size:14px;color:#fff;border-radius:6px;padding:2px 8px;margin-right:6px;vertical-align:1px;}
      .nw-title{font-family:'Jua';font-size:21px;line-height:1.38;margin:5px 0 6px;word-break:keep-all;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;}
      .nw-lead .nw-title{-webkit-line-clamp:4;}
      .nw-meta{font-size:15px;color:var(--ink-soft);}
      .nw-card.read .nw-title{color:#A29688;}
      .nw-card.read .nw-thumb,.nw-card.read .nw-img{opacity:.55;}
      .nw-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:64px;height:64px;border-radius:50%;background:rgba(0,0,0,.62);color:#fff;font-size:30px;display:flex;align-items:center;justify-content:center;padding-left:5px;pointer-events:none;}
      .nw-vcard{display:block;margin:16px 0 20px;}
      .nw-vthumb{position:relative;aspect-ratio:16/9;border-radius:18px;overflow:hidden;background:#EFE6D3;}
      .nw-vthumb img{width:100%;height:100%;object-fit:cover;display:block;}
      .nw-vtxt{padding:10px 2px 0;}
      .nw-video{background:#111;}
      .nw-vbar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#111;}
      .nw-vbar button,.nw-vbar a{font-family:var(--tds);font-weight:700;font-size:17px;padding:11px 16px;border-radius:12px;border:0;background:#333D4B;color:#fff;text-decoration:none;cursor:pointer;white-space:nowrap;}
      .nw-vbar .sp{flex:1;min-width:0;font-size:14px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .nw-vframe{width:100%;aspect-ratio:16/9;border:0;background:#000;display:block;}
      .nw-vinfo{flex:1;overflow:auto;background:#fff;padding:16px;}
      .nw-vinfo .nw-title{font-size:23px;-webkit-line-clamp:unset;display:block;}
      .nw-vbtn{display:block;text-align:center;font-family:var(--tds);font-weight:700;font-size:20px;background:#3182F6;color:#fff;border-radius:16px;padding:16px;margin-top:14px;text-decoration:none;}
      .nw-note{text-align:center;color:var(--ink-soft);font-size:16px;padding:12px 0 4px;}
      .nw-hint{display:block;width:100%;text-align:center;color:#fff;font-size:20px;margin:2px 0 12px;padding:14px 10px;font-family:var(--tds);font-weight:700;background:#3182F6;border:0;border-radius:18px;box-shadow:0 6px 14px rgba(49,130,246,.35);cursor:pointer;}
      .nw-hint:active{transform:scale(.98);}
      .nw-hint.ready{background:linear-gradient(135deg,#FF9F1C,#F04452);box-shadow:0 6px 18px rgba(240,68,82,.45);animation:nwGlow 1.4s ease-in-out infinite;}
      @keyframes nwGlow{0%,100%{transform:scale(1);}50%{transform:scale(1.03);}}
      .nw-hint small{display:block;font-family:var(--tds);font-weight:500;font-size:15px;color:rgba(255,255,255,.85);margin-top:2px;}
      .nw-from-r{animation:nwInR .34s cubic-bezier(.2,.8,.2,1) both;} .nw-from-l{animation:nwInL .34s cubic-bezier(.2,.8,.2,1) both;}
      @keyframes nwInR{from{opacity:.2;transform:translateX(42%);}to{opacity:1;transform:none;}}
      @keyframes nwInL{from{opacity:.2;transform:translateX(-42%);}to{opacity:1;transform:none;}}
      .nw-reader{position:fixed;inset:0;z-index:300;background:#fff;display:flex;flex-direction:column;animation:nwInR .25s ease both;}
      .nw-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:2px solid var(--line);background:var(--cream);}
      .nw-bar button,.nw-bar a{font-family:var(--tds);font-weight:700;font-size:17px;padding:11px 16px;border-radius:12px;border:0;background:#F2F4F6;color:#333D4B;text-decoration:none;cursor:pointer;white-space:nowrap;}
      .nw-bar .sp{flex:1;min-width:0;font-size:14px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .nw-frame{flex:1;width:100%;border:0;background:#fff;}
      .nw-tip{font-size:14px;color:var(--ink-soft);text-align:center;padding:6px 10px;background:var(--cream);}
    `;
    document.head.appendChild(st);
  }

  const tagHtml = it => `<span class="nw-tag" style="background:${CAT_COLOR[it.cat] || '#7A6A5E'}">${esc(it.cat)}</span>`;
  const metaHtml = (it, isRead) => `${esc(it.src)} · ${esc(ago(it.ts))}${isRead ? ' · 읽음' : ''}`;

  function leadHtml(it, isRead) {
    return `<a class="nw-card nw-lead${isRead ? ' read' : ''}" draggable="false" data-id="${esc(it.id)}" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">
      <img class="nw-img" draggable="false" src="${esc(it.img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">
      <div class="nw-ov">${tagHtml(it)}<div class="nw-title">${esc(it.title)}</div><div class="nw-meta">${metaHtml(it, isRead)}</div></div>
    </a>`;
  }
  function rowHtml(it, isRead) {
    const img = it.img ? `<img class="nw-thumb" draggable="false" src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<a class="nw-card nw-row${isRead ? ' read' : ''}" draggable="false" data-id="${esc(it.id)}" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">
      <div class="nw-txt"><div class="nw-meta">${tagHtml(it)}</div><div class="nw-title">${esc(it.title)}</div><div class="nw-meta">${metaHtml(it, isRead)}</div></div>
      ${img}
    </a>`;
  }

  // 들어온 방향의 반대쪽으로 밀면 홈으로 돌아간다. dir: 홈 화면이 들어올 방향
  let feedDir = 'right';
  function leaveFeed(dir) {
    if (window.RADIO) RADIO.stop();
    closeReader();
    document.querySelectorAll('.gl-pane').forEach(p => p.remove());
    const from = dir || (feedDir === 'right' ? 'left' : 'right');
    Promise.resolve(renderHome()).then(() => {
      const v = document.getElementById('app').firstElementChild;
      if (v) v.classList.add(from === 'right' ? 'nw-from-r' : 'nw-from-l');
    });
  }

  function openFeed(dir, startTab) {
    injectStyle();
    const root = document.getElementById('app');
    root.innerHTML = '';
    feedDir = dir === 'left' ? 'left' : 'right';
    const wrap = document.createElement('div');
    wrap.className = feedDir === 'left' ? 'nw-from-l' : 'nw-from-r';
    wrap.style.paddingBottom = '70px';
    wrap.innerHTML = `
      <div class="nw-paper">
        <div class="nw-mast">
          <button class="nw-back" id="nwBack">← 홈</button>
          <div class="nw-logo">오늘의 소식</div>
          <div class="nw-date">${esc(todayText())}</div>
        </div>
        <div class="nw-tabs">${TABS.map(([t, ic, label]) => `<button class="nw-tab${t === 'news' ? ' on' : ''}" data-t="${t}"><span class="ic">${ic}</span>${label}</button>`).join('')}</div>
        <div class="nw-chips" id="nwChips"></div>
        <div class="nw-body" id="nwList"><div class="nw-note">불러오는 중이에요…</div></div>
      </div>
      <div id="nwMini"></div>`;
    root.appendChild(wrap);
    window.scrollTo(0, 0);
    wrap.querySelector('#nwBack').addEventListener('click', () => leaveFeed());
    if (window.RADIO) RADIO.mountMini(wrap.querySelector('#nwMini'));
    if (window.GLASS) GLASS.mount(wrap);

    const list = wrap.querySelector('#nwList');
    const chips = wrap.querySelector('#nwChips');
    let tab = 'news', data = null, read = new Set();
    const firstCat = currentMember ? FIRST_CAT_BY_MEMBER[currentMember.birthdate] : null;
    const newsCats = firstCat ? [firstCat, ...CATS.filter(c => c !== firstCat)] : CATS;
    const cats = { news: firstCat || '전체', video: '전체' };
    const failNote = what => `<div class="nw-note">지금은 ${what}을 불러올 수 없어요.<br>잠시 뒤에 다시 눌러 주세요.</div>`;

    const listHtml = items => {
      const leadIdx = items.findIndex(it => it.img);
      const html = items.map((it, i) => (i === leadIdx ? leadHtml(it, read.has(it.id)) : rowHtml(it, read.has(it.id))));
      if (leadIdx > 0) html.unshift(html.splice(leadIdx, 1)[0]);
      return html.join('');
    };
    const paintNews = () => {
      if (!data) return;
      const items = cats.news === '전체' ? interleave(data.items) : data.items.filter(it => it.cat === cats.news);
      const stale = Date.now() - Date.parse(data.updated) > STALE_DAYS * 86400e3;
      list.innerHTML = (stale ? '<div class="nw-note">⚠️ 며칠째 새 소식이 오지 않았어요.</div>' : '')
        + (items.length ? listHtml(items) : '<div class="nw-note">지금은 보여드릴 소식이 없어요.</div>')
        + '<div class="nw-note">누르면 앱 안에서 기사가 열려요. 소식은 매일 아침 새로 바뀌어요.</div>';
    };
    const VCATS = window.VIDEO ? VIDEO.CATS : ['전체'];
    const paint = () => {
      wrap.querySelectorAll('.nw-tab').forEach(x => x.classList.toggle('on', x.dataset.t === tab));
      const noChips = tab === 'radio' || tab === 'weather';
      chips.style.display = noChips ? 'none' : '';
      if (!noChips) {
        const set = tab === 'news' ? newsCats : VCATS;
        chips.innerHTML = set.map(c => `<button class="nw-chip${c === cats[tab] ? ' on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
      }
      if (tab === 'news') {
        if (data) paintNews(); else list.innerHTML = '<div class="nw-note">불러오는 중이에요…</div>';
        return;
      }
      // 라디오·날씨·유튜브는 탭을 열 때마다 새 상자에 그린다 (다른 탭으로 가면 이전 상자는 버려짐)
      const mod = { radio: window.RADIO, weather: window.WEATHER, video: window.VIDEO }[tab];
      list.innerHTML = '';
      const box = document.createElement('div');
      list.appendChild(box);
      if (!mod) box.innerHTML = '<div class="nw-note">지금은 열 수 없어요.</div>';
      else if (tab === 'radio') mod.mountStations(box);
      else if (tab === 'video') mod.mount(box, cats.video);
      else mod.mount(box);
    };

    wrap.querySelector('.nw-tabs').addEventListener('click', e => {
      const b = e.target.closest('.nw-tab'); if (!b || b.dataset.t === tab) return;
      tab = b.dataset.t; paint();
    });
    chips.addEventListener('click', e => {
      const b = e.target.closest('.nw-chip'); if (!b) return;
      cats[tab] = b.dataset.c;
      chips.querySelectorAll('.nw-chip').forEach(x => x.classList.toggle('on', x === b));
      if (tab === 'news') paintNews(); else paint();
    });
    list.addEventListener('click', e => {
      if (tab !== 'news') return; // 유튜브·라디오·날씨는 각자 눌림을 처리한다
      const a = e.target.closest('.nw-card'); if (!a || !data) return;
      e.preventDefault();
      read.add(a.dataset.id); markRead(data.updated, read);
      a.classList.add('read');
      openReader(data.items.find(it => it.id === a.dataset.id));
    });

    paint();
    if (startTab && startTab !== 'news') { tab = startTab; paint(); }
    load().then(d => {
      data = d; read = readSet(d.updated);
      if (tab === 'news') paintNews();
    }).catch(() => {
      if (tab === 'news') list.innerHTML = failNote('소식');
    });
  }

  // 기사를 앱 안에서 열기 (뒤로가기 버튼으로도 닫힘)
  function openReader(it) {
    if (!it || document.getElementById('nwReader')) return;
    const r = document.createElement('div');
    r.id = 'nwReader';
    r.className = 'nw-reader';
    r.innerHTML = `
      <div class="nw-bar">
        <button id="nwClose">← 닫기</button>
        <div class="sp">${esc(it.src)}</div>
        <a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">새 창 ↗</a>
      </div>
      <iframe class="nw-frame" title="${esc(it.title)}" referrerpolicy="no-referrer"></iframe>
      <div class="nw-tip">화면이 비어 있으면 오른쪽 위 '새 창 ↗'을 눌러 보세요.</div>`;
    document.body.appendChild(r);
    r.querySelector('iframe').src = safeUrl(it.url);
    document.body.style.overflow = 'hidden';
    history.pushState({ nwReader: 1 }, '');
    r.querySelector('#nwClose').addEventListener('click', () => { if (history.state && history.state.nwReader) history.back(); else closeReader(); });
  }
  function closeReader() {
    const r = document.getElementById('nwReader');
    if (r) r.remove();
    document.body.style.overflow = '';
  }
  window.addEventListener('popstate', () => closeReader());

  // 첫 화면에서 좌우로 밀면 소식이 열리고, 소식에서 들어온 반대 방향으로 밀면 홈으로 돌아간다.
  // 화면이 손가락을 따라 움직이고, 충분히 밀면 넘어가고 아니면 제자리로 돌아온다.
  const COMMIT_RATIO = 0.25, FLICK_PX = 60, FLICK_SPEED = 0.45;
  let drag = null, bound = false, suppressClickUntil = 0;
  const busy = () => document.getElementById('nwReader') || document.querySelector('.gl-canvas');
  const onHome = () => !!document.getElementById('startBtn') && !document.querySelector('.overlay') && !busy();
  const onFeed = () => !!document.getElementById('nwBack') && !busy();
  const allowed = dx => (onHome() ? true : onFeed() ? (feedDir === 'right' ? dx > 0 : dx < 0) : false);
  const movers = () => [document.getElementById('app'), document.querySelector('.gl-pane')].filter(Boolean);
  function setOffset(dx, animate) {
    const W = window.innerWidth;
    for (const el of movers()) {
      el.style.transition = animate ? 'transform .28s cubic-bezier(.2,.8,.2,1), opacity .28s' : 'none';
      el.style.transform = dx ? `translateX(${dx.toFixed(1)}px)` : '';
      el.style.opacity = dx ? String(Math.max(0.3, 1 - (Math.abs(dx) / W) * 0.7).toFixed(3)) : '';
    }
  }
  function clearOffset() { for (const el of movers()) { el.style.transition = ''; el.style.transform = ''; el.style.opacity = ''; } }
  function bindSwipe() {
    if (bound) return; bound = true;
    const begin = (x, y, target) => {
      drag = (onHome() || onFeed()) && !(target.closest && target.closest('input, textarea'))
        ? { x, y, at: Date.now(), axis: null, moved: false } : null;
    };
    const move = (x, y) => {
      if (!drag) return;
      const dx = x - drag.x, dy = y - drag.y;
      if (!drag.axis) {
        if (Math.abs(dx) < 10 && Math.abs(dy) < 10) return;
        drag.axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      }
      if (drag.axis !== 'x') return;
      drag.moved = true;
      setOffset(allowed(dx) ? dx : dx * 0.12, false); // 못 가는 방향은 살짝만 끌린다
    };
    const finish = (x) => {
      const d = drag; drag = null;
      if (!d || d.axis !== 'x') return;
      suppressClickUntil = Date.now() + 350;
      const dx = x - d.x, W = window.innerWidth;
      const speed = Math.abs(dx) / Math.max(1, Date.now() - d.at);
      const go = allowed(dx) && (Math.abs(dx) > W * COMMIT_RATIO || (Math.abs(dx) > FLICK_PX && speed > FLICK_SPEED));
      if (!go) { setOffset(0, true); setTimeout(() => { if (!drag) clearOffset(); }, 300); return; }
      const sign = dx > 0 ? 1 : -1;
      const wasHome = onHome();
      setOffset(sign * W, true);
      setTimeout(() => {
        clearOffset();
        if (wasHome) openFeed(sign < 0 ? 'right' : 'left');
        else leaveFeed(sign < 0 ? 'right' : 'left');
      }, 190);
    };
    document.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) { drag = null; return; }
      begin(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });
    document.addEventListener('touchmove', e => { if (e.touches.length === 1) move(e.touches[0].clientX, e.touches[0].clientY); }, { passive: true });
    document.addEventListener('touchend', e => { if (e.changedTouches.length) finish(e.changedTouches[0].clientX); }, { passive: true });
    document.addEventListener('touchcancel', () => { if (drag && drag.moved) setOffset(0, true); drag = null; }, { passive: true });
    document.addEventListener('mousedown', e => { if (e.button === 0) begin(e.clientX, e.clientY, e.target); });
    document.addEventListener('mousemove', e => { if (drag && e.buttons & 1) move(e.clientX, e.clientY); });
    document.addEventListener('mouseup', e => finish(e.clientX));
    // 마우스로 끌고 놓았을 때 그 자리 버튼이 눌리지 않게
    document.addEventListener('click', e => { if (Date.now() < suppressClickUntil) { e.stopPropagation(); e.preventDefault(); } }, true);
  }

  function injectHomeCard(homeView) {
    const anchor = homeView.querySelector('#startBtn');
    if (!anchor) return;
    injectStyle();
    bindSwipe();
    const gate = window.GLASS ? GLASS.state() : 'open';
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = `nw-hint${gate === 'ready' ? ' ready' : ''}`;
    hint.innerHTML = gate === 'ready'
      ? '🎁 두뇌운동 완료! 유리를 깨 보세요<small>뉴스 · 라디오 · 유튜브 · 날씨가 기다려요</small>'
      : `📰 뉴스 · 📻 라디오 · ▶️ 유튜브 · ☀️ 날씨<small>${gate === 'locked' ? '🔒 두뇌운동을 마치면 열려요' : '눌러도 되고, 옆으로 밀어도 열려요'}</small>`;
    hint.addEventListener('click', () => openFeed('right'));
    anchor.parentNode.insertBefore(hint, anchor);
  }

  window.NEWS = { injectHomeCard, openFeed, leave: leaveFeed };
})();
