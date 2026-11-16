import { SCALES, PARTS, ITEMS } from './items.js';
import { scoreAll, describe } from './scoring.js';
import { loadHistory, saveRun, clearHistory, compare, exportHistory, importHistory, PART_IDS } from './history.js';

const $ = (s) => document.querySelector(s);
const el = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
const icon = (name, cls = '') => {
  const ns = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(ns, 'svg');
  if (cls) svg.setAttribute('class', cls);
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(ns, 'use');
  use.setAttribute('href', `#i-${name}`);
  svg.append(use);
  return svg;
};

const SWITCH_AT = ITEMS.findIndex((i) => SCALES[PARTS[i.part].scale] === SCALES.ipip);
const ADVANCE_MS = 180; // pause so the chosen answer is seen before moving on

const state = { i: 0, answers: {}, screen: 'intro', advancing: null };

// ---------- screens ----------
function show(name) {
  for (const id of ['intro', 'quiz', 'switch', 'results', 'history']) $('#' + id).hidden = id !== name;
  if (name !== 'history') state.from = name;
  state.screen = name;
  window.scrollTo({ top: 0 });
}

function partIcon(partId) {
  const box = el('span', 'part-ic');
  box.append(icon(PARTS[partId].icon));
  return box;
}

function renderIntro() {
  const ul = $('#parts-preview');
  for (const [id, p] of Object.entries(PARTS)) {
    const li = el('li');
    const txt = el('div');
    txt.append(el('strong', '', p.name), el('span', '', p.short));
    li.append(partIcon(id), txt);
    ul.append(li);
  }
  for (const target of ['#sources-intro', '#sources-results']) renderSources($(target));
}

function renderSources(box) {
  for (const s of Object.values(SCALES)) {
    const p = el('p', 'src');
    const a = el('a', '', 'source');
    a.href = s.source; a.target = '_blank'; a.rel = 'noopener';
    p.append(el('strong', '', s.name + '. '), s.citation + ' ' + s.license + ' ', a);
    box.append(p);
  }
}

// ---------- quiz ----------
function renderQuestion(dir = 1) {
  const item = ITEMS[state.i];
  const part = PARTS[item.part];
  const scale = SCALES[part.scale];
  $('#q-count').textContent = `${state.i + 1} of ${ITEMS.length}`;
  $('#q-part').textContent = part.name;
  $('#q-instr').textContent = scale === SCALES.rosenberg
    ? 'How much do you agree?'
    : 'How accurately does this describe you, as you generally are now?';
  $('#q-text').textContent = item.text;
  const done = Object.keys(state.answers).length;
  $('#progress i').style.width = `${(done / ITEMS.length) * 100}%`;
  $('#progress').setAttribute('aria-valuenow', done);
  $('#key-hint').textContent = `Keys 1–${scale.options.length} answer`;

  const box = $('#options');
  box.replaceChildren();
  scale.options.forEach((o, n) => {
    const b = el('button', 'opt');
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', String(state.answers[item.id] === o.value));
    b.append(el('span', 'num', String(n + 1)), el('span', '', o.label));
    b.addEventListener('click', () => choose(o.value));
    box.append(b);
  });
  $('#back').disabled = false;

  const wrap = $('#q-wrap');
  wrap.classList.remove('swap', 'swap-back');
  void wrap.offsetWidth; // restart the animation
  wrap.classList.add(dir > 0 ? 'swap' : 'swap-back');
}

function choose(value) {
  const item = ITEMS[state.i];
  state.answers[item.id] = value;
  // Instant feedback: mark the choice now, move on a beat later.
  const opts = SCALES[PARTS[item.part].scale].options;
  [...$('#options').children].forEach((b, n) => b.setAttribute('aria-checked', String(opts[n].value === value)));
  $('#progress i').style.width = `${(Object.keys(state.answers).length / ITEMS.length) * 100}%`;
  clearTimeout(state.advancing);
  state.advancing = setTimeout(next, ADVANCE_MS);
}

function next() {
  state.advancing = null;
  if (state.i === ITEMS.length - 1) return showResults();
  state.i += 1;
  if (state.i === SWITCH_AT && !state.seenSwitch) { state.seenSwitch = true; return show('switch'); }
  renderQuestion(1);
}

