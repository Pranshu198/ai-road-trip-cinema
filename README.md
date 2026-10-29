# AI Road Trip Cinema

A real **React + Vite** web app: press **START JOURNEY** and any road trip on
Earth plays itself on a real map — the vehicle drives in follow-cam,
turn-by-turn instructions appear (and are spoken), stop cards pop up with
what to see / eat / where to stay, borders announce themselves, and at the
end you can download the whole trip as a video of exactly the length you pick.

Default trip: **Delhi → Dubai** (hybrid route — road to Bandar Abbas, ferry
to Sharjah, road to Dubai — because no single road crosses the Gulf).
Works for anything: Delhi → Dehradun, Mumbai → Goa, Paris → Rome…

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173/ai-road-trip-cinema/
npm run build    # production build into dist/
npm run preview
```

No API keys needed. MapLibre GL JS is loaded from CDN; tiles come from free
CORS-friendly sources (CARTO / OpenFreeMap / Esri). Routing: OSRM.
Geocoding: Nominatim. Weather: Open-Meteo. Place info: Wikipedia REST,
Overpass, REST Countries.

## Features

- **Universal routing** — From / To + optional multi-stops, Nominatim
  autocomplete, OSRM road routes with real turn-by-turn steps; automatic
  hybrid fallback (ferry / flight great-circle, dashed) when no road exists.
- **Follow-cam cinema** — large glowing vehicle marker, bearing-rotated,
  headlight beam at night, progressive neon trail, pitch-60 3D view.
  Camera modes: Chase, Top-down, Drone orbit, Helicopter, Side-tracking,
  Auto-cycle.
- **Zoom Lock (default ON)** — set zoom 3–18 (slider or chips); the whole
  journey runs at exactly that zoom. Nothing auto-zooms behind your back.
- **Cinema mode** — in-page full-viewport stage. It deliberately does NOT
  use the native `requestFullscreen()` on the WebGL canvas (that crashed
  phone webviews); a floating Controls button opens the full controller
  inside cinema mode.
- **Speed control** — logarithmic slider + numeric input + presets
  0.5 / 5 / 60 / 120 / 500 / 1000 / 10000 km/h and **Warp** (full replay in
  ~3 s). Speed scales the simulated clock and day/night cycle consistently.
  Keyboard: Space = play/pause, ↑/↓ = speed, R = restart, Esc = exit cinema.
- **Trip intelligence** — auto stop cards (Wikipedia summary + photo,
  Open-Meteo live weather, Overpass sights/hotels/food/fuel, stay cost),
  "Entering <country>" border banner with flag, currency, driving side,
  day-wise itinerary, trip stats and an elevation profile chart.
- **6 themes** — Neon Cyberpunk, Vintage Paper, Satellite, Blueprint,
  Anime Sunset, Minimal Dark. **6 vehicles** — Car, SUV, Bike, Bus, Truck,
  Plane. **Zero emojis** — a custom in-house SVG icon set.
- **Video export** — choose 15 s – 10 min (or custom), the app auto-sets
  the required playback speed and records the journey on a canvas stage
  (real route shape, turns, stops, HUD) via `captureStream` +
  `MediaRecorder`, 9:16 or 16:9, with preview + download (MP4 if the
  browser supports the mime, otherwise WebM).
- **Mobile-app feel** — app bar, bottom pill tab sheet (Journey / Stops /
  Video / More), safe-area padding, installable PWA manifest, glassmorphism
  panels everywhere. Language toggle: Hinglish / English / Hindi.
  Trip state is shareable via URL hash; JSON export included.

## Project structure

```
src/
  main.jsx                 entry
  App.jsx                  orchestration: engine, speech, borders, cinema
  styles.css               glassmorphism design system
  lib/geo.js               Nominatim + OSRM + hybrid fallback routing
  lib/intel.js             Wikipedia / Open-Meteo / Overpass / REST Countries
  lib/i18n.js              Hinglish / English / Hindi strings
  lib/icons.jsx            custom SVG icon set (zero emojis)
  hooks/useJourney.js      simulation engine (distance, clock, maneuvers)
  components/MapStage.jsx  MapLibre stage, vehicle marker, camera director
  components/RoutePanel.jsx  From/To/stops inputs + START
  components/Hud.jsx       turn banner + progress chips
  components/Controls.jsx  bottom-sheet controller (speed/zoom/camera/theme)
  components/StopCard.jsx  stop intelligence card + border banner
  components/Timeline.jsx  stats, elevation chart, day-wise itinerary
  components/VideoExport.jsx duration-based video recorder
```

## Known limitations (honest)

- 3D buildings/terrain depend on the free tile style and zoom level; where
  the style has no building layer, the map stays 2.5D (pitch still applies).
- Video export renders on an animated canvas stage (same real route, turns
  and stops), not a screen-record of the live WebGL map — compositing the
  MapLibre canvas is unreliable across browsers. MP4 depends on the
  browser's MediaRecorder mime support; otherwise WebM is produced.
  No ffmpeg.wasm conversion and no background music in this version.
- Live data (Wikipedia/Overpass/weather) needs network; everything degrades
  gracefully to fallbacks offline. If map tiles are blocked entirely, a 2D
  canvas fallback still plays the full journey.
- OSRM/Nominatim are public demo servers — heavy use can be rate-limited;
  results are cached in-memory per session.
- Border/visa notes are indicative only — always confirm on the official
  embassy site before a real international drive. Delhi → Dubai by road
  additionally needs a Carnet de Passage and border permissions that may
  not be grantable in practice; the app shows the route, not a guarantee.
```

