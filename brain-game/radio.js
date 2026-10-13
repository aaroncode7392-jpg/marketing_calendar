// ==========================================================
// 라디오 (극동방송 · CBS · KBS · YTN · 국악방송 실시간 듣기)
// 스트림은 각 방송사가 공개한 HLS 주소를 그대로 재생한다. KBS는 주소에 유효기간이 있어 들을 때마다 새로 받아온다.
// 사파리/안드로이드는 기기 기능으로, 그 외 브라우저는 hls.js(cdnjs)로 재생한다.
// ==========================================================
(function () {
  const HLS_SRC = 'https://cdnjs.cloudflare.com/ajax/libs/hls.js/1.5.13/hls.min.js';
  const KBS_API = 'https://cfpwwwapi.kbs.co.kr/api/v1/landing/live/channel_code/';
  // 아이폰이 "눌러서 시작한 소리"로 인정하도록, 누르는 순간 무음 파일을 먼저 재생해 둔다
  const SILENCE = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAABErAAABAAgAZGF0YQAAAAA=';

  const STATIONS = [
    { id: 'febc', group: '기독교 방송', emoji: '✝️', name: '극동방송', desc: '서울 FM 106.9 · 찬양과 말씀', url: 'https://mlive3.febc.net/live5/seoulfm/playlist.m3u8' },
    { id: 'cbs', group: '기독교 방송', emoji: '🙏', name: 'CBS 기독교방송', desc: '표준FM 98.1 · 뉴스와 말씀', url: 'https://m-aac.cbs.co.kr/mweb_cbs981/_definst_/cbs981.stream/playlist.m3u8' },
    { id: 'cbsm', group: '기독교 방송', emoji: '🎼', name: 'CBS 음악FM', desc: '93.9 · 잔잔한 찬양과 음악', url: 'https://m-aac.cbs.co.kr/mweb_cbs939/_definst_/cbs939.stream/playlist.m3u8' },
    { id: 'kbs1', group: '뉴스·교양', emoji: '📻', name: 'KBS 1라디오', desc: '뉴스, 시사, 건강 정보', kbs: 21 },
    { id: 'ytn', group: '뉴스·교양', emoji: '🗞️', name: 'YTN 라디오', desc: '뉴스 전문', url: 'https://radiolive.ytn.co.kr/radio/_definst_/20211118_fmlive/playlist.m3u8' },
    { id: 'kbs2', group: '음악', emoji: '🎤', name: 'KBS 해피FM', desc: '옛 노래와 트로트, 사연', kbs: 22 },
    { id: 'kbsc', group: '음악', emoji: '🎻', name: 'KBS 클래식FM', desc: '편안한 클래식', kbs: 24 },
    { id: 'gugak', group: '음악', emoji: '🥁', name: '국악방송', desc: '국악과 민요', url: 'https://mgugaklive.nowcdn.co.kr/gugakradio/gugakradio.stream/playlist.m3u8' },
  ];

  const esc = s => String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  let audio = null, hls = null, hlsLoading = null, seq = 0;
  let state = { id: null, status: 'idle' }; // idle | loading | playing | error
  const views = new Set();

  function getAudio() {
    if (audio) return audio;
    audio = document.createElement('audio');
    audio.setAttribute('playsinline', '');
    audio.preload = 'none';
    audio.style.display = 'none';
    document.body.appendChild(audio);
    audio.addEventListener('playing', () => set({ status: 'playing' }));
    audio.addEventListener('waiting', () => { if (state.id) set({ status: 'loading' }); });
    audio.addEventListener('error', () => { if (state.id && audio.src && !audio.src.startsWith('data:')) fail(); });
    return audio;
  }

  function set(patch) {
    state = { ...state, ...patch };
    for (const v of [...views]) { if (!v.el.isConnected) views.delete(v); else v.render(); }
    updateMediaSession();
  }
  const current = () => STATIONS.find(s => s.id === state.id) || null;

  function updateMediaSession() {
    if (!('mediaSession' in navigator)) return;
    const st = current();
    try {
      navigator.mediaSession.metadata = st ? new MediaMetadata({ title: st.name, artist: '오늘의 두뇌 운동 라디오' }) : null;
      navigator.mediaSession.setActionHandler('pause', () => stop());
      navigator.mediaSession.setActionHandler('stop', () => stop());
    } catch (e) { /* 지원하지 않는 기기에서는 생략 */ }
  }

  function loadHls() {
    if (window.Hls) return Promise.resolve();
    if (!hlsLoading) {
      hlsLoading = new Promise((resolve, reject) => {
        const sc = document.createElement('script');
        sc.src = HLS_SRC;
        sc.onload = resolve;
        sc.onerror = () => { hlsLoading = null; reject(new Error('hls.js 로드 실패')); };
        document.head.appendChild(sc);
      });
    }
    return hlsLoading;
  }

  async function resolveUrl(st) {
    if (!st.kbs) return st.url;
    const res = await fetch(KBS_API + st.kbs, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const url = data && data.channel_item && data.channel_item[0] && data.channel_item[0].service_url;
    if (!url || !/^https:\/\//.test(url)) throw new Error('방송 주소 없음');
    return url;
  }

  function detach() {
    if (hls) { hls.destroy(); hls = null; }
    if (audio) { audio.pause(); audio.removeAttribute('src'); audio.load(); }
  }

  function fail() {
    seq++;
    detach();
    set({ status: 'error' });
  }

  async function play(id) {
    const st = STATIONS.find(s => s.id === id);
    if (!st) return;
    const my = ++seq;
    const a = getAudio();
    detach();
    set({ id, status: 'loading' });
    a.src = SILENCE;
    a.play().catch(() => { /* 무음 재생 실패는 무시 */ });
    try {
      const url = await resolveUrl(st);
      if (my !== seq) return;
      if (a.canPlayType('application/vnd.apple.mpegurl')) {
        a.src = url;
      } else {
        await loadHls();
        if (my !== seq) return;
        if (!window.Hls || !window.Hls.isSupported()) throw new Error('이 브라우저는 라디오를 지원하지 않아요');
        hls = new window.Hls({ lowLatencyMode: false });
        hls.on(window.Hls.Events.ERROR, (_e, d) => { if (d && d.fatal && my === seq) fail(); });
        hls.loadSource(url);
        hls.attachMedia(a);
      }
      await a.play();
    } catch (e) {
      if (my === seq) fail();
    }
  }

  function stop() {
    seq++;
    detach();
    state = { id: null, status: 'idle' };
    for (const v of [...views]) { if (!v.el.isConnected) views.delete(v); else v.render(); }
    updateMediaSession();
  }

  function injectStyle() {
    if (document.getElementById('radioStyle')) return;
    const st = document.createElement('style');
    st.id = 'radioStyle';
    st.textContent = `
      .rd-group{font-family:'Jua';font-size:20px;margin:18px 2px 8px;color:var(--ink);}
      .rd-card{display:flex;align-items:center;gap:12px;width:100%;text-align:left;background:#fff;border:2px solid var(--line);border-radius:16px;padding:14px;margin-bottom:10px;cursor:pointer;font-family:inherit;color:var(--ink);}
      .rd-card.on{border-color:#3182F6;background:#EBF3FE;}
      .rd-card.err{border-color:#E8635B;background:#FFF1EF;}
      .rd-emoji{font-size:30px;flex:0 0 auto;width:40px;text-align:center;}
      .rd-txt{flex:1;min-width:0;}
      .rd-txt b{display:block;font-family:'Jua';font-size:21px;font-weight:400;}
      .rd-txt small{display:block;font-size:16px;color:var(--ink-soft);margin-top:2px;}
      .rd-btn{flex:0 0 auto;font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-weight:700;font-size:17px;min-width:84px;text-align:center;padding:12px 14px;border-radius:14px;background:#3182F6;color:#fff;}
      .rd-card.on .rd-btn{background:#F04452;}
      .rd-card.err .rd-btn{background:#D9952A;}
      .rd-mini{position:fixed;left:0;right:0;bottom:0;z-index:250;display:flex;align-items:center;gap:10px;padding:12px 16px calc(12px + env(safe-area-inset-bottom));background:#2F2A26;color:#fff;box-shadow:0 -4px 16px rgba(0,0,0,.2);}
      .rd-mini .t{flex:1;min-width:0;font-family:'Jua';font-size:18px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
      .rd-mini button{font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-weight:700;font-size:17px;border:0;border-radius:12px;padding:11px 18px;background:#F04452;color:#fff;cursor:pointer;}
      @keyframes rdBeat{0%,100%{opacity:1;}50%{opacity:.35;}}
      .rd-live{display:inline-block;animation:rdBeat 1.2s infinite;}
    `;
    document.head.appendChild(st);
  }

  const statusText = () => (state.status === 'loading' ? '연결 중…' : state.status === 'error' ? '다시 눌러 보세요' : '');

  // 방송 목록 화면
  function mountStations(el) {
    injectStyle();
    const view = {
      el,
      render() {
        let html = '', group = '';
        for (const s of STATIONS) {
          if (s.group !== group) { group = s.group; html += `<div class="rd-group">${esc(group)}</div>`; }
          const mine = state.id === s.id;
          const cls = mine ? (state.status === 'error' ? 'err' : 'on') : '';
          const label = !mine ? '▶ 듣기' : state.status === 'loading' ? '…' : state.status === 'error' ? '다시' : '■ 끄기';
          const sub = mine && statusText() ? statusText() : s.desc;
          html += `<button class="rd-card ${cls}" data-id="${esc(s.id)}"><span class="rd-emoji">${s.emoji}</span><span class="rd-txt"><b>${esc(s.name)}</b><small>${esc(sub)}</small></span><span class="rd-btn">${label}</span></button>`;
        }
        el.innerHTML = html + '<div style="text-align:center;color:var(--ink-soft);font-size:16px;padding:6px 0 80px;">홈으로 돌아가면 라디오가 꺼져요.</div>';
      },
    };
    el.addEventListener('click', e => {
      const b = e.target.closest('.rd-card'); if (!b) return;
      if (state.id === b.dataset.id && state.status !== 'error') stop(); else play(b.dataset.id);
    });
    views.add(view);
    view.render();
  }

  // 화면 아래에 따라다니는 작은 재생 막대
  function mountMini(el) {
    injectStyle();
    const view = {
      el,
      render() {
        const st = current();
        el.innerHTML = st
          ? `<div class="rd-mini"><span class="t">${st.emoji} ${esc(st.name)} · ${state.status === 'playing' ? '<span class="rd-live">●</span> 재생 중' : state.status === 'error' ? '연결이 안 돼요' : '연결 중…'}</span><button id="rdStop">■ 끄기</button></div>`
          : '';
        const b = el.querySelector('#rdStop');
        if (b) b.addEventListener('click', stop);
      },
    };
    views.add(view);
    view.render();
  }

  window.RADIO = { STATIONS, play, stop, mountStations, mountMini, state: () => state };
})();