function back() {
  clearTimeout(state.advancing);
  state.advancing = null;
  if (state.screen === 'switch') { state.i = SWITCH_AT - 1; state.seenSwitch = false; show('quiz'); return renderQuestion(-1); }
  if (state.screen !== 'quiz') return;
  if (state.i === 0) return show('intro');
  if (state.i === SWITCH_AT) { state.seenSwitch = false; state.i -= 1; return renderQuestion(-1); }
  state.i -= 1;
  renderQuestion(-1);
}

function start() {
  state.i = 0; state.answers = {}; state.seenSwitch = false;
  show('quiz');
  renderQuestion(1);
}

// ---------- results ----------
function answerLabel(item) {
  const scale = SCALES[PARTS[item.part].scale];
  return scale.options.find((o) => o.value === state.answers[item.id])?.label ?? '—';
}

function showResults() {
  const { parts, overall } = scoreAll(state.answers);
  if (overall === null) { // should not happen; guard against a wrong number
    const missing = ITEMS.findIndex((i) => !(i.id in state.answers));
    state.i = Math.max(0, missing); show('quiz'); return renderQuestion(1);
  }
  show('results');
  state.result = { parts, overall };
  const ul = $('#rows');
  ul.replaceChildren();
  for (const [id, p] of Object.entries(PARTS)) {
    const li = el('li');
    const head = el('button', 'rr-head');
    head.type = 'button';
    head.setAttribute('aria-expanded', 'false');
    const name = el('span', 'rr-name', p.name);
    name.append(el('span', 'rr-short', p.short));
    const track = el('span', 'track');
    const bar = el('i');
    track.append(bar);
    head.append(partIcon(id), name, el('span', 'rr-score', String(Math.round(parts[id]))), icon('chev', 'rr-chev'), el('span'), track);

    const body = el('div', 'rr-body');
    const wrap = el('div');
    const inner = el('div', 'rr-inner');
    const para = (k, v) => { const pp = el('p'); pp.append(el('span', 'k', k), v); return pp; };
    inner.append(
      para('Your answers', describe(id, state.answers)),
      para('What it measures', p.measures),
      para('What it doesn’t', p.doesNot),
      para('Reliability', p.reliability + ' α runs from 0 to 1 and says how consistently the statements move together; above .7 is a common rule of thumb for "good enough".'),
    );
    const al = el('ul', 'answers');
    for (const it of ITEMS.filter((x) => x.part === id)) {
      const row = el('li');
      const q = el('span', '', it.text);
      if (it.key === -1) q.append(el('span', 'rev', 'flipped'));
      row.append(q, el('span', 'a', answerLabel(it)));
      al.append(row);
    }
    inner.append(el('span', 'k', 'Each statement and your answer'), al);
    wrap.append(inner);
    body.append(wrap);
    head.addEventListener('click', () => {
      const open = li.classList.toggle('open');
      head.setAttribute('aria-expanded', String(open));
    });
    li.append(head, body);
    ul.append(li);
    requestAnimationFrame(() => requestAnimationFrame(() => { bar.style.width = `${parts[id]}%`; }));
  }
  countUp($('#overall'), Math.round(overall));
  state.saved = false;
  $('#save-history span').textContent = 'Save to my history';
  renderSince();
}

function countUp(node, to) {
  const reduce = document.documentElement.dataset.motion === 'reduce' ||
    (document.documentElement.dataset.motion !== 'full' && matchMedia('(prefers-reduced-motion: reduce)').matches);
  if (reduce) { node.textContent = to; return; }
  const t0 = performance.now(), dur = 700;
  const step = (t) => {
    const k = Math.min(1, (t - t0) / dur);
    node.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(step);
  };
  requestAnimationFrame(step);
}

// ---------- history ----------
const store = (() => { try { return window.localStorage; } catch { return null; } })();
const history = () => (store ? loadHistory(store) : []);
const NAMES = { ...Object.fromEntries(Object.entries(PARTS).map(([id, p]) => [id, p.name])), overall: 'Overall' };
const fmtDate = (iso, long) => new Date(iso).toLocaleDateString(undefined, long ? { day: 'numeric', month: 'short', year: 'numeric' } : { day: 'numeric', month: 'short' });
const signed = (d) => (d > 0 ? `+${d}` : d < 0 ? `−${-d}` : '0');

