// ---------- Estudo solar (norte verdadeiro) ----------
var solOn = false, solCourtsHtml = '';
let solTimer = null;
map.createPane('shadows').style.zIndex = 430; map.getPane('shadows').style.pointerEvents = 'none';
map.createPane('sun').style.zIndex = 455; map.getPane('sun').style.pointerEvents = 'none';
const sunLayer = L.layerGroup(), shadowLayer = L.layerGroup();
// Posição do sol (algoritmo do SunCalc/NOAA simplificado): azimute a partir do norte verdadeiro, sentido horário
function sunPos(date, lat, lng) {
  const rad = Math.PI / 180, d = date.valueOf() / 864e5 - 0.5 + 2440588 - 2451545;
  const M = rad * (357.5291 + 0.98560028 * d);
  const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
  const Lm = M + C + rad * 102.9372 + Math.PI, e = rad * 23.4397;
  const dec = Math.asin(Math.sin(e) * Math.sin(Lm)), ra = Math.atan2(Math.sin(Lm) * Math.cos(e), Math.cos(Lm));
  const phi = lat * rad, H = rad * (280.16 + 360.9856235 * d) + lng * rad - ra;
  const alt = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(H));
  const az = Math.atan2(Math.sin(H), Math.cos(H) * Math.sin(phi) - Math.tan(dec) * Math.cos(phi));
  return {alt: alt / rad, az: ((az / rad + 180) % 360 + 360) % 360};
}
const RUMOS = ['N', 'NNE', 'NE', 'ENE', 'L', 'ESE', 'SE', 'SSE', 'S', 'SSO', 'SO', 'OSO', 'O', 'ONO', 'NO', 'NNO'];
const rumo = az => RUMOS[Math.round(az / 22.5) % 16];
const hhmm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(Math.round(m % 60)).padStart(2, '0');
function solDate(min) {
  const [y, mo, d] = ($('sol-data').value || '').split('-').map(Number);
  const m = min ?? +$('sol-hora').value;
  const base = y ? new Date(y, mo - 1, d) : new Date();
  return new Date(base.getFullYear(), base.getMonth(), base.getDate(), Math.floor(m / 60), m % 60);
}
function solCenter() {
  if (lot) { const c = turf.centroid(lot.feat).geometry.coordinates; return {lat: c[1], lng: c[0]}; }
  const c = map.getCenter(); return {lat: c.lat, lng: c.lng};
}
const offLL = (c, dx, dy) => [c.lat + dy / R, c.lng + dx / (R * Math.cos(c.lat * Math.PI / 180))];
function dayScan(c) {
  const pts = [];
  for (let m = 0; m <= 1440; m += 5) pts.push({m, ...sunPos(solDate(m), c.lat, c.lng)});
  const up = pts.filter(p => p.alt > -0.833);
  return {pts, rise: up[0], set: up[up.length - 1]};
}
function sunLabel(latlng, text, cls) {
  return L.marker(latlng, {pane: 'sun', interactive: false, keyboard: false,
    icon: L.divIcon({className: 'sun-lbl ' + (cls || ''), html: text, iconSize: [44, 16], iconAnchor: [22, 8]})});
}
