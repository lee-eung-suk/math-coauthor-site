import { MEETINGS, AUTHORS } from './data.js';
import { $, $$, esc, theme, toast, fmtDate, dday, footMode } from './ui.js';
import * as CM from './comments.js';

theme();
footMode(CM.isShared);

const WHO = [...AUTHORS.map(a => a.name), '기타'];
const tabsEl = $('#tabs');
const panelEl = $('#panel');
let counts = {};

/* ── 회차 단추 ── */
function paintTabs(cur){
  tabsEl.innerHTML = MEETINGS.map(m => `
    <button class="tab${m.id === cur ? ' on' : ''}" data-id="${m.id}" type="button">
      ${esc(m.no)} 협의
      <small>${esc(fmtDate(m.date))}${counts[m.id] ? ` · ${counts[m.id]}건` : ''}</small>
    </button>`).join('');
  $$('.tab', tabsEl).forEach(b =>
    b.addEventListener('click', () => show(b.dataset.id)));
}

/* ── 한 회차 ── */
function show(id){
  const m = MEETINGS.find(x => x.id === id) || MEETINGS[0];
  location.hash = m.id;
  paintTabs(m.id);

  panelEl.innerHTML = `
    <div class="mt__head">
      <div class="mt__date">${esc(fmtDate(m.date))} · ${esc(dday(m.date))}</div>
      <h2 class="mt__title">${esc(m.no)} 협의 ― ${esc(m.title || '')}${
        m.status === 'next' ? ' <span class="mt__badge">예정</span>' : ''}</h2>
      ${m.summary ? `<p class="mt__sum">${esc(m.summary)}</p>` : ''}
    </div>
    ${m.notes && m.notes.length ? `
      <p class="sec2">정리된 내용</p>
      <div class="notes">${m.notes.map(([t, b]) =>
        `<div class="note"><b>${esc(t)}</b><p>${esc(b)}</p></div>`).join('')}</div>` : ''}
    <div class="cm" data-topic="${m.id}"></div>`;

  buildComments($('.cm', panelEl), m);
}

/* ── 협의 내용 쓰기 ── */
function buildComments(host, m){
  const topic = host.dataset.topic;
  host.innerHTML = `
    <div class="cm__head">
      <span class="cm__title">${esc(m.no)} 협의 기록</span>
      <span class="cm__state"></span>
      ${CM.isShared ? '<button class="cm__refresh" type="button">새로고침</button>' : ''}
    </div>
    ${CM.isShared ? '' : '<div class="cm__banner">체험 모드 — 이 브라우저에만 저장됩니다.</div>'}
    <form class="cm__form">
      <div class="cm__who"><b>작성자</b>${
        WHO.map(n => `<button type="button" class="who" data-name="${esc(n)}">${esc(n)}</button>`).join('')}</div>
      <textarea class="cm__ta" placeholder="협의 내용을 적어 주세요. 줄바꿈으로 여러 항목을 쓰셔도 됩니다. (Ctrl/⌘ + Enter 로 등록)"></textarea>
      <button type="submit" class="cm__send" disabled>등록</button>
    </form>
    <ul class="cm__list"><li class="cm__empty">불러오는 중…</li></ul>`;

  const form = $('.cm__form', host), ta = $('.cm__ta', host);
  const send = $('.cm__send', host), list = $('.cm__list', host);
  const state = $('.cm__state', host);
  let who = CM.savedWho();

  const btns = $$('.who', host);
  const paint = () => btns.forEach(b => b.classList.toggle('is-on', b.dataset.name === who));
  btns.forEach(b => b.addEventListener('click', () => {
    who = b.dataset.name; CM.saveWho(who); paint(); check(); ta.focus();
  }));
  paint();

  function check(){ send.disabled = !(who && ta.value.trim()); }
  ta.addEventListener('input', check);
  ta.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key === 'Enter') form.requestSubmit();
  });
  check();

  function render(rows){
    counts[topic] = rows.length;
    paintTabs(topic);
    if(!rows.length){
      list.innerHTML = '<li class="cm__empty">아직 적힌 내용이 없습니다.</li>';
      return;
    }
    list.innerHTML = rows.map(r => `
      <li class="cm__item">
        <div class="cm__meta">
          <span class="cm__author">${esc(r.author)}</span>
          <span class="cm__time">${esc(new Date(r.created_at).toLocaleString('ko-KR',
            { month:'numeric', day:'numeric', hour:'2-digit', minute:'2-digit' }))}</span>
          ${CM.isMine(r.id) ? `<button class="cm__del" type="button" data-id="${esc(r.id)}">삭제</button>` : ''}
        </div>
        <p class="cm__body">${esc(r.body)}</p>
      </li>`).join('');
    $$('.cm__del', list).forEach(b => b.addEventListener('click', async () => {
      if(!confirm('이 글을 삭제할까요?')) return;
      try { await CM.removeComment(topic, b.dataset.id); await load({ fresh:true }); toast('삭제했습니다.'); }
      catch(e){ toast('삭제 실패: ' + e.message); }
    }));
  }

  async function load(opts){
    try {
      state.textContent = opts && opts.fresh ? '불러오는 중…' : '';
      render(await CM.listComments(topic, opts));
      state.textContent = '';
    } catch(e){
      state.textContent = '불러오기 실패';
      list.innerHTML = `<li class="cm__empty">불러오지 못했습니다. (${esc(e.message)})</li>`;
    }
  }

  const rb = $('.cm__refresh', host);
  if(rb) rb.addEventListener('click', async () => {
    rb.disabled = true; await load({ fresh:true }); rb.disabled = false;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = ta.value.trim();
    if(!who || !body) return;
    send.disabled = true; send.textContent = '등록 중…';
    try { await CM.addComment(topic, who, body); ta.value = ''; await load({ fresh:true }); toast('등록했습니다.'); }
    catch(err){ toast('등록 실패: ' + err.message); }
    finally { send.textContent = '등록'; check(); }
  });

  load();
}

/* ── 시작 ── */
CM.allCounts().then(m => { counts = m; }).catch(() => {}).finally(() => {
  const id = location.hash.slice(1);
  const start = MEETINGS.some(m => m.id === id)
    ? id
    : (MEETINGS.find(m => m.status === 'next') || MEETINGS[0]).id;
  show(start);
});
