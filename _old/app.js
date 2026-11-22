// ══════════════════════════════════════════════════════
//  화면 조립
// ══════════════════════════════════════════════════════
import { DRIVE_URL, AUTHORS, LENSES, SCHEDULE_OFFICIAL, SCHEDULE_REF, TOPICS } from './data.js';
import * as CM from './comments.js';

const $  = (s, r=document) => r.querySelector(s);
const $$ = (s, r=document) => [...r.querySelectorAll(s)];
const el = (tag, cls, html) => {
  const n = document.createElement(tag);
  if(cls)  n.className = cls;
  if(html != null) n.innerHTML = html;
  return n;
};
const esc = s => String(s).replace(/[&<>"']/g, c =>
  ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c]));

/* ─────────── 테마 ─────────── */
(function theme(){
  const KEY = 'mathbook.theme';
  const saved = localStorage.getItem(KEY);
  if(saved) document.documentElement.dataset.theme = saved;
  $('#themeBtn').addEventListener('click', () => {
    const cur = document.documentElement.dataset.theme;
    const sysDark = matchMedia('(prefers-color-scheme: dark)').matches;
    const next = cur ? (cur === 'dark' ? 'light' : 'dark') : (sysDark ? 'light' : 'dark');
    document.documentElement.dataset.theme = next;
    localStorage.setItem(KEY, next);
  });
})();

/* ─────────── 토스트 ─────────── */
let toastT;
function toast(msg){
  const t = $('#toast');
  t.textContent = msg; t.classList.add('is-on');
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('is-on'), 2400);
}

/* ─────────── 드라이브 링크 ─────────── */
$('#heroDrive').href = DRIVE_URL;
$('#driveCard').href = DRIVE_URL;

/* ─────────── 저자 카드 ─────────── */
$('#authorGrid').append(...AUTHORS.map(a => {
  const c = el('article', 'acard');
  c.style.setProperty('--c', `var(--${a.id})`);
  c.innerHTML = `
    <div class="acard__top">
      <span class="acard__badge">${esc(a.name[0])}</span>
      <div>
        <div class="acard__name">${esc(a.name)}</div>
        ${a.org ? `<div class="acard__org">${esc(a.org)}</div>` : ''}
      </div>
    </div>
    <div class="acard__role">${esc(a.role)}</div>
    <p class="acard__desc">${esc(a.desc)}</p>`;
  return c;
}));

/* ─────────── 서술 렌즈 ─────────── */
$('#lensGrid').append(...LENSES.map(l =>
  el('li', '', `<b>${esc(l.t)}</b><span>${esc(l.d)}</span>`)));

/* ─────────── 일정 ─────────── */
(function schedule(){
  const today = new Date(); today.setHours(0,0,0,0);
  const days  = d => Math.round((new Date(d+'T00:00:00') - today) / 86400000);
  const o = SCHEDULE_OFFICIAL;
  const n = days(o.date);
  const dday = n === 0 ? '오늘' : n > 0 ? `D-${n}` : `${-n}일 지남`;

  $('#officialDate').textContent = o.label;
  $('#officialTitle').textContent = o.title;
  $('#officialDday').textContent = dday;
  $('#officialPrep').textContent = o.prep;
  $('#officialDesc').textContent = o.desc;

  $('#refNote').textContent = SCHEDULE_REF.note;
  $('#refList').append(...SCHEDULE_REF.items.map(s => {
    const li = el('li', 'ref__item');
    if(days(s.date) < 0) li.classList.add('is-past');
    li.innerHTML = `<b>${esc(s.label)}</b><span>${esc(s.title)}</span>`;
    return li;
  }));

  $('#heroNext').innerHTML =
    `다음 일정 · <b>${esc(o.label)} ${esc(o.title)}</b>` +
    (n === 0 ? ' — 오늘입니다' : n > 0 ? ` — <b>${dday}</b>` : '') +
    `<span class="hero__prep">${esc(o.prep)}</span>`;
})();

/* ═══════════ 댓글 위젯 ═══════════ */
const WHO = [...AUTHORS.map(a => ({ id:a.id, name:a.name })), { id:'etc', name:'기타' }];
const idOf = name => (AUTHORS.find(a => a.name === name)?.id) || 'etc';

