// ---------- Ferramentas do 3D: camadas, medir e imagem ----------
const CAM3D = {proj: true, arvore: true, viz: true, entorno: true, sombra: true, relevo: true, chao: true};
const FILTRO3D = {piso: ['==', ['get', 't'], 'piso'], linhas: ['==', ['get', 't'], 'linha'], ext: ['==', ['get', 't'], 'ext'], vidro: ['==', ['get', 't'], 'vidro']};
function aplicaCamadas3D() {
  if (!map3d || !map3d.getLayer('ext')) return;
  const ocultos = ['proj', 'arvore', 'viz'].filter(k => !CAM3D[k]);
  Object.entries(FILTRO3D).forEach(([id, f]) => map3d.setFilter(id, ocultos.length ? ['all', f, ['!', ['in', ['get', 'g'], ['literal', ocultos]]]] : f));
  map3d.setLayoutProperty('predios', 'visibility', CAM3D.entorno ? 'visible' : 'none');
  map3d.setLayoutProperty('sombra', 'visibility', CAM3D.sombra ? 'visible' : 'none');
  chao3D();
  map3d.setTerrain(CAM3D.relevo ? {source: 'dem', exaggeration: +$('v3d-exag').value} : null);
  Q3D.dirty = true; map3d.triggerRepaint(); // o modelo das quadras segue as mesmas camadas
}
document.querySelectorAll('#v3d-cam input[data-c]').forEach(i => i.onchange = () => { CAM3D[i.dataset.c] = i.checked; aplicaCamadas3D(); });
$('v3d-cam-btn').onclick = () => { $('v3d-cam').hidden = !$('v3d-cam').hidden; };
// Medir: dois toques dão a distância, o desnível e a inclinação. Sem medir, tocar num volume mostra a altura.
const MED = {on: false, pts: [], marks: []};
function altTerreno3D(ll) { try { return map3d.terrain ? map3d.terrain.getElevationForLngLatZoom(maplibregl.LngLat.convert(ll), 17) : 0; } catch (e) { return 0; } }
function medLimpa() {
  MED.pts = []; MED.marks.forEach(m => m.remove()); MED.marks = [];
  if (map3d && map3d.getSource('medida')) map3d.getSource('medida').setData({type: 'FeatureCollection', features: []});
}
function medToggle(on) {
  MED.on = on ?? !MED.on; $('v3d-med').classList.toggle('on-sol', MED.on);
  if (!MED.on) medLimpa(); else msg('Toque no ponto inicial e depois no ponto final da medida.');
  map3d.getCanvas().style.cursor = MED.on ? 'crosshair' : '';
}
function medEl(txt, cls) { const d = document.createElement('div'); d.className = cls; d.innerHTML = txt; return d; }
function medClique(e) {
  if (!MED.on) { // informação do volume tocado
    const f = map3d.queryRenderedFeatures(e.point, {layers: ['ext', 'predios'].filter(id => map3d.getLayer(id))})[0];
    if (!f) return;
    const p = f.properties, h = f.layer.id === 'predios' ? (p.render_height || 6) : (p.h || p.top);
    const nome = f.layer.id === 'predios' ? 'Edificação do entorno' : (p.n || 'Elemento');
    new maplibregl.Popup({closeButton: true, maxWidth: '220px'}).setLngLat(e.lngLat).setHTML(`<b>${esc(String(nome))}</b><br>Altura: <b>${fmt(+h)} m</b>${f.layer.id === 'predios' && !p.render_height ? ' (estimada)' : ''}`).addTo(map3d);
    return;
  }
  if (MED.pts.length === 2) medLimpa();
  const ll = [e.lngLat.lng, e.lngLat.lat], z = altTerreno3D(ll);
  MED.pts.push({ll, z});
  MED.marks.push(new maplibregl.Marker({element: medEl('', 'med-pt')}).setLngLat(ll).addTo(map3d));
  if (MED.pts.length < 2) return;
  const [A, B] = MED.pts, d = turf.distance(A.ll, B.ll, {units: 'meters'}), dz = B.z - A.z;
  map3d.getSource('medida').setData({type: 'FeatureCollection', features: [{type: 'Feature', properties: {}, geometry: {type: 'LineString', coordinates: [A.ll, B.ll]}}]});
  const meio = [(A.ll[0] + B.ll[0]) / 2, (A.ll[1] + B.ll[1]) / 2];
  MED.marks.push(new maplibregl.Marker({element: medEl(`<b>${fmt(d)} m</b><br>desnível ${fmt(dz)} m · ${fmt(d ? Math.abs(dz) / d * 100 : 0)}%`, 'med-lbl')}).setLngLat(meio).addTo(map3d));
}
function medPrepara() {
  if (map3d.getSource('medida')) return;
  map3d.addSource('medida', {type: 'geojson', data: {type: 'FeatureCollection', features: []}});
  map3d.addLayer({id: 'medida', type: 'line', source: 'medida', paint: {'line-color': '#C8202F', 'line-width': 3, 'line-dasharray': [2, 1]}});
  map3d.on('click', medClique);
}
$('v3d-med').onclick = () => medToggle();
// Imagem: salva a vista 3D em PNG com a faixa da marca
function imagem3D() {
  if (!map3d) return;
  map3d.once('render', () => {
    const src = map3d.getCanvas(), W = src.width, H = src.height, fx = Math.round(Math.max(36, H * .06));
    const cv = document.createElement('canvas'); cv.width = W; cv.height = H + fx;
    const g = cv.getContext('2d'); g.drawImage(src, 0, 0);
    g.fillStyle = '#ffffff'; g.fillRect(0, H, W, fx);
    g.fillStyle = '#C8202F'; g.fillRect(0, H, Math.round(fx * .18), fx);
    const fs = Math.round(fx * .42); g.textBaseline = 'middle';
    g.font = `800 ${fs}px Nunito, system-ui, sans-serif`; g.fillText('implanta', fx * .45, H + fx / 2);
    const agora = new Date(), dt = agora.toLocaleDateString('pt-BR') + ' ' + agora.toLocaleTimeString('pt-BR', {hour: '2-digit', minute: '2-digit'});
    g.fillStyle = '#5c6670'; g.font = `600 ${Math.round(fs * .72)}px Nunito, system-ui, sans-serif`; g.textAlign = 'right';
    g.fillText('Vista 3D do estudo de implantação' + (solOn ? ' · sol de ' + $('sol-data').value.split('-').reverse().join('/') + ' às ' + hhmm(+$('sol-hora').value) : '') + ' · ' + dt, W - fx * .45, H + fx / 2);
    cv.toBlob(b => {
      const a = document.createElement('a'); a.href = URL.createObjectURL(b);
      const p2 = n => String(n).padStart(2, '0');
      a.download = `implanta-3d-${agora.getFullYear()}${p2(agora.getMonth() + 1)}${p2(agora.getDate())}-${p2(agora.getHours())}${p2(agora.getMinutes())}.png`;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      msg('Imagem da vista 3D salva.');
    }, 'image/png');
  });
  map3d.triggerRepaint();
}
$('v3d-img').onclick = imagem3D;
