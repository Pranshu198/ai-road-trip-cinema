// Controls.jsx — the bottom-sheet controller: tabs Journey / Stops /
// Video / More. Speed (log slider + presets + Warp), Zoom Lock, camera
// modes, themes, vehicle, voice, language, seek, share/export.
import React from 'react';
import { Icon, VEHICLE_ICON } from '../lib/icons.jsx';
import { t } from '../lib/i18n.js';
import { SPEED_PRESETS } from '../hooks/useJourney.js';
import Timeline from './Timeline.jsx';
import VideoExport from './VideoExport.jsx';

export const CAM_MODES = [['chase', 'Chase'], ['top', 'Top-Down'], ['drone', 'Drone'], ['heli', 'Helicopter'], ['side', 'Side'], ['auto', 'Auto-Cycle']];
export const THEMES = [['neon', 'Neon Cyberpunk'], ['vintage', 'Vintage Paper'], ['satellite', 'Satellite'], ['blueprint', 'Blueprint'], ['anime', 'Anime Sunset'], ['dark', 'Minimal Dark']];
export const VEHICLES = [['car', 'Car'], ['suv', 'SUV'], ['bike', 'Bike'], ['bus', 'Bus'], ['truck', 'Truck'], ['plane', 'Plane']];
const ZOOM_CHIPS = [6, 8, 10, 12, 14, 16];
// log scale between 0.5 and 20000 km/h for the speed slider
const logPos = (v) => (Math.log10(v / 0.5) / Math.log10(20000 / 0.5)) * 1000;
const logVal = (p) => 0.5 * Math.pow(20000 / 0.5, p / 1000);

