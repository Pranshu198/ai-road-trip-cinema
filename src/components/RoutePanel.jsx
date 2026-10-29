// RoutePanel.jsx — From / multi-stops / To with Nominatim autocomplete,
// preset chips, and the one big START JOURNEY button.
import React, { useEffect, useRef, useState } from 'react';
import { searchPlaces, geocode } from '../lib/geo.js';
import { Icon } from '../lib/icons.jsx';
import { t } from '../lib/i18n.js';

const PRESETS = [
  ['Delhi, India', 'Dehradun, India', 'Delhi → Dehradun'],
  ['Delhi, India', 'Dubai, UAE', 'Delhi → Dubai'],
  ['Mumbai, India', 'Goa, India', 'Mumbai → Goa'],
  ['Paris, France', 'Rome, Italy', 'Paris → Rome'],
  ['Delhi, India', 'Manali, India', 'Delhi → Manali'],
  ['Delhi, India', 'Jaipur, India', 'Delhi → Jaipur'],
];

function PlaceInput({ label, value, onChange, place, setPlace, autoFocus }) {
  const [sugs, setSugs] = useState([]);
  const [open, setOpen] = useState(false);
  const timer = useRef(null);
  useEffect(() => {
    if (!open || place) return;
    clearTimeout(timer.current);
    timer.current = setTimeout(async () => {
      try { setSugs(await searchPlaces(value)); } catch { setSugs([]); }
    }, 320);
    return () => clearTimeout(timer.current);
  }, [value, open, place]);
  return (
    <div className="place-input">
      <label>{label}</label>
      <div className="pi-row">
        <Icon name="pin" size={17} className="pi-ic" />
        <input value={value} autoFocus={autoFocus} placeholder="City ka naam likho..."
          onChange={(e) => { onChange(e.target.value); setPlace(null); setOpen(true); }}
          onFocus={() => setOpen(true)} onBlur={() => setTimeout(() => setOpen(false), 180)} />
        {place && <span className="pi-ok"><Icon name="check" size={15} /></span>}
      </div>
      {open && sugs.length > 0 && (
        <div className="sug-list glass-strong">
          {sugs.map((s, i) => (
            <button key={i} className="sug" onMouseDown={() => { setPlace(s); onChange(s.name); setOpen(false); }}>
              <Icon name="pin" size={14} /><span>{s.full}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function RoutePanel({ lang, loading, onStart }) {
  const [fromText, setFromText] = useState('Delhi, India');
  const [toText, setToText] = useState('Dubai, UAE');
  const [fromPlace, setFromPlace] = useState(null);
  const [toPlace, setToPlace] = useState(null);
  const [vias, setVias] = useState([]); // [{text, place}]
  const [err, setErr] = useState('');

  const start = async () => {
    setErr('');
    try {
      const from = fromPlace || (await geocode(fromText));
      const to = toPlace || (await geocode(toText));
      const viaPlaces = [];
      for (const v of vias) {
        if (!v.text.trim()) continue;
        viaPlaces.push(v.place || (await geocode(v.text)));
      }
      onStart({ from, vias: viaPlaces, to });
    } catch (e) { setErr(e.message || 'Jagah nahi mili — naam dobara check karo.'); }
  };

  const preset = ([f, tt]) => { setFromText(f); setToText(tt); setFromPlace(null); setToPlace(null); };

  return (
    <section className="route-panel glass">
      <div className="preset-row">
        {PRESETS.map((p) => <button key={p[2]} className="chip" onClick={() => preset(p)}>{p[2]}</button>)}
      </div>
      <PlaceInput label={t(lang, 'from')} value={fromText} onChange={setFromText} place={fromPlace} setPlace={setFromPlace} />
      {vias.map((v, i) => (
        <div key={i} className="via-row">
          <PlaceInput label={`Stop ${i + 1}`} value={v.text} onChange={(txt) => setVias(vias.map((x, j) => j === i ? { ...x, text: txt } : x))}
            place={v.place} setPlace={(p) => setVias(vias.map((x, j) => j === i ? { ...x, place: p } : x))} />
          <button className="btn ghost round sm" aria-label="Remove stop" onClick={() => setVias(vias.filter((_, j) => j !== i))}><Icon name="close" size={15} /></button>
        </div>
      ))}
      <PlaceInput label={t(lang, 'to')} value={toText} onChange={setToText} place={toPlace} setPlace={setToPlace} />
      <div className="start-row">
        <button className="btn ghost" onClick={() => setVias([...vias, { text: '', place: null }])}><Icon name="plus" size={17} /> {t(lang, 'addStop')}</button>
        <button className="btn start-btn" onClick={start} disabled={loading}>
          <Icon name="play" size={22} /> {loading ? t(lang, 'loading') : t(lang, 'start')}
        </button>
      </div>
      {err && <div className="panel-err"><Icon name="warn" size={15} /> {err}</div>}
    </section>
  );
}
