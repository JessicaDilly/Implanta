// ---------- Geometria ----------
// Retângulo w × h (m) centrado em (lat,lng), girado ang graus no sentido anti-horário. Anel fechado [[lng,lat],...]
function rotRing(lat, lng, w, h, ang) {
  const a = ang * Math.PI / 180, c = Math.cos(a), s = Math.sin(a);
  const kx = 1 / (R * Math.cos(lat * Math.PI / 180));
  const ring = [[-w/2, -h/2], [w/2, -h/2], [w/2, h/2], [-w/2, h/2]].map(([x, y]) => [lng + (x * c - y * s) * kx, lat + (x * s + y * c) / R]);
  ring.push(ring[0]);
  return ring;
}
const ll = ring => ring.map(p => [p[1], p[0]]);
const polyFeat = ring => turf.polygon([ring]);
function polysOf(f) {
  if (!f) return [];
  return f.geometry.type === 'Polygon' ? [f.geometry.coordinates[0]] : f.geometry.coordinates.map(c => c[0]);
}
function largestPoly(f) {
  if (f.geometry.type === 'Polygon') return f;
  let best = null, ba = -1;
  f.geometry.coordinates.forEach(c => { const p = turf.polygon(c), a = turf.area(p); if (a > ba) { ba = a; best = p; } });
  return best;
}
function fits(ring) {
  if (!buildable) return false;
  try { return turf.booleanWithin(polyFeat(ring), largestPoly(buildable)); } catch (e) { return false; }
}
function dims(b) {
  const a = b.angle * Math.PI / 180, c = Math.abs(Math.cos(a)), s = Math.abs(Math.sin(a));
  return [b.w * c + b.h * s, b.w * s + b.h * c];
}
function bounds(b) {
  const [W, H] = dims(b), kx = 1 / (R * Math.cos(b.lat * Math.PI / 180));
  return L.latLngBounds([b.lat - H / 2 / R, b.lng - W / 2 * kx], [b.lat + H / 2 / R, b.lng + W / 2 * kx]);
}
