// MapStage.jsx — MapLibre GL map with a LARGE always-visible vehicle
// marker in center follow-cam. Cinema mode is an in-page fixed stage
// (native requestFullscreen on a WebGL canvas crashed phone webviews —
// it is never used here). If tiles/CDN are blocked, a 2D canvas fallback
// still draws the route and the moving vehicle.
import React, { useEffect, useRef, useState } from 'react';
import { pointAt, haversine } from '../lib/geo.js';
import { VEHICLE_ICON } from '../lib/icons.jsx';

export const THEME_STYLES = {
  neon: { style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', filter: 'saturate(1.5) hue-rotate(-12deg)', trail: '#22d3ee', glow: '#a855f7' },
  dark: { style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', filter: 'grayscale(.25)', trail: '#e2e8f0', glow: '#64748b' },
  vintage: { style: 'https://basemaps.cartocdn.com/gl/positron-gl-style/style.json', filter: 'sepia(.65) contrast(.95)', trail: '#b45309', glow: '#d97706' },
  satellite: { style: null, filter: 'saturate(1.15)', trail: '#facc15', glow: '#f97316' },
  blueprint: { style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json', filter: 'invert(.92) hue-rotate(185deg) saturate(2.2)', trail: '#2563eb', glow: '#38bdf8' },
  anime: { style: 'https://basemaps.cartocdn.com/gl/voyager-gl-style/style.json', filter: 'sepia(.35) saturate(1.7) hue-rotate(-18deg)', trail: '#fb7185', glow: '#f59e0b' },
};
const SAT_STYLE = {
  version: 8,
  sources: { esri: { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256, attribution: 'Esri World Imagery' } },
  layers: [{ id: 'esri', type: 'raster', source: 'esri' }],
};

const VEHICLE_PATHS = {
  car: 'M5.5 16.5 6.7 10A2 2 0 0 1 8.6 8.5h6.8a2 2 0 0 1 1.9 1.5l1.2 6.5M5 16.5h14M7.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM16.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM8 13h2m4 0h2',
  suv: 'M4 16l1.2-6.2A2 2 0 0 1 7.2 8.3h7.1a2 2 0 0 1 1.7.9L19 13l1 3M4 16h16M7.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM16.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM9 12.5h5',
  bike: 'M6.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6.5 14 10 7h3l4.5 7M10 7L8.7 4.8H6.5M13 7l-1.8 6.5',
  bus: 'M5 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13.5h-2.2a2.8 2.8 0 0 1-5.6 0H10a2.8 2.8 0 0 1-5.6 0H3V4h2zm2 2v5h10V6H7zm1.2 13.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm7.6 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zM7 14h3m4 0h3',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7zM7 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  plane: 'M21.5 15.5 13 10V3.8a1.3 1.3 0 0 0-2.5 0V10L2 15.5v1.7l8.5-2.4v5l-2.3 1.7v1.4l3.6-1 3.6 1v-1.4L13 19.8v-5l8.5 2.4v-1.7z',
};

function sliceProgress(route, dist, pos) {
  const { segIndex } = pointAt(route.path, dist);
  const pts = route.coords.slice(0, Math.max(2, segIndex));
  pts.push(pos);
  return pts;
}

export default function MapStage({ route, engineRef, theme, cinema, zoomLock, lockZoom, camMode, vehicle, night, onFallback }) {
  const wrapRef = useRef(null);
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const canvasRef = useRef(null);
  const [failed, setFailed] = useState(false);
  const stateRef = useRef({});
  stateRef.current = { route, theme, zoomLock, lockZoom, camMode, night };

  /* ---------- MapLibre init ---------- */
  useEffect(() => {
    const ML = window.maplibregl;
    if (!ML || !wrapRef.current) { setFailed(true); onFallback?.(); return; }
    let map;
    try {
      map = new ML.Map({
        container: wrapRef.current, style: THEME_STYLES[theme]?.style || SAT_STYLE,
        center: [78.9, 28.6], zoom: 5, pitch: 60, bearing: 0,
        preserveDrawingBuffer: true, attributionControl: { compact: true }, interactive: false,
      });
    } catch { setFailed(true); onFallback?.(); return; }
    mapRef.current = map;
    const el = document.createElement('div');
    el.className = 'vehicle-marker';
    el.innerHTML = `<div class="vm-ring"></div><div class="vm-beam"></div><div class="vm-body"></div>`;
    markerRef.current = new ML.Marker({ element: el, anchor: 'center' }).setLngLat([78.9, 28.6]).addTo(map);
    const to = setTimeout(() => { if (!map.loaded()) { /* tiles slow — keep waiting, canvas fallback only on error */ } }, 4000);
    map.on('error', (e) => { if (e?.error?.message?.match(/Failed to fetch|AJAXError/i) && !map.__routeDrawn) { /* style may still recover */ } });
    return () => { clearTimeout(to); map.remove(); mapRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- vehicle body icon ---------- */
  useEffect(() => {
    const el = markerRef.current?.getElement();
    const body = el?.querySelector('.vm-body');
    if (body) {
      body.innerHTML = `<svg viewBox="0 0 24 24" width="30" height="30" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${VEHICLE_PATHS[vehicle] || VEHICLE_PATHS.car}"/></svg>`;
    }
    document.querySelectorAll('.vehicle-marker').forEach((n) => n.setAttribute('data-vehicle', vehicle));
  }, [vehicle]);

  /* ---------- theme switch ---------- */
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    const spec = THEME_STYLES[theme] || THEME_STYLES.neon;
    try { map.setStyle(spec.style || SAT_STYLE); } catch { /* keep old */ }
    map.once('styledata', () => drawRoute());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme]);

  /* ---------- route layers ---------- */
  const drawRoute = () => {
    const map = mapRef.current; const rt = stateRef.current.route;
    if (!map || !rt) return;
    const spec = THEME_STYLES[stateRef.current.theme] || THEME_STYLES.neon;
    const full = { type: 'Feature', geometry: { type: 'LineString', coordinates: rt.coords } };
    const dashedParts = [];
    for (const seg of rt.segments || []) {
      if (seg.kind === 'road') continue;
      const next = (rt.segments[rt.segments.indexOf(seg) + 1]?.startIndex) ?? rt.coords.length - 1;
      dashedParts.push({ type: 'Feature', properties: { kind: seg.kind }, geometry: { type: 'LineString', coordinates: rt.coords.slice(seg.startIndex, next + 1) } });
    }
    const upsert = (id, data, layer) => {
      if (map.getSource(id)) map.getSource(id).setData(data);
      else { map.addSource(id, { type: 'geojson', data }); map.addLayer(layer); }
    };
    upsert('rt-full', full, { id: 'rt-full', type: 'line', source: 'rt-full', paint: { 'line-color': spec.trail, 'line-width': 3, 'line-opacity': 0.35 } });
    upsert('rt-dash', { type: 'FeatureCollection', features: dashedParts }, { id: 'rt-dash', type: 'line', source: 'rt-dash', paint: { 'line-color': '#f59e0b', 'line-width': 3.5, 'line-dasharray': [2, 2], 'line-opacity': 0.9 } });
    upsert('rt-prog', { type: 'Feature', geometry: { type: 'LineString', coordinates: [rt.coords[0], rt.coords[0]] } },
      { id: 'rt-prog', type: 'line', source: 'rt-prog', layout: { 'line-cap': 'round' }, paint: { 'line-color': spec.trail, 'line-width': 6, 'line-opacity': 0.95, 'line-blur': 0.4 } });
    // stop pins
    const stops = { type: 'FeatureCollection', features: (rt.stopPoints || []).map((s) => ({ type: 'Feature', properties: { name: s.name }, geometry: { type: 'Point', coordinates: s.lngLat } })) };
    upsert('rt-stops', stops, { id: 'rt-stops', type: 'circle', source: 'rt-stops', paint: { 'circle-radius': 6, 'circle-color': '#f59e0b', 'circle-stroke-color': '#fff', 'circle-stroke-width': 2 } });
    map.__routeDrawn = true;
  };
  useEffect(() => {
    const map = mapRef.current; if (!map) return;
    if (map.loaded() || map.isStyleLoaded()) drawRoute();
    else map.once('load', drawRoute);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route]);

  /* ---------- per-frame camera + marker + progress ---------- */
  useEffect(() => {
    let raf; let orbit = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      const eng = engineRef.current; const rt = stateRef.current.route;
      if (!eng || !rt) return;
      const { pos, bearing } = pointAt(rt.path, eng.dist);
      eng.pos = pos; eng.bearing = bearing;
      const map = mapRef.current;
      if (map && markerRef.current && !failed) {
        try {
          markerRef.current.setLngLat(pos);
          const el = markerRef.current.getElement();
          el.style.setProperty('--bearing', `${bearing}deg`);
          el.classList.toggle('is-night', !!stateRef.current.night);
          const s = stateRef.current;
          let camBearing = bearing, pitch = 60;
          let zoom = s.zoomLock ? s.lockZoom : Math.max(5, Math.min(11, 13.5 - Math.log10((eng.speedKmh || 60) + 10) * 2.2));
          if (s.camMode === 'top') { pitch = 0; camBearing = 0; if (!s.zoomLock) zoom = Math.max(6, zoom - 2); }
          if (s.camMode === 'drone') { orbit += 0.15; camBearing = bearing + Math.sin(orbit * Math.PI / 180) * 55; pitch = 48; }
          if (s.camMode === 'heli') { pitch = 32; if (!s.zoomLock) zoom = Math.max(5, zoom - 2.6); }
          if (s.camMode === 'side') { camBearing = bearing + 90; pitch = 55; }
          map.jumpTo({ center: pos, bearing: camBearing, pitch, zoom });
          const src = map.getSource('rt-prog');
          if (src && (loop.n = (loop.n || 0) + 1) % 3 === 0) {
            src.setData({ type: 'Feature', geometry: { type: 'LineString', coordinates: sliceProgress(rt, eng.dist, pos) } });
          }
        } catch { /* map mid-style-switch */ }
      }
      // canvas fallback frame
      const cv = canvasRef.current;
      if (failed && cv) drawFallback(cv, rt, eng.dist, pos);
    };
    loop();
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [failed]);

  /* ---------- resize on cinema toggle ---------- */
  useEffect(() => {
    const to = setTimeout(() => { try { mapRef.current?.resize(); } catch { /* noop */ } }, 130);
    const to2 = setTimeout(() => { try { mapRef.current?.resize(); } catch { /* noop */ } }, 400);
    return () => { clearTimeout(to); clearTimeout(to2); };
  }, [cinema]);

  const spec = THEME_STYLES[theme] || THEME_STYLES.neon;
  return (
    <div className={`map-stage theme-${theme}`}>
      {!failed && <div ref={wrapRef} className="map-canvas" style={{ filter: spec.filter }} />}
      {failed && <canvas ref={canvasRef} className="map-fallback" width={900} height={1200} />}
      {failed && <div className="map-note glass">Live tiles block hain — backup map par journey chal rahi hai (route aur gaadi bilkul wahi).</div>}
      <div className={`sky-tint ${night ? 'night' : 'day'}`} />
    </div>
  );
}

function drawFallback(cv, route, dist, pos) {
  const ctx = cv.getContext('2d');
  const W = cv.width, H = cv.height;
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  for (const c of route.coords) { minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]); minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]); }
  const px = (c) => [((c[0] - minX) / (maxX - minX || 1)) * (W - 80) + 40, H - (((c[1] - minY) / (maxY - minY || 1)) * (H - 80) + 40)];
  ctx.fillStyle = '#0d1526'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = 'rgba(148,163,184,.25)'; ctx.lineWidth = 5; ctx.beginPath();
  route.coords.forEach((c, i) => { const [x, y] = px(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  const { segIndex } = pointAt(route.path, dist);
  ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 8; ctx.beginPath();
  route.coords.slice(0, segIndex + 1).forEach((c, i) => { const [x, y] = px(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
  const [x, y] = px(pos);
  ctx.fillStyle = '#f59e0b'; ctx.beginPath(); ctx.arc(x, y, 26, 0, 7); ctx.fill();
  ctx.strokeStyle = '#fff'; ctx.lineWidth = 5; ctx.beginPath(); ctx.arc(x, y, 34, 0, 7); ctx.stroke();
  ctx.fillStyle = '#0b1020'; ctx.font = 'bold 26px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('CAR', x, y + 9);
  for (const s of route.stopPoints || []) { const [sx, sy] = px(s.lngLat); ctx.fillStyle = '#e2e8f0'; ctx.beginPath(); ctx.arc(sx, sy, 8, 0, 7); ctx.fill(); }
  void haversine;
}
export { VEHICLE_ICON };
