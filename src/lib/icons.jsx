// icons.jsx — the app's own inline SVG icon set. Zero emojis in the UI.
import React from 'react';

const P = {
  play: 'M8 5v14l11-7z',
  pause: 'M7 5h3.5v14H7zM13.5 5H17v14h-3.5z',
  restart: 'M12 5V1L6 7l6 6V9a5 5 0 1 1-5 5H5a7 7 0 1 0 7-9z',
  lock: 'M12 3a4 4 0 0 0-4 4v3H7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2h-1V7a4 4 0 0 0-4-4zm-2 7V7a2 2 0 1 1 4 0v3h-4z',
  unlock: 'M12 3a4 4 0 0 0-4 4H6a6 6 0 0 1 12 0h-2a4 4 0 0 0-4-4zM7 10a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7a2 2 0 0 0-2-2H7zm5 3a2 2 0 0 1 1 3.73V18h-2v-1.27A2 2 0 0 1 12 13z',
  cinema: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1zm2 2v10h12V7H6z',
  sliders: 'M4 7h8M18 7h2M4 17h4M14 17h6M4 12h13M20 12h0M14 4a3 3 0 1 0 0 6 3 3 0 0 0 0-6zM11 14a3 3 0 1 0 0 6 3 3 0 0 0 0-6z',
  gauge: 'M12 4a9 9 0 1 0 9 9h-2a7 7 0 1 1-7-7v2.07A5 5 0 0 1 16.93 13H19v2h-3a3 3 0 0 1-3-3V7.41A9 9 0 0 1 12 4z',
  camera: 'M9 4l1.5 2H20a1 1 0 0 1 1 1v11a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h3.5L9 4zm3 4a5 5 0 1 0 0 10 5 5 0 0 0 0-10z',
  video: 'M4 6h11a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1zm13 4l4-2.5v9L17 14v-4z',
  download: 'M11 3h2v10l3.5-3.5L18 11l-6 6-6-6 1.5-1.5L11 13V3zM4 19h16v2H4z',
  pin: 'M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5z',
  route: 'M6 3a3 3 0 0 0-3 3c0 2.4 3 5.6 3 5.6S9 8.4 9 6a3 3 0 0 0-3-3zm12 12a3 3 0 0 0-3 3c0 2.4 3 5.6 3 5.6s3-3.2 3-5.6a3 3 0 0 0-3-3zM6 13.5c6 0 4-6.5 10-6.5v2c-4.5 0-3.5 6-8.5 6L7.5 13.5H6z',
  sun: 'M12 17a5 5 0 1 1 0-10 5 5 0 0 1 0 10zM12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4',
  moon: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z',
  close: 'M6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12 19 6.4 17.6 5 12 10.6z',
  plus: 'M11 5h2v6h6v2h-6v6h-2v-6H5v-2h6z',
  minus: 'M5 11h14v2H5z',
  chevD: 'M12 15.5 4.5 8 6 6.5 12 12.5 18 6.5 19.5 8z',
  chevR: 'M8.5 12 16 4.5 17.5 6 11.5 12l6 6L16 19.5z',
  fuel: 'M5 3h9a1 1 0 0 1 1 1v16H4V4a1 1 0 0 1 1-1zm2 3v5h5V6H7zm10 3 2 2.5V16a1.5 1.5 0 0 0 3 0V9.6a2 2 0 0 0-.6-1.4L19 6V4h-2v5zM4 20h12v1.5H4z',
  bed: 'M3 18v-8h2v6h14v-4a3 3 0 0 0-3-3h-7v5H5v4H3zm4-8.5A1.75 1.75 0 1 0 7 5.75a1.75 1.75 0 0 0 0 3.75zM19 16v2h2v-6.5A5.5 5.5 0 0 0 15.5 6h-.6A7 7 0 0 1 19 12.5V16z',
  food: 'M7 2v8M4.5 2v4a2.5 2.5 0 0 0 5 0V2M7 10v12M17 2c-2 0-3.5 3-3.5 6.5 0 2.4 1.2 4 3.5 4V22h2V2h-2z',
  sight: 'M12 5C6 5 1.7 9.7 1 12c.7 2.3 5 7 11 7s10.3-4.7 11-7c-.7-2.3-5-7-11-7zm0 11a4 4 0 1 1 0-8 4 4 0 0 1 0 8z',
  car: 'M5.5 16.5 6.7 10A2 2 0 0 1 8.6 8.5h6.8a2 2 0 0 1 1.9 1.5l1.2 6.5M5 16.5h14M7.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM16.5 20a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM8 13h2m4 0h2',
  suv: 'M4 16l1.2-6.2A2 2 0 0 1 7.2 8.3h7.1a2 2 0 0 1 1.7.9L19 13l1 3M4 16h16M7.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM16.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM9 12.5h5',
  bike: 'M6.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM17.5 17.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM6.5 14 10 7h3l4.5 7M10 7L8.7 4.8H6.5M13 7l-1.8 6.5',
  bus: 'M5 4a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v13.5h-2.2a2.8 2.8 0 0 1-5.6 0H10a2.8 2.8 0 0 1-5.6 0H3V4h2zm2 2v5h10V6H7zm1.2 13.3a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zm7.6 0a1.3 1.3 0 1 0 0-2.6 1.3 1.3 0 0 0 0 2.6zM7 14h3m4 0h3',
  truck: 'M3 6h11v10H3zM14 10h4l3 3v3h-7zM7 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6zM17.5 19.5a1.8 1.8 0 1 0 0-3.6 1.8 1.8 0 0 0 0 3.6z',
  plane: 'M21.5 15.5 13 10V3.8a1.3 1.3 0 0 0-2.5 0V10L2 15.5v1.7l8.5-2.4v5l-2.3 1.7v1.4l3.6-1 3.6 1v-1.4L13 19.8v-5l8.5 2.4v-1.7z',
  ship: 'M4 15h16l-1.6 5H6.2L4 15zm7-9h2v6h5l-2.5 3h-9L4 12h7V6zM12 2v4',
  left: 'M10.5 4 4 12l6.5 8V13.5H20v-3H10.5V4z',
  right: 'M13.5 4 20 12l-6.5 8V13.5H4v-3h9.5V4z',
  straight: 'M11 21V6.8L6.8 10 5.4 8.4 12 2l6.6 6.4L17.2 10 13 6.8V21h-2z',
  uturn: 'M7 20v-7a5 5 0 0 1 10 0v1h-2v-1a3 3 0 1 0-6 0v7H7zm9-16 4 4-4 4V9.5H13v-2h3V4z',
  roundabout: 'M12 3a9 9 0 1 0 9 9h-2a7 7 0 1 1-2-4.9V9l4.5-3L23 9.5V5h-2v1.9A9 9 0 0 0 12 3zm0 5a4 4 0 1 0 0 8 4 4 0 0 0 0-8z',
  flag: 'M5 2h2v20H5zM9 3h11l-2.5 4L20 11H9z',
  globe: 'M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 2c1.3 1.6 2.1 4 2.3 8-.8.06-1.5.1-2.3.1s-1.5-.04-2.3-.1C9.9 8 10.7 5.6 12 4zM8 6.3C7 7.9 6.4 10 6.2 12H4.1A8 8 0 0 1 8 6.3zM4.1 14h2.1c.2 2 .8 4.1 1.8 5.7A8 8 0 0 1 4.1 14zM12 20c-1.3-1.6-2.1-4-2.3-6 .8-.06 1.5-.1 2.3-.1s1.5.04 2.3.1c-.2 2-1 4.4-2.3 6zm4-6.3c1-1.6 1.6-3.7 1.8-5.7h2.1a8 8 0 0 1-3.9 5.7zM16 6.3a8 8 0 0 1 3.9 5.7h-2.1c-.2-2-.8-4.1-1.8-5.7z',
  layers: 'M12 3 2 8.5 12 14 22 8.5 12 3zM4.5 12.5 2 14l10 5.5L22 14l-2.5-1.5L12 16.7 4.5 12.5z',
  mic: 'M12 3a3 3 0 0 1 3 3v5a3 3 0 0 1-6 0V6a3 3 0 0 1 3-3zm-7 8a7 7 0 0 0 6 6.92V21H9v2h6v-2h-2v-3.08A7 7 0 0 0 19 11h-2a5 5 0 0 1-10 0H5z',
  share: 'M12 3 7 8h3v7h4V8h3L12 3zM5 19h14v2H5z',
  list: 'M4 6h2v2H4zM4 11h2v2H4zM4 16h2v2H4zM8 6h13v2H8zM8 11h13v2H8zM8 16h13v2H8z',
  chart: 'M4 20V10h3v10H4zm6.5 0V4h3v16h-3zM17 20v-7h3v7h-3z',
  moonStar: 'M20 14.5A8.5 8.5 0 0 1 9.5 4 8.5 8.5 0 1 0 20 14.5z',
  warn: 'M12 3 1 21h22L12 3zm1 13h-2v2h2v-2zm0-7h-2v5h2V9z',
  check: 'M9.5 16.6 5 12.2 3.6 13.6 9.5 19.5 20.5 8.5 19.1 7.1z',
  settings: 'M12 8.5A3.5 3.5 0 1 0 12 15.5 3.5 3.5 0 0 0 12 8.5zM21 13.6v-3.2l-2.5-.5a7 7 0 0 0-.7-1.7l1.4-2.2-2.3-2.3-2.2 1.4a7 7 0 0 0-1.7-.7L12.5 2h-3.2l-.5 2.5a7 7 0 0 0-1.7.7L4.9 3.8 2.6 6.1 4 8.3a7 7 0 0 0-.7 1.7L1 10.5v3.2l2.5.5c.2.6.4 1.2.7 1.7l-1.4 2.2 2.3 2.3 2.2-1.4c.5.3 1.1.5 1.7.7l.5 2.5h3.2l.5-2.5a7 7 0 0 0 1.7-.7l2.2 1.4 2.3-2.3-1.4-2.2c.3-.5.5-1.1.7-1.7l2.3-.6z',
};
const STROKE = new Set(['sliders', 'gauge', 'camera', 'sun', 'food', 'car', 'suv', 'bike', 'bus', 'ship', 'settings']);

export function Icon({ name, size = 22, className = '', style }) {
  const d = P[name] || P.pin;
  const stroke = STROKE.has(name);
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} className={className} style={style} aria-hidden="true"
      fill={stroke ? 'none' : 'currentColor'} stroke={stroke ? 'currentColor' : 'none'} strokeWidth={stroke ? 1.7 : 0} strokeLinecap="round" strokeLinejoin="round">
      <path d={d} />
    </svg>
  );
}
export const VEHICLE_ICON = { car: 'car', suv: 'suv', bike: 'bike', bus: 'bus', truck: 'truck', plane: 'plane' };
export function maneuverIcon(m) {
  if (!m) return 'straight';
  if (m.type === 'roundabout') return 'roundabout';
  if (m.type === 'arrive') return 'flag';
  if (m.type === 'depart') return 'route';
  const mod = m.modifier || '';
  if (mod.includes('uturn')) return 'uturn';
  if (mod.includes('left')) return 'left';
  if (mod.includes('right')) return 'right';
  return 'straight';
}
