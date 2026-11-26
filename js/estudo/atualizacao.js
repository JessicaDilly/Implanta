// ---------- Atualização e painel de resultados ----------
function updateAll() {
  const tot = {edif: 0, vaga: 0, quadra: 0};
  let fora = 0;
  blocks.forEach(b => {
    b.ring = rotRing(b.lat, b.lng, b.w, b.h, b.angle);
    b.ok = !TYPES[b.kind].fit || fits(b.ring);
    if (!b.ok) fora++;
    const hid = !vis[visKey(b.kind)];
    b.svg.style.display = hid ? 'none' : '';
    const st = hid ? {weight: 0, opacity: 0}
             : !b.ok ? {color: '#ff1744', weight: 3, opacity: 1, dashArray: null}
             : b === sel ? {color: bg === 'paper' ? '#1565c0' : '#ffffff', weight: 2, opacity: 1, dashArray: '6 5'} : {weight: 0, opacity: 0};
    b.outline.setLatLngs(ll(b.ring)); b.outline.setStyle(st);
    const s = TYPES[b.kind].sum; if (s) tot[s] += b.w * b.h;
  });
  renderMetrics();
  if (typeof solOn !== 'undefined' && solOn) drawSun();
  if (typeof terrRefresh === 'function') terrRefresh();
  if (typeof renderGuide === 'function') renderGuide();
  if (tool === 'lote') loteResumo();
  if (typeof orcRefresh === 'function') orcRefresh();
}
