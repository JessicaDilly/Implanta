// ---------- Pincel (desenho livre, como no Concepts) ----------
const COLORS_BRUSH = ['#1d2329', '#ffffff', '#d32f2f', '#f57c00', '#fbc02d', '#2e7d32', '#1565c0', '#7b1fa2'];
const PRESETS = {caneta: [1, 1], lapis: [0.6, 0.85], marcador: [2.5, 0.45]};
let brush = 'caneta', bcolor = COLORS_BRUSH[0], drawing = null;
const mpp = () => 40075016.686 * Math.cos(map.getCenter().lat * Math.PI / 180) / Math.pow(2, map.getZoom() + 8);
const strokeStyle = s => ({pane: 'sketch', color: s.color, weight: Math.max(0.5, s.wM / mpp()), opacity: s.op,
                           lineCap: s.brush === 'marcador' ? 'butt' : 'round', lineJoin: 'round', interactive: false});
function drawStroke(s) { s.line = L.polyline(s.pts, strokeStyle(s)).addTo(sketchLayer); }
map.on('zoomend', () => { strokes.forEach(s => s.line && s.line.setStyle({weight: Math.max(0.5, s.wM / mpp())})); placeHandles(); });
COLORS_BRUSH.forEach(c => {
  const b = document.createElement('button'); b.className = 'sw' + (c === bcolor ? ' on' : ''); b.style.background = c; b.title = c;
  b.onclick = () => { bcolor = c; document.querySelectorAll('.sw').forEach(x => x.classList.toggle('on', x === b)); };
  $('swatches').appendChild(b);
});
document.querySelectorAll('[data-brush]').forEach(b => {
  b.onclick = () => { brush = b.dataset.brush; document.querySelectorAll('[data-brush]').forEach(x => x.classList.toggle('on', x === b)); };
});
$('bsize').addEventListener('input', () => { $('bsize-v').textContent = $('bsize').value; });
$('bop').addEventListener('input', () => { $('bop-v').textContent = $('bop').value; });
const pointers = new Set();
function cancelDraw() { if (drawing && drawing.line) drawing.line.remove(); drawing = null; }
function eraseAt(e) {
  const r = mc.getBoundingClientRect(), P = L.point(e.clientX - r.left, e.clientY - r.top);
  strokes = strokes.filter(s => {
    const pts = s.pts.map(p => map.latLngToContainerPoint(p)), tol = 12 + (s.line ? s.line.options.weight / 2 : 0);
    for (let i = 0; i < pts.length - 1; i++) if (L.LineUtil.pointToSegmentDistance(P, pts[i], pts[i + 1]) < tol) { if (s.line) s.line.remove(); drawing.changed = true; return false; }
    return true;
  });
}
mc.addEventListener('pointerdown', e => {
  pointers.add(e.pointerId);
  if (tool !== 'pincel' || e.target.closest('.leaflet-control')) return;
  if (pointers.size > 1) { cancelDraw(); return; }
  if (brush === 'borracha') { drawing = {erase: true}; eraseAt(e); return; }
  const rs = guide === 'livre' ? reguaSnap(e, 0) : null;
  const ll = guide === 'livre' ? (rs ? rs.ll : map.mouseEventToLatLng(e)) : snapLL(e, null), pr = PRESETS[brush];
  drawing = {pts: [[ll.lat, ll.lng]], last: [e.clientX, e.clientY], color: bcolor, brush, guide, a: ll, edge: rs ? rs.edge : 0,
             wM: Math.max(1, num('bsize') * pr[0]) * mpp(), op: num('bop') / 100 * pr[1]};
  drawing.line = L.polyline(drawing.pts, strokeStyle(drawing)).addTo(sketchLayer);
}, {capture: true});
mc.addEventListener('pointermove', e => {
  if (!drawing || pointers.size > 1) return;
  if (drawing.erase) { eraseAt(e); return; }
  if (drawing.guide !== 'livre') { guideMove(e); return; }
  const dx = e.clientX - drawing.last[0], dy = e.clientY - drawing.last[1];
  if (dx * dx + dy * dy < 4) return;
  drawing.last = [e.clientX, e.clientY];
  const rr = drawing.edge ? reguaSnap(e, drawing.edge) : null, ll = rr ? rr.ll : map.mouseEventToLatLng(e);
  drawing.pts.push([ll.lat, ll.lng]); drawing.line.addLatLng(ll);
}, {capture: true});
const endDraw = e => {
  pointers.delete(e.pointerId);
  if (!drawing) return;
  const s = drawing; drawing = null;
  if (s.erase) { if (s.changed) commit(); return; }
  drawLbl.remove(); snapDot.remove();
  if (s.guide !== 'livre' && s.pts.length < 2) { s.line.remove(); return; }
  const cotar = s.guide === 'regua' && $('g-cota').checked ? [s.pts[0], s.pts[1]] : null;
  s.line.remove(); delete s.last; delete s.line; delete s.a; delete s.guide; delete s.edge;
  if (s.pts.length < 2) s.pts.push([s.pts[0][0] + 1e-7, s.pts[0][1] + 1e-7]);
  s.pts = s.pts.map(p => [+p[0].toFixed(8), +p[1].toFixed(8)]);
  strokes.push(s); drawStroke(s); lastHit = Date.now();
  if (cotar) { mPend = null; addMeasure(L.latLng(cotar[0])); addMeasure(L.latLng(cotar[1])); }
  commit();
};
