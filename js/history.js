// Saved results over time. Only scores and a timestamp are kept (never answers),
// only in this browser, and only when the person presses "Save to my history".
// Storage is passed in so these functions run in Node tests as well.

export const HISTORY_KEY = 'sa-history';
export const PART_IDS = ['worth', 'efficacy', 'assert', 'steady'];
export const NOISE = 10; // gaps under this are "about the same" (our rough guide, see the method notes)
const MAX_RUNS = 200;

const isScore = (n) => typeof n === 'number' && Number.isFinite(n) && n >= 0 && n <= 100;

// Returns a clean run or null. Used for both stored and imported data, which are untrusted.
export function cleanRun(r) {
  if (!r || typeof r !== 'object' || typeof r.at !== 'string') return null;
  const t = Date.parse(r.at);
  if (Number.isNaN(t)) return null;
  if (!r.parts || typeof r.parts !== 'object') return null;
  const parts = {};
  for (const id of PART_IDS) {
    if (!isScore(r.parts[id])) return null;
    parts[id] = Math.round(r.parts[id]);
  }
  const overall = Math.round(PART_IDS.reduce((s, id) => s + r.parts[id], 0) / PART_IDS.length);
  return { at: new Date(t).toISOString(), parts, overall };
}

const sameRun = (a, b) => a.at === b.at && PART_IDS.every((id) => a.parts[id] === b.parts[id]);

function sortAndCap(runs) {
  return runs.sort((a, b) => a.at.localeCompare(b.at)).slice(-MAX_RUNS);
}

export function loadHistory(storage) {
  try {
    const raw = JSON.parse(storage.getItem(HISTORY_KEY) || '[]');
    return Array.isArray(raw) ? sortAndCap(raw.map(cleanRun).filter(Boolean)) : [];
  } catch {
    return [];
  }
}

function write(storage, runs) {
  try { storage.setItem(HISTORY_KEY, JSON.stringify(runs)); return true; } catch { return false; }
}

// result: { parts: {worth, ...}, overall } as returned by scoreAll. Returns the new history, or null if storage failed.
export function saveRun(storage, result, now = new Date()) {
  const run = cleanRun({ at: now.toISOString(), parts: result.parts });
  if (!run) return null;
  const runs = loadHistory(storage);
  runs.push(run);
  const out = sortAndCap(runs);
  return write(storage, out) ? out : null;
}

export function clearHistory(storage) {
  try { storage.removeItem(HISTORY_KEY); } catch {}
}

// Change from an earlier run to a later one, with each gap labelled.
export function compare(before, after) {
  const row = (id, b, a) => {
    const d = a - b;
    return { id, before: b, after: a, change: d, same: Math.abs(d) < NOISE };
  };
  return {
    parts: PART_IDS.map((id) => row(id, before.parts[id], after.parts[id])),
    overall: row('overall', before.overall, after.overall),
  };
}

export function exportHistory(runs) {
  return JSON.stringify({ app: 'Self Assured', version: 1, runs }, null, 2);
}

// Merge an exported file into the existing history. Bad entries are skipped and counted.
export function importHistory(storage, text) {
  let data;
  try { data = JSON.parse(text); } catch { return { ok: false, added: 0, skipped: 0 }; }
  const list = Array.isArray(data) ? data : Array.isArray(data?.runs) ? data.runs : null;
  if (!list) return { ok: false, added: 0, skipped: 0 };
  const runs = loadHistory(storage);
  let added = 0, skipped = 0;
  for (const r of list) {
    const c = cleanRun(r);
    if (!c) { skipped++; continue; }
    if (runs.some((x) => sameRun(x, c))) continue;
    runs.push(c); added++;
  }
  const ok = write(storage, sortAndCap(runs));
  return { ok, added, skipped };
}
