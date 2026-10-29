// useJourney.js — the simulation engine. Advances travelled distance by
// simulated speed, derives the current position / maneuver / stop / day,
// scales the simulated clock and day-night cycle with the same speed.
import { useEffect, useMemo, useRef, useState } from 'react';
import { pointAt } from '../lib/geo.js';

export const SPEED_PRESETS = [0.5, 5, 60, 120, 500, 1000, 10000];
export const DAY_DRIVE_HOURS = 9; // simulated driving hours per day

export function useJourney(route) {
  const engineRef = useRef({ dist: 0, pos: null, bearing: 0, speedKmh: 300 });
  const [playing, setPlaying] = useState(false);
  const [speedKmh, setSpeedKmh] = useState(300);
  const [dist, setDist] = useState(0);
  const [warp, setWarp] = useState(false);
  const lastRef = useRef(null);
  const rafRef = useRef(0);

  const total = route?.path.total || 0;

  useEffect(() => { // reset when a new route arrives
    engineRef.current.dist = 0; setDist(0); setPlaying(false); setWarp(false);
    lastRef.current = null;
  }, [route]);

  useEffect(() => {
    engineRef.current.speedKmh = warp && total ? total / 1000 / 3 : speedKmh; // warp: full trip in ~3s
  }, [speedKmh, warp, total]);

  useEffect(() => {
    if (!playing || !route) return;
    const step = (ts) => {
      if (lastRef.current == null) lastRef.current = ts;
      const dt = Math.min(0.1, (ts - lastRef.current) / 1000);
      lastRef.current = ts;
      const v = (engineRef.current.speedKmh * 1000) / 3600; // m per real second
      engineRef.current.dist = Math.min(total, engineRef.current.dist + v * dt);
      setDist(engineRef.current.dist);
      if (engineRef.current.dist >= total) { setPlaying(false); return; }
      rafRef.current = requestAnimationFrame(step);
    };
    rafRef.current = requestAnimationFrame(step);
    return () => { cancelAnimationFrame(rafRef.current); lastRef.current = null; };
  }, [playing, route, total]);

  const derived = useMemo(() => {
    if (!route) return null;
    const { pos, bearing } = pointAt(route.path, dist);
    const simHours = speedKmh > 0 ? dist / 1000 / (warp ? engineRef.current.speedKmh : speedKmh) : 0;
    const clockHours = 6 + simHours; // journey starts 06:00
    const hourOfDay = clockHours % 24;
    const day = Math.floor(simHours / DAY_DRIVE_HOURS) + 1;
    const night = hourOfDay >= 19 || hourOfDay < 6;
    // next maneuver
    let nextMan = null, prevMan = null;
    for (const m of route.maneuvers) {
      if (m.atDist > dist + 20) { nextMan = m; break; }
      prevMan = m;
    }
    // current + next stop
    let curStop = null, nextStop = null;
    for (const s of route.stopPoints || []) {
      if (s.atDist <= dist + 500) curStop = s;
      if (s.atDist > dist + 500 && !nextStop) nextStop = s;
    }
    const remaining = total - dist;
    const etaSec = speedKmh > 0 ? (remaining / 1000) / (warp ? engineRef.current.speedKmh : speedKmh) * 3600 : Infinity;
    return { pos, bearing, day, hourOfDay, night, nextMan, prevMan, curStop, nextStop, remaining, etaSec, simHours };
  }, [route, dist, speedKmh, warp, total]);

  return {
    engineRef, playing, setPlaying, speedKmh, setSpeedKmh,
    warp, setWarp, dist, setDist, total, derived,
    seek: (frac) => { const d = Math.max(0, Math.min(1, frac)) * total; engineRef.current.dist = d; setDist(d); },
  };
}

/** Speak text with the Web Speech API (toggleable, hi/en). */
let lastSpoken = '';
export function speak(text, lang, enabled) {
  if (!enabled || !text || text === lastSpoken) return;
  lastSpoken = text;
  try {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang === 'hindi' ? 'hi-IN' : lang === 'english' ? 'en-IN' : 'hi-IN';
    u.rate = 1.02;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  } catch { /* no speech on this device */ }
}
export function resetSpeech() { lastSpoken = ''; }
