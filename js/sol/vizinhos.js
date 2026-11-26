// ---------- Edificações vizinhas (OpenStreetMap) para o estudo solar e o 3D ----------
// Altura: tag height, ou building:levels × 3 m, ou 6 m quando o mapa não informa.
var VIZ = {on: true, list: [], key: '', busy: false};
const vizLayer = L.layerGroup();
const sombreadores = () => VIZ.on ? blocks.concat(VIZ.list) : blocks;
function vizAltura(t) {
  const h = parseFloat(String(t.height || '').replace(',', '.')); if (h > 0) return Math.min(h, 300);
  const n = parseFloat(t['building:levels']); if (n > 0) return n * 3 + (parseFloat(t['roof:levels']) || 0) * 2;
  return 6;
}
async function carregaVizinhos() {
  if (!VIZ.on || VIZ.busy) return;
  const c = solCenter(), key = c.lat.toFixed(4) + ',' + c.lng.toFixed(4);
  if (key === VIZ.key) { drawVizinhos(); return; }
  VIZ.busy = true;
  try {
    const q = `[out:json][timeout:25];(way["building"](around:200,${c.lat},${c.lng}););out geom tags;`;
    let r = null; // tenta o servidor principal e, se falhar, os espelhos
    msg('Buscando as edificações vizinhas… (pode levar alguns segundos)');
    for (const [url, ms] of [['https://overpass-api.de/api/interpreter', 45000], ['https://overpass.private.coffee/api/interpreter', 20000], ['https://overpass.kumi.systems/api/interpreter', 20000]]) {
      const ac = new AbortController(), to = setTimeout(() => ac.abort(), ms); // servidor lento: passa para o próximo
      try { r = await fetch(url, {method: 'POST', signal: ac.signal, body: 'data=' + encodeURIComponent(q), headers: {'Content-Type': 'application/x-www-form-urlencoded'}}); clearTimeout(to); if (r.ok) break; r = null; } catch (e) { clearTimeout(to); r = null; }
    }
    if (!r) throw new Error('rede');
    if (!r.ok) throw new Error(r.status);
    const js = await r.json();
    VIZ.list = (js.elements || []).filter(e => e.geometry && e.geometry.length > 3).map(e => {
      const ring = e.geometry.map(p => [p.lon, p.lat]); if (ring[0].join() !== ring[ring.length - 1].join()) ring.push(ring[0]);
      const ct = turf.centroid(turf.polygon([ring])).geometry.coordinates;
      return {viz: true, id: 'viz' + e.id, ring, lng: ct[0], lat: ct[1], h: vizAltura(e.tags || {}), alt0: !(e.tags && (e.tags.height || e.tags['building:levels']))};
    }).filter(v => !(lot && turf.booleanPointInPolygon([v.lng, v.lat], lot.feat))); // o que está dentro do lote é o próprio projeto
    VIZ.key = key;
    msg(VIZ.list.length ? `${VIZ.list.length} edificações vizinhas entraram no estudo de insolação.` : 'Nenhuma edificação vizinha encontrada no mapa colaborativo.');
  } catch (e) { msg('Não foi possível buscar as edificações vizinhas agora.'); }
  VIZ.busy = false;
  drawVizinhos(); if (solOn) drawSun();
  if (map3d && !$('map3d').hidden) { map3d.getSource('estudo').setData(studyGeoJSON()); atualizaPredios3D(); }
}
function drawVizinhos() {
  vizLayer.clearLayers();
  if (!VIZ.on) { map.removeLayer(vizLayer); return; }
  VIZ.list.forEach(v => {
    const pg = L.polygon(v.ring.map(p => [p[1], p[0]]), {pane: 'caminhos', interactive: true, color: '#7b838c', weight: 1, fillColor: '#b9bfc6', fillOpacity: .55});
    pg.bindTooltip(() => `Vizinho · ${fmt(v.h)} m${v.alt0 ? ' (altura estimada)' : ''} · toque para ajustar`, {sticky: true});
    pg.bindPopup(() => `<div style="min-width:170px"><b>Edificação vizinha</b><br><label style="display:flex;align-items:center;gap:6px;margin-top:6px">Altura <input type="number" min="1" max="300" step="0.5" value="${v.h}" style="width:70px" class="viz-h"> m</label><small style="color:#777">${fmt(Math.round(v.h / 3))} pavimentos aprox.</small><br><button class="btn viz-ok" style="margin-top:6px;width:100%">Aplicar</button></div>`);
    pg.on('popupopen', e => {
      const el = e.popup.getElement(), inp = el.querySelector('.viz-h');
      el.querySelector('.viz-ok').onclick = () => {
        const h = parseFloat(inp.value); if (!(h > 0)) return;
        v.h = Math.min(300, h); v.alt0 = false; pg.closePopup();
        if (solOn) drawSun(); if (map3d && !$('map3d').hidden) map3d.getSource('estudo').setData(studyGeoJSON());
        msg(`Altura do vizinho ajustada para ${fmt(v.h)} m.`);
      };
    });
    pg.addTo(vizLayer);
  });
  vizLayer.addTo(map);
}
function sombraVizinho(v, s) {
  const [ox, oy] = shOffset(v, s, v.h), sh = hull(v.ring.concat(v.ring.map(([x, y]) => [x + ox, y + oy])));
  try { return turf.difference(sh, turf.polygon([v.ring])) || null; } catch (e) { return sh; }
}
