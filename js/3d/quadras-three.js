// ---------- Quadras modeladas em Three.js (camada própria dentro do mapa 3D) ----------
// As medidas são as mesmas do desenho 2D (PLAY, COURT_COLORS e os blocos). O modelo de cada quadra fica em metros no
// referencial do bloco: X no comprimento, Y para cima e Z na largura. A laje fica 5 cm acima do terreno da plataforma.
const Q3D = {on: false, erro: false, T: null, dirty: true, sombraSuja: true, estudo: null, estudoSujo: false, sol: {az: 210, alt: 45, noite: false}, org: null, emMetros: null, itens: [], mats: {}, geo: {}, E: .05, raio: 30, centro: [0, 0, 0]};
const THREE_URL = 'https://unpkg.com/three@0.183.0/build/three.module.min.js';
async function q3dCarrega() {
  if (Q3D.erro) return false;
  if (Q3D.T) return true;
  try { Q3D.T = await import(THREE_URL); Q3D.on = true; } catch (e) { Q3D.on = false; }
  return Q3D.on;
}
// Se o Three.js falhar em algum aparelho, o 3D volta para as quadras simples de antes
function q3dFalha(e) {
  if (Q3D.erro) return;
  Q3D.erro = true; Q3D.on = false; console.error('Quadras 3D', e);
  setTimeout(() => { try { if (map3d.getLayer('quadras3d')) map3d.removeLayer('quadras3d'); map3d.getSource('estudo').setData(studyGeoJSON()); } catch (x) {} }, 0);
}
// Textura só de transparência: losangos do alambrado ou malha quadrada da rede. A cor vem do material.
function q3dTextura(tipo) {
  const T = Q3D.T, n = 64, d = new Uint8Array(n * n * 4), meio = tipo === 'tela' ? 2.2 : 4.5; // meia espessura do fio, em pixels
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    let dist;
    if (tipo === 'tela') { const a = ((x - y) % n + n) % n, b = (x + y) % n; dist = Math.min(a, n - a, b, n - b) * Math.SQRT1_2; }
    else dist = Math.min(x, n - x, y, n - y);
    const i = (y * n + x) * 4; d[i] = d[i + 1] = d[i + 2] = 255; d[i + 3] = Math.round(255 * Math.max(0, Math.min(1, meio - dist + .5)));
  }
  const t = new T.DataTexture(d, n, n, T.RGBAFormat);
  t.wrapS = t.wrapT = T.RepeatWrapping; t.magFilter = T.LinearFilter; t.minFilter = T.LinearMipmapLinearFilter; t.generateMipmaps = true;
  t.anisotropy = Q3D.rend.capabilities.getMaxAnisotropy(); t.needsUpdate = true;
  return t;
}
// Materiais por cor e tipo. Piso, linha, luz, vidro, tela e rede não projetam sombra; o resto (aço, postes) projeta.
// "sombra.18" e "sombra.42" são as manchas do estudo de insolação, com a mesma opacidade usada no mapa.
function q3dMat(cor, tipo) {
  const T = Q3D.T, k = cor + '|' + (tipo || '');
  if (Q3D.mats[k]) return Q3D.mats[k];
  const m = tipo === 'luz' ? new T.MeshBasicMaterial({color: cor})
    : tipo && tipo.startsWith('sombra') ? new T.MeshBasicMaterial({color: cor, transparent: true, opacity: +tipo.slice(6), side: T.DoubleSide, depthWrite: false})
    : tipo === 'vidro' ? new T.MeshLambertMaterial({color: cor, transparent: true, opacity: .3, side: T.DoubleSide, depthWrite: false})
    : tipo === 'tela' || tipo === 'rede' ? new T.MeshLambertMaterial({color: cor, map: q3dTextura(tipo), transparent: true, side: T.DoubleSide, depthWrite: false})
    : new T.MeshLambertMaterial({color: cor});
  if (tipo === 'linha') { m.polygonOffset = true; m.polygonOffsetFactor = -2; m.polygonOffsetUnits = -2; }
  if (tipo && tipo.startsWith('sombra')) { m.polygonOffset = true; m.polygonOffsetFactor = -4; m.polygonOffsetUnits = -4; }
  m.userData.semSombra = !!tipo;
  return Q3D.mats[k] = m;
}
// Junta caixas e tubos por material e desenha cada grupo de uma vez (instâncias)
function q3dLote() {
  const T = Q3D.T, grupos = new Map(), q = new T.Quaternion(), eu = new T.Euler(), Y = new T.Vector3(0, 1, 0), d = new T.Vector3();
  const add = (geo, mat, pos, esc) => { const k = geo + '|' + mat.uuid; let r = grupos.get(k); if (!r) grupos.set(k, r = {geo, mat, ms: []}); r.ms.push(new T.Matrix4().compose(pos, q, esc)); };
  const eixo = (a, b) => { d.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]); const len = d.length(); q.setFromUnitVectors(Y, d.normalize()); return [new T.Vector3((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2), len]; };
  return {
    // caixa pelo centro, com giro opcional em torno do eixo X (radianos)
    caixa(mat, x, y, z, sx, sy, sz, rx) { q.setFromEuler(eu.set(rx || 0, 0, 0)); add('caixa', mat, new T.Vector3(x, y, z), new T.Vector3(sx, sy, sz)); },
    // tubo redondo entre dois pontos
    tubo(mat, a, b, r) { const [p, len] = eixo(a, b); add('tubo', mat, p, new T.Vector3(r, len, r)); },
    // barra de seção retangular entre dois pontos
    barra(mat, a, b, larg, alt) { const [p, len] = eixo(a, b); add('caixa', mat, p, new T.Vector3(larg, len, alt)); },
    monta(g) {
      grupos.forEach(r => {
        const im = new T.InstancedMesh(Q3D.geo[r.geo], r.mat, r.ms.length);
        r.ms.forEach((m, i) => im.setMatrixAt(i, m));
        im.castShadow = !r.mat.userData.semSombra; im.receiveShadow = true; g.add(im);
      });
    }
  };
}
// Faixa vertical que passa por pontos [x, z, base, topo]: tela, vidro ou rede, com a textura repetida a cada "passo" metros
function q3dFaixa(mat, pts, passo) {
  const T = Q3D.T, pos = [], uv = [], idx = []; let u = 0;
  pts.forEach((p, i) => {
    if (i) u += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    pos.push(p[0], p[2], p[1], p[0], p[3], p[1]); uv.push(u / passo, p[2] / passo, u / passo, p[3] / passo);
    if (i) { const a = (i - 1) * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); }
  });
  const g = new T.BufferGeometry();
  g.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  const m = new T.Mesh(g, mat); m.receiveShadow = true;
  return m;
}
// Laje do escape (desce 1,2 m para não ficar solta em terreno inclinado) e área de jogo por cima
function q3dPiso(L, b, corEscape, cw, ch, corJogo) {
  const E = Q3D.E;
  L.caixa(q3dMat(corEscape, 'piso'), 0, (E - 1.2) / 2, 0, b.w, E + 1.2, b.h);
  L.caixa(q3dMat(corJogo, 'piso'), 0, E + .003, 0, cw * 2, .006, ch * 2);
}
// Linha pintada no piso, dada pelo retângulo que ocupa em planta
function q3dLinha(L, cor, x0, z0, x1, z1) { L.caixa(q3dMat(cor, 'linha'), (x0 + x1) / 2, Q3D.E + .008, (z0 + z1) / 2, Math.abs(x1 - x0), .004, Math.abs(z1 - z0)); }
// Rede: postes, malha, faixa branca no topo e, no tênis, a fita central que puxa o meio para baixo
function q3dRede(L, g, zp, hPoste, hMeio, fita) {
  const E = Q3D.E, poste = q3dMat('#22262a'), branco = q3dMat('#f5f5f2');
  [-zp, zp].forEach(z => L.tubo(poste, [0, E, z], [0, E + hPoste + .03, z], .04));
  g.add(q3dFaixa(q3dMat('#1b1b1b', 'rede'), [[0, -zp, E + .03, E + hPoste], [0, 0, E + .03, E + hMeio], [0, zp, E + .03, E + hPoste]], .045));
  L.barra(branco, [0, E + hPoste - .03, -zp], [0, E + hMeio - .03, 0], .02, .06); L.barra(branco, [0, E + hMeio - .03, 0], [0, E + hPoste - .03, zp], .02, .06);
  if (fita) L.caixa(branco, 0, E + hMeio / 2, 0, .022, hMeio, .05);
}
// Alambrado em volta do retângulo ±W × ±H: montantes a cada ~3 m, travessas em cima e embaixo e a tela
function q3dCerca(L, g, W, H, alt) {
  const E = Q3D.E, aco = q3dMat('#3a4148'), tela = q3dMat('#4d565e', 'tela'), P = [[-W, -H], [W, -H], [W, H], [-W, H]];
  for (let i = 0; i < 4; i++) {
    const [x0, z0] = P[i], [x1, z1] = P[(i + 1) % 4], n = Math.max(1, Math.round(Math.hypot(x1 - x0, z1 - z0) / 3));
    for (let k = 0; k < n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n; L.tubo(aco, [x, E, z], [x, E + alt, z], k ? .03 : .045); }
    L.tubo(aco, [x0, E + alt, z0], [x1, E + alt, z1], .025); L.tubo(aco, [x0, E + .08, z0], [x1, E + .08, z1], .02);
    g.add(q3dFaixa(tela, [[x0, z0, E + .08, E + alt], [x1, z1, E + .08, E + alt]], .085));
  }
}
// Tênis (rápida e saibro): linhas com a largura real, rede de 1,07 m nos postes e 0,914 m no centro, alambrado de 3,6 m
// e a iluminação do orçamento: 4 postes de 8 m com cruzeta e 4 refletores cada (16 por quadra)
function q3dTenis(b, L, g) {
  const C = COURT_COLORS[b.kind], W = b.w / 2, H = b.h / 2, cw = PLAY.w / 2, ch = PLAY.h / 2, sh = 8.23 / 2, sv = 6.40, lw = .05, E = Q3D.E;
  q3dPiso(L, b, C.escape, cw, ch, C.court);
  const ln = (x0, z0, x1, z1) => q3dLinha(L, C.line, x0, z0, x1, z1);
  ln(-cw, -ch, -cw + .1, ch); ln(cw - .1, -ch, cw, ch); // linhas de fundo (10 cm)
  ln(-cw, -ch, cw, -ch + lw); ln(-cw, ch - lw, cw, ch); // laterais de duplas
  ln(-cw, -sh, cw, -sh + lw); ln(-cw, sh - lw, cw, sh); // laterais de simples
  ln(-sv - lw / 2, -sh, -sv + lw / 2, sh); ln(sv - lw / 2, -sh, sv + lw / 2, sh); // linhas de saque
  ln(-sv, -lw / 2, sv, lw / 2); // linha central de saque
  ln(-cw + .1, -lw / 2, -cw + .2, lw / 2); ln(cw - .2, -lw / 2, cw - .1, lw / 2); // marcas centrais
  q3dRede(L, g, ch + .914, 1.07, .914, true);
  q3dCerca(L, g, W - .05, H - .05, 3.6);
  const aco = q3dMat('#3a4148'), corpo = q3dMat('#22262a'), lente = q3dMat('#fff6d0', 'luz'), hp = 8;
  [[-9, -1], [9, -1], [-9, 1], [9, 1]].forEach(([x, s]) => {
    const z = s * (H - .4), incl = s * .65; // refletores inclinados para dentro da quadra
    L.tubo(aco, [x, E, z], [x, E + hp, z], .07);
    L.tubo(aco, [x - 1, E + hp - .12, z], [x + 1, E + hp - .12, z], .04);
    [-.75, -.25, .25, .75].forEach(dx => {
      L.caixa(corpo, x + dx, E + hp - .3, z - s * .12, .36, .09, .28, incl);
      L.caixa(lente, x + dx, E + hp - .3 - Math.cos(incl) * .05, z - s * .12 - Math.sin(incl) * .05, .32, .012, .24, incl);
    });
  });
}
// Quadra infantil: mesmas proporções do desenho 2D, rede de 0,80 m e alambrado de 2 m
function q3dInfantil(b, L, g) {
  const W = b.w / 2, H = b.h / 2, cw = Math.min(7, W - .5), ch = Math.min(3.2, H - .4), sv = Math.min(3, cw - .5), lw = .05;
  q3dPiso(L, b, '#5b9b4a', cw, ch, '#ef7d3c');
  const ln = (x0, z0, x1, z1) => q3dLinha(L, '#ffffff', x0, z0, x1, z1);
  ln(-cw, -ch, -cw + lw, ch); ln(cw - lw, -ch, cw, ch); ln(-cw, -ch, cw, -ch + lw); ln(-cw, ch - lw, cw, ch);
  ln(-sv - lw / 2, -ch, -sv + lw / 2, ch); ln(sv - lw / 2, -ch, sv + lw / 2, ch); ln(-sv, -lw / 2, sv, lw / 2);
  q3dRede(L, g, ch + .4, .8, .8, false);
  q3dCerca(L, g, W - .05, H - .05, 2);
}
// Padel (20 × 10 m): vidro de 3 m nos fundos e nos 2 m iniciais das laterais, tela no restante e rede de 0,88 m
function q3dPadel(b, L, g) {
  const cw = 10, ch = 5, sv = 6.95, lw = .05, alt = 3, E = Q3D.E;
  q3dPiso(L, b, '#33414d', cw, ch, '#2a6db5');
  const ln = (x0, z0, x1, z1) => q3dLinha(L, '#ffffff', x0, z0, x1, z1);
  ln(-sv - lw / 2, -ch, -sv + lw / 2, ch); ln(sv - lw / 2, -ch, sv + lw / 2, ch); ln(-sv, -lw / 2, sv, lw / 2);
  q3dRede(L, g, ch, .88, .88, false);
  const aco = q3dMat('#2b3036'), vidro = q3dMat('#bfe6ff', 'vidro'), tela = q3dMat('#4d565e', 'tela');
  const montante = (x, z) => L.caixa(aco, x, E + alt / 2, z, .08, alt, .08);
  [-cw, cw].forEach(x => {
    for (let z = -ch; z <= ch + .01; z += 2) montante(x, z);
    L.caixa(aco, x, E + alt, 0, .08, .08, ch * 2);
    g.add(q3dFaixa(vidro, [[x, -ch, E + .05, E + alt], [x, ch, E + .05, E + alt]], 1));
  });
  [-ch, ch].forEach(z => {
    [-cw + 2, -4, 0, 4, cw - 2].forEach(x => montante(x, z));
    L.caixa(aco, 0, E + alt, z, cw * 2, .08, .08);
    g.add(q3dFaixa(vidro, [[-cw, z, E + .05, E + alt], [-cw + 2, z, E + .05, E + alt]], 1));
    g.add(q3dFaixa(vidro, [[cw - 2, z, E + .05, E + alt], [cw, z, E + .05, E + alt]], 1));
    g.add(q3dFaixa(tela, [[-cw + 2, z, E + .05, E + alt], [cw - 2, z, E + .05, E + alt]], .085));
  });
}
function q3dMonta() {
  const T = Q3D.T, raiz = Q3D.raiz;
  Q3D.dirty = false; Q3D.sombraSuja = true;
  Q3D.itens.forEach(it => [it.g, it.gs].forEach(g => { raiz.remove(g); g.traverse(o => { if (o.isInstancedMesh) o.dispose(); else if (o.geometry) o.geometry.dispose(); }); }));
  Q3D.itens = [];
  if (LOD3D !== 'detalhe' || !CAM3D.proj) return;
  const quadras = blocks.filter(b => TYPES[b.kind].court && vis[visKey(b.kind)]);
  if (!quadras.length) return;
  // origem da cena no meio das quadras; "cena" converte longitude e latitude em metros a leste e a norte dessa origem
  const lng0 = quadras.reduce((s, b) => s + b.lng, 0) / quadras.length, lat0 = quadras.reduce((s, b) => s + b.lat, 0) / quadras.length;
  const o = maplibregl.MercatorCoordinate.fromLngLat([lng0, lat0], 0), esc = o.meterInMercatorCoordinateUnits();
  Q3D.org = {x: o.x, y: o.y, s: esc};
  const cena = Q3D.emMetros = (lng, lat) => { const m = maplibregl.MercatorCoordinate.fromLngLat([lng, lat], 0); return [(m.x - o.x) / esc, (o.y - m.y) / esc]; };
  let raio = 0;
  quadras.forEach(b => {
    // os eixos do bloco saem do mesmo toLL do desenho 2D, para o modelo cair exatamente sobre a pegada no mapa
    const p0 = toLL(b, 0, 0), px = toLL(b, 1, 0), pz = toLL(b, 0, 1), a = cena(p0[1], p0[0]), ax = cena(px[1], px[0]), az = cena(pz[1], pz[0]);
    const g = new T.Group(), gs = new T.Group(), L = q3dLote(); g.matrixAutoUpdate = gs.matrixAutoUpdate = false;
    g.matrix.makeBasis(new T.Vector3(ax[0] - a[0], 0, ax[1] - a[1]), new T.Vector3(0, 1, 0), new T.Vector3(az[0] - a[0], 0, az[1] - a[1])).setPosition(a[0], 0, a[1]);
    (b.kind === 'padel' ? q3dPadel : b.kind === 'infantil' ? q3dInfantil : q3dTenis)(b, L, g);
    L.monta(g); raiz.add(g); raiz.add(gs);
    Q3D.itens.push({b, g, gs, e: null}); // g = modelo da quadra; gs = sombras do estudo sobre o piso
    raio = Math.max(raio, Math.hypot(a[0], a[1]) + Math.hypot(b.w, b.h) / 2);
  });
  Q3D.raio = raio + 2;
  q3dEstudo();
}
// Sombras do estudo de insolação (leve: telas e vidros; forte: edificações, árvores e vizinhos) recortadas em cada quadra
// e desenhadas logo acima do piso, porque o piso em Three.js cobre as sombras do mapa
function q3dEstudo() {
  const T = Q3D.T, pontos = anel => anel.slice(0, -1).map(p => { const q = Q3D.emMetros(p[0], p[1]); return new T.Vector2(q[0], -q[1]); });
  Q3D.estudoSujo = false;
  Q3D.itens.forEach(it => {
    it.gs.children.slice().forEach(m => { it.gs.remove(m); m.geometry.dispose(); });
    if (!Q3D.estudo || !CAM3D.sombra || !it.b.ring) return;
    [[Q3D.estudo.leve, '.18'], [Q3D.estudo.forte, '.42']].forEach(([f, op]) => {
      let x = null; try { x = f && turf.intersect(f, polyFeat(it.b.ring)); } catch (e) {}
      if (!x) return;
      (x.geometry.type === 'Polygon' ? [x.geometry.coordinates] : x.geometry.coordinates).forEach(aneis => {
        const forma = new T.Shape(pontos(aneis[0])); aneis.slice(1).forEach(r => forma.holes.push(new T.Path(pontos(r))));
        const geo = new T.ShapeGeometry(forma); geo.rotateX(-Math.PI / 2);
        it.gs.add(new T.Mesh(geo, q3dMat('#08121c', 'sombra' + op)));
      });
    });
  });
}
// Cada quadra fica na cota do terreno do 3D (que já inclui as plataformas e o exagero do relevo)
function q3dCotas() {
  let soma = 0;
  Q3D.itens.forEach(it => {
    const e = map3d.queryTerrainElevation([it.b.lng, it.b.lat]) || 0; soma += e;
    if (it.e !== null && Math.abs(e - it.e) < .005) return;
    it.e = e; it.g.matrix.elements[13] = e; it.gs.matrix.elements[13] = e + Q3D.E + .012;
    it.g.matrixWorldNeedsUpdate = it.gs.matrixWorldNeedsUpdate = true; Q3D.sombraSuja = true;
  });
  Q3D.centro[1] = Q3D.itens.length ? soma / Q3D.itens.length : 0;
}
// Sol do estudo de insolação: ilumina o modelo e projeta as sombras (câmera de sombra cobrindo todas as quadras)
function q3dSol() {
  const rad = Math.PI / 180, a = Q3D.sol.az * rad, h = Q3D.sol.alt * rad, c = Q3D.centro, D = 200, k = Q3D.raio, luz = Q3D.solL, cam = luz.shadow.camera;
  luz.position.set(c[0] + Math.sin(a) * Math.cos(h) * D, c[1] + Math.sin(h) * D, c[2] + Math.cos(a) * Math.cos(h) * D);
  luz.target.position.set(c[0], c[1], c[2]);
  cam.left = -k; cam.right = k; cam.top = k; cam.bottom = -k; cam.near = 1; cam.far = D * 2; cam.updateProjectionMatrix();
  const lado = k > 45 ? 4096 : 2048;
  if (luz.shadow.mapSize.x !== lado) { luz.shadow.mapSize.set(lado, lado); if (luz.shadow.map) { luz.shadow.map.dispose(); luz.shadow.map = null; } }
  luz.castShadow = CAM3D.sombra && !Q3D.sol.noite;
}
function q3dDesenha(gl, args) {
  const r = Q3D.rend;
  if (Q3D.dirty) q3dMonta(); else if (Q3D.estudoSujo) q3dEstudo();
  if (!Q3D.itens.length) return;
  q3dCotas();
  // a câmera é a do mapa: matriz do MapLibre × posição da origem da cena em coordenadas Mercator
  const o = Q3D.org, faixa = gl.getParameter(gl.DEPTH_RANGE);
  Q3D.cam.projectionMatrix.fromArray(args.defaultProjectionData.mainMatrix).multiply(Q3D.mL.makeTranslation(o.x, o.y, 0).scale(Q3D.v.set(o.s, -o.s, o.s)));
  r.resetState(); r.setViewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
  if (Q3D.sombraSuja) { // o mapa de sombras só é refeito quando o sol, o modelo ou as cotas mudam
    Q3D.sombraSuja = false; q3dSol();
    gl.depthRange(0, 1); r.shadowMap.needsUpdate = true;
    r.setRenderTarget(Q3D.rt); r.render(Q3D.cena, Q3D.cam); r.setRenderTarget(null);
  }
  gl.depthRange(faixa[0], faixa[1]);
  r.render(Q3D.cena, Q3D.cam);
}
function q3dCamada() {
  if (!Q3D.on || !map3d || map3d.getLayer('quadras3d')) return;
  const T = Q3D.T;
  try {
    map3d.addLayer({id: 'quadras3d', type: 'custom', renderingMode: '3d',
      onAdd(m, gl) {
        Q3D.cam = new T.Camera(); Q3D.cena = new T.Scene();
        // No Three.js o Y aponta para cima: a raiz gira e espelha a cena para X = leste, Y = altura e Z = norte
        Q3D.raiz = new T.Group(); Q3D.raiz.rotation.x = Math.PI / 2; Q3D.raiz.scale.z = -1; Q3D.cena.add(Q3D.raiz);
        Q3D.rend = new T.WebGLRenderer({canvas: m.getCanvas(), context: gl, antialias: true});
        Q3D.rend.autoClear = false; Q3D.rend.shadowMap.enabled = true; Q3D.rend.shadowMap.type = T.PCFShadowMap; Q3D.rend.shadowMap.autoUpdate = false;
        Q3D.rt = new T.WebGLRenderTarget(1, 1);
        Q3D.geo = {caixa: new T.BoxGeometry(1, 1, 1), tubo: new T.CylinderGeometry(1, 1, 1, 10)};
        Q3D.raiz.add(new T.HemisphereLight(0xe8f1fb, 0xb9ad98, 1.25));
        Q3D.solL = new T.DirectionalLight(0xfff3dd, 2.4);
        Q3D.solL.shadow.mapSize.set(2048, 2048); Q3D.solL.shadow.bias = -.0001; Q3D.solL.shadow.normalBias = .03; Q3D.solL.shadow.intensity = .75;
        Q3D.raiz.add(Q3D.solL); Q3D.raiz.add(Q3D.solL.target);
        Q3D.mL = new T.Matrix4(); Q3D.v = new T.Vector3();
      },
      render(gl, args) { try { q3dDesenha(gl, args); } catch (e) { q3dFalha(e); } }
    });
  } catch (e) { q3dFalha(e); }
}
