// 매일 한 번 GitHub Actions에서 실행: 정해 둔 유튜브 채널들의 영상 목록(채널마다 최근 100개)을 assets/youtube-data.json 한 파일로 덮어쓴다.
// 채널의 "업로드 재생목록" 공개 페이지에서 읽으므로 키가 필요 없다. 읽기에 실패한 채널은 공식 RSS(최근 15개)로,
// 그것도 안 되면 어제 목록을 그 채널만 그대로 이어 쓴다. 파일은 매일 통째로 바뀌므로 데이터가 쌓이지 않는다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/youtube-data.json');
const MIN_SECONDS = 90; // 이보다 짧은 영상(쇼츠 등)은 뺀다
const DAY = 86400e3;

// 채널을 바꾸려면 여기만 고치면 된다. (채널 주소의 @이름이 아니라 UC로 시작하는 채널 번호)
const CHANNELS = [
  { cat: '건강', name: '건강구조대', id: 'UCatDnMlI2LI2dDb15BuZbAg' },
  { cat: '건강', name: '약사가 들려주는 약 이야기', id: 'UCMFk5S7g5DY-CZNVh_Kyz_A' },
  { cat: '건강', name: '닥터프렌즈', id: 'UCVfLNEch9YxD4tX1L-crkMQ' },
  { cat: '건강', name: '다이어트 과학자 최겸', id: 'UChXDq9Izwq-pTzeUWzwXL3A' },
  { cat: '지식·시사', name: '지식인사이드', id: 'UCA_hgsFzmynpv1zkvA5A7jA' },
  { cat: '지식·시사', name: '지식한상', id: 'UCw8hsZYZcasyyLrfOFP8D-w' },
  { cat: '지식·시사', name: '책과삶', id: 'UCgUaqrLRGLL-dHislR1e2TA' },
  { cat: '지식·시사', name: '스브스뉴스', id: 'UCQabORQKQRHP-iUqe-xIFvg' },
  { cat: '지식·시사', name: '디글', id: 'UCWYzc_p0GgfCepIWDHGFmEg' },
  { cat: '추억·예능', name: '옛날티비 KBS Archive', id: 'UCpdvFXMZkqFLdp1nagLkOhg' },
  { cat: '추억·예능', name: '디글 클래식', id: 'UCRMA_Nb5VF-YoWApSVeXPVA' },
  { cat: '추억·예능', name: '오분순삭', id: 'UC9idb-NIhZrI6wkPesc3MUg' },
  { cat: '추억·예능', name: 'TV-People', id: 'UC1cWTErb7vw_UmmuB0dYgsQ' },
  { cat: '요리', name: '강레오 걍레오', id: 'UCTV5_Y5gbVua8PpbOsim9RQ' },
];

// 자극적인 사건·사고 제목은 제외
const BLOCK_WORDS = ['사망', '숨져', '숨진', '시신', '살인', '살해', '자살', '극단적', '흉기', '폭행', '성폭', '납치', '학대', '참사', '붕괴', '추락'];

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
  'Accept-Language': 'ko-KR,ko;q=0.9',
  Cookie: 'CONSENT=YES+1; SOCS=CAI',
};

const walk = (o, f) => {
  if (!o || typeof o !== 'object') return;
  if (Array.isArray(o)) { for (const x of o) walk(x, f); return; }
  f(o);
  for (const k in o) walk(o[k], f);
};
const decode = s => s.replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();

// "4.1천" "12만" "1.2억" → 숫자
function parseViews(s) {
  const m = /([\d.,]+)\s*(천|만|억)?/.exec(s || '');
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ''));
  return Math.round(n * ({ 천: 1e3, 만: 1e4, 억: 1e8 }[m[2]] || 1));
}
// "13시간 전" "2주 전" "3개월 전" → 며칠 전인지
function parseAgeDays(s) {
  const m = /(\d+)\s*(초|분|시간|일|주|개월|년)\s*전/.exec(s || '');
  if (!m) return null;
  const n = Number(m[1]);
  return { 초: 0, 분: n / 1440, 시간: n / 24, 일: n, 주: n * 7, 개월: n * 30, 년: n * 365 }[m[2]];
}
// "36:50" "1:00:55" → 초
const parseDuration = s => (/^\d+(:\d+)+$/.test(s || '') ? s.split(':').reduce((a, b) => a * 60 + Number(b), 0) : null);

