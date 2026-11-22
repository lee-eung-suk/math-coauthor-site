import { AUTHORS, LENSES, FORMAT } from './data.js';
import { $, esc, theme, footMode } from './ui.js';
import * as CM from './comments.js';

theme();
footMode(CM.isShared);

$('#authors').innerHTML = AUTHORS.map(a => `
  <div class="card">
    <b>${esc(a.name)}</b>
    ${a.org ? `<em>${esc(a.org)}</em>` : '<em>&nbsp;</em>'}
    <i>${esc(a.role)}</i>
    <p>${esc(a.desc)}</p>
  </div>`).join('');

const rows = list => list.map(([k, v]) =>
  `<div class="row"><b>${esc(k)}</b><span>${esc(v)}</span></div>`).join('');
$('#lenses').innerHTML = rows(LENSES);
$('#format').innerHTML = rows(FORMAT);
