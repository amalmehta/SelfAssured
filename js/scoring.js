// Pure scoring functions: no DOM, so they run in Node tests and the browser alike.
import { SCALES, PARTS, ITEMS } from './items.js';

// Reverse keying: on a min..max scale, a reversed answer v counts as (min + max − v).
export function keyed(value, key, scale) {
  return key === 1 ? value : scale.min + scale.max - value;
}

// answers: { [itemId]: rawValue }. Returns 0–100 or null if any item in the part is missing.
export function scorePart(partId, answers, items = ITEMS) {
  const part = PARTS[partId];
  const scale = SCALES[part.scale];
  const its = items.filter((i) => i.part === partId);
  if (!its.length) return null;
  let sum = 0;
  for (const it of its) {
    const v = answers[it.id];
    if (typeof v !== 'number' || v < scale.min || v > scale.max) return null;
    sum += keyed(v, it.key, scale);
  }
  const mean = sum / its.length;
  const pct = ((mean - scale.min) / (scale.max - scale.min)) * 100;
  return part.flip ? 100 - pct : pct;
}

// Average raw answer for the part, before keying: used to say "your answers averaged near X".
export function meanKeyed(partId, answers, items = ITEMS) {
  const scale = SCALES[PARTS[partId].scale];
  const its = items.filter((i) => i.part === partId);
  return its.reduce((s, it) => s + keyed(answers[it.id], it.key, scale), 0) / its.length;
}

export function scoreAll(answers) {
  const parts = {};
  for (const id of Object.keys(PARTS)) parts[id] = scorePart(id, answers);
  const vals = Object.values(parts);
  const overall = vals.some((v) => v === null) ? null : vals.reduce((a, b) => a + b, 0) / vals.length;
  return { parts, overall };
}

// Plain-words reading of a 0–100 part score, phrased in the scale's own answer labels
// so it describes the answers instead of inventing "low/high" categories.
export function describe(partId, answers) {
  const part = PARTS[partId];
  const scale = SCALES[part.scale];
  let m = meanKeyed(partId, answers);
  if (part.flip) m = scale.min + scale.max - m; // point the answers toward the part's own direction
  // Nearest labels to the keyed mean (in the confident direction).
  const opts = [...scale.options].sort((a, b) => a.value - b.value);
  const lo = opts.filter((o) => o.value <= m).pop() ?? opts[0];
  const hi = opts.find((o) => o.value >= m) ?? opts[opts.length - 1];
  const phrase = lo === hi ? `“${lo.label.toLowerCase()}”` : `between “${lo.label.toLowerCase()}” and “${hi.label.toLowerCase()}”`;
  if (part.scale === 'rosenberg') return `Counting reversed statements the other way round, your answers averaged ${phrase}.`;
  if (part.flip) return `Turned round so every answer points toward calm, your answers averaged ${phrase}.`;
  return `Your answers averaged ${phrase}.`;
}
