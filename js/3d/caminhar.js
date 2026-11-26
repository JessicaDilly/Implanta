// ---------- Caminhar: câmera na altura dos olhos, como no Street View ----------
// A posição é guardada em longitude e latitude; "rumo" é para onde a pessoa olha (0 = norte, sentido horário) e
// "olhar" é a inclinação da vista (positivo para cima). A cada quadro a câmera do mapa é recolocada a 1,60 m do chão.
const WALK = {on: false, lng: 0, lat: 0, rumo: 0, olhar: 0, alt: null, elev: 0, fov: 60, teclas: new Set(), joy: [0, 0], raf: 0, t0: 0, antes: null, alvo: null, sujo: true};
const WALK_OLHO = 1.6, WALK_VEL = 3.5, WALK_FRENTE = 10;
const WALK_TECLAS = {KeyW: 1, KeyA: 1, KeyS: 1, KeyD: 1, KeyQ: 1, KeyE: 1, ArrowUp: 1, ArrowDown: 1, ArrowLeft: 1, ArrowRight: 1, ShiftLeft: 1, ShiftRight: 1};
const WALK_DICA_3D = 'Arraste com o botão direito (ou dois dedos) para girar e inclinar.';
// Campo de visão de uns 85° na horizontal, parecido com o do Street View (o padrão do mapa é bem mais fechado)
function walkFov() {
  const c = map3d.getCanvas(), asp = c.clientWidth / Math.max(1, c.clientHeight);
  WALK.fov = Math.max(45, Math.min(75, 2 * Math.atan(Math.tan(42.5 * Math.PI / 180) / asp) * 180 / Math.PI));
  map3d.setVerticalFieldOfView(WALK.fov); WALK.sujo = true;
  $('walk-joy').style.bottom = (document.querySelector('.v3d-bar').offsetHeight + 30) + 'px'; // o controle fica logo acima da barra, em qualquer tela
}
function walkCam() {
  const rad = Math.PI / 180, a = WALK.rumo * rad, o = WALK.olhar * rad, dh = WALK_FRENTE * Math.cos(o), h = WALK.alt + WALK_OLHO;
  const de = new maplibregl.LngLat(WALK.lng, WALK.lat);
  const para = new maplibregl.LngLat(WALK.lng + Math.sin(a) * dh / (R * Math.cos(WALK.lat * rad)), WALK.lat + Math.cos(a) * dh / R);
  const op = map3d.calculateCameraOptionsFromTo(de, h, para, h + WALK_FRENTE * Math.sin(o));
  WALK.elev = op.elevation; map3d.jumpTo(op);
}
function walkMove(leste, norte) { WALK.lat += norte / R; WALK.lng += leste / (R * Math.cos(WALK.lat * Math.PI / 180)); WALK.sujo = true; }
function walkLoop(agora) {
  if (!WALK.on) return;
  const dt = Math.min(.05, (agora - WALK.t0) / 1000), T = WALK.teclas; WALK.t0 = agora;
  const frente = (T.has('KeyW') || T.has('ArrowUp') ? 1 : 0) - (T.has('KeyS') || T.has('ArrowDown') ? 1 : 0) - WALK.joy[1];
  const lado = (T.has('KeyD') ? 1 : 0) - (T.has('KeyA') ? 1 : 0);
  const giro = (T.has('ArrowRight') || T.has('KeyE') ? 1 : 0) - (T.has('ArrowLeft') || T.has('KeyQ') ? 1 : 0) + WALK.joy[0];
  if (giro) { WALK.rumo += giro * 75 * dt; WALK.sujo = true; }
  if (frente || lado) {
    const a = WALK.rumo * Math.PI / 180, v = WALK_VEL * (T.has('ShiftLeft') || T.has('ShiftRight') ? 2.4 : 1) * dt;
    walkMove((Math.sin(a) * frente + Math.cos(a) * lado) * v, (Math.cos(a) * frente - Math.sin(a) * lado) * v); WALK.alvo = null;
  } else if (WALK.alvo) { // deslocamento suave até o ponto tocado
    const A = WALK.alvo; A.t = Math.min(1, A.t + dt / A.dur);
    const k = A.t * A.t * (3 - 2 * A.t);
    WALK.lng = A.lng0 + (A.lng1 - A.lng0) * k; WALK.lat = A.lat0 + (A.lat1 - A.lat0) * k; WALK.sujo = true;
    if (A.t >= 1) WALK.alvo = null;
  }
  // os olhos acompanham o relevo aos poucos, sem degraus
  const chao = map3d.queryTerrainElevation([WALK.lng, WALK.lat]) || 0;
  if (WALK.alt === null) { WALK.alt = chao; WALK.sujo = true; }
  else if (Math.abs(chao - WALK.alt) > 3) { WALK.alt = chao; WALK.sujo = true; } // salto grande (relevo ligado ou desligado): sem transição
  else if (Math.abs(chao - WALK.alt) > .01) { WALK.alt += (chao - WALK.alt) * Math.min(1, dt * 8); WALK.sujo = true; }
  // quando o relevo é refeito (camadas, exagero, novos dados) o mapa recoloca o centro da vista no chão e a câmera
  // afunda no terreno; se a cota do centro não é mais a que foi pedida, a câmera é reposta
  if (Math.abs(map3d.getCenterElevation() - WALK.elev) > .02) WALK.sujo = true;
  if (WALK.sujo) { WALK.sujo = false; walkCam(); }
  WALK.raf = requestAnimationFrame(walkLoop);
}
// Toque no chão: vai até o ponto (no máximo 60 m por vez), como o clique do Street View
function walkIr(x, y) {
  const rad = Math.PI / 180, h = map3d.getCanvas().clientHeight;
  const horizonte = h / 2 + Math.tan(WALK.olhar * rad) * (h / 2) / Math.tan(WALK.fov * rad / 2);
  if (y < horizonte + 12) return; // acima do horizonte não há chão
  let ll = null; try { ll = map3d.unproject([x, y]); } catch (e) {}
  if (!ll || !isFinite(ll.lng) || !isFinite(ll.lat)) return;
  const d = Math.hypot((ll.lng - WALK.lng) * R * Math.cos(WALK.lat * rad), (ll.lat - WALK.lat) * R);
  if (d < .5) return;
  const k = Math.min(1, 60 / d);
  WALK.alvo = {lng0: WALK.lng, lat0: WALK.lat, lng1: WALK.lng + (ll.lng - WALK.lng) * k, lat1: WALK.lat + (ll.lat - WALK.lat) * k, t: 0, dur: Math.max(.5, Math.min(2.4, d * k / 9))};
}
function walkEntra() {
  if (!map3d || WALK.on) return;
  if (MED.on) medToggle(false);
  $('v3d-cam').hidden = true;
  WALK.antes = {center: map3d.getCenter(), zoom: map3d.getZoom(), pitch: map3d.getPitch(), bearing: map3d.getBearing(), fov: map3d.getVerticalFieldOfView()};
  // ponto de partida: fora do canto da quadra mais próxima do centro da vista, olhando para ela; sem quadra, o centro da vista
  const c = map3d.getCenter(), dist = b => map.distance([b.lat, b.lng], [c.lat, c.lng]);
  const q = blocks.filter(b => TYPES[b.kind].court && vis[visKey(b.kind)]).sort((a, b) => dist(a) - dist(b))[0];
  if (q) {
    const p = toLL(q, -(q.w / 2 + 4), -(q.h / 2 + 3)); WALK.lat = p[0]; WALK.lng = p[1];
    WALK.rumo = Math.atan2((q.lng - p[1]) * Math.cos(q.lat * Math.PI / 180), q.lat - p[0]) * 180 / Math.PI;
  } else { WALK.lat = c.lat; WALK.lng = c.lng; WALK.rumo = map3d.getBearing(); }
  WALK.olhar = -4; WALK.alt = null; WALK.alvo = null; WALK.teclas.clear(); WALK.joy = [0, 0]; WALK.on = true;
  document.body.classList.add('walk'); $('walk-pad').hidden = false; $('walk-joy').hidden = false;
  $('v3d-walk').classList.add('on-sol'); $('v3d-walk').textContent = '✕ Sair da caminhada';
  $('v3d-dica').textContent = temHover ? 'Arraste para olhar em volta e clique no chão para ir até o ponto. Teclas W A S D ou setas para andar, Esc para sair.' : 'Arraste para olhar em volta e toque no chão para ir até o ponto. O controle à direita anda e vira.';
  map3d.stop(); map3d.setCenterClampedToGround(false); map3d.setMaxPitch(150); walkFov(); chao3D();
  WALK.t0 = performance.now(); WALK.raf = requestAnimationFrame(walkLoop);
}
function walkSai() {
  if (!WALK.on) return;
  WALK.on = false; cancelAnimationFrame(WALK.raf); WALK.teclas.clear(); WALK.joy = [0, 0];
  document.body.classList.remove('walk'); $('walk-pad').hidden = true; $('walk-joy').hidden = true;
  $('v3d-walk').classList.remove('on-sol'); $('v3d-walk').textContent = '🚶 Caminhar'; $('v3d-dica').textContent = WALK_DICA_3D;
  chao3D();
  // volta para a vista de maquete em que a pessoa estava
  const A = WALK.antes;
  map3d.setVerticalFieldOfView(A.fov); map3d.jumpTo({pitch: Math.min(A.pitch, 80)}); map3d.setMaxPitch(80); map3d.setCenterClampedToGround(true);
  map3d.jumpTo({center: A.center, zoom: A.zoom, pitch: A.pitch, bearing: A.bearing});
}
(() => {
  const pad = $('walk-pad'), joy = $('walk-joy'), pino = joy.firstElementChild; let P = null;
  // arrastar gira a vista como quem puxa a paisagem; toque curto sem arrastar vai até o ponto
  pad.addEventListener('pointerdown', e => { try { pad.setPointerCapture(e.pointerId); } catch (x) {} P = {id: e.pointerId, x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY, t: performance.now(), moveu: false}; });
  pad.addEventListener('pointermove', e => {
    if (!P || e.pointerId !== P.id) return;
    if (!P.moveu && Math.hypot(e.clientX - P.x0, e.clientY - P.y0) > 6) P.moveu = true;
    if (P.moveu) { const k = WALK.fov / Math.max(1, pad.clientHeight); WALK.rumo -= (e.clientX - P.x) * k; WALK.olhar = Math.max(-40, Math.min(55, WALK.olhar + (e.clientY - P.y) * k)); WALK.sujo = true; }
    P.x = e.clientX; P.y = e.clientY;
  });
  const solta = e => {
    if (!P || e.pointerId !== P.id) return;
    const toque = e.type === 'pointerup' && !P.moveu && performance.now() - P.t < 450; P = null;
    if (toque) { const r = pad.getBoundingClientRect(); walkIr(e.clientX - r.left, e.clientY - r.top); }
  };
  pad.addEventListener('pointerup', solta); pad.addEventListener('pointercancel', solta);
  pad.addEventListener('wheel', e => { e.preventDefault(); const a = WALK.rumo * Math.PI / 180, d = e.deltaY < 0 ? 2 : -2; walkMove(Math.sin(a) * d, Math.cos(a) * d); WALK.alvo = null; }, {passive: false});
  // controle: para cima e para baixo anda, para os lados vira
  const mexe = e => {
    const r = joy.getBoundingClientRect(), raio = r.width / 2; let x = (e.clientX - r.left - raio) / raio, y = (e.clientY - r.top - raio) / raio;
    const m = Math.hypot(x, y); if (m > 1) { x /= m; y /= m; }
    WALK.joy = [Math.abs(x) < .15 ? 0 : x, Math.abs(y) < .15 ? 0 : y]; pino.style.transform = `translate(${x * 34}px,${y * 34}px)`;
  };
  const para = e => { if (joy.dataset.id !== String(e.pointerId)) return; delete joy.dataset.id; WALK.joy = [0, 0]; pino.style.transform = ''; };
  joy.addEventListener('pointerdown', e => { try { joy.setPointerCapture(e.pointerId); } catch (x) {} joy.dataset.id = e.pointerId; mexe(e); });
  joy.addEventListener('pointermove', e => { if (joy.dataset.id === String(e.pointerId)) mexe(e); });
  joy.addEventListener('pointerup', para); joy.addEventListener('pointercancel', para);
  addEventListener('keydown', e => {
    if (!WALK.on || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
    if (e.key === 'Escape') { walkSai(); return; }
    if (WALK_TECLAS[e.code] && !e.ctrlKey && !e.metaKey) { WALK.teclas.add(e.code); if (e.code.startsWith('Arrow')) e.preventDefault(); }
  });
  addEventListener('keyup', e => WALK.teclas.delete(e.code));
  addEventListener('blur', () => WALK.teclas.clear());
  $('v3d-walk').onclick = () => { if (WALK.on) walkSai(); else walkEntra(); };
})();
