// ---------- Lote e recuos ----------
function setLot(ring, fronts) {
  try { lot = {ring, feat: polyFeat(ring), fronts: fronts || [0]}; } catch (e) { msg('Não foi possível criar o lote com esses pontos.'); return; }
  refreshLot(); commit();
  map.fitBounds(L.geoJSON(lot.feat).getBounds(), {padding: [60, 60]});
}
function bufSafe(f, r) {
  try { const b = turf.buffer(f, r, {units: 'meters'}); return (b && b.geometry && turf.area(b) > 0.01) ? b : null; } catch (e) { return null; }
}
// Divisas consecutivas com o mesmo recuo viram uma polilinha só (menos recortes)
function edgeRuns(ring, pick) {
  const n = ring.length - 1, runs = [];
  let start = -1;
  for (let k = 0; k <= n; k++) {
    const i = k % n, on = k < n && pick(i);
    if (on && start < 0) start = k;
    if (!on && start >= 0) { runs.push(ring.slice(start, k + 1)); start = -1; }
  }
  // junta a última com a primeira quando o trecho passa pelo vértice inicial
  if (runs.length > 1 && pick(0) && pick(n - 1)) { const a = runs.shift(), b = runs.pop(); runs.push(b.concat(a.slice(1))); }
  return runs;
}
// Área edificável: recuo de frente nas divisas com a rua e recuo das demais nas outras
function computeBuildable(ring, fronts, rf, rd) {
  const feat = polyFeat(ring), m = Math.min(rf, rd);
  let b = m > 0 ? bufSafe(feat, -m) : feat;
  if (!b || rf === rd) return b;
  const big = Math.max(rf, rd), frontBig = rf > rd;
  for (const run of edgeRuns(ring, i => fronts.includes(i) === frontBig)) {
    const strip = bufSafe(turf.lineString(run), big);
    if (!strip) continue;
    try { b = turf.difference(b, strip); } catch (e) {}
    if (!b || turf.area(b) < 0.5) return null;
  }
  return b;
}
function refreshLot() {
  lotLayer.clearLayers(); recLayer.clearLayers(); buildable = null;
  if (lot) {
    const paperBg = bg === 'paper';
    L.geoJSON(lot.feat, {pane: 'outlines', interactive: false, style: {color: paperBg ? '#c77700' : '#ffeb3b', weight: 3, fill: false}}).addTo(lotLayer);
    const fronts = lot.fronts || [0];
    edgeRuns(lot.ring, i => fronts.includes(i)).forEach(run =>
      L.polyline(ll(run), {pane: 'outlines', interactive: false, color: '#ff6d00', weight: 5, opacity: .9}).addTo(lotLayer));
    buildable = computeBuildable(lot.ring, fronts, num('recuo-f'), num('recuo'));
    if (buildable) L.geoJSON(buildable, {pane: 'outlines', interactive: false, style: {color: paperBg ? '#55606b' : '#ffffff', weight: 2, dashArray: '6 6', fill: false}}).addTo(recLayer);
    else msg('Os recuos são maiores que o lote. Não sobra área edificável.');
  }
  updateAll();
}
function loteResumo() {
  const el = $('lote-resumo'); if (!el) return;
  if (!lot) { el.textContent = 'Nenhum lote ainda.'; return; }
  const d = JSON.parse(snapshot()), m = computeMetrics(d, buildable || null);
  el.innerHTML = `Área <b>${fmt(m.lotA)} m²</b> · perímetro ${fmt(m.perim)} m · frente ${fmt(m.testada)} m<br>Área edificável após recuos: <b>${fmt(m.edA)} m²</b>`;
}
function addVertex(latlng) { vertices.push([latlng.lat, latlng.lng]); drawTmp(); }
function drawTmp() {
  tmpLayer.clearLayers();
  vertices.forEach(p => L.circleMarker(p, {pane: 'outlines', radius: 5, color: '#ffeb3b', fillOpacity: 1}).addTo(tmpLayer));
  if (vertices.length > 1) L.polyline(vertices, {pane: 'outlines', color: '#ffeb3b', dashArray: '4 4'}).addTo(tmpLayer);
}
