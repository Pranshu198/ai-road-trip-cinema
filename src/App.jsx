// App.jsx — AI Road Trip Cinema. One START click and everything plays
// itself: routing, follow-cam journey, turn voice, stop intelligence,
// border banners, day/night — no manual map dragging needed.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import MapStage from './components/MapStage.jsx';
import RoutePanel from './components/RoutePanel.jsx';
import Hud, { maneuverText } from './components/Hud.jsx';
import Controls from './components/Controls.jsx';
import StopCard, { BorderBanner } from './components/StopCard.jsx';
import { Icon } from './lib/icons.jsx';
import { t } from './lib/i18n.js';
import { buildRoute, reverseName, haversine } from './lib/geo.js';
import { wikiInfo, weatherAt, poisAt, countryInfo, composeStop } from './lib/intel.js';
import { useJourney, speak, resetSpeech, DAY_DRIVE_HOURS } from './hooks/useJourney.js';

const CAM_CYCLE = ['chase', 'drone', 'top', 'heli', 'side'];
const STOP_EVERY_M = 260000;

function nearestDist(route, lngLat) {
  let best = 0, bd = Infinity;
  route.coords.forEach((c, i) => { const d = haversine(c, lngLat); if (d < bd) { bd = d; best = i; } });
  return route.path.cum[best] || 0;
}

