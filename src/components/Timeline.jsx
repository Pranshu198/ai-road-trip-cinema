// Timeline.jsx — day-wise itinerary + trip stats + elevation profile.
// Days are sliced by simulated driving hours; overnight stay = the stop
// nearest to each day boundary.
import React, { useEffect, useState } from 'react';
import { fmtKm } from '../lib/geo.js';
import { Icon } from '../lib/icons.jsx';
import { t } from '../lib/i18n.js';
import { DAY_DRIVE_HOURS } from '../hooks/useJourney.js';

const CRUISE_KMH = 55; // realistic average incl. breaks for planning
const FUEL_RUPEE_PER_KM = 4.2; // rough petrol running cost

export function buildDays(route) {
  if (!route) return [];
  const totalH = route.path.total / 1000 / CRUISE_KMH;
  const nDays = Math.max(1, Math.ceil(totalH / DAY_DRIVE_HOURS));
  const perDay = route.path.total / nDays;
  const days = [];
  for (let d = 0; d < nDays; d++) {
    const end = Math.min(route.path.total, perDay * (d + 1));
    let stay = route.stopPoints?.filter((s) => s.atDist <= end).pop();
    if (d === nDays - 1) stay = route.stopPoints?.[route.stopPoints.length - 1];
    days.push({ day: d + 1, km: perDay / 1000, endDist: end, stayName: stay?.name || 'En route', fuel: Math.round(perDay / 1000 * FUEL_RUPEE_PER_KM) });
  }
  return days;
}

export function ElevationChart({ route }) {
  const [pts, setPts] = useState(null);
  useEffect(() => {
    if (!route) return;
    let dead = false;
    (async () => {
      const N = 36;
      const samples = [];
      for (let i = 0; i <= N; i++) {
        const idx = Math.floor((route.coords.length - 1) * (i / N));
        samples.push(route.coords[idx]);
      }
      try {
        const url = `https://api.open-meteo.com/v1/elevation?latitude=${samples.map((s) => s[1]).join(',')}&longitude=${samples.map((s) => s[0]).join(',')}`;
        const r = await fetch(url); const d = await r.json();
        if (!dead && Array.isArray(d.elevation)) { setPts(d.elevation); return; }
        throw new Error('no elevation');
      } catch {
        if (!dead) setPts(samples.map((_, i) => 300 + 260 * Math.abs(Math.sin(i * 0.7)) + i * 4)); // graceful fallback shape
      }
    })();
    return () => { dead = true; };
  }, [route]);
  if (!route || !pts) return <div className="skeleton h-60" />;
  const max = Math.max(...pts), min = Math.min(...pts);
  const W = 320, H = 70;
  const line = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - min) / (max - min || 1)) * (H - 8) - 4}`).join(' ');
  return (
    <div className="elev">
      <svg viewBox={`0 0 ${W} ${H}`} className="elev-svg" preserveAspectRatio="none">
        <polyline points={`0,${H} ${line} ${W},${H}`} fill="rgba(34,211,238,.18)" stroke="none" />
        <polyline points={line} fill="none" stroke="#22d3ee" strokeWidth="2" />
      </svg>
      <div className="elev-meta"><span>Min {Math.round(min)} m</span><span>Max {Math.round(max)} m</span></div>
    </div>
  );
}

export default function Timeline({ route, lang }) {
  if (!route) return <div className="panel-note">Route banne ke baad din-wise plan yahan dikhega.</div>;
  const days = buildDays(route);
  const countries = new Set((route.stopPoints || []).map((s) => s.countryCode).filter(Boolean));
  const fuelTotal = Math.round(route.path.total / 1000 * FUEL_RUPEE_PER_KM);
  return (
    <div className="timeline">
      <div className="stat-grid">
        <div className="stat glass"><Icon name="route" /><b>{fmtKm(route.path.total)}</b><span>{t(lang, 'totalKm')}</span></div>
        <div className="stat glass"><Icon name="flag" /><b>{days.length}</b><span>{t(lang, 'day')}s</span></div>
        <div className="stat glass"><Icon name="globe" /><b>{countries.size || 1}</b><span>{t(lang, 'countries')}</span></div>
        <div className="stat glass"><Icon name="fuel" /><b>₹{fuelTotal.toLocaleString('en-IN')}</b><span>Fuel approx</span></div>
      </div>
      <div className="ctl-label"><Icon name="chart" size={18} /> {t(lang, 'elevation')}</div>
      <ElevationChart route={route} />
      <div className="ctl-label"><Icon name="list" size={18} /> {t(lang, 'itinerary')}</div>
      <div className="day-list">
        {days.map((d) => (
          <div key={d.day} className="day-row glass">
            <div className="day-badge">{t(lang, 'day')} {d.day}</div>
            <div className="day-main"><b>{d.km.toFixed(0)} km</b><span>{t(lang, 'nightStay')}: {d.stayName.split(',')[0]}</span></div>
            <div className="day-fuel">₹{d.fuel.toLocaleString('en-IN')}</div>
          </div>
        ))}
      </div>
      <p className="panel-note small">Plan {CRUISE_KMH} km/h average aur din me ~{DAY_DRIVE_HOURS} ghante driving par bana hai. Toll desh/route ke hisaab se alag lagega.</p>
    </div>
  );
}
