// 매일 한 번 GitHub Actions에서 실행: 정해 둔 유튜브 채널의 최신 영상을 assets/youtube-data.json 한 파일로 덮어쓴다.
// 채널 새 영상 RSS(공식)를 쓰므로 키가 필요 없고, 어제 목록은 파일이 통째로 바뀌면서 사라진다.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/youtube-data.json');
const PER_CHANNEL = 3;
const MAX_AGE_DAYS = 60;

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

const decode = s => s
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&amp;/g, '&')
  .replace(/\s+/g, ' ').trim();
const tagOf = (block, tag) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1] : ''; };

async function loadChannel(ch, now) {
  try {
    const res = await fetch(`https://www.youtube.com/feeds/videos.xml?channel_id=${ch.id}`, { headers: { 'User-Agent': 'Mozilla/5.0 (brain-game bot)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const xml = await res.text();
    const videos = [];
    for (const m of xml.matchAll(/<entry>[\s\S]*?<\/entry>/g)) {
      const b = m[0];
      const vid = tagOf(b, 'yt:videoId');
      const title = decode(tagOf(b, 'title'));
      const ts = Date.parse(tagOf(b, 'published'));
      if (!/^[\w-]{11}$/.test(vid) || !title || !Number.isFinite(ts)) continue;
      if (/#shorts/i.test(title) || /\/shorts\//.test(b)) continue;
      if (now - ts > MAX_AGE_DAYS * 86400e3) continue;
      if (BLOCK_WORDS.some(w => title.includes(w))) continue;
      videos.push({ id: vid, cat: ch.cat, src: ch.name, title, img: `https://i.ytimg.com/vi/${vid}/hqdefault.jpg`, url: `https://www.youtube.com/watch?v=${vid}`, ts });
    }
    console.log(`${ch.name}: ${videos.length}건`);
    return videos.sort((a, b) => b.ts - a.ts).slice(0, PER_CHANNEL);
  } catch (e) {
    console.warn(`${ch.name} 실패: ${e.message}`);
    return [];
  }
}

// 채널 주인이 앱 안 재생(퍼가기)을 막은 영상은 oEmbed가 401/403으로 답한다
async function embeddable(v) {
  try {
    const res = await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(v.url)}`, { signal: AbortSignal.timeout(8000) });
    return !(res.status === 401 || res.status === 403);
  } catch {
    return true;
  }
}

const now = Date.now();
const videos = (await Promise.all(CHANNELS.map(c => loadChannel(c, now)))).flat();
if (!videos.length) {
  console.warn('가져온 영상이 없어 기존 파일을 그대로 둡니다.');
  process.exit(0);
}
const flags = await Promise.all(videos.map(embeddable));
const items = videos.map((v, i) => ({ ...v, embed: flags[i] })).sort((a, b) => b.ts - a.ts);
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date(now).toISOString(), items }, null, 1) + '\n');
console.log(`저장 완료: ${items.length}건 (앱 안 재생 불가 ${items.filter(i => !i.embed).length}건) → ${OUT}`);