function refreshHistoryCounts() {
  const n = history().length;
  $('#open-history').hidden = n === 0;
  $('#history-count').textContent = n ? String(n) : '';
  $('#settings-history-count').textContent = n ? `(${n})` : '';
  $('#clear-history').disabled = n === 0;
}

// On the results screen: how this result compares with the last saved one.
function renderSince() {
  const box = $('#since');
  const runs = history();
  const prev = state.saved ? runs[runs.length - 2] : runs[runs.length - 1];
  box.replaceChildren();
  if (!prev) { box.hidden = true; return; }
  const cur = { parts: Object.fromEntries(PART_IDS.map((id) => [id, Math.round(state.result.parts[id])])), overall: 0 };
  cur.overall = Math.round(PART_IDS.reduce((s, id) => s + state.result.parts[id], 0) / PART_IDS.length);
  const c = compare(prev, cur);
  box.append(el('span', 'k', `Since your last saved result · ${fmtDate(prev.at, true)}`));
  const ul = el('ul');
  for (const row of [...c.parts, c.overall]) {
    const li = el('li', row.id === 'overall' ? 'total' : '');
    li.append(el('span', '', NAMES[row.id]), el('span', 'n', `${row.before} → ${row.after}`),
      el('span', row.same ? 'same' : 'moved', row.same ? 'about the same' : `${signed(row.change)}`));
    ul.append(li);
  }
  box.append(ul);
  box.hidden = false;
}

function onSaveHistory() {
  if (state.saved) return openHistory();
  if (!state.result) return;
  const out = store ? saveRun(store, state.result) : null;
  const label = $('#save-history span');
  if (!out) { label.textContent = 'Couldn’t save (storage blocked)'; return; }
  state.saved = true;
  label.textContent = 'Saved · see your history';
  refreshHistoryCounts();
  renderSince();
}

function openHistory() {
  $('#import-note').textContent = '';
  show('history'); // show first so the chart can measure its width
  renderHistory();
}

function renderHistory() {
  const runs = history();
  $('#history-lede').textContent = runs.length
    ? `${runs.length} saved result${runs.length === 1 ? '' : 's'}, from ${fmtDate(runs[0].at, true)}${runs.length > 1 ? ` to ${fmtDate(runs.at(-1).at, true)}` : ''}. Overall score by date, then each part.`
    : 'Nothing saved yet. After a run, press “Save to my history” to start tracking.';
  const t = $('#runs');
  t.replaceChildren();
  $('#trend').hidden = t.hidden = runs.length === 0;
  renderTrend($('#trend'), runs);
  if (!runs.length) return;
  const head = el('tr');
  const SHORT = { worth: 'Worth', efficacy: 'Handling', assert: 'Speaking', steady: 'Steady' };
  const th = (text, full) => { const n = el('th', '', text); if (full) { n.title = full; n.setAttribute('abbr', full); } return n; };
  head.append(th('Date'), ...PART_IDS.map((id) => th(SHORT[id], PARTS[id].name)), th('All', 'Overall'));
  const thead = el('thead'); thead.append(head);
  const tbody = el('tbody');
  for (const r of [...runs].reverse()) {
    const tr = el('tr');
    tr.append(el('td', 'date', fmtDate(r.at, true)), ...PART_IDS.map((id) => el('td', '', String(r.parts[id]))), el('td', 'all', String(r.overall)));
    tbody.append(tr);
  }
  t.append(thead, tbody);
}

