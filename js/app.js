import { SCALES, PARTS, ITEMS } from './items.js';
import { scoreAll, describe } from './scoring.js';

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
  for (const id of ['intro', 'quiz', 'switch', 'results']) $('#' + id).hidden = id !== name;
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
}

// ---------- input ----------
const focusFree = () => { const a = document.activeElement; return !a || a === document.body || !a.offsetParent; };
function onKey(e) {
  if ((e.metaKey || e.ctrlKey) && e.key === ',') { e.preventDefault(); return openSettings(); }
  if ($('#settings').open || e.metaKey || e.ctrlKey || e.altKey) return;
  if (state.screen === 'intro' && e.key === 'Enter' && focusFree()) { e.preventDefault(); return start(); }
  if (state.screen === 'switch' && e.key === 'Enter' && focusFree()) { e.preventDefault(); return goOn(); }
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
document.addEventListener('keydown', onKey);
