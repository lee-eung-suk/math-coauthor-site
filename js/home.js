import { DRIVE_URL, MEETINGS, nextMeeting } from './data.js';
import { $, esc, theme, fmtDate, dday, footMode } from './ui.js';
import * as CM from './comments.js';

theme();
$('#driveLink').href = DRIVE_URL;
footMode(CM.isShared);

const m = nextMeeting();
$('#next').innerHTML = `
  <span class="next__tag">${m.status === 'next' ? '다음 협의' : '가장 최근 협의'}</span>
  <b class="next__date">${esc(fmtDate(m.date))} ${esc(m.no)} 협의</b>
  <span class="next__title">${esc(m.title || '')}</span>
  <span class="next__dday">${esc(dday(m.date))}</span>
  <a class="next__go" href="meetings#${m.id}">협의록 열기 →</a>`;

CM.allCounts().then(map => {
  const n = MEETINGS.reduce((s, x) => s + (map[x.id] || 0), 0);
  $('#mCount').textContent =
    `1차 · 2차 · 3차 협의 — 지금까지 적힌 글 ${n}건`;
}).catch(() => {});
