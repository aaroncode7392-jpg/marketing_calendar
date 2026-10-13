// ==========================================================
// 유리막 잠금: 오늘의 두뇌운동을 한 번 마치면 뉴스·라디오·영상이 열린다.
//  - 운동 전: 소식 화면이 반투명한 유리막으로 막혀 있고, 누르면 두뇌운동을 하라고 안내한다.
//  - 운동 후: 유리막을 탭하면 산산조각으로 깨지며(금, 파편, 충격파, 소리, 진동) 소식이 열린다.
// 하루에 한 번만 깨며, 다음 날에는 다시 유리막이 생긴다.
// ==========================================================
(function () {
  const GATE_START = '2026-10-15'; // 이 날짜부터 잠금이 적용된다 (그 전에는 모두 열려 있다)
  const CRACK_MS = 140;
  const TOTAL_MS = 3200;

  const pad = n => String(n).padStart(2, '0');
  const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  const today = () => ymd(new Date());
  const rand = (a, b) => a + Math.random() * (b - a);
  const memberKey = () => `glassDay:${(currentMember && currentMember.birthdate) || 'guest'}`;

  const api = { gateStart: GATE_START };

  function brokenToday() {
    if (currentMember && currentMember.glassDay === today()) return true;
    try { return localStorage.getItem(memberKey()) === today(); } catch (e) { return false; }
  }
  function markBroken() {
    try { localStorage.setItem(memberKey(), today()); } catch (e) { /* 저장소를 못 쓰면 서버 기록만 사용 */ }
    if (currentMember) {
      currentMember.glassDay = today();
      if (typeof saveMember === 'function') saveMember();
    }
  }
  function sessionDoneToday() {
    if (!currentMember) return false;
    const t = today();
    const hit = ts => { const d = new Date(ts); return !Number.isNaN(d.getTime()) && ymd(d) === t; };
    return (currentMember.scoreLog || []).some(s => hit(s.ts)) || (currentMember.completedLog || []).some(hit);
  }
  // 'open' 열림 · 'locked' 두뇌운동 전 · 'ready' 두뇌운동 끝, 유리를 깰 차례
  function state() {
    if (today() < api.gateStart) return 'open';
    if (brokenToday()) return 'open';
    return sessionDoneToday() ? 'ready' : 'locked';
  }

  // ---------------- 소리 ----------------
  function playBreakSound() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      const ac = new AC();
      if (ac.state === 'suspended') ac.resume();
      const master = ac.createGain(); master.gain.value = 0.9;
      const comp = ac.createDynamicsCompressor();
      master.connect(comp); comp.connect(ac.destination);
      const sr = ac.sampleRate;
      const noiseBuf = ac.createBuffer(1, Math.floor(sr * 1.2), sr);
      const nd = noiseBuf.getChannelData(0);
      for (let i = 0; i < nd.length; i++) nd[i] = Math.random() * 2 - 1;
      const noise = (type, freq, start, dur, peak) => {
        const src = ac.createBufferSource(); src.buffer = noiseBuf;
        const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq;
        const g = ac.createGain();
        g.gain.setValueAtTime(0.0001, start);
        g.gain.exponentialRampToValueAtTime(peak, start + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, start + dur);
        src.connect(f); f.connect(g); g.connect(master);
        src.start(start); src.stop(start + dur + 0.05);
      };
      const t0 = ac.currentTime + 0.01;
      // 쿵: 낮은 충격 + 쨍: 첫 균열
      const thump = ac.createOscillator(); const tg = ac.createGain();
      thump.frequency.setValueAtTime(150, t0); thump.frequency.exponentialRampToValueAtTime(42, t0 + 0.22);
      tg.gain.setValueAtTime(0.9, t0); tg.gain.exponentialRampToValueAtTime(0.0001, t0 + 0.3);
      thump.connect(tg); tg.connect(master); thump.start(t0); thump.stop(t0 + 0.35);
      noise('lowpass', 2200, t0, 0.22, 1.0);
      noise('highpass', 3500, t0, 0.12, 0.9);
      // 와사삭: 금이 퍼지는 소리
      for (let i = 0; i < 16; i++) noise('highpass', rand(2500, 6000), t0 + 0.02 + i * 0.022 + rand(0, 0.012), rand(0.03, 0.08), rand(0.15, 0.55));
      // 촤르르: 쏟아지는 유리 조각 소리
      for (let i = 0; i < 55; i++) {
        const when = t0 + 0.14 + Math.pow(Math.random(), 1.5) * 1.7;
        const o = ac.createOscillator(); const g = ac.createGain();
        o.type = Math.random() < 0.5 ? 'triangle' : 'sine';
        o.frequency.value = rand(2200, 9500);
        const dur = rand(0.08, 0.45);
        g.gain.setValueAtTime(0.0001, when);
        g.gain.exponentialRampToValueAtTime(rand(0.03, 0.13), when + 0.002);
        g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
        o.connect(g); g.connect(master); o.start(when); o.stop(when + dur + 0.05);
      }
      // 반짝: 열렸다는 효과음
      [1046.5, 1318.5, 1568, 2093].forEach((fr, i) => {
        const when = t0 + 0.55 + i * 0.1;
        for (const det of [0, 6]) {
          const o = ac.createOscillator(); const g = ac.createGain();
          o.frequency.value = fr + det;
          g.gain.setValueAtTime(0.0001, when);
          g.gain.exponentialRampToValueAtTime(0.07, when + 0.01);
          g.gain.exponentialRampToValueAtTime(0.0001, when + 0.7);
          o.connect(g); g.connect(master); o.start(when); o.stop(when + 0.75);
        }
      });
      setTimeout(() => { try { ac.close(); } catch (e) { /* 이미 닫힘 */ } }, 3500);
    } catch (e) { /* 소리가 안 나도 화면 효과는 계속 */ }
  }

  // ---------------- 파편 만들기 (거미줄 모양 금) ----------------
  function buildShards(W, H, ix, iy) {
    const RAYS = 18;
    const maxD = Math.max(Math.hypot(ix, iy), Math.hypot(W - ix, iy), Math.hypot(ix, H - iy), Math.hypot(W - ix, H - iy)) + 60;
    const base = Array.from({ length: RAYS }, (_, i) => (i / RAYS) * Math.PI * 2 + rand(-0.13, 0.13));
    const radii = [0, rand(26, 40)];
    while (radii[radii.length - 1] < maxD) radii.push(radii[radii.length - 1] * rand(1.3, 1.46) + rand(2, 12));
    const P = radii.map((r, k) => base.map(a => {
      if (k === 0) return [ix, iy];
      const rr = r * rand(0.9, 1.1), aa = a + rand(-0.05, 0.05);
      return [ix + rr * Math.cos(aa), iy + rr * Math.sin(aa)];
    }));
    const shards = [];
    for (let k = 0; k < radii.length - 1; k++) {
      for (let i = 0; i < RAYS; i++) {
        const j = (i + 1) % RAYS;
        const poly = k === 0 ? [P[0][i], P[1][i], P[1][j]] : [P[k][i], P[k][j], P[k + 1][j], P[k + 1][i]];
        const xs = poly.map(p => p[0]), ys = poly.map(p => p[1]);
        if (Math.max(...xs) < -80 || Math.min(...xs) > W + 80 || Math.max(...ys) < -80 || Math.min(...ys) > H + 80) continue;
        const cx = xs.reduce((a, b) => a + b, 0) / xs.length, cy = ys.reduce((a, b) => a + b, 0) / ys.length;
        const dx = cx - ix, dy = cy - iy, d = Math.hypot(dx, dy) || 1;
        const speed = 900 * Math.exp(-d / 420) + 140 + rand(0, 160);
        shards.push({
          poly, cx, cy, rel: poly.map(p => [p[0] - cx, p[1] - cy]),
          vx: (dx / d) * speed * rand(0.7, 1.2), vy: (dy / d) * speed * rand(0.5, 1) - rand(80, 380),
          vr: rand(-6, 6), rot: 0, flip: rand(0, 6), flipV: rand(2, 9),
          delay: d / 3000 + rand(0, 0.04), glare: Math.random() < 0.45, tint: Math.random(),
        });
      }
    }
    return { shards, maxD };
  }

  function burst(parts, ix, iy, n, power) {
    for (let i = 0; i < n; i++) {
      const a = rand(0, Math.PI * 2), sp = rand(150, 1500) * power;
      parts.push({ x: ix + Math.cos(a) * rand(0, 40), y: iy + Math.sin(a) * rand(0, 40), vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - rand(0, 300),
        size: rand(2, 7), rot: rand(0, 6), vr: rand(-12, 12), life: rand(0.8, 1.9), age: 0, star: Math.random() < 0.28, hue: Math.random() < 0.6 ? 0 : rand(185, 215) });
    }
  }

  function drawStar(ctx, r) {
    ctx.beginPath();
    ctx.moveTo(0, -r); ctx.quadraticCurveTo(r * 0.15, -r * 0.15, r, 0);
    ctx.quadraticCurveTo(r * 0.15, r * 0.15, 0, r); ctx.quadraticCurveTo(-r * 0.15, r * 0.15, -r, 0);
    ctx.quadraticCurveTo(-r * 0.15, -r * 0.15, 0, -r); ctx.fill();
  }

  // ---------------- 깨지는 연출 ----------------
  function shatter(ix, iy, pane, paper, done) {
    const W = window.innerWidth, H = window.innerHeight;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cv = document.createElement('canvas');
    cv.width = Math.floor(W * dpr); cv.height = Math.floor(H * dpr);
    cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;z-index:290;pointer-events:all;';
    document.body.appendChild(cv);
    const ctx = cv.getContext('2d');
    ctx.scale(dpr, dpr);
    const { shards, maxD } = buildShards(W, H, ix, iy);
    const parts = [];
    const app = document.getElementById('app');
    const reduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    playBreakSound();
    if (navigator.vibrate) { try { navigator.vibrate([45, 25, 90, 25, 60, 25, 200]); } catch (e) { /* 진동 미지원 */ } }

    let start = null, cleared = false, burst2 = false, last = 0;
    function frame(ts) {
      if (start == null) { start = ts; last = ts; }
      const t = (ts - start) / 1000, dt = Math.min(0.05, (ts - last) / 1000); last = ts;
      ctx.clearRect(0, 0, W, H);

      // 흔들림 + 번쩍임
      if (app && !reduced) {
        const amp = t < 0.55 ? 18 * Math.pow(1 - t / 0.55, 2) : 0;
        app.style.transform = amp ? `translate(${rand(-amp, amp).toFixed(1)}px,${rand(-amp, amp).toFixed(1)}px)` : '';
      }
      if (t < 0.28) { ctx.fillStyle = `rgba(255,255,255,${(0.92 * (1 - t / 0.28)).toFixed(3)})`; ctx.fillRect(0, 0, W, H); }

      const tc = CRACK_MS / 1000;
      if (t < tc) {
        // 1단계: 충격점에서 금이 번개처럼 퍼진다
        const R = maxD * Math.pow(t / tc, 0.75);
        ctx.save();
        ctx.beginPath(); ctx.arc(ix, iy, R, 0, Math.PI * 2); ctx.clip();
        ctx.strokeStyle = 'rgba(255,255,255,0.95)'; ctx.lineWidth = 2.2; ctx.shadowColor = 'rgba(160,210,255,1)'; ctx.shadowBlur = 10;
        for (const s of shards) { ctx.beginPath(); s.poly.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath(); ctx.stroke(); }
        ctx.restore();
      } else {
        if (!cleared) {
          cleared = true;
          if (pane) pane.remove();
          if (paper) { paper.classList.remove('gl-blur'); paper.classList.add('gl-reveal'); }
          burst(parts, ix, iy, 280, 1);
        }
        if (!burst2 && t > 0.5) { burst2 = true; burst(parts, W / 2, H * 0.3, 120, 0.7); }
        const ts2 = t - tc;

        // 충격파
        const ring = ts2 * 1900;
        if (ts2 < 0.5) {
          ctx.strokeStyle = `rgba(255,255,255,${(0.8 * (1 - ts2 / 0.5)).toFixed(3)})`; ctx.lineWidth = 8 * (1 - ts2 / 0.5) + 1;
          ctx.beginPath(); ctx.arc(ix, iy, ring, 0, Math.PI * 2); ctx.stroke();
        }

        // 2단계: 파편이 튀어 나가 떨어진다
        for (const s of shards) {
          const a = ts2 - s.delay;
          let x = s.cx, y = s.cy, rot = 0, sy = 1, alpha = 0.9;
          if (a > 0) {
            x += s.vx * a; y += s.vy * a + 0.5 * 2300 * a * a;
            rot = s.vr * a; sy = Math.max(0.12, Math.abs(Math.cos(s.flip + a * s.flipV)));
            alpha = Math.max(0, Math.min(0.9, (1.9 - a) / 0.7));
          }
          if (alpha <= 0 || y - s.cy > H * 1.6 + 400) continue;
          ctx.save();
          ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, sy);
          ctx.globalAlpha = alpha;
          ctx.beginPath(); s.rel.forEach((p, i) => (i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1]))); ctx.closePath();
          ctx.fillStyle = s.tint < 0.5 ? 'rgba(220,238,255,0.30)' : 'rgba(190,220,255,0.26)'; ctx.fill();
          ctx.lineWidth = 2; ctx.strokeStyle = 'rgba(255,255,255,0.92)'; ctx.stroke();
          if (s.glare) {
            ctx.beginPath(); ctx.moveTo(s.rel[0][0], s.rel[0][1]); ctx.lineTo(s.rel[1][0], s.rel[1][1]); ctx.lineTo(s.rel[2][0], s.rel[2][1]); ctx.closePath();
            ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill();
          }
          ctx.restore();
        }

        // 반짝이는 가루
        ctx.globalCompositeOperation = 'lighter';
        for (const p of parts) {
          p.age += dt;
          if (p.age >= p.life) continue;
          p.vy += 1700 * dt; p.x += p.vx * dt; p.y += p.vy * dt; p.rot += p.vr * dt; p.vx *= 0.995;
          const al = Math.max(0, 1 - p.age / p.life);
          ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.rot); ctx.globalAlpha = al;
          ctx.fillStyle = p.hue ? `hsl(${p.hue},90%,78%)` : '#fff';
          if (p.star) drawStar(ctx, p.size * 2.4 * (0.6 + 0.4 * Math.sin(p.age * 30)));
          else ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
          ctx.restore();
        }
        ctx.globalCompositeOperation = 'source-over';
      }

      if (ts - start < TOTAL_MS) { requestAnimationFrame(frame); return; }
      if (app) app.style.transform = '';
      cv.remove();
      done();
    }
    requestAnimationFrame(frame);
  }

  // ---------------- 화면 ----------------
  function injectStyle() {
    if (document.getElementById('glassStyle')) return;
    const st = document.createElement('style');
    st.id = 'glassStyle';
    st.textContent = `
      .gl-blur{filter:blur(5px) saturate(1.1);transition:filter .3s;}
      .gl-reveal{animation:glReveal .7s cubic-bezier(.2,.9,.3,1.2) both;}
      @keyframes glReveal{0%{transform:scale(1.07);filter:brightness(1.6) blur(8px);}60%{filter:brightness(1.15) blur(0);}100%{transform:none;filter:none;}}
      .gl-pane{position:fixed;inset:0;z-index:280;display:flex;align-items:center;justify-content:center;cursor:pointer;touch-action:manipulation;overflow:hidden;
        background:linear-gradient(115deg,rgba(255,255,255,.36) 0%,rgba(200,225,255,.20) 35%,rgba(255,255,255,.32) 58%,rgba(180,210,255,.18) 100%);
        backdrop-filter:blur(8px) saturate(1.35);-webkit-backdrop-filter:blur(8px) saturate(1.35);animation:glIn .35s ease both;}
      @keyframes glIn{from{opacity:0;}to{opacity:1;}}
      .gl-pane::before{content:'';position:absolute;inset:-20%;background:linear-gradient(115deg,transparent 40%,rgba(255,255,255,.55) 50%,transparent 60%);transform:translateX(-80%);animation:glSheen 3.8s ease-in-out infinite;pointer-events:none;}
      @keyframes glSheen{0%{transform:translateX(-80%);}55%,100%{transform:translateX(80%);}}
      .gl-pane::after{content:'';position:absolute;inset:8px;border:2px solid rgba(255,255,255,.7);border-radius:20px;box-shadow:inset 0 0 50px rgba(255,255,255,.4),0 0 24px rgba(255,255,255,.35);pointer-events:none;}
      .gl-pane.gl-thud{animation:glThud .45s ease;}
      @keyframes glThud{0%,100%{transform:none;}15%{transform:translateX(-9px) rotate(-.4deg);}35%{transform:translateX(8px) rotate(.4deg);}55%{transform:translateX(-5px);}75%{transform:translateX(3px);}}
      .gl-home{position:absolute;left:14px;top:14px;z-index:2;border:0;border-radius:12px;background:rgba(242,244,246,.92);color:#4E5968;font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-weight:700;font-size:17px;padding:10px 14px;cursor:pointer;}
      .gl-center{position:relative;z-index:1;text-align:center;padding:0 24px;max-width:420px;font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;color:#191F28;text-shadow:0 1px 8px rgba(255,255,255,.9);}
      .gl-lock{font-size:76px;filter:drop-shadow(0 6px 14px rgba(0,0,0,.25));animation:glFloat 2.4s ease-in-out infinite;}
      @keyframes glFloat{0%,100%{transform:translateY(0);}50%{transform:translateY(-9px);}}
      .gl-sub{font-size:19px;font-weight:600;margin-top:8px;opacity:.85;}
      .gl-title{font-family:'Jua';font-size:34px;line-height:1.25;margin:6px 0 8px;}
      .gl-tap{font-size:22px;font-weight:800;color:#fff;text-shadow:0 2px 12px rgba(49,130,246,.9),0 0 3px rgba(0,0,0,.35);animation:glPulse 1.1s ease-in-out infinite;}
      @keyframes glPulse{0%,100%{transform:scale(1);}50%{transform:scale(1.1);}}
      .gl-hand{font-size:64px;display:block;margin-top:10px;animation:glTap 1.1s ease-in-out infinite;}
      @keyframes glTap{0%,100%{transform:translateY(0) scale(1);}50%{transform:translateY(-14px) scale(.92);}}
      .gl-card{background:rgba(255,255,255,.96);border-radius:24px;padding:24px 20px 20px;box-shadow:0 14px 40px rgba(0,0,0,.28);text-shadow:none;animation:glPop .35s cubic-bezier(.2,1.4,.4,1) both;}
      @keyframes glPop{from{opacity:0;transform:scale(.8);}to{opacity:1;transform:none;}}
      .gl-card h3{font-family:'Jua';font-size:26px;margin:0 0 8px;line-height:1.3;}
      .gl-card p{font-size:18px;line-height:1.55;margin:0 0 16px;color:#4E5968;}
      .gl-btn{display:block;width:100%;border:0;border-radius:16px;padding:16px;font-family:inherit;font-weight:800;font-size:20px;cursor:pointer;background:#3182F6;color:#fff;}
      .gl-btn.sub{background:#F2F4F6;color:#4E5968;margin-top:10px;font-weight:700;font-size:17px;padding:13px;}
      .gl-toast{position:fixed;left:50%;top:18px;transform:translateX(-50%);z-index:295;background:#191F28;color:#fff;border-radius:999px;padding:14px 24px;font-family:'Pretendard','Apple SD Gothic Neo','Noto Sans KR',sans-serif;font-weight:800;font-size:19px;box-shadow:0 8px 24px rgba(0,0,0,.35);animation:glToast 2.8s ease both;white-space:nowrap;}
      @keyframes glToast{0%{opacity:0;transform:translate(-50%,-30px) scale(.8);}12%{opacity:1;transform:translate(-50%,0) scale(1.08);}20%{transform:translate(-50%,0) scale(1);}85%{opacity:1;}100%{opacity:0;transform:translate(-50%,-10px);}}
    `;
    document.head.appendChild(st);
  }

  function toast(msg) {
    const t = document.createElement('div');
    t.className = 'gl-toast'; t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(() => t.remove(), 3000);
  }

  // 소식 화면(wrap)에 유리막을 씌운다
  function mount(wrap) {
    const st = state();
    if (st === 'open' || !wrap) return;
    injectStyle();
    document.querySelectorAll('.gl-pane').forEach(p => p.remove());
    const paper = wrap.querySelector('.nw-paper');
    if (paper) paper.classList.add('gl-blur');
    const pane = document.createElement('div');
    pane.className = 'gl-pane';
    pane.innerHTML = '<button class="gl-home" type="button">← 홈</button><div class="gl-center"></div>';
    document.body.appendChild(pane);
    const center = pane.querySelector('.gl-center');
    const goHome = () => { if (window.NEWS && NEWS.leave) NEWS.leave(); };
    pane.querySelector('.gl-home').addEventListener('click', e => { e.stopPropagation(); goHome(); });

    // 화면을 떠나면 유리막도 함께 치운다
    const timer = setInterval(() => { if (!wrap.isConnected) { pane.remove(); clearInterval(timer); } }, 300);

    if (st === 'locked') {
      center.innerHTML = '<div class="gl-lock">🔒</div><div class="gl-sub">유리막으로 잠겨 있어요<br>탭해 보세요</div>';
      let asked = false;
      pane.addEventListener('click', () => {
        pane.classList.remove('gl-thud'); void pane.offsetWidth; pane.classList.add('gl-thud');
        if (navigator.vibrate) { try { navigator.vibrate(35); } catch (e) { /* 진동 미지원 */ } }
        if (asked) return;
        asked = true;
        center.innerHTML = `<div class="gl-card">
          <h3>🧠 두뇌운동을 먼저 해 주세요!</h3>
          <p>오늘의 두뇌운동을 한 번만 마치면<br>뉴스·라디오·영상이 열려요.</p>
          <button class="gl-btn" id="glGo" type="button">두뇌운동 하러 가기</button>
          <button class="gl-btn sub" id="glBack" type="button">다음에 할게요</button>
        </div>`;
        center.querySelector('#glGo').addEventListener('click', e => { e.stopPropagation(); clearInterval(timer); pane.remove(); if (typeof window.startSession === 'function') window.startSession(); });
        center.querySelector('#glBack').addEventListener('click', e => { e.stopPropagation(); goHome(); });
      });
    } else {
      center.innerHTML = '<div class="gl-title">✨ 두뇌운동 완료!</div><div class="gl-tap">유리를 탭해서 깨 보세요!</div><span class="gl-hand">👆</span>';
      let broken = false;
      const hit = e => {
        if (broken) return;
        broken = true;
        clearInterval(timer);
        const pt = e.touches && e.touches[0] ? e.touches[0] : e;
        const ix = Number.isFinite(pt.clientX) ? pt.clientX : window.innerWidth / 2;
        const iy = Number.isFinite(pt.clientY) ? pt.clientY : window.innerHeight / 2;
        markBroken();
        center.style.display = 'none';
        shatter(ix, iy, pane, paper, () => { if (paper) paper.classList.remove('gl-reveal'); toast('🔓 열렸어요! 마음껏 즐기세요'); });
      };
      pane.addEventListener('click', hit);
    }
  }

  api.state = state;
  api.mount = mount;
  api.todayDone = sessionDoneToday;
  window.GLASS = api;
})();
