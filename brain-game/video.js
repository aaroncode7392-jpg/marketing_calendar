// ==========================================================
// 유튜브 탭: 정해 둔 채널들의 영상(채널마다 최근 100개 안팎)을 유튜브 홈처럼 섞어서 끝없이 내려 보게 한다.
// 순서 = 새 영상일수록 + 조회수가 많을수록 + 자주 본 채널일수록 위로, 약간의 무작위, 이미 본 영상은 아래로,
// 같은 채널이 연달아 나오지 않게 섞는다. 본 기록은 이 기기에만 남긴다.
// ==========================================================
(function () {
  const DATA_URL = 'assets/youtube-data.json';
  const CACHE_TTL = 3600e3;
  const PAGE = 12;
  const WATCH_KEY = 'ytWatched', AFF_KEY = 'ytAffinity', WATCH_CAP = 600;
  const DAY = 86400e3;
  const CAT_COLOR = { '건강': '#2FA28E', '지식·시사': '#3F6FB5', '추억·예능': '#D9779B', '요리': '#B7791F' };
  const CATS = ['전체', '건강', '지식·시사', '추억·예능', '요리'];

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  let cache = null; // { data, at }

  function readJson(key) {
    try { const v = JSON.parse(localStorage.getItem(key) || '{}'); return v && typeof v === 'object' ? v : {}; } catch (e) { return {}; }
  }
  function writeJson(key, v) { try { localStorage.setItem(key, JSON.stringify(v)); } catch (e) { /* 저장 못 해도 재생은 된다 */ } }

  // 저장 형식(v2: 채널 목록 + 짧은 항목)을 화면용 항목으로 바꾼다. 예전 형식도 읽는다.
  function normalize(raw) {
    const base = Date.parse(raw.updated) || Date.now();
    if (!Array.isArray(raw.channels)) {
      return raw.items.map(it => ({ ...it, views: 0, dur: null, ts: it.ts }));
    }
    return raw.items.map(it => {
      const ch = raw.channels[it.c] || {};
      return {
        id: it.id, cat: ch.cat, src: ch.name, title: it.t, views: it.v || 0, dur: it.d,
        ts: base - (it.a == null ? 30 : it.a) * DAY,
        img: `https://i.ytimg.com/vi/${it.id}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${it.id}`,
      };
    }).filter(it => /^[\w-]{11}$/.test(it.id) && it.title);
  }

  async function load() {
    if (cache && Date.now() - cache.at < CACHE_TTL) return cache.data;
    const res = await fetch(`${DATA_URL}?r=${Math.floor(Date.now() / 3600e3)}`, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const raw = await res.json();
    if (!raw || !Array.isArray(raw.items)) throw new Error('영상 형식 오류');
    const data = { updated: raw.updated, items: normalize(raw) };
    cache = { data, at: Date.now() };
    return data;
  }

  // ---------------- 추천 순서 ----------------
  function rank(items) {
    const watched = readJson(WATCH_KEY), aff = readJson(AFF_KEY);
    const maxAff = Math.max(1, ...Object.values(aff).filter(Number.isFinite));
    const now = Date.now();
    const scored = items.map(it => {
      const ageDays = Math.max(0, (now - it.ts) / DAY);
      const fresh = Math.exp(-ageDays / 45);                              // 새 영상일수록 (1 → 0)
      const pop = Math.min(1, Math.log10((it.views || 0) + 10) / 6.5);   // 조회수 1만≈0.6, 100만≈0.9
      const like = (aff[it.src] || 0) / maxAff;                           // 자주 본 채널
      let score = 1.2 * fresh + 1.0 * pop + 0.8 * like + Math.random() * 0.9;
      if (watched[it.id]) score -= 3;                                     // 본 영상은 맨 뒤로
      return { it, score };
    }).sort((a, b) => b.score - a.score);
    // 같은 채널이 두 번 연달아 나오지 않게 고른다
    const out = [], pool = scored;
    while (pool.length) {
      const recent = out.slice(-2).map(x => x.src);
      let i = pool.findIndex(p => !recent.includes(p.it.src));
      if (i < 0) i = 0;
      out.push(pool.splice(i, 1)[0].it);
    }
    return out;
  }

  function remember(it) {
    const watched = readJson(WATCH_KEY);
    watched[it.id] = Date.now();
    const ids = Object.keys(watched);
    if (ids.length > WATCH_CAP) ids.sort((a, b) => watched[a] - watched[b]).slice(0, ids.length - WATCH_CAP).forEach(k => delete watched[k]);
    writeJson(WATCH_KEY, watched);
    const aff = readJson(AFF_KEY);
    aff[it.src] = (aff[it.src] || 0) + 1;
    writeJson(AFF_KEY, aff);
  }

  // ---------------- 글자 ----------------
  function viewsText(v) {
    if (!v) return '';
    const f = (n, d) => String(Math.round(n * d) / d).replace(/\.0$/, '');
    if (v >= 1e8) return `조회수 ${f(v / 1e8, 10)}억회`;
    if (v >= 1e4) return `조회수 ${f(v / 1e4, v >= 1e5 ? 1 : 10)}만회`;
    if (v >= 1e3) return `조회수 ${f(v / 1e3, 10)}천회`;
    return `조회수 ${v}회`;
  }
  function agoText(ts) {
    const m = Math.max(1, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return `${m}분 전`;
    const h = Math.round(m / 60);
    if (h < 24) return `${h}시간 전`;
    const d = Math.round(h / 24);
    if (d < 7) return `${d}일 전`;
    if (d < 30) return `${Math.floor(d / 7)}주 전`;
    if (d < 365) return `${Math.floor(d / 30)}개월 전`;
    return `${Math.floor(d / 365)}년 전`;
  }
  const durText = s => (Number.isFinite(s) && s > 0 ? (s >= 3600 ? `${Math.floor(s / 3600)}:${String(Math.floor(s % 3600 / 60)).padStart(2, '0')}` : `${Math.floor(s / 60)}`) + `:${String(s % 60).padStart(2, '0')}` : '');
  const tagHtml = it => `<span class="nw-tag" style="background:${CAT_COLOR[it.cat] || '#7A6A5E'}">${esc(it.cat)}</span>`;

  function cardHtml(it, seen) {
    const dur = durText(it.dur);
    return `<a class="nw-card nw-vcard${seen ? ' read' : ''}" draggable="false" data-vid="${esc(it.id)}" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">
      <div class="nw-vthumb"><img draggable="false" src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"><span class="nw-play">▶</span>${dur ? `<span class="vd-dur">${dur}</span>` : ''}</div>
      <div class="nw-vtxt"><div class="nw-title">${esc(it.title)}</div><div class="nw-meta">${tagHtml(it)}${esc(it.src)}${it.views ? ` · ${viewsText(it.views)}` : ''} · ${agoText(it.ts)}${seen ? ' · 본 영상' : ''}</div></div>
    </a>`;
  }

  function injectStyle() {
    if (document.getElementById('videoStyle')) return;
    const st = document.createElement('style');
    st.id = 'videoStyle';
    st.textContent = `
      .vd-dur{position:absolute;right:8px;bottom:8px;background:rgba(0,0,0,.78);color:#fff;font-family:var(--tds,sans-serif);font-weight:700;font-size:14px;padding:3px 7px;border-radius:6px;}
      .nw-vcard .nw-title{margin:8px 0 4px;}
      .nw-vcard.read .nw-vthumb img{opacity:.6;}
      .vd-more{display:block;width:100%;border:0;border-radius:14px;background:#F2F4F6;color:#4E5968;font-family:var(--tds,sans-serif);font-weight:700;font-size:17px;padding:14px;margin:6px 0 10px;cursor:pointer;}
      .vd-head{display:flex;justify-content:space-between;align-items:center;margin:8px 0 2px;color:#6B7684;font-family:var(--tds,sans-serif);font-size:15px;}
      .vd-head button{border:0;border-radius:999px;background:#F2F4F6;color:#333D4B;font-family:inherit;font-weight:700;font-size:15px;padding:8px 14px;cursor:pointer;}
      .vd-player{width:100%;aspect-ratio:16/9;background:#000;}
      .vd-player iframe{width:100%;height:100%;border:0;display:block;}
    `;
    document.head.appendChild(st);
  }

  // ---------------- 목록 (끝없이 내려 보기) ----------------
  function mount(el, cat = '전체') {
    injectStyle();
    el.innerHTML = '<div class="nw-note">영상을 불러오는 중이에요…</div>';
    load().then(data => {
      if (!el.isConnected) return;
      const pool = cat === '전체' ? data.items : data.items.filter(it => it.cat === cat);
      if (!pool.length) { el.innerHTML = '<div class="nw-note">지금은 보여드릴 영상이 없어요.</div>'; return; }
      let order = rank(pool), shown = 0, observer = null;
      el.innerHTML = `<div class="vd-head"><span>영상 ${pool.length}개 · 볼 때마다 새로 섞여요</span><button type="button" class="vd-shuffle">🔄 새로 섞기</button></div><div class="vd-list"></div>`;
      const listEl = el.querySelector('.vd-list');
      const more = () => {
        const watched = readJson(WATCH_KEY);
        const next = order.slice(shown, shown + PAGE);
        shown += next.length;
        const old = listEl.querySelector('.vd-more'); if (old) old.remove();
        listEl.insertAdjacentHTML('beforeend', next.map(it => cardHtml(it, !!watched[it.id])).join(''));
        if (shown < order.length) {
          listEl.insertAdjacentHTML('beforeend', '<button type="button" class="vd-more">영상 더 보기</button>');
          const btn = listEl.querySelector('.vd-more');
          if (observer) observer.disconnect();
          if ('IntersectionObserver' in window) {
            observer = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting) && btn.isConnected) more(); }, { rootMargin: '700px 0px' });
            observer.observe(btn);
          }
        } else {
          if (observer) observer.disconnect();
          listEl.insertAdjacentHTML('beforeend', '<div class="nw-note">여기까지 다 봤어요 👏 "새로 섞기"를 누르면 처음부터 다시 섞어요.</div>');
        }
      };
      el.addEventListener('click', e => {
        if (e.target.closest('.vd-more')) { more(); return; }
        if (e.target.closest('.vd-shuffle')) { order = rank(pool); shown = 0; listEl.innerHTML = ''; more(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
        const a = e.target.closest('.nw-vcard'); if (!a) return;
        e.preventDefault();
        const it = pool.find(x => x.id === a.dataset.vid);
        if (!it) return;
        remember(it);
        a.classList.add('read');
        open(it);
      });
      more();
    }).catch(() => {
      if (el.isConnected) el.innerHTML = '<div class="nw-note">지금은 유튜브를 불러올 수 없어요.<br>잠시 뒤에 다시 눌러 주세요.</div>';
    });
  }

  // ---------------- 재생 ----------------
  let apiPromise = null;
  function loadYtApi() {
    if (window.YT && window.YT.Player) return Promise.resolve();
    if (!apiPromise) {
      apiPromise = new Promise((resolve, reject) => {
        const prev = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => { if (typeof prev === 'function') prev(); resolve(); };
        const sc = document.createElement('script');
        sc.src = 'https://www.youtube.com/iframe_api';
        sc.onerror = () => { apiPromise = null; reject(new Error('유튜브 플레이어를 못 불러옴')); };
        document.head.appendChild(sc);
        setTimeout(() => reject(new Error('시간 초과')), 8000);
      });
    }
    return apiPromise;
  }

  function open(it) {
    if (document.getElementById('nwReader')) return;
    if (window.RADIO) RADIO.stop();
    const r = document.createElement('div');
    r.id = 'nwReader';
    r.className = 'nw-reader nw-video';
    r.innerHTML = `
      <div class="nw-vbar">
        <button id="nwClose" type="button">← 닫기</button>
        <div class="sp">${esc(it.src)}</div>
        <a href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">유튜브 ↗</a>
      </div>
      <div class="vd-player"><div id="vdPlayer"></div></div>
      <div class="nw-vinfo">
        <div class="nw-meta">${tagHtml(it)}${esc(it.src)}${it.views ? ` · ${viewsText(it.views)}` : ''} · ${agoText(it.ts)}</div>
        <div class="nw-title">${esc(it.title)}</div>
        <div id="vdBlocked"></div>
      </div>`;
    document.body.appendChild(r);
    document.body.style.overflow = 'hidden';
    history.pushState({ nwReader: 1 }, '');
    r.querySelector('#nwClose').addEventListener('click', () => { if (history.state && history.state.nwReader) history.back(); else { r.remove(); document.body.style.overflow = ''; } });

    // 채널 주인이 앱 안 재생을 막아 둔 영상이면 유튜브로 보내는 버튼을 보여준다
    const blocked = () => {
      const p = r.querySelector('.vd-player'); if (p) p.remove();
      r.querySelector('#vdBlocked').innerHTML = `<div class="nw-note">이 영상은 앱 안에서 볼 수 없어요.</div><a class="nw-vbtn" href="${esc(it.url)}" target="_blank" rel="noopener noreferrer">▶ 유튜브에서 보기</a>`;
    };
    const plainIframe = () => {
      const holder = r.querySelector('#vdPlayer'); if (!holder) return;
      holder.outerHTML = `<iframe allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin" src="https://www.youtube.com/embed/${encodeURIComponent(it.id)}?autoplay=1&playsinline=1&rel=0"></iframe>`;
    };
    loadYtApi().then(() => {
      if (!r.isConnected || !r.querySelector('#vdPlayer')) return;
      new window.YT.Player('vdPlayer', {
        videoId: it.id, width: '100%', height: '100%',
        playerVars: { autoplay: 1, playsinline: 1, rel: 0 },
        events: { onError: e => { if ([2, 5, 100, 101, 150].includes(e.data)) blocked(); } },
      });
    }).catch(plainIframe);
  }

  window.VIDEO = { CATS, mount, rank, load };
})();
