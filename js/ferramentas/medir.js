// ---------- Medir ----------
let mPend = null;
function addMeasure(latlng) {
  const dot = p => L.circleMarker(p, {pane: 'outlines', radius: 4, color: '#ff9800', fillOpacity: 1}).addTo(measureLayer);
  if (!mPend) { mPend = latlng; dot(latlng); return; }
  const d = map.distance(mPend, latlng);
  L.polyline([mPend, latlng], {pane: 'outlines', color: '#ff9800', weight: 2}).addTo(measureLayer)
    .bindTooltip(d.toFixed(2).replace('.', ',') + ' m', {permanent: true, direction: 'center', className: 'cota'});
  dot(latlng); mPend = null;
}
$('btn-limpar-medidas').onclick = () => { measureLayer.clearLayers(); mPend = null; };
