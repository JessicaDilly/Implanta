// Vista 3D (MapLibre GL, carregado só quando usado)
let map3d = null;
function loadScript(src) { return new Promise((res, rej) => { const s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
function loadCss(href) { const l = document.createElement('link'); l.rel = 'stylesheet'; l.href = href; document.head.appendChild(l); }
function luz3D() {
  if (!map3d) return;
  let az = 210, alt = 45;
  let noite = false;
  try { const c = solCenter(), s = sunPos(solDate(), c.lat, c.lng); if (s.alt > 5) { az = s.az; alt = s.alt; } else noite = solOn && s.alt <= .5; } catch (e) {}
  map3d.setLight({anchor: 'map', color: '#ffffff', intensity: .45, position: [1.4, az, 90 - alt]});
  Q3D.sol = {az, alt, noite}; Q3D.sombraSuja = true; // o mesmo sol ilumina e projeta as sombras do modelo das quadras
}
async function open3D() {
  if (!window.maplibregl) {
    msg('Carregando a vista 3D…');
    loadCss('https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.css');
    try { await loadScript('https://unpkg.com/maplibre-gl@5.24.1/dist/maplibre-gl.js'); } catch (e) { msg('Não foi possível carregar a vista 3D. Verifique a conexão.'); return; }
  }
  await q3dCarrega(); // Three.js para o modelo das quadras; se não carregar, o 3D segue com os volumes simples
  registraDem3D();
  if (lot) { try { await terrCompute(); } catch (e) {} }
  $('map3d').hidden = false; document.body.classList.add('v3d');
  const c = lot ? turf.centroid(lot.feat).geometry.coordinates : [map.getCenter().lng, map.getCenter().lat];
  if (!map3d) {
    map3d = new maplibregl.Map({
      container: 'map3d-canvas', center: c, zoom: map.getZoom() - 1, pitch: 60, bearing: -20, maxPitch: 80, attributionControl: {compact: true},
      maxZoom: 24, canvasContextAttributes: {antialias: true}, // zoom alto para a câmera no chão; antialias para postes e linhas finas
      style: estilo3D(c)
    });
    map3d.addControl(new maplibregl.NavigationControl({visualizePitch: true}), 'top-right');
    map3d.on('load', () => { map3d.addImage('grao', graoChao()); luz3D(); medPrepara(); q3dCamada(); aplicaCamadas3D(); if (solOn) drawSun(); });
    map3d.on('resize', () => { if (WALK.on) walkFov(); });
  } else {
    if (map3d.isStyleLoaded()) q3dCamada();
    map3d.getSource('estudo').setData(studyGeoJSON()); atualizaDem3D();
    map3d.setFilter('predios', filtroPredios(c));
    map3d.jumpTo({center: c, zoom: map.getZoom() - 1});
    map3d.resize();
  }
  $('v3d-exag').oninput = () => { if (CAM3D.relevo) map3d.setTerrain({source: 'dem', exaggeration: +$('v3d-exag').value}); };
  if (map3d.loaded()) luz3D();
  document.querySelectorAll('#v3d-lod [data-lod]').forEach(b => { b.classList.toggle('on', b.dataset.lod === LOD3D); b.onclick = () => { LOD3D = b.dataset.lod; document.querySelectorAll('#v3d-lod [data-lod]').forEach(x => x.classList.toggle('on', x === b)); map3d.getSource('estudo').setData(studyGeoJSON()); }; });
}
// Prédios do entorno no 3D só num raio de 1 km do lote (para não pesar). Perto do lote (200 m) valem os vizinhos do estudo solar.
const RAIO_3D = 1000;
function filtroPredios(c) {
  const d = ['distance', {type: 'Point', coordinates: c}], perto = VIZ.on && VIZ.list.length ? 200 : 0;
  return perto ? ['all', ['<', d, RAIO_3D], ['>=', d, perto]] : ['<', d, RAIO_3D];
}
function atualizaPredios3D() { if (!map3d) return; const c = lot ? turf.centroid(lot.feat).geometry.coordinates : [map.getCenter().lng, map.getCenter().lat]; map3d.setFilter('predios', filtroPredios(c)); }
function sync3DSol(leve, forte) {
  Q3D.estudo = solVisible() && (leve || forte) ? {leve, forte} : null; Q3D.estudoSujo = true; // as mesmas sombras vão por cima do piso das quadras em Three.js
  if (!map3d || !map3d.getSource('sombras')) return;
  const F = [];
  [[leve, .18], [forte, .42]].forEach(([g, op]) => { if (g) F.push({type: 'Feature', properties: {op}, geometry: g.geometry}); });
  map3d.getSource('sombras').setData({type: 'FeatureCollection', features: solVisible() ? F : []}); luz3D();
}
$('v3d-sol').onclick = () => { setSol(!solOn); $('v3d-sol').classList.toggle('on-sol', solOn); };
function close3D() { if (WALK.on) walkSai(); if (MED.on) medToggle(false); $('v3d-cam').hidden = true; $('map3d').hidden = true; document.body.classList.remove('v3d'); }
