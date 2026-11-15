import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ITEMS, PARTS, SCALES } from '../js/items.js';
import { scoreAll, scorePart, describe, keyed } from '../js/scoring.js';

// Answer every item so that it points toward (dir=+1) or away from (dir=−1) each part's confident pole.
function answersFor(dir) {
  const a = {};
  for (const it of ITEMS) {
    const part = PARTS[it.part];
    const s = SCALES[part.scale];
    const towardHigh = dir * it.key * (part.flip ? -1 : 1) > 0;
    a[it.id] = towardHigh ? s.max : s.min;
  }
  return a;
}

test('item set: 22 items, 10 Rosenberg + 4 per IPIP facet', () => {
  assert.equal(ITEMS.length, 22);
  const count = (p) => ITEMS.filter((i) => i.part === p).length;
  assert.deepEqual([count('worth'), count('efficacy'), count('assert'), count('steady')], [10, 4, 4, 4]);
  assert.equal(new Set(ITEMS.map((i) => i.id)).size, 22);
});

test('Rosenberg reverse items are exactly 3, 5, 8, 9, 10 (UMD)', () => {
  const rev = ITEMS.filter((i) => i.part === 'worth' && i.key === -1).map((i) => i.id);
  assert.deepEqual(rev, ['r3', 'r5', 'r8', 'r9', 'r10']);
});

test('all most-confident answers → 100 everywhere', () => {
  const { parts, overall } = scoreAll(answersFor(1));
  for (const v of Object.values(parts)) assert.equal(v, 100);
  assert.equal(overall, 100);
});

test('all least-confident answers → 0 everywhere', () => {
  const { parts, overall } = scoreAll(answersFor(-1));
  for (const v of Object.values(parts)) assert.equal(v, 0);
  assert.equal(overall, 0);
});

test('reverse keying: Strongly agree on "I am a failure" scores 0 on that item', () => {
  assert.equal(keyed(4, -1, SCALES.rosenberg), 0);
  assert.equal(keyed(0, -1, SCALES.rosenberg), 4);
  assert.equal(keyed(5, -1, SCALES.ipip), 1);
});

test('Rosenberg on 5 points: Agree to everything → 50, neutral to everything → 50', () => {
  // Agree (3) to every item: positives give 3 each (15), reversed give 1 each (5) → 20/40 = 50.
  const a = {};
  for (const it of ITEMS) a[it.id] = 3;
  assert.equal(scorePart('worth', a), 50);
  for (const it of ITEMS) if (it.part === 'worth') a[it.id] = 2;
  assert.equal(scorePart('worth', a), 50);
  // Agree on positives, Disagree on reversed → keyed 3 each → 75.
  for (const it of ITEMS) if (it.part === 'worth') a[it.id] = it.key === 1 ? 3 : 1;
  assert.equal(scorePart('worth', a), 75);
});

test('every scale has 5 answers with a neutral middle', () => {
  for (const s of Object.values(SCALES)) {
    assert.equal(s.options.length, 5);
    assert.match(s.options[2].label, /^Neither/);
    assert.equal(s.options[2].value, (s.min + s.max) / 2);
  }
});

test('steadiness flips vulnerability: panicking easily lowers steadiness', () => {
  const a = answersFor(1);
  a.n6a = 5; // "Panic easily" → Very accurate
  const s = scorePart('steady', a);
  // Vulnerability keyed items: n6a=5, n6b=1, n6c=1, n6d keyed (6−5)=1 → mean 2 → 25; steadiness 75.
  assert.equal(s, 75);
});

test('neutral IPIP answers → 50', () => {
  const a = answersFor(1);
  for (const it of ITEMS) if (it.part !== 'worth') a[it.id] = 3;
  for (const p of ['efficacy', 'assert', 'steady']) assert.equal(scorePart(p, a), 50);
});

test('missing or out-of-range answers give null, not a wrong number', () => {
  const a = answersFor(1);
  delete a.c1a;
  assert.equal(scorePart('efficacy', a), null);
  assert.equal(scoreAll(a).overall, null);
  const b = answersFor(1);
  b.r1 = 7;
  assert.equal(scorePart('worth', b), null);
});

test('overall is the plain average of the four parts', () => {
  const a = answersFor(1);
  for (const it of ITEMS) if (it.part === 'assert') a[it.id] = it.key === 1 ? 1 : 5; // assert → 0
  const { parts, overall } = scoreAll(a);
  assert.equal(parts.assert, 0);
  assert.equal(overall, 75);
});

test('describe phrases in the scale’s own labels', () => {
  assert.match(describe('efficacy', answersFor(1)), /“very accurate”/);
  assert.match(describe('steady', answersFor(1)), /“very accurate”/);
  assert.match(describe('worth', answersFor(-1)), /“strongly disagree”/);
  const a = answersFor(1);
  for (const it of ITEMS) if (it.part === 'efficacy') a[it.id] = it.id === 'c1a' ? 4 : 5; // mean 4.75
  assert.match(describe('efficacy', a), /between “moderately accurate” and “very accurate”/);
});
