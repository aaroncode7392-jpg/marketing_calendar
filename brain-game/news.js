// ==========================================================
// 오늘의 소식 (신문처럼 보는 뉴스 + 라디오)
// 매일 아침 GitHub Actions가 assets/news-data.json 한 파일을 통째로 덮어쓰므로 어제 기사는 저절로 사라진다.
// 기기에는 "읽은 기사 표시"만 오늘 기사 번호 기준으로 잠깐 저장하고, 날이 바뀌면 같이 지워진다.
// ==========================================================
(function () {
  const DATA_URL = 'assets/news-data.json';
  const READ_KEY = 'newsRead';
  const STALE_DAYS = 3;
  const CATS = ['전체', '건강', '문화·생활', '스포츠', '정치', '경제', '기독교'];
  const VIDEO_URL = 'assets/youtube-data.json';
  const VCATS = ['전체', '건강', '지식·시사', '추억·예능', '요리'];
  const CAT_COLOR = { '건강': '#2FA28E', '문화·생활': '#D9779B', '스포츠': '#EE7B5B', '정치': '#3F6FB5', '경제': '#B7791F', '기독교': '#6B5B95', '지식·시사': '#3F6FB5', '추억·예능': '#D9779B', '요리': '#B7791F' };

  let cache = null, vcache = null;

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
    if (cache) return cache;
    const res = await fetch(`${DATA_URL}?r=${Math.floor(Date.now() / 3600e3)}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) throw new Error('뉴스 형식 오류');
    cache = data;
    return data;
  }

  async function loadVideos() {
    if (vcache) return vcache;
    const res = await fetch(`${VIDEO_URL}?r=${Math.floor(Date.now() / 3600e3)}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data || !Array.isArray(data.items)) throw new Error('영상 형식 오류');
    vcache = data;
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
    const st = document.createElement('style');
    st.id = 'newsStyle';
    st.textContent = `
      .nw-paper{background:#fff;border:2px solid var(--line);border-radius:18px;box-shadow:0 6px 18px rgba(0,0,0,.08);overflow:hidden;margin-bottom:14px;}
      .nw-mast{position:relative;padding:14px 16px 10px;border-bottom:4px double var(--ink);text-align:center;}
      .nw-back{position:absolute;left:12px;top:12px;border:2px solid var(--line);background:#fff;font-family:'Jua';font-size:18px;border-radius:12px;padding:8px 12px;cursor:pointer;color:var(--ink);}
      .nw-logo{font-family:'Jua';font-size:34px;line-height:1.1;letter-spacing:2px;padding-top:36px;white-space:nowrap;}
      .nw-date{font-size:16px;color:var(--ink-soft);margin-top:4px;}
      .nw-tabs{display:flex;border-bottom:2px solid var(--line);}
      .nw-tab{flex:1;border:0;background:#fff;font-family:'Jua';font-size:21px;padding:12px 0;color:var(--ink-soft);cursor:pointer;border-bottom:4px solid transparent;margin-bottom:-2px;}
      .nw-tab.on{color:var(--ink);border-bottom-color:var(--ink);}
      .nw-chips{display:flex;flex-wrap:wrap;justify-content:center;gap:0 4px;padding:2px 8px 0;border-bottom:1px solid var(--line);}
      .nw-chip{flex:0 0 auto;border:0;background:none;font-family:'Jua';font-size:18px;padding:10px 12px;color:var(--ink-soft);cursor:pointer;border-bottom:3px solid transparent;}
      .nw-chip.on{color:var(--ink);border-bottom-color:#E8635B;}
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
      .nw-play{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%);width:56px;height:56px;border-radius:50%;background:rgba(0,0,0,.6);color:#fff;font-size:26px;display:flex;align-items:center;justify-content:center;padding-left:4px;pointer-events:none;}
      .nw-lead .nw-play{top:42%;width:68px;height:68px;font-size:32px;}
      .nw-tw{position:relative;flex:0 0 120px;width:120px;height:68px;align-self:center;}
      .nw-tw .nw-thumb{width:120px;height:68px;flex-basis:120px;}
      .nw-tw .nw-play{width:34px;height:34px;font-size:16px;padding-left:2px;}
      .nw-video{background:#111;}
      .nw-vbar{display:flex;align-items:center;gap:8px;padding:10px 12px;background:#111;}
      .nw-vbar button,.nw-vbar a{font-family:'Jua';font-size:18px;padding:10px 14px;border-radius:12px;border:0;background:#fff;color:var(--ink);text-decoration:none;cursor:pointer;white-space:nowrap;}
      .nw-vbar .sp{flex:1;min-width:0;font-size:14px;color:#ccc;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .nw-vframe{width:100%;aspect-ratio:16/9;border:0;background:#000;display:block;}
      .nw-vinfo{flex:1;overflow:auto;background:#fff;padding:16px;}
      .nw-vinfo .nw-title{font-size:23px;-webkit-line-clamp:unset;display:block;}
      .nw-vbtn{display:block;text-align:center;font-family:'Jua';font-size:22px;background:#E8635B;color:#fff;border-radius:14px;padding:16px;margin-top:14px;text-decoration:none;}
      .nw-note{text-align:center;color:var(--ink-soft);font-size:16px;padding:12px 0 4px;}
      .nw-hint{display:block;width:100%;text-align:center;color:var(--ink);font-size:19px;margin:2px 0 12px;padding:12px 10px;font-family:'Jua';background:#fff;border:2px solid var(--line);border-radius:16px;box-shadow:0 4px 10px rgba(0,0,0,.06);cursor:pointer;}
      .nw-hint small{display:block;font-family:'Gowun Dodum',sans-serif;font-size:15px;color:var(--ink-soft);margin-top:2px;}
      .nw-from-r{animation:nwInR .3s ease both;} .nw-from-l{animation:nwInL .3s ease both;}
      @keyframes nwInR{from{opacity:0;transform:translateX(60px);}to{opacity:1;transform:none;}}
      @keyframes nwInL{from{opacity:0;transform:translateX(-60px);}to{opacity:1;transform:none;}}
      .nw-reader{position:fixed;inset:0;z-index:300;background:#fff;display:flex;flex-direction:column;animation:nwInR .25s ease both;}
      .nw-bar{display:flex;align-items:center;gap:8px;padding:10px 12px;border-bottom:2px solid var(--line);background:var(--cream);}
      .nw-bar button,.nw-bar a{font-family:'Jua';font-size:18px;padding:10px 14px;border-radius:12px;border:2px solid var(--line);background:#fff;color:var(--ink);text-decoration:none;cursor:pointer;white-space:nowrap;}
      .nw-bar .sp{flex:1;min-width:0;font-size:14px;color:var(--ink-soft);overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
      .nw-frame{flex:1;width:100%;border:0;background:#fff;}
      .nw-tip{font-size:14px;color:var(--ink-soft);text-align:center;padding:6px 10px;background:var(--cream);}
    `;
    document.head.appendChild(st);
  }

  const tagHtml = it => `<span class="nw-tag" style="background:${CAT_COLOR[it.cat] || '#7A6A5E'}">${esc(it.cat)}</span>`;
  const metaHtml = (it, isRead) => `${esc(it.src)} · ${esc(ago(it.ts))}${isRead ? ' · 읽음' : ''}`;

  function leadHtml(it, isRead, video) {
    return `<a class="nw-card nw-lead${isRead ? ' read' : ''}" draggable="false" data-id="${esc(it.id)}" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">
      <img class="nw-img" draggable="false" src="${esc(it.img)}" alt="" referrerpolicy="no-referrer" onerror="this.remove()">
      ${video ? '<span class="nw-play">▶</span>' : ''}<div class="nw-ov">${tagHtml(it)}<div class="nw-title">${esc(it.title)}</div><div class="nw-meta">${metaHtml(it, isRead)}</div></div>
    </a>`;
  }
  function rowHtml(it, isRead, video) {
    const img = it.img ? `<img class="nw-thumb" draggable="false" src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    const thumb = video && img ? `<div class="nw-tw">${img}<span class="nw-play">▶</span></div>` : img;
    return `<a class="nw-card nw-row${isRead ? ' read' : ''}" draggable="false" data-id="${esc(it.id)}" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">
      <div class="nw-txt"><div class="nw-meta">${tagHtml(it)}</div><div class="nw-title">${esc(it.title)}</div><div class="nw-meta">${metaHtml(it, isRead)}</div></div>
      ${thumb}
    </a>`;
  }

  function leaveFeed() {
    if (window.RADIO) RADIO.stop();
    renderHome();
  }

  function openFeed(dir, startTab) {
    injectStyle();
    const root = document.getElementById('app');
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = dir === 'left' ? 'nw-from-l' : 'nw-from-r';
    wrap.style.paddingBottom = '70px';
    wrap.innerHTML = `
      <div class="nw-paper">
        <div class="nw-mast">
          <button class="nw-back" id="nwBack">← 홈</button>
          <div class="nw-logo">오늘의 소식</div>
          <div class="nw-date">${esc(todayText())}</div>
        </div>
        <div class="nw-tabs"><button class="nw-tab on" data-t="news">📰 뉴스</button><button class="nw-tab" data-t="video">▶ 영상</button><button class="nw-tab" data-t="radio">📻 라디오</button></div>
        <div class="nw-chips" id="nwChips"></div>
        <div class="nw-body" id="nwList"><div class="nw-note">불러오는 중이에요…</div></div>
      </div>
      <div id="nwMini"></div>`;
    root.appendChild(wrap);
    window.scrollTo(0, 0);
    wrap.querySelector('#nwBack').addEventListener('click', leaveFeed);
    if (window.RADIO) RADIO.mountMini(wrap.querySelector('#nwMini'));

    const list = wrap.querySelector('#nwList');
    const chips = wrap.querySelector('#nwChips');
    let tab = 'news', data = null, vdata = null, read = new Set();
    const cats = { news: '전체', video: '전체' };
    const failNote = what => `<div class="nw-note">지금은 ${what}을 불러올 수 없어요.<br>잠시 뒤에 다시 눌러 주세요.</div>`;

    const listHtml = (items, video) => {
      const leadIdx = items.findIndex(it => it.img);
      const html = items.map((it, i) => (i === leadIdx ? leadHtml(it, !video && read.has(it.id), video) : rowHtml(it, !video && read.has(it.id), video)));
      if (leadIdx > 0) html.unshift(html.splice(leadIdx, 1)[0]);
      return html.join('');
    };
    const paintNews = () => {
      if (!data) return;
      const items = cats.news === '전체' ? interleave(data.items) : data.items.filter(it => it.cat === cats.news);
      const stale = Date.now() - Date.parse(data.updated) > STALE_DAYS * 86400e3;
      list.innerHTML = (stale ? '<div class="nw-note">⚠️ 며칠째 새 소식이 오지 않았어요.</div>' : '')
        + (items.length ? listHtml(items, false) : '<div class="nw-note">지금은 보여드릴 소식이 없어요.</div>')
        + '<div class="nw-note">누르면 앱 안에서 기사가 열려요. 소식은 매일 아침 새로 바뀌어요.</div>';
    };
    const paintVideos = () => {
      if (!vdata) return;
      const items = cats.video === '전체' ? interleave(vdata.items, 'src', [...new Set(vdata.items.map(v => v.src))]) : vdata.items.filter(it => it.cat === cats.video);
      list.innerHTML = (items.length ? listHtml(items, true) : '<div class="nw-note">지금은 보여드릴 영상이 없어요.</div>')
        + '<div class="nw-note">누르면 앱 안에서 영상이 재생돼요.</div>';
    };
    const paint = () => {
      wrap.querySelectorAll('.nw-tab').forEach(x => x.classList.toggle('on', x.dataset.t === tab));
      chips.style.display = tab === 'radio' ? 'none' : '';
      if (tab !== 'radio') {
        const set = tab === 'news' ? CATS : VCATS;
        chips.innerHTML = set.map(c => `<button class="nw-chip${c === cats[tab] ? ' on' : ''}" data-c="${esc(c)}">${esc(c)}</button>`).join('');
      }
      if (tab === 'radio') {
        if (window.RADIO) RADIO.mountStations(list); else list.innerHTML = '<div class="nw-note">라디오를 불러올 수 없어요.</div>';
      } else if (tab === 'news') {
        if (data) paintNews(); else list.innerHTML = '<div class="nw-note">불러오는 중이에요…</div>';
      } else if (vdata) {
        paintVideos();
      } else {
        list.innerHTML = '<div class="nw-note">불러오는 중이에요…</div>';
        loadVideos().then(v => { vdata = v; if (tab === 'video') paintVideos(); })
          .catch(() => { if (tab === 'video') list.innerHTML = failNote('영상'); });
      }
    };

    wrap.querySelector('.nw-tabs').addEventListener('click', e => {
      const b = e.target.closest('.nw-tab'); if (!b || b.dataset.t === tab) return;
      tab = b.dataset.t; paint();
    });
    chips.addEventListener('click', e => {
      const b = e.target.closest('.nw-chip'); if (!b) return;
      cats[tab] = b.dataset.c;
      chips.querySelectorAll('.nw-chip').forEach(x => x.classList.toggle('on', x === b));
      if (tab === 'news') paintNews(); else paintVideos();
    });
    list.addEventListener('click', e => {
      const a = e.target.closest('.nw-card'); if (!a) return;
      if (tab === 'video') {
        e.preventDefault();
        openVideo(vdata && vdata.items.find(it => it.id === a.dataset.id));
        return;
      }
      if (!data) return;
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

  // 영상을 앱 안에서 재생 (채널이 앱 안 재생을 막아 둔 영상은 유튜브 링크로 안내)
  function openVideo(it) {
    if (!it || document.getElementById('nwReader')) return;
    if (window.RADIO) RADIO.stop();
    const r = document.createElement('div');
    r.id = 'nwReader';
    r.className = 'nw-reader nw-video';
    r.innerHTML = `
      <div class="nw-vbar">
        <button id="nwClose">← 닫기</button>
        <div class="sp">${esc(it.src)}</div>
        <a href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">유튜브 ↗</a>
      </div>
      ${it.embed ? '<iframe class="nw-vframe" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe>' : ''}
      <div class="nw-vinfo">
        <div class="nw-meta">${tagHtml(it)} ${esc(it.src)} · ${esc(ago(it.ts))}</div>
        <div class="nw-title">${esc(it.title)}</div>
        ${it.embed ? '' : `<div class="nw-note">이 영상은 앱 안에서 볼 수 없어요.</div><a class="nw-vbtn" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">▶ 유튜브에서 보기</a>`}
      </div>`;
    document.body.appendChild(r);
    const f = r.querySelector('iframe');
    if (f) f.src = `https://www.youtube.com/embed/${encodeURIComponent(it.id)}?autoplay=1&playsinline=1&rel=0`;
    document.body.style.overflow = 'hidden';
    history.pushState({ nwReader: 1 }, '');
    r.querySelector('#nwClose').addEventListener('click', () => { if (history.state && history.state.nwReader) history.back(); else closeReader(); });
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

  // 첫 화면에서 좌우로 밀면 소식이 열리고, 소식에서 오른쪽으로 밀면 홈으로 돌아간다
  const SWIPE_MIN = 70, SWIPE_MAX_Y = 60, SWIPE_MAX_MS = 700;
  let touch = null, bound = false;
  const onHome = () => !!document.getElementById('startBtn') && !document.querySelector('.overlay') && !document.getElementById('nwReader');
  const onFeed = () => !!document.getElementById('nwBack') && !document.getElementById('nwReader');
  function bindSwipe() {
    if (bound) return; bound = true;
    const begin = (x, y, target) => {
      touch = { x, y, at: Date.now(), skip: !!(target.closest && target.closest('#nwChips, input, textarea')) };
    };
    function finish(cx, cy) {
      const s0 = touch; touch = null;
      if (!s0 || s0.skip) return;
      const dx = cx - s0.x, dy = cy - s0.y;
      if (Math.abs(dx) < SWIPE_MIN || Math.abs(dy) > SWIPE_MAX_Y || Math.abs(dx) < Math.abs(dy) * 1.5 || Date.now() - s0.at > SWIPE_MAX_MS) return;
      if (onHome()) openFeed(dx < 0 ? 'right' : 'left');
      else if (onFeed() && dx > 0) leaveFeed();
    }
    document.addEventListener('touchstart', e => {
      if (e.touches.length !== 1) { touch = null; return; }
      begin(e.touches[0].clientX, e.touches[0].clientY, e.target);
    }, { passive: true });
    document.addEventListener('touchend', e => { if (e.changedTouches.length) finish(e.changedTouches[0].clientX, e.changedTouches[0].clientY); }, { passive: true });
    document.addEventListener('touchcancel', () => { touch = null; }, { passive: true });
    document.addEventListener('mousedown', e => begin(e.clientX, e.clientY, e.target));
    document.addEventListener('mouseup', e => finish(e.clientX, e.clientY));
  }

  function injectHomeCard(homeView) {
    const anchor = homeView.querySelector('#startBtn');
    if (!anchor) return;
    injectStyle();
    bindSwipe();
    const hint = document.createElement('button');
    hint.type = 'button';
    hint.className = 'nw-hint';
    hint.innerHTML = '📰 소식 · ▶ 영상 · 📻 라디오<small>눌러도 되고, 옆으로 밀어도 열려요</small>';
    hint.addEventListener('click', () => openFeed('right'));
    anchor.parentNode.insertBefore(hint, anchor);
  }

  window.NEWS = { injectHomeCard, openFeed };
})();
