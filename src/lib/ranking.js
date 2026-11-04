import WORKS from '../data/works.json';

export { WORKS };
export const byId = Object.fromEntries(WORKS.map((w) => [w.id, w]));
export const TIERS = [
  ['love', 'Flokkur 1'],
  ['like', 'Flokkur 2'],
  ['mid', 'Flokkur 3'],
  ['pass', 'Flokkur 4'],
  ['none', 'Óflokkuð'],
];
export const CHOICES = TIERS.slice(0, 4);
export const tierName = Object.fromEntries(TIERS);
const KEY = 'haustrodun-2026-react-v1';

export const blank = () => ({
  tiers: { love: [], like: [], mid: [], pass: [], none: WORKS.map((w) => w.id) },
  cur: '01',
  duel: null,
  proxies: [],
  taken: {},
  updatedAt: 0,
});

export function clean(s) {
  const out = blank();
  if (!s || !s.tiers) return out;
  const seen = new Set();
  out.tiers = { love: [], like: [], mid: [], pass: [], none: [] };
  for (const [t] of TIERS) {
    for (const id of s.tiers[t] || []) {
      if (byId[id] && !seen.has(id)) {
        seen.add(id);
        out.tiers[t].push(id);
      }
    }
  }
  for (const w of WORKS) if (!seen.has(w.id)) out.tiers.none.push(w.id);
  out.cur = byId[s.cur] ? s.cur : '01';
  out.duel = s.duel && Array.isArray(s.duel.sorted) ? s.duel : null;
  out.updatedAt = s.updatedAt || 0;
  if (s.taken && typeof s.taken === 'object') {
    for (const id of Object.keys(s.taken)) if (byId[id]) out.taken[id] = String(s.taken[id] || '');
  }
  if (Array.isArray(s.proxies)) {
    out.proxies = s.proxies
      .filter((p) => p && p.id && Array.isArray(p.order))
      .map((p) => {
        const seenP = new Set();
        const order = [];
        for (const id of p.order) {
          if (byId[id] && !seenP.has(id)) {
            seenP.add(id);
            order.push(id);
          }
        }
        for (const w of WORKS) if (!seenP.has(w.id)) order.push(w.id);
        const tier = {};
        if (p.tier) {
          for (const id of Object.keys(p.tier)) {
            if (byId[id] && ['love', 'like', 'mid', 'pass'].includes(p.tier[id])) tier[id] = p.tier[id];
          }
        }
        return { id: String(p.id), name: String(p.name || 'Án nafns').slice(0, 60), order, tier };
      });
  }
  return out;
}

export function load() {
  try {
    return clean(JSON.parse(localStorage.getItem(KEY)));
  } catch (e) {
    return blank();
  }
}
export function save(state) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
    return true;
  } catch (e) {
    return false;
  }
}

export const flat = (s) => TIERS.flatMap(([t]) => s.tiers[t]);
export const tierOf = (s, id) => TIERS.map((x) => x[0]).find((t) => s.tiers[t].includes(id));
export const rankOf = (s, id) => flat(s).indexOf(id) + 1;
export const sortedCount = (s) => WORKS.length - s.tiers.none.length;

export function assign(s, id, t) {
  const from = tierOf(s, id);
  if (from === t) return;
  s.tiers[from] = s.tiers[from].filter((x) => x !== id);
  s.tiers[t].push(id);
}

export function moveTo(s, id, rank) {
  const own = tierOf(s, id);
  s.tiers[own] = s.tiers[own].filter((x) => x !== id);
  const idx = Math.max(0, Math.min(WORKS.length - 1, rank - 1));
  let cum = 0;
  let placed = false;
  for (const [t] of TIERS) {
    const len = s.tiers[t].length;
    if (!len && t !== own) continue;
    if (idx <= cum + len) {
      s.tiers[t].splice(idx - cum, 0, id);
      placed = true;
      break;
    }
    cum += len;
  }
  if (!placed) s.tiers[own].push(id);
}

export function nextUnsorted(s, after) {
  const ids = WORKS.map((w) => w.id);
  const n = ids.length;
  const i = ids.indexOf(after);
  for (let k = 1; k <= n; k++) {
    const c = ids[(i + k) % n];
    if (tierOf(s, c) === 'none') return c;
  }
  return null;
}

/* Head-to-head: binary insertion. */
export const estimate = (n) => {
  let c = 0;
  for (let i = 1; i < n; i++) c += Math.ceil(Math.log2(i + 1));
  return c;
};
export function remaining(d) {
  let c = d.cur ? Math.ceil(Math.log2(d.hi - d.lo + 1)) : 0;
  let len = d.sorted.length + (d.cur ? 1 : 0);
  for (let i = 0; i < d.pending.length; i++) {
    c += Math.ceil(Math.log2(len + 1));
    len++;
  }
  return c;
}
function finishDuel(s) {
  const { scope, sorted } = s.duel;
  if (scope === 'all') {
    const all = flat(s);
    const order = [...sorted.filter((x) => all.includes(x)), ...all.filter((x) => !sorted.includes(x))];
    let i = 0;
    for (const [t] of TIERS) {
      const n = s.tiers[t].length;
      s.tiers[t] = order.slice(i, i + n);
      i += n;
    }
  } else {
    const ids = s.tiers[scope];
    s.tiers[scope] = [...sorted.filter((x) => ids.includes(x)), ...ids.filter((x) => !sorted.includes(x))];
  }
  s.duel = null;
}
function advance(s) {
  const d = s.duel;
  if (d.cur) return;
  if (!d.pending.length) {
    finishDuel(s);
    return;
  }
  d.cur = d.pending.shift();
  d.lo = 0;
  d.hi = d.sorted.length;
}
export function startDuel(s, scope) {
  const list = scope === 'all' ? flat(s) : [...s.tiers[scope]];
  s.duel = { scope, sorted: [list[0]], pending: list.slice(1), cur: null, lo: 0, hi: 0, done: 0, hist: [] };
  advance(s);
}
export function pickDuel(s, res) {
  const d = s.duel;
  const { hist, ...snap } = d;
  d.hist = [...hist.slice(-29), JSON.parse(JSON.stringify(snap))];
  const mid = (d.lo + d.hi) >> 1;
  if (res === 'cur') d.hi = mid;
  else if (res === 'pivot') d.lo = mid + 1;
  else d.lo = d.hi = mid + 1;
  d.done++;
  if (d.lo >= d.hi) {
    d.sorted.splice(d.lo, 0, d.cur);
    d.cur = null;
    advance(s);
  }
}
export function undoDuel(s) {
  const d = s.duel;
  if (!d || !d.hist.length) return;
  const hist = d.hist.slice(0, -1);
  s.duel = { ...d.hist[d.hist.length - 1], hist };
}

/* Text helpers. */
export const title = (w) => w.title + (w.year ? ', ' + w.year : '');
export const metaLine = (w) => [w.medium, w.size, w.edition].filter(Boolean).join(' · ');
export const kr = (n) => n.toLocaleString('de-DE');
export const priceText = (w) => `${kr(w.low)}–${kr(w.high)} kr.`;
export const shortPrice = (w) => `${w.low / 1000}–${w.high / 1000} þús. kr.`;
