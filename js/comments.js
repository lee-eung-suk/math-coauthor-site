// ══════════════════════════════════════════════════════
//  댓글 — Supabase(공유) / localStorage(체험) 이중 백엔드
// ══════════════════════════════════════════════════════
import { SUPABASE_URL, SUPABASE_ANON_KEY } from './config.js';

const LS_KEY   = 'mathbook.comments.v1';
const LS_MINE  = 'mathbook.mine.v1';
const LS_WHO   = 'mathbook.who.v1';

export const isShared = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
export const mode     = isShared ? 'shared' : 'local';

/* ── 내가 쓴 댓글 id 기억 (삭제 버튼 노출용) ── */
const mine = new Set(JSON.parse(localStorage.getItem(LS_MINE) || '[]'));
const rememberMine = id => { mine.add(String(id));
  localStorage.setItem(LS_MINE, JSON.stringify([...mine])); };
export const isMine = id => mine.has(String(id));

/* ── 마지막으로 고른 이름 기억 ── */
export const savedWho = () => localStorage.getItem(LS_WHO) || '';
export const saveWho  = v  => localStorage.setItem(LS_WHO, v);

/* ── 로컬 백엔드 ── */
const lsAll   = () => JSON.parse(localStorage.getItem(LS_KEY) || '{}');
const lsWrite = o  => localStorage.setItem(LS_KEY, JSON.stringify(o));

const local = {
  async list(topic){ return (lsAll()[topic] || []).slice().sort((a,b)=>a.created_at<b.created_at?-1:1); },
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

/* ── Supabase 백엔드 (REST, SDK 없이) ── */
const REST = `${SUPABASE_URL}/rest/v1/comments`;
const headers = {
  apikey: SUPABASE_ANON_KEY,
  Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
  'Content-Type': 'application/json',
};

async function call(url, opts = {}){
  const res = await fetch(url, { ...opts, headers:{ ...headers, ...(opts.headers||{}) } });
  if(!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.status === 204 ? null : res.json();
}

const remote = {
  async list(topic){
    return call(`${REST}?topic_id=eq.${encodeURIComponent(topic)}&order=created_at.asc`);
  },
  async add(topic, author, body){
    const [row] = await call(REST, {
      method:'POST',
      headers:{ Prefer:'return=representation' },
      body: JSON.stringify({ topic_id:topic, author, body }),
    });
    rememberMine(row.id);
    return row;
  },
  async remove(topic, id){
    await call(`${REST}?id=eq.${encodeURIComponent(id)}`, { method:'DELETE' });
  },
  async counts(){
    const rows = await call(`${REST}?select=topic_id`);
    return rows.reduce((m,r)=>(m[r.topic_id]=(m[r.topic_id]||0)+1, m), {});
  },
};

const backend = isShared ? remote : local;

export const listComments   = (t)       => backend.list(t);
export const addComment     = (t,a,b)   => backend.add(t,a,b);
export const removeComment  = (t,id)    => backend.remove(t,id);

export async function allCounts(){
  if(isShared){
    try { return await remote.counts(); } catch { return {}; }
  }
  const all = lsAll();
  return Object.fromEntries(Object.entries(all).map(([k,v]) => [k, v.length]));
}
