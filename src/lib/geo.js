// geo.js — geometry helpers, Nominatim geocoding, OSRM routing with
// turn-by-turn steps, and hybrid fallbacks (ferry / flight great-circle)
// for routes no road can complete (e.g. Delhi -> Dubai).
export const R_EARTH = 6371000;
const rad = (d) => (d * Math.PI) / 180;
export function haversine(a, b) {
  const dLat = rad(b[1] - a[1]);
  const dLng = rad(b[0] - a[0]);
  const s = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a[1])) * Math.cos(rad(b[1])) * Math.sin(dLng / 2) ** 2;
  return 2 * R_EARTH * Math.asin(Math.sqrt(s));
}
export function bearing(a, b) {
  const dLng = rad(b[0] - a[0]);
  const y = Math.sin(dLng) * Math.cos(rad(b[1]));
  const x = Math.cos(rad(a[1])) * Math.sin(rad(b[1])) - Math.sin(rad(a[1])) * Math.cos(rad(b[1])) * Math.cos(dLng);
  return (Math.atan2(y, x) * 180 / Math.PI + 360) % 360;
}
/** Densify a [lng,lat] line into cumulative-distance form. */
export function buildPath(coords) {
  const cum = [0];
  for (let i = 1; i < coords.length; i++) cum.push(cum[i - 1] + haversine(coords[i - 1], coords[i]));
  return { coords, cum, total: cum[cum.length - 1] || 0 };
}
export function pointAt(path, dist) {
  const { coords, cum, total } = path;
  const d = Math.max(0, Math.min(total, dist));
  let lo = 0, hi = cum.length - 1;
  while (lo < hi) { const mid = (lo + hi) >> 1; if (cum[mid] < d) lo = mid + 1; else hi = mid; }
  const i = Math.max(1, lo);
  const segLen = cum[i] - cum[i - 1] || 1;
  const t = (d - cum[i - 1]) / segLen;
  const a = coords[i - 1], b = coords[i];
  const pos = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return { pos, bearing: bearing(a, b), segIndex: i };
}
export function greatCircle(a, b, n = 64) {
  const pts = [];
  const f = (p) => [rad(p[0]), rad(p[1])];
  const [x1, y1] = f(a), [x2, y2] = f(b);
  const d = 2 * Math.asin(Math.sqrt(Math.sin((y2 - y1) / 2) ** 2 + Math.cos(y1) * Math.cos(y2) * Math.sin((x2 - x1) / 2) ** 2));
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const A = Math.sin((1 - t) * d) / Math.sin(d || 1), B = Math.sin(t * d) / Math.sin(d || 1);
    const x = A * Math.cos(y1) * Math.cos(x1) + B * Math.cos(y2) * Math.cos(x2);
    const y = A * Math.cos(y1) * Math.sin(x1) + B * Math.cos(y2) * Math.sin(x2);
    const z = A * Math.sin(y1) + B * Math.sin(y2);
    pts.push([Math.atan2(y, x) * 180 / Math.PI, Math.atan2(z, Math.sqrt(x * x + y * y)) * 180 / Math.PI]);
  }
  return pts;
}
export const fmtKm = (m) => (m >= 10000 ? `${(m / 1000).toFixed(0)} km` : m >= 1000 ? `${(m / 1000).toFixed(1)} km` : `${Math.round(m)} m`);
export const fmtDur = (s) => {
  if (!isFinite(s)) return '—';
  const d = Math.floor(s / 86400), h = Math.floor((s % 86400) / 3600), m = Math.floor((s % 3600) / 60);
  if (d) return `${d}d ${h}h`;
  if (h) return `${h}h ${m}m`;
  return `${m}m ${Math.floor(s % 60)}s`;
};

/* ---------------- Nominatim (free, no key) ---------------- */
const geoCache = new Map();
export async function searchPlaces(q) {
  if (!q || q.length < 3) return [];
  if (geoCache.has(q)) return geoCache.get(q);
  const url = `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=6&addressdetails=1&q=${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: { Accept: 'application/json' } });
  const data = await r.json();
  const out = data.map((d) => ({
    name: d.display_name.split(',').slice(0, 2).join(','),
    full: d.display_name,
    lngLat: [parseFloat(d.lon), parseFloat(d.lat)],
    countryCode: (d.address?.country_code || '').toUpperCase(),
    country: d.address?.country || '',
  }));
  geoCache.set(q, out);
  return out;
}
export async function geocode(q) {
  const [first] = await searchPlaces(q);
  if (!first) throw new Error('Place not found: ' + q);
  return first;
}
export async function reverseName(lngLat) {
  try {
    const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&zoom=10&lat=${lngLat[1]}&lon=${lngLat[0]}`);
    const d = await r.json();
    const a = d.address || {};
    return {
      name: a.city || a.town || a.village || a.state_district || a.state || 'Waypoint',
      countryCode: (a.country_code || '').toUpperCase(),
      country: a.country || '',
    };
  } catch { return { name: 'Waypoint', countryCode: '', country: '' }; }
}

