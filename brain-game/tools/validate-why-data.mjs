// 원인 알아 오기 대화 자료(why-data/part-NN.json) 검사: node tools/validate-why-data.mjs [part-00 ...]
// 인자가 없으면 전체(10묶음 × 상황 10가지 × 대화 10개 = 1000개)를 검사한다. 문제가 하나라도 있으면 종료 코드 1.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../why-data');
const PARTS = 10, CASES = 10, DIALOGUES = 10, LAYERS = 3;
const KINDS = ['work', 'club', 'home', 'owner'];
const MAX = { o: 70, e: 35, q: 34, a: 55, r: 70, l: 40, x: 38, t: 40, pay: 18 };
// 끝난 것처럼 들리는 말, 게임 용어, 어르신께 무섭거나 불편한 말
const BANNED = /돌아가셨|돌아가시|세상을 떠|내일 봐|내일 뵙|안녕히|수고|스테이지|오늘은 여기까지|사망|숨졌|숨진|자살|시신|살인|폭행|치매|노망|늙은이|노인네|망령|멍청|바보/;
const LATIN = /[A-Za-z]/;

const errors = [];
const bad = (where, msg) => errors.push(`${where}: ${msg}`);
const str = (v, where, key) => {
  if (typeof v !== 'string' || !v.trim()) { bad(where, `${key} 없음`); return false; }
  if (v.length > MAX[key]) bad(where, `${key} ${v.length}자 (최대 ${MAX[key]}): ${v}`);
  if (BANNED.test(v)) bad(where, `쓰면 안 되는 말: ${v}`);
  if (LATIN.test(v)) bad(where, `영어 글자: ${v}`);
  if (/[<>]/.test(v)) bad(where, `꺾쇠 문자: ${v}`);
  return true;
};

function checkDialogue(d, where, seen) {
  ['o', 'e', 'r', 'l', 'x'].forEach(k => str(d[k], where, k));
  for (const k of ['q', 'a']) {
    if (!Array.isArray(d[k]) || d[k].length !== LAYERS) { bad(where, `${k}는 ${LAYERS}개여야 함`); return; }
  }
  d.q.forEach((q, i) => { if (str(q, `${where}.q${i}`, 'q') && !q.includes('왜')) bad(`${where}.q${i}`, `"왜"가 없음: ${q}`); });
  d.a.forEach((a, i) => str(a, `${where}.a${i}`, 'a'));
  if (new Set(d.a).size !== LAYERS) bad(where, '같은 대답이 반복됨');
  for (const text of [d.o, d.a[2], d.x]) {
    if (typeof text !== 'string') continue;
    const key = text.replace(/[\s.,!?…"'~]/g, '');
    if (seen.has(key)) bad(where, `전체에서 겹침 (${seen.get(key)}): ${text}`); else seen.set(key, where);
  }
}

function checkCase(c, where, seen) {
  if (!KINDS.includes(c.kind)) bad(where, `kind 오류: ${c.kind}`);
  if (typeof c.place !== 'string' || !c.place) bad(where, 'place 없음');
  for (const k of ['boss', 'jr']) {
    if (!Array.isArray(c[k]) || c[k].length !== 2 || !c[k][0] || !c[k][1]) bad(where, `${k}는 [이름, 얼굴]이어야 함`);
  }
  if (!Array.isArray(c.t) || c.t.length !== 2) bad(where, 't는 2개여야 함'); else c.t.forEach(x => str(x, where, 't'));
  str(c.pay, where, 'pay');
  if (!Array.isArray(c.d) || c.d.length !== DIALOGUES) { bad(where, `대화가 ${c.d && c.d.length}개 (${DIALOGUES}개여야 함)`); return; }
  c.d.forEach((d, i) => checkDialogue(d, `${where}.d${i}`, seen));
}

function checkPart(name, seen) {
  const file = path.join(DIR, `${name}.json`);
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch (e) { bad(name, `읽기 실패: ${e.message}`); return 0; }
  if (!Array.isArray(data.cases) || data.cases.length !== CASES) { bad(name, `상황이 ${data.cases && data.cases.length}개 (${CASES}개여야 함)`); return 0; }
  data.cases.forEach((c, i) => checkCase(c, `${name}.c${i}(${c.place})`, seen));
  return data.cases.reduce((n, c) => n + (Array.isArray(c.d) ? c.d.length : 0), 0);
}

const args = process.argv.slice(2);
const names = args.length ? args : Array.from({ length: PARTS }, (_, i) => `part-${String(i).padStart(2, '0')}`);
const seen = new Map();
const total = names.reduce((n, name) => n + checkPart(name, seen), 0);
if (errors.length) {
  console.error(`문제 ${errors.length}개\n${errors.slice(0, 60).join('\n')}`);
  process.exit(1);
}
console.log(`통과: 대화 ${total}개`);
