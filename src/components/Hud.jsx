// Hud.jsx — the live navigation HUD over the map: next-turn banner with
// animated arrow + countdown, trip progress chips, compass and day/night.
import React from 'react';
import { fmtKm, fmtDur } from '../lib/geo.js';
import { Icon, maneuverIcon } from '../lib/icons.jsx';
import { t } from '../lib/i18n.js';

const MOD_WORD = { left: 'LEFT lo', right: 'RIGHT lo', straight: 'Seedha chalo', 'slight left': 'Halka LEFT', 'slight right': 'Halka RIGHT', 'sharp left': 'Tez LEFT', 'sharp right': 'Tez RIGHT', uturn: 'U-TURN lo' };
export function maneuverText(m, lang) {
  if (!m) return '';
  if (m.type === 'arrive') return lang === 'english' ? 'You have arrived' : 'Manzil aa gayi';
  if (m.type === 'depart') return lang === 'english' ? 'Journey starts' : 'Yatra shuru';
  if (m.type === 'roundabout') return `${m.exit ? `Roundabout se ${m.exit} wala exit lo` : 'Roundabout lo'}${m.road ? ' — ' + m.road : ''}`;
  const w = MOD_WORD[m.modifier] || 'Seedha chalo';
  return m.road ? `${w} — ${m.road} ki taraf` : w;
}

export default function Hud({ derived, dist, total, speedKmh, etaSec, lang, finished, onOpenControls }) {
  if (!derived) return null;
  const man = derived.nextMan;
  const toGo = man ? man.atDist - dist : 0;
  const clock = `${String(Math.floor(derived.hourOfDay)).padStart(2, '0')}:${String(Math.floor((derived.hourOfDay % 1) * 60)).padStart(2, '0')}`;
  return (
    <div className="hud">
      <div className="turn-banner glass-strong">
        <div className={`turn-arrow ${man && toGo < 800 ? 'pulse' : ''}`}><Icon name={maneuverIcon(man)} size={34} /></div>
        <div className="turn-main">
          {finished ? (
            <div className="turn-text">{t(lang, 'arrived')}</div>
          ) : man ? (
            <>
              <div className="turn-dist">{fmtKm(toGo)} <span>mein</span></div>
              <div className="turn-text">{maneuverText(man, lang)}</div>
            </>
          ) : (
            <div className="turn-text">Route par chalte raho</div>
          )}
        </div>
        <div className="turn-clock">
          <Icon name={derived.night ? 'moon' : 'sun'} size={17} />
          <span>{clock}</span><small>Din {derived.day}</small>
        </div>
      </div>
      <div className="hud-chips">
        <span className="hud-chip glass"><Icon name="route" size={14} /> {fmtKm(dist)} / {fmtKm(total)}</span>
        <span className="hud-chip glass"><Icon name="gauge" size={14} /> {Math.round(speedKmh)} km/h</span>
        <span className="hud-chip glass"><Icon name="flag" size={14} /> ETA {fmtDur(etaSec)}</span>
        <button className="hud-chip glass as-btn" onClick={onOpenControls}><Icon name="sliders" size={14} /> {t(lang, 'controls')}</button>
      </div>
      <div className="progress-track"><div className="progress-fill" style={{ width: `${total ? (dist / total) * 100 : 0}%` }} /></div>
    </div>
  );
}
