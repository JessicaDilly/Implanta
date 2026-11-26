// ---------- Blocos ----------
function buildSvg(b) {
  if (b.ov) blockLayer.removeLayer(b.ov);
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('preserveAspectRatio', 'none');
  svg.style.overflow = 'visible';
  svg.innerHTML = `<g>${svgContent(b.kind, b.w, b.h, 'u' + (uidSeq++), b.kind === 'edif' ? b.name : '', b.src)}</g>`;
  // grava o traço fixo como atributo, para valer também na exportação em PDF
  svg.querySelectorAll('.nss, .nss *').forEach(el => el.setAttribute('vector-effect', 'non-scaling-stroke'));
  b.svg = svg; b.g = svg.firstChild;
  b.ov = L.svgOverlay(svg, bounds(b), {pane: 'blocks', interactive: true}).addTo(blockLayer);
  svg.addEventListener('pointerdown', ev => startBodyDrag(b, ev));
  svg.style.cursor = 'move';
  b.ov.on('click', e => {
    if (tool === 'pincel') return;
    lastHit = Date.now();
    if (tool === 'lote' && mode === 'vertices') addVertex(e.latlng);
    else if (tool === 'medir') addMeasure(e.latlng);
    else if (tool === 'caminhos') camPonto(e.latlng);
    else select(b);
  });
  orient(b);
}
function orient(b) {
  const [W, H] = dims(b);
  b.svg.setAttribute('viewBox', `${-W / 2} ${-H / 2} ${W} ${H}`);
  b.g.setAttribute('transform', `rotate(${-b.angle})`);
  b.ov.setBounds(bounds(b));
}
function spawn(o) {
  const b = {...o, id: nextId++};
  b.outline = L.polygon([[0, 0], [0, 0], [0, 0]], {pane: 'outlines', interactive: false, fill: false, weight: 0}).addTo(blockLayer);
  blocks.push(b);
  buildSvg(b);
  return b;
}
function addBlock(item, at) {
  const c = at || map.getCenter(), t = TYPES[item.kind];
  const base = (item.kind === 'planta' || item.kind === 'dxf') ? item.name : item.kind === 'arvore' && TREES[item.src] ? TREES[item.src].name : t.label;
  const n = blocks.filter(x => x.base === base).length + 1;
  const b = spawn({kind: item.kind, base, name: base + ' ' + n, w: item.w ?? t.w, h: item.h ?? t.h,
                   angle: item.angle || 0, lat: c.lat, lng: c.lng, src: item.src, alt: item.alt, pav: item.pav});
  select(b); commit();
  return b;
}
function removeBlock(b) {
  blockLayer.removeLayer(b.ov); blockLayer.removeLayer(b.outline);
  blocks = blocks.filter(x => x !== b);
  if (sel === b) select(null); else updateAll();
  commit();
}
function duplicate(b) {
  const [W] = dims(b);
  addBlock({kind: b.kind, name: b.base, w: b.w, h: b.h, angle: b.angle, src: b.src, alt: b.alt, pav: b.pav},
           {lat: b.lat, lng: b.lng + (W + 1) / (R * Math.cos(b.lat * Math.PI / 180))});
}
