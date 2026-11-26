// Geometria do estudo para o 3D, em dois níveis de detalhe (como o LOD do Spacio):
// "volumes" = massas simples; "detalhe" = quadras com linhas, rede e alambrado/vidro, edificações com andares e telhado,
// árvores em 3D por tipo e estacionamento com as vagas pintadas.
let LOD3D = 'detalhe';
function studyGeoJSON() {
  Q3D.dirty = true; // o modelo das quadras em Three.js é refeito junto com esta geometria
  const F = [], R3 = (b, x0, y0, x1, y1) => { const r = [[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]].map(([x, y]) => { const q = toLL(b, x, y); return [q[1], q[0]]; }); return {type: 'Polygon', coordinates: [r]}; };
  const LN = (b, pts) => ({type: 'LineString', coordinates: pts.map(([x, y]) => { const q = toLL(b, x, y); return [q[1], q[0]]; })});
  let grp = 'proj', hgt = 0, nome = '';
  const ext = (g, col, base, top, vidro) => F.push({type: 'Feature', properties: {t: vidro ? 'vidro' : 'ext', col, base, top, g: grp, h: hgt || top, n: nome}, geometry: g});
  const piso = (g, col) => F.push({type: 'Feature', properties: {t: 'piso', col, g: grp}, geometry: g});
  const linha = (g, col, w) => F.push({type: 'Feature', properties: {t: 'linha', col, w: w || 1.5, g: grp}, geometry: g});
  const disco = (lng, lat, r, n) => turf.circle([lng, lat], Math.max(.05, r), {units: 'meters', steps: n || 16}).geometry;
  if (lot) {
    F.push({type: 'Feature', properties: {t: 'lote'}, geometry: {type: 'LineString', coordinates: lot.ring}});
    polysOf(buildable).forEach(r => F.push({type: 'Feature', properties: {t: 'recuo'}, geometry: {type: 'LineString', coordinates: r}}));
    F.push({type: 'Feature', properties: {t: 'terreno'}, geometry: lot.feat.geometry}); // chão limpo do lote, usado na caminhada
  }
  { // disco de 150 m em volta do estudo: recebe a textura de grão que disfarça o borrão do satélite visto de perto
    const c = lot ? turf.centroid(lot.feat).geometry.coordinates : blocks.length ? [blocks[0].lng, blocks[0].lat] : [map.getCenter().lng, map.getCenter().lat];
    F.push({type: 'Feature', properties: {t: 'entorno'}, geometry: turf.circle(c, 150, {units: 'meters', steps: 48}).geometry});
  }
  if (VIZ.on) VIZ.list.forEach(v => F.push({type: 'Feature', properties: {t: 'ext', col: '#c9ced4', base: 0, top: v.h, g: 'viz', h: v.h, n: 'Vizinho'}, geometry: {type: 'Polygon', coordinates: [v.ring]}}));
  if (typeof caminhos !== 'undefined') {
    caminhos.forEach(c => { const pg = camPoly(c); if (!pg) return; piso(pg.geometry, c.tipo === 'carro' ? '#4a4f55' : '#ddd0b2'); if (c.tipo === 'carro') linha({type: 'LineString', coordinates: c.pts.map(p => [p[1], p[0]])}, '#ffd54f', 1.2); });
  }
  blocks.forEach(b => {
    grp = b.kind === 'arvore' ? 'arvore' : 'proj'; hgt = altOf(b) || 0; nome = b.name || TYPES[b.kind].label;
    if (!vis[visKey(b.kind)]) return;
    const t = TYPES[b.kind], W = b.w / 2, H = b.h / 2;
    if (LOD3D === 'volumes') {
      const h = t.court ? 0.15 : b.kind === 'estac' || b.kind === 'vaga' ? 0.08 : (altOf(b) || 3);
      const col = b.kind === 'saibro' ? '#c0653c' : b.kind === 'padel' ? '#2a6db5' : t.court ? '#2d5f9e' : b.kind === 'estac' || b.kind === 'vaga' ? '#4a4f55' : b.kind === 'arvore' ? '#4f8a3a' : '#e8e2d6';
      if (b.kind === 'arvore') ext(disco(b.lng, b.lat, W), col, 2, h); else if (h < .3) piso(R3(b, -W, -H, W, H), col); else ext(R3(b, -W, -H, W, H), col, 0, h);
      return;
    }
    if (COURT_COLORS[b.kind]) { // tênis: escape, quadra, linhas, rede, alambrado
      const C = COURT_COLORS[b.kind], cw = PLAY.w / 2, ch = PLAY.h / 2, sh = 8.23 / 2, sv = 6.40;
      piso(R3(b, -W, -H, W, H), C.escape); piso(R3(b, -cw, -ch, cw, ch), C.court);
      if (Q3D.on) return; // linhas, rede, alambrado e postes vêm do modelo em Three.js (q3dTenis)
      [[[-cw, -ch], [cw, -ch], [cw, ch], [-cw, ch], [-cw, -ch]], [[-cw, -sh], [cw, -sh]], [[-cw, sh], [cw, sh]], [[-sv, -sh], [-sv, sh]], [[sv, -sh], [sv, sh]], [[-sv, 0], [sv, 0]]]
        .forEach(p => linha(LN(b, p), C.line, 1.2));
      ext(R3(b, -0.04, -ch - .9, 0.04, ch + .9), '#1b1b1b', 0, 1.07);
      [[-W, -H, W, -H + .06], [-W, H - .06, W, H], [-W, -H, -W + .06, H], [W - .06, -H, W, H]].forEach(r => ext(R3(b, ...r), '#3a4148', 0, 3.6, true));
      return;
    }
    if (b.kind === 'infantil') {
      const cw = Math.min(7, W - .5), ch = Math.min(3.2, H - .4), sv = Math.min(3, cw - .5);
      piso(R3(b, -W, -H, W, H), '#5b9b4a'); piso(R3(b, -cw, -ch, cw, ch), '#ef7d3c');
      if (Q3D.on) return; // detalhes no modelo em Three.js (q3dInfantil)
      [[[-cw, -ch], [cw, -ch], [cw, ch], [-cw, ch], [-cw, -ch]], [[-sv, -ch], [-sv, ch]], [[sv, -ch], [sv, ch]], [[-sv, 0], [sv, 0]]].forEach(p => linha(LN(b, p), '#ffffff', 1.2));
      ext(R3(b, -0.03, -ch - .4, 0.03, ch + .4), '#1b1b1b', 0, 0.8);
      [[-W, -H, W, -H + .05], [-W, H - .05, W, H], [-W, -H, -W + .05, H], [W - .05, -H, W, H]].forEach(r => ext(R3(b, ...r), '#3a4148', 0, 2, true));
      return;
    }
    if (b.kind === 'padel') { // grama, linhas, rede, vidro nos fundos e tela nas laterais
      const cw = 10, ch = 5, sv = 6.95;
      piso(R3(b, -W, -H, W, H), '#33414d'); piso(R3(b, -cw, -ch, cw, ch), '#2a6db5');
      if (Q3D.on) return; // detalhes no modelo em Three.js (q3dPadel)
      [[[-sv, -ch], [-sv, ch]], [[sv, -ch], [sv, ch]], [[-sv, 0], [sv, 0]]].forEach(p => linha(LN(b, p), '#ffffff', 1.2));
      ext(R3(b, -0.04, -ch, 0.04, ch), '#1b1b1b', 0, 0.88);
      [[-cw, -ch, -cw + .1, ch], [cw - .1, -ch, cw, ch], [-cw, -ch, -cw + 2, -ch + .1], [-cw, ch - .1, -cw + 2, ch], [cw - 2, -ch, cw, -ch + .1], [cw - 2, ch - .1, cw, ch]]
        .forEach(r => ext(R3(b, ...r), '#bfe6ff', 0, 3, true));
      [[-cw + 2, -ch, cw - 2, -ch + .06], [-cw + 2, ch - .06, cw - 2, ch]].forEach(r => ext(R3(b, ...r), '#3a4148', 0, 3, true));
      return;
    }
    if (b.kind === 'estac' || b.kind === 'vaga') { // asfalto e vagas pintadas
      piso(R3(b, -W, -H, W, H), '#3f454b');
      const P = b.kind === 'vaga' ? {rows: [0], aisles: [], perRow: 1} : parkLayout(b.w, b.h), ox = -W + (b.w - P.perRow * VAGA.w) / 2;
      P.rows.forEach(ry => { for (let i = 0; i <= P.perRow; i++) linha(LN(b, [[ox + i * VAGA.w, -H + ry], [ox + i * VAGA.w, -H + ry + VAGA.h]]), '#f4f4f4', 1); });
      P.aisles.forEach(ay => linha(LN(b, [[-W + .5, -H + ay + VAGA.corredor / 2], [W - .5, -H + ay + VAGA.corredor / 2]]), '#ffd54f', 1));
      return;
    }
    if (b.kind === 'arvore') { // tronco + copa por tipo
      const T = TREES[b.src] || TREES.frondosa, r = W, alt = altOf(b) || T.alt, tr = Math.max(.12, r * .07);
      if (b.src === 'palmeira') {
        ext(disco(b.lng, b.lat, tr * 1.3, 10), '#8d6e63', 0, alt - .8);
        ext(disco(b.lng, b.lat, r * .95, 14), '#5c9a3c', alt - .9, alt - .4); ext(disco(b.lng, b.lat, r * .55, 12), '#7cb342', alt - .4, alt - .1);
      } else if (b.src === 'pinheiro') {
        ext(disco(b.lng, b.lat, tr, 10), '#6d4c41', 0, alt * .25);
        [1, .78, .55, .32, .14].forEach((k, i) => ext(disco(b.lng, b.lat, r * k, 14), i % 2 ? '#2f6b3a' : '#24552e', alt * (.2 + i * .16), alt * (.36 + i * .16)));
      } else {
        const tH = b.src === 'arbusto' ? 0 : alt * .35, copa = alt - tH, c = T.c, flor = T.flor;
        if (tH) ext(disco(b.lng, b.lat, tr, 10), '#6d4c41', 0, tH + .3);
        [[.72, 0, .22, c[2]], [.95, .2, .55, c[1]], [.85, .55, .8, flor ? c[1] : c[1]], [.55, .8, 1, flor ? (flor === '#fff8c4' ? '#f2c230' : '#d77fc0') : c[0]]]
          .forEach(([k, z0, z1, col]) => ext(disco(b.lng, b.lat, r * k, 16), col, tH + copa * z0, tH + copa * z1));
      }
      return;
    }
    // edificações e plantas: andares com janelas, faixa de laje, platibanda e cobertura
    const pav = pavOf(b) || 1, alt = altOf(b) || 3, hp = alt / pav;
    for (let k = 0; k < pav; k++) {
      ext(R3(b, -W, -H, W, H), b.kind === 'edif' ? '#efe8dc' : '#f4f2ee', k * hp, k * hp + hp * .88);
      ext(R3(b, -W - .05, -H - .05, W + .05, H + .05), '#bdb4a6', k * hp + hp * .88, (k + 1) * hp);
    }
    // janelas em todas as fachadas (1,4 m a cada ~3 m) e porta no térreo da fachada principal
    const jan = (len, fn) => { const n = Math.max(1, Math.floor(len / 3)), passo = len / n; for (let i = 0; i < n; i++) fn(-len / 2 + passo * (i + .5), i, n); };
    for (let k = 0; k < pav; k++) {
      const z0 = k * hp + Math.min(.9, hp * .3), z1 = k * hp + Math.min(2.2, hp * .74);
      jan(2 * W, (c, i, n) => {
        if (k === 0 && i === Math.floor(n / 2)) ext(R3(b, c - .6, -H - .07, c + .6, -H + .02), '#6d4c41', 0, Math.min(2.1, hp * .75));
        else ext(R3(b, c - .7, -H - .07, c + .7, -H + .02), '#4f6b82', z0, z1);
        ext(R3(b, c - .7, H - .02, c + .7, H + .07), '#4f6b82', z0, z1);
      });
      jan(2 * H, c => { ext(R3(b, -W - .07, c - .7, -W + .02, c + .7), '#4f6b82', z0, z1); ext(R3(b, W - .02, c - .7, W + .07, c + .7), '#4f6b82', z0, z1); });
    }
    const t0 = alt + .15, e = .15;
    ext(R3(b, -W, -H, W, H), '#d9d4cc', alt, t0); // laje
    if (b.kind === 'edif') { // telhado embutido de telha metálica: duas águas com 10% de caimento, escondidas pela platibanda
      const lngX = W >= H, meio = (lngX ? H : W) - e, sobe = meio * .1, N = 5, ph = sobe + .45;
      for (let s = -1; s <= 1; s += 2) for (let i = 0; i < N; i++) {
        const a = e + meio * i / N, c = e + meio * (i + 1) / N, z = t0 + .05 + sobe * (i + 1) / N, col = s < 0 ? '#c7cdd2' : '#a9b0b6';
        const r = lngX ? (s < 0 ? R3(b, -W + e, -H + a, W - e, -H + c) : R3(b, -W + e, H - c, W - e, H - a)) : (s < 0 ? R3(b, -W + a, -H + e, -W + c, H - e) : R3(b, W - c, -H + e, W - a, H - e));
        ext(r, col, t0, z);
      }
      [[-W, -H, W, -H + e], [-W, H - e, W, H], [-W, -H, -W + e, H], [W - e, -H, W, H]].forEach(r => ext(R3(b, ...r), '#e6e0d6', alt, t0 + ph));
    } else { // laje com platibanda
      [[-W, -H, W, -H + e], [-W, H - e, W, H], [-W, -H, -W + e, H], [W - e, -H, W, H]].forEach(r => ext(R3(b, ...r), '#cfc8bb', alt, alt + .9));
    }
  });
  return {type: 'FeatureCollection', features: F};
}
// Luz do 3D vinda do sol do estudo solar (data e hora escolhidas)
