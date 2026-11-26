// ---------- Menu de ferramentas ----------
function openTool(t) {
  if (tool === t) { closePop(); return; }
  tool = t;
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.toggle('on', b.dataset.tool === t));
  document.querySelectorAll('#pop [data-panel]').forEach(p => { p.hidden = p.dataset.panel !== t; });
  $('pop').hidden = false;
  $('wheel-center').classList.add('act');
  if (t === 'biblioteca') renderLib();
  if (t === 'fundo') renderFundo();
  if (t === 'camadas') renderLayers();
  if (t === 'lotes') ltOpen();
  if (t === 'lote') loteResumo();
  if (t === 'orcamento') { renderOrc(); if (lot) terrCompute().then(renderOrc).catch(() => {}); }
  if (t === 'terreno') { marcaGuia('terreno'); renderTerrPanel(); if (lot) terrCompute().then(() => { renderTerrPanel(); renderMetrics(); }); }
  renderGuide();
  if (t === 'pincel') { map.dragging.disable(); $('map').classList.add('drawing'); if (sel) select(null); }
  else { map.dragging.enable(); $('map').classList.remove('drawing'); }
}
function closePop() {
  tool = null; $('pop').hidden = true; mPend = null; if (typeof CAM !== 'undefined') { CAM.pts = []; camPreview(); }
  map.dragging.enable(); $('map').classList.remove('drawing');
  document.querySelectorAll('[data-tool]').forEach(b => b.classList.remove('on'));
  $('wheel-center').classList.remove('act');
  renderGuide();
}
document.querySelectorAll('[data-tool]').forEach(b => { b.onclick = () => openTool(b.dataset.tool); });