// Overall score by date as a small SVG line. Runs are evenly spaced so same-day runs stay readable.
function renderTrend(fig, runs) {
  const ns = 'http://www.w3.org/2000/svg';
  const mk = (tag, attrs, text) => { const n = document.createElementNS(ns, tag); for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v); if (text != null) n.textContent = text; return n; };
  fig.replaceChildren();
  if (!runs.length) return;
  const W = (fig.clientWidth > 0 ? Math.max(280, Math.round(fig.clientWidth - 16)) : 560), H = 200, L = 34, R = 18, T = 18, B = 26; // drawn at real width so text stays legible
  const svg = mk('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img', 'aria-label': `Overall score over ${runs.length} saved results: ${runs.map((r) => `${fmtDate(r.at)} ${r.overall}`).join(', ')}` });
  const y = (v) => T + (1 - v / 100) * (H - T - B);
  const P = 22; // keep the first and last points clear of the axis labels
  const x = (i) => (runs.length === 1 ? (L + W - R) / 2 : L + P + (i * (W - L - R - 2 * P)) / (runs.length - 1));
  for (const v of [0, 50, 100]) {
    svg.append(mk('line', { class: 'grid', x1: L, x2: W - R, y1: y(v), y2: y(v) }), mk('text', { class: 'axis', x: L - 8, y: y(v) + 4, 'text-anchor': 'end' }, String(v)));
  }
  if (runs.length > 1) svg.append(mk('polyline', { class: 'line', points: runs.map((r, i) => `${x(i)},${y(r.overall)}`).join(' ') }));
  const every = Math.ceil(runs.length / Math.max(2, Math.floor(W / 90))); // date labels spaced ~90px apart
  runs.forEach((r, i) => {
    const last = i === runs.length - 1;
    svg.append(mk('circle', { class: `dot${last ? ' last' : ''}`, cx: x(i), cy: y(r.overall), r: last ? 5 : 4 }));
    if (last || runs.length <= W / 60) svg.append(mk('text', { class: 'val', x: x(i), y: y(r.overall) - 10, 'text-anchor': 'middle' }, String(r.overall)));
    if ((i % every === 0 && runs.length - 1 - i >= every) || last) svg.append(mk('text', { class: 'axis', x: x(i), y: H - 6, 'text-anchor': runs.length === 1 ? 'middle' : i === 0 ? 'start' : last ? 'end' : 'middle' }, fmtDate(r.at)));
  });
  fig.append(svg);
}

function onExport() {
  const blob = new Blob([exportHistory(history())], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'Self Assured history.json';
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

async function onImport(e) {
  const file = e.target.files?.[0];
  e.target.value = '';
  if (!file || !store) return;
  if (file.size > 1_000_000) { $('#import-note').textContent = 'That file is too large to be a Self Assured history.'; return; }
  const r = importHistory(store, await file.text());
  $('#import-note').textContent = !r.ok
    ? 'That file isn’t a Self Assured history export.'
    : `Added ${r.added} result${r.added === 1 ? '' : 's'}${r.skipped ? `, skipped ${r.skipped} that didn’t look right` : ''}.`;
  refreshHistoryCounts();
  renderHistory();
}

// ---------- share image ----------
async function saveImage() {
  await document.fonts.ready;
  const { parts, overall } = state.result;
  const W = 1080, H = 1350;
  const c = document.createElement('canvas');
  c.width = W; c.height = H;
  const g = c.getContext('2d');
  const css = getComputedStyle(document.documentElement);
  const v = (n) => css.getPropertyValue(n).trim();
  g.fillStyle = v('--bg'); g.fillRect(0, 0, W, H);
  const ink = v('--ink'), mute = v('--mute'), blue = v('--blue'), line = v('--line'), terra = v('--terra');
  const icon = new Image();
  icon.src = 'assets/icon.svg';
  await icon.decode().catch(() => {});
  if (icon.complete && icon.naturalWidth) g.drawImage(icon, 96, 96, 72, 72);
  g.fillStyle = ink; g.font = '500 40px Newsreader, Georgia, serif'; g.fillText('Self Assured', 190, 146);
  g.fillStyle = terra; g.font = '600 26px Inter, sans-serif'; g.fillText('MY RESULT', 96, 290);
  g.fillStyle = ink; g.font = '500 220px Newsreader, Georgia, serif'; g.fillText(String(Math.round(overall)), 88, 500);
  const w = g.measureText(String(Math.round(overall))).width;
  g.fillStyle = mute; g.font = '400 44px Inter, sans-serif'; g.fillText('/ 100', 88 + w + 20, 500);
  g.font = '400 28px Inter, sans-serif'; g.fillText('Average of four parts. A position on these scales,', 96, 570);
  g.fillText('not a comparison with other people.', 96, 610);
  let y = 720;
  for (const [id, p] of Object.entries(PARTS)) {
    g.fillStyle = ink; g.font = '600 34px Inter, sans-serif'; g.fillText(p.name, 96, y);
    g.font = '500 40px Newsreader, Georgia, serif'; g.textAlign = 'right'; g.fillText(String(Math.round(parts[id])), W - 96, y); g.textAlign = 'left';
    g.fillStyle = line; roundRect(g, 96, y + 24, W - 192, 14, 7);
    if (parts[id] > 0) { g.fillStyle = blue; roundRect(g, 96, y + 24, Math.max(14, (W - 192) * parts[id] / 100), 14, 7); }
    y += 130;
  }
  g.fillStyle = mute; g.font = '400 24px Inter, sans-serif';
  g.fillText('Rosenberg Self-Esteem Scale + IPIP-NEO-120 facets', 96, H - 110);
  g.fillText(location.host ? location.host + location.pathname.replace(/index\.html$/, '') : 'Self Assured', 96, H - 72);
  c.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'Self Assured result.png';
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  }, 'image/png');
}
function roundRect(g, x, y, w, h, r) { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); }