function okTitle(t) { return t && !/#shorts/i.test(t) && !BLOCK_WORDS.some(w => t.includes(w)); }

async function fromPlaylist(ch) {
  const res = await fetch(`https://www.youtube.com/playlist?list=UU${ch.id.slice(2)}`, { headers: HEADERS, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
  if (!m) throw new Error('페이지 형식 변경');
  const out = [];
  walk(JSON.parse(m[1]), o => {
    const l = o.lockupViewModel;
    if (!l || l.contentType !== 'LOCKUP_CONTENT_TYPE_VIDEO' || !/^[\w-]{11}$/.test(l.contentId || '')) return;
    const md = l.metadata && l.metadata.lockupMetadataViewModel;
    const title = md && md.title && md.title.content ? decode(md.title.content) : '';
    const parts = [];
    walk(md && md.metadata, x => { if (x.metadataParts) for (const p of x.metadataParts) if (p.text && p.text.content) parts.push(p.text.content); });
    let dur = null;
    walk(l.contentImage, x => { if (x.thumbnailBadgeViewModel && dur == null) dur = parseDuration(x.thumbnailBadgeViewModel.text); });
    const viewsPart = parts.find(p => /[\d.]+\s*(천|만|억)?(회)?$/.test(p) && !/전$/.test(p));
    const agePart = parts.find(p => /전$/.test(p));
    out.push({ id: l.contentId, t: title, v: parseViews(viewsPart), a: parseAgeDays(agePart), d: dur });
  });
  if (!out.length) throw new Error('영상 0개');
  return out;
}

async function fromRss(ch) {
  const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, { headers: HEADERS, signal: AbortSignal.timeout(20000) });
  if (!res.ok) throw new Error(`RSS HTTP ${res.status}`);
  const xml = await res.text(), now = Date.now(), out = [];
  for (const m of xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)) {
    const b = m[0];
    const id = (b.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/) || [])[1];
    const t = decode((b.match(/<title>([\s\S]*?)<\/title>/) || [])[1] || '');
    const ts = Date.parse((b.match(/<published>(.*?)<\/published>/) || [])[1]);
    const v = Number((b.match(/<media:statistics views="(\d+)"/) || [])[1] || 0);
    if (!id || /\/shorts\//.test(b)) continue;
    out.push({ id, t, v, a: Number.isFinite(ts) ? (now - ts) / DAY : null, d: null });
  }
  if (!out.length) throw new Error('RSS 0개');
  return out;
}

function loadPrevious() {
  try {
    const old = JSON.parse(fs.readFileSync(OUT, 'utf8'));
    const passed = (Date.now() - Date.parse(old.updated)) / DAY;
    const byChannel = new Map();
    if (Array.isArray(old.channels)) {
      for (const it of old.items || []) {
        const ch = old.channels[it.c];
        if (!ch) continue;
        if (!byChannel.has(ch.id)) byChannel.set(ch.id, []);
        byChannel.get(ch.id).push({ ...it, a: it.a == null ? null : it.a + passed });
      }
    }
    return byChannel;
  } catch {
    return new Map();
  }
}

const previous = loadPrevious();
const results = await Promise.all(CHANNELS.map(async (ch, c) => {
  let list, how;
  try { list = await fromPlaylist(ch); how = '재생목록'; } catch (e1) {
    try { list = await fromRss(ch); how = `RSS (재생목록 실패: ${e1.message})`; } catch (e2) {
      list = previous.get(ch.id) || []; how = `어제 목록 유지 (${e1.message} / ${e2.message})`;
    }
  }
  const seen = new Set();
  const kept = list.filter(v => okTitle(v.t) && (v.d == null || v.d >= MIN_SECONDS) && !seen.has(v.id) && seen.add(v.id))
    .map(v => ({ id: v.id, c, t: v.t, v: v.v || 0, a: v.a == null ? null : Math.round(v.a * 10) / 10, d: v.d }));
  console.log(`${ch.name}: ${kept.length}개 · ${how}`);
  return kept;
}));

const items = results.flat();
if (!items.length) {
  console.warn('가져온 영상이 없어 기존 파일을 그대로 둡니다.');
  process.exit(0);
}
const channels = CHANNELS.map(({ id, name, cat }) => ({ id, name, cat }));
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date().toISOString(), v: 2, channels, items }) + '\n');
console.log(`저장 완료: ${items.length}개 → ${OUT}`);
