import { TIERS, WORKS, clean } from './ranking.js';

/*
 * Packs the list into a short string that fits in a link or QR code, so it can be
 * moved to another device without a server. Each work is one character (its index
 * in WORKS), which keeps the link small. 'Taken' notes stay on each device.
 */
const ABC = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
const PROXY_TIERS = ['none', 'love', 'like', 'mid', 'pass'];
const ids = WORKS.map((w) => w.id);
const idx = Object.fromEntries(ids.map((id, i) => [id, i]));

const enc = (list) => list.map((id) => ABC[idx[id]]).join('');
const dec = (str) => [...(str || '')].map((c) => ids[ABC.indexOf(c)]).filter(Boolean);

function toBase64Url(text) {
  const bytes = new TextEncoder().encode(text);
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}
function fromBase64Url(str) {
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/'));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
}

export function packState(s) {
  const d = s.duel;
  const data = {
    v: 1,
    u: s.updatedAt,
    t: TIERS.map(([t]) => enc(s.tiers[t])),
    c: enc([s.cur]),
    d: d && [d.scope, enc(d.sorted), enc(d.pending), d.cur ? enc([d.cur]) : '', d.lo, d.hi, d.done],
    p: s.proxies.map((p) => [p.name, enc(p.order), ids.map((id) => PROXY_TIERS.indexOf(p.tier[id] || 'none')).join('')]),
  };
  return toBase64Url(JSON.stringify(data));
}

export function unpackState(str) {
  const data = JSON.parse(fromBase64Url(str));
  if (data.v !== 1 || !Array.isArray(data.t)) throw new Error('Unknown format');
  const tiers = Object.fromEntries(TIERS.map(([t], i) => [t, dec(data.t[i])]));
  let duel = null;
  if (Array.isArray(data.d)) {
    const [scope, sorted, pending, cur, lo, hi, done] = data.d;
    duel = { scope, sorted: dec(sorted), pending: dec(pending), cur: dec(cur)[0] || null, lo, hi, done, hist: [] };
  }
  const proxies = (data.p || []).map(([name, order, tierStr], i) => {
    const tier = {};
    [...(tierStr || '')].forEach((n, k) => {
      const t = PROXY_TIERS[+n];
      if (t && t !== 'none' && ids[k]) tier[ids[k]] = t;
    });
    return { id: `p${Date.now().toString(36)}${i}`, name, order: dec(order), tier };
  });
  return clean({ tiers, cur: dec(data.c)[0], duel, proxies, updatedAt: data.u });
}

const PREFIX = 'flytja=';

export function shareLink(s) {
  return `${location.origin}${location.pathname}#${PREFIX}${packState(s)}`;
}

// Returns the packed list if the page was opened from a share link, otherwise null.
export function readShareHash() {
  const h = location.hash.slice(1);
  return h.startsWith(PREFIX) ? h.slice(PREFIX.length) : null;
}
