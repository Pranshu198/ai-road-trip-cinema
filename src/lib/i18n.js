// i18n.js — Hinglish (default) / English / Hindi strings for main controls.
export const STRINGS = {
  hinglish: {
    start: 'START JOURNEY', from: 'Kahan se (Start)', to: 'Kahan tak (Destination)', addStop: 'Stop jodo',
    pause: 'Pause', resume: 'Chalu karo', restart: 'Restart', speed: 'Speed', zoom: 'Zoom', zoomLock: 'Zoom Lock',
    camera: 'Camera', theme: 'Theme', vehicle: 'Gaadi', cinema: 'Cinema', controls: 'Controls', video: 'Video',
    journey: 'Journey', stops: 'Stops', more: 'More', seek: 'Aage-peeche', voice: 'Voice Guide', lang: 'Bhasha',
    warp: 'Warp', follow: 'Follow Cam', download: 'Download', makeVideo: 'Video Banao', duration: 'Video kitni lambi?',
    stats: 'Trip ke aankde', itinerary: 'Din-wise plan', elevation: 'Unchai (Elevation)', loading: 'Route ban raha hai...',
    arrived: 'Manzil aa gayi!', day: 'Din', nightStay: 'Raat ka stay', totalKm: 'Kul doori', countries: 'Desh',
  },
  english: {
    start: 'START JOURNEY', from: 'From (Start)', to: 'To (Destination)', addStop: 'Add stop',
    pause: 'Pause', resume: 'Resume', restart: 'Restart', speed: 'Speed', zoom: 'Zoom', zoomLock: 'Zoom Lock',
    camera: 'Camera', theme: 'Theme', vehicle: 'Vehicle', cinema: 'Cinema', controls: 'Controls', video: 'Video',
    journey: 'Journey', stops: 'Stops', more: 'More', seek: 'Seek', voice: 'Voice Guide', lang: 'Language',
    warp: 'Warp', follow: 'Follow Cam', download: 'Download', makeVideo: 'Make Video', duration: 'Video length?',
    stats: 'Trip stats', itinerary: 'Day-wise itinerary', elevation: 'Elevation profile', loading: 'Building route...',
    arrived: 'Destination reached!', day: 'Day', nightStay: 'Night stay', totalKm: 'Total distance', countries: 'Countries',
  },
  hindi: {
    start: 'YATRA SHURU KARO', from: 'Kahan se (Shuruaat)', to: 'Kahan tak (Manzil)', addStop: 'Padav jodein',
    pause: 'Rokein', resume: 'Chalu karein', restart: 'Phir se shuru', speed: 'Gati', zoom: 'Zoom', zoomLock: 'Zoom Lock',
    camera: 'Camera', theme: 'Theme', vehicle: 'Vaahan', cinema: 'Cinema', controls: 'Controls', video: 'Video',
    journey: 'Yatra', stops: 'Padav', more: 'Aur', seek: 'Aage-peeche', voice: 'Aawaz Guide', lang: 'Bhasha',
    warp: 'Warp', follow: 'Follow Cam', download: 'Download', makeVideo: 'Video Banayein', duration: 'Video kitni lambi?',
    stats: 'Yatra ke aankde', itinerary: 'Din ke hisaab se plan', elevation: 'Unchai', loading: 'Raasta ban raha hai...',
    arrived: 'Manzil aa gayi!', day: 'Din', nightStay: 'Raat ka padav', totalKm: 'Kul doori', countries: 'Desh',
  },
};
export const t = (lang, key) => (STRINGS[lang] || STRINGS.hinglish)[key] || key;
