// VideoExport.jsx — pick a target duration, the app auto-calculates the
// speed that fits the whole trip into it, replays the journey on a
// recording stage (canvas rendering of the real route shape + HUD) and
// records it with captureStream + MediaRecorder. Honest note: the live
// MapLibre WebGL canvas cannot be composited reliably in every browser,
// so the video is rendered on this animated stage using the real route
// geometry, turns and stops.
import React, { useRef, useState } from 'react';
import { pointAt, fmtKm } from '../lib/geo.js';
import { Icon } from '../lib/icons.jsx';
import { t } from '../lib/i18n.js';

const fmtClock = (h) => `${String(Math.floor(h % 24)).padStart(2, '0')}:${String(Math.floor((h % 1) * 60)).padStart(2, '0')}`;

export default function VideoExport({ route, fromName, toName, lang }) {
  const [secs, setSecs] = useState(60);
  const [vertical, setVertical] = useState(true);
  const [busy, setBusy] = useState(false);
  const [pct, setPct] = useState(0);
  const [videoUrl, setVideoUrl] = useState('');
  const [mime, setMime] = useState('video/webm');
  const canvasRef = useRef(null);

  if (!route) return <div className="panel-note">Pehle START dabakar route banao, phir yahan se video banegi.</div>;
  const totalKm = route.path.total / 1000;
  const needKmh = totalKm / (secs / 3600);

  const record = () => {
    const cv = canvasRef.current; if (!cv || busy) return;
    const W = vertical ? 720 : 1280, H = vertical ? 1280 : 720;
    cv.width = W; cv.height = H;
    const ctx = cv.getContext('2d');
    const mimeType = ['video/mp4;codecs=avc1', 'video/mp4', 'video/webm;codecs=vp9', 'video/webm']
      .find((m) => window.MediaRecorder?.isTypeSupported(m)) || '';
    let rec;
    try {
      rec = new MediaRecorder(cv.captureStream(30), mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
    } catch { return; }
    setMime(rec.mimeType || mimeType || 'video/webm');
    const chunks = [];
    rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
    rec.onstop = () => {
      const blob = new Blob(chunks, { type: rec.mimeType || 'video/webm' });
      setVideoUrl(URL.createObjectURL(blob));
      setBusy(false);
    };
    // project route into canvas
    let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
    for (const c of route.coords) { minX = Math.min(minX, c[0]); maxX = Math.max(maxX, c[0]); minY = Math.min(minY, c[1]); maxY = Math.max(maxY, c[1]); }
    const pad = vertical ? 70 : 90;
    const px = (c) => [((c[0] - minX) / (maxX - minX || 1)) * (W - pad * 2) + pad, H - 180 - (((c[1] - minY) / (maxY - minY || 1)) * (H - 360))];
    setBusy(true); setPct(0); setVideoUrl('');
    rec.start(250);
    const t0 = performance.now();
    const draw = (now) => {
      const frac = Math.min(1, (now - t0) / (secs * 1000));
      setPct(Math.round(frac * 100));
      const dist = frac * route.path.total;
      const { pos } = pointAt(route.path, dist);
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#0b1020'); grad.addColorStop(1, '#1e1b4b');
      ctx.fillStyle = grad; ctx.fillRect(0, 0, W, H);
      // route
      ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(148,163,184,.35)'; ctx.lineWidth = 6; ctx.beginPath();
      route.coords.forEach((c, i) => { const [x, y] = px(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      const { segIndex } = pointAt(route.path, dist);
      ctx.strokeStyle = '#22d3ee'; ctx.lineWidth = 9; ctx.shadowColor = '#22d3ee'; ctx.shadowBlur = 16; ctx.beginPath();
      route.coords.slice(0, segIndex + 1).forEach((c, i) => { const [x, y] = px(c); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.stroke();
      ctx.shadowBlur = 0;
      // stops
      ctx.font = `600 ${vertical ? 19 : 17}px system-ui`; ctx.textAlign = 'center';
      for (const s of route.stopPoints || []) {
        const [sx, sy] = px(s.lngLat);
        ctx.fillStyle = dist >= s.atDist ? '#f59e0b' : '#e2e8f0';
        ctx.beginPath(); ctx.arc(sx, sy, 7, 0, 7); ctx.fill();
        if (dist >= s.atDist) { ctx.fillStyle = '#fef3c7'; ctx.fillText(s.name.split(',')[0], sx, sy - 14); }
      }
      // car
      const [cx, cy] = px(pos);
      ctx.fillStyle = '#f59e0b'; ctx.strokeStyle = '#fff'; ctx.lineWidth = 4;
      ctx.beginPath(); ctx.arc(cx, cy, 20, 0, 7); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#0b1020'; ctx.font = `bold ${vertical ? 15 : 14}px system-ui`; ctx.fillText('CAR', cx, cy + 5);
      // HUD
      ctx.textAlign = 'left'; ctx.fillStyle = '#f8fafc';
      ctx.font = `800 ${vertical ? 30 : 34}px system-ui`;
      ctx.fillText(`${fromName} → ${toName}`, pad - 20, vertical ? 74 : 64);
      const man = route.maneuvers.find((m) => m.atDist > dist);
      ctx.font = `600 ${vertical ? 21 : 20}px system-ui`; ctx.fillStyle = '#a5f3fc';
      ctx.fillText(man ? `Turn: ${man.modifier || man.type} ${man.road ? '· ' + man.road : ''} · ${fmtKm(man.atDist - dist)}` : 'Final stretch', pad - 20, vertical ? 112 : 100);
      ctx.fillStyle = '#e2e8f0'; ctx.font = `500 ${vertical ? 20 : 19}px system-ui`;
      ctx.fillText(`${fmtKm(dist)} / ${fmtKm(route.path.total)}   ·   ${fmtClock(6 + (dist / 1000) / (needKmh || 1))}`, pad - 20, H - 56);
      ctx.fillRect(pad - 20, H - 40, (W - pad * 2 + 40) * frac, 8);
      if (frac < 1) requestAnimationFrame(draw);
      else setTimeout(() => rec.stop(), 350);
    };
    requestAnimationFrame(draw);
  };

  const ext = mime.includes('mp4') ? 'mp4' : 'webm';
  return (
    <div className="video-export">
      <div className="ctl-label"><Icon name="video" size={18} /> {t(lang, 'duration')}</div>
      <div className="chip-row">
        {[15, 30, 60, 120, 300, 600].map((s) => (
          <button key={s} className={`chip ${secs === s ? 'on' : ''}`} onClick={() => setSecs(s)}>{s < 60 ? `${s}s` : `${s / 60} min`}</button>
        ))}
        <label className="mini-input">Custom <input type="number" min="5" max="3600" value={secs} onChange={(e) => setSecs(Math.max(5, +e.target.value || 5))} /> sec</label>
      </div>
      <div className="chip-row">
        <button className={`chip ${vertical ? 'on' : ''}`} onClick={() => setVertical(true)}>9:16 Shorts</button>
        <button className={`chip ${!vertical ? 'on' : ''}`} onClick={() => setVertical(false)}>16:9</button>
      </div>
      <p className="panel-note">Puri {totalKm.toFixed(0)} km journey {secs} sec me dikhane ke liye playback speed ≈ <b>{needKmh.toLocaleString('en-IN', { maximumFractionDigits: 0 })} km/h</b> set hogi.</p>
      <canvas ref={canvasRef} className="rec-stage" style={{ aspectRatio: vertical ? '9/16' : '16/9' }} />
      {busy && <div className="rec-bar"><div style={{ width: pct + '%' }} /><span>Recording {pct}% — tab switch mat karo</span></div>}
      {!busy && !videoUrl && <button className="btn primary wide" onClick={record}><Icon name="video" size={18} /> {t(lang, 'makeVideo')}</button>}
      {videoUrl && (
        <div className="rec-done">
          <video src={videoUrl} controls playsInline className="rec-preview" />
          <a className="btn primary wide" href={videoUrl} download={`roadtrip-${secs}s.${ext}`}><Icon name="download" size={18} /> {t(lang, 'download')} ({ext.toUpperCase()})</a>
          <button className="btn ghost wide" onClick={record}>Dobara banao</button>
        </div>
      )}
      <p className="panel-note small">Note: Video is canvas stage par banti hai — same asal route, turns aur stops, animated style me. Live map screen-record browser har jagah allow nahi karta, ye uska pakka chalne wala tareeka hai.</p>
    </div>
  );
}