// ---------- settings ----------
const SETTINGS_KEY = 'sa-settings';
function loadSettings() { try { return JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}'); } catch { return {}; } }
function applySettings(s) {
  const root = document.documentElement;
  for (const k of ['theme', 'motion']) {
    if (s[k] && s[k] !== 'system') root.dataset[k] = s[k]; else delete root.dataset[k];
  }
}
function openSettings() {
  const s = loadSettings();
  for (const k of ['theme', 'motion']) {
    const inp = document.querySelector(`input[name="${k}"][value="${s[k] || 'system'}"]`);
    if (inp) inp.checked = true;
  }
  refreshHistoryCounts();
  $('#settings').showModal();
}
function wireSettings() {
  $('#open-settings').addEventListener('click', openSettings);
  $('#settings').addEventListener('change', (e) => {
    const s = loadSettings();
    s[e.target.name] = e.target.value;
    applySettings(s);
    try { localStorage.setItem(SETTINGS_KEY, JSON.stringify(s)); } catch {}
  });
  $('#clear-settings').addEventListener('click', () => {
    try { localStorage.removeItem(SETTINGS_KEY); } catch {}
    applySettings({});
    for (const k of ['theme', 'motion']) document.querySelector(`input[name="${k}"][value="system"]`).checked = true;
    $('#clear-settings').textContent = 'Deleted';
  });
  $('#clear-history').addEventListener('click', () => {
    const n = history().length;
    if (!n || !confirm(`Delete all ${n} saved result${n === 1 ? '' : 's'} from this browser? This can't be undone unless you exported them.`)) return;
    if (store) clearHistory(store);
    state.saved = false;
    refreshHistoryCounts();
    if (state.screen === 'history') renderHistory();
    if (state.screen === 'results') { renderSince(); $('#save-history span').textContent = 'Save to my history'; }
  });
}

// ---------- input ----------
const focusFree = () => { const a = document.activeElement; return !a || a === document.body || !a.offsetParent; };
function onKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); return openSettings(); }
  if ($('#settings').open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (state.screen === 'intro' && e.key === 'Enter' && focusFree()) { e.preventDefault(); return start(); }
  if (state.screen === 'switch' && e.key === 'Enter' && focusFree()) { e.preventDefault(); return goOn(); }
  if (state.screen === 'history' && (e.key === 'Escape' || e.key === 'ArrowLeft') && focusFree()) { e.preventDefault(); return show(state.from || 'intro'); }
  if (state.screen === 'quiz' || state.screen === 'switch') {
    if (e.key === 'ArrowLeft' || e.key === 'Backspace') { e.preventDefault(); return back(); }
  }
  if (state.screen === 'quiz' && /^[1-5]$/.test(e.key)) {
    const opts = SCALES[PARTS[ITEMS[state.i].part].scale].options;
    const o = opts[Number(e.key) - 1];
    if (o) choose(o.value);
  }
}
function goOn() { show('quiz'); renderQuestion(1); }

// ---------- boot ----------
renderIntro();
wireSettings();
$('#start').addEventListener('click', start);
$('#back').addEventListener('click', back);
$('#switch-back').addEventListener('click', back);
$('#switch-go').addEventListener('click', goOn);
$('#retake').addEventListener('click', start);
$('#save').addEventListener('click', saveImage);
$('#save-history').addEventListener('click', onSaveHistory);
$('#open-history').addEventListener('click', openHistory);
$('#history-back').addEventListener('click', () => { refreshHistoryCounts(); show(state.from || 'intro'); });
$('#export-history').addEventListener('click', onExport);
$('#import-history').addEventListener('change', onImport);
refreshHistoryCounts();
let resizeTimer;
addEventListener('resize', () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(() => { if (state.screen === 'history') renderTrend($('#trend'), history()); }, 150); });
document.addEventListener('keydown', onKey);
