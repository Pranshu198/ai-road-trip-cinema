// StopCard.jsx — the auto-popup intelligence card for the current stop.
import React from 'react';
import { Icon } from '../lib/icons.jsx';

const WX_LABEL = { clear: 'Saaf mausam', cloudy: 'Badal', fog: 'Dhundh', rain: 'Baarish', snow: 'Barf', storm: 'Toofan' };

export default function StopCard({ stop, onClose }) {
  if (!stop) return null;
  return (
    <div className="stop-card glass-strong" role="dialog" aria-label={stop.name}>
      <button className="x-btn" onClick={onClose} aria-label="Close"><Icon name="close" size={18} /></button>
      {stop.image && <img className="stop-img" src={stop.image} alt="" loading="lazy" />}
      <div className="stop-body">
        <div className="stop-kicker"><Icon name="pin" size={15} /> STOP · {stop.country || ''}</div>
        <h3>{stop.name}</h3>
        {stop.weather && <div className="wx-chip"><Icon name={stop.weather.kind === 'clear' ? 'sun' : 'moon'} size={15} /> {WX_LABEL[stop.weather.kind] || ''} · {stop.weather.temp != null ? `${Math.round(stop.weather.temp)}°C` : ''} {stop.weather.wind ? `· Hawa ${Math.round(stop.weather.wind)} km/h` : ''}</div>}
        {stop.summary && <p className="stop-summary">{stop.summary.slice(0, 260)}{stop.summary.length > 260 ? '…' : ''}</p>}
        <div className="stop-sec"><span className="stop-sec-t"><Icon name="sight" size={15} /> Kya dekhein</span><span>{stop.sights.join(' · ')}</span></div>
        <div className="stop-sec"><span className="stop-sec-t"><Icon name="food" size={15} /> Khana</span><span>{stop.food}</span></div>
        <div className="stop-sec"><span className="stop-sec-t"><Icon name="bed" size={15} /> Stay</span><span>{stop.hotels.join(' · ')}</span></div>
        <div className="stop-foot">
          <span><Icon name="fuel" size={14} /> Fuel aas-paas: {stop.fuelStops || '—'}</span>
          <span>{stop.stayCost}</span>
          {stop.currency && <span>{stop.currency}</span>}
        </div>
        <p className="stop-best">{stop.bestTime}</p>
      </div>
    </div>
  );
}

export function BorderBanner({ country, onDone }) {
  if (!country) return null;
  return (
    <div className="border-banner glass-strong" onAnimationEnd={() => setTimeout(onDone, 2600)}>
      {country.flag && <img src={country.flag} alt={country.flagAlt || country.name} className="flag-img" />}
      <div>
        <div className="bb-kicker">ENTERING</div>
        <div className="bb-name">{country.name} <span className="cc-badge">{country.code}</span></div>
        <div className="bb-meta">
          {country.currency && <span>Currency: {country.currency}</span>}
          {country.drivingSide && <span>Driving: {country.drivingSide} side</span>}
          {country.languages && <span>{country.languages}</span>}
        </div>
        <div className="bb-visa">Visa: jaane se pehle official embassy se confirm karo — border par gaadi ke liye Carnet de Passage lag sakta hai.</div>
      </div>
    </div>
  );
}
