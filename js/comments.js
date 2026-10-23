// ══════════════════════════════════════════════════════
//  의견 저장 — 구글 시트(공유) / localStorage(체험) 이중 백엔드
// ══════════════════════════════════════════════════════
import { SHEET_API_URL } from './config.js';

const LS_KEY  = 'mathbook.comments.v1';
const LS_MINE = 'mathbook.mine.v1';
const LS_WHO  = 'mathbook.who.v1';

export const isShared = Boolean(SHEET_API_URL);
export const mode     = isShared ? 'shared' : 'local';

/* ── 내가 쓴 의견 id 기억 (삭제 버튼 노출용) ── */
const mine = new Set(JSON.parse(localStorage.getItem(LS_MINE) || '[]'));
const rememberMine = id => { mine.add(String(id));
  localStorage.setItem(LS_MINE, JSON.stringify([...mine])); };
export const isMine = id => mine.has(String(id));

/* ── 마지막으로 고른 이름 기억 ── */
export const savedWho = () => localStorage.getItem(LS_WHO) || '';
export const saveWho  = v  => localStorage.setItem(LS_WHO, v);

/* ─────────── 로컬 백엔드 ─────────── */
const lsAll   = () => JSON.parse(localStorage.getItem(LS_KEY) || '{}');
const lsWrite = o  => localStorage.setItem(LS_KEY, JSON.stringify(o));

const local = {
  async rows(){
    return Object.values(lsAll()).flat()
      .sort((a,b) => a.created_at < b.created_at ? -1 : 1);
  },
  async add(topic, author, body){
    const all = lsAll();
    const row = { id:'l'+Date.now()+Math.random().toString(36).slice(2,7),
                  topic_id:topic, author, body, created_at:new Date().toISOString() };
    (all[topic] ||= []).push(row); lsWrite(all); rememberMine(row.id);
    return row;
  },
  async remove(topic, id){
    const all = lsAll();
    all[topic] = (all[topic] || []).filter(r => String(r.id) !== String(id));
    lsWrite(all);
  },
};

/* ─────────── 구글 시트 백엔드 ─────────── */
// Apps Script 웹앱은 OPTIONS(사전 요청)를 처리하지 못하므로
// 헤더를 따로 붙이지 않는다. 그래야 본문이 text/plain 으로 나가
// 사전 요청 없이 바로 전달된다.
async function post(payload){
  const res = await fetch(SHEET_API_URL, {
    method: 'POST',
    redirect: 'follow',
    body: JSON.stringify(payload),
  });
  if(!res.ok) throw new Error(`서버 응답 ${res.status}`);
  const data = await res.json();
  if(!data.ok) throw new Error(data.error || '알 수 없는 오류');
  return data;
}

const sheet = {
  async rows(){
    const res = await fetch(SHEET_API_URL, { redirect:'follow' });
    if(!res.ok) throw new Error(`서버 응답 ${res.status}`);
    const data = await res.json();
    if(!data.ok) throw new Error(data.error || '알 수 없는 오류');
    return data.rows;
  },
  async add(topic, author, body){
    const { row } = await post({ action:'add', topic_id:topic, author, body });
    rememberMine(row.id);
    return row;
  },
  async remove(topic, id){
    await post({ action:'delete', id });
  },
};

const backend = isShared ? sheet : local;

/* ─────────── 한 번 읽어 모든 항목이 나눠 쓰기 ───────────
   시트 왕복은 0.5~1.5초라 항목마다 부르면 느리다.
   한 번 받아 15초간 재사용하고, 쓰거나 지우면 즉시 버린다. */
const TTL = 15000;
let cache = null;        // { ts, rows }
let inflight = null;

async function allRows({ fresh = false } = {}){
  if(!fresh && cache && Date.now() - cache.ts < TTL) return cache.rows;
  if(!fresh && inflight) return inflight;
  inflight = backend.rows()
    .then(rows => { cache = { ts: Date.now(), rows }; return rows; })
    .finally(() => { inflight = null; });
  return inflight;
}

const drop = () => { cache = null; };

export async function listComments(topic, opts){
  const rows = await allRows(opts);
  return rows.filter(r => r.topic_id === topic);
}

export async function addComment(topic, author, body){
  const row = await backend.add(topic, author, body);
  drop();
  return row;
}

export async function removeComment(topic, id){
  await backend.remove(topic, id);
  drop();
}

export async function allCounts(opts){
  try {
    const rows = await allRows(opts);
    return rows.reduce((m,r) => (m[r.topic_id] = (m[r.topic_id]||0)+1, m), {});
  } catch { return {}; }
}

export const refresh = () => allRows({ fresh:true });
