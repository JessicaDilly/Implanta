// Guias do pincel (como a régua do Concepts): linha reta, retângulo e círculo, com ímã de ângulo e de cantos
let guide = 'livre';
const drawLbl = L.marker([0, 0], {interactive: false, keyboard: false, icon: L.divIcon({className: 'dim-lbl', html: '', iconSize: [140, 22], iconAnchor: [70, 34]})});
const snapDot = L.circleMarker([0, 0], {pane: 'sketch', radius: 7, color: '#ff6d00', weight: 2.5, fill: false, interactive: false});
document.querySelectorAll('[data-guide]').forEach(b => {
  b.onclick = () => { guide = b.dataset.guide; document.querySelectorAll('[data-guide]').forEach(x => x.classList.toggle('on', x === b)); };
});
function snapLL(e, from) {
  let ll = map.mouseEventToLatLng(e);
  snapDot.remove();
  if ($('g-snap').checked) {
    const P = map.mouseEventToContainerPoint(e), cands = [];
    if (lot) lot.ring.forEach(p => cands.push([p[1], p[0]]));
    blocks.forEach(b => (b.ring || []).forEach(p => cands.push([p[1], p[0]])));
    strokes.forEach(s => { cands.push(s.pts[0]); cands.push(s.pts[s.pts.length - 1]); });
    let best = null, bd = 14;
    cands.forEach(c => { const d = map.latLngToContainerPoint(c).distanceTo(P); if (d < bd) { bd = d; best = c; } });
    if (best) { snapDot.setLatLng(best).addTo(map); return L.latLng(best); }
  }
  if (from && ($('g-ang').checked || e.shiftKey)) {
    const kx = R * Math.cos(from.lat * Math.PI / 180), dx = (ll.lng - from.lng) * kx, dy = (ll.lat - from.lat) * R;
    const d = Math.hypot(dx, dy), a = Math.round(Math.atan2(dy, dx) / (Math.PI / 12)) * (Math.PI / 12);
    ll = L.latLng(from.lat + d * Math.sin(a) / R, from.lng + d * Math.cos(a) / kx);
  }
  return ll;
}
function guideMove(e) {
  const d = drawing, A = d.a, B = snapLL(e, d.guide === 'regua' ? A : null), kx = R * Math.cos(A.lat * Math.PI / 180);
  const dx = (B.lng - A.lng) * kx, dy = (B.lat - A.lat) * R;
  let txt = '';
  if (d.guide === 'regua') { d.pts = [[A.lat, A.lng], [B.lat, B.lng]]; txt = fmt(Math.hypot(dx, dy)) + ' m · ' + Math.round((Math.atan2(dx, dy) * 180 / Math.PI + 360) % 360) + '° N'; }
  if (d.guide === 'ret') { d.pts = [[A.lat, A.lng], [A.lat, B.lng], [B.lat, B.lng], [B.lat, A.lng], [A.lat, A.lng]]; txt = fmt(Math.abs(dx)) + ' × ' + fmt(Math.abs(dy)) + ' m'; }
  if (d.guide === 'circ') {
    const r = Math.hypot(dx, dy), pts = [];
    for (let k = 0; k <= 48; k++) { const t = k / 48 * 2 * Math.PI; pts.push([A.lat + r * Math.sin(t) / R, A.lng + r * Math.cos(t) / kx]); }
    d.pts = pts; txt = 'Ø ' + fmt(2 * r) + ' m';
  }
  d.line.setLatLngs(d.pts);
  drawLbl.setLatLng(B).addTo(map); const el = drawLbl.getElement(); if (el) el.innerHTML = `<span>${txt}</span>`;
}
mc.addEventListener('pointerup', endDraw, {capture: true});
mc.addEventListener('pointercancel', e => { pointers.delete(e.pointerId); cancelDraw(); }, {capture: true});
$('btn-limpar-desenho').onclick = () => { sketchLayer.clearLayers(); strokes = []; commit(); msg('Desenhos apagados. Dá para voltar com Desfazer.'); };
