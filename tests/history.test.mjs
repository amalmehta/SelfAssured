import { test } from 'node:test';
import assert from 'node:assert/strict';
import { loadHistory, saveRun, clearHistory, compare, exportHistory, importHistory, cleanRun, HISTORY_KEY } from '../js/history.js';

const memory = () => {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, String(v)), removeItem: (k) => m.delete(k), m };
};
const result = (w, e, a, s) => ({ parts: { worth: w, efficacy: e, assert: a, steady: s }, overall: (w + e + a + s) / 4 });

test('saves scores and a date only, never answers', () => {
  const st = memory();
  saveRun(st, { ...result(61.4, 75, 56, 50), answers: { r1: 4 } }, new Date('2026-11-15T10:00:00Z'));
  const raw = JSON.parse(st.getItem(HISTORY_KEY));
  assert.deepEqual(raw, [{ at: '2026-11-15T10:00:00.000Z', parts: { worth: 61, efficacy: 75, assert: 56, steady: 50 }, overall: 61 }]);
});

test('history comes back oldest first', () => {
  const st = memory();
  saveRun(st, result(70, 70, 70, 70), new Date('2026-11-15'));
  saveRun(st, result(50, 50, 50, 50), new Date('2026-09-01'));
  assert.deepEqual(loadHistory(st).map((r) => r.overall), [50, 70]);
});

test('blocked or broken storage gives an empty history, not a crash', () => {
  const broken = { getItem: () => { throw new Error('blocked'); }, setItem: () => { throw new Error('blocked'); }, removeItem() {} };
  assert.deepEqual(loadHistory(broken), []);
  assert.equal(saveRun(broken, result(1, 2, 3, 4)), null);
  const st = memory();
  st.setItem(HISTORY_KEY, '{not json');
  assert.deepEqual(loadHistory(st), []);
});

test('compare labels gaps under 10 as about the same', () => {
  const c = compare(cleanRun({ at: '2026-10-02', parts: { worth: 55, efficacy: 70, assert: 58, steady: 41 } }),
                    cleanRun({ at: '2026-11-15', parts: { worth: 61, efficacy: 75, assert: 56, steady: 51 } }));
  assert.deepEqual(c.parts.map((p) => [p.change, p.same]), [[6, true], [5, true], [-2, true], [10, false]]);
  assert.equal(c.overall.change, 61 - 56);
});

test('export then import round-trips, skips duplicates and bad entries', () => {
  const a = memory();
  saveRun(a, result(10, 20, 30, 40), new Date('2026-01-01'));
  saveRun(a, result(50, 60, 70, 80), new Date('2026-02-01'));
  const file = exportHistory(loadHistory(a));

  const b = memory();
  saveRun(b, result(10, 20, 30, 40), new Date('2026-01-01')); // already there
  const r = importHistory(b, file);
  assert.deepEqual(r, { ok: true, added: 1, skipped: 0 });
  assert.equal(loadHistory(b).length, 2);

  const bad = JSON.stringify({ runs: [{ at: 'nope', parts: {} }, { at: '2026-03-01', parts: { worth: 500, efficacy: 1, assert: 1, steady: 1 } }, '<img onerror=x>'] });
  assert.deepEqual(importHistory(b, bad), { ok: true, added: 0, skipped: 3 });
  assert.equal(importHistory(b, 'not json').ok, false);
});

test('clearHistory removes everything', () => {
  const st = memory();
  saveRun(st, result(1, 2, 3, 4));
  clearHistory(st);
  assert.deepEqual(loadHistory(st), []);
});
