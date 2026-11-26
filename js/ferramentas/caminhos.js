// ---------- Caminhos (carro e pedestre) ----------
var caminhos = [];
map.createPane('caminhos').style.zIndex = 415;
const camLayer = L.layerGroup().addTo(map), camTmp = L.layerGroup().addTo(map);
const CAM = {tipo: 'carro', pts: []};
const CAM_PADRAO = {carro: 6, pedestre: 1.5};
function camPoly(c) {
  try { return turf.buffer(turf.lineString(c.pts.map(p => [p[1], p[0]])), c.w / 2, {units: 'meters', steps: 6}); } catch (e) { return null; }
}
function drawCaminhos() {
  camLayer.clearLayers();
  caminhos.forEach((c, i) => {
    const pg = camPoly(c); if (!pg) return;
    const carro = c.tipo === 'carro';
    L.geoJSON(pg, {pane: 'caminhos', interactive: false, style: carro
      ? {color: '#f4f4f4', weight: 1.5, fillColor: '#4a4f55', fillOpacity: .95}
      : {color: '#b8a57f', weight: 1, dashArray: '3 3', fillColor: '#ddd0b2', fillOpacity: .95}}).addTo(camLayer);
    if (carro) L.polyline(c.pts, {pane: 'caminhos', interactive: false, color: '#ffd54f', weight: 2, dashArray: '10 8'}).addTo(camLayer);
  });
  renderCamLista();
}
function renderCamLista() {
  const el = $('cam-lista'); if (!el) return;
  if (!caminhos.length) { el.textContent = 'Nenhum caminho ainda.'; return; }
  el.innerHTML = '';
  caminhos.forEach((c, i) => {
    const comp = turf.length(turf.lineString(c.pts.map(p => [p[1], p[0]])), {units: 'meters'});
    const r = document.createElement('div'); r.className = 'cam-item';
    r.innerHTML = `<span class="dot" style="background:${c.tipo === 'carro' ? '#4a4f55' : '#ddd0b2'}"></span><span>${c.tipo === 'carro' ? 'Carro' : 'Pedestre'} · ${fmt(comp)} m × ${fmt(c.w)} m · ${fmt(comp * c.w)} m²</span>`;
    const x = document.createElement('button'); x.className = 'xbtn'; x.textContent = '×'; x.title = 'Apagar este caminho';
    x.onclick = () => { caminhos.splice(i, 1); drawCaminhos(); updateAll(); commit(); };
    r.appendChild(x); el.appendChild(r);
  });
}
function camPreview() {
  camTmp.clearLayers();
  if (!CAM.pts.length) return;
  CAM.pts.forEach(p => L.circleMarker(p, {pane: 'outlines', radius: 5, color: '#fff', weight: 2, fillColor: '#C8202F', fillOpacity: 1}).addTo(camTmp));
  if (CAM.pts.length > 1) L.polyline(CAM.pts, {pane: 'outlines', color: '#C8202F', weight: 3, dashArray: '6 5'}).addTo(camTmp);
}
function camPonto(ll) { CAM.pts.push([+ll.lat.toFixed(8), +ll.lng.toFixed(8)]); camPreview(); }
function camFim() {
  if (CAM.pts.length < 2) { msg('Marque pelo menos dois pontos para o caminho.'); return; }
  caminhos.push({tipo: CAM.tipo, w: Math.max(.8, num('cam-w')), pts: CAM.pts.slice()});
  CAM.pts = []; camPreview(); drawCaminhos(); updateAll(); commit();
  msg('Caminho criado. Marque outro ou feche o painel.');
}
document.querySelectorAll('#cam-tipos [data-cam]').forEach(b => { b.onclick = () => {
  CAM.tipo = b.dataset.cam; $('cam-w').value = CAM_PADRAO[CAM.tipo];
  document.querySelectorAll('#cam-tipos [data-cam]').forEach(x => x.classList.toggle('on', x === b));
}; });
$('cam-desf').onclick = () => { CAM.pts.pop(); camPreview(); };
$('cam-fim').onclick = camFim;
