// ---------- Desfazer / refazer e salvamento automático ----------
const SAVE_KEY = 'implantacao.estudo.v1';
let pool = [], hist = [], fut = [], cur = null;
function srcRef(src) { let i = pool.indexOf(src); if (i < 0) { pool.push(src); i = pool.length - 1; } return i; }
function snapshot() {
  return JSON.stringify({lot: lot ? lot.ring : null, fronts: lot ? lot.fronts : null, recuo: $('recuo').value, recuoF: $('recuo-f').value,
    pin: pinAt, zone: lot ? lot.zone || null : null, zp,
    blocks: blocks.map(b => ({kind: b.kind, base: b.base, name: b.name, w: b.w, h: b.h, angle: b.angle, lat: b.lat, lng: b.lng, alt: b.alt, pav: b.pav, cota: b.cota,
                              srcI: b.src ? srcRef(b.src) : -1})),
    strokes: strokes.map(s => ({pts: s.pts, color: s.color, wM: s.wM, op: s.op, brush: s.brush})),
    caminhos: caminhos.map(c => ({tipo: c.tipo, w: c.w, pts: c.pts}))});
}
function autosave() { try { if (typeof opts !== 'undefined') opts[oi].s = cur; localStorage.setItem(SAVE_KEY, JSON.stringify({s: cur, pool, opts: typeof opts !== 'undefined' ? opts : null, oi: typeof oi !== 'undefined' ? oi : 0})); } catch (e) {} }
function syncUndo() { $('btn-undo').disabled = !hist.length; $('btn-redo').disabled = !fut.length; }
function commit() {
  const s = snapshot();
  if (s === cur) return;
  if (cur !== null) { hist.push(cur); if (hist.length > 80) hist.shift(); }
  cur = s; fut = []; autosave(); syncUndo();
}
function restore(s) {
  const d = JSON.parse(s);
  select(null);
  blocks.forEach(b => { blockLayer.removeLayer(b.ov); blockLayer.removeLayer(b.outline); });
  blocks = [];
  lot = d.lot ? {ring: d.lot, feat: polyFeat(d.lot), fronts: d.fronts || [0], zone: d.zone || null} : null;
  zp = {...ZP0, ...(d.zp || {})};
  $('recuo').value = d.recuo;
  $('recuo-f').value = d.recuoF ?? d.recuo;
  setPin(d.pin, true);
  d.blocks.forEach(o => { const {srcI, ...rest} = o; spawn({...rest, src: srcI >= 0 ? pool[srcI] : undefined}); });
  sketchLayer.clearLayers();
  strokes = (d.strokes || []).map(o => ({...o}));
  caminhos = (d.caminhos || []).map(o => ({...o})); drawCaminhos();
  strokes.forEach(drawStroke);
  refreshLot();
}
$('btn-undo').onclick = () => { if (!hist.length) return; fut.push(cur); cur = hist.pop(); restore(cur); autosave(); syncUndo(); };
$('btn-redo').onclick = () => { if (!fut.length) return; hist.push(cur); cur = fut.pop(); restore(cur); autosave(); syncUndo(); };
