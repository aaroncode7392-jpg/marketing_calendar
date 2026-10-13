// 매일 한 번 GitHub Actions에서 실행: 뉴스 RSS를 가져와 어르신에게 맞게 거른 뒤 assets/news-data.json 한 파일로 덮어쓴다.
// 어제 뉴스는 파일이 통째로 바뀌면서 자연스럽게 사라지므로 데이터가 쌓이지 않는다. 의존성 없이 Node 20 내장 기능만 사용.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../assets/news-data.json');
const PER_CATEGORY = 8;
const MAX_AGE_HOURS = 36;
const FEEDS = [
  { cat: '건강', src: '연합뉴스', url: 'https://www.yna.co.kr/rss/health.xml' },
  { cat: '건강', src: '동아일보', url: 'https://rss.donga.com/health.xml' },
  { cat: '문화·생활', src: '연합뉴스', url: 'https://www.yna.co.kr/rss/culture.xml' },
  { cat: '스포츠', src: '연합뉴스', url: 'https://www.yna.co.kr/rss/sports.xml' },
];

// 불안·불쾌감을 줄 수 있거나 어르신에게 의미 없는 기사는 제외
const TITLE_PREFIX_BLOCK = /^\s*\[(부고|인사|게시판|동정|포토|영상|화보|사진|오늘의 날씨|운세|특징주|증시)/;
const BLOCK_WORDS = [
  '사망', '숨져', '숨진', '숨지', '시신', '변사', '살인', '피살', '살해', '자살', '극단', '흉기', '폭행', '성폭', '성추행', '강간', '납치', '유괴', '학대',
  '화재', '불이 나', '폭발', '붕괴', '추락', '침몰', '참사', '충돌', '전복', '교통사고', '음주운전',
  '지진', '태풍', '폭우', '폭설', '산불', '재난', '대피',
  '전쟁', '공습', '미사일', '피격', '테러', '북한', '핵',
  '구속', '체포', '기소', '징역', '검찰', '경찰', '재판', '수사', '압수수색', '의혹', '논란', '고발', '혐의',
  '탄핵', '여당', '야당', '국회', '대통령', '장관', '총선', '대선', '의원',
  '주가', '코스피', '코스닥', '환율', '급락', '폭락', '파산', '부도', '해고', '파업',
  '확진', '감염병', '사망자', '암 환자',
  '매출', '노동자', '임상', '신천지', '與', '野', '투자', '인수', '상장', '수주', '협약', '업무협약', '보안 구멍', '미프진', '낙태', '임신중절', '플랫폼 구축', '징계', '비리', '불법',
];

const decode = s => s
  .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
  .replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#0?39;/g, "'").replace(/&apos;/g, "'").replace(/&nbsp;/g, ' ')
  .replace(/&amp;/g, '&');
const strip = s => decode(s).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
const pick = (block, tag) => { const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return m ? m[1] : ''; };

function parseItems(xml, feed) {
  const out = [];
  for (const m of xml.matchAll(/<item[\s>][\s\S]*?<\/item>/g)) {
    const b = m[0];
    const title = strip(pick(b, 'title'));
    const link = strip(pick(b, 'link')) || strip(pick(b, 'guid'));
    const ts = Date.parse(strip(pick(b, 'pubDate')));
    const rawDesc = decode(pick(b, 'description'));
    let desc = strip(rawDesc)
      .replace(/^\([^)]*\)\s*[가-힣·\s]{0,20}(기자|특파원|통신원)\s*=\s*/, '')
      .replace(/^[가-힣]{2,4}\s*(기자|특파원)\s*=\s*/, '');
    if (desc.length > 110) desc = desc.slice(0, 108).trimEnd() + '…';
    const img = (b.match(/<media:content[^>]+url="([^"]+)"/) || b.match(/<enclosure[^>]+url="([^"]+)"/) || rawDesc.match(/<img[^>]+src=['"]([^'"]+)['"]/) || [])[1] || '';
    if (!title || !link || !Number.isFinite(ts)) continue;
    out.push({ cat: feed.cat, src: feed.src, title, desc, img: img.startsWith('https://') ? img : '', url: link, ts });
  }
  return out;
}

function acceptable(it, now) {
  if (TITLE_PREFIX_BLOCK.test(it.title)) return false;
  if (now - it.ts > MAX_AGE_HOURS * 3600e3 || it.ts - now > 3600e3) return false;
  const text = `${it.title} ${it.desc}`;
  if (BLOCK_WORDS.some(w => text.includes(w))) return false;
  return /^https:\/\//.test(it.url);
}

async function load(feed) {
  try {
    const res = await fetch(feed.url, { headers: { 'User-Agent': 'Mozilla/5.0 (brain-game news bot)' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const items = parseItems(await res.text(), feed);
    console.log(`${feed.cat}/${feed.src}: ${items.length}건 수집`);
    return items;
  } catch (e) {
    console.warn(`${feed.cat}/${feed.src} 실패: ${e.message}`);
    return [];
  }
}

const now = Date.now();
const all = (await Promise.all(FEEDS.map(load))).flat();
const seen = new Set();
const kept = all.filter(it => acceptable(it, now)).filter(it => { const k = it.url || it.title; if (seen.has(k)) return false; seen.add(k); return true; });
console.log(`거르고 남은 기사: ${kept.length} / ${all.length}`);

const byCat = new Map();
for (const it of kept.sort((a, b) => b.ts - a.ts)) {
  const list = byCat.get(it.cat) || [];
  list.push(it); byCat.set(it.cat, list);
}
const picked = [];
for (const [cat, list] of byCat) {
  // 사진 있는 기사를 먼저, 출처가 한쪽으로 쏠리지 않게 번갈아 담는다
  const withImg = list.filter(i => i.img), noImg = list.filter(i => !i.img);
  const queue = [...withImg, ...noImg];
  const bySrc = {};
  for (const it of queue) (bySrc[it.src] ||= []).push(it);
  const srcs = Object.keys(bySrc);
  const chosen = [];
  for (let i = 0; chosen.length < PER_CATEGORY && srcs.some(s => bySrc[s][i]); i++) for (const s of srcs) if (bySrc[s][i] && chosen.length < PER_CATEGORY) chosen.push(bySrc[s][i]);
  picked.push(...chosen.sort((a, b) => b.ts - a.ts));
}

if (!picked.length) {
  console.warn('가져온 기사가 없어 기존 파일을 그대로 둡니다.');
  process.exit(0);
}
const items = picked.map((it, i) => ({ id: `${new Date(now).toISOString().slice(0, 10)}-${i}`, ...it }));
fs.writeFileSync(OUT, JSON.stringify({ updated: new Date(now).toISOString(), items }, null, 1) + '\n');
console.log(`저장 완료: ${items.length}건 → ${OUT}`);
