// ---------- Seleção na tela (estilo Spacio): arrastar o bloco, esticar pelos lados e girar ----------
const hIcon = (cls, s) => L.divIcon({className: '', iconSize: [s, s], iconAnchor: [s / 2, s / 2], html: `<div class="${cls}"></div>`});
const moveH = L.marker([0, 0], {draggable: true, zIndexOffset: 1000, icon: hIcon('h-move', 26), title: 'Mover'});
const rotH = L.marker([0, 0], {draggable: true, zIndexOffset: 1001, icon: L.divIcon({className: '', iconSize: [30, 30], iconAnchor: [15, 15],
  html: '<div class="h-rot"><svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M20 12a8 8 0 1 1-2.6-5.9"/><path d="M20 4v5h-5"/></svg></div>'}), title: 'Girar'});
// alças de esticar: +x, −x, +y, −y no sistema do bloco (x = largura L, y = comprimento C)
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const stretchH = SIDES.map(([sx, sy]) => L.marker([0, 0], {draggable: true, zIndexOffset: 1000, icon: hIcon(sx ? 'h-str h-ew' : 'h-str h-ns', 18), title: 'Esticar'}));
const dimLbl = L.marker([0, 0], {interactive: false, keyboard: false, zIndexOffset: 900, icon: L.divIcon({className: 'dim-lbl', html: '', iconSize: [140, 22], iconAnchor: [70, -6]})});
const canStretch = b => !(b.kind === 'dxf' || b.kind === 'planta');
function toLL(b, x, y) {
  const a = b.angle * Math.PI / 180, kx = 1 / (R * Math.cos(b.lat * Math.PI / 180));
  return [b.lat + (x * Math.sin(a) + y * Math.cos(a)) / R, b.lng + (x * Math.cos(a) - y * Math.sin(a)) * kx];
}
function toLocal(b, ll) {
  const a = b.angle * Math.PI / 180, dx = (ll.lng - b.lng) * R * Math.cos(b.lat * Math.PI / 180), dy = (ll.lat - b.lat) * R;
  return [dx * Math.cos(a) + dy * Math.sin(a), -dx * Math.sin(a) + dy * Math.cos(a)];
}
function rotPos(b) { return toLL(b, 0, b.h / 2 + Math.max(2.5, 34 * mpp())); }
function dimText(b) { return `${fmt(b.w)} × ${fmt(b.h)} m · ${Math.round(b.angle)}°`; }
function placeHandles() {
  if (!sel) return;
  moveH.setLatLng([sel.lat, sel.lng]); rotH.setLatLng(rotPos(sel));
  stretchH.forEach((m, i) => { const [sx, sy] = SIDES[i]; m.setLatLng(toLL(sel, sx * sel.w / 2, sy * sel.h / 2)); });
  dimLbl.setLatLng(toLL(sel, 0, -sel.h / 2 - 1)); const el = dimLbl.getElement(); if (el) el.innerHTML = `<span>${dimText(sel)}</span>`;
}
function select(b) {
  sel = b;
  if (b) {
    moveH.addTo(map); rotH.addTo(map); dimLbl.addTo(map);
    stretchH.forEach(m => { if (canStretch(b)) m.addTo(map); else m.remove(); });
    placeHandles(); renderCtx();
  } else { moveH.remove(); rotH.remove(); dimLbl.remove(); stretchH.forEach(m => m.remove()); $('ctx').hidden = true; }
  updateAll();
}
moveH.on('drag', e => {
  if (!sel) return;
  const p = e.target.getLatLng(); sel.lat = p.lat; sel.lng = p.lng;
  orient(sel); placeHandles(); updateAll();
});
rotH.on('drag', e => {
  if (!sel) return;
  const p = e.target.getLatLng();
  const dx = (p.lng - sel.lng) * R * Math.cos(sel.lat * Math.PI / 180), dy = (p.lat - sel.lat) * R;
  let ang = Math.round(Math.atan2(dy, dx) * 180 / Math.PI) - 90; // a alça fica no lado +C (90° do eixo L)
  const snap = Math.round(ang / 15) * 15; if (Math.abs(ang - snap) <= 3) ang = snap; // ímã a cada 15°
  sel.angle = ((ang % 360) + 360) % 360;
  orient(sel); placeHandles(); updateAll(); syncCtx();
});
// Esticar: o lado oposto fica parado; quadras respeitam os limites do escape
stretchH.forEach((m, i) => {
  m.on('drag', e => {
    if (!sel) return;
    const b = sel, [sx, sy] = SIDES[i], [u, v] = toLocal(b, e.target.getLatLng());
    const t = TYPES[b.kind], lo = t.court ? courtMin(b.kind) : {w: 1, h: 1}, hi = t.court ? courtMax(b.kind) : {w: 500, h: 500};
    if (sx) {
      let nw = sx > 0 ? u + b.w / 2 : b.w / 2 - u; nw = Math.round(Math.min(hi.w, Math.max(lo.w, nw)) * 10) / 10;
      const shift = sx * (nw - b.w) / 2; const c = toLL(b, shift, 0); b.lat = c[0]; b.lng = c[1]; b.w = nw;
      if (b.kind === 'arvore') b.h = nw;
    } else {
      let nh = sy > 0 ? v + b.h / 2 : b.h / 2 - v; nh = Math.round(Math.min(hi.h, Math.max(lo.h, nh)) * 10) / 10;
      const shift = sy * (nh - b.h) / 2; const c = toLL(b, 0, shift); b.lat = c[0]; b.lng = c[1]; b.h = nh;
      if (b.kind === 'arvore') b.w = nh;
    }
    buildSvg(b); placeHandles(); updateAll(); syncCtx();
  });
  m.on('dragend', () => { placeHandles(); renderCtx(); commit(); });
});
rotH.on('dragend', () => { placeHandles(); commit(); });
moveH.on('dragend', () => commit());
function rotateBy(d) { if (!sel) return; sel.angle = (((sel.angle + d) % 360) + 360) % 360; orient(sel); placeHandles(); updateAll(); syncCtx(); commit(); }
// Arrastar o próprio bloco (mouse ou um dedo)
let bodyDrag = null;
function startBodyDrag(b, ev) {
  if (tool === 'pincel' || tool === 'medir' || tool === 'caminhos' || (tool === 'lote' && mode === 'vertices') || (typeof TERR !== 'undefined' && TERR.prof)) return;
  if (ev.button !== undefined && ev.button !== 0) return;
  if (sel !== b) select(b);
  const p0 = map.mouseEventToLatLng(ev);
  bodyDrag = {b, id: ev.pointerId, p0, c0: [b.lat, b.lng], moved: false};
  map.dragging.disable();
  ev.stopPropagation(); ev.preventDefault();
}
document.addEventListener('pointermove', ev => {
  if (!bodyDrag || ev.pointerId !== bodyDrag.id) return;
  const p = map.mouseEventToLatLng(ev), b = bodyDrag.b;
  b.lat = bodyDrag.c0[0] + (p.lat - bodyDrag.p0.lat); b.lng = bodyDrag.c0[1] + (p.lng - bodyDrag.p0.lng);
  bodyDrag.moved = true; orient(b); placeHandles(); updateAll();
});
const endBodyDrag = ev => {
  if (!bodyDrag || (ev && ev.pointerId !== bodyDrag.id)) return;
  const moved = bodyDrag.moved; bodyDrag = null; lastHit = Date.now();
  if (tool !== 'pincel') map.dragging.enable();
  if (moved) commit();
};
document.addEventListener('pointerup', endBodyDrag);
document.addEventListener('pointercancel', endBodyDrag);
// segundo dedo: cancela o arraste para deixar o giro com dois dedos funcionar
document.addEventListener('pointerdown', ev => { if (bodyDrag && ev.pointerId !== bodyDrag.id) { bodyDrag = null; map.dragging.enable(); } }, true);

