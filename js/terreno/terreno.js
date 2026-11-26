// ---------- Terreno (Fase B): elevação, declividade, curvas, perfil, plataformas ----------
// Fonte: AWS Terrain Tiles (formato Terrarium, z15, origem SRTM e outras bases públicas). Serve para triagem.
const DEM = {z: 15, url: (z, x, y) => `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${z}/${x}/${y}.png`, tiles: new Map()};
map.createPane('terrain').style.zIndex = 412; map.getPane('terrain').style.pointerEvents = 'none';
map.createPane('contours').style.zIndex = 452; map.getPane('contours').style.pointerEvents = 'none';
map.createPane('terrtop').style.zIndex = 440; map.getPane('terrtop').style.pointerEvents = 'none';
const terrLayer = L.layerGroup(), contourLayer = L.layerGroup(), profLayer = L.layerGroup().addTo(map);
const TERR = {mode: 'padrao', curvas: false, grid: null, busy: false, key: '', prof: null, profPts: []};
// Pixel global (z15, tiles de 256 px)
function demPx(lat, lng) {
  const n = 256 * Math.pow(2, DEM.z), s = Math.sin(lat * Math.PI / 180);
  return [(lng + 180) / 360 * n, (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * n];
}
function loadDemTile(x, y) {
  const k = x + '/' + y;
  if (DEM.tiles.has(k)) return DEM.tiles.get(k);
  const p = new Promise(res => {
    const im = new Image(); im.crossOrigin = 'anonymous';
    im.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = 256;
      const g = c.getContext('2d'); g.drawImage(im, 0, 0);
      const d = g.getImageData(0, 0, 256, 256).data, e = new Float32Array(256 * 256);
      for (let i = 0; i < e.length; i++) e[i] = d[i * 4] * 256 + d[i * 4 + 1] + d[i * 4 + 2] / 256 - 32768;
      res(e);
    };
    im.onerror = () => res(null);
    im.src = DEM.url(DEM.z, x, y);
  });
  DEM.tiles.set(k, p); return p;
}
// Garante os tiles de elevação de uma área (lat/lng) e devolve uma função de elevação bilinear
async function demFor(bounds) {
  const [x0, y0] = demPx(bounds.getNorth(), bounds.getWest()), [x1, y1] = demPx(bounds.getSouth(), bounds.getEast());
  const tx0 = Math.floor(x0 / 256), tx1 = Math.floor(x1 / 256), ty0 = Math.floor(y0 / 256), ty1 = Math.floor(y1 / 256);
  const got = {};
  for (let tx = tx0; tx <= tx1; tx++) for (let ty = ty0; ty <= ty1; ty++) got[tx + '/' + ty] = await loadDemTile(tx, ty);
  if (Object.values(got).some(v => !v)) return null;
  const px = (X, Y) => { const tx = Math.floor(X / 256), ty = Math.floor(Y / 256), t = got[tx + '/' + ty]; if (!t) return NaN; return t[(Math.floor(Y) - ty * 256) * 256 + (Math.floor(X) - tx * 256)]; };
  return (lat, lng) => {
    const [X, Y] = demPx(lat, lng), fx = X - .5, fy = Y - .5, ix = Math.floor(fx), iy = Math.floor(fy), dx = fx - ix, dy = fy - iy;
    const a = px(ix, iy), b = px(ix + 1, iy), c = px(ix, iy + 1), d = px(ix + 1, iy + 1);
    return a * (1 - dx) * (1 - dy) + b * dx * (1 - dy) + c * (1 - dx) * dy + d * dx * dy;
  };
}
// Área analisada: o lote com 20 m de folga (ou a vista atual, sem lote)
function terrArea() {
  if (lot) return L.geoJSON(lot.feat).getBounds().pad(0.5); // folga para os taludes que passam do lote
  const b = map.getBounds(); return b;
}
function terrKey(b) { return b.toBBoxString() + '|' + (lot ? lot.ring.map(p => p[0].toFixed(6) + ',' + p[1].toFixed(6)).join(';') : map.getZoom()); }
async function terrCompute() {
  const b = terrArea(), key = terrKey(b);
  if (TERR.grid && TERR.key === key) return TERR.grid;
  TERR.busy = true; msg('Carregando a elevação do terreno…');
  const elev = await demFor(b);
  TERR.busy = false;
  if (!elev) { msg('Não foi possível carregar a elevação. Verifique a conexão.'); return null; }
  const c = b.getCenter(), kx = R * Math.cos(c.lat * Math.PI / 180);
  const W = (b.getEast() - b.getWest()) * kx, H = (b.getNorth() - b.getSouth()) * R;
  const cell = Math.max(1, Math.sqrt(W * H / 40000));
  const nx = Math.max(2, Math.round(W / cell)), ny = Math.max(2, Math.round(H / cell));
  const z = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const lat = b.getNorth() - (j + .5) / ny * (b.getNorth() - b.getSouth()), lng = b.getWest() + (i + .5) / nx * (b.getEast() - b.getWest());
    z[j * nx + i] = elev(lat, lng);
  }
  const cx = W / nx, cy = H / ny, slope = new Float32Array(nx * ny), aspect = new Float32Array(nx * ny);
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const zz = (a, bb) => z[Math.min(ny - 1, Math.max(0, bb)) * nx + Math.min(nx - 1, Math.max(0, a))];
    const dzdx = (zz(i + 1, j) - zz(i - 1, j)) / (2 * cx), dzdy = (zz(i, j + 1) - zz(i, j - 1)) / (2 * cy);
    slope[j * nx + i] = Math.hypot(dzdx, dzdy) * 100;
    // orientação da encosta (para onde a água escorre), em graus a partir do norte; j cresce para o sul
    aspect[j * nx + i] = ((Math.atan2(-dzdx, dzdy) * 180 / Math.PI) + 360) % 360;
  }
  // máscara do lote (calculada uma vez por grade)
  const mask = new Uint8Array(nx * ny);
  if (lot) for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const lat = b.getNorth() - (j + .5) / ny * (b.getNorth() - b.getSouth()), lng = b.getWest() + (i + .5) / nx * (b.getEast() - b.getWest());
    mask[j * nx + i] = turf.booleanPointInPolygon([lng, lat], lot.feat) ? 1 : 0;
  }
  TERR.grid = {b, nx, ny, z, slope, aspect, mask, cell: (cx + cy) / 2, elev};
  TERR.key = key;
  return TERR.grid;
}
// Classes de declividade (%)
const DECL = [[5, '#2e7d32', 'até 5%'], [15, '#9ccc65', '5 a 15%'], [30, '#ffb300', '15 a 30%'], [45, '#e53935', '30 a 45%'], [1e9, '#6a1b9a', 'acima de 45%']];
const declColor = s => DECL.find(d => s <= d[0])[1];
// Orientação da encosta (8 rumos)
const ASPECT = [['N', '#1e88e5'], ['NE', '#26c6da'], ['L', '#66bb6a'], ['SE', '#d4e157'], ['S', '#ffee58'], ['SO', '#ffa726'], ['O', '#ef5350'], ['NO', '#ab47bc']];
function elevColor(t) { // azul-esverdeado (baixo) a marrom (alto)
  const st = [[0, [33, 102, 172]], [.25, [67, 162, 202]], [.5, [120, 198, 121]], [.75, [254, 224, 139]], [1, [166, 97, 26]]];
  for (let i = 1; i < st.length; i++) if (t <= st[i][0]) { const [a, ca] = st[i - 1], [b2, cb] = st[i], k = (t - a) / (b2 - a); return ca.map((v, j) => Math.round(v + (cb[j] - v) * k)); }
  return st[4][1];
}
const hexRgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
async function drawTerrain() {
  terrLayer.clearLayers(); contourLayer.clearLayers();
  if (TERR.mode === 'padrao' && !TERR.curvas) { renderTerrLegend(null); drawTaludes(); return; }
  const G = await terrCompute(); if (!G) return;
  const {nx, ny, z, slope, aspect, b} = G;
  let zmin = Infinity, zmax = -Infinity; for (const v of z) { if (v < zmin) zmin = v; if (v > zmax) zmax = v; }
  // máscara do lote (só pinta dentro dele, quando houver)
  const inLot = (i, j) => !lot || G.mask[j * nx + i] === 1;
  if (TERR.mode !== 'padrao') {
    const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
    const g = cv.getContext('2d'), img = g.createImageData(nx, ny);
    const cf = TERR.mode === 'corte' ? cutFillGrid(G) : null;
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const k = j * nx + i; let col = null, a = 190;
      if (TERR.mode === 'decl') { if (inLot(i, j)) col = hexRgb(declColor(slope[k])); }
      else if (TERR.mode === 'elev') { if (inLot(i, j)) col = elevColor(zmax > zmin ? (z[k] - zmin) / (zmax - zmin) : .5); }
      else if (TERR.mode === 'orient') { if (inLot(i, j)) col = slope[k] < 2 ? [176, 184, 192] : hexRgb(ASPECT[Math.round(aspect[k] / 45) % 8][1]); }
      else if (TERR.mode === 'corte') { const d = cf[k]; if (!isNaN(d)) { const t = Math.min(1, Math.abs(d) / 3); col = d > 0 ? [229, 57, 53] : [30, 136, 229]; a = Math.round(60 + 170 * t); } }
      if (col) { img.data[k * 4] = col[0]; img.data[k * 4 + 1] = col[1]; img.data[k * 4 + 2] = col[2]; img.data[k * 4 + 3] = a; }
    }
    g.putImageData(img, 0, 0);
    L.imageOverlay(cv.toDataURL(), b, {pane: TERR.mode === 'corte' ? 'terrtop' : 'terrain', className: 'heat-img', opacity: TERR.mode === 'corte' ? .85 : .8, interactive: false}).addTo(terrLayer);
  }
  if (TERR.curvas) drawContours(G, zmin, zmax);
  drawTaludes();
  renderTerrLegend(G, zmin, zmax);
}
// Curvas de nível (marching squares) com intervalo automático
function contourStep(range) { return [0.5, 1, 2, 5, 10, 20].find(s => range / s <= 25) || 50; }
function drawContours(G, zmin, zmax) {
  const {nx, ny, z, b} = G, step = contourStep(zmax - zmin), lines = {};
  const P = (i, j) => [b.getNorth() - (j + .5) / ny * (b.getNorth() - b.getSouth()), b.getWest() + (i + .5) / nx * (b.getEast() - b.getWest())];
  const lerp = (p, q, a, c, lv) => { const t = (lv - a) / (c - a); return [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]; };
  for (let lv = Math.ceil(zmin / step) * step; lv <= zmax; lv += step) {
    const segs = [];
    for (let j = 0; j < ny - 1; j++) for (let i = 0; i < nx - 1; i++) {
      const v = [z[j * nx + i], z[j * nx + i + 1], z[(j + 1) * nx + i + 1], z[(j + 1) * nx + i]], p = [P(i, j), P(i + 1, j), P(i + 1, j + 1), P(i, j + 1)];
      const pts = [];
      for (let e = 0; e < 4; e++) { const a = v[e], c = v[(e + 1) % 4]; if ((a < lv) !== (c < lv)) pts.push(lerp(p[e], p[(e + 1) % 4], a, c, lv)); }
      if (pts.length === 2) segs.push(pts); else if (pts.length === 4) { segs.push([pts[0], pts[1]]); segs.push([pts[2], pts[3]]); }
    }
    if (segs.length) lines[lv] = segs;
  }
  Object.entries(lines).forEach(([lv, segs]) => {
    const major = Math.round(+lv / step) % 5 === 0;
    L.polyline(segs, {pane: 'contours', interactive: false, color: major ? '#fff' : '#f5f5f5', weight: major ? 1.8 : 0.8, opacity: major ? .95 : .6}).addTo(contourLayer);
    if (major) { const s = segs[Math.floor(segs.length / 2)][0]; L.marker(s, {pane: 'contours', interactive: false, icon: L.divIcon({className: 'sun-lbl h', html: fmt(+lv) + ' m', iconSize: [50, 14], iconAnchor: [25, 7]})}).addTo(contourLayer); }
  });
  G.step = step;
}
// Plataformas: cota de cada bloco (vazia = média do terreno sob o bloco) e volumes de corte e aterro
const PLAT_KINDS = {rapida: 1, saibro: 1, quadra: 1, padel: 1, edif: 1, planta: 1, dxf: 1, estac: 1};
function platformOf(b, G) {
  if (!G || !PLAT_KINDS[b.kind]) return null;
  const f = polyFeat(b.ring), bb = turf.bbox(f), kx = R * Math.cos(b.lat * Math.PI / 180);
  const step = Math.max(0.5, Math.sqrt(b.w * b.h / 900)), samples = [];
  for (let y = bb[1] + step / 2 / R; y < bb[3]; y += step / R) for (let x = bb[0] + step / 2 / kx; x < bb[2]; x += step / kx)
    if (turf.booleanPointInPolygon([x, y], f)) samples.push(G.elev(y, x));
  if (!samples.length) return null;
  const media = samples.reduce((a, v) => a + v, 0) / samples.length;
  const cota = b.cota ?? Math.round(media * 10) / 10, cellA = step * step;
  let corte = 0, aterro = 0, hc = 0, ha = 0, zmin = Infinity, zmax = -Infinity;
  samples.forEach(v => { const d = v - cota; if (d > 0) { corte += d * cellA; hc = Math.max(hc, d); } else { aterro += -d * cellA; ha = Math.max(ha, -d); } zmin = Math.min(zmin, v); zmax = Math.max(zmax, v); });
  return {cota, auto: b.cota == null, media, corte, aterro, hc, ha, desnivel: zmax - zmin};
}
// Grade de corte (+) e aterro (−) só sob os blocos com plataforma
function cutFillGrid(G) {
  const {nx, ny, z, b} = G, out = new Float32Array(nx * ny).fill(NaN);
  blocks.forEach(bk => {
    if (!PLAT_KINDS[bk.kind]) return;
    const p = platformOf(bk, G); if (!p) return;
    const f = polyFeat(bk.ring);
    for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
      const lat = b.getNorth() - (j + .5) / ny * (b.getNorth() - b.getSouth()), lng = b.getWest() + (i + .5) / nx * (b.getEast() - b.getWest());
      if (turf.booleanPointInPolygon([lng, lat], f)) out[j * nx + i] = z[j * nx + i] - p.cota;
    }
  });
  return out;
}
// Resumo do terreno do lote, para a aba Terreno e o semáforo
