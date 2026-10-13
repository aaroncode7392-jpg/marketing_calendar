// ==========================================================
// 오늘의 소식 (피들리처럼 카드로 넘겨 보는 뉴스)
// 매일 아침 GitHub Actions가 assets/news-data.json 한 파일을 통째로 덮어쓰므로 어제 기사는 저절로 사라진다.
// 기기에는 "읽은 기사 표시"만 오늘 기사 번호 기준으로 잠깐 저장하고, 날이 바뀌면 같이 지워진다.
// ==========================================================
(function () {
  const DATA_URL = 'assets/news-data.json';
  const READ_KEY = 'newsRead';
  const STALE_DAYS = 3;
  const CATS = ['전체', '건강', '문화·생활', '스포츠'];

  let cache = null;

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

  function ago(ts) {
    const m = Math.max(0, Math.round((Date.now() - ts) / 60000));
    if (m < 60) return `${Math.max(1, m)}분 전`;
    const h = Math.round(m / 60);
    return h < 24 ? `${h}시간 전` : `${Math.round(h / 24)}일 전`;
  }
  const safeUrl = u => (/^https:\/\//.test(u) ? u : '#');

  function injectStyle() {
    if (document.getElementById('newsStyle')) return;
    const st = document.createElement('style');
    st.id = 'newsStyle';
    st.textContent = `
      .nw-chips{display:flex;gap:8px;overflow-x:auto;padding:4px 2px 10px;margin:0 -2px;scrollbar-width:none;}
      .nw-chips::-webkit-scrollbar{display:none;}
      .nw-chip{flex:0 0 auto;border:2px solid var(--line);background:#fff;color:var(--ink);font-family:'Jua';font-size:18px;padding:8px 16px;border-radius:999px;cursor:pointer;}
      .nw-chip.on{background:#2FA28E;border-color:#2FA28E;color:#fff;}
      .nw-card{display:block;background:#fff;border:2px solid var(--line);border-radius:18px;overflow:hidden;margin-bottom:14px;text-decoration:none;color:var(--ink);box-shadow:0 4px 12px rgba(0,0,0,.06);}
      .nw-card.read{opacity:.55;}
      .nw-img{width:100%;height:170px;object-fit:cover;display:block;background:#EFE6D3;}
      .nw-body{padding:14px 16px 16px;}
      .nw-meta{font-size:15px;color:var(--ink-soft);margin-bottom:6px;}
      .nw-title{font-family:'Jua';font-size:22px;line-height:1.4;margin:0 0 6px;word-break:keep-all;}
      .nw-desc{font-size:17px;line-height:1.55;color:var(--ink-soft);display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;word-break:keep-all;}
      .nw-note{text-align:center;color:var(--ink-soft);font-size:16px;padding:10px 0 4px;}
    `;
    document.head.appendChild(st);
  }

  function cardHtml(it, isRead) {
    const img = it.img ? `<img class="nw-img" src="${esc(it.img)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()">` : '';
    return `<a class="nw-card${isRead ? ' read' : ''}" data-id="${esc(it.id)}" href="${esc(safeUrl(it.url))}" target="_blank" rel="noopener noreferrer">
      ${img}
      <div class="nw-body">
        <div class="nw-meta">${esc(it.src)} · ${esc(ago(it.ts))}${isRead ? ' · 읽음' : ''}</div>
        <div class="nw-title">${esc(it.title)}</div>
        ${it.desc ? `<div class="nw-desc">${esc(it.desc)}</div>` : ''}
      </div>
    </a>`;
  }

  function openFeed() {
    injectStyle();
    const root = document.getElementById('app');
    root.innerHTML = '';
    const wrap = document.createElement('div');
    wrap.className = 'fade';
    wrap.innerHTML = `
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
        <button class="btn btn-ghost" id="nwBack" style="margin:0;width:auto;padding:10px 16px;font-size:18px;">← 돌아가기</button>
        <div style="font-family:'Jua';font-size:26px;">📰 오늘의 소식</div>
      </div>
      <div class="nw-chips" id="nwChips">${CATS.map((c, i) => `<button class="nw-chip${i ? '' : ' on'}" data-c="${esc(c)}">${esc(c)}</button>`).join('')}</div>
      <div id="nwList"><div class="nw-note">불러오는 중이에요…</div></div>`;
    root.appendChild(wrap);
    window.scrollTo(0, 0);
    wrap.querySelector('#nwBack').addEventListener('click', () => renderHome());

    load().then(data => {
      const read = readSet(data.updated);
      const list = wrap.querySelector('#nwList');
      let cat = '전체';
      const paint = () => {
        const items = data.items.filter(it => cat === '전체' || it.cat === cat);
        const stale = Date.now() - Date.parse(data.updated) > STALE_DAYS * 86400e3;
        list.innerHTML = (stale ? '<div class="nw-note">⚠️ 며칠째 새 소식이 오지 않았어요.</div>' : '')
          + (items.length ? items.map(it => cardHtml(it, read.has(it.id))).join('') : '<div class="nw-note">지금은 보여드릴 소식이 없어요.</div>')
          + '<div class="nw-note">누르면 기사 원문이 열려요. 소식은 매일 아침 새로 바뀌어요.</div>';
      };
      paint();
      wrap.querySelector('#nwChips').addEventListener('click', e => {
        const b = e.target.closest('.nw-chip'); if (!b) return;
        cat = b.dataset.c;
        wrap.querySelectorAll('.nw-chip').forEach(x => x.classList.toggle('on', x === b));
        paint();
      });
      list.addEventListener('click', e => {
        const a = e.target.closest('.nw-card'); if (!a) return;
        read.add(a.dataset.id); markRead(data.updated, read);
        a.classList.add('read');
      });
    }).catch(() => {
      wrap.querySelector('#nwList').innerHTML = '<div class="nw-note">지금은 소식을 불러올 수 없어요.<br>잠시 뒤에 다시 눌러 주세요.</div>';
    });
  }

  function injectHomeCard(homeView) {
    const anchor = homeView.querySelector('#startBtn');
    if (!anchor) return;
    injectStyle();
    const btn = document.createElement('button');
    btn.className = 'btn btn-ghost';
    btn.id = 'newsBtn';
    btn.style.cssText = 'font-size:20px;margin-top:12px;';
    btn.textContent = '📰 오늘의 소식 보기';
    const lib = homeView.querySelector('#myCardsBtn');
    if (lib) lib.parentNode.insertBefore(btn, lib); else anchor.parentNode.appendChild(btn);
    btn.addEventListener('click', openFeed);
  }

  window.NEWS = { injectHomeCard, openFeed };
})();