function mkBtn(text, fn) { const b = document.createElement('button'); b.className = 'btn'; b.textContent = text; b.onclick = fn; return b; }
function field(text, value, step, onChange, key, min, max) {
  const l = document.createElement('label'); l.append(text);
  const i = document.createElement('input'); i.type = 'number'; i.step = step; i.value = value; if (key) i.dataset.k = key;
  const clamp = v => Math.min(max ?? Infinity, Math.max(min ?? -Infinity, v));
  if (min !== undefined) { i.min = min; i.max = max; }
  i.addEventListener('input', () => { const v = parseFloat(i.value); if (!isNaN(v)) onChange(clamp(v)); });
  i.addEventListener('change', () => { const v = clamp(parseFloat(i.value) || 0); i.value = v; onChange(v); commit(); });
  l.appendChild(i); return l;
}
function renderCtx() {
  const b = sel, c = $('ctx'); c.hidden = false; c.innerHTML = '';
  const nm = document.createElement('b'); nm.textContent = b.name; c.appendChild(nm);
  c.appendChild(mkBtn('⟲ 15°', () => rotateBy(15)));
  c.appendChild(field('', b.angle, 1, v => { b.angle = v; orient(b); placeHandles(); updateAll(); }, 'ang'));
  c.appendChild(mkBtn('⟳ 15°', () => rotateBy(-15)));
  if (TYPES[b.kind].court) {
    // escape editável entre 32 × 16 m e 36 × 18 m; a área de jogo oficial não muda
    c.appendChild(field('L', b.w, 0.5, v => { b.w = v; buildSvg(b); placeHandles(); updateAll(); }, null, courtMin(b.kind).w, courtMax(b.kind).w));
    c.appendChild(field('C', b.h, 0.5, v => { b.h = v; buildSvg(b); updateAll(); }, null, courtMin(b.kind).h, courtMax(b.kind).h));
  } else if (b.kind !== 'dxf') {
    c.appendChild(field(b.kind === 'arvore' ? 'Ø' : 'L', b.w, 0.1, v => {
      if (v <= 0) return; b.w = v; if (b.kind === 'arvore') b.h = v; buildSvg(b); placeHandles(); updateAll();
    }));
    if (b.kind !== 'arvore') c.appendChild(field('C', b.h, 0.1, v => { if (v <= 0) return; b.h = v; buildSvg(b); updateAll(); }));
  }
  if (PLAT_KINDS[b.kind]) {
    const l = document.createElement('label'); l.className = 'pro-only'; l.append('Cota');
    const i = document.createElement('input'); i.type = 'number'; i.step = 0.1; i.placeholder = 'auto'; i.value = b.cota ?? ''; i.title = 'Cota da plataforma (m). Vazio = média do terreno sob o bloco.';
    i.addEventListener('change', () => { const v = i.value.trim(); if (v === '') delete b.cota; else b.cota = parseFloat(v.replace(',', '.')); commit(); terrRefresh(); });
    l.appendChild(i); c.appendChild(l);
  }
  if (PAV_KINDS[b.kind]) { const lp = field('Pav.', pavOf(b), 1, v => { b.pav = Math.max(1, Math.round(v)); updateAll(); }, null, 1, 60); lp.classList.add('pro-only'); c.appendChild(lp); }
  if (ALT_DEF[b.kind] !== undefined) { const la = field('Alt.', altOf(b), 0.5, v => { if (v < 0) return; b.alt = v; if (solOn) drawSun(); }, null, 0, 200); la.classList.add('pro-only'); c.appendChild(la); }
  c.appendChild(mkBtn('Duplicar', () => duplicate(b)));
  c.appendChild(mkBtn('Excluir', () => removeBlock(b)));
  c.appendChild(mkBtn('✕', () => select(null)));
}
function syncCtx() { const i = $('ctx').querySelector('[data-k=ang]'); if (i && document.activeElement !== i) i.value = sel.angle; }