function fmt(iso){
  const d = new Date(iso), now = new Date();
  const p = n => String(n).padStart(2,'0');
  const sameY = d.getFullYear() === now.getFullYear();
  return `${sameY ? '' : d.getFullYear()+'. '}${d.getMonth()+1}. ${d.getDate()}. ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function buildComments(host){
  const topic = host.dataset.topic;
  host.innerHTML = `
    <div class="cm__head">
      <span class="cm__title">💬 의견 <span class="cm__n"></span></span>
      <span class="cm__state"></span>
      ${CM.isShared ? `<button class="cm__refresh" type="button" title="새로 올라온 의견 불러오기">새로고침</button>` : ''}
    </div>
    ${CM.isShared ? '' : `<div class="cm__banner">
      <b>체험 모드</b> — 지금은 의견이 <b>이 브라우저에만</b> 저장됩니다.
      <code>js/config.js</code> 에 구글 시트 주소를 넣으면 네 분이 함께 보게 됩니다.
    </div>`}
    <form class="cm__form">
      <div class="cm__who"><b>작성자</b>${
        WHO.map(w => `<button type="button" class="who" data-a="${w.id}" data-name="${esc(w.name)}">${esc(w.name)}</button>`).join('')
      }</div>
      <div class="cm__row">
        <textarea class="cm__ta" rows="2" placeholder="의견을 남겨 주세요. (Ctrl/⌘ + Enter 로 등록)"></textarea>
        <button type="submit" class="cm__send" disabled>등록</button>
      </div>
    </form>
    <ul class="cm__list"><li class="cm__empty">불러오는 중…</li></ul>`;

  const form  = $('.cm__form', host);
  const ta    = $('.cm__ta', host);
  const send  = $('.cm__send', host);
  const list  = $('.cm__list', host);
  const nEl   = $('.cm__n', host);
  const state = $('.cm__state', host);
  let who = CM.savedWho();

  const whoBtns = $$('.who', host);
  const paintWho = () => whoBtns.forEach(b => b.classList.toggle('is-on', b.dataset.name === who));
  whoBtns.forEach(b => b.addEventListener('click', () => {
    who = b.dataset.name; CM.saveWho(who); paintWho(); validate(); ta.focus();
  }));
  paintWho();

  function validate(){ send.disabled = !(who && ta.value.trim()); }
  ta.addEventListener('input', validate);
  ta.addEventListener('keydown', e => {
    if((e.metaKey || e.ctrlKey) && e.key === 'Enter') form.requestSubmit();
  });
  validate();

  function render(rows){
    nEl.textContent = rows.length ? `${rows.length}` : '';
    host.dispatchEvent(new CustomEvent('cm:count',
      { bubbles:true, detail:{ topic, count:rows.length } }));
    if(!rows.length){
      list.innerHTML = `<li class="cm__empty">아직 의견이 없습니다. 첫 의견을 남겨 주세요.</li>`;
      return;
    }
    list.innerHTML = '';
    rows.forEach(r => {
      const li = el('li', 'cm__item');
      li.dataset.a = idOf(r.author);
      li.innerHTML = `
        <div class="cm__meta">
          <span class="cm__author">${esc(r.author)}</span>
          <span class="cm__time">${esc(fmt(r.created_at))}</span>
          ${CM.isMine(r.id) ? `<button class="cm__del" type="button">삭제</button>` : ''}
        </div>
        <p class="cm__body">${esc(r.body)}</p>`;
      const del = $('.cm__del', li);
      if(del) del.addEventListener('click', async () => {
        if(!confirm('이 의견을 삭제할까요?')) return;
        try { await CM.removeComment(topic, r.id); await load(); toast('삭제했습니다.'); }
        catch(e){ toast('삭제 실패: ' + e.message); }
      });
      list.append(li);
    });
  }

  async function load(opts){
    try {
      state.textContent = opts && opts.fresh ? '불러오는 중…' : '';
      render(await CM.listComments(topic, opts));
      state.textContent = '';
    } catch(e){
      state.textContent = '불러오기 실패';
      list.innerHTML = `<li class="cm__empty">의견을 불러오지 못했습니다. (${esc(e.message)})</li>`;
    }
  }

  const refreshBtn = $('.cm__refresh', host);
  if(refreshBtn) refreshBtn.addEventListener('click', async () => {
    refreshBtn.disabled = true;
    await load({ fresh:true });
    refreshBtn.disabled = false;
  });

  form.addEventListener('submit', async e => {
    e.preventDefault();
    const body = ta.value.trim();
    if(!who || !body) return;
    send.disabled = true; send.textContent = '등록 중…';
    try {
      await CM.addComment(topic, who, body);
      ta.value = ''; await load(); toast('의견을 등록했습니다.');
    } catch(err){
      toast('등록 실패: ' + err.message);
    } finally {
      send.textContent = '등록'; validate();
    }
  });

  host.__reload = load;
  load();
}

/* ═══════════ 협의 카드 ═══════════ */
(function topics(){
  const wrap = $('#topicList');
  $('#topicCount').textContent = TOPICS.length;

  TOPICS.forEach((t, i) => {
    const card = el('article', 'tcard');
    card.id = t.id;
    card.innerHTML = `
      <button class="tcard__btn" type="button" aria-expanded="false" aria-controls="${t.id}-panel">
        <span class="tcard__no">${String(i+1).padStart(2,'0')}</span>
        <span>
          <h3 class="tcard__h">${esc(t.title)}</h3>
          <p class="tcard__sum">${esc(t.summary)}</p>
          <ul class="tcard__tags">${t.tags.map(x => `<li>${esc(x)}</li>`).join('')}</ul>
        </span>
        <span class="tcard__meta">
          <span class="tcard__cnt" data-cnt>의견 0</span>
          <span class="tcard__caret" aria-hidden="true">▾</span>
        </span>
      </button>
      <div class="tcard__panel" id="${t.id}-panel" role="region">
        <div class="tcard__panelIn">
          <div class="tcard__body">
            <div class="rt">${t.html}</div>
            <div class="comments" data-topic="${t.id}"></div>
          </div>
        </div>
      </div>`;

    const btn = $('.tcard__btn', card);
    let built = false;
    btn.addEventListener('click', () => {
      const open = card.classList.toggle('is-open');
      btn.setAttribute('aria-expanded', String(open));
      if(open && !built){ built = true; buildComments($('.comments', card)); }
      if(open) history.replaceState(null, '', '#' + t.id);
    });
    card.__open = () => { if(!card.classList.contains('is-open')) btn.click(); };
    wrap.append(card);
  });

  $('#expandAll').addEventListener('click',  () => $$('.tcard', wrap).forEach(c => c.__open()));
  $('#collapseAll').addEventListener('click', () => $$('.tcard', wrap).forEach(c => {
    c.classList.remove('is-open');
    $('.tcard__btn', c).setAttribute('aria-expanded', 'false');
  }));

  // 해시로 들어오면 해당 카드 자동으로 펼치기
  function openFromHash(scroll){
    const h = location.hash.slice(1);
    if(!h) return;
    const target = wrap.querySelector('#' + CSS.escape(h));
    if(!target) return;
    target.__open();
    if(scroll) setTimeout(() => target.scrollIntoView({ block:'start' }), 120);
  }
  openFromHash(true);
  addEventListener('hashchange', () => openFromHash(true));
})();

/* ─────────── 접힌 카드에도 의견 수 표시 ─────────── */
function paintCount(topic, count){
  const chip = document.querySelector(`#${CSS.escape(topic)} [data-cnt]`);
  if(!chip) return;
  chip.textContent = count ? `의견 ${count}` : '의견 0';
  chip.classList.toggle('has', count > 0);
}
document.addEventListener('cm:count', e => paintCount(e.detail.topic, e.detail.count));

CM.allCounts().then(map => {
  TOPICS.forEach(t => paintCount(t.id, map[t.id] || 0));
}).catch(() => {});

/* ─────────── 전체 의견판 ─────────── */
$$('.comments[data-topic="__general__"]').forEach(buildComments);

/* ─────────── 모드 표시 ─────────── */
$('#footMode').textContent = CM.isShared
  ? '의견: 구글 시트 공유 모드 — 네 분이 같은 의견을 봅니다.'
  : '의견: 체험 모드 — 이 브라우저에만 저장됩니다. (js/config.js 에 구글 시트 주소를 넣으면 공유됩니다)';