/* ---------------- OSRM routing ---------------- */
const OSRM = 'https://router.project-osrm.org/route/v1/driving';
async function osrmRoute(points, { alternatives = false } = {}) {
  const path = points.map((p) => `${p[0]},${p[1]}`).join(';');
  const url = `${OSRM}/${path}?overview=full&geometries=geojson&steps=true&alternatives=${alternatives ? 'true' : 'false'}&annotations=false`;
  const r = await fetch(url);
  const d = await r.json();
  if (d.code !== 'Ok' || !d.routes?.length) throw new Error('OSRM: ' + (d.code || 'no route'));
  return d.routes.map((route) => {
    const coords = [];
    const maneuvers = [];
    for (const leg of route.legs) {
      for (const step of leg.steps) {
        const sc = step.geometry.coordinates;
        const startDist = coords.length ? null : 0;
        const segStart = coords.length ? undefined : 0;
        const from = coords.length;
        for (const c of sc) coords.push(c);
        maneuvers.push({
          lngLat: step.maneuver.location,
          type: step.maneuver.type,
          modifier: step.maneuver.modifier || '',
          exit: step.maneuver.exit,
          road: step.name || step.ref || '',
          coordIndex: from,
          _segStart: segStart, _startDist: startDist,
        });
      }
    }
    // Deduplicate consecutive coords, then compute maneuver distances.
    const clean = coords.filter((c, i) => i === 0 || c[0] !== coords[i - 1][0] || c[1] !== coords[i - 1][1]);
    const pathObj = buildPath(clean);
    for (const m of maneuvers) {
      const idx = nearestIndex(clean, m.lngLat);
      m.atDist = pathObj.cum[idx] || 0;
    }
    maneuvers.sort((a, b) => a.atDist - b.atDist);
    return {
      coords: clean, path: pathObj, maneuvers,
      distance: route.distance, duration: route.duration,
      kind: 'road',
    };
  });
}
function nearestIndex(coords, p) {
  let best = 0, bd = Infinity;
  for (let i = 0; i < coords.length; i++) { const d = haversine(coords[i], p); if (d < bd) { bd = d; best = i; } }
  return best;
}

/* ------------- Hybrid fallback: Delhi -> Dubai curated legs ------------- */
// Overland India -> Pakistan -> Iran, ferry across the Gulf, then Dubai.
// Used automatically when one direct OSRM call cannot complete the trip.
const DUBAI_VIAS = [
  'Amritsar, India', 'Lahore, Pakistan', 'Multan, Pakistan', 'Sukkur, Pakistan',
  'Karachi, Pakistan', 'Gwadar, Pakistan', 'Zahedan, Iran', 'Kerman, Iran', 'Bandar Abbas, Iran',
];
export async function buildRoute(from, vias, to) {
  const named = [from, ...vias, to];
  const pts = [];
  for (const n of named) pts.push(typeof n === 'string' ? await geocode(n) : n);
  const isDubaiRun = /dubai/i.test(to.name || to) && /delhi/i.test(from.name || from);
  // 1) Try one direct OSRM call through all waypoints (with alternatives).
  try {
    const routes = await osrmRoute(pts.map((p) => p.lngLat), { alternatives: true });
    for (const route of routes) {
      route.segments = [{ kind: 'road', from: pts[0].name, to: pts[pts.length - 1].name }];
      route.places = pts;
    }
    return { routes, main: routes[0], note: '' };
  } catch { /* fall through to leg-by-leg hybrid */ }
  // 2) Leg by leg; failed legs become dashed off-road/ferry/flight segments.
  const legPoints = isDubaiRun
    ? [...pts.slice(0, -1), await geocode('Sharjah, UAE'), pts[pts.length - 1]]
    : pts;
  const coords = [];
  const segments = [];
  const maneuvers = [];
  for (let i = 0; i < legPoints.length - 1; i++) {
    const a = legPoints[i], b = legPoints[i + 1];
    const seaLeg = isDubaiRun && /Bandar Abbas/i.test(a.name) && /Sharjah/i.test(b.name);
    let legCoords = null, kind = 'road';
    if (!seaLeg) {
      try { const [r] = await osrmRoute([a.lngLat, b.lngLat]); legCoords = r.coords; } catch { legCoords = null; }
    }
    if (!legCoords) {
      kind = seaLeg ? 'ferry' : (haversine(a.lngLat, b.lngLat) > 900000 ? 'flight' : 'offroad');
      legCoords = greatCircle(a.lngLat, b.lngLat, 48);
    }
    const startIdx = coords.length;
    for (const c of legCoords) coords.push(c);
    segments.push({ kind, from: a.name, to: b.name, startIndex: startIdx });
    maneuvers.push({ lngLat: a.lngLat, type: i === 0 ? 'depart' : 'arrive', modifier: '', road: '', coordIndex: startIdx, legKind: kind });
  }
  const pathObj = buildPath(coords);
  for (const m of maneuvers) m.atDist = pathObj.cum[nearestIndex(coords, m.lngLat)] || 0;
  const route = {
    coords, path: pathObj, maneuvers, segments,
    distance: pathObj.total, duration: pathObj.total / 13.9, kind: 'hybrid',
  };
  return {
    routes: [route], main: route, places: pts,
    note: isDubaiRun
      ? 'Seedhi sadak route possible nahi (border + samundar). Hybrid route: sadak se Bandar Abbas, ferry se Sharjah, phir sadak se Dubai.'
      : 'Kuch hisso me sadak route nahi mila — woh hisse dashed line (ferry/flight/off-road) se jode gaye hain.',
  };
}
export const DUBAI_DEFAULT = { from: 'Delhi, India', to: 'Dubai, UAE', vias: DUBAI_VIAS };
