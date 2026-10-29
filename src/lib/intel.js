// intel.js — free trip intelligence: Wikipedia, Open-Meteo, REST Countries,
// Overpass POIs. Every call degrades gracefully to a sensible fallback.
const mem = new Map();
async function get(url, ttl = 1000 * 60 * 60 * 6) {
  if (mem.has(url)) return mem.get(url);
  const res = await fetch(url, { headers: { Accept: 'application/json' } });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  const v = await res.json();
  mem.set(url, v);
  return v;
}

export async function wikiInfo(name) {
  try {
    const url = `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(name.replace(/\(.+\)/, '').trim())}`;
    const d = await get(url);
    return {
      summary: d.extract || '',
      image: d.originalimage?.source || d.thumbnail?.source || '',
    };
  } catch { return { summary: '', image: '' }; }
}

export async function weatherAt(lngLat) {
  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lngLat[1]}&longitude=${lngLat[0]}&current=temperature_2m,weather_code,wind_speed_10m&forecast_days=1`;
    const d = await get(url, 1000 * 60 * 20);
    const c = d.current || {};
    const code = c.weather_code ?? 0;
    const kind = code === 0 ? 'clear' : code <= 3 ? 'cloudy' : code <= 48 ? 'fog' : code <= 67 ? 'rain' : code <= 77 ? 'snow' : code <= 82 ? 'rain' : 'storm';
    return { temp: c.temperature_2m, wind: c.wind_speed_10m, kind, code };
  } catch { return null; }
}

const countryCache = new Map();
export async function countryInfo(code) {
  if (!code) return null;
  if (countryCache.has(code)) return countryCache.get(code);
  try {
    const d = await get(`https://restcountries.com/v3.1/alpha/${code}?fields=name,flags,currencies,languages,car,cca2`);
    const c = Array.isArray(d) ? d[0] : d;
    const info = {
      name: c.name?.common || code,
      flag: c.flags?.svg || c.flags?.png || '',
      flagAlt: c.flags?.alt || '',
      currency: Object.values(c.currencies || {}).map((x) => `${x.name} (${x.symbol || ''})`).join(', '),
      languages: Object.values(c.languages || {}).join(', '),
      drivingSide: c.car?.side || '',
      code: c.cca2 || code,
    };
    countryCache.set(code, info);
    return info;
  } catch { countryCache.set(code, null); return null; }
}

export async function poisAt(lngLat, radius = 6000) {
  try {
    const [lng, lat] = lngLat;
    const q = `[out:json][timeout:12];(node["tourism"~"attraction|museum|viewpoint|hotel"](around:${radius},${lat},${lng});node["amenity"~"restaurant|fuel"](around:${radius},${lat},${lng}););out body 24;`;
    const res = await fetch('https://overpass-api.de/api/interpreter', { method: 'POST', body: 'data=' + encodeURIComponent(q) });
    if (!res.ok) throw new Error('overpass');
    const d = await res.json();
    const out = { sights: [], hotels: [], food: [], fuel: 0 };
    for (const el of d.elements || []) {
      const n = el.tags?.name; if (!n) continue;
      if (el.tags.tourism === 'hotel') out.hotels.push(n);
      else if (el.tags.tourism) out.sights.push(n);
      else if (el.tags.amenity === 'restaurant') out.food.push(n);
      else if (el.tags.amenity === 'fuel') out.fuel++;
    }
    return out;
  } catch { return { sights: [], hotels: [], food: [], fuel: 0 }; }
}

const FALLBACK_FOOD = {
  IN: 'Local dhaba thali, paratha, chai',
  PK: 'Biryani, karahi, lassi',
  IR: 'Chelow kebab, tahdig, doogh',
  AE: 'Shawarma, machboos, karak chai',
  DEFAULT: 'Local specialities near the main market',
};
/** Compose a stop card from whatever live data arrived + smart fallbacks. */
export function composeStop(stop, wiki, weather, pois, country) {
  const code = stop.countryCode || '';
  const sights = [...new Set([...(pois?.sights || [])])].slice(0, 5);
  const hotels = [...new Set([...(pois?.hotels || [])])].slice(0, 3);
  while (hotels.length < 3) hotels.push(['Budget stay near centre', 'Mid-range hotel on main road', 'Premium hotel — best rated'][hotels.length]);
  return {
    ...stop,
    summary: wiki?.summary || '',
    image: wiki?.image || '',
    weather,
    sights: sights.length ? sights : ['Old town / main bazaar walk', 'Best viewpoint at sunset', 'Local museum or landmark'],
    hotels,
    food: (pois?.food || []).slice(0, 3).join(', ') || FALLBACK_FOOD[code] || FALLBACK_FOOD.DEFAULT,
    fuelStops: pois?.fuel || 0,
    currency: country?.currency || '',
    stayCost: code === 'AE' ? 'AED 120–900 / night' : code === 'IR' ? 'Local rates vary' : code === 'PK' ? 'PKR 3,000–15,000 / night' : '₹800–6,000 / night',
    bestTime: 'Early morning ya sunset ke aas-paas sabse best light aur kam bheed.',
  };
}