export default function App() {
  const [lang, setLang] = useState('hinglish');
  const [route, setRoute] = useState(null);
  const [routeNote, setRouteNote] = useState('');
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const [cinema, setCinema] = useState(false);
  const [showPanel, setShowPanel] = useState(true);
  const [tab, setTab] = useState('journey');
  const [zoomLock, setZoomLock] = useState(true); // DEFAULT ON (user lesson)
  const [lockZoom, setLockZoom] = useState(9);
  const [camMode, setCamMode] = useState('chase');
  const [camIdx, setCamIdx] = useState(0);
  const [theme, setTheme] = useState('neon');
  const [vehicle, setVehicle] = useState('car');
  const [voice, setVoice] = useState(true);
  const [names, setNames] = useState({ from: 'Delhi, India', to: 'Dubai, UAE' });
  const [activeStop, setActiveStop] = useState(null);
  const [border, setBorder] = useState(null);
  const [intro, setIntro] = useState(true);
  const journey = useJourney(route);
  const { derived, dist, total } = journey;
  const spokenRef = useRef(new Set());
  const enrichedRef = useRef(new Map());
  const lastCountryRef = useRef('');

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(''), 4200); };

  /* ---------------- start a trip ---------------- */
  const handleStart = useCallback(async ({ from, vias, to }) => {
    setLoading(true); setIntro(false); resetSpeech(); spokenRef.current = new Set();
    enrichedRef.current = new Map(); lastCountryRef.current = '';
    setActiveStop(null); setBorder(null);
    try {
      const viaNames = vias.map((v) => v.name);
      const isDubai = /dubai/i.test(to.name) && /delhi/i.test(from.name) && viaNames.length === 0;
      const { DUBAI_DEFAULT } = await import('./lib/geo.js');
      const useVias = isDubai ? DUBAI_DEFAULT.vias : viaNames;
      const result = await buildRoute(from, useVias, to);
      const main = result.main;
      // ---- stop points: named places on the way + interval samples ----
      const stops = [];
      const namedPlaces = result.places?.length ? result.places : [from, ...vias, to];
      for (const p of namedPlaces) {
        stops.push({ name: p.name || p, lngLat: p.lngLat, countryCode: p.countryCode || '', country: p.country || '', atDist: nearestDist(main, p.lngLat), named: true });
      }
      // fill gaps with interval stops (reverse-geocoded, capped for rate limits)
      const have = [...stops].sort((a, b) => a.atDist - b.atDist);
      const fills = [];
      let cursor = 0;
      for (const s of [...have, { atDist: main.path.total }]) {
        while (s.atDist - cursor > STOP_EVERY_M * 1.6) {
          cursor += STOP_EVERY_M;
          fills.push(cursor);
        }
        cursor = Math.max(cursor, s.atDist);
      }
      const fillStops = await Promise.all(fills.slice(0, 10).map(async (d) => {
        const idx = main.path.cum.findIndex((c) => c >= d);
        const lngLat = main.coords[Math.max(0, idx)];
        const rn = await reverseName(lngLat);
        return { name: rn.name, lngLat, countryCode: rn.countryCode, country: rn.country, atDist: d, named: false };
      }));
      main.stopPoints = [...stops, ...fillStops].sort((a, b) => a.atDist - b.atDist)
        .filter((s, i, arr) => i === 0 || s.atDist - arr[i - 1].atDist > 30000);
      setRoute(main);
      setRouteNote(result.note || '');
      setNames({ from: from.name, to: to.name });
      journey.setPlaying(true);
      showToast('Journey shuru! Route taiyaar hai.');
      // shareable URL hash
      const hash = new URLSearchParams({ f: from.name, t: to.name, v: vehicle, th: theme });
      history.replaceState(null, '', '#' + hash.toString());
    } catch (e) {
      showToast('Route nahi ban paya: ' + (e.message || 'network error') + ' — phir try karo.');
    } finally { setLoading(false); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicle, theme]);

  /* ---------------- stop intelligence + borders ---------------- */
  useEffect(() => {
    const stop = derived?.curStop;
    if (!stop || !journey.playing) return;
    const key = stop.name + '@' + Math.round(stop.atDist);
    if (enrichedRef.current.has(key)) { setActiveStop(enrichedRef.current.get(key)); }
    else {
      (async () => {
        const [wiki, wx, pois, country] = await Promise.all([
          wikiInfo(stop.name), weatherAt(stop.lngLat), poisAt(stop.lngLat), countryInfo(stop.countryCode),
        ]);
        const full = composeStop(stop, wiki, wx, pois, country);
        enrichedRef.current.set(key, full);
        setActiveStop(full);
        speak(`${stop.name} pahunch gaye. ${full.sights[0] || ''}`, lang, voice);
      })();
    }
    // border crossing
    if (stop.countryCode && lastCountryRef.current && stop.countryCode !== lastCountryRef.current) {
      countryInfo(stop.countryCode).then((ci) => { if (ci) { setBorder(ci); speak(`Ab hum ${ci.name} me enter kar rahe hain`, lang, voice); } });
    }
    if (stop.countryCode) lastCountryRef.current = stop.countryCode;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [derived?.curStop?.name, derived?.curStop?.atDist]);

  /* ---------------- turn voice ---------------- */
  useEffect(() => {
    const man = derived?.nextMan;
    if (!man || !journey.playing) return;
    const left = man.atDist - dist;
    if (left < 500 && left > 0 && !spokenRef.current.has(man.atDist)) {
      spokenRef.current.add(man.atDist);
      speak(maneuverText(man, lang), lang, voice);
    }
  }, [derived?.nextMan?.atDist, dist, journey.playing, lang, voice, derived]);

  /* ---------------- keyboard ---------------- */
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === 'INPUT') return;
      if (e.code === 'Space') { e.preventDefault(); journey.setPlaying(!journey.playing); }
      if (e.key === 'ArrowUp') journey.setSpeedKmh(Math.min(20000, journey.speedKmh * 1.6));
      if (e.key === 'ArrowDown') journey.setSpeedKmh(Math.max(0.5, journey.speedKmh / 1.6));
      if (e.key === 'r' || e.key === 'R') journey.seek(0);
      if (e.key === 'Escape' && cinema) setCinema(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [journey, cinema]);

  /* ---------------- auto camera cycle ---------------- */
  useEffect(() => {
    if (camMode !== 'auto') return;
    const id = setInterval(() => setCamIdx((i) => (i + 1) % CAM_CYCLE.length), 12000);
    return () => clearInterval(id);
  }, [camMode]);
  const effCam = camMode === 'auto' ? CAM_CYCLE[camIdx] : camMode;

  const finished = route && dist >= total && total > 0;
  const share = async () => {
    try { await navigator.clipboard.writeText(location.href); showToast('Trip link copy ho gaya!'); }
    catch { showToast('Link copy nahi hua — address bar se le lo.'); }
  };
  const exportJson = () => {
    const blob = new Blob([JSON.stringify({ from: names.from, to: names.to, vehicle, theme, distance_km: Math.round(total / 1000), stops: (route?.stopPoints || []).map((s) => s.name) }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'road-trip.json'; a.click();
  };

  const stage = (
    <div className={`stage-wrap ${cinema ? 'pseudo-fs' : ''}`}>
      <MapStage route={route} engineRef={journey.engineRef} theme={theme} cinema={cinema}
        zoomLock={zoomLock} lockZoom={lockZoom} camMode={effCam} vehicle={vehicle}
        night={!!derived?.night} onFallback={() => {}} />
      {route && derived && (
        <Hud derived={derived} dist={dist} total={total} speedKmh={journey.warp ? journey.engineRef.current.speedKmh : journey.speedKmh}
          etaSec={derived.etaSec} lang={lang} finished={finished}
          onOpenControls={() => { if (!cinema) setCinema(true); setShowPanel((s) => !s); }} />
      )}
      {border && <BorderBanner country={border} onDone={() => setBorder(null)} />}
      {activeStop && <StopCard stop={activeStop} onClose={() => setActiveStop(null)} />}
      <div className="stage-btns">
        <button className="btn glass round" onClick={() => setCinema(!cinema)} aria-label="Cinema mode"><Icon name="cinema" size={20} /></button>
        {cinema && <button className="btn glass round" onClick={() => setShowPanel((s) => !s)} aria-label="Controls"><Icon name="sliders" size={20} /></button>}
      </div>
      {routeNote && <div className="route-note glass"><Icon name="warn" size={15} /> {routeNote}</div>}
      {loading && <div className="stage-loading glass-strong"><div className="spinner" /> {t(lang, 'loading')}</div>}
      {cinema && showPanel && (
        <div className="cinema-sheet">
          <Controls {...ctrlProps()} />
        </div>
      )}
    </div>
  );

  function ctrlProps() {
    return {
      lang, tab, setTab, route, journey, zoomLock, setZoomLock, lockZoom, setLockZoom,
      camMode, setCamMode, theme, setTheme, vehicle, setVehicle, voice, setVoice, setLang,
      onShare: share, onExportJson: exportJson, fromName: names.from, toName: names.to,
    };
  }

  return (
    <div className={`app theme-ui-${theme}`}>
      <header className="app-bar glass">
        <div className="brand"><span className="brand-badge"><Icon name="route" size={20} /></span><div><b>AI Road Trip</b><small>CINEMA</small></div></div>
        <div className="app-bar-actions">
          <span className="day-chip"><Icon name="sun" size={14} /> {DAY_DRIVE_HOURS}h/day plan</span>
          <button className="btn glass round" onClick={() => setCinema(!cinema)} aria-label="Cinema"><Icon name="cinema" size={18} /></button>
        </div>
      </header>

      {intro && (
        <div className="intro">
          <div className="intro-kicker">AI ROAD TRIP CINEMA</div>
          <h1 className="intro-title">Koi bhi <span className="grad">Road Trip</span>,<br />Khud Chalegi.</h1>
          <p className="intro-sub">Start aur Destination daalo — gaadi real map par khud chalegi. Turns, stops, stay, khana, mausam, border — sab khud dikhega. Ek click, phir sirf dekho.</p>
        </div>
      )}

      {stage}

      <RoutePanel lang={lang} loading={loading} onStart={handleStart} />
      {!cinema && <Controls {...ctrlProps()} />}
      {toast && <div className="toast glass-strong"><Icon name="check" size={16} /> {toast}</div>}
      <footer className="foot-note">Map: MapLibre + CARTO/OpenFreeMap · Route: OSRM · Jagah: Nominatim · Mausam: Open-Meteo · Jaankari: Wikipedia/Overpass/REST Countries — sab free, bina kisi key ke.</footer>
    </div>
  );
}
