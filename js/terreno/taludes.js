// ---------- Taludes automáticos em volta das plataformas ----------
// Do bordo da plataforma (na cota escolhida) sai um plano inclinado até encontrar o terreno:
// sobe (corte) quando o terreno está acima, desce (aterro) quando está abaixo. Inclinação em H:V.
const TAL = {on: true, rc: 1, ra: 1.5};
const taludeLayer = L.layerGroup();
function taludeOf(b, G, p) {
  if (!G || !p || !PLAT_KINDS[b.kind]) return null;
  const W = b.w / 2, H = b.h / 2, step = Math.max(0.8, Math.min(2, (b.w + b.h) / 60));
  // perímetro no sentido anti-horário, com leque de direções nos cantos
  const lados = [[[-W, -H], [W, -H], [0, -1]], [[W, -H], [W, H], [1, 0]], [[W, H], [-W, H], [0, 1]], [[-W, H], [-W, -H], [-1, 0]]];
  const pts = [];
  lados.forEach(([a, c, n], li) => {
    const L0 = Math.hypot(c[0] - a[0], c[1] - a[1]), k = Math.max(1, Math.round(L0 / step));
    for (let i = 0; i < k; i++) { const t = i / k; pts.push({x: a[0] + (c[0] - a[0]) * t, y: a[1] + (c[1] - a[1]) * t, n}); }
    const n2 = lados[(li + 1) % 4][2], a0 = Math.atan2(n[1], n[0]);
    let a1 = Math.atan2(n2[1], n2[0]); if (a1 < a0) a1 += 2 * Math.PI;
    for (let j = 0; j <= 4; j++) { const a = a0 + (a1 - a0) * j / 4; pts.push({x: c[0], y: c[1], n: [Math.cos(a), Math.sin(a)], canto: true}); }
  });
  const ev = (x, y) => { const q = toLL(b, x, y); return G.elev(q[0], q[1]); };
  let vc = 0, va = 0, larg = 0, hmax = 0, fora = false;
  pts.forEach(q => {
    const z0 = ev(q.x, q.y), d0 = z0 - p.cota;
    q.tipo = Math.abs(d0) < 0.15 || isNaN(d0) ? null : d0 > 0 ? 'corte' : 'aterro';
    q.s = 0; q.h = Math.abs(d0) || 0;
    if (!q.tipo) return;
    const r = q.tipo === 'corte' ? TAL.rc : TAL.ra;
    for (let s = 0.5; s <= 60; s += 0.5) {
      const z = ev(q.x + q.n[0] * s, q.y + q.n[1] * s); if (isNaN(z)) { q.s = s; break; }
      const sup = q.tipo === 'corte' ? p.cota + s / r : p.cota - s / r;
      if ((q.tipo === 'corte' && sup >= z) || (q.tipo === 'aterro' && sup <= z)) { q.s = s; break; }
      q.s = s;
    }
    larg = Math.max(larg, q.s); hmax = Math.max(hmax, q.h);
    const o = toLL(b, q.x + q.n[0] * q.s, q.y + q.n[1] * q.s); q.o = o;
    if (lot && !turf.booleanPointInPolygon([o[1], o[0]], lot.feat)) fora = true;
  });
  // volume: seção triangular (altura × largura ÷ 2) ao longo do perímetro, só nos trechos retos
  for (let i = 0; i < pts.length; i++) {
    const q = pts[i], r = pts[(i + 1) % pts.length]; if (!q.tipo || q.canto) continue;
    const comp = Math.hypot(r.x - q.x, r.y - q.y), v = comp * q.h * q.s / 2;
    if (q.tipo === 'corte') vc += v; else va += v;
  }
  return {pts, vc, va, larg, hmax, fora};
}
function drawTaludes() {
  taludeLayer.clearLayers();
  const G = TERR.grid;
  if (!TAL.on || !G || !lot || TERR.key !== terrKey(terrArea()) || vis.terreno === false) { map.removeLayer(taludeLayer); return; }
  taludeLayer.addTo(map);
  blocks.forEach(b => {
    const p = platformOf(b, G), t = taludeOf(b, G, p); if (!t) return;
    const P = t.pts;
    for (let i = 0; i < P.length; i++) {
      const q = P[i], r = P[(i + 1) % P.length]; if (!q.tipo || !r.tipo || !q.s) continue;
      const a = toLL(b, q.x, q.y), c = toLL(b, r.x, r.y), cor = q.tipo === 'corte' ? '#c62828' : '#1565c0';
      L.polygon([a, c, r.o || c, q.o], {pane: 'terrtop', interactive: false, stroke: false, fillColor: cor, fillOpacity: .22}).addTo(taludeLayer);
      // traços de talude: longos e curtos alternados, do topo para o pé
      if (!q.canto) L.polyline([a, i % 2 ? toLL(b, q.x + q.n[0] * q.s * .5, q.y + q.n[1] * q.s * .5) : q.o], {pane: 'terrtop', interactive: false, color: cor, weight: 1.2, opacity: .9}).addTo(taludeLayer);
    }
    // linha do pé (aterro) ou da crista (corte)
    const contorno = P.filter(q => q.tipo && q.s).map(q => q.o);
    if (contorno.length > 2) L.polyline(contorno, {pane: 'terrtop', interactive: false, color: '#5d4037', weight: 1.4, dashArray: '6 4', opacity: .85}).addTo(taludeLayer);
  });
}
function terrSummary() {
  const G = TERR.grid; if (!G || !lot || TERR.key !== terrKey(terrArea())) return null;
  const {nx, ny, z, slope, aspect, b} = G;
  let n = 0, sum = 0, smax = 0, over30 = 0, zmin = Infinity, zmax = -Infinity;
  for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) {
    const lat = b.getNorth() - (j + .5) / ny * (b.getNorth() - b.getSouth()), lng = b.getWest() + (i + .5) / nx * (b.getEast() - b.getWest());
    if (!G.mask[j * nx + i]) continue;
    const k = j * nx + i; n++; sum += slope[k]; smax = Math.max(smax, slope[k]); if (slope[k] >= 30) over30++;
    zmin = Math.min(zmin, z[k]); zmax = Math.max(zmax, z[k]);
  }
  if (!n) return null;
  const plats = blocks.map(bk => { const p = platformOf(bk, G); return {bk, p, t: TAL.on ? taludeOf(bk, G, p) : null}; }).filter(x => x.p);
  return {decMed: sum / n, decMax: smax, pct30: over30 / n, zmin, zmax, plats,
    corte: plats.reduce((a, x) => a + x.p.corte + (x.t ? x.t.vc : 0), 0), aterro: plats.reduce((a, x) => a + x.p.aterro + (x.t ? x.t.va : 0), 0),
    taludeFora: plats.filter(x => x.t && x.t.fora).map(x => x.bk.name), taludeLarg: plats.reduce((a, x) => Math.max(a, x.t ? x.t.larg : 0), 0),
    hMax: plats.reduce((a, x) => Math.max(a, x.p.hc, x.p.ha), 0)};
}
function renderTerrLegend(G, zmin, zmax) {
  const el = $('terr-legend'); if (!el) return;
  if (!G || TERR.mode === 'padrao') { el.innerHTML = TERR.curvas && G ? `<div class="hint">Curvas a cada ${fmt(G.step || 1)} m (as mais fortes a cada ${fmt((G.step || 1) * 5)} m).</div>` : ''; return; }
  if (TERR.mode === 'decl') el.innerHTML = '<div class="tl">' + DECL.map(d => `<span><i style="background:${d[1]}"></i>${d[2]}</span>`).join('') + '</div><p class="hint">Acima de 30%, o parcelamento do solo exige condições especiais (Lei 6.766/79).</p>';
  if (TERR.mode === 'elev') el.innerHTML = `<div class="tl"><span>${fmt(zmin)} m</span><i class="grad" style="background:linear-gradient(90deg,${[0, .25, .5, .75, 1].map(t => 'rgb(' + elevColor(t).join(',') + ')').join(',')})"></i><span>${fmt(zmax)} m</span></div><p class="hint">Desnível na área: ${fmt(zmax - zmin)} m.</p>`;
  if (TERR.mode === 'orient') el.innerHTML = '<div class="tl">' + ASPECT.map(a => `<span><i style="background:${a[1]}"></i>${a[0]}</span>`).join('') + '<span><i style="background:#b0b8c0"></i>plano</span></div><p class="hint">Para onde a encosta está virada. No hemisfério sul, encostas voltadas para o <b>norte</b> recebem mais sol; as voltadas para o sul, menos.</p>';
  if (TERR.mode === 'corte') el.innerHTML = '<div class="tl"><span><i style="background:#e53935"></i>corte</span><span><i style="background:#1e88e5"></i>aterro</span><span>cor mais forte = até 3 m</span></div><p class="hint">Mostra o corte e o aterro sob cada bloco, até a cota da plataforma (campo “Cota” na barra do bloco).</p>';
  if (TERR.curvas && G.step) el.innerHTML += `<div class="hint">Curvas a cada ${fmt(G.step)} m.</div>`;
}
async function setTerrMode(m) {
  TERR.mode = m;
  document.querySelectorAll('#terr-modes [data-tm]').forEach(b => b.classList.toggle('on', b.dataset.tm === m));
  syncTerrLayers(); await drawTerrain(); renderMetrics();
}
function syncTerrLayers() { const on = vis.terreno !== false; [terrLayer, contourLayer].forEach(l => { if (on) l.addTo(map); else map.removeLayer(l); }); }
// Perfil: dois toques no mapa
