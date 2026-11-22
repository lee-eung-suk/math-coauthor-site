// 세 쪽이 같이 쓰는 것들
export const $  = (s, r = document) => r.querySelector(s);
export const $$ = (s, r = document) => [...r.querySelectorAll(s)];
export const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

export function theme(){
  const KEY = 'mathbook.theme';
  const saved = localStorage.getItem(KEY);
  if(saved) document.documentElement.dataset.theme = saved;
  const btn = $('#themeBtn');
  if(!btn) return;
  btn.addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const next = cur ? (cur === 'dark' ? 'light' : 'dark') : (sysDark ? 'light' : 'dark');
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
  });
}

let tt;
export function toast(msg){
  const t = $('#toast');
  if(!t) return;
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(tt); tt = setTimeout(() => t.classList.remove('is-on'), 2400);
}

export const fmtDate = iso => {
  const d = new Date(iso + (iso.length === 10 ? 'T00:00:00' : ''));
  return `${d.getFullYear()}. ${d.getMonth()+1}. ${d.getDate()}.`;
};

export const dday = iso => {
  const today = new Date(); today.setHours(0,0,0,0);
  const n = Math.round((new Date(iso + 'T00:00:00') - today) / 86400000);
  return n === 0 ? '오늘' : n > 0 ? `D-${n}` : `${-n}일 지남`;
};

export function footMode(isShared){
  const el = $('#footMode');
  if(el) el.textContent = isShared
    ? '협의 내용은 구글 시트에 함께 쌓입니다.'
    : '체험 모드 — 이 브라우저에만 저장됩니다. (js/config.js 에 시트 주소를 넣으세요)';
}