export default function Controls(props) {
  const { lang, tab, setTab, route, journey, zoomLock, setZoomLock, lockZoom, setLockZoom,
    camMode, setCamMode, theme, setTheme, vehicle, setVehicle, voice, setVoice, setLang,
    onShare, onExportJson, fromName, toName } = props;
  const { playing, setPlaying, speedKmh, setSpeedKmh, warp, setWarp, dist, total, seek } = journey;
  return (
    <div className="sheet glass-strong">
      <div className="sheet-tabs">
        {[['journey', 'route', t(lang, 'journey')], ['stops', 'list', t(lang, 'stops')], ['video', 'video', t(lang, 'video')], ['more', 'settings', t(lang, 'more')]].map(([k, ic, lb]) => (
          <button key={k} className={`sheet-tab ${tab === k ? 'on' : ''}`} onClick={() => setTab(k)}><Icon name={ic} size={19} /><span>{lb}</span></button>
        ))}
      </div>
      <div className="sheet-body">
        {tab === 'journey' && (
          <div>
            <div className="transport-row">
              <button className="btn round" onClick={() => journey.seek(0)} aria-label="Restart"><Icon name="restart" size={20} /></button>
              <button className="btn primary round big" onClick={() => setPlaying(!playing)} aria-label="Play/Pause"><Icon name={playing ? 'pause' : 'play'} size={26} /></button>
              <button className={`btn round ${warp ? 'on' : ''}`} onClick={() => setWarp(!warp)} aria-label="Warp"><Icon name="plane" size={20} /></button>
              <div className="speed-read"><b>{warp ? '∞ Warp' : `${Math.round(speedKmh)} km/h`}</b><span>{t(lang, 'speed')}</span></div>
            </div>
            <input className="slider" type="range" min="0" max="1000" value={logPos(speedKmh)} onChange={(e) => { setWarp(false); setSpeedKmh(Math.round(logVal(+e.target.value) * 10) / 10); }} aria-label="Speed" />
            <div className="chip-row">
              {SPEED_PRESETS.map((s) => <button key={s} className={`chip ${!warp && speedKmh === s ? 'on' : ''}`} onClick={() => { setWarp(false); setSpeedKmh(s); }}>{s}</button>)}
              <button className={`chip warp ${warp ? 'on' : ''}`} onClick={() => setWarp(!warp)}>∞ {t(lang, 'warp')}</button>
              <label className="mini-input"><input type="number" min="0.5" step="0.5" value={speedKmh} onChange={(e) => { setWarp(false); setSpeedKmh(Math.max(0.5, +e.target.value || 0.5)); }} /> km/h</label>
            </div>
            <div className="ctl-label"><Icon name="route" size={16} /> {t(lang, 'seek')}</div>
            <input className="slider" type="range" min="0" max="1000" value={total ? (dist / total) * 1000 : 0} onChange={(e) => seek(+e.target.value / 1000)} aria-label="Seek" />
            <div className="two-col">
              <div>
                <div className="ctl-label"><Icon name={zoomLock ? 'lock' : 'unlock'} size={16} /> {t(lang, 'zoomLock')} · {lockZoom}</div>
                <input className="slider" type="range" min="3" max="18" step="0.5" value={lockZoom} onChange={(e) => { setLockZoom(+e.target.value); setZoomLock(true); }} aria-label="Zoom" />
                <div className="chip-row">
                  {ZOOM_CHIPS.map((z) => <button key={z} className={`chip ${lockZoom === z ? 'on' : ''}`} onClick={() => { setLockZoom(z); setZoomLock(true); }}>{z}</button>)}
                  <button className={`chip ${zoomLock ? 'on' : ''}`} onClick={() => setZoomLock(!zoomLock)}>{zoomLock ? 'LOCK ON' : 'LOCK OFF'}</button>
                </div>
              </div>
              <div>
                <div className="ctl-label"><Icon name="camera" size={16} /> {t(lang, 'camera')}</div>
                <div className="chip-row">{CAM_MODES.map(([k, lb]) => <button key={k} className={`chip ${camMode === k ? 'on' : ''}`} onClick={() => setCamMode(k)}>{lb}</button>)}</div>
                <div className="ctl-label"><Icon name="layers" size={16} /> {t(lang, 'theme')}</div>
                <div className="chip-row">{THEMES.map(([k, lb]) => <button key={k} className={`chip ${theme === k ? 'on' : ''}`} onClick={() => setTheme(k)}>{lb}</button>)}</div>
              </div>
            </div>
          </div>
        )}
        {tab === 'stops' && <Timeline route={route} lang={lang} />}
        {tab === 'video' && <VideoExport route={route} fromName={fromName} toName={toName} lang={lang} />}
        {tab === 'more' && (
          <div>
            <div className="ctl-label"><Icon name="car" size={16} /> {t(lang, 'vehicle')}</div>
            <div className="chip-row">{VEHICLES.map(([k, lb]) => <button key={k} className={`chip veh ${vehicle === k ? 'on' : ''}`} onClick={() => setVehicle(k)}><Icon name={VEHICLE_ICON[k]} size={17} /> {lb}</button>)}</div>
            <div className="ctl-label"><Icon name="mic" size={16} /> {t(lang, 'voice')}</div>
            <div className="chip-row">
              <button className={`chip ${voice ? 'on' : ''}`} onClick={() => setVoice(!voice)}>{voice ? 'ON' : 'OFF'}</button>
              {[['hinglish', 'Hinglish'], ['english', 'English'], ['hindi', 'Hindi']].map(([k, lb]) => <button key={k} className={`chip ${lang === k ? 'on' : ''}`} onClick={() => setLang(k)}>{lb}</button>)}
            </div>
            <div className="ctl-label"><Icon name="share" size={16} /> Trip save / share</div>
            <div className="chip-row">
              <button className="chip" onClick={onShare}><Icon name="share" size={15} /> Link copy</button>
              <button className="chip" onClick={onExportJson}><Icon name="download" size={15} /> JSON export</button>
            </div>
            <p className="panel-note small">Cinema mode ke liye map ke upar wala Cinema button dabao — wo page ke andar hi full-screen jaisa khulta hai (phone crash wala purana tareeka istemal nahi hota).</p>
          </div>
        )}
      </div>
    </div>
  );
}
