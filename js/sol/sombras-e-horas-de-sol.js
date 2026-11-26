// Sombras do sol. Edificações: volume projetado. Árvores: copa (no ar) deslocada pela altura + tronco.
// Alambrado e vidro das quadras: sombra leve. Devolve a sombra forte (opaca) de um bloco.
function shOffset(b, s, h) {
  const Ls = Math.min(400, h / Math.tan(s.alt * Math.PI / 180)), rad = s.az * Math.PI / 180;
  return [-Math.sin(rad) * Ls / (R * Math.cos(b.lat * Math.PI / 180)), -Math.cos(rad) * Ls / R];
}
const hull = pts => { try { return turf.convex(turf.featureCollection(pts.map(p => turf.point(p)))); } catch (e) { return null; } };
const unir = fs => fs.filter(Boolean).reduce((u, f) => { if (!u) return f; try { return turf.union(u, f) || u; } catch (e) { return u; } }, null);
function shadowOf(b, s) {
  if (b.viz) return s.alt > 0.5 ? sombraVizinho(b, s) : null;
  if (s.alt <= 0.5 || !vis[visKey(b.kind)]) return null;
  if (b.kind === 'arvore') {
    const T = TREES[b.src] || TREES.frondosa, alt = altOf(b) || T.alt, r = b.w / 2;
    const hc = b.src === 'palmeira' ? alt - .6 : b.src === 'pinheiro' ? alt * .45 : b.src === 'arbusto' ? alt * .5 : alt * .62;
    const rc = b.src === 'palmeira' ? r * .9 : b.src === 'pinheiro' ? r * .8 : r * .92;
    const [ox, oy] = shOffset(b, s, hc), copa = turf.circle([b.lng + ox, b.lat + oy], rc, {units: 'meters', steps: 24});
    if (b.src === 'arbusto') return copa;
    const [tx, ty] = shOffset(b, s, hc * .8), tr = Math.max(.15, r * .07) / (R * Math.cos(b.lat * Math.PI / 180));
    const tronco = hull([[b.lng - tr, b.lat], [b.lng + tr, b.lat], [b.lng + tx - tr, b.lat + ty], [b.lng + tx + tr, b.lat + ty]]);
    return b.src === 'pinheiro' ? unir([hull(turf.circle([b.lng, b.lat], r * .8, {units: 'meters', steps: 16}).geometry.coordinates[0].concat([[b.lng + shOffset(b, s, alt)[0], b.lat + shOffset(b, s, alt)[1]]])), tronco])
      : unir([copa, tronco]);
  }
  const h = altOf(b); if (h <= 0) return null;
  const [ox, oy] = shOffset(b, s, h);
  const sh = hull(b.ring.concat(b.ring.map(([x, y]) => [x + ox, y + oy])));
  try { return turf.difference(sh, polyFeat(b.ring)) || null; } catch (e) { return sh; } // a sombra não cobre o próprio telhado
}
// Sombra leve das telas e vidros das quadras (tênis 3,6 m; padel 3 m)
function shadowTela(b, s) {
  if (s.alt <= 0.5 || !TYPES[b.kind].court || !vis.quadra) return null;
  const h = b.kind === 'padel' ? 3 : b.kind === 'infantil' ? 2 : 3.6, [ox, oy] = shOffset(b, s, h), R4 = b.ring.slice(0, 4), out = [];
  for (let i = 0; i < 4; i++) { const p = R4[i], q = R4[(i + 1) % 4]; out.push(hull([p, q, [q[0] + ox, q[1] + oy], [p[0] + ox, p[1] + oy]])); }
  return unir(out);
}
const heatLayer = L.layerGroup();
let heatKey = '', heatT = null, heatStats = null;
const solVisible = () => solOn && vis.sol;
function syncSolLayers() { [sunLayer, shadowLayer, heatLayer].forEach(l => { if (solVisible()) l.addTo(map); else map.removeLayer(l); }); }
// Cor do céu para a faixa de horas (noite, crepúsculo, sol baixo, dia)
function skyColor(alt) {
  if (alt < -12) return '#141b25';
  if (alt < -6) return '#232f45';
  if (alt < -0.833) return '#6b4466';
  if (alt < 6) return '#ef8a3a';
  if (alt < 20) return '#f7bd4f';
  return alt < 45 ? '#fbe2a0' : '#fff3d2';
}
function heatColor(t) { // 0 = sem sol direto, 1 = sol o dia todo
  const st = [[0, [26, 35, 126]], [.25, [123, 31, 162]], [.5, [229, 57, 53]], [.75, [251, 140, 0]], [1, [255, 238, 88]]];
  for (let i = 1; i < st.length; i++) if (t <= st[i][0]) {
    const [a, ca] = st[i - 1], [b, cb] = st[i], k = (t - a) / (b - a);
    return ca.map((v, j) => Math.round(v + (cb[j] - v) * k));
  }
  return st[st.length - 1][1];
}
// Horas de sol direto em cada ponto do lote no dia escolhido (sombras dos blocos a cada 10 min)
function computeHeat() {
  heatLayer.clearLayers(); heatStats = null;
  const c = solCenter(), kx = R * Math.cos(c.lat * Math.PI / 180);
  const toM = p => [(p[0] - c.lng) * kx, (p[1] - c.lat) * R];
  let ring = lot ? lot.ring.map(toM) : null;
  let minx, miny, maxx, maxy;
  if (ring) { const xs = ring.map(p => p[0]), ys = ring.map(p => p[1]); minx = Math.min(...xs); maxx = Math.max(...xs); miny = Math.min(...ys); maxy = Math.max(...ys); }
  else { minx = miny = -40; maxx = maxy = 40; }
  const cellM = Math.max(0.5, Math.sqrt((maxx - minx) * (maxy - miny) / 3000));
  const nx = Math.max(1, Math.ceil((maxx - minx) / cellM)), ny = Math.max(1, Math.ceil((maxy - miny) / cellM));
  const day = dayScan(c), samples = [];
  for (const p of day.pts) {
    if (p.m % 10 || p.alt <= 1) continue;
    const sh = [];
    sombreadores().forEach(b => { const f = shadowOf(b, p); if (!f) return; const g = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates; g.forEach(poly => { const r = poly[0].map(toM); const xs = r.map(q => q[0]), ys = r.map(q => q[1]); sh.push({r, bb: [Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys)]}); }); });
    samples.push(sh);
  }
  const maxH = samples.length * 10 / 60;
  const cv = document.createElement('canvas'); cv.width = nx; cv.height = ny;
  const g = cv.getContext('2d'), img = g.createImageData(nx, ny);
  const pipM = (Q, x, y) => { let ins = false; for (let i = 0, j = Q.length - 1; i < Q.length; j = i++) { const [xi, yi] = Q[i], [xj, yj] = Q[j]; if ((yi > y) !== (yj > y) && x < (xj - xi) * (y - yi) / (yj - yi) + xi) ins = !ins; } return ins; };
  const cells = [];
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const x = minx + (i + .5) * cellM, y = maxy - (j + .5) * cellM;
    if (ring && !pipM(ring, x, y)) continue;
    let sun = 0;
    for (const sh of samples) if (!sh.some(s => x >= s.bb[0] && x <= s.bb[2] && y >= s.bb[1] && y <= s.bb[3] && pipM(s.r, x, y))) sun++;
    const h = sun * 10 / 60, col = heatColor(maxH ? h / maxH : 0), k = (j * nx + i) * 4;
    img.data[k] = col[0]; img.data[k + 1] = col[1]; img.data[k + 2] = col[2]; img.data[k + 3] = 200;
    cells.push([x, y, h]);
  }
  g.putImageData(img, 0, 0);
  const sw = [c.lat + (maxy - ny * cellM) / R, c.lng + minx / kx], ne = [c.lat + maxy / R, c.lng + (minx + nx * cellM) / kx];
  L.imageOverlay(cv.toDataURL(), [sw, ne], {pane: 'shadows', className: 'heat-img', interactive: false, opacity: .78}).addTo(heatLayer);
  // média de horas de sol em cada quadra
  const courts = {};
  blocks.filter(b => b.kind !== 'arvore').forEach(b => {
    const q = b.ring.map(toM).slice(0, -1), hs = cells.filter(([x, y]) => pipM(q, x, y)).map(v => v[2]);
    if (hs.length) courts[b.id] = hs.reduce((a, v) => a + v, 0) / hs.length;
  });
  heatStats = {maxH, courts, mean: cells.length ? cells.reduce((a, v) => a + v[2], 0) / cells.length : 0};
}
function heatSignature() {
  return [VIZ.on ? 'v' + VIZ.list.map(v => v.h).join() : '', $('sol-data').value, lot ? lot.ring.length + ':' + lot.ring[0].join() : '', blocks.map(b => [b.kind, b.lat.toFixed(7), b.lng.toFixed(7), b.angle, b.w, b.h, altOf(b)].join()).join('|')].join('#');
}
