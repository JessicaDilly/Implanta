// ---------- Giro com dois dedos no bloco selecionado ----------
const mc = map.getContainer();
let g2 = null;
const ang2 = t => Math.atan2(t[1].clientY - t[0].clientY, t[1].clientX - t[0].clientX);
mc.addEventListener('touchstart', e => {
  if (sel && e.touches.length === 2) {
    g2 = {a0: ang2(e.touches), ang0: sel.angle};
    map.touchZoom.disable(); map.dragging.disable(); e.preventDefault();
  }
}, {passive: false, capture: true});
mc.addEventListener('touchmove', e => {
  if (!g2 || e.touches.length !== 2) return;
  const d = (ang2(e.touches) - g2.a0) * 180 / Math.PI;
  sel.angle = ((Math.round(g2.ang0 - d) % 360) + 360) % 360;
  orient(sel); placeHandles(); updateAll(); syncCtx();
  e.preventDefault(); e.stopPropagation();
}, {passive: false, capture: true});
mc.addEventListener('touchend', e => {
  if (g2 && e.touches.length < 2) { g2 = null; map.touchZoom.enable(); map.dragging.enable(); commit(); }
}, {capture: true});
$('exp-kml').onclick = () => { if (!lot) { msg('Crie o lote antes de exportar.'); return; } baixar('implantacao.kml', kml(), 'application/vnd.google-earth.kml+xml'); };
$('exp-dxf').onclick = () => { if (!lot) { msg('Crie o lote antes de exportar.'); return; } baixar('implantacao.dxf', dxf(), 'application/dxf'); };
document.addEventListener('keydown', e => {
  if (!sel || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if (e.key === 'Delete' || e.key === 'Backspace') removeBlock(sel);
  if (e.key === 'Escape') select(null);
});

document.addEventListener('keydown', e => {
  if (/INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); (e.shiftKey ? $('btn-redo') : $('btn-undo')).click(); }
});
